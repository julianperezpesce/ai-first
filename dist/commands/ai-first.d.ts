export interface AIFirstOptions {
    rootDir?: string;
    outputDir?: string;
    excludePatterns?: string[];
    includeExtensions?: string[];
}
export interface AIFirstResult {
    success: boolean;
    filesCreated: string[];
    error?: string;
}
/**
 * Main function to run ai-first command
 */
export declare function runAIFirst(options?: AIFirstOptions): Promise<AIFirstResult>;
//# sourceMappingURL=ai-first.d.ts.map