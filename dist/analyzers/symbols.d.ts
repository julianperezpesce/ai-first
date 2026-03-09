import { FileInfo } from "../core/repoScanner.js";
export interface Symbol {
    id: string;
    name: string;
    type: "function" | "class" | "interface" | "type" | "const" | "enum" | "module" | "export";
    file: string;
    line?: number;
    export?: boolean;
}
export interface SymbolsAnalysis {
    symbols: Symbol[];
    byId: Record<string, Symbol>;
    byFile: Record<string, Symbol[]>;
    byType: Record<string, Symbol[]>;
}
/**
 * Generate unique symbol ID from file path and symbol name
 * Format: filePath#symbolName (e.g., src/auth/login.ts#loginUser)
 */
export declare function generateSymbolId(filePath: string, symbolName: string): string;
/**
 * Extract symbols from source files
 */
export declare function extractSymbols(files: FileInfo[]): SymbolsAnalysis;
/**
 * Generate symbols.json with indexed symbols
 */
export declare function generateSymbolsJson(analysis: SymbolsAnalysis): string;
//# sourceMappingURL=symbols.d.ts.map