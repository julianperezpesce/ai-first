export interface Module {
    name: string;
    paths: string[];
}
export interface Dependency {
    from: string;
    to: string;
}
export interface ModuleGraph {
    modules: Module[];
    dependencies: Dependency[];
}
/**
 * Generate module dependency graph based on imports
 */
export declare function generateModuleGraph(rootDir: string, outputDir: string): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Load module graph from file
 */
export declare function loadModuleGraph(aiDir: string): ModuleGraph | null;
//# sourceMappingURL=moduleGraph.d.ts.map