import path from "path";
import fs from "fs";

export interface FileStats {
  totalFiles: number;
  byExtension: Record<string, number>;
  byDirectory: Record<string, number>;
}

export function calculateFileStats(files: { relativePath: string; extension?: string }[]): FileStats {
  const stats: FileStats = {
    totalFiles: files.length,
    byExtension: {},
    byDirectory: {},
  };

  for (const file of files) {
    const ext = file.extension || path.extname(file.relativePath).toLowerCase();
    stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;

    const dir = path.dirname(file.relativePath);
    stats.byDirectory[dir] = (stats.byDirectory[dir] || 0) + 1;
  }

  return stats;
}

export function getFilesByExtension(
  files: { relativePath: string; extension?: string }[],
  extension: string
): number {
  return files.filter(f => {
    const ext = f.extension || path.extname(f.relativePath).toLowerCase();
    return ext === extension || ext === `.${extension}`;
  }).length;
}

export function getFilesInDirectory(
  files: { relativePath: string }[],
  directory: string
): number {
  return files.filter(f => {
    const fileDir = path.dirname(f.relativePath);
    return fileDir === directory || fileDir.startsWith(directory + path.sep);
  }).length;
}

export function validateCountsConsistency(
  summaryCounts: Record<string, number>,
  architectureCounts: Record<string, number>
): { consistent: boolean; discrepancies: Record<string, { summary: number; architecture: number }> } {
  const discrepancies: Record<string, { summary: number; architecture: number }> = {};
  
  const allKeys = new Set([...Object.keys(summaryCounts), ...Object.keys(architectureCounts)]);
  
  for (const key of allKeys) {
    const summaryVal = summaryCounts[key] || 0;
    const architectureVal = architectureCounts[key] || 0;
    
    if (summaryVal !== architectureVal) {
      discrepancies[key] = { summary: summaryVal, architecture: architectureVal };
    }
  }
  
  return {
    consistent: Object.keys(discrepancies).length === 0,
    discrepancies,
  };
}