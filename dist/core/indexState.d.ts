export interface FileState {
    path: string;
    hash: string;
    mtime: number;
    size: number;
    indexedAt: string;
}
export interface IndexState {
    version: string;
    lastIndexed: string;
    totalFiles: number;
    files: Record<string, FileState>;
}
/**
 * Load index state from file
 */
export declare function loadIndexState(aiDir: string): IndexState | null;
/**
 * Save index state to file
 */
export declare function saveIndexState(aiDir: string, files: Map<string, FileState>): void;
/**
 * Compute file hash (MD5 for speed)
 */
export declare function computeFileHash(filePath: string): {
    hash: string;
    mtime: number;
    size: number;
} | null;
/**
 * Check if file needs re-indexing
 */
export declare function needsReindex(filePath: string, currentState: IndexState): boolean;
/**
 * Get list of files that need indexing
 */
export declare function getFilesToIndex(allFiles: string[], rootDir: string, currentState: IndexState | null): {
    toIndex: string[];
    unchanged: number;
    new: number;
    deleted: number;
};
/**
 * Create git-based change detector (optional enhancement)
 */
export declare function getChangedFilesGit(rootDir: string): Promise<Set<string>>;
//# sourceMappingURL=indexState.d.ts.map