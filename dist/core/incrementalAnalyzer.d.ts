/**
 * Incremental Analyzer
 *
 * Performs incremental updates to repository intelligence when files change,
 * without requiring a full re-analysis.
 */
export interface ChangedFile {
    path: string;
    status: "added" | "modified" | "deleted";
    hash?: string;
}
export interface IncrementalUpdateResult {
    changedFiles: ChangedFile[];
    updatedSymbols: number;
    updatedDependencies: number;
    updatedFeatures: string[];
    updatedFlows: string[];
    graphUpdated: boolean;
    errors: string[];
}
export declare function detectChangedFiles(rootDir: string, useGit?: boolean): ChangedFile[];
export declare function updateSymbols(rootDir: string, changedFiles: ChangedFile[], aiDir: string): number;
export declare function updateDependencies(rootDir: string, changedFiles: ChangedFile[], aiDir: string): number;
export declare function updateFeatures(rootDir: string, changedFiles: ChangedFile[], aiDir: string): string[];
export declare function updateFlows(rootDir: string, changedFiles: ChangedFile[], aiDir: string): string[];
export declare function updateKnowledgeGraph(rootDir: string, aiDir: string): boolean;
export declare function runIncrementalUpdate(rootDir: string, aiDir?: string): IncrementalUpdateResult;
//# sourceMappingURL=incrementalAnalyzer.d.ts.map