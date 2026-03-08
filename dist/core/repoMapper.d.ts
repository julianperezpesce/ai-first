import { FileInfo } from "./repoScanner.js";
export interface RepoMapOptions {
    maxDepth?: number;
    includeExtensions?: boolean;
    sortBy?: "name" | "directory";
}
/**
 * Generate a repo map from scanned files
 */
export declare function generateRepoMap(files: FileInfo[], options?: RepoMapOptions): string;
/**
 * Generate a compact repo map (tree view)
 */
export declare function generateCompactRepoMap(files: FileInfo[]): string;
/**
 * Generate summary statistics
 */
export declare function generateSummary(files: FileInfo[]): string;
//# sourceMappingURL=repoMapper.d.ts.map