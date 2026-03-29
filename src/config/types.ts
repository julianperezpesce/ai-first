export type AnalysisPreset = 'full' | 'quick' | 'api' | 'docs';

export type ConfigDetailLevel = 'full' | 'signatures' | 'skeleton';

export type ConfigInclusionLevel = 'full' | 'compress' | 'directory' | 'exclude';

export interface FilePatternConfig {
  include?: string[];
  exclude?: string[];
}

export interface AnalyzerConfig {
  enabled: boolean;
  options?: Record<string, unknown>;
}

export interface AnalysisConfig {
  preset?: AnalysisPreset;
  detailLevel?: ConfigDetailLevel;
  inclusionLevel?: ConfigInclusionLevel;
  filePatterns?: FilePatternConfig;
  maxFileSize?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  analyzers?: {
    architecture?: AnalyzerConfig;
    techStack?: AnalyzerConfig;
    entrypoints?: AnalyzerConfig;
    conventions?: AnalyzerConfig;
    symbols?: AnalyzerConfig;
    dependencies?: AnalyzerConfig;
    aiRules?: AnalyzerConfig;
  };
}

export interface FileInclusionConfig {
  level: ConfigInclusionLevel;
  patterns: string[];
  maxFileSize?: number;
}

export interface OutputConfig {
  directory: string;
  formats: ('md' | 'json' | 'html')[];
  prettyPrint?: boolean;
  includeMetadata?: boolean;
}

export interface GitConfig {
  includeCommits?: number;
  excludePatterns?: string[];
}

export interface IndexConfig {
  enabled: boolean;
  type: 'sqlite' | 'memory';
  incremental?: boolean;
  watch?: boolean;
}

export interface ContextConfig {
  maxTokens?: number;
  includeEmbeddings?: boolean;
  semanticSearch?: boolean;
  maxResults?: number;
}

export interface PresetConfig {
  name: AnalysisPreset;
  description: string;
  analysis: Partial<AnalysisConfig>;
  output: Partial<OutputConfig>;
  index: Partial<IndexConfig>;
}

export interface AIFirstConfig {
  version: string;
  preset?: AnalysisPreset;
  analysis?: AnalysisConfig;
  output?: OutputConfig;
  index?: IndexConfig;
  context?: ContextConfig;
  git?: GitConfig;
  fileInclusion?: FileInclusionConfig;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface ConfigLoadOptions {
  configPath?: string;
  preset?: AnalysisPreset;
  overrides?: Partial<AIFirstConfig>;
  validate?: boolean;
  throwOnError?: boolean;
}

export interface ConfigLoadResult {
  config: AIFirstConfig;
  source: 'default' | 'file' | 'preset' | 'merged';
  validation: ValidationResult;
}
