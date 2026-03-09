import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface FileState {
  path: string;
  hash: string;
  mtime: number;
  size: number;
  indexedAt: string;
}

export interface IndexState {
  version: string;
  lastIndexed: string;
  totalFiles: number;
  files: Record<string, FileState>;
}

const STATE_VERSION = "1.0.0";

/**
 * Load index state from file
 */
export function loadIndexState(aiDir: string): IndexState | null {
  const statePath = path.join(aiDir, "index-state.json");
  
  if (!fs.existsSync(statePath)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(statePath, "utf-8");
    const state = JSON.parse(data) as IndexState;
    
    // Version check
    if (state.version !== STATE_VERSION) {
      console.log(`   ⚠️  Index state version mismatch (${state.version} vs ${STATE_VERSION}), doing full reindex`);
      return null;
    }
    
    return state;
  } catch (error) {
    console.log("   ⚠️  Failed to load index state, doing full reindex");
    return null;
  }
}

/**
 * Save index state to file
 */
export function saveIndexState(aiDir: string, files: Map<string, FileState>): void {
  const state: IndexState = {
    version: STATE_VERSION,
    lastIndexed: new Date().toISOString(),
    totalFiles: files.size,
    files: Object.fromEntries(files)
  };
  
  const statePath = path.join(aiDir, "index-state.json");
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

/**
 * Compute file hash (MD5 for speed)
 */
export function computeFileHash(filePath: string): { hash: string; mtime: number; size: number } | null {
  try {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash("md5").update(content).digest("hex");
    return {
      hash,
      mtime: stats.mtimeMs,
      size: stats.size
    };
  } catch {
    return null;
  }
}

/**
 * Check if file needs re-indexing
 */
export function needsReindex(filePath: string, currentState: IndexState): boolean {
  const relativePath = path.relative(process.cwd(), filePath);
  const previousState = currentState.files[relativePath];
  
  if (!previousState) {
    return true; // New file
  }
  
  // Check if file was deleted
  if (!fs.existsSync(filePath)) {
    return true; // File was deleted
  }
  
  try {
    const stats = fs.statSync(filePath);
    
    // Check by mtime (fast) or hash (accurate)
    if (stats.mtimeMs !== previousState.mtime) {
      // mtime changed, verify with hash
      const hashData = computeFileHash(filePath);
      if (!hashData || hashData.hash !== previousState.hash) {
        return true; // Content changed
      }
    }
    
    return false; // No changes
  } catch {
    return true; // Error reading file
  }
}

/**
 * Get list of files that need indexing
 */
export function getFilesToIndex(
  allFiles: string[], 
  rootDir: string, 
  currentState: IndexState | null
): { toIndex: string[]; unchanged: number; new: number; deleted: number } {
  const toIndex: string[] = [];
  let unchanged = 0;
  let newFiles = 0;
  const currentPaths = new Set<string>();
  
  for (const filePath of allFiles) {
    const relativePath = path.relative(rootDir, filePath);
    currentPaths.add(relativePath);
    
    if (!currentState || needsReindex(filePath, currentState)) {
      toIndex.push(filePath);
      if (currentState && currentState.files[relativePath]) {
        // Was in state but changed
      } else {
        newFiles++;
      }
    } else {
      unchanged++;
    }
  }
  
  // Check for deleted files
  let deleted = 0;
  if (currentState) {
    for (const existingPath of Object.keys(currentState.files)) {
      if (!currentPaths.has(existingPath)) {
        deleted++;
      }
    }
  }
  
  return { toIndex, unchanged, new: newFiles, deleted };
}

/**
 * Create git-based change detector (optional enhancement)
 */
export async function getChangedFilesGit(rootDir: string): Promise<Set<string>> {
  const changed = new Set<string>();
  
  try {
    const { execSync } = await import("child_process");
    
    // Get list of modified files from git
    const output = execSync("git diff --name-only HEAD", { 
      cwd: rootDir, 
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"]
    });
    
    for (const file of output.trim().split("\n")) {
      if (file.trim()) {
        changed.add(file.trim());
      }
    }
    
    // Also check untracked files
    const untracked = execSync("git ls-files --others --exclude-standard", { 
      cwd: rootDir, 
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"]
    });
    
    for (const file of untracked.trim().split("\n")) {
      if (file.trim()) {
        changed.add(file.trim());
      }
    }
  } catch {
    // Git not available or not a git repo
  }
  
  return changed;
}
