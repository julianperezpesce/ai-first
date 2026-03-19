/**
 * Incremental Analyzer
 * 
 * Performs incremental updates to repository intelligence when files change,
 * without requiring a full re-analysis.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { writeFile, readJsonFile } from "../utils/fileUtils.js";
import { computeFileHash, loadIndexState, saveIndexState, FileState } from "./indexState.js";
import { extractSymbols } from "../analyzers/symbols.js";
import { FileInfo } from "./repoScanner.js";
import { buildKnowledgeGraph } from "./knowledgeGraphBuilder.js";

export interface ChangedFile {
  path: string;
  status: "added" | "modified" | "deleted";
  hash?: string;
}

export interface IncrementalUpdateResult {
  changedFiles: ChangedFile[];
  updatedSymbols: number;
  updatedDependencies: number;
  updatedFeatures: string[];
  updatedFlows: string[];
  graphUpdated: boolean;
  errors: string[];
}

// ============================================================
// File Change Detection
// ============================================================

export function detectChangedFiles(rootDir: string, useGit: boolean = true): ChangedFile[] {
  if (useGit && isGitRepository(rootDir)) {
    return detectChangesWithGit(rootDir);
  }
  return detectChangesWithTimestamps(rootDir);
}

function isGitRepository(rootDir: string): boolean {
  return fs.existsSync(path.join(rootDir, ".git"));
}

function detectChangesWithGit(rootDir: string): ChangedFile[] {
  const changes: ChangedFile[] = [];
  
  try {
    const output = execSync("git diff --name-status HEAD", {
      cwd: rootDir,
      encoding: "utf-8"
    });
    
    for (const line of output.split("\n")) {
      if (!line.trim()) continue;
      const [status, filePath] = line.split("\t").map(s => s.trim());
      if (!filePath) continue;
      
      let changeStatus: "added" | "modified" | "deleted" = "modified";
      if (status.startsWith("A") || status === "??") changeStatus = "added";
      else if (status.startsWith("D")) changeStatus = "deleted";
      
      changes.push({ path: filePath, status: changeStatus });
    }
    
    const stagedOutput = execSync("git diff --name-status --cached", {
      cwd: rootDir,
      encoding: "utf-8"
    });
    
    for (const line of stagedOutput.split("\n")) {
      if (!line.trim()) continue;
      const [status, filePath] = line.split("\t").map(s => s.trim());
      if (!filePath || changes.find(c => c.path === filePath)) continue;
      changes.push({ path: filePath, status: "modified" });
    }
  } catch {
    return detectChangesWithTimestamps(rootDir);
  }
  
  return changes;
}

function detectChangesWithTimestamps(rootDir: string): ChangedFile[] {
  const changes: ChangedFile[] = [];
  const aiDir = path.join(rootDir, ".ai-dev");
  const state = loadIndexState(aiDir);
  
  if (!state) return [];
  
  for (const [filePath, fileState] of Object.entries(state.files)) {
    const fullPath = path.join(rootDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      changes.push({ path: filePath, status: "deleted" });
      continue;
    }
    
    const currentHash = computeFileHash(fullPath);
    if (currentHash && currentHash.hash !== fileState.hash) {
      changes.push({ path: filePath, status: "modified", hash: currentHash.hash });
    }
  }
  
  return changes;
}

// ============================================================
// Symbol Update
// ============================================================

export function updateSymbols(rootDir: string, changedFiles: ChangedFile[], aiDir: string): number {
  const symbolsPath = path.join(aiDir, "symbols.json");
  
  // Read existing symbols.json structure
  interface SymbolsIndex {
    [id: string]: { name: string; type: string; file: string; line?: number; module?: string; export?: boolean };
  }
  interface SymbolsData {
    symbols: SymbolsIndex;
    total: number;
    byType: { [type: string]: Array<{ id: string; name: string; type: string; file: string; line?: number; export?: boolean }> };
    byFile: { [file: string]: Array<{ id: string; name: string; type: string; file: string; line?: number; export?: boolean }> };
    exported: Array<{ id: string; name: string; type: string; file: string; line?: number; export?: boolean }>;
  }
  
  let symbolsData: SymbolsData | null = null;
  
  if (fs.existsSync(symbolsPath)) {
    try {
      const raw = readJsonFile(symbolsPath);
      if (!Array.isArray(raw) && raw && typeof raw === 'object') {
        symbolsData = raw as unknown as SymbolsData;
      }
    } catch { }
  }
  
  // If no valid symbols.json exists, nothing to update
  if (!symbolsData) {
    return 0;
  }
  
  const changedPaths = new Set(changedFiles.map(f => f.path));
  
  // Remove symbols from changed files
  for (const filePath of changedPaths) {
    delete symbolsData.byFile[filePath];
    for (const type of Object.keys(symbolsData.byType)) {
      symbolsData.byType[type] = symbolsData.byType[type].filter(
        sym => sym.file !== filePath
      );
    }
    symbolsData.exported = symbolsData.exported.filter(sym => sym.file !== filePath);
    // Remove from symbols index
    const keysToDelete = Object.keys(symbolsData.symbols).filter(
      id => id.startsWith(filePath + '#')
    );
    for (const key of keysToDelete) {
      delete symbolsData.symbols[key];
    }
  }
  
  // Extract and add new symbols from changed files
  for (const changed of changedFiles) {
    if (changed.status === "deleted") continue;
    const fullPath = path.join(rootDir, changed.path);
    if (!fs.existsSync(fullPath)) continue;
    
    try {
      const fileInfo: FileInfo = {
        path: fullPath,
        relativePath: changed.path,
        extension: path.extname(changed.path),
        name: path.basename(changed.path, path.extname(changed.path))
      };
      const symbols = extractSymbols([fileInfo]);
      
      for (const symbol of symbols.symbols || []) {
        const id = `${changed.path}#${symbol.name}`;
        
        // Add to symbols index
        symbolsData.symbols[id] = {
          name: symbol.name,
          type: symbol.type,
          file: changed.path,
          line: symbol.line,
          module: changed.path.split('/')[0],
          export: symbol.export
        };
        
        // Add to byFile
        if (!symbolsData.byFile[changed.path]) {
          symbolsData.byFile[changed.path] = [];
        }
        symbolsData.byFile[changed.path].push({
          id,
          name: symbol.name,
          type: symbol.type,
          file: changed.path,
          line: symbol.line,
          export: symbol.export
        });
        
        // Add to byType
        if (!symbolsData.byType[symbol.type]) {
          symbolsData.byType[symbol.type] = [];
        }
        symbolsData.byType[symbol.type].push({
          id,
          name: symbol.name,
          type: symbol.type,
          file: changed.path,
          line: symbol.line,
          export: symbol.export
        });
        
        // Add to exported if applicable
        if (symbol.export) {
          symbolsData.exported.push({
            id,
            name: symbol.name,
            type: symbol.type,
            file: changed.path,
            line: symbol.line,
            export: symbol.export
          });
        }
      }
    } catch { /* skip */ }
  }
  
  // Update total
  symbolsData.total = Object.keys(symbolsData.symbols).length;
  
  writeFile(symbolsPath, JSON.stringify(symbolsData, null, 2));
  return symbolsData.total;
}

// ============================================================
// Dependency Update
// ============================================================

export function updateDependencies(rootDir: string, changedFiles: ChangedFile[], aiDir: string): number {
  const depsPath = path.join(aiDir, "dependencies.json");
  let existingDeps: Record<string, unknown> = {};
  
  if (fs.existsSync(depsPath)) {
    try { existingDeps = readJsonFile(depsPath) as typeof existingDeps; } catch { /* ignore */ }
  }
  
  const packageFiles = changedFiles.filter(f => 
    f.path.endsWith("package.json") || f.path.endsWith("requirements.txt")
  );
  
  for (const pkgFile of packageFiles) {
    const fullPath = path.join(rootDir, pkgFile.path);
    if (!fs.existsSync(fullPath)) continue;
    
    try {
      if (pkgFile.path.endsWith("package.json")) {
        const pkg = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        existingDeps.dependencies = pkg.dependencies || {};
        existingDeps.devDependencies = pkg.devDependencies || {};
      }
    } catch { /* skip */ }
  }
  
  writeFile(depsPath, JSON.stringify(existingDeps, null, 2));
  return Object.keys(existingDeps.dependencies as object || {}).length;
}

// ============================================================
// Feature Update
// ============================================================

export function updateFeatures(rootDir: string, changedFiles: ChangedFile[], aiDir: string): string[] {
  const changedPaths = new Set(changedFiles.map(f => f.path));
  const featuresDir = path.join(aiDir, "context", "features");
  const updatedFeatures: string[] = [];
  
  if (!fs.existsSync(featuresDir)) return updatedFeatures;
  
  try {
    for (const featureFile of fs.readdirSync(featuresDir)) {
      if (!featureFile.endsWith(".json")) continue;
      
      const featurePath = path.join(featuresDir, featureFile);
      const featureData = readJsonFile(featurePath) as {name: string; files?: string[]};
      if (!featureData?.files) continue;
      
      const featureFileSet = new Set(featureData.files);
      const affected = [...changedPaths].some(f => featureFileSet.has(f));
      
      if (affected || changedFiles.some(c => c.status === "deleted")) {
        const featureFilesList = featureData.files.filter(f => 
          !changedFiles.some(c => c.path === f && c.status === "deleted")
        );
        
        if (featureFilesList.length > 0) {
          featureData.files = featureFilesList;
          writeFile(featurePath, JSON.stringify(featureData, null, 2));
        } else {
          fs.unlinkSync(featurePath);
        }
        updatedFeatures.push(featureData.name);
      }
    }
  } catch { /* ignore */ }
  
  return updatedFeatures;
}

// ============================================================
// Flow Update
// ============================================================

export function updateFlows(rootDir: string, changedFiles: ChangedFile[], aiDir: string): string[] {
  const changedPaths = new Set(changedFiles.map(f => f.path));
  const flowsDir = path.join(aiDir, "context", "flows");
  const updatedFlows: string[] = [];
  
  if (!fs.existsSync(flowsDir)) return updatedFlows;
  
  try {
    for (const flowFile of fs.readdirSync(flowsDir)) {
      if (!flowFile.endsWith(".json")) continue;
      
      const flowPath = path.join(flowsDir, flowFile);
      const flowData = readJsonFile(flowPath) as {name: string; files?: string[]};
      if (!flowData?.files) continue;
      
      const flowFileSet = new Set(flowData.files);
      const affected = [...changedPaths].some(f => flowFileSet.has(f));
      
      if (affected || changedFiles.some(c => c.status === "deleted")) {
        const flowFilesList = flowData.files.filter(f => 
          !changedFiles.some(c => c.path === f && c.status === "deleted")
        );
        
        if (flowFilesList.length > 0) {
          flowData.files = flowFilesList;
          writeFile(flowPath, JSON.stringify(flowData, null, 2));
        } else {
          fs.unlinkSync(flowPath);
        }
        updatedFlows.push(flowData.name);
      }
    }
  } catch { /* ignore */ }
  
  return updatedFlows;
}

// ============================================================
// Knowledge Graph Update
// ============================================================

export function updateKnowledgeGraph(rootDir: string, aiDir: string): boolean {
  try {
    buildKnowledgeGraph(rootDir, aiDir);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Main Incremental Update
// ============================================================

export function runIncrementalUpdate(rootDir: string, aiDir?: string): IncrementalUpdateResult {
  const targetAiDir = aiDir || path.join(rootDir, ".ai-dev");
  const errors: string[] = [];
  
  if (!fs.existsSync(targetAiDir)) {
    return {
      changedFiles: [],
      updatedSymbols: 0,
      updatedDependencies: 0,
      updatedFeatures: [],
      updatedFlows: [],
      graphUpdated: false,
      errors: ["AI context directory does not exist. Run 'ai-first init' first."]
    };
  }
  
  const changedFiles = detectChangedFiles(rootDir);
  
  if (changedFiles.length === 0) {
    return {
      changedFiles: [],
      updatedSymbols: 0,
      updatedDependencies: 0,
      updatedFeatures: [],
      updatedFlows: [],
      graphUpdated: false,
      errors: []
    };
  }
  
  let updatedSymbols = 0;
  try { updatedSymbols = updateSymbols(rootDir, changedFiles, targetAiDir); }
  catch (e) { errors.push(`Failed to update symbols: ${e}`); }
  
  let updatedDependencies = 0;
  try { updatedDependencies = updateDependencies(rootDir, changedFiles, targetAiDir); }
  catch (e) { errors.push(`Failed to update dependencies: ${e}`); }
  
  let updatedFeatures: string[] = [];
  try { updatedFeatures = updateFeatures(rootDir, changedFiles, targetAiDir); }
  catch (e) { errors.push(`Failed to update features: ${e}`); }
  
  let updatedFlows: string[] = [];
  try { updatedFlows = updateFlows(rootDir, changedFiles, targetAiDir); }
  catch (e) { errors.push(`Failed to update flows: ${e}`); }
  
  let graphUpdated = false;
  try { graphUpdated = updateKnowledgeGraph(rootDir, targetAiDir); }
  catch (e) { errors.push(`Failed to update knowledge graph: ${e}`); }
  
  try { updateIndexState(rootDir, changedFiles); }
  catch { /* non-critical */ }
  
  return {
    changedFiles,
    updatedSymbols,
    updatedDependencies,
    updatedFeatures,
    updatedFlows,
    graphUpdated,
    errors
  };
}

function updateIndexState(rootDir: string, changedFiles: ChangedFile[]): void {
  const aiDir = path.join(rootDir, ".ai-dev");
  let state = loadIndexState(aiDir);
  
  if (!state) {
    state = { version: "1.0.0", lastIndexed: new Date().toISOString(), totalFiles: 0, files: {} };
  }
  
  const filesMap = new Map<string, FileState>(Object.entries(state.files));
  
  for (const changed of changedFiles) {
    const fullPath = path.join(rootDir, changed.path);
    
    if (changed.status === "deleted") {
      filesMap.delete(changed.path);
    } else if (fs.existsSync(fullPath)) {
      const hashData = computeFileHash(fullPath);
      if (hashData) {
        filesMap.set(changed.path, {
          path: changed.path,
          hash: hashData.hash,
          mtime: hashData.mtime,
          size: hashData.size,
          indexedAt: new Date().toISOString()
        });
      }
    }
  }
  
  state.files = Object.fromEntries(filesMap);
  state.totalFiles = filesMap.size;
  state.lastIndexed = new Date().toISOString();
  
  saveIndexState(aiDir, filesMap);
}
