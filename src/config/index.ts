export type {
  AnalysisPreset,
  ConfigDetailLevel,
  ConfigInclusionLevel,
  FilePatternConfig,
  AnalyzerConfig,
  AnalysisConfig,
  FileInclusionConfig,
  OutputConfig,
  GitConfig,
  IndexConfig,
  ContextConfig,
  PresetConfig,
  AIFirstConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ConfigLoadOptions,
  ConfigLoadResult,
} from './types.js';

export {
  loadConfig,
  getPreset,
  listPresets,
  resolveConfigPath,
} from './configLoader.js';
