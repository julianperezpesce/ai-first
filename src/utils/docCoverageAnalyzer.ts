import fs from "fs";
import path from "path";

export interface DocCoverage {
  totalFunctions: number;
  documentedFunctions: number;
  totalClasses: number;
  documentedClasses: number;
  percentage: number;
  undocumentedItems: DocItem[];
  summary: string;
}

export interface DocItem {
  name: string;
  file: string;
  line: number;
  type: "function" | "class";
}

export function analyzeDocCoverage(rootDir: string): DocCoverage {
  const result: DocCoverage = {
    totalFunctions: 0,
    documentedFunctions: 0,
    totalClasses: 0,
    documentedClasses: 0,
    percentage: 0,
    undocumentedItems: [],
    summary: "",
  };

  const sourceFiles = findSourceFiles(rootDir, 150);

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
        if (funcMatch) {
          result.totalFunctions++;
          const hasDoc = checkForDocumentation(lines, i);
          if (hasDoc) {
            result.documentedFunctions++;
          } else {
            result.undocumentedItems.push({
              name: funcMatch[1],
              file: relativePath,
              line: i + 1,
              type: "function",
            });
          }
        }

        const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
        if (classMatch) {
          result.totalClasses++;
          const hasDoc = checkForDocumentation(lines, i);
          if (hasDoc) {
            result.documentedClasses++;
          } else {
            result.undocumentedItems.push({
              name: classMatch[1],
              file: relativePath,
              line: i + 1,
              type: "class",
            });
          }
        }

        const pyFuncMatch = line.match(/def\s+(\w+)\s*\(/);
        if (pyFuncMatch && !pyFuncMatch[1].startsWith("_")) {
          result.totalFunctions++;
          const hasDoc = checkForPythonDoc(lines, i);
          if (hasDoc) {
            result.documentedFunctions++;
          } else {
            result.undocumentedItems.push({
              name: pyFuncMatch[1],
              file: relativePath,
              line: i + 1,
              type: "function",
            });
          }
        }

        const pyClassMatch = line.match(/class\s+(\w+)/);
        if (pyClassMatch) {
          result.totalClasses++;
          const hasDoc = checkForPythonDoc(lines, i);
          if (hasDoc) {
            result.documentedClasses++;
          } else {
            result.undocumentedItems.push({
              name: pyClassMatch[1],
              file: relativePath,
              line: i + 1,
              type: "class",
            });
          }
        }
      }
    } catch {}
  }

  const total = result.totalFunctions + result.totalClasses;
  const documented = result.documentedFunctions + result.documentedClasses;
  result.percentage = total > 0 ? Math.round((documented / total) * 100) : 0;

  result.undocumentedItems = result.undocumentedItems.slice(0, 15);

  result.summary = `Documentation coverage: ${result.percentage}% (${documented}/${total} items documented)`;

  return result;
}

function checkForDocumentation(lines: string[], currentIndex: number): boolean {
  for (let i = currentIndex - 1; i >= Math.max(0, currentIndex - 5); i--) {
    const line = lines[i].trim();
    if (line.startsWith("/**") || line.startsWith("*") || line.startsWith("*/") || line.startsWith("//")) {
      return true;
    }
    if (line === "") continue;
    return false;
  }
  return false;
}

function checkForPythonDoc(lines: string[], currentIndex: number): boolean {
  if (currentIndex + 1 < lines.length) {
    const nextLine = lines[currentIndex + 1].trim();
    if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
      return true;
    }
  }
  return false;
}

function findSourceFiles(rootDir: string, maxFiles: number): string[] {
  const files: string[] = [];
  const extensions = [".ts", ".js", ".py", ".go", ".rs", ".java", ".rb", ".php"];
  const excludeDirs = ["node_modules", ".git", "dist", "build", "__pycache__", "vendor", ".venv", "venv"];

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
