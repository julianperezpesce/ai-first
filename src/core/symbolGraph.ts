import fs from "fs";
import path from "path";
import crypto from "crypto";
import { scanRepo, FileInfo } from "./repoScanner.js";
import { extractSymbols, Symbol } from "../analyzers/symbols.js";
import { analyzeDependencies } from "../analyzers/dependencies.js";
import { readFile } from "../utils/fileUtils.js";

export type RelationshipType = "calls" | "called_by" | "imports" | "references" | "instantiates" | "extends" | "implements" | "exports";

export interface SymbolRelationship {
  symbolId: string;
  targetId: string;
  type: RelationshipType;
}

export interface SymbolGraph {
  symbols: Symbol[];
  relationships: SymbolRelationship[];
  bySymbol: Record<string, SymbolRelationship[]>;
}

// New interfaces for reverse references and file index
export interface SymbolReferences {
  [symbolId: string]: string[];  // Reverse lookup: who calls/imports this symbol
}

export interface FileIndex {
  [filePath: string]: {
    symbols: string[];  // Array of symbol IDs in this file
    module: string;
  };
}

export interface IndexCache {
  files: {
    [filePath: string]: {
      hash: string;
      mtime: number;
    };
  };
  lastIndexed: string;
}

// =============== MAIN GENERATOR ===============

/**
 * Generate symbol graph with extended relationships, reverse references, and file index
 */
export async function generateSymbolGraph(
  rootDir: string,
  outputDir: string,
  incremental: boolean = true
): Promise<{ success: boolean; error?: string }> {
  const graphDir = path.join(outputDir, "graph");
  
  // Ensure graph directory exists
  if (!fs.existsSync(graphDir)) {
    fs.mkdirSync(graphDir, { recursive: true });
  }

  console.log("\n🕸️  Generating symbol graph...\n");

  // Scan repository
  const scanResult = scanRepo(rootDir);
  const files = scanResult.files;

  // Check for incremental indexing
  const cache = loadCache(outputDir);
  const changedFiles = incremental ? getChangedFiles(files, cache, rootDir) : files.map(f => f.path);

  if (incremental && changedFiles.length === 0) {
    console.log("   ✅ No files changed, using cached index");
    return { success: true };
  }

  console.log(`   Processing ${changedFiles.length} files...`);

  // Extract symbols
  const symbolsAnalysis = extractSymbols(files);
  const symbols = symbolsAnalysis.symbols;

  // Analyze dependencies
  const depsAnalysis = analyzeDependencies(files);

  // Build symbol relationships with extended types
  const relationships = buildSymbolRelationships(symbols, depsAnalysis, files);

  // Build bySymbol index
  const bySymbol: Record<string, SymbolRelationship[]> = {};
  for (const rel of relationships) {
    if (!bySymbol[rel.symbolId]) {
      bySymbol[rel.symbolId] = [];
    }
    bySymbol[rel.symbolId].push(rel);
  }

  const graph: SymbolGraph = { symbols, relationships, bySymbol };

  // Write symbol graph
  const graphFile = path.join(graphDir, "symbol-graph.json");
  fs.writeFileSync(graphFile, JSON.stringify(graph, null, 2));
  console.log(`   ✅ Created ${path.basename(graphFile)}`);

  // Generate and write reverse references
  const reverseRefs = generateReverseReferences(relationships);
  const refsFile = path.join(graphDir, "symbol-references.json");
  fs.writeFileSync(refsFile, JSON.stringify(reverseRefs, null, 2));
  console.log(`   ✅ Created ${path.basename(refsFile)}`);

  // Generate and write file index
  const fileIndex = generateFileIndex(symbols);
  const filesIndexFile = path.join(outputDir, "files.json");
  fs.writeFileSync(filesIndexFile, JSON.stringify(fileIndex, null, 2));
  console.log(`   ✅ Created ${path.basename(filesIndexFile)}`);

  // Update cache
  saveCache(files, outputDir, rootDir);

  console.log(`   📦 Symbols: ${symbols.length}`);
  console.log(`   🔗 Relationships: ${relationships.length}`);

  return { success: true };
}

// =============== RELATIONSHIP BUILDING ===============

/**
 * Build symbol relationships with extended types
 */
function buildSymbolRelationships(
  symbols: Symbol[],
  depsAnalysis: ReturnType<typeof analyzeDependencies>,
  files: FileInfo[]
): SymbolRelationship[] {
  const relationships: SymbolRelationship[] = [];
  const symbolMap = new Map<string, Symbol>();

  // Build symbol lookup map
  for (const sym of symbols) {
    symbolMap.set(sym.id, sym);
    symbolMap.set(sym.name, sym);  // Also index by name
  }

  // 1. Process imports relationships
  for (const dep of depsAnalysis.dependencies) {
    const sourceSymbols = symbols.filter(s => s.file === dep.source);
    let targetSymbol = findTargetSymbol(dep.target, symbolMap, symbols);

    if (targetSymbol && sourceSymbols.length > 0) {
      for (const source of sourceSymbols) {
        relationships.push({
          symbolId: source.id,
          targetId: targetSymbol.id,
          type: "imports",
        });
      }
    }
  }

  // 2. Analyze function calls
  for (const file of files) {
    try {
      const content = readFile(file.path);
      const fileSymbols = symbols.filter(s => s.file === file.relativePath);
      
      // Find various relationships in the content
      const foundRelationships = analyzeFileRelationships(content, file.relativePath, fileSymbols, symbolMap);
      relationships.push(...foundRelationships);
    } catch {
      // Ignore read errors
    }
  }

  // 3. Build bidirectional relationships (called_by)
  buildBidirectionalRelationships(relationships);

  // 4. Add exports relationships
  const exportsRels = buildExportRelationships(symbols);
  relationships.push(...exportsRels);

  return relationships;
}

/**
 * Find target symbol from import path
 */
function findTargetSymbol(targetPath: string, symbolMap: Map<string, Symbol>, allSymbols?: Symbol[]): Symbol | undefined {
  // Try exact match
  let target = symbolMap.get(targetPath);
  
  // Try filename without extension
  if (!target) {
    const targetName = targetPath.replace(/\.[^.]+$/, '').split('/').pop();
    if (targetName) target = symbolMap.get(targetName);
  }

  // Try with module prefix
  if (!target) {
    const fileName = targetPath.split('/').pop()?.replace(/\.[^.]+$/, '');
    if (fileName) {
      for (const [id, sym] of symbolMap) {
        if (sym.name === fileName) {
          target = sym;
          break;
        }
      }
    }
  }

  // Try to find any symbol in the target file
  if (!target && allSymbols) {
    const targetFile = targetPath.replace(/\.[^.]+$/, '');
    const fileSymbols = allSymbols.filter(s => {
      const symFile = s.file.replace(/\.[^.]+$/, '');
      return symFile === targetFile || symFile.endsWith('/' + targetFile) || symFile.endsWith('/' + targetPath.replace(/\.[^.]+$/, ''));
    });
    
    if (fileSymbols.length > 0) {
      // Return the first exported symbol, or just the first one
      target = fileSymbols.find(s => s.export) || fileSymbols[0];
    }
  }

  return target;
}

/**
 * Analyze file content for various relationship types
 */
function analyzeFileRelationships(
  content: string,
  filePath: string,
  fileSymbols: Symbol[],
  symbolMap: Map<string, Symbol>
): SymbolRelationship[] {
  const relationships: SymbolRelationship[] = [];
  const ext = filePath.split('.').pop();

  if (!["ts", "tsx", "js", "jsx"].includes(ext || "")) {
    return relationships;
  }

  // Find function/class calls
  const calls = findFunctionCalls(content);
  for (const call of calls) {
    const caller = fileSymbols.find(s => s.name === call.caller && s.type === "function");
    const callee = symbolMap.get(call.callee);
    
    if (caller && callee) {
      relationships.push({
        symbolId: caller.id,
        targetId: callee.id,
        type: "calls",
      });
    }
  }

  // Find instantiates (new ClassName)
  const instantiates = findInstantiates(content);
  for (const inst of instantiates) {
    const caller = fileSymbols.find(s => s.name === inst.caller && (s.type === "function" || s.type === "class"));
    const instantiated = symbolMap.get(inst.className);
    
    if (caller && instantiated) {
      relationships.push({
        symbolId: caller.id,
        targetId: instantiated.id,
        type: "instantiates",
      });
    }
  }

  // Find extends
  const extendsRels = findExtends(content);
  for (const ext of extendsRels) {
    const subclass = fileSymbols.find(s => s.name === ext.subclass && s.type === "class");
    const superclass = symbolMap.get(ext.superclass);
    
    if (subclass && superclass) {
      relationships.push({
        symbolId: subclass.id,
        targetId: superclass.id,
        type: "extends",
      });
    }
  }

  // Find implements
  const implementsRels = findImplements(content);
  for (const impl of implementsRels) {
    const implClass = fileSymbols.find(s => s.name === impl.className && s.type === "class");
    const interfaceSym = symbolMap.get(impl.interfaceName);
    
    if (implClass && interfaceSym) {
      relationships.push({
        symbolId: implClass.id,
        targetId: interfaceSym.id,
        type: "implements",
      });
    }
  }

  // Find references (variable usages)
  const references = findReferences(content, fileSymbols);
  for (const ref of references) {
    const referencer = fileSymbols.find(s => s.name === ref.referrer && s.type !== undefined);
    const referenced = symbolMap.get(ref.target);
    
    if (referencer && referenced) {
      relationships.push({
        symbolId: referencer.id,
        targetId: referenced.id,
        type: "references",
      });
    }
  }

  return relationships;
}

/**
 * Find function calls
 */
function findFunctionCalls(content: string): { caller: string; callee: string }[] {
  const calls: { caller: string; callee: string }[] = [];
  
  // Simple call detection
  const callMatches = content.matchAll(/(\w+)\s*\([^)]*\)\s*[;{]/g);
  for (const match of callMatches) {
    const callee = match[1];
    if (callee && !['if', 'for', 'while', 'switch', 'return', 'console', 'require', 'import', 'export', 'async', 'await', 'throw', 'new'].includes(callee)) {
      calls.push({ caller: "", callee });
    }
  }
  
  return calls;
}

/**
 * Find instantiates (new ClassName)
 */
function findInstantiates(content: string): { caller: string; className: string }[] {
  const instantiates: { caller: string; className: string }[] = [];
  
  const matches = content.matchAll(/new\s+(\w+)/g);
  for (const match of matches) {
    instantiates.push({ caller: "", className: match[1] });
  }
  
  return instantiates;
}

/**
 * Find extends relationships
 */
function findExtends(content: string): { subclass: string; superclass: string }[] {
  const extendsRels: { subclass: string; superclass: string }[] = [];
  
  const matches = content.matchAll(/class\s+(\w+)\s+extends\s+(\w+)/g);
  for (const match of matches) {
    extendsRels.push({ subclass: match[1], superclass: match[2] });
  }
  
  return extendsRels;
}

/**
 * Find implements relationships
 */
function findImplements(content: string): { className: string; interfaceName: string }[] {
  const implementsRels: { className: string; interfaceName: string }[] = [];
  
  const matches = content.matchAll(/class\s+(\w+)\s+implements\s+(\w+)/g);
  for (const match of matches) {
    implementsRels.push({ className: match[1], interfaceName: match[2] });
  }
  
  return implementsRels;
}

/**
 * Find references (variable references)
 */
function findReferences(content: string, fileSymbols: Symbol[]): { referrer: string; target: string }[] {
  const references: { referrer: string; target: string }[] = [];
  const definedNames = new Set(fileSymbols.map(s => s.name));
  
  // Find variable usages
  const varUsages = content.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(\w+)/g);
  for (const match of varUsages) {
    const varName = match[1];
    const value = match[2];
    if (definedNames.has(value)) {
      references.push({ referrer: varName, target: value });
    }
  }
  
  return references;
}

/**
 * Build bidirectional relationships
 */
function buildBidirectionalRelationships(relationships: SymbolRelationship[]): void {
  const callsMap = new Map<string, Set<string>>();
  
  // Collect calls
  for (const rel of relationships) {
    if (rel.type === "calls") {
      if (!callsMap.has(rel.targetId)) {
        callsMap.set(rel.targetId, new Set());
      }
      callsMap.get(rel.targetId)?.add(rel.symbolId);
    }
  }

  // Add called_by relationships
  for (const [calleeId, callers] of callsMap) {
    for (const callerId of callers) {
      const exists = relationships.some(
        r => r.symbolId === calleeId && r.targetId === callerId && r.type === "called_by"
      );
      if (!exists) {
        relationships.push({
          symbolId: calleeId,
          targetId: callerId,
          type: "called_by",
        });
      }
    }
  }
}

/**
 * Build export relationships
 */
function buildExportRelationships(symbols: Symbol[]): SymbolRelationship[] {
  const relationships: SymbolRelationship[] = [];
  const exportedSymbols = symbols.filter(s => s.export);
  
  for (const sym of exportedSymbols) {
    // Each exported symbol "exports" itself
    relationships.push({
      symbolId: sym.id,
      targetId: sym.id,
      type: "exports",
    });
  }
  
  return relationships;
}

// =============== REVERSE REFERENCES ===============

/**
 * Generate reverse lookup index
 */
function generateReverseReferences(relationships: SymbolRelationship[]): SymbolReferences {
  const refs: SymbolReferences = {};
  
  for (const rel of relationships) {
    // Skip self-references
    if (rel.symbolId === rel.targetId) continue;
    
    if (!refs[rel.targetId]) {
      refs[rel.targetId] = [];
    }
    
    // Add source as a referencer
    if (!refs[rel.targetId].includes(rel.symbolId)) {
      refs[rel.targetId].push(rel.symbolId);
    }
  }
  
  return refs;
}

// =============== FILE INDEX ===============

/**
 * Generate file index with symbol mappings
 */
function generateFileIndex(symbols: Symbol[]): FileIndex {
  const index: FileIndex = {};
  
  for (const sym of symbols) {
    const filePath = sym.file;
    const module = filePath.split('/')[0];
    
    if (!index[filePath]) {
      index[filePath] = {
        symbols: [],
        module: module,
      };
    }
    
    if (!index[filePath].symbols.includes(sym.id)) {
      index[filePath].symbols.push(sym.id);
    }
  }
  
  return index;
}

// =============== CACHE ===============

/**
 * Load cache for incremental indexing
 */
function loadCache(outputDir: string): IndexCache | null {
  const cacheFile = path.join(outputDir, "cache.json");
  
  if (!fs.existsSync(cacheFile)) {
    return null;
  }
  
  try {
    return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Get list of changed files
 */
function getChangedFiles(files: FileInfo[], cache: IndexCache | null, rootDir: string): string[] {
  if (!cache) return files.map(f => f.path);
  
  const changed: string[] = [];
  
  for (const file of files) {
    const filePath = file.relativePath;
    const cached = cache.files[filePath];
    
    if (!cached) {
      // New file
      changed.push(file.path);
      continue;
    }
    
    try {
      const stats = fs.statSync(file.path);
      const currentHash = computeFileHash(file.path);
      
      if (currentHash !== cached.hash || stats.mtimeMs > cached.mtime) {
        changed.push(file.path);
      }
    } catch {
      changed.push(file.path);
    }
  }
  
  return changed;
}

/**
 * Save cache for incremental indexing
 */
function saveCache(files: FileInfo[], outputDir: string, rootDir: string): void {
  const cache: IndexCache = {
    files: {},
    lastIndexed: new Date().toISOString(),
  };
  
  for (const file of files) {
    try {
      const hashData = computeFileHash(file.path);
      const stats = fs.statSync(file.path);
      
      cache.files[file.relativePath] = {
        hash: hashData,
        mtime: stats.mtimeMs,
      };
    } catch {
      // Skip files that can't be read
    }
  }
  
  const cacheFile = path.join(outputDir, "cache.json");
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
}

/**
 * Compute file hash
 */
function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

// =============== LOAD FUNCTIONS ===============

/**
 * Load symbol graph from file
 */
export function loadSymbolGraph(aiDir: string): SymbolGraph | null {
  const graphFile = path.join(aiDir, "graph", "symbol-graph.json");
  
  if (!fs.existsSync(graphFile)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(graphFile, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Load reverse references
 */
export function loadSymbolReferences(aiDir: string): SymbolReferences | null {
  const refsFile = path.join(aiDir, "graph", "symbol-references.json");
  
  if (!fs.existsSync(refsFile)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(refsFile, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Load file index
 */
export function loadFileIndex(aiDir: string): FileIndex | null {
  const indexFile = path.join(aiDir, "files.json");
  
  if (!fs.existsSync(indexFile)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(indexFile, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Get context for a specific symbol
 */
export function getSymbolContext(symbolId: string, aiDir: string): SymbolRelationship[] {
  const graph = loadSymbolGraph(aiDir);
  if (!graph) return [];
  
  return graph.bySymbol[symbolId] || [];
}

/**
 * Get reverse references for a symbol
 */
export function getSymbolReferrers(symbolId: string, aiDir: string): string[] {
  const refs = loadSymbolReferences(aiDir);
  if (!refs) return [];
  
  return refs[symbolId] || [];
}
