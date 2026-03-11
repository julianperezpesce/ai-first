/**
 * Phoenix Adapter
 *
 * Community adapter for Elixir Phoenix projects
 */
import { createAdapter, fileSignal, directorySignal, layerRule } from '../sdk.js';
export const phoenixAdapter = createAdapter({
    name: 'phoenix',
    displayName: 'Elixir Phoenix',
    detectionSignals: [
        fileSignal('mix.exs'),
        fileSignal('mix.lock'),
        directorySignal('lib'),
        directorySignal('priv')
    ],
    featureRoots: [
        'lib',
        'lib/*/controllers',
        'lib/*/views',
        'lib/*/contexts',
        'lib/*/schemas'
    ],
    ignoredFolders: [
        'node_modules', '_build', '.git', 'priv',
        'test', 'deps', 'assets'
    ],
    entrypointPatterns: [
        'Controller', 'View', 'Channel', 'Socket',
        'Plug', 'Endpoint', 'Context'
    ],
    layerRules: [
        layerRule('api', 1, ['Controller', 'View', 'Channel', 'Socket', 'Plug']),
        layerRule('service', 2, ['Context', 'Service', 'Worker']),
        layerRule('data', 3, ['Schema', 'Repo', 'Model']),
        layerRule('domain', 4, ['Schema', 'Domain', 'Entity']),
        layerRule('util', 5, ['Helper', 'Util', 'HTML'])
    ],
    supportedExtensions: ['.ex', '.exs', '.eex', '.leex'],
    flowEntrypointPatterns: ['Controller', 'Channel', 'Plug', 'Endpoint'],
    flowExcludePatterns: [
        'Schema', 'Repo', 'View', 'HTML', 'Endpoint',
        'Router', 'Test', 'TestCase'
    ]
});
//# sourceMappingURL=phoenixAdapter.js.map