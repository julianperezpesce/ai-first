/**
 * Adapter SDK - Create custom adapters easily
 *
 * This module provides a developer-friendly API for creating
 * ecosystem adapters for AI-First.
 */
/**
 * Default layer rules for common architectures
 */
export const DEFAULT_LAYER_RULES = [
    { name: 'api', priority: 1, patterns: ['controller', 'handler', 'route', 'router', 'api', 'endpoint'] },
    { name: 'service', priority: 2, patterns: ['service', 'services', 'usecase', 'interactor'] },
    { name: 'data', priority: 3, patterns: ['repository', 'repo', 'dal', 'dao', 'data', 'persistence'] },
    { name: 'domain', priority: 4, patterns: ['model', 'entity', 'schema', 'domain'] },
    { name: 'util', priority: 5, patterns: ['util', 'helper', 'lib', 'common'] }
];
/**
 * Default ignored folders
 */
export const DEFAULT_IGNORED_FOLDERS = [
    'utils', 'helpers', 'types', 'interfaces', 'constants', 'config',
    'dto', 'models', 'common', 'shared', 'node_modules', '.git',
    'dist', 'build', 'coverage', '__tests__', 'test', 'tests',
    '.next', '.nuxt', '.vite'
];
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
export function createAdapter(config) {
    return {
        name: config.name,
        displayName: config.displayName,
        detectionSignals: config.detectionSignals || [],
        featureRoots: config.featureRoots || ['src', 'app', 'lib'],
        ignoredFolders: config.ignoredFolders || DEFAULT_IGNORED_FOLDERS,
        entrypointPatterns: config.entrypointPatterns || ['controller', 'service', 'handler'],
        layerRules: config.layerRules || DEFAULT_LAYER_RULES,
        supportedExtensions: config.supportedExtensions || ['.ts', '.js', '.php', '.rb', '.py'],
        flowEntrypointPatterns: config.flowEntrypointPatterns || ['controller', 'route', 'handler', 'command'],
        flowExcludePatterns: config.flowExcludePatterns || [
            'repository', 'model', 'utils', 'helper', 'test', 'spec', 'config'
        ]
    };
}
/**
 * Create a file-based detection signal
 */
export function fileSignal(pattern) {
    return { type: 'file', pattern };
}
/**
 * Create a directory-based detection signal
 */
export function directorySignal(pattern) {
    return { type: 'directory', pattern };
}
/**
 * Create a content-based detection signal
 */
export function contentSignal(pattern, contentPattern) {
    return { type: 'content', pattern, contentPattern };
}
/**
 * Create a layer rule
 */
export function layerRule(name, priority, patterns) {
    return { name, priority, patterns };
}
/**
 * Validate an adapter configuration
 */
export function validateAdapter(adapter) {
    const errors = [];
    if (!adapter.name || adapter.name.trim() === '') {
        errors.push('Adapter name is required');
    }
    if (!adapter.displayName || adapter.displayName.trim() === '') {
        errors.push('Adapter displayName is required');
    }
    if (!adapter.featureRoots || adapter.featureRoots.length === 0) {
        errors.push('At least one featureRoot is required');
    }
    if (!adapter.layerRules || adapter.layerRules.length === 0) {
        errors.push('At least one layerRule is required');
    }
    // Check for duplicate layer names
    const layerNames = new Set();
    for (const rule of adapter.layerRules || []) {
        if (layerNames.has(rule.name)) {
            errors.push(`Duplicate layer name: ${rule.name}`);
        }
        layerNames.add(rule.name);
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
//# sourceMappingURL=sdk.js.map