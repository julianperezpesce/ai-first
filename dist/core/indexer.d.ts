export interface IndexResult {
    success: boolean;
    dbPath: string;
    stats: {
        files: number;
        symbols: number;
        imports: number;
    };
    error?: string;
}
export interface WatchOptions {
    rootDir: string;
    outputPath: string;
    debounceMs?: number;
    ignored?: string[];
}
/**
 * IncrementalIndexer class for watch mode
 */
export declare class IncrementalIndexer {
    private db;
    private dbPath;
    private rootDir;
    private fileHashes;
    private watcher;
    private debounceTimers;
    private debounceMs;
    private stats;
    constructor(rootDir: string, outputPath: string, debounceMs?: number);
    /**
     * Initialize or load existing database
     */
    initialize(): Promise<void>;
    /**
     * Create database schema
     */
    private createSchema;
    private createIndexes;
    /**
     * Load existing file hashes from database
     */
    private loadFileHashes;
    /**
     * Compute file hash
     */
    private computeHash;
    /**
     * Check if file has changed
     */
    private hasFileChanged;
    /**
     * Update file hash in database
     */
    private updateFileHash;
    /**
     * Get relative path
     */
    private getRelativePath;
    /**
     * Process a single file (add or update)
     */
    processFile(filePath: string): Promise<void>;
    /**
     * Remove a file from index
     */
    removeFile(filePath: string): Promise<void>;
    /**
     * Save database to disk
     */
    save(): void;
    /**
     * Start watching for file changes
     */
    watch(ignoredPatterns?: string[]): Promise<void>;
    /**
     * Handle file events with debouncing
     */
    private handleFileEvent;
    /**
     * Stop watching
     */
    stop(): void;
    /**
     * Get current stats
     */
    getStats(): {
        files: number;
        symbols: number;
        imports: number;
    };
}
/**
 * Full index generation (for initial build)
 */
export declare function generateIndex(rootDir: string, outputPath: string): Promise<IndexResult>;
export declare const EXAMPLE_QUERIES: {
    findFunctionsInFile: string;
    findSymbolDefinition: string;
    findImporters: string;
    findExports: string;
    findClasses: string;
    searchSymbols: string;
    languageStats: string;
};
//# sourceMappingURL=indexer.d.ts.map