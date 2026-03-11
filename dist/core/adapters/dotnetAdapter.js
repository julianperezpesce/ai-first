/**
 * .NET Adapter
 *
 * Supports:
 * - ASP.NET Core
 * - .NET Framework
 * - Blazor
 * - Xamarin
 */
export const dotnetAdapter = {
    name: 'dotnet',
    displayName: '.NET',
    detectionSignals: [
        { type: 'file', pattern: '*.csproj' },
        { type: 'file', pattern: '*.sln' },
        { type: 'file', pattern: '*.fsproj' },
        { type: 'file', pattern: 'Program.cs' },
        { type: 'file', pattern: 'Startup.cs' },
        { type: 'file', pattern: 'appsettings.json' }
    ],
    featureRoots: ['src', 'app', 'Services', 'Controllers', 'Models', 'ViewModels', 'Components'],
    ignoredFolders: [
        'bin', 'obj', 'Properties', 'wwwroot', 'Test', 'Tests',
        'node_modules', '.git', 'packages', '.vs', '.idea'
    ],
    entrypointPatterns: [
        'Controller', 'ApiController', 'Endpoint', 'Handler',
        'Service', 'Command', 'Query', 'Middleware', 'Component'
    ],
    layerRules: [
        { name: 'api', priority: 1, patterns: ['Controller', 'ApiController', 'Endpoint', 'Handler', 'Middleware', 'Filter'] },
        { name: 'service', priority: 2, patterns: ['Service', 'Services', 'Command', 'Query', 'Handler', 'Mediator'] },
        { name: 'data', priority: 3, patterns: ['Repository', 'Repo', 'DbContext', 'Data', 'Entity'] },
        { name: 'domain', priority: 4, patterns: ['Model', 'Entity', 'Domain', 'ValueObject', 'Aggregate'] },
        { name: 'util', priority: 5, patterns: ['Helper', 'Util', 'Common', 'Extensions'] }
    ],
    supportedExtensions: ['.cs', '.fs', '.vb', '.razor', '.cshtml', '.xaml'],
    flowEntrypointPatterns: ['Controller', 'ApiController', 'Endpoint', 'Handler', 'Command', 'Page'],
    flowExcludePatterns: [
        'Repository', 'Service', 'Model', 'Entity', 'Dto',
        'ViewModel', 'Mapping', 'Configuration', 'Middleware',
        'Test', 'Tests', 'Helper', 'Util', 'Extensions'
    ]
};
/**
 * ASP.NET Core specific
 */
export const aspnetCoreAdapter = {
    ...dotnetAdapter,
    name: 'aspnetcore',
    displayName: 'ASP.NET Core',
    detectionSignals: [
        { type: 'file', pattern: '*.csproj' },
        { type: 'content', pattern: 'Microsoft.AspNetCore', contentPattern: '' },
        { type: 'file', pattern: 'Program.cs' },
        { type: 'file', pattern: 'Startup.cs' }
    ],
    featureRoots: ['Controllers', 'Services', 'Models', 'Views', 'Pages', 'Components', 'Areas'],
    entrypointPatterns: [
        'Controller', 'ApiController', 'Endpoint', 'MinimalApi',
        'Middleware', 'Filter', 'Service'
    ]
};
/**
 * Blazor specific
 */
export const blazorAdapter = {
    ...dotnetAdapter,
    name: 'blazor',
    displayName: 'Blazor',
    detectionSignals: [
        { type: 'file', pattern: '*.csproj' },
        { type: 'file', pattern: '_Imports.razor' },
        { type: 'content', pattern: '@page', contentPattern: '' }
    ],
    featureRoots: ['Components', 'Pages', 'Shared', 'Services'],
    entrypointPatterns: ['Component', 'Page', 'Layout', 'Service', 'Controller'],
    layerRules: [
        { name: 'ui', priority: 1, patterns: ['Component', 'Page', 'Layout', 'Razor'] },
        { name: 'service', priority: 2, patterns: ['Service', 'Services', 'State', 'Store'] },
        { name: 'data', priority: 3, patterns: ['Repository', 'DbContext', 'Model', 'Entity'] },
        { name: 'domain', priority: 4, patterns: ['Entity', 'Domain', 'Model'] },
        { name: 'util', priority: 5, patterns: ['Helper', 'Util', 'Extensions'] }
    ]
};
//# sourceMappingURL=dotnetAdapter.js.map