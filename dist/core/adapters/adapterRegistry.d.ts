import { AnalysisAdapter } from "./baseAdapter.js";
/**
 * Registry of all available adapters
 */
export declare const ADAPTERS: AnalysisAdapter[];
/**
 * Adapter detection result
 */
export interface AdapterDetectionResult {
    adapter: AnalysisAdapter;
    confidence: number;
    matchedSignals: string[];
}
/**
 * Detect the appropriate adapter for a project
 *
 * @param rootDir - Project root directory
 * @returns The best matching adapter
 */
export declare function detectAdapter(rootDir: string): AnalysisAdapter;
/**
 * Detect all matching adapters with confidence scores
 *
 * @param rootDir - Project root directory
 * @returns Array of matching adapters sorted by confidence
 */
export declare function detectAllAdapters(rootDir: string): AdapterDetectionResult[];
/**
 * Get adapter by name
 */
export declare function getAdapter(name: string): AnalysisAdapter | undefined;
/**
 * List all available adapters
 */
export declare function listAdapters(): {
    name: string;
    displayName: string;
}[];
//# sourceMappingURL=adapterRegistry.d.ts.map