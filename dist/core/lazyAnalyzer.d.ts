export interface MinimalIndex {
    repoMap: string;
    languages: string[];
    frameworks: string[];
    entrypoints: string[];
    generatedAt: string;
}
export interface LazyIndexState {
    stage1Complete: boolean;
    stage2Complete: boolean;
    featuresExpanded: string[];
    flowsExpanded: string[];
    lastUpdated: string;
}
/**
 * Build minimal index (Stage 1) - fast startup
 * Generates only essential metadata needed for basic context
 */
export declare function buildMinimalIndex(rootDir: string, aiDir: string): MinimalIndex;
/**
 * Expand context for a specific feature (Stage 2 - on demand)
 */
export declare function expandFeatureContext(rootDir: string, aiDir: string, featureName: string): {
    success: boolean;
    files?: string[];
    error?: string;
};
/**
 * Expand context for a specific flow (Stage 2 - on demand)
 */
export declare function expandFlowContext(rootDir: string, aiDir: string, flowName: string): {
    success: boolean;
    files?: string[];
    error?: string;
};
/**
 * Expand full context (Stage 2) - when needed
 */
export declare function expandFullContext(rootDir: string, aiDir: string): {
    symbols: number;
    dependencies: number;
    features: number;
    flows: number;
};
/**
 * Get lazy index state
 */
export declare function getLazyIndexState(aiDir: string): LazyIndexState | null;
/**
 * Check if minimal index exists
 */
export declare function hasMinimalIndex(aiDir: string): boolean;
/**
 * Load minimal index
 */
export declare function loadMinimalIndex(aiDir: string): MinimalIndex | null;
//# sourceMappingURL=lazyAnalyzer.d.ts.map