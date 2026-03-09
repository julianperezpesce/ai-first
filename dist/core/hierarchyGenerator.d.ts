/**
 * Hierarchy result
 */
export interface HierarchyResult {
    success: boolean;
    outputPath: string;
    summary: RepoSummary;
    error?: string;
}
/**
 * Repository summary
 */
export interface RepoSummary {
    repo: string;
    folders: Record<string, string>;
    files: Record<string, string>;
}
/**
 * Generate hierarchical repository summary
 */
export declare function generateHierarchy(rootDir: string, outputPath?: string): Promise<HierarchyResult>;
//# sourceMappingURL=hierarchyGenerator.d.ts.map