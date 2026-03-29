import fs from 'fs';
import path from 'path';
import type {
  AIFirstConfig,
  AnalysisPreset,
  ConfigLoadOptions,
  ConfigLoadResult,
  PresetConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  OutputConfig,
  IndexConfig,
} from './types.js';

const DEFAULT_CONFIG_PATH = 'ai-first.config.json';

const PRESETS: Record<AnalysisPreset, PresetConfig> = {
  full: {
    name: 'full',
    description: 'Full analysis with all analyzers enabled',
    analysis: {
      detailLevel: 'full',
      inclusionLevel: 'full',
      analyzers: {
        architecture: { enabled: true },
        techStack: { enabled: true },
        entrypoints: { enabled: true },
        conventions: { enabled: true },
        symbols: { enabled: true },
        dependencies: { enabled: true },
        aiRules: { enabled: true },
      },
    },
    output: {
      directory: 'ai-context',
      formats: ['md', 'json'],
      prettyPrint: true,
      includeMetadata: true,
    },
    index: {
      enabled: true,
      type: 'sqlite',
      incremental: true,
    },
  },
  quick: {
    name: 'quick',
    description: 'Fast analysis with basic information',
    analysis: {
      detailLevel: 'skeleton',
      inclusionLevel: 'directory',
      maxFileSize: 10000,
      analyzers: {
        architecture: { enabled: true },
        techStack: { enabled: true },
        entrypoints: { enabled: true },
        conventions: { enabled: false },
        symbols: { enabled: false },
        dependencies: { enabled: false },
        aiRules: { enabled: false },
      },
    },
    output: {
      directory: 'ai-context',
      formats: ['md'],
      prettyPrint: false,
      includeMetadata: false,
    },
    index: {
      enabled: false,
      type: 'memory',
    },
  },
  api: {
    name: 'api',
    description: 'Focused on API and backend analysis',
    analysis: {
      detailLevel: 'signatures',
      inclusionLevel: 'compress',
      analyzers: {
        architecture: { enabled: true },
        techStack: { enabled: true },
        entrypoints: { enabled: true },
        conventions: { enabled: true },
        symbols: { enabled: true },
        dependencies: { enabled: true },
        aiRules: { enabled: false },
      },
    },
    output: {
      directory: 'ai-context',
      formats: ['md', 'json'],
      prettyPrint: true,
      includeMetadata: true,
    },
    index: {
      enabled: true,
      type: 'sqlite',
      incremental: true,
    },
  },
  docs: {
    name: 'docs',
    description: 'Generate documentation-focused output',
    analysis: {
      detailLevel: 'full',
      inclusionLevel: 'full',
      analyzers: {
        architecture: { enabled: true },
        techStack: { enabled: true },
        entrypoints: { enabled: true },
        conventions: { enabled: true },
        symbols: { enabled: true },
        dependencies: { enabled: false },
        aiRules: { enabled: false },
      },
    },
    output: {
      directory: 'ai-context',
      formats: ['md', 'html'],
      prettyPrint: true,
      includeMetadata: true,
    },
    index: {
      enabled: false,
      type: 'memory',
    },
  },
};

const DEFAULT_CONFIG: AIFirstConfig = {
  version: '1.0.0',
  preset: 'full',
  analysis: PRESETS.full.analysis as NonNullable<AIFirstConfig['analysis']>,
  output: PRESETS.full.output as OutputConfig,
  index: PRESETS.full.index as IndexConfig,
};

function validateConfig(config: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!config || typeof config !== 'object') {
    errors.push({ field: 'root', message: 'Config must be an object' });
    return { valid: false, errors, warnings };
  }

  const cfg = config as Record<string, unknown>;

  if (!cfg.version || typeof cfg.version !== 'string') {
    errors.push({ field: 'version', message: 'Version is required and must be a string' });
  }

  if (cfg.preset !== undefined) {
    const validPresets: AnalysisPreset[] = ['full', 'quick', 'api', 'docs'];
    if (!validPresets.includes(cfg.preset as AnalysisPreset)) {
      errors.push({
        field: 'preset',
        message: `Invalid preset. Must be one of: ${validPresets.join(', ')}`,
        value: cfg.preset,
      });
    }
  }

  if (cfg.analysis && typeof cfg.analysis !== 'object') {
    errors.push({ field: 'analysis', message: 'Analysis must be an object' });
  }

  if (cfg.output && typeof cfg.output !== 'object') {
    errors.push({ field: 'output', message: 'Output must be an object' });
  }

  if (cfg.index && typeof cfg.index !== 'object') {
    errors.push({ field: 'index', message: 'Index must be an object' });
  }

  return { valid: errors.length === 0, errors, warnings };
}

function mergeConfig(base: AIFirstConfig, override: Partial<AIFirstConfig>): AIFirstConfig {
  const result: AIFirstConfig = {
    ...base,
    ...override,
  };

  if (override.analysis) {
    result.analysis = { ...base.analysis, ...override.analysis };
  }
  if (override.output) {
    result.output = { ...base.output, ...override.output } as OutputConfig;
  }
  if (override.index) {
    result.index = { ...base.index, ...override.index } as IndexConfig;
  }

  return result;
}

export function getPreset(name: AnalysisPreset): PresetConfig | undefined {
  return PRESETS[name];
}

export function listPresets(): PresetConfig[] {
  return Object.values(PRESETS);
}

export function loadConfig(options: ConfigLoadOptions = {}): ConfigLoadResult {
  const {
    configPath = DEFAULT_CONFIG_PATH,
    preset,
    overrides,
    validate = true,
    throwOnError = false,
  } = options;

  let config: AIFirstConfig = { ...DEFAULT_CONFIG };
  let source: ConfigLoadResult['source'] = 'default';

  if (fs.existsSync(configPath)) {
    try {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      const loadedConfig = JSON.parse(fileContent) as Partial<AIFirstConfig>;
      config = mergeConfig(DEFAULT_CONFIG, loadedConfig);
      source = 'file';
    } catch (error) {
      const parseError: ValidationError = {
        field: 'configFile',
        message: `Failed to parse config file: ${error instanceof Error ? error.message : String(error)}`,
        value: configPath,
      };
      if (throwOnError) {
        throw new Error(parseError.message);
      }
      return {
        config: DEFAULT_CONFIG,
        source: 'default',
        validation: { valid: false, errors: [parseError], warnings: [] },
      };
    }
  }

  if (preset && PRESETS[preset]) {
    const p = PRESETS[preset];
    const presetData: Partial<AIFirstConfig> = {
      analysis: p.analysis as AIFirstConfig['analysis'],
      output: p.output as AIFirstConfig['output'],
      index: p.index as AIFirstConfig['index'],
    };
    config = mergeConfig(config, presetData);
    source = source === 'default' ? 'preset' : 'merged';
  }

  if (overrides) {
    config = mergeConfig(config, overrides);
    source = 'merged';
  }

  const validation = validateConfig(config);

  if (!validation.valid && throwOnError) {
    const errorMessages = validation.errors.map(e => e.message).join('; ');
    throw new Error(`Configuration validation failed: ${errorMessages}`);
  }

  return { config, source, validation };
}

export function resolveConfigPath(customPath?: string): string {
  if (customPath) {
    return path.resolve(customPath);
  }
  return path.resolve(DEFAULT_CONFIG_PATH);
}
