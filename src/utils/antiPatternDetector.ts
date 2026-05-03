import fs from "fs";
import path from "path";

export interface AntiPattern {
  type: string;
  severity: "warning" | "info";
  file: string;
  line: number;
  description: string;
  suggestion: string;
}

export function detectAntiPatterns(rootDir: string): AntiPattern[] {
  const patterns: AntiPattern[] = [];
  const sourceFiles = findSourceFiles(rootDir, 200);

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        if (line.includes("console.log") && !relativePath.includes("test") && !relativePath.includes("spec")) {
          patterns.push({
            type: "console.log",
            severity: "warning",
            file: relativePath,
            line: lineNum,
            description: "Console.log in production code",
            suggestion: "Use a proper logging library (winston, pino, etc.)",
          });
        }

        if (line.match(/catch\s*\(\s*\w+\s*\)\s*\{\s*\}/)) {
          patterns.push({
            type: "empty-catch",
            severity: "warning",
            file: relativePath,
            line: lineNum,
            description: "Empty catch block",
            suggestion: "Handle the error or at least log it",
          });
        }

        if (line.includes("as any") || line.includes("@ts-ignore") || line.includes("@ts-expect-error")) {
          patterns.push({
            type: "type-suppression",
            severity: "info",
            file: relativePath,
            line: lineNum,
            description: "TypeScript type suppression",
            suggestion: "Fix the underlying type issue instead of suppressing",
          });
        }

        if (line.match(/SELECT\s+\*\s+FROM/i) && !line.includes("--")) {
          patterns.push({
            type: "select-star",
            severity: "info",
            file: relativePath,
            line: lineNum,
            description: "SELECT * in SQL query",
            suggestion: "Select only the columns you need",
          });
        }

        if (line.match(/(?:password|secret|key|token)\s*=\s*['"][^'"]+['"]/i) && !line.includes("process.env")) {
          patterns.push({
            type: "hardcoded-secret",
            severity: "warning",
            file: relativePath,
            line: lineNum,
            description: "Potential hardcoded secret",
            suggestion: "Use environment variables for secrets",
          });
        }

        if (line.includes("TODO") || line.includes("FIXME") || line.includes("HACK")) {
          patterns.push({
            type: "todo-fixme",
            severity: "info",
            file: relativePath,
            line: lineNum,
            description: `Found ${line.includes("TODO") ? "TODO" : line.includes("FIXME") ? "FIXME" : "HACK"} comment`,
            suggestion: "Address the TODO/FIXME or create a ticket",
          });
        }

        if (relativePath.endsWith(".ts") && line.includes("require(") && !line.includes("//")) {
          patterns.push({
            type: "require-in-ts",
            severity: "info",
            file: relativePath,
            line: lineNum,
            description: "Using require() in TypeScript",
            suggestion: "Use ES6 import syntax instead",
          });
        }

        if (line.match(/\.then\s*\(/) && line.match(/\.then\s*\(/g)!.length >= 3) {
          patterns.push({
            type: "promise-hell",
            severity: "warning",
            file: relativePath,
            line: lineNum,
            description: "Promise chaining hell",
            suggestion: "Use async/await for cleaner code",
          });
        }

        if (line.match(/function\s+\w+\s*\([^)]*\)\s*\{/) && lines.slice(i, i + 50).join("\n").length > 500) {
          const funcLines = lines.slice(i, i + 50);
          if (funcLines.length > 30) {
            patterns.push({
              type: "long-function",
              severity: "info",
              file: relativePath,
              line: lineNum,
              description: "Function is very long",
              suggestion: "Consider breaking into smaller functions",
            });
          }
        }
      }
    } catch {}
  }

  return patterns.slice(0, 30);
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
