import fs from "fs";
import path from "path";

export interface PerformanceIssue {
  type: string;
  severity: "high" | "medium" | "low";
  file: string;
  line: number;
  description: string;
  suggestion: string;
}

export function detectPerformanceIssues(rootDir: string): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];
  const sourceFiles = findSourceFiles(rootDir, 200);

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        if (line.match(/\.forEach\s*\(/) && lines.slice(i, i + 10).some(l => l.match(/\.forEach\s*\(/))) {
          issues.push({
            type: "nested-loop",
            severity: "medium",
            file: relativePath,
            line: lineNum,
            description: "Potential nested loops detected",
            suggestion: "Consider using a Map or Set for O(1) lookups",
          });
        }

        if (line.match(/SELECT\s+\*\s+FROM/i) && !line.includes("LIMIT")) {
          issues.push({
            type: "unbounded-query",
            severity: "high",
            file: relativePath,
            line: lineNum,
            description: "SELECT * without LIMIT",
            suggestion: "Add LIMIT clause or select specific columns",
          });
        }

        if (line.match(/\.find\s*\(.*\.find\s*\(/) || line.match(/\.filter\s*\(.*\.filter\s*\(/)) {
          issues.push({
            type: "nested-array-operations",
            severity: "medium",
            file: relativePath,
            line: lineNum,
            description: "Nested array operations",
            suggestion: "Combine into single pass or use a Map",
          });
        }

        if (line.match(/fs\.readFileSync/) && !relativePath.includes("test") && !relativePath.includes("config")) {
          issues.push({
            type: "sync-file-read",
            severity: "medium",
            file: relativePath,
            line: lineNum,
            description: "Synchronous file read in potentially async context",
            suggestion: "Use fs.promises.readFile for async operations",
          });
        }

        if (line.match(/JSON\.parse\(.*JSON\.stringify/)) {
          issues.push({
            type: "deep-clone",
            severity: "low",
            file: relativePath,
            line: lineNum,
            description: "Deep clone via JSON.parse/stringify",
            suggestion: "Use structuredClone() or a dedicated library for better performance",
          });
        }

        if (line.match(/new\s+RegExp\s*\(/) && line.includes("loop") || line.match(/for\s*\(.*new\s+RegExp/)) {
          issues.push({
            type: "regex-in-loop",
            severity: "medium",
            file: relativePath,
            line: lineNum,
            description: "RegExp created inside loop",
            suggestion: "Move regex creation outside the loop",
          });
        }

        if (line.match(/\.sort\s*\(.*\.sort\s*\(/)) {
          issues.push({
            type: "multiple-sorts",
            severity: "low",
            file: relativePath,
            line: lineNum,
            description: "Multiple sorts on same array",
            suggestion: "Combine into single sort with composite comparator",
          });
        }

        if (line.includes("await") && lines.slice(Math.max(0, i - 2), i + 3).filter(l => l.includes("await")).length >= 3) {
          issues.push({
            type: "sequential-awaits",
            severity: "medium",
            file: relativePath,
            line: lineNum,
            description: "Multiple sequential awaits",
            suggestion: "Use Promise.all() for independent async operations",
          });
        }

        if (line.match(/(?:2|4|8|16|32|64|128|256|512|1024)\s*\*\s*1024/) || line.match(/Math\.pow\s*\(\s*2/)) {
          issues.push({
            type: "magic-number",
            severity: "low",
            file: relativePath,
            line: lineNum,
            description: "Magic number for buffer/size calculation",
            suggestion: "Use named constants for clarity",
          });
        }
      }
    } catch {}
  }

  return issues.slice(0, 25);
}

function findSourceFiles(rootDir: string, maxFiles: number): string[] {
  const files: string[] = [];
  const extensions = [".ts", ".js", ".py", ".go", ".rs", ".java", ".rb", ".php"];
  const excludeDirs = ["node_modules", ".git", "dist", "build", "__pycache__", "vendor", ".venv", "venv", "fixtures"];

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
