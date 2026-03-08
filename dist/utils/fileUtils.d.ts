/**
 * Default patterns to exclude from scanning
 */
export declare const DEFAULT_EXCLUDE_PATTERNS: string[];
/**
 * File extensions to include in scanning
 */
export declare const DEFAULT_INCLUDE_EXTENSIONS: string[];
/**
 * Get all files in a directory recursively
 */
export declare function getAllFiles(dir: string, excludePatterns?: string[], includeExtensions?: string[]): string[];
/**
 * Ensure a directory exists, create if it doesn't
 */
export declare function ensureDir(dirPath: string): void;
/**
 * Write content to a file
 */
export declare function writeFile(filePath: string, content: string): void;
/**
 * Read file content
 */
export declare function readFile(filePath: string): string;
/**
 * Get relative path from base directory
 */
export declare function getRelativePath(basePath: string, filePath: string): string;
//# sourceMappingURL=fileUtils.d.ts.map