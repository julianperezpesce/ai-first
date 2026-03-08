/**
 * AI Context Generator Result
 */
export interface AIContextResult {
    success: boolean;
    outputDir: string;
    filesCreated: string[];
    stats: {
        files: number;
        folders: number;
        symbols: number;
        dependencies: number;
    };
    error?: string;
}
/**
 * Generate AI context for the repository
 */
export declare function generateAIContext(rootDir: string, outputDir?: string): Promise<AIContextResult>;
//# sourceMappingURL=aiContextGenerator.d.ts.map