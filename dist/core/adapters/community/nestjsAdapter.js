/**
 * NestJS Adapter
 *
 * Community adapter for NestJS projects
 */
import { createAdapter, fileSignal, directorySignal, layerRule } from '../sdk.js';
export const nestjsAdapter = createAdapter({
    name: 'nestjs',
    displayName: 'NestJS',
    detectionSignals: [
        fileSignal('package.json'),
        fileSignal('nest-cli.json'),
        fileSignal('tsconfig.json'),
        directorySignal('src/modules'),
        directorySignal('src/controllers')
    ],
    featureRoots: [
        'src/modules',
        'src/controllers',
        'src/services',
        'src/providers',
        'src/guards',
        'src/filters',
        'src/interceptors'
    ],
    ignoredFolders: [
        'node_modules', 'dist', 'build', 'coverage', '.git',
        'test', 'tests', '__fixtures__'
    ],
    entrypointPatterns: [
        'Controller', 'Service', 'Provider', 'Guard',
        'Interceptor', 'Filter', 'Pipe', 'Module', 'Resolver'
    ],
    layerRules: [
        layerRule('api', 1, ['Controller', 'Resolver', 'Gateway', 'Middleware']),
        layerRule('service', 2, ['Service', 'Provider', 'UseCase']),
        layerRule('data', 3, ['Repository', 'Entity', 'Model', 'DAO']),
        layerRule('domain', 4, ['Entity', 'Domain', 'Aggregate']),
        layerRule('util', 5, ['Guard', 'Interceptor', 'Filter', 'Pipe', 'Helper'])
    ],
    supportedExtensions: ['.ts', '.js'],
    flowEntrypointPatterns: ['Controller', 'Resolver', 'Gateway', 'Service'],
    flowExcludePatterns: [
        'Module', 'Guard', 'Interceptor', 'Filter', 'Pipe',
        'Entity', 'Model', 'Repository', 'Test', 'spec'
    ]
});
//# sourceMappingURL=nestjsAdapter.js.map