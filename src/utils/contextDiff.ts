import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface ContextDiff {
  hasPreviousContext: boolean;
  newFiles: string[];
  removedFiles: string[];
  modifiedFiles: string[];
  newDependencies: string[];
  removedDependencies: string[];
  newSymbols: number;
  removedSymbols: number;
  summary: string;
}

export function generateContextDiff(currentDir: string, previousDir?: string): ContextDiff {
  const diff: ContextDiff = {
    hasPreviousContext: false,
    newFiles: [],
    removedFiles: [],
    modifiedFiles: [],
    newDependencies: [],
    removedDependencies: [],
    newSymbols: 0,
    removedSymbols: 0,
    summary: "",
  };

  const statePath = path.join(currentDir, ".context-state.json");
  
  if (!previousDir && fs.existsSync(statePath)) {
    try {
      const previousState = JSON.parse(fs.readFileSync(statePath, "utf-8")) as {
        files?: string[];
        fileHashes?: Record<string, string>;
        dependencies?: string[];
        symbolCount?: number;
      };
      const currentState = buildCurrentState(currentDir);

      diff.hasPreviousContext = true;

      const prevFiles = new Set(previousState.files || []);
      const currFiles = new Set(currentState.files);

      for (const file of currFiles) {
        if (!prevFiles.has(file)) {
          diff.newFiles.push(file);
        }
      }

      for (const file of prevFiles) {
        if (!currFiles.has(file)) {
          diff.removedFiles.push(file);
        }
      }

      for (const file of currFiles) {
        if (prevFiles.has(file)) {
          const prevHash = previousState.fileHashes?.[file];
          const currHash = currentState.fileHashes[file];
          if (prevHash && currHash && prevHash !== currHash) {
            diff.modifiedFiles.push(file);
          }
        }
      }

      const prevDeps = new Set(previousState.dependencies || []);
      const currDeps = new Set(currentState.dependencies);

      for (const dep of currDeps) {
        if (!prevDeps.has(dep)) {
          diff.newDependencies.push(dep);
        }
      }

      for (const dep of prevDeps) {
        if (!currDeps.has(dep)) {
          diff.removedDependencies.push(dep);
        }
      }

      diff.newSymbols = Math.max(0, currentState.symbolCount - (previousState.symbolCount || 0));
      diff.removedSymbols = Math.max(0, (previousState.symbolCount || 0) - currentState.symbolCount);

      diff.summary = buildDiffSummary(diff);

      saveCurrentState(currentDir, currentState);
    } catch {}
  } else {
    const currentState = buildCurrentState(currentDir);
    saveCurrentState(currentDir, currentState);
    diff.summary = "First run - baseline context created";
  }

  return diff;
}

interface ContextState {
  files: string[];
  fileHashes: Record<string, string>;
  dependencies: string[];
  symbolCount: number;
  timestamp: string;
}

function buildCurrentState(contextDir: string): ContextState {
  const state: ContextState = {
    files: [],
    fileHashes: {},
    dependencies: [],
    symbolCount: 0,
    timestamp: new Date().toISOString(),
  };

  const parentDir = path.dirname(contextDir);

  try {
    const symbolsPath = path.join(contextDir, "symbols.json");
    if (fs.existsSync(symbolsPath)) {
      const symbols = JSON.parse(fs.readFileSync(symbolsPath, "utf-8"));
      state.symbolCount = symbols.symbols?.length || 0;
    }

    const depsPath = path.join(contextDir, "dependencies.json");
    if (fs.existsSync(depsPath)) {
      const deps = JSON.parse(fs.readFileSync(depsPath, "utf-8"));
      state.dependencies = deps.dependencies?.map((d: { source: string }) => d.source) || [];
    }

    const sourceFiles = findSourceFiles(parentDir, 200);
    for (const file of sourceFiles) {
      const relativePath = path.relative(parentDir, file);
      state.files.push(relativePath);
      
      try {
        const content = fs.readFileSync(file, "utf-8");
        state.fileHashes[relativePath] = crypto.createHash("md5").update(content).digest("hex").slice(0, 8);
      } catch {}
    }
  } catch {}

  return state;
}

function saveCurrentState(contextDir: string, state: ContextState): void {
  const statePath = path.join(contextDir, ".context-state.json");
  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch {}
}

function buildDiffSummary(diff: ContextDiff): string {
  const parts: string[] = [];

  if (diff.newFiles.length > 0) parts.push(`${diff.newFiles.length} new files`);
  if (diff.removedFiles.length > 0) parts.push(`${diff.removedFiles.length} removed files`);
  if (diff.modifiedFiles.length > 0) parts.push(`${diff.modifiedFiles.length} modified files`);
  if (diff.newDependencies.length > 0) parts.push(`${diff.newDependencies.length} new dependencies`);
  if (diff.removedDependencies.length > 0) parts.push(`${diff.removedDependencies.length} removed dependencies`);
  if (diff.newSymbols > 0) parts.push(`+${diff.newSymbols} symbols`);
  if (diff.removedSymbols > 0) parts.push(`-${diff.removedSymbols} symbols`);

  if (parts.length === 0) return "No changes detected";
  return parts.join(", ");
}

function findSourceFiles(rootDir: string, maxFiles: number): string[] {
  const files: string[] = [];
  const extensions = [".ts", ".js", ".py", ".go", ".rs", ".java", ".rb", ".php"];
  const excludeDirs = ["node_modules", ".git", "dist", "build", "__pycache__", "vendor", ".venv", "venv", "ai-context", ".ai-dev"];

  function walk(dir: string) {
    if (files.length >= maxFiles) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= maxFiles) return;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
          walk(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch {}
  }

  walk(rootDir);
  return files;
}
