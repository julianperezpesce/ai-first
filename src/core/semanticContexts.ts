import fs from "fs";
import path from "path";
import { ensureDir, writeFile, readJsonFile } from "../utils/fileUtils.js";
import { DEFAULT_ADAPTER, type AnalysisAdapter } from "./adapters/baseAdapter.js";

export interface Feature {
  name: string;
  path: string;
  files: string[];
  entrypoints: string[];
  dependencies: string[];
}

export interface Flow {
  name: string;
  entrypoint: string;
  files: string[];
  depth: number;
  layers: string[];
}

export interface SemanticContexts {
  features: Feature[];
  flows: Flow[];
}

// Use DEFAULT_ADAPTER which has universal patterns for ALL languages/frameworks
const ADAPTER = DEFAULT_ADAPTER;

const CANDIDATE_ROOTS = ADAPTER.featureRoots;
const IGNORED_FOLDERS = new Set(ADAPTER.ignoredFolders);
const ENTRYPOINT_PATTERNS = ADAPTER.entrypointPatterns;
const FLOW_ENTRY_PATTERNS = ADAPTER.flowEntrypointPatterns;
const FLOW_EXCLUDE = new Set(ADAPTER.flowExcludePatterns);

const LAYER_PATTERNS: Record<string, string[]> = {};
for (const layer of ADAPTER.layerRules) {
  LAYER_PATTERNS[layer.name] = layer.patterns;
}

const LAYER_PRIORITY: Record<string, number> = {};
for (const layer of ADAPTER.layerRules) {
  for (const pattern of layer.patterns) {
    LAYER_PRIORITY[pattern] = layer.priority;
  }
}

const MAX_FLOW_DEPTH = 5;
const MAX_FLOW_FILES = 30;

const SOURCE_EXTENSIONS = new Set(ADAPTER.supportedExtensions);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function sanitizeFlowName(name: string): string {
  return name
    .replace(/\.\.+/g, ".")
    .replace(/_+$/g, "")
    .replace(/[^\w\-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "unnamed";
}

function isSourceFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SOURCE_EXTENSIONS.has(ext);
}

function isEntrypoint(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  // Check both filename and directory path
  const basename = path.basename(filePath).toLowerCase();
  return ENTRYPOINT_PATTERNS.some(pattern => 
    basename.includes(pattern) || lower.includes("/" + pattern + "s/")
  );
}

function isFlowEntrypoint(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  const basename = path.basename(filePath).toLowerCase();
  return FLOW_ENTRY_PATTERNS.some(pattern => 
    basename.includes(pattern) || lower.includes("/" + pattern + "s/")
  );
}

function isIgnoredFolder(folderName: string): boolean {
  return IGNORED_FOLDERS.has(folderName.toLowerCase());
}

function isFlowExcluded(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return Array.from(FLOW_EXCLUDE).some(p => lower.includes("/" + p) || lower.includes("\\" + p));
}

function getLayer(filePath: string): string {
  const parts = filePath.split(/[/\\]/).map(s => 
    s.toLowerCase().replace(/\.(ts|js|tsx|jsx)$/, "")
  );
  
  for (const [layer, patterns] of Object.entries(LAYER_PATTERNS)) {
    if (parts.some(s => patterns.includes(s))) {
      return layer;
    }
  }
  return "unknown";
}

function getLayerPriority(filePath: string): number {
  const parts = [...filePath.split(/[/\\]/)].reverse();
  for (const p of parts) {
    const name = p.replace(/\.(ts|js|tsx|jsx)$/, "").toLowerCase();
    if (LAYER_PRIORITY[name] !== undefined) {
      return LAYER_PRIORITY[name];
    }
  }
  return 99;
}

// ============================================================
// FEATURE DETECTION ALGORITHM
// ============================================================

/**
 * Find feature candidates by scanning file paths
 * 
 * Rules:
 * - Scan inside: src/*, app/*, packages/*, services/*, modules/*, features/*
 * - Ignore: utils, helpers, types, interfaces, constants, config, dto, models, common, shared
 * - Support depth 1 and 2: src/auth, src/modules/auth
 * - Must have ≥3 source files and ≥1 entrypoint
 */
function findFeatureCandidates(files: string[]): Map<string, string[]> {
  const candidates = new Map<string, string[]>();

  for (const file of files) {
    const parts = file.split("/");
    
    // Find candidate root index
    const rootIdx = parts.findIndex(p => 
      CANDIDATE_ROOTS.includes(p.toLowerCase())
    );
    
    if (rootIdx === -1) continue;
    
    // Check depth 0: controllers/ itself is a feature (when file is directly in root)
    const depth0FeatureIdx = rootIdx;
    if (depth0FeatureIdx < parts.length - 1) {
      const featureName0 = parts[depth0FeatureIdx];
      if (!isIgnoredFolder(featureName0) && !featureName0.includes(".")) {
        const featurePath0 = parts.slice(0, depth0FeatureIdx + 1).join("/");
        if (!candidates.has(featurePath0)) {
          candidates.set(featurePath0, []);
        }
        candidates.get(featurePath0)!.push(file);
      }
    }
    
    // Check depth 1 and 2: src/auth, src/modules/auth
    for (let depth = 1; depth <= 2; depth++) {
      const featureIdx = rootIdx + depth;
      
      // Don't go beyond array bounds
      if (featureIdx >= parts.length - 1) continue;
      
      const featureName = parts[featureIdx];
      
      // Skip ignored folders
      if (isIgnoredFolder(featureName)) continue;
      
      // Skip if feature name is a file (depth too deep)
      if (featureName.includes(".")) continue;
      
      // Build feature path
      const featurePath = parts.slice(0, featureIdx + 1).join("/");
      
      if (!candidates.has(featurePath)) {
        candidates.set(featurePath, []);
      }
      candidates.get(featurePath)!.push(file);
    }
  }

  return candidates;
}

/**
 * Extract dependencies from modules.json for a feature
 */
function getFeatureDependencies(
  featurePath: string,
  modules: Record<string, { path: string; files: string[] }>
): string[] {
  const deps: string[] = [];
  const featureFiles = Object.values(modules).find(m => m.path === featurePath)?.files || [];
  
  // Get all other modules and check if any of their files import from feature files
  for (const [modName, mod] of Object.entries(modules)) {
    if (mod.path === featurePath) continue;
    
    for (const file of mod.files || []) {
      // Simple heuristic: if file path contains feature name, it's related
      const featureName = featurePath.split("/").pop() || "";
      if (file.toLowerCase().includes(featureName.toLowerCase())) {
        if (!deps.includes(modName)) {
          deps.push(modName);
        }
      }
    }
  }
  
  return deps;
}

/**
 * Generate features from modules.json
 * 
 * Output format:
 * {
 *   "name": "auth",
 *   "path": "src/auth",
 *   "files": [],
 *   "entrypoints": [],
 *   "dependencies": []
 * }
 */
export function generateFeatures(
  modulesJsonPath: string,
  _symbolsJsonPath: string
): Feature[] {
  const features: Feature[] = [];
  
  // Load modules
  let modules: Record<string, { path: string; files: string[] }> = {};
  try {
    if (fs.existsSync(modulesJsonPath)) {
      const data = readJsonFile(modulesJsonPath);
      modules = (data as any).modules || {};
    }
  } catch (e) {
    // Ignore errors, return empty
  }

  // Use modules directly from modules.json
  for (const [moduleName, mod] of Object.entries(modules)) {
    const files = mod.files || [];
    
    // Filter to source files only
    const sourceFiles = files.filter(isSourceFile);
    
    // Must have at least 2 source files (relaxed from 3 for smaller projects)
    if (sourceFiles.length < 2) continue;
    
    // Must have at least one entrypoint
    const entrypoints = sourceFiles.filter(isEntrypoint);
    if (entrypoints.length === 0) continue;
    
    // Extract feature name from path - get the last segment
    const featureName = mod.path.split("/").pop() || moduleName;
    
    // Skip ignored folders (utils, helpers, types, etc.)
    if (isIgnoredFolder(featureName)) continue;
    
    features.push({
      name: featureName,
      path: mod.path,
      files: sourceFiles.slice(0, 50),
      entrypoints: entrypoints.slice(0, 10),
      dependencies: []
    });
  }

  return features;
}

// ============================================================
// FLOW DETECTION ALGORITHM
// ============================================================

/**
 * Generate flows from symbol graph
 */
function flowsFromGraph(graphData: any): Flow[] {
  const flows: Flow[] = [];
  const { symbols = [], relationships = [] } = graphData;
  
  // Build symbol lookup
  const bySymbol: Record<string, any[]> = {};
  for (const r of relationships) {
    if (!bySymbol[r.symbolId]) bySymbol[r.symbolId] = [];
    bySymbol[r.symbolId].push(r);
  }
  
  // Find entrypoint symbols
  const entrypoints = symbols.filter((s: any) => 
    s.file && isFlowEntrypoint(s.file)
  );
  
  for (const ep of entrypoints) {
    const visited = new Set<string>();
    const fileSet = new Set<string>();
    const layerSet = new Set<string>();
    
    const traverse = (symbolId: string, depth: number) => {
      if (depth > MAX_FLOW_DEPTH || visited.has(symbolId) || fileSet.size >= MAX_FLOW_FILES) {
        return;
      }
      
      visited.add(symbolId);
      
      const symbol = symbols.find((s: any) => s.id === symbolId);
      if (!symbol?.file || isFlowExcluded(symbol.file)) return;
      
      fileSet.add(symbol.file);
      layerSet.add(getLayer(symbol.file));
      
      // Follow relationships
      for (const r of bySymbol[symbolId] || []) {
        if (["calls", "imports", "references"].includes(r.type)) {
          traverse(r.targetId, depth + 1);
        }
      }
    };
    
    if (ep.file) {
      fileSet.add(ep.file);
      layerSet.add(getLayer(ep.file));
      
      for (const r of bySymbol[ep.id] || []) {
        if (["calls", "imports", "references"].includes(r.type)) {
          traverse(r.targetId, 1);
        }
      }
    }
    
    // Must have at least 3 files and 2 layers
    if (fileSet.size >= 3 && layerSet.size >= 2) {
      flows.push({
        name: sanitizeFlowName(path.basename(ep.file || "").replace(/\.[^.]+$/, "")),
        entrypoint: ep.file || "",
        files: Array.from(fileSet).slice(0, MAX_FLOW_FILES),
        depth: Math.min(MAX_FLOW_DEPTH, [...visited].length),
        layers: Array.from(layerSet)
      });
    }
  }
  
  return flows;
}

/**
 * Generate flows from folder structure (fallback)
 */
function flowsFromFolders(files: string[]): Flow[] {
  const flows: Flow[] = [];
  
  // Group by feature prefix (e.g., authController -> auth)
  const byFeature = new Map<string, string[]>();
  
  for (const file of files) {
    if (!isSourceFile(file)) continue;
    
    const baseName = path.basename(file).replace(/\.[^.]+$/, "");
    // Extract feature: authController -> auth, userService -> user, LoginPage -> login, Dashboard -> dashboard
    const feature = baseName.replace(/(Controller|Service|Repository|Handler|Route|Model|Entity|Command|Page|Screen|View|Component)$/i, "");
    const key = feature.toLowerCase();
    
    if (!byFeature.has(key)) {
      byFeature.set(key, []);
    }
    byFeature.get(key)!.push(file);
  }
  
  for (const [feature, featureFiles] of byFeature) {
    // Relaxed: allow flows with 2+ files OR files that match entrypoint patterns
    const hasEntrypoint = featureFiles.some(f => isFlowEntrypoint(f));
    if (featureFiles.length < 2 && !hasEntrypoint) continue;
    
    const layers = new Set(featureFiles.map(getLayer).filter(l => l !== "unknown"));
    // Relaxed: allow single layer if files match entrypoint patterns
    if (layers.size < 2 && !hasEntrypoint) continue;
    
    const sorted = [...featureFiles].sort((a, b) => 
      getLayerPriority(a) - getLayerPriority(b)
    );
    
    const entrypoint = sorted.find(isFlowEntrypoint) || sorted[0];
    
    flows.push({
      name: sanitizeFlowName(feature),
      entrypoint,
      files: sorted.slice(0, MAX_FLOW_FILES),
      depth: layers.size,
      layers: Array.from(layers)
    });
  }
  
  return flows;
}

/**
 * Generate flows from dependencies (fallback)
 */
function flowsFromImports(
  dependenciesPath: string,
  files: string[]
): Flow[] {
  const flows: Flow[] = [];
  
  let deps: any = { byFile: {} };
  try {
    if (fs.existsSync(dependenciesPath)) {
      deps = readJsonFile(dependenciesPath);
    }
  } catch {
    return flows;
  }
  
  // Build import graph
  const importsTo = new Map<string, Set<string>>();
  for (const [file, imports] of Object.entries(deps.byFile || {})) {
    if (!importsTo.has(file)) {
      importsTo.set(file, new Set());
    }
    for (const imp of imports as string[]) {
      importsTo.get(file)!.add(imp);
    }
  }
  
  // Find entrypoints
  const entrypoints = files.filter(isFlowEntrypoint);
  
  for (const ep of entrypoints) {
    const visited = new Set<string>([ep]);
    const fileSet = new Set<string>([ep]);
    const layerSet = new Set<string>();
    
    const traverse = (file: string, depth: number) => {
      if (depth > MAX_FLOW_DEPTH || fileSet.size >= MAX_FLOW_FILES) return;
      
      for (const imp of importsTo.get(file) || []) {
        if (visited.has(imp) || isFlowExcluded(imp)) continue;
        
        visited.add(imp);
        fileSet.add(imp);
        layerSet.add(getLayer(imp));
        traverse(imp, depth + 1);
      }
    };
    
    traverse(ep, 1);
    
    if (fileSet.size >= 3 && layerSet.size >= 2) {
      flows.push({
        name: sanitizeFlowName(path.basename(ep, path.extname(ep))),
        entrypoint: ep,
        files: Array.from(fileSet),
        depth: Math.min(MAX_FLOW_DEPTH, [...visited].length),
        layers: Array.from(layerSet)
      });
    }
  }
  
  return flows;
}

/**
 * Generate flows using multiple fallback methods
 */
export function generateFlows(
  graphPath: string,
  modulesPath: string,
  dependenciesPath?: string
): Flow[] {
  // Load graph data
  let graphData: any = { symbols: [], relationships: [] };
  try {
    if (fs.existsSync(graphPath)) {
      graphData = readJsonFile(graphPath);
    }
  } catch {
    // Ignore
  }
  
  // Load modules
  let modules: Record<string, { path: string; files: string[] }> = {};
  try {
    if (fs.existsSync(modulesPath)) {
      modules = (readJsonFile(modulesPath) as any).modules || {};
    }
  } catch {
    // Ignore
  }
  
  const allFiles = Object.values(modules).flatMap(m => m.files || []);
  
  // Determine if graph is weak
  const relationshipCount = graphData.relationships?.length || 0;
  const symbolCount = graphData.symbols?.length || 1;
  const density = relationshipCount / symbolCount;
  const isWeakGraph = density < 0.5 || relationshipCount < 10;
  
  const flows: Flow[] = [];
  
  // Try graph-based flow detection first (if graph is strong)
  if (!isWeakGraph && relationshipCount > 0) {
    flows.push(...flowsFromGraph(graphData));
  }
  
  // Fallback to folder-based detection
  if (flows.length === 0 || isWeakGraph) {
    flows.push(...flowsFromFolders(allFiles));
  }
  
  // Fallback to import-based detection
  if (flows.length === 0 || isWeakGraph) {
    flows.push(...flowsFromImports(dependenciesPath || "", allFiles));
  }
  
  // Deduplicate by name
  const seen = new Set<string>();
  return flows
    .filter(f => {
      if (seen.has(f.name)) return false;
      seen.add(f.name);
      return true;
    })
    .slice(0, 20);
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================

/**
 * Generate all semantic contexts (features and flows)
 */
export function generateSemanticContexts(aiDir: string): SemanticContexts {
  const featuresDir = path.join(aiDir, "context", "features");
  const flowsDir = path.join(aiDir, "context", "flows");
  
  const modulesPath = path.join(aiDir, "modules.json");
  const symbolsPath = path.join(aiDir, "symbols.json");
  const graphPath = path.join(aiDir, "graph", "symbol-graph.json");
  const dependenciesPath = path.join(aiDir, "dependencies.json");
  
  // Generate features and flows
  const features = generateFeatures(modulesPath, symbolsPath);
  const flows = generateFlows(graphPath, modulesPath, dependenciesPath);
  
  // Write features
  ensureDir(featuresDir);
  for (const feature of features) {
    const filePath = path.join(featuresDir, `${feature.name}.json`);
    writeFile(filePath, JSON.stringify(feature, null, 2));
  }
  
  // Write flows
  ensureDir(flowsDir);
  for (const flow of flows) {
    const safeName = sanitizeFlowName(flow.name);
    const filePath = path.join(flowsDir, `${safeName}.json`);
    writeFile(filePath, JSON.stringify(flow, null, 2));
  }
  
  return { features, flows };
}
