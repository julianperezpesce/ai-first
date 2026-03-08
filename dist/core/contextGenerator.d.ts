export interface ContextGenerationOptions {
    model?: string;
    variant?: "low" | "medium" | "high";
    temperature?: number;
}
/**
 * Generate AI context using the configured model
 */
export declare function generateAIContext(repoMap: string, summary: string, options?: ContextGenerationOptions): Promise<string>;
export declare function generateTaskTemplate(): string;
export declare function generateCurrentFocus(): string;
//# sourceMappingURL=contextGenerator.d.ts.map