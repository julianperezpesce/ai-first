/**
 * Ruby on Rails Adapter
 */
export const railsAdapter = {
    name: 'rails',
    displayName: 'Ruby on Rails',
    detectionSignals: [
        { type: 'file', pattern: 'Gemfile' },
        { type: 'file', pattern: 'config.ru' },
        { type: 'file', pattern: 'Rakefile' },
        { type: 'directory', pattern: 'app/controllers' },
        { type: 'directory', pattern: 'app/models' }
    ],
    featureRoots: ['app', 'modules', 'lib', 'engines'],
    ignoredFolders: [
        'assets', 'javascripts', 'stylesheets', 'images', 'fonts',
        'helpers', 'views', 'mailers', 'jobs', 'channels',
        'node_modules', '.git', 'log', 'tmp', 'coverage', 'spec', 'test'
    ],
    entrypointPatterns: [
        'controller', 'endpoint', 'api', 'service', 'job',
        'channel', 'mailer', 'serializer'
    ],
    layerRules: [
        { name: 'api', priority: 1, patterns: ['controller', 'endpoint', 'api', 'channel', 'mailer'] },
        { name: 'service', priority: 2, patterns: ['service', 'services', 'usecase', 'interactor', 'operation'] },
        { name: 'data', priority: 3, patterns: ['model', 'repository', 'record', 'concern'] },
        { name: 'domain', priority: 4, patterns: ['entity', 'domain', 'value_object'] },
        { name: 'util', priority: 5, patterns: ['helper', 'lib', 'concern', 'middleware'] }
    ],
    supportedExtensions: ['.rb', '.erb', '.rake'],
    flowEntrypointPatterns: ['controller', 'endpoint', 'api', 'job', 'channel'],
    flowExcludePatterns: [
        'model', 'helper', 'view', 'mailer', 'channel',
        'serializer', 'concern', 'lib', 'config', 'spec', 'test'
    ]
};
/**
 * Ruby Gem adapter
 */
export const rubyAdapter = {
    ...railsAdapter,
    name: 'ruby',
    displayName: 'Ruby',
    detectionSignals: [
        { type: 'file', pattern: '*.gemspec' },
        { type: 'file', pattern: 'Gemfile' }
    ],
    featureRoots: ['lib', 'app'],
    ignoredFolders: ['spec', 'test', 'examples', 'node_modules', '.git']
};
//# sourceMappingURL=railsAdapter.js.map