export interface ContextModule {
    name: string;
    description: string;
    files: string[];
    symbols?: string[];
    entrypoints?: string[];
    dependencies?: string[];
}
export interface CCPContext {
    task: string;
    description: string;
    includes: string[];
}
/**
 * Generate context modules from repository analysis
 */
export declare function generateContextModules(rootDir: string, aiDir: string): ContextModule[];
/**
 * Create a new CCP (Context Control Pack)
 */
export declare function createCCP(rootDir: string, name: string, options?: {
    description?: string;
    include?: string[];
}): {
    success: boolean;
    path: string;
    error?: string;
};
/**
 * List all CCPs
 */
export declare function listCCPs(rootDir: string): string[];
/**
 * Get CCP details
 */
export declare function getCCP(rootDir: string, name: string): CCPContext | null;
//# sourceMappingURL=ccp.d.ts.map