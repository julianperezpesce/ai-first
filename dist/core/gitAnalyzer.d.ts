/**
 * Git Intelligence Analyzer
 *
 * Analyzes recent git activity to provide AI agents with context about
 * recently changed files, features, and flows.
 */
export interface GitCommit {
    hash: string;
    date: string;
    message: string;
    author: string;
    files: string[];
}
export interface RecentFile {
    path: string;
    commitCount: number;
    lastChanged: string;
}
export interface GitActivity {
    totalCommits: number;
    dateRange: {
        start: string;
        end: string;
    };
    files: Record<string, number>;
    features: Record<string, number>;
    flows: Record<string, number>;
}
export interface GitAnalyzerOptions {
    /** Number of commits to analyze (default: 50) */
    commitLimit?: number;
    /** Ignore commits older than N days (default: 30) */
    maxAgeDays?: number;
    /** Maximum number of files to track (default: 50) */
    maxFiles?: number;
}
/**
 * Check if a directory is a git repository
 */
export declare function detectGitRepository(rootDir: string): boolean;
/**
 * Get recent commits from git repository
 */
export declare function getRecentCommits(rootDir: string, limit?: number): GitCommit[];
/**
 * Extract changed files from commits
 */
export declare function extractChangedFiles(commits: GitCommit[]): RecentFile[];
/**
 * Get list of changed files
 */
export declare function getRecentFiles(rootDir: string): string[];
/**
 * Map changed files to features
 */
export declare function mapFilesToFeatures(rootDir: string, files: string[]): string[];
/**
 * Map changed files to flows
 */
export declare function mapFilesToFlows(rootDir: string, files: string[]): string[];
/**
 * Analyze git activity
 */
export declare function analyzeGitActivity(rootDir: string, options?: GitAnalyzerOptions): GitActivity | null;
/**
 * Generate git context files
 */
export declare function generateGitContext(rootDir: string, aiDir?: string): {
    recentFiles: string[];
    recentFeatures: string[];
    recentFlows: string[];
    activity: GitActivity | null;
};
export interface GitBlameLine {
    line: number;
    content: string;
    author: string;
    date: string;
    hash: string;
}
export interface GitBlameResult {
    filePath: string;
    lines: GitBlameLine[];
    authors: Map<string, number>;
}
export declare function getGitBlame(rootDir: string, filePath: string): GitBlameResult;
export declare function formatGitBlame(blameResult: GitBlameResult, format?: 'inline' | 'block'): string;
//# sourceMappingURL=gitAnalyzer.d.ts.map