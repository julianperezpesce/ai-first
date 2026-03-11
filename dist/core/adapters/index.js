/**
 * Analysis Adapters
 *
 * Language and framework-specific adapters for customizing
 * feature and flow detection.
 */
export { DEFAULT_ADAPTER } from './baseAdapter.js';
export { javascriptAdapter } from './javascriptAdapter.js';
export { pythonAdapter, djangoAdapter, flaskAdapter } from './pythonAdapter.js';
export { railsAdapter, rubyAdapter } from './railsAdapter.js';
export { salesforceAdapter, sfdxAdapter } from './salesforceAdapter.js';
export { dotnetAdapter, aspnetCoreAdapter, blazorAdapter } from './dotnetAdapter.js';
// SDK exports
export { createAdapter, validateAdapter, fileSignal, directorySignal, contentSignal, layerRule } from './sdk.js';
// Community adapters
export { laravelAdapter, nestjsAdapter, springBootAdapter, phoenixAdapter, fastapiAdapter } from './community/index.js';
// Registry
export { detectAdapter, detectAllAdapters, getAdapter, listAdapters, ADAPTERS } from './adapterRegistry.js';
//# sourceMappingURL=index.js.map