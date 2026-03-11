/**
 * Laravel Adapter
 * 
 * Community adapter for Laravel/PHP projects
 */

import { createAdapter, fileSignal, directorySignal, layerRule } from '../sdk.js';

export const laravelAdapter = createAdapter({
  name: 'laravel',
  displayName: 'Laravel',
  
  detectionSignals: [
    fileSignal('composer.json'),
    fileSignal('artisan'),
    fileSignal('phpunit.xml'),
    directorySignal('app/Http'),
    directorySignal('app/Console')
  ],
  
  featureRoots: [
    'app/Http/Controllers',
    'app/Services',
    'app/Models',
    'app/Jobs',
    'app/Events',
    'app/Mail'
  ],
  
  ignoredFolders: [
    'vendor', 'node_modules', 'storage', 'bootstrap', 'config',
    'resources', 'routes', 'database', 'tests', '.git'
  ],
  
  entrypointPatterns: [
    'Controller', 'Request', 'Command', 'Job', 'Event', 'Listener',
    'Middleware', 'Notification', 'Mail', 'Handler'
  ],
  
  layerRules: [
    layerRule('api', 1, ['Controller', 'Request', 'Middleware', 'Resource']),
    layerRule('service', 2, ['Service', 'Job', 'Event', 'Listener', 'Notification']),
    layerRule('data', 3, ['Model', 'Repository', 'Database']),
    layerRule('domain', 4, ['Entity', 'ValueObject', 'Rule']),
    layerRule('util', 5, ['Helper', 'Support', 'Traits'])
  ],
  
  supportedExtensions: ['.php'],
  
  flowEntrypointPatterns: ['Controller', 'Command', 'Job', 'Request'],
  
  flowExcludePatterns: [
    'Model', 'Migration', 'Seeder', 'Factory', 'Test',
    'Middleware', 'Request', 'Rule', 'Config'
  ]
});
