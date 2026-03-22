import fs from "fs";
import path from "path";
import { ensureDir, writeFile, readJsonFile } from "../utils/fileUtils.js";
import { getCcpDir, getCcpPath } from "../utils/constants.js";

export interface ContextModule {
  name: string;
  description: string;
  files: string[];
  symbols?: string[];
  entrypoints?: string[];
  dependencies?: string[];
}

export interface CCPContext {
  task: string;
  description: string;
  includes: string[];
}

interface SymbolsData {
  [key: string]: any;
}

interface DependenciesData {
  byFile?: Record<string, string[]>;
  [key: string]: any;
}

/**
 * Generate context modules from repository analysis
 */
export function generateContextModules(
  rootDir: string,
  aiDir: string
): ContextModule[] {
  const modules: ContextModule[] = [];
  const contextDir = path.join(aiDir, "context");
  
  // Try to read existing data
  let symbolsData: SymbolsData = [];
  let depsData: DependenciesData = {};
  let repoFiles: string[] = [];
  
  try {
    const symbolsPath = path.join(aiDir, "symbols.json");
    if (fs.existsSync(symbolsPath)) {
      symbolsData = readJsonFile(symbolsPath);
    }
  } catch {}
  
  try {
    const depsPath = path.join(aiDir, "dependencies.json");
    if (fs.existsSync(depsPath)) {
      depsData = readJsonFile(depsPath);
    }
  } catch {}
  
  try {
    const filesPath = path.join(aiDir, "repo_map.json");
    if (fs.existsSync(filesPath)) {
      const repoMap: any = readJsonFile(filesPath);
      repoFiles = (repoMap.files || []).map((f: any) => f.path);
    }
  } catch {}
  
  // 1. Generate base repo.json
  const repoModule: ContextModule = {
    name: "repo",
    description: "Base repository context with overall structure",
    files: repoFiles.slice(0, 50),
  };
  modules.push(repoModule);
  
  // 2. Try to detect feature modules based on directory structure
  const featureDirs = detectFeatureDirectories(repoFiles);
  
  for (const feature of featureDirs) {
    const featureFiles = repoFiles.filter(f => f.startsWith(feature));
    const featureSymbols = (Array.isArray(symbolsData) ? symbolsData : []).filter((s: any) => s.file?.startsWith(feature));
    const byFile = depsData.byFile || {};
    const featureDeps = Object.keys(byFile)
      .filter(f => f.startsWith(feature))
      .reduce((acc: Record<string, string[]>, f) => {
        acc[f] = byFile[f];
        return acc;
      }, {});
    
    modules.push({
      name: feature.replace(/[\/\\]/g, "-"),
      description: `Context for ${feature} feature`,
      files: featureFiles,
      symbols: featureSymbols.slice(0, 20).map((s: any) => s.id || s.name),
      dependencies: Object.values(featureDeps).flat().slice(0, 20) as string[],
    });
  }
  
  // Ensure context directory exists
  ensureDir(contextDir);
  
  // Write each context module
  for (const mod of modules) {
    const modPath = path.join(contextDir, `${mod.name}.json`);
    writeFile(modPath, JSON.stringify(mod, null, 2));
  }
  
  return modules;
}

/**
 * Detect feature directories from file structure
 */
function detectFeatureDirectories(files: string[]): string[] {
  const dirs = new Set<string>();
  
  for (const file of files) {
    const parts = file.split("/");
    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i];
      const lowerDir = dir.toLowerCase();
      
      // Common feature patterns
      if (["auth", "authentication", "login", "users", "security",
           "payments", "billing", "checkout", "subscription",
           "search", "find", "query",
           "api", "services", "endpoints",
           "models", "entities", "schemas",
           "utils", "helpers", "lib",
           "components", "ui", "views", "pages",
           "hooks", "store", "state",
           "config", "settings"].includes(lowerDir)) {
        dirs.add(dir);
      }
    }
  }
  
  return Array.from(dirs).slice(0, 10);
}

/**
 * Create a new CCP (Context Control Pack)
 */
export function createCCP(
  rootDir: string,
  name: string,
  options: {
    description?: string;
    include?: string[];
  } = {}
): { success: boolean; path: string; error?: string } {
  const aiDir = path.join(rootDir, "ai-context");
  const ccpDir = path.join(aiDir, "ccp", name);
  
  try {
    if (!fs.existsSync(aiDir)) {
      return {
        success: false,
        path: ccpDir,
        error: "AI directory not found. Run 'ai-first init' first.",
      };
    }
    
    const contextDir = path.join(aiDir, "context");
    if (!fs.existsSync(contextDir)) {
      generateContextModules(rootDir, aiDir);
    }
    
    const contextFiles = fs.readdirSync(contextDir).filter(f => f.endsWith(".json"));
    const availableModules = contextFiles.map(f => `../../context/${f}`);
    
    let includes: string[];
    if (options.include && options.include.length > 0) {
      includes = options.include.map(m => {
        if (m.startsWith("../../context/")) return m;
        if (m.startsWith("context/")) return `../../${m}`;
        return `../../context/${m}.json`;
      });
    } else {
      includes = ["../../context/repo.json"];
    }
    
    ensureDir(ccpDir);
    
    const ccpContent: CCPContext = {
      task: name,
      description: options.description || "",
      includes,
    };
    
    const contextPath = path.join(ccpDir, "context.json");
    writeFile(contextPath, JSON.stringify(ccpContent, null, 2));
    
    return {
      success: true,
      path: ccpDir,
    };
  } catch (error: any) {
    return {
      success: false,
      path: ccpDir,
      error: error.message,
    };
  }
}

/**
 * List all CCPs
 */
export function listCCPs(rootDir: string): string[] {
  const ccpDir = getCcpDir(rootDir);
  
  if (!fs.existsSync(ccpDir)) {
    return [];
  }
  
  return fs.readdirSync(ccpDir).filter(stat => {
    const fullPath = path.join(ccpDir, stat);
    return fs.statSync(fullPath).isDirectory();
  });
}

/**
 * Get CCP details
 */
export function getCCP(rootDir: string, name: string): CCPContext | null {
  const contextPath = getCcpPath(rootDir, name);
  
  if (!fs.existsSync(contextPath)) {
    return null;
  }
  
  try {
    const data = readJsonFile(contextPath) as unknown as CCPContext;
    if (data.task && data.includes) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
