import { FileInfo } from "./repoScanner.js";
import { extractSymbols, type SymbolsAnalysis, type Symbol as CodeSymbol } from "../analyzers/symbols.js";
import { parserRegistry, createSymbolFromParsed } from "./parsers/index.js";
import { architectureDetector, type ArchitectureAnalysis } from "./analysis/architectureDetector.js";
import { dependencyAnalyzer, type DependencyGraph } from "./analysis/dependencyAnalyzer.js";
import { aiContextGenerator } from "./generation/aiContextGenerator.js";
import { flowGenerator } from "./generation/flowGenerator.js";
import { architectureGenerator } from "./generation/architectureGenerator.js";
import { readFile } from "../utils/fileUtils.js";

export interface AnalysisResult {
  symbols: SymbolsAnalysis;
  architecture: ArchitectureAnalysis;
  dependencyGraph: DependencyGraph;
  aiContext: string;
  architectureDoc: string;
  flows: Array<{
    name: string;
    type: string;
    files: string[];
    layers: string[];
  }>;
  metrics: {
    duration: number;
    filesProcessed: number;
    symbolsExtracted: number;
    cacheHitRate: number;
  };
}

interface CacheEntry {
  symbols: CodeSymbol[];
  mtime: number;
}

export class AnalysisPipeline {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = { cacheHits: 0, cacheMisses: 0 };

  async run(files: FileInfo[], projectName: string): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      const symbols = this.extractSymbolsWithAST(files);
      
      const cacheHitRate = this.stats.cacheHits + this.stats.cacheMisses > 0 
        ? Math.round((this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100)
        : 0;
      
      const dependencyGraph = this.buildDependencyGraph(symbols);
      
      const architecture = architectureDetector.detect(
        symbols.symbols,
        { edges: dependencyGraph.edges }
      );

      const flows = flowGenerator.generateFlows(
        architecture.entryPoints,
        symbols.symbols,
        { edges: dependencyGraph.edges },
        { edges: [] },
        { edges: [] }
      );

      const aiContext = aiContextGenerator.generate({
        architecture,
        symbols: symbols.symbols,
        dependencies: {
          totalDependencies: dependencyGraph.edges.length,
          dependencies: dependencyGraph.edges.map((e) => ({
            source: e.from,
            target: e.to,
            type: e.type,
          })),
        },
        projectName,
      });

      const architectureDoc = architectureGenerator.generate(architecture, dependencyGraph);

      const duration = Date.now() - startTime;

      return {
        symbols,
        architecture,
        dependencyGraph,
        aiContext,
        architectureDoc,
        flows: flows.map((f) => ({
          name: f.name,
          type: f.type,
          files: f.files.map((fi) => fi.path),
          layers: f.layers,
        })),
        metrics: {
          duration,
          filesProcessed: files.length,
          symbolsExtracted: symbols.symbols.length,
          cacheHitRate,
        },
      };
    } catch (error) {
      console.error("Analysis pipeline failed:", error);
      throw error;
    }
  }

  private extractSymbolsWithAST(files: FileInfo[]): SymbolsAnalysis {
    const allSymbols: SymbolsAnalysis["symbols"] = [];
    const byFile: Record<string, SymbolsAnalysis["symbols"]> = {};

    const BATCH_SIZE = 50;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      
      const batchResults = batch.map(file => {
        const cached = this.getCachedSymbols(file);
        if (cached) {
          return { filePath: file.relativePath, symbols: cached };
        }
        return this.processFile(file);
      });

      for (const result of batchResults) {
        if (result && result.symbols.length > 0) {
          allSymbols.push(...result.symbols);
          byFile[result.filePath] = result.symbols;
        }
      }
    }

    const byId: Record<string, (typeof allSymbols)[0]> = {};
    for (const sym of allSymbols) {
      byId[sym.id] = sym;
    }

    const byType: Record<string, typeof allSymbols> = {};
    for (const sym of allSymbols) {
      if (!byType[sym.type]) byType[sym.type] = [];
      byType[sym.type].push(sym);
    }

    return {
      symbols: allSymbols,
      byId,
      byFile,
      byType,
    };
  }

  private getCachedSymbols(file: FileInfo): CodeSymbol[] | null {
    const cached = this.cache.get(file.path);
    if (cached) {
      this.stats.cacheHits++;
      return cached.symbols;
    }
    return null;
  }

  private processFile(file: FileInfo): { filePath: string; symbols: CodeSymbol[] } | null {
    this.stats.cacheMisses++;
    const ext = "." + file.extension;
    let symbols: CodeSymbol[] = [];

    try {
      if (parserRegistry.hasParser(ext)) {
        const content = readFile(file.path);
        const parsed = parserRegistry.parse(file.relativePath, content, ext);
        
        if (parsed) {
          symbols = createSymbolFromParsed(parsed, file.relativePath);
        }
      } else {
        const existing = extractSymbols([file]);
        symbols = existing.symbols;
      }

      this.cache.set(file.path, { symbols, mtime: Date.now() });
      
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }

      return { filePath: file.relativePath, symbols };
    } catch (error) {
      console.warn(`Failed to process ${file.path}:`, error);
      const fallbackSymbols = this.fallbackToRegex(file);
      return { filePath: file.relativePath, symbols: fallbackSymbols };
    }
  }

  private fallbackToRegex(file: FileInfo): CodeSymbol[] {
    const existing = extractSymbols([file]);
    return existing.symbols;
  }

  private buildDependencyGraph(symbols: SymbolsAnalysis): DependencyGraph {
    const files: Array<{ filePath: string; imports: Array<{ name: string; module: string; isDefault?: boolean }>; exports: string[] }> = [];

    for (const [filePath, fileSymbols] of Object.entries(symbols.byFile)) {
      const imports: Array<{ name: string; module: string; isDefault?: boolean }> = [];
      const exports: string[] = [];

      for (const sym of fileSymbols) {
        if (sym.export) {
          exports.push(sym.name);
        }
      }

      files.push({ filePath, imports, exports });
    }

    return dependencyAnalyzer.buildDependencyGraph(files);
  }

  clearCache(): void {
    this.cache.clear();
    this.stats = { cacheHits: 0, cacheMisses: 0 };
  }

  getMetrics(): { 
    cacheSize: number; 
    cacheHits: number; 
    cacheMisses: number;
    cacheHitRate: number;
  } {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRate = total > 0 ? Math.round((this.stats.cacheHits / total) * 100) : 0;
    return { 
      cacheSize: this.cache.size, 
      cacheHits: this.stats.cacheHits, 
      cacheMisses: this.stats.cacheMisses,
      cacheHitRate,
    };
  }
}

export const analysisPipeline = new AnalysisPipeline();
