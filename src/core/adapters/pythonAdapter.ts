import { AnalysisAdapter } from './baseAdapter.js';

/**
 * Python Adapter
 * 
 * Supports:
 * - Django projects
 * - Flask projects
 * - FastAPI projects
 * - Generic Python packages
 */
export const pythonAdapter: AnalysisAdapter = {
  name: 'python',
  displayName: 'Python',
  
  detectionSignals: [
    { type: 'file', pattern: 'pyproject.toml' },
    { type: 'file', pattern: 'requirements.txt' },
    { type: 'file', pattern: 'Pipfile' },
    { type: 'file', pattern: 'setup.py' },
    { type: 'file', pattern: 'setup.cfg' },
    { type: 'directory', pattern: 'venv' },
    { type: 'directory', pattern: '.venv' },
    { type: 'file', pattern: 'manage.py' }
  ],
  
  featureRoots: ['src', 'app', 'apps', 'modules', 'services', 'api', 'core'],
  
  ignoredFolders: [
    'utils', 'helpers', 'types', 'constants', 'config',
    'migrations', '__pycache__', '.git', 'venv', '.venv',
    'tests', 'test', '.pytest_cache', 'docs', 'scripts'
  ],
  
  entrypointPatterns: [
    'view', 'views', 'controller', 'endpoint', 'api',
    'service', 'task', 'celery', 'command', 'management'
  ],
  
  layerRules: [
    { name: 'api', priority: 1, patterns: ['view', 'views', 'controller', 'endpoint', 'api', 'route', 'resource'] },
    { name: 'service', priority: 2, patterns: ['service', 'services', 'usecase', 'interactor', 'business', 'logic'] },
    { name: 'data', priority: 3, patterns: ['repository', 'repo', 'model', 'dao', 'data', 'persistence', 'db'] },
    { name: 'domain', priority: 4, patterns: ['entity', 'schema', 'domain', 'core'] },
    { name: 'util', priority: 5, patterns: ['util', 'helper', 'lib', 'common'] }
  ],
  
  supportedExtensions: ['.py'],
  
  flowEntrypointPatterns: ['view', 'controller', 'endpoint', 'api', 'command', 'task'],
  
  flowExcludePatterns: [
    'model', 'entity', 'utils', 'helper', 'migration',
    'test', 'tests', '__pycache__', 'conftest', 'schema'
  ]
};

/**
 * Django-specific adapter
 */
export const djangoAdapter: AnalysisAdapter = {
  ...pythonAdapter,
  name: 'django',
  displayName: 'Django',
  
  detectionSignals: [
    { type: 'file', pattern: 'manage.py' },
    { type: 'file', pattern: 'settings.py' },
    { type: 'file', pattern: 'wsgi.py' },
    { type: 'content', pattern: 'DJANGO_SETTINGS_MODULE', contentPattern: '' }
  ],
  
  featureRoots: ['apps', 'modules', 'api', 'core'],
  
  entrypointPatterns: [
    'view', 'views', 'api_view', 'controller', 'endpoint',
    'serializer', 'service', 'task', 'management'
  ],
  
  layerRules: [
    { name: 'api', priority: 1, patterns: ['view', 'views', 'api_view', 'controller', 'endpoint', 'resource', 'serializer'] },
    { name: 'service', priority: 2, patterns: ['service', 'services', 'usecase', 'business', 'logic'] },
    { name: 'data', priority: 3, patterns: ['model', 'models', 'repository', 'dao', 'manager'] },
    { name: 'domain', priority: 4, patterns: ['entity', 'schema', 'domain', 'signals'] },
    { name: 'util', priority: 5, patterns: ['util', 'helpers', 'lib', 'common', 'middleware'] }
  ]
};

/**
 * Flask/FastAPI adapter
 */
export const flaskAdapter: AnalysisAdapter = {
  ...pythonAdapter,
  name: 'flask',
  displayName: 'Flask / FastAPI',
  
  detectionSignals: [
    { type: 'file', pattern: 'app.py' },
    { type: 'file', pattern: 'main.py' },
    { type: 'content', pattern: 'from flask import', contentPattern: '' },
    { type: 'content', pattern: 'from fastapi import', contentPattern: '' }
  ],
  
  featureRoots: ['src', 'app', 'api', 'routes', 'services', 'models'],
  
  entrypointPatterns: [
    'route', 'routes', 'endpoint', 'api', 'view',
    'service', 'command', 'blueprint'
  ],
  
  layerRules: [
    { name: 'api', priority: 1, patterns: ['route', 'routes', 'endpoint', 'api', 'blueprint', 'view'] },
    { name: 'service', priority: 2, patterns: ['service', 'services', 'usecase', 'business'] },
    { name: 'data', priority: 3, patterns: ['model', 'models', 'repository', 'dao'] },
    { name: 'domain', priority: 4, patterns: ['entity', 'schema', 'domain'] },
    { name: 'util', priority: 5, patterns: ['util', 'helpers', 'lib'] }
  ]
};
