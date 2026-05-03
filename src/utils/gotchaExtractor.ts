import fs from "fs";
import path from "path";

export interface CodeGotchas {
  todos: GotchaItem[];
  fixmes: GotchaItem[];
  hacks: GotchaItem[];
  warnings: GotchaItem[];
}

export interface GotchaItem {
  file: string;
  line: number;
  text: string;
  type: "TODO" | "FIXME" | "HACK" | "WARNING";
}

export function extractCodeGotchas(rootDir: string): CodeGotchas {
  const gotchas: CodeGotchas = {
    todos: [],
    fixmes: [],
    hacks: [],
    warnings: [],
  };

  const sourceFiles = findSourceFiles(rootDir, 200);

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const todoMatch = line.match(/\/\/\s*TODO[:\s](.*)/i) || line.match(/#\s*TODO[:\s](.*)/i);
        if (todoMatch) {
          gotchas.todos.push({
            file: relativePath,
            line: i + 1,
            text: todoMatch[1].trim(),
            type: "TODO",
          });
        }

        const fixmeMatch = line.match(/\/\/\s*FIXME[:\s](.*)/i) || line.match(/#\s*FIXME[:\s](.*)/i);
        if (fixmeMatch) {
          gotchas.fixmes.push({
            file: relativePath,
            line: i + 1,
            text: fixmeMatch[1].trim(),
            type: "FIXME",
          });
        }

        const hackMatch = line.match(/\/\/\s*HACK[:\s](.*)/i) || line.match(/#\s*HACK[:\s](.*)/i);
        if (hackMatch) {
          gotchas.hacks.push({
            file: relativePath,
            line: i + 1,
            text: hackMatch[1].trim(),
            type: "HACK",
          });
        }

        const warningMatch = line.match(/\/\/\s*WARNING[:\s](.*)/i) || line.match(/#\s*WARNING[:\s](.*)/i) || line.match(/\/\/\s*WARN[:\s](.*)/i);
        if (warningMatch) {
          gotchas.warnings.push({
            file: relativePath,
            line: i + 1,
            text: warningMatch[1].trim(),
            type: "WARNING",
          });
        }
      }
    } catch {}
  }

  gotchas.todos = gotchas.todos.slice(0, 10);
  gotchas.fixmes = gotchas.fixmes.slice(0, 10);
  gotchas.hacks = gotchas.hacks.slice(0, 5);
  gotchas.warnings = gotchas.warnings.slice(0, 5);

  return gotchas;
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
