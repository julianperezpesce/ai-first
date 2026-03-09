export type OutputFormat = "json" | "markdown" | "text";
export interface CodeContextPacket {
    symbol: {
        id: string;
        name: string;
        type: string;
        file: string;
        line?: number;
        export?: boolean;
        module?: string;
    };
    snippet: string;
    fullSource?: string;
    relationships: {
        calls: string[];
        calledBy: string[];
        imports: string[];
        references: string[];
        instantiates?: string[];
        extends?: string[];
        implements?: string[];
        exports?: string[];
    };
    relatedSymbols: {
        id: string;
        name: string;
        type: string;
        file: string;
        line?: number;
        distance: number;
    }[];
    callers: string[];
    module: string;
    file: string;
    fileNeighbors: {
        file: string;
        symbols: string[];
        relationship: string;
    }[];
    summary: string;
    relevanceScore?: number;
}
/**
 * Generate context packet for a specific symbol with depth and ranking
 */
export declare function generateContextPacket(symbolName: string, aiDir: string, rootDir: string, options?: {
    depth?: number;
    format?: OutputFormat;
    maxSymbols?: number;
}): CodeContextPacket | null;
/**
 * Save context packet to file
 */
export declare function saveContextPacket(packet: CodeContextPacket, aiDir: string, format?: OutputFormat): string;
/**
 * List all available context packets
 */
export declare function listContextPackets(aiDir: string): string[];
/**
 * Load a context packet from file
 */
export declare function loadContextPacket(symbolId: string, aiDir: string): CodeContextPacket | null;
//# sourceMappingURL=contextPacket.d.ts.map