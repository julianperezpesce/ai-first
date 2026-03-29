import { ContentProcessorOptions, ProcessedContent, DetailLevel, InclusionLevel } from './types.js';

export function processContent(
  content: string,
  options: ContentProcessorOptions = {}
): ProcessedContent {
  const {
    inclusionLevel = 'full',
    detailLevel = 'full',
    language = detectLanguage(content),
    preserveComments = true,
    preserveImports = true
  } = options;

  const originalLength = content.length;
  let processedContent = content;

  if (inclusionLevel === 'directory') {
    return {
      originalLength,
      processedLength: 0,
      compressionRatio: 100,
      content: '',
      tokens: 0
    };
  }

  if (inclusionLevel === 'exclude') {
    return {
      originalLength,
      processedLength: 0,
      compressionRatio: 100,
      content: '',
      tokens: 0
    };
  }

  if (inclusionLevel === 'compress' || detailLevel !== 'full') {
    processedContent = compressContent(content, detailLevel, language, preserveComments, preserveImports);
  }

  const processedLength = processedContent.length;
  const compressionRatio = originalLength > 0 
    ? ((originalLength - processedLength) / originalLength) * 100 
    : 0;
  const tokens = estimateTokens(processedContent);

  return {
    originalLength,
    processedLength,
    compressionRatio,
    content: processedContent,
    tokens
  };
}

function compressContent(
  content: string,
  detailLevel: DetailLevel,
  language: string,
  preserveComments: boolean,
  preserveImports: boolean
): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inFunction = false;
  let braceCount = 0;
  let functionSignature: string | null = null;
  let inComment = false;
  let commentBlock: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('/*')) {
      inComment = true;
    }

    if (inComment) {
      if (preserveComments && detailLevel !== 'skeleton') {
        commentBlock.push(line);
      }
      if (trimmed.includes('*/')) {
        inComment = false;
        if (commentBlock.length > 0) {
          result.push(...commentBlock);
          commentBlock = [];
        }
      }
      continue;
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      if (preserveComments && detailLevel !== 'skeleton') {
        result.push(line);
      }
      continue;
    }

    if (preserveImports && isImportLine(trimmed, language)) {
      result.push(line);
      continue;
    }

    if (isExportLine(trimmed, language)) {
      if (detailLevel === 'skeleton') {
        const simplified = simplifyExport(line, language);
        if (simplified) result.push(simplified);
        continue;
      }
    }

    if (isFunctionSignature(line, language)) {
      if (inFunction) {
        braceCount = 0;
      }
      inFunction = true;
      functionSignature = line;
      braceCount += countBraces(line);

      if (detailLevel === 'signatures' || detailLevel === 'skeleton') {
        const signature = extractSignature(line, language);
        if (signature) result.push(signature);
      }
      continue;
    }

    if (inFunction) {
      braceCount += countBraces(line);
      if (braceCount <= 0) {
        inFunction = false;
        functionSignature = null;
      }

      if (detailLevel === 'full') {
        result.push(line);
      }
      continue;
    }

    if (detailLevel === 'full') {
      result.push(line);
    }
  }

  return result.join('\n');
}

function isImportLine(line: string, language: string): boolean {
  const importPatterns = [
    /^import\s+/,
    /^from\s+\w+\s+import/,
    /^require\s*\(/,
    /^using\s+/,
    /^#include/,
    /^#import/,
    /^const\s+\w+\s+=\s+require\s*\(/,
  ];
  return importPatterns.some(pattern => pattern.test(line));
}

function isExportLine(line: string, language: string): boolean {
  const exportPatterns = [
    /^export\s+/,
    /^module\.exports\s*=/,
    /^exports\./,
    /^public\s+/,
  ];
  return exportPatterns.some(pattern => pattern.test(line));
}

function simplifyExport(line: string, language: string): string | null {
  const simplified = line.replace(/\{[\s\S]*\}/, '{ ... }');
  return simplified;
}

function isFunctionSignature(line: string, language: string): boolean {
  const patterns = [
    /^(export\s+)?(async\s+)?function\s+\w+\s*\(/,
    /^(export\s+)?(async\s+)?function\s*\(/,
    /^(export\s+)?const\s+\w+\s*=\s*(async\s*)?\(/,
    /^(export\s+)?(async\s+)?\w+\s*\([^)]*\)\s*{/,
    /^(export\s+)?(async\s+)?\w+\s*\([^)]*\)\s*:\s*\w+\s*{/,
    /^(export\s+)?class\s+\w+/,
    /^(export\s+)?interface\s+\w+/,
    /^(export\s+)?type\s+\w+\s*=/,
    /^(public|private|protected)\s+(async\s+)?\w+\s*\(/,
    /^\s*(async\s+)?def\s+\w+\s*\(/,
    /^func\s+\w+\s*\(/,
  ];
  return patterns.some(pattern => pattern.test(line));
}

function extractSignature(line: string, language: string): string | null {
  const signatureMatch = line.match(/^(.*\{)/);
  if (signatureMatch) {
    return signatureMatch[1] + ' ... }';
  }

  const arrowMatch = line.match(/^(.*=>).*$/);
  if (arrowMatch) {
    return arrowMatch[1] + ' ...;';
  }

  const classMatch = line.match(/^(export\s+)?class\s+\w+([^{]*)(\{)?/);
  if (classMatch) {
    return classMatch[1] || '' + 'class ' + line.match(/class\s+(\w+)/)?.[1] + ' { ... }';
  }

  const interfaceMatch = line.match(/^(export\s+)?interface\s+\w+/);
  if (interfaceMatch) {
    return line + ' { ... }';
  }

  return line + ';';
}

function countBraces(line: string): number {
  let count = 0;
  for (const char of line) {
    if (char === '{') count++;
    if (char === '}') count--;
  }
  return count;
}

function detectLanguage(content: string): string {
  if (content.includes('interface ') || content.includes(': string') || content.includes(': number')) {
    return 'typescript';
  }
  if (content.includes('def ') || content.includes('import ') && content.includes(':')) {
    return 'python';
  }
  if (content.includes('func ') || content.includes('package main')) {
    return 'go';
  }
  if (content.includes('fn ') || content.includes('let mut ')) {
    return 'rust';
  }
  return 'javascript';
}

function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

export function classifyFile(
  filePath: string,
  includePatterns: string[],
  compressPatterns: string[],
  directoryPatterns: string[],
  excludePatterns: string[]
): InclusionLevel {
  if (matchesPatterns(filePath, excludePatterns)) {
    return 'exclude';
  }

  if (matchesPatterns(filePath, directoryPatterns)) {
    return 'directory';
  }

  if (matchesPatterns(filePath, compressPatterns)) {
    return 'compress';
  }

  if (includePatterns.length === 0 || matchesPatterns(filePath, includePatterns)) {
    return 'full';
  }

  return 'exclude';
}

function matchesPatterns(filePath: string, patterns: string[]): boolean {
  if (patterns.length === 0) return false;

  return patterns.some(pattern => {
    const regex = globToRegex(pattern);
    return regex.test(filePath);
  });
}

function globToRegex(pattern: string): RegExp {
  let regex = pattern
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.')
    .replace(/\./g, '\\.')
    .replace('{{GLOBSTAR}}', '.*');

  return new RegExp(`^${regex}$`);
}
