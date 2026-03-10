import { AnalysisAdapter } from './baseAdapter.js';

/**
 * Salesforce Adapter
 * 
 * Supports:
 * - Salesforce DX projects
 * - Aura components
 * - Lightning Web Components (LWC)
 * - Apex classes
 */
export const salesforceAdapter: AnalysisAdapter = {
  name: 'salesforce',
  displayName: 'Salesforce',
  
  detectionSignals: [
    { type: 'file', pattern: 'sfdx-project.json' },
    { type: 'file', pattern: 'project-scratch-def.json' },
    { type: 'directory', pattern: 'force-app' },
    { type: 'directory', pattern: 'src/classes' },
    { type: 'file', pattern: 'package.xml' }
  ],
  
  featureRoots: [
    'force-app/main/default',
    'src',
    'src/classes',
    'src/objects',
    'src/triggers'
  ],
  
  ignoredFolders: [
    'node_modules', '.git', 'dist', 'build', 'coverage',
    'test', 'tests', 'mdapi', 'deploy', 'package.xml'
  ],
  
  entrypointPatterns: [
    'Controller', 'Trigger', 'Batch', 'Queueable', 'Schedulable',
    'AuraEnabled', 'RestResource', 'FlowAction', 'FlowConnector',
    'LWC', 'Component', 'App', 'Event', 'Interface'
  ],
  
  layerRules: [
    { name: 'api', priority: 1, patterns: ['Controller', 'Trigger', 'RestResource', 'AuraEnabled', 'FlowAction'] },
    { name: 'service', priority: 2, patterns: ['Service', 'Selector', 'Domain', 'UnitOfWork'] },
    { name: 'data', priority: 3, patterns: ['Repository', 'DAO', 'Selector', 'Model'] },
    { name: 'domain', priority: 4, patterns: ['Entity', 'SObject', 'Schema', 'Object'] },
    { name: 'util', priority: 5, patterns: ['Util', 'Helper', 'Constants', 'Exception'] }
  ],
  
  supportedExtensions: ['.cls', '.trigger', '.apex', '.js', '.html', '.css', '.xml', '.meta.xml'],
  
  flowEntrypointPatterns: ['Controller', 'Trigger', 'Batch', 'Queueable', 'RestResource', 'AuraEnabled', 'LWC'],
  
  flowExcludePatterns: [
    'Test', 'TestSuite', 'Settings', 'PermissionSet', 'Profile',
    'SharingRule', 'ValidationRule', 'Workflow', 'Flow', 'ProcessBuilder'
  ]
};

/**
 * Salesforce DX specific
 */
export const sfdxAdapter: AnalysisAdapter = {
  ...salesforceAdapter,
  name: 'sfdx',
  displayName: 'Salesforce DX',
  
  detectionSignals: [
    { type: 'file', pattern: 'sfdx-project.json' },
    { type: 'file', pattern: 'project-scratch-def.json' },
    { type: 'file', pattern: '.forceignore' }
  ],
  
  featureRoots: ['force-app', 'src', 'unpackaged', 'mdapi']
};
