import { AnalysisAdapter, DetectionSignal, LayerRule } from './baseAdapter.js';

/**
 * JavaScript/TypeScript Adapter
 * 
 * Supports:
 * - Node.js projects
 * - React/Vue/Angular apps
 * - TypeScript projects
 */
export const javascriptAdapter: AnalysisAdapter = {
  name: 'javascript',
  displayName: 'JavaScript / TypeScript',
  
  detectionSignals: [
    { type: 'file', pattern: 'package.json' },
    { type: 'file', pattern: 'tsconfig.json' },
    { type: 'file', pattern: 'jest.config.js' },
    { type: 'file', pattern: 'vite.config.ts' },
    { type: 'file', pattern: 'webpack.config.js' },
    { type: 'file', pattern: 'next.config.js' },
    { type: 'file', pattern: 'angular.json' }
  ],
  
  featureRoots: ['src', 'app', 'packages', 'services', 'modules', 'features', 'pages', 'components'],
  
  ignoredFolders: [
    'utils', 'helpers', 'types', 'interfaces', 'constants', 'config',
    'dto', 'models', 'common', 'shared', 'node_modules', '.git',
    'dist', 'build', 'coverage', '__tests__', 'test', 'tests',
    '.next', '.nuxt', '.vite'
  ],
  
  entrypointPatterns: [
    'controller', 'route', 'router', 'handler', 'command',
    'service', 'middleware', 'endpoint', 'api'
  ],
  
  layerRules: [
    { name: 'api', priority: 1, patterns: ['controller', 'handler', 'route', 'router', 'api', 'endpoint', 'middleware'] },
    { name: 'service', priority: 2, patterns: ['service', 'services', 'usecase', 'interactor', 'business'] },
    { name: 'data', priority: 3, patterns: ['repository', 'repo', 'dal', 'dao', 'data', 'persistence', 'db'] },
    { name: 'domain', priority: 4, patterns: ['model', 'entity', 'schema', 'domain', 'type'] },
    { name: 'util', priority: 5, patterns: ['util', 'helper', 'lib', 'common', 'static'] }
  ],
  
  supportedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte'],
  
  flowEntrypointPatterns: ['controller', 'route', 'handler', 'command', 'router', 'api'],
  
  flowExcludePatterns: [
    'repository', 'repo', 'utils', 'helper', 'model', 'entity',
    'dto', 'type', 'interface', 'constant', 'config', 'schema',
    'middleware', 'util', 'lib', 'test', 'spec'
  ]
};
