/**
 * Analysis Adapter Interface
 *
 * Defines the contract for language/framework-specific adapters
 * that customize feature and flow detection.
 */
/**
 * Default adapter configuration
 */
export const DEFAULT_ADAPTER = {
    name: 'default',
    displayName: 'Default',
    detectionSignals: [],
    featureRoots: ['src', 'app', 'lib', 'modules'],
    ignoredFolders: ['utils', 'helpers', 'types', 'interfaces', 'constants', 'config', 'dto', 'models', 'common', 'shared', 'node_modules', '.git'],
    entrypointPatterns: ['controller', 'route', 'handler', 'command', 'service'],
    layerRules: [
        { name: 'api', priority: 1, patterns: ['controller', 'handler', 'route', 'router', 'api', 'endpoint'] },
        { name: 'service', priority: 2, patterns: ['service', 'services', 'usecase', 'interactor'] },
        { name: 'data', priority: 3, patterns: ['repository', 'repo', 'dal', 'dao', 'data', 'persistence'] },
        { name: 'domain', priority: 4, patterns: ['model', 'entity', 'schema', 'domain'] },
        { name: 'util', priority: 5, patterns: ['util', 'helper', 'lib', 'common'] }
    ],
    supportedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.kt', '.go', '.rs', '.rb', '.php', '.cs', '.vue', '.svelte'],
    flowEntrypointPatterns: ['controller', 'route', 'handler', 'command'],
    flowExcludePatterns: ['repository', 'repo', 'utils', 'helper', 'model', 'entity', 'dto', 'type', 'interface', 'constant', 'config']
};
//# sourceMappingURL=baseAdapter.js.map