export type InclusionLevel = 'full' | 'compress' | 'directory' | 'exclude';
export type DetailLevel = 'full' | 'signatures' | 'skeleton';

export interface FileClassification {
  path: string;
  inclusionLevel: InclusionLevel;
  detailLevel: DetailLevel;
}

export interface ContentProcessorOptions {
  inclusionLevel?: InclusionLevel;
  detailLevel?: DetailLevel;
  language?: string;
  preserveComments?: boolean;
  preserveImports?: boolean;
}

export interface ProcessedContent {
  originalLength: number;
  processedLength: number;
  compressionRatio: number;
  content: string;
  tokens: number;
}

export interface CompressionStats {
  totalFiles: number;
  fullFiles: number;
  compressedFiles: number;
  directoryOnlyFiles: number;
  excludedFiles: number;
  originalTokens: number;
  processedTokens: number;
  savingsPercentage: number;
}
