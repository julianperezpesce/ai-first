export interface CodeContextPacket {
    symbol: {
        id: string;
        name: string;
        type: string;
        file: string;
        line?: number;
        export?: boolean;
    };
    sourceCode: string;
    relationships: {
        calls: string[];
        calledBy: string[];
        imports: string[];
        references: string[];
    };
    relatedSymbols: {
        id: string;
        name: string;
        type: string;
        file: string;
        line?: number;
    }[];
    summary: string;
}
/**
 * Generate context packet for a specific symbol
 */
export declare function generateContextPacket(symbolName: string, aiDir: string, rootDir: string): CodeContextPacket | null;
/**
 * Save context packet to file
 */
export declare function saveContextPacket(packet: CodeContextPacket, aiDir: string): string;
/**
 * List all available context packets
 */
export declare function listContextPackets(aiDir: string): string[];
/**
 * Load a context packet from file
 */
export declare function loadContextPacket(symbolId: string, aiDir: string): CodeContextPacket | null;
//# sourceMappingURL=contextPacket.d.ts.map