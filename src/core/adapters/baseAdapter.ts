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
 * Universal entrypoint patterns - work across ALL languages and frameworks
 */
const UNIVERSAL_ENTRYPOINTS = [
  // CLI/Tool entrypoints
  'main', 'cli', 'cmd', 'command', 'run', 'exec', 'task', 'runner',
  
  // App/Plugin/Extension entrypoints
  'app', 'plugin', 'extension', 'entrypoint', 'bootstrap', 'setup',
  'initialize', 'init', 'start', 'launch',
  
  // Module entrypoints
  'index', '__main__', 'main',
  
  // API/Server entrypoints
  'api', 'server', 'router', 'gateway',
  
  // Web framework entrypoints
  'controller', 'handler', 'endpoint', 'view', 'page', 'screen', 'component',
  'route', 'routes', 'resource',
  
  // Business logic entrypoints
  'service', 'usecase', 'interactor', 'action', 'actor',
  
  // Async/Distributed entrypoints
  'job', 'worker', 'consumer', 'producer', 'queue', 'cron', 'schedule',
  
  // Framework-agnostic patterns
  'serializer', 'mutation', 'query', 'resolver',
  'management', 'admin',
  
  // Mobile entrypoints
  'activity', 'fragment', 'viewcontroller',
  
  // Database entrypoints
  'repository', 'dao', 'mapper',
];

/**
 * Universal feature roots - directories that typically contain business features
 */
const UNIVERSAL_FEATURE_ROOTS = [
  'src', 'app', 'lib', 'source', 'sources', 'modules', 'features',
  'services', 'internal', 'core', 'domain', 'business',
  'packages', 'components', 'pages', 'screens', 'views',
  'handlers', 'controllers', 'routes', 'api', 'api/src',
  'cmd', 'commands', 'scripts',
];

/**
 * Default adapter configuration - works for ANY project type
 */
export const DEFAULT_ADAPTER: AnalysisAdapter = {
  name: 'default',
  displayName: 'Default',
  detectionSignals: [],
  featureRoots: UNIVERSAL_FEATURE_ROOTS,
  ignoredFolders: ['utils', 'helpers', 'types', 'interfaces', 'constants', 'config', 'dto', 'models', 'common', 'shared', 'node_modules', '.git', 'dist', 'build', 'coverage', '__tests__', 'test', 'tests', '.next', '.nuxt', '.vite', '__pycache__', '.venv', 'venv', 'scripts', 'docs', 'migrations', 'spec', 'test'],
  entrypointPatterns: UNIVERSAL_ENTRYPOINTS,
  layerRules: [
    { name: 'api', priority: 1, patterns: ['controller', 'handler', 'route', 'router', 'api', 'endpoint', 'page', 'screen', 'view', 'component', 'gateway', 'resource'] },
    { name: 'service', priority: 2, patterns: ['service', 'services', 'usecase', 'interactor', 'action', 'actor', 'mutation', 'query', 'resolver'] },
    { name: 'data', priority: 3, patterns: ['repository', 'repo', 'dal', 'dao', 'data', 'persistence', 'mapper', 'dto'] },
    { name: 'domain', priority: 4, patterns: ['model', 'entity', 'schema', 'domain', 'event'] },
    { name: 'util', priority: 5, patterns: ['util', 'helper', 'lib', 'common', 'static', 'constants'] }
  ],
  supportedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.java', '.kt', '.go', '.rs', '.rb', '.php', '.cs', '.vue', '.svelte', '.swift', '.h', '.m', '.fs', '.fsx', '.rake', '.erb', '.html', '.css', '.scss', '.sass', '.less'],
  flowEntrypointPatterns: UNIVERSAL_ENTRYPOINTS,
  flowExcludePatterns: ['repository', 'repo', 'utils', 'helper', 'model', 'entity', 'dto', 'type', 'interface', 'constant', 'config', 'spec', 'test', 'tests', '__init__', '__pycache__', 'migrations']
};
