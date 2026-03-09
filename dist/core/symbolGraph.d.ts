import { Symbol } from "../analyzers/symbols.js";
export interface SymbolRelationship {
    symbolId: string;
    targetId: string;
    type: "calls" | "called_by" | "imports" | "references";
}
export interface SymbolGraph {
    symbols: Symbol[];
    relationships: SymbolRelationship[];
    bySymbol: Record<string, SymbolRelationship[]>;
}
/**
 * Generate symbol graph with bidirectional relationships
 */
export declare function generateSymbolGraph(rootDir: string, outputDir: string): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Load symbol graph from file
 */
export declare function loadSymbolGraph(aiDir: string): SymbolGraph | null;
/**
 * Get context for a specific symbol
 */
export declare function getSymbolContext(symbolId: string, aiDir: string): SymbolRelationship[];
//# sourceMappingURL=symbolGraph.d.ts.map