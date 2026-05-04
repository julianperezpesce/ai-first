import fs from "fs";
import path from "path";
import { scanRepo, type FileInfo } from "../core/repoScanner.js";
import { extractSymbols } from "../analyzers/symbols.js";

export interface SearchResult {
  query: string;
  results: CodeSnippet[];
  totalFiles: number;
}

export interface CodeSnippet {
  file: string;
  function: string;
  code: string;
  line: number;
  score: number;
}

export function semanticSearch(rootDir: string, query: string, maxResults: number = 10): SearchResult {
  const scanResult = scanRepo(rootDir);
  const symbols = extractSymbols(scanResult.files);
  
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  const results: CodeSnippet[] = [];

  for (const file of scanResult.files) {
    if (!isCodeFile(file.extension)) continue;
    
    try {
      const content = fs.readFileSync(file.path, "utf-8");
      const lines = content.split("\n");
      const relativePath = file.relativePath;
      
      let currentFunction = "";
      let functionStart = 0;
      let inFunction = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineLower = line.toLowerCase();
        
        const funcMatch = line.match(/(?:function|def|class|async)\s+(\w+)/);
        if (funcMatch) {
          currentFunction = funcMatch[1];
          functionStart = i + 1;
          inFunction = true;
        }
        
        let score = 0;
        
        if (queryWords.some(w => file.relativePath.toLowerCase().includes(w))) score += 2;
        if (queryWords.some(w => currentFunction.toLowerCase().includes(w))) score += 3;
        if (queryWords.some(w => lineLower.includes(w))) score += 1;
        
        const exactMatch = lineLower.includes(queryLower);
        if (exactMatch) score += 5;
        
        if (score >= 3) {
          results.push({
            file: relativePath,
            function: currentFunction || path.basename(file.path),
            code: getCodeContext(lines, i, 5),
            line: i + 1,
            score,
          });
        }
      }
    } catch {}
  }

  const deduped = dedupeResults(results);
  const sorted = deduped.sort((a, b) => b.score - a.score).slice(0, maxResults);

  return {
    query,
    results: sorted,
    totalFiles: scanResult.totalFiles,
  };
}

function getCodeContext(lines: string[], centerIndex: number, contextLines: number): string {
  const start = Math.max(0, centerIndex - contextLines);
  const end = Math.min(lines.length, centerIndex + contextLines + 1);
  return lines.slice(start, end).join("\n");
}

function dedupeResults(results: CodeSnippet[]): CodeSnippet[] {
  const seen = new Set<string>();
  return results.filter(r => {
    const key = `${r.file}:${r.function}:${r.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isCodeFile(ext: string): boolean {
  return [".ts", ".js", ".py", ".go", ".rs", ".java", ".rb", ".php", ".cls", ".trigger"].includes("." + ext);
}
