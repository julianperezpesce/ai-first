/**
 * Analysis Adapter Interface
 *
 * Defines the contract for language/framework-specific adapters
 * that customize feature and flow detection.
 */
export interface AnalysisAdapter {
    /** Unique identifier for the adapter */
    name: string;
    /** Human-readable display name */
    displayName: string;
    /** File/directory markers that indicate this adapter should be used */
    detectionSignals: DetectionSignal[];
    /** Root directories to scan for features */
    featureRoots: string[];
    /** Folders to ignore when detecting features */
    ignoredFolders: string[];
    /** File name patterns that indicate entrypoints */
    entrypointPatterns: string[];
    /** Layer definitions for flow detection */
    layerRules: LayerRule[];
    /** Additional file extensions to include */
    supportedExtensions: string[];
    /** Patterns for flow entrypoints */
    flowEntrypointPatterns: string[];
    /** Patterns to exclude from flows */
    flowExcludePatterns: string[];
}
export interface DetectionSignal {
    /** Type of signal */
    type: 'file' | 'directory' | 'content';
    /** Pattern to match */
    pattern: string;
    /** Optional: content to match inside file */
    contentPattern?: string;
}
export interface LayerRule {
    /** Layer name */
    name: string;
    /** Priority (lower = earlier in flow) */
    priority: number;
    /** Patterns that identify this layer */
    patterns: string[];
}
/**
 * Default adapter configuration
 */
export declare const DEFAULT_ADAPTER: AnalysisAdapter;
//# sourceMappingURL=baseAdapter.d.ts.map