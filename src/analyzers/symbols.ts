import { FileInfo } from "../core/repoScanner.js";
import { readFile } from "../utils/fileUtils.js";

export interface Symbol {
  name: string;
  type: "function" | "class" | "interface" | "type" | "const" | "enum" | "module" | "export";
  file: string;
  line?: number;
  export?: boolean;
}

export interface SymbolsAnalysis {
  symbols: Symbol[];
  byFile: Record<string, Symbol[]>;
  byType: Record<string, Symbol[]>;
}

/**
 * Extract symbols from source files
 */
export function extractSymbols(files: FileInfo[]): SymbolsAnalysis {
  const symbols: Symbol[] = [];
  const byFile: Record<string, Symbol[]> = {};

  for (const file of files) {
    const fileSymbols = parseFileForSymbols(file);
    symbols.push(...fileSymbols);
    
    if (fileSymbols.length > 0) {
      byFile[file.relativePath] = fileSymbols;
    }
  }

  const byType: Record<string, Symbol[]> = {};
  for (const sym of symbols) {
    if (!byType[sym.type]) byType[sym.type] = [];
    byType[sym.type].push(sym);
  }

  return { symbols, byFile, byType };
}

/**
 * Parse a single file for symbols
 */
function parseFileForSymbols(file: FileInfo): Symbol[] {
  const symbols: Symbol[] = [];
  
  try {
    const content = readFile(file.path);
    const lines = content.split("\n");
    
    // Determine parser based on extension
    if (file.extension === "ts" || file.extension === "tsx" || file.extension === "js" || file.extension === "jsx") {
      parseJavaScriptTypeScript(file, content, lines, symbols);
    } else if (file.extension === "py") {
      parsePython(file, content, lines, symbols);
    } else if (file.extension === "go") {
      parseGo(file, content, lines, symbols);
    } else if (file.extension === "rs") {
      parseRust(file, content, lines, symbols);
    } else if (file.extension === "java") {
      parseJava(file, content, lines, symbols);
    } else if (file.extension === "cs") {
      parseCSharp(file, content, lines, symbols);
    }
  } catch {}

  return symbols;
}

/**
 * Parse JavaScript/TypeScript files
 */
function parseJavaScriptTypeScript(file: FileInfo, content: string, lines: string[], symbols: Symbol[]): void {
  const patterns = [
    // Functions: function name() or const name = function
    { regex: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()/, type: "function" as const },
    // Arrow functions: const name = () =>
    { regex: /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/, type: "function" as const },
    // Classes: class Name
    { regex: /class\s+(\w+)/, type: "class" as const },
    // Interfaces: interface Name
    { regex: /interface\s+(\w+)/, type: "interface" as const },
    // Types: type Name =
    { regex: /type\s+(\w+)/, type: "type" as const },
    // Enums: enum Name
    { regex: /enum\s+(\w+)/, type: "enum" as const },
    // Constants: export const Name or const Name =
    { regex: /(?:export\s+)?(?:const|let)\s+(\w+)/, type: "const" as const },
    // Modules: export module Name
    { regex: /export\s+module\s+(\w+)/, type: "module" as const },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    for (const p of patterns) {
      const match = line.match(p.regex);
      if (match) {
        const name = match[1] || match[2] || match[3];
        if (name && !name.startsWith("_") && name.length > 1) {
          symbols.push({
            name,
            type: p.type,
            file: file.relativePath,
            line: i + 1,
            export: line.startsWith("export"),
          });
        }
      }
    }
  }
}

/**
 * Parse Python files
 */
function parsePython(file: FileInfo, content: string, lines: string[], symbols: Symbol[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Classes: class Name:
    const classMatch = line.match(/^class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        type: "class",
        file: file.relativePath,
        line: i + 1,
        export: line.startsWith("class") && !line.startsWith("class _"),
      });
      continue;
    }

    // Functions: def name(
    const funcMatch = line.match(/^def\s+(\w+)/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        type: "function",
        file: file.relativePath,
        line: i + 1,
        export: line.startsWith("def"),
      });
      continue;
    }

    // Constants: NAME = or @constant
    const constMatch = line.match(/^([A-Z][A-Z0-9_]*)\s*=/);
    if (constMatch) {
      symbols.push({
        name: constMatch[1],
        type: "const",
        file: file.relativePath,
        line: i + 1,
      });
    }
  }
}

/**
 * Parse Go files
 */
function parseGo(file: FileInfo, content: string, lines: string[], symbols: Symbol[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Functions: func Name(
    const funcMatch = line.match(/^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)/);
    if (funcMatch && funcMatch[1] !== "init") {
      symbols.push({
        name: funcMatch[1],
        type: "function",
        file: file.relativePath,
        line: i + 1,
        export: line.startsWith("func") && !line.startsWith("func (") && /func\s+[A-Z]/.test(line),
      });
    }

    // Types: type Name
    const typeMatch = line.match(/^type\s+(\w+)/);
    if (typeMatch) {
      symbols.push({
        name: typeMatch[1],
        type: "type",
        file: file.relativePath,
        line: i + 1,
      });
    }

    // Constants: const Name
    const constMatch = line.match(/^const\s+(?:\(\s*)?(\w+)/);
    if (constMatch) {
      symbols.push({
        name: constMatch[1],
        type: "const",
        file: file.relativePath,
        line: i + 1,
      });
    }
  }
}

/**
 * Parse Rust files
 */
function parseRust(file: FileInfo, content: string, lines: string[], symbols: Symbol[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Functions: fn name(
    const funcMatch = line.match(/^pub\s+fn\s+(\w+)/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        type: "function",
        file: file.relativePath,
        line: i + 1,
        export: line.startsWith("pub"),
      });
    }

    // Structs: struct Name
    const structMatch = line.match(/^pub\s+struct\s+(\w+)/);
    if (structMatch) {
      symbols.push({
        name: structMatch[1],
        type: "class",
        file: file.relativePath,
        line: i + 1,
        export: true,
      });
    }

    // Enums: enum Name
    const enumMatch = line.match(/^pub\s+enum\s+(\w+)/);
    if (enumMatch) {
      symbols.push({
        name: enumMatch[1],
        type: "enum",
        file: file.relativePath,
        line: i + 1,
        export: true,
      });
    }

    // Constants: const NAME
    const constMatch = line.match(/^pub\s+const\s+(\w+)/);
    if (constMatch) {
      symbols.push({
        name: constMatch[1],
        type: "const",
        file: file.relativePath,
        line: i + 1,
        export: true,
      });
    }
  }
}

/**
 * Parse Java files
 */
function parseJava(file: FileInfo, content: string, lines: string[], symbols: Symbol[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Classes: public class Name
    const classMatch = line.match(/^(?:public\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        type: "class",
        file: file.relativePath,
        line: i + 1,
      });
    }

    // Interfaces: public interface Name
    const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
    if (interfaceMatch) {
      symbols.push({
        name: interfaceMatch[1],
        type: "interface",
        file: file.relativePath,
        line: i + 1,
      });
    }

    // Methods: public Type name(
    const methodMatch = line.match(/^(?:public|private|protected)\s+(?:static\s+)?(?:\w+)\s+(\w+)\s*\(/);
    if (methodMatch && methodMatch[1] !== "if" && methodMatch[1] !== "for") {
      symbols.push({
        name: methodMatch[1],
        type: "function",
        file: file.relativePath,
        line: i + 1,
      });
    }
  }
}

/**
 * Parse C# files
 */
function parseCSharp(file: FileInfo, content: string, lines: string[], symbols: Symbol[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Classes: public class Name
    const classMatch = line.match(/^(?:public\s+)?(?:partial\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        type: "class",
        file: file.relativePath,
        line: i + 1,
      });
    }

    // Interfaces: public interface Name
    const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
    if (interfaceMatch) {
      symbols.push({
        name: interfaceMatch[1],
        type: "interface",
        file: file.relativePath,
        line: i + 1,
      });
    }

    // Methods: public Type Name(
    const methodMatch = line.match(/^(?:public|private|protected|internal)\s+(?:static\s+)?(?:async\s+)?(?:\w+)\s+(\w+)\s*\(/);
    if (methodMatch) {
      symbols.push({
        name: methodMatch[1],
        type: "function",
        file: file.relativePath,
        line: i + 1,
      });
    }
  }
}

/**
 * Generate symbols.json
 */
export function generateSymbolsJson(analysis: SymbolsAnalysis): string {
  const output = {
    total: analysis.symbols.length,
    byType: analysis.byType,
    byFile: analysis.byFile,
    exported: analysis.symbols.filter(s => s.export),
  };
  return JSON.stringify(output, null, 2);
}
