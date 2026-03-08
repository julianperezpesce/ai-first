import { getAllFiles, getRelativePath } from "../utils/fileUtils.js";

export interface FileInfo {
  path: string;
  relativePath: string;
  name: string;
  extension: string;
}

export interface ScanResult {
  rootDir: string;
  files: FileInfo[];
  totalFiles: number;
  directoryStructure: Map<string, string[]>;
}

/**
 * Scan a repository and return its structure
 */
export function scanRepo(
  rootDir: string,
  excludePatterns?: string[],
  includeExtensions?: string[]
): ScanResult {
  const absoluteFiles = getAllFiles(rootDir, excludePatterns, includeExtensions);

  const files: FileInfo[] = [];
  const directoryStructure = new Map<string, string[]>();

  for (const filePath of absoluteFiles) {
    const relativePath = getRelativePath(rootDir, filePath);
    const parts = relativePath.split("/");
    const fileName = parts.pop() || "";
    const dirPath = parts.join("/");

    files.push({
      path: filePath,
      relativePath,
      name: fileName,
      extension: getExtension(fileName),
    });

    // Build directory structure
    if (!directoryStructure.has(dirPath)) {
      directoryStructure.set(dirPath, []);
    }
    directoryStructure.get(dirPath)?.push(fileName);
  }

  return {
    rootDir,
    files,
    totalFiles: files.length,
    directoryStructure,
  };
}

/**
 * Get file extension without the dot
 */
function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1 || lastDot === 0) {
    return "";
  }
  return fileName.slice(lastDot + 1);
}

/**
 * Get files grouped by extension
 */
export function groupByExtension(files: FileInfo[]): Map<string, FileInfo[]> {
  const grouped = new Map<string, FileInfo[]>();

  for (const file of files) {
    const ext = file.extension || "no-extension";
    if (!grouped.has(ext)) {
      grouped.set(ext, []);
    }
    grouped.get(ext)?.push(file);
  }

  return grouped;
}

/**
 * Get files grouped by top-level directory
 */
export function groupByDirectory(files: FileInfo[]): Map<string, FileInfo[]> {
  const grouped = new Map<string, FileInfo[]>();

  for (const file of files) {
    const parts = file.relativePath.split("/");
    const topDir = parts[0] || "root";

    if (!grouped.has(topDir)) {
      grouped.set(topDir, []);
    }
    grouped.get(topDir)?.push(file);
  }

  return grouped;
}
