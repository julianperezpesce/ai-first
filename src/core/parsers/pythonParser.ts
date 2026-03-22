export interface PythonSymbol {
  name: string;
  type: "class" | "function" | "method" | "variable" | "import";
  line: number;
  decorators?: string[];
  parameters?: {
    name: string;
    type?: string;
    default?: string;
  }[];
  inheritance?: string[];
  docstring?: string;
  isAsync?: boolean;
  isExported?: boolean;
}

export interface ParsedPythonFile {
  filePath: string;
  symbols: PythonSymbol[];
  imports: {
    module: string;
    names?: string[];
    alias?: string;
    isFromImport: boolean;
  }[];
}

export class PythonParser {
  parseFile(filePath: string, sourceText: string): ParsedPythonFile {
    const lines = sourceText.split("\n");
    const symbols: PythonSymbol[] = [];
    const imports: ParsedPythonFile["imports"] = [];

    let currentClass: PythonSymbol | null = null;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();
      const lineNumber = i + 1;

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        i++;
        continue;
      }

      // Parse imports
      if (trimmedLine.startsWith("import ") || trimmedLine.startsWith("from ")) {
        const importInfo = this.parseImport(trimmedLine);
        if (importInfo) {
          imports.push(importInfo);
        }
        i++;
        continue;
      }

      // Check for decorators
      const decorators: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith("@")) {
        decorators.push(lines[j].trim().substring(1).split("(")[0]);
        j++;
      }

      if (decorators.length > 0) {
        i = j;
        const nextLine = lines[i]?.trim() || "";

        // Class with decorators
        if (nextLine.startsWith("class ")) {
          const classSymbol = this.parseClass(nextLine, lineNumber, decorators, lines, i);
          if (classSymbol) {
            symbols.push(classSymbol);
            currentClass = classSymbol;
          }
          i = this.findClassEnd(lines, i);
          continue;
        }

        // Function with decorators
        if (nextLine.startsWith("def ") || nextLine.startsWith("async def ")) {
          const funcSymbol = this.parseFunction(nextLine, lineNumber, decorators);
          if (funcSymbol) {
            if (currentClass && this.isMethodOfClass(funcSymbol.name, lines, i, currentClass)) {
              funcSymbol.type = "method";
            }
            symbols.push(funcSymbol);
          }
        }

        i++;
        continue;
      }

      // Parse class
      if (trimmedLine.startsWith("class ")) {
        const classSymbol = this.parseClass(trimmedLine, lineNumber, [], lines, i);
        if (classSymbol) {
          symbols.push(classSymbol);
          currentClass = classSymbol;
        }
        i = this.findClassEnd(lines, i);
        continue;
      }

      // Parse function
      if (trimmedLine.startsWith("def ") || trimmedLine.startsWith("async def ")) {
        const funcSymbol = this.parseFunction(trimmedLine, lineNumber, []);
        if (funcSymbol) {
          if (currentClass && this.isMethodOfClass(funcSymbol.name, lines, i, currentClass)) {
            funcSymbol.type = "method";
          }
          symbols.push(funcSymbol);
        }
        i++;
        continue;
      }

      // Detect class end by indentation
      if (currentClass && !line.startsWith(" ") && !line.startsWith("\t") && trimmedLine) {
        currentClass = null;
      }

      i++;
    }

    return {
      filePath,
      symbols,
      imports,
    };
  }

  private parseImport(line: string): ParsedPythonFile["imports"][0] | null {
    // from module import name1, name2
    const fromMatch = line.match(/from\s+(\S+)\s+import\s+(.+)/);
    if (fromMatch) {
      const module = fromMatch[1];
      const namesPart = fromMatch[2];
      const names = namesPart.split(",").map(n => n.trim().split(" ")[0]);
      return { module, names, isFromImport: true };
    }

    // import module or import module as alias
    const importMatch = line.match(/import\s+(.+)/);
    if (importMatch) {
      const modules = importMatch[1].split(",").map(m => {
        const parts = m.trim().split(/\s+as\s+/);
        return { module: parts[0], alias: parts[1] };
      });
      return { module: modules[0].module, alias: modules[0].alias, isFromImport: false };
    }

    return null;
  }

  private parseClass(
    line: string,
    lineNumber: number,
    decorators: string[],
    lines: string[],
    startIndex: number
  ): PythonSymbol | null {
    const match = line.match(/class\s+(\w+)(?:\(([^)]+)\))?/);
    if (!match) return null;

    const name = match[1];
    const inheritance = match[2] ? match[2].split(",").map(s => s.trim()) : [];

    // Extract docstring
    const docstring = this.extractDocstring(lines, startIndex);

    return {
      name,
      type: "class",
      line: lineNumber,
      decorators: decorators.length > 0 ? decorators : undefined,
      inheritance: inheritance.length > 0 ? inheritance : undefined,
      docstring,
      isExported: true,
    };
  }

  private parseFunction(
    line: string,
    lineNumber: number,
    decorators: string[]
  ): PythonSymbol | null {
    const isAsync = line.startsWith("async ");
    const defKeyword = isAsync ? "async def" : "def";
    const match = line.match(new RegExp(`${defKeyword}\\s+(\\w+)\\s*\\(([^)]*)\\)`));

    if (!match) return null;

    const name = match[1];
    const paramsStr = match[2];
    const parameters = this.parseParameters(paramsStr);

    return {
      name,
      type: "function",
      line: lineNumber,
      decorators: decorators.length > 0 ? decorators : undefined,
      parameters: parameters.length > 0 ? parameters : [],
      isAsync,
      isExported: true,
    };
  }

  private parseParameters(paramsStr: string): { name: string; type?: string; default?: string }[] {
    if (!paramsStr.trim()) return [];

    return paramsStr.split(",").map(param => {
      const trimmed = param.trim();
      if (!trimmed || trimmed === "self" || trimmed === "cls") return null;

      // Handle type hints and defaults
      const parts = trimmed.split("=");
      const nameAndType = parts[0].trim();
      const defaultValue = parts[1]?.trim();

      const typeMatch = nameAndType.match(/(.+):\s*(.+)/);
      if (typeMatch) {
        return {
          name: typeMatch[1].trim(),
          type: typeMatch[2].trim(),
          default: defaultValue,
        };
      }

      return {
        name: nameAndType,
        default: defaultValue,
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }

  private extractDocstring(lines: string[], startIndex: number): string | undefined {
    // Look for docstring in next few lines
    for (let i = startIndex + 1; i < Math.min(startIndex + 5, lines.length); i++) {
      const line = lines[i].trim();
      if (line.startsWith('"""') || line.startsWith("'''")) {
        const quote = line.startsWith('"""') ? '"""' : "'''";
        if (line.endsWith(quote) && line.length > 6) {
          return line.slice(3, -3);
        }
        // Multi-line docstring
        let docstring = line.slice(3);
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine.includes(quote)) {
            docstring += "\n" + nextLine.slice(0, nextLine.indexOf(quote));
            return docstring.trim();
          }
          docstring += "\n" + nextLine;
        }
      }
    }
    return undefined;
  }

  private findClassEnd(lines: string[], startIndex: number): number {
    const baseIndent = lines[startIndex].match(/^(\s*)/)?.[1].length || 0;
    let i = startIndex + 1;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        i++;
        continue;
      }

      const indent = line.match(/^(\s*)/)?.[1].length || 0;

      // Check if we've exited the class (less or equal indentation)
      if (indent <= baseIndent && trimmed) {
        // Check if it's a new class or function at same level
        if (trimmed.startsWith("class ") || trimmed.startsWith("def ") || trimmed.startsWith("async def ") || trimmed.startsWith("@")) {
          return i;
        }
      }

      i++;
    }

    return i;
  }

  private isMethodOfClass(funcName: string, lines: string[], funcIndex: number, classSymbol: PythonSymbol): boolean {
    // Check if function is indented within the class
    const classLineIndex = classSymbol.line - 1;
    const classIndent = lines[classLineIndex].match(/^(\s*)/)?.[1].length || 0;
    const funcIndent = lines[funcIndex].match(/^(\s*)/)?.[1].length || 0;

    return funcIndent > classIndent;
  }
}

export const pythonParser = new PythonParser();
