import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, getPreset, listPresets } from '../src/config/configLoader.js';
import { processContent, classifyFile } from '../src/core/content/contentProcessor.js';
import { getGitBlame, formatGitBlame } from '../src/core/gitAnalyzer.js';
import { createVectorIndex, semanticSearch } from '../src/core/rag/vectorIndex.js';
import { scanMultiRepo, generateMultiRepoReport } from '../src/core/multiRepo/multiRepoScanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('v1.3.8 Features Integration Tests', () => {
  const testDir = path.join(__dirname, 'test-temp-v138');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Config System', () => {
    it('should load default config when file does not exist', () => {
      const result = loadConfig({ configPath: path.join(testDir, 'non-existent.json') });
      expect(result.config).toBeDefined();
      expect(result.source).toBe('default');
    });

    it('should load config from file', () => {
      const configPath = path.join(testDir, 'ai-first.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        version: '1.0',
        output: { directory: 'custom-ai' }
      }));

      const result = loadConfig({ configPath });
      expect(result.source).toBe('file');
      expect(result.config.output?.directory).toBe('custom-ai');
    });

    it('should apply preset configuration', () => {
      const result = loadConfig({
        configPath: path.join(testDir, 'non-existent.json'),
        preset: 'quick'
      });
      expect(result.source).toBe('preset');
    });

    it('should override config with overrides', () => {
      const configPath = path.join(testDir, 'ai-first.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        version: '1.0',
        output: { directory: 'from-file', formats: ['md'], prettyPrint: false }
      }));

      const result = loadConfig({
        configPath,
        overrides: {
          output: { directory: 'override', formats: ['md'], prettyPrint: true }
        }
      });

      expect(result.config.output?.directory).toBe('override');
      expect(result.config.output?.prettyPrint).toBe(true);
    });

    it('should list all 4 builtin presets', () => {
      const presets = listPresets();
      expect(presets.length).toBeGreaterThanOrEqual(4);
      expect(presets.some(p => p.name === 'full')).toBe(true);
      expect(presets.some(p => p.name === 'quick')).toBe(true);
      expect(presets.some(p => p.name === 'api')).toBe(true);
      expect(presets.some(p => p.name === 'docs')).toBe(true);
    });

    it('should get preset by name', () => {
      const preset = getPreset('quick');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('quick');
    });
  });

  describe('Content Processing', () => {
    it('should compress code with signatures mode', () => {
      const code = `
/**
 * Test function
 */
export function test(x: number): number {
  const result = x * 2;
  return result;
}
`;
      const result = processContent(code, { detailLevel: 'signatures' });
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.tokens).toBeLessThan(code.length / 4);
    });

    it('should not compress with full mode', () => {
      const code = 'function test() { return 42; }';
      const result = processContent(code, { detailLevel: 'full' });
      expect(result.compressionRatio).toBe(0);
      expect(result.processedLength).toBe(code.length);
    });

    it('should extract signatures from TypeScript', () => {
      const code = `
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export interface CartItem {
  price: number;
  quantity: number;
}
`;
      const result = processContent(code, { detailLevel: 'signatures' });
      expect(result.content).toContain('calculateTotal');
      expect(result.content).toContain('interface CartItem');
      expect(result.compressionRatio).toBeGreaterThan(40);
    });

    it('should classify files correctly', () => {
      expect(classifyFile('test.spec.js', ['src/**/*'], [], [], ['**/*.spec.js'])).toBe('exclude');
      expect(classifyFile('node_modules/lodash/index.js', ['src/**/*'], ['node_modules/**/*'], [], [])).toBe('compress');
    });
  });

  describe('Git Blame', () => {
    it('should return blame info for a file', () => {
      const result = getGitBlame('.', 'package.json');
      expect(result.filePath).toBe('package.json');
      expect(result.lines).toBeDefined();
      expect(result.lines.length).toBeGreaterThan(0);
    });

    it('should return authors map', () => {
      const result = getGitBlame('.', 'package.json');
      expect(result.authors).toBeInstanceOf(Map);
      expect(result.authors.size).toBeGreaterThan(0);
    });

    it('should format blame as inline', () => {
      const blame = getGitBlame('.', 'package.json');
      const formatted = formatGitBlame(blame, 'inline');
      expect(formatted).toContain('[');
      expect(formatted).toContain(']');
      expect(formatted.split('\n').length).toBeGreaterThan(1);
    });

    it('should format blame as block', () => {
      const blame = getGitBlame('.', 'package.json');
      const formatted = formatGitBlame(blame, 'block');
      expect(formatted).toContain('//');
    });
  });

  describe('RAG Vector Search', () => {
    it('should create vector index', () => {
      const indexPath = path.join(testDir, 'vector-index.json');
      const index = createVectorIndex(indexPath);
      expect(index).toBeDefined();
      expect(typeof index.addDocument).toBe('function');
    });

    it('should add and search documents', () => {
      const indexPath = path.join(testDir, 'vector-index.json');
      const index = createVectorIndex(indexPath);

      index.addDocument({
        id: '1',
        content: 'function authenticateUser() { }',
        embedding: Array(100).fill(0).map((_, i) => Math.sin(i * 0.1)),
        metadata: { filePath: 'auth.js', type: 'function' }
      });

      index.addDocument({
        id: '2',
        content: 'function processPayment() { }',
        embedding: Array(100).fill(0).map((_, i) => Math.cos(i * 0.1)),
        metadata: { filePath: 'payment.js', type: 'function' }
      });

      const results = semanticSearch(index, 'user authentication', 2);
      expect(results).toHaveLength(2);
      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].document).toBeDefined();
    });

    it('should save and load index', () => {
      const indexPath = path.join(testDir, 'vector-index.json');
      const index = createVectorIndex(indexPath);

      index.addDocument({
        id: '1',
        content: 'test',
        embedding: Array(100).fill(0.5),
        metadata: { filePath: 'test.js' }
      });

      index.save();
      expect(fs.existsSync(indexPath)).toBe(true);

      const index2 = createVectorIndex(indexPath);
      const results = semanticSearch(index2, 'test', 1);
      expect(results).toHaveLength(1);
    });
  });

  describe('Multi-Repository', () => {
    it('should scan current repository', () => {
      const context = scanMultiRepo({ repositories: ['.'] });
      expect(context.repositories).toHaveLength(1);
      expect(context.totalFiles).toBeGreaterThan(0);
      expect(context.repositories[0].files.length).toBeGreaterThan(0);
    });

    it('should generate markdown report', () => {
      const context = scanMultiRepo({ repositories: ['.'] });
      const report = generateMultiRepoReport(context);
      expect(report).toContain('# Multi-Repository Context');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Repositories');
    });

    it('should detect multiple repositories', () => {
      const repo1 = path.join(testDir, 'repo1');
      const repo2 = path.join(testDir, 'repo2');
      fs.mkdirSync(repo1, { recursive: true });
      fs.mkdirSync(repo2, { recursive: true });
      fs.writeFileSync(path.join(repo1, 'file1.js'), '');
      fs.writeFileSync(path.join(repo2, 'file2.js'), '');

      const context = scanMultiRepo({ repositories: [repo1, repo2] });
      expect(context.repositories).toHaveLength(2);
      expect(context.totalFiles).toBe(2);
    });
  });
});
