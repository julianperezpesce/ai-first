import { FileInfo } from "../core/repoScanner.js";
export interface Dependency {
    source: string;
    target: string;
    type: "import" | "require" | "include" | "use" | "from";
}
export interface DependencyAnalysis {
    dependencies: Dependency[];
    byFile: Record<string, string[]>;
    modules: string[];
    circularDeps?: string[];
}
/**
 * Analyze dependencies between files
 */
export declare function analyzeDependencies(files: FileInfo[]): DependencyAnalysis;
/**
 * Generate dependencies.json
 */
export declare function generateDependenciesJson(analysis: DependencyAnalysis): string;
//# sourceMappingURL=dependencies.d.ts.map