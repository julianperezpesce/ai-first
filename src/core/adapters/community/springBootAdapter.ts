/**
 * Spring Boot Adapter
 * 
 * Community adapter for Java Spring Boot projects
 */

import { createAdapter, fileSignal, directorySignal, layerRule } from '../sdk.js';

export const springBootAdapter = createAdapter({
  name: 'springboot',
  displayName: 'Spring Boot',
  
  detectionSignals: [
    fileSignal('pom.xml'),
    fileSignal('build.gradle'),
    fileSignal('gradlew'),
    directorySignal('src/main/java'),
    directorySignal('src/main/kotlin')
  ],
  
  featureRoots: [
    'src/main/java',
    'src/main/kotlin',
    'src/main/resources'
  ],
  
  ignoredFolders: [
    'node_modules', 'target', 'build', '.git', 'gradle',
    '.gradle', 'src/test', 'src/test'
  ],
  
  entrypointPatterns: [
    'Controller', 'RestController', 'Service', 'Repository',
    'Component', 'Configuration', 'Bean'
  ],
  
  layerRules: [
    layerRule('api', 1, ['Controller', 'RestController', 'Endpoint', 'Filter']),
    layerRule('service', 2, ['Service', 'Component', 'Configuration']),
    layerRule('data', 3, ['Repository', 'Entity', 'DAO', 'JdbcTemplate']),
    layerRule('domain', 4, ['Entity', 'Domain', 'Model', 'ValueObject']),
    layerRule('util', 5, ['Util', 'Helper', 'Configuration', 'Properties'])
  ],
  
  supportedExtensions: ['.java', '.kt', '.groovy'],
  
  flowEntrypointPatterns: ['Controller', 'RestController', 'Service', 'CommandLineRunner'],
  
  flowExcludePatterns: [
    'Repository', 'Entity', 'Configuration', 'Properties',
    'Application', 'Test', 'TestCase'
  ]
});
