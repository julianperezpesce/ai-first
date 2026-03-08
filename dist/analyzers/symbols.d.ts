import { FileInfo } from "../core/repoScanner.js";
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
export declare function extractSymbols(files: FileInfo[]): SymbolsAnalysis;
/**
 * Generate symbols.json
 */
export declare function generateSymbolsJson(analysis: SymbolsAnalysis): string;
//# sourceMappingURL=symbols.d.ts.map