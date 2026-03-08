/**
 * Index result
 */
export interface IndexResult {
    success: boolean;
    dbPath: string;
    stats: {
        files: number;
        symbols: number;
        imports: number;
    };
    error?: string;
}
/**
 * Generate repository index
 */
export declare function generateIndex(rootDir: string, outputPath: string): Promise<IndexResult>;
/**
 * Example queries for AI agents
 */
export declare const EXAMPLE_QUERIES: {
    findFunctionsInFile: string;
    findSymbolDefinition: string;
    findImporters: string;
    findExports: string;
    findClasses: string;
    getFileDependencies: string;
    searchSymbols: string;
    languageStats: string;
};
//# sourceMappingURL=indexer.d.ts.map