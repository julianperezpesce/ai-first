export interface FileInfo {
    path: string;
    relativePath: string;
    name: string;
    extension: string;
}
export interface ScanResult {
    rootDir: string;
    files: FileInfo[];
    totalFiles: number;
    directoryStructure: Map<string, string[]>;
}
/**
 * Scan a repository and return its structure
 */
export declare function scanRepo(rootDir: string, excludePatterns?: string[], includeExtensions?: string[]): ScanResult;
/**
 * Get files grouped by extension
 */
export declare function groupByExtension(files: FileInfo[]): Map<string, FileInfo[]>;
/**
 * Get files grouped by top-level directory
 */
export declare function groupByDirectory(files: FileInfo[]): Map<string, FileInfo[]>;
//# sourceMappingURL=repoScanner.d.ts.map