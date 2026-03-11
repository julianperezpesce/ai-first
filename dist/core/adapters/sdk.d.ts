/**
 * Adapter SDK - Create custom adapters easily
 *
 * This module provides a developer-friendly API for creating
 * ecosystem adapters for AI-First.
 */
import { AnalysisAdapter, DetectionSignal, LayerRule } from './baseAdapter.js';
/**
 * Configuration for creating a new adapter
 */
export interface AdapterConfig {
    /** Unique adapter name */
    name: string;
    /** Human-readable display name */
    displayName: string;
    /** Detection signals - what files/directories indicate this adapter */
    detectionSignals?: DetectionSignal[];
    /** Feature root directories */
    featureRoots?: string[];
    /** Folders to ignore */
    ignoredFolders?: string[];
    /** Entrypoint patterns */
    entrypointPatterns?: string[];
    /** Layer rules for flow detection */
    layerRules?: LayerRule[];
    /** Supported file extensions */
    supportedExtensions?: string[];
    /** Flow entrypoint patterns */
    flowEntrypointPatterns?: string[];
    /** Patterns to exclude from flows */
    flowExcludePatterns?: string[];
}
/**
 * Default layer rules for common architectures
 */
export declare const DEFAULT_LAYER_RULES: LayerRule[];
/**
 * Default ignored folders
 */
export declare const DEFAULT_IGNORED_FOLDERS: string[];
/**
 * Create a new adapter with sensible defaults
 *
 * @example
 * ```typescript
 * import { createAdapter } from './adapters/sdk.js';
 *
 * export const myAdapter = createAdapter('laravel', {
 *   displayName: 'Laravel',
 *   detectionSignals: [
 *     { type: 'file', pattern: 'composer.json' },
 *     { type: 'file', pattern: 'artisan' }
 *   ],
 *   featureRoots: ['app/Http', 'app/Services', 'app/Models'],
 *   entrypointPatterns: ['Controller', 'Request', 'Command']
 * });
 * ```
 */
export declare function createAdapter(config: AdapterConfig): AnalysisAdapter;
/**
 * Create a file-based detection signal
 */
export declare function fileSignal(pattern: string): DetectionSignal;
/**
 * Create a directory-based detection signal
 */
export declare function directorySignal(pattern: string): DetectionSignal;
/**
 * Create a content-based detection signal
 */
export declare function contentSignal(pattern: string, contentPattern?: string): DetectionSignal;
/**
 * Create a layer rule
 */
export declare function layerRule(name: string, priority: number, patterns: string[]): LayerRule;
/**
 * Validate an adapter configuration
 */
export declare function validateAdapter(adapter: AnalysisAdapter): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=sdk.d.ts.map