import { FileInfo } from "./repoScanner.js";

const fileCache = new Map<string, FileInfo[]>();

export function getSharedFiles(rootDir: string): FileInfo[] {
  if (!fileCache.has(rootDir)) {
    const { scanRepo } = require("./repoScanner.js");
    const result = scanRepo(rootDir);
    fileCache.set(rootDir, result.files);
  }
  return fileCache.get(rootDir) || [];
}

export function clearFileCache(rootDir?: string): void {
  if (rootDir) fileCache.delete(rootDir);
  else fileCache.clear();
}
