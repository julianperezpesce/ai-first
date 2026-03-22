import { typescriptParser, ParsedFile as ParsedTSFile } from "./typescriptParser.js";
import { pythonParser, ParsedPythonFile } from "./pythonParser.js";
import type { Symbol as CodeSymbol } from "../../analyzers/symbols.js";

export type ParsedResult = ParsedTSFile | ParsedPythonFile;

export interface BaseParser {
  parseFile(filePath: string, sourceText: string): ParsedResult;
}

export class ParserRegistry {
  private parsers: Map<string, BaseParser> = new Map();

  constructor() {
    this.registerParsers();
  }

  private registerParsers(): void {
    this.parsers.set(".ts", typescriptParser);
    this.parsers.set(".tsx", typescriptParser);
    this.parsers.set(".js", typescriptParser);
    this.parsers.set(".jsx", typescriptParser);
    this.parsers.set(".mjs", typescriptParser);
    this.parsers.set(".cjs", typescriptParser);

    this.parsers.set(".py", pythonParser);
    this.parsers.set(".pyw", pythonParser);
  }

  getParser(extension: string): BaseParser | undefined {
    return this.parsers.get(extension.toLowerCase());
  }

  hasParser(extension: string): boolean {
    return this.parsers.has(extension.toLowerCase());
  }

  getSupportedExtensions(): string[] {
    return Array.from(this.parsers.keys());
  }

  parse(filePath: string, sourceText: string, extension?: string): ParsedResult | null {
    const ext = extension || this.getExtension(filePath);
    const parser = this.getParser(ext);

    if (!parser) {
      return null;
    }

    try {
      return parser.parseFile(filePath, sourceText);
    } catch {
      return null;
    }
  }

  private getExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf(".");
    if (lastDot === -1) return "";
    return filePath.slice(lastDot);
  }
}

export const parserRegistry = new ParserRegistry();

export function createSymbolFromParsed(
  parsed: ParsedResult,
  filePath: string
): CodeSymbol[] {
  const symbols: CodeSymbol[] = [];

  if ("symbols" in parsed) {
    for (const sym of parsed.symbols) {
      symbols.push({
        id: `${filePath}#${sym.name}`,
        name: sym.name,
        type: sym.type as CodeSymbol['type'],
        file: filePath,
        line: sym.line,
        export: sym.isExported ?? false,
      });

      if ('members' in sym && sym.members) {
        for (const member of sym.members) {
          symbols.push({
            id: `${filePath}#${sym.name}.${member.name}`,
            name: `${sym.name}.${member.name}`,
            type: member.type as CodeSymbol['type'],
            file: filePath,
            line: member.line,
            export: false,
          });
        }
      }
    }
  }

  return symbols;
}
