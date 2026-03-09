import { Symbol } from "../analyzers/symbols.js";
export type RelationshipType = "calls" | "called_by" | "imports" | "references" | "instantiates" | "extends" | "implements" | "exports";
export interface SymbolRelationship {
    symbolId: string;
    targetId: string;
    type: RelationshipType;
}
export interface SymbolGraph {
    symbols: Symbol[];
    relationships: SymbolRelationship[];
    bySymbol: Record<string, SymbolRelationship[]>;
}
export interface SymbolReferences {
    [symbolId: string]: string[];
}
export interface FileIndex {
    [filePath: string]: {
        symbols: string[];
        module: string;
    };
}
export interface IndexCache {
    files: {
        [filePath: string]: {
            hash: string;
            mtime: number;
        };
    };
    lastIndexed: string;
}
/**
 * Generate symbol graph with extended relationships, reverse references, and file index
 */
export declare function generateSymbolGraph(rootDir: string, outputDir: string, incremental?: boolean): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Load symbol graph from file
 */
export declare function loadSymbolGraph(aiDir: string): SymbolGraph | null;
/**
 * Load reverse references
 */
export declare function loadSymbolReferences(aiDir: string): SymbolReferences | null;
/**
 * Load file index
 */
export declare function loadFileIndex(aiDir: string): FileIndex | null;
/**
 * Get context for a specific symbol
 */
export declare function getSymbolContext(symbolId: string, aiDir: string): SymbolRelationship[];
/**
 * Get reverse references for a symbol
 */
export declare function getSymbolReferrers(symbolId: string, aiDir: string): string[];
//# sourceMappingURL=symbolGraph.d.ts.map