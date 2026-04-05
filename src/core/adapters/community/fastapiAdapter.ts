/**
 * FastAPI Adapter
 * 
 * Community adapter for Python FastAPI projects
 */

import { createAdapter, fileSignal, contentSignal, layerRule } from '../sdk.js';

export const fastapiAdapter = createAdapter({
  name: 'fastapi',
  displayName: 'FastAPI',
  
  detectionSignals: [
    contentSignal('*.py', 'from fastapi import'),
    contentSignal('*.py', 'import fastapi'),
    contentSignal('*.py', 'FastAPI('),
    fileSignal('pyproject.toml'),
    fileSignal('requirements.txt')
  ],
  
  featureRoots: [
    'app',
    'app/api',
    'app/services',
    'app/models',
    'app/schemas'
  ],
  
  ignoredFolders: [
    'venv', '.venv', '__pycache__', '.git',
    'tests', 'test', '.pytest_cache', 'docs'
  ],
  
  entrypointPatterns: [
    'router', 'APIRouter', 'endpoint', 'route',
    'view', 'controller', 'service'
  ],
  
  layerRules: [
    layerRule('api', 1, ['router', 'APIRouter', 'endpoint', 'route', 'view']),
    layerRule('service', 2, ['service', 'usecase', 'interactor', 'business']),
    layerRule('data', 3, ['model', 'schema', 'repository', 'dao']),
    layerRule('domain', 4, ['entity', 'schema', 'domain']),
    layerRule('util', 5, ['util', 'helper', 'lib', 'core'])
  ],
  
  supportedExtensions: ['.py'],
  
  flowEntrypointPatterns: ['router', 'APIRouter', 'endpoint', 'route'],
  
  flowExcludePatterns: [
    'model', 'schema', 'repository', 'test', 'tests',
    '__pycache__', 'conftest'
  ]
});
