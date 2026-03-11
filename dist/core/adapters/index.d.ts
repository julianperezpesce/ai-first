/**
 * Analysis Adapters
 *
 * Language and framework-specific adapters for customizing
 * feature and flow detection.
 */
export { AnalysisAdapter, DetectionSignal, LayerRule, DEFAULT_ADAPTER } from './baseAdapter.js';
export { javascriptAdapter } from './javascriptAdapter.js';
export { pythonAdapter, djangoAdapter, flaskAdapter } from './pythonAdapter.js';
export { railsAdapter, rubyAdapter } from './railsAdapter.js';
export { salesforceAdapter, sfdxAdapter } from './salesforceAdapter.js';
export { dotnetAdapter, aspnetCoreAdapter, blazorAdapter } from './dotnetAdapter.js';
export { createAdapter, validateAdapter, fileSignal, directorySignal, contentSignal, layerRule } from './sdk.js';
export type { AdapterConfig } from './sdk.js';
export { laravelAdapter, nestjsAdapter, springBootAdapter, phoenixAdapter, fastapiAdapter } from './community/index.js';
export { detectAdapter, detectAllAdapters, getAdapter, listAdapters, ADAPTERS } from './adapterRegistry.js';
export type { AdapterDetectionResult } from './adapterRegistry.js';
//# sourceMappingURL=index.d.ts.map