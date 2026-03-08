import { FileInfo } from "../core/repoScanner.js";
export interface ArchitectureAnalysis {
    pattern: string;
    layers: string[];
    modules: ModuleInfo[];
    description: string;
}
export interface ModuleInfo {
    name: string;
    path: string;
    responsibility: string;
    dependencies: string[];
}
/**
 * Detect architecture pattern and analyze structure
 */
export declare function analyzeArchitecture(files: FileInfo[], rootDir: string): ArchitectureAnalysis;
/**
 * Generate architecture.md content
 */
export declare function generateArchitectureFile(analysis: ArchitectureAnalysis): string;
//# sourceMappingURL=architecture.d.ts.map