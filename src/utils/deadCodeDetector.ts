import fs from "fs";
import path from "path";

export interface DeadCode {
  unusedFunctions: UnusedItem[];
  unusedClasses: UnusedItem[];
  unusedFiles: UnusedItem[];
  summary: string;
}

export interface UnusedItem {
  name: string;
  file: string;
  line: number;
  type: "function" | "class" | "file";
}

export function detectDeadCode(rootDir: string): DeadCode {
  const result: DeadCode = {
    unusedFunctions: [],
    unusedClasses: [],
    unusedFiles: [],
    summary: "",
  };

  const sourceFiles = findSourceFiles(rootDir, 150);
  const exportedSymbols = new Map<string, { file: string; line: number; type: string }>();
  const importedSymbols = new Set<string>();

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const exportFuncMatch = line.match(/export\s+(?:async\s+)?function\s+(\w+)/);
        if (exportFuncMatch) {
          exportedSymbols.set(exportFuncMatch[1], { file: relativePath, line: i + 1, type: "function" });
        }

        const exportClassMatch = line.match(/export\s+class\s+(\w+)/);
        if (exportClassMatch) {
          exportedSymbols.set(exportClassMatch[1], { file: relativePath, line: i + 1, type: "class" });
        }

        const exportConstMatch = line.match(/export\s+const\s+(\w+)/);
        if (exportConstMatch) {
          exportedSymbols.set(exportConstMatch[1], { file: relativePath, line: i + 1, type: "function" });
        }

        const defFuncMatch = line.match(/def\s+(\w+)\s*\(/);
        if (defFuncMatch && !defFuncMatch[1].startsWith("_")) {
          exportedSymbols.set(defFuncMatch[1], { file: relativePath, line: i + 1, type: "function" });
        }

        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch) {
          exportedSymbols.set(classMatch[1], { file: relativePath, line: i + 1, type: "class" });
        }

        const importMatches = content.matchAll(/import\s+.*?{([^}]+)}\s+from/g);
        for (const match of importMatches) {
          const imports = match[1].split(",").map(s => s.trim().split(" as ")[0].trim());
          imports.forEach(imp => importedSymbols.add(imp));
        }

        const importFromMatches = content.matchAll(/from\s+['"][^'"]+['"]\s+import\s+([^;]+)/g);
        for (const match of importFromMatches) {
          const imports = match[1].split(",").map(s => s.trim().split(" as ")[0].trim());
          imports.forEach(imp => importedSymbols.add(imp));
        }

        const requireMatches = content.matchAll(/(?:const|let|var)\s+(?:{([^}]+)}|\w+)\s*=\s*require/g);
        for (const match of requireMatches) {
          if (match[1]) {
            const imports = match[1].split(",").map(s => s.trim().split(" as ")[0].trim());
            imports.forEach(imp => importedSymbols.add(imp));
          }
        }

        const usageMatches = content.matchAll(/\b([A-Z]\w+)\b/g);
        for (const match of usageMatches) {
          importedSymbols.add(match[1]);
        }

        const funcCallMatches = content.matchAll(/\b(\w+)\s*\(/g);
        for (const match of funcCallMatches) {
          importedSymbols.add(match[1]);
        }
      }
    } catch {}
  }

  const testFiles = findTestFiles(rootDir, 30);
  for (const file of testFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const usageMatches = content.matchAll(/\b([A-Z]\w+)\b/g);
      for (const match of usageMatches) {
        importedSymbols.add(match[1]);
      }
      const funcCallMatches = content.matchAll(/\b(\w+)\s*\(/g);
      for (const match of funcCallMatches) {
        importedSymbols.add(match[1]);
      }
    } catch {}
  }

  for (const [symbol, info] of exportedSymbols) {
    if (!importedSymbols.has(symbol) && !isCommonName(symbol)) {
      const item: UnusedItem = {
        name: symbol,
        file: info.file,
        line: info.line,
        type: info.type as "function" | "class",
      };

      if (info.type === "function") {
        result.unusedFunctions.push(item);
      } else if (info.type === "class") {
        result.unusedClasses.push(item);
      }
    }
  }

  const entryFiles = new Set<string>();
  for (const file of sourceFiles) {
    const relativePath = path.relative(rootDir, file);
    const basename = path.basename(file);
    
    if (basename === "index.ts" || basename === "index.js" || basename === "main.ts" || 
        basename === "main.py" || basename === "main.go" || basename === "app.ts" || 
        basename === "app.js" || basename === "server.ts" || basename === "server.js") {
      entryFiles.add(relativePath);
    }
  }

  for (const file of sourceFiles) {
    const relativePath = path.relative(rootDir, file);
    if (entryFiles.has(relativePath)) continue;

    let isImported = false;
    for (const otherFile of sourceFiles) {
      if (otherFile === file) continue;
      try {
        const content = fs.readFileSync(otherFile, "utf-8");
        const basename = path.basename(file, path.extname(file));
        if (content.includes(basename) || content.includes(relativePath)) {
          isImported = true;
          break;
        }
      } catch {}
    }

    if (!isImported) {
      result.unusedFiles.push({
        name: path.basename(file),
        file: relativePath,
        line: 0,
        type: "file",
      });
    }
  }

  result.unusedFunctions = result.unusedFunctions.slice(0, 10);
  result.unusedClasses = result.unusedClasses.slice(0, 5);
  result.unusedFiles = result.unusedFiles.slice(0, 5);

  const total = result.unusedFunctions.length + result.unusedClasses.length + result.unusedFiles.length;
  result.summary = total > 0 
    ? `Found ${total} potentially unused items (${result.unusedFunctions.length} functions, ${result.unusedClasses.length} classes, ${result.unusedFiles.length} files)`
    : "No dead code detected";

  return result;
}

function isCommonName(name: string): boolean {
  const commonNames = [
    "Error", "Exception", "Response", "Request", "Config", "Logger", "App", "Server",
    "Router", "Controller", "Service", "Repository", "Model", "Schema", "Type",
    "Interface", "Component", "Module", "Plugin", "Middleware", "Handler",
    "Test", "Spec", "Mock", "Stub", "Factory", "Builder", "Adapter",
  ];
  return commonNames.includes(name);
}

function findSourceFiles(rootDir: string, maxFiles: number): string[] {
  const files: string[] = [];
  const extensions = [".ts", ".js", ".py", ".go", ".rs", ".java", ".rb", ".php"];
  const excludeDirs = ["node_modules", ".git", "dist", "build", "__pycache__", "vendor", ".venv", "venv", "fixtures", "test", "tests", "__tests__"];

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

function findTestFiles(rootDir: string, maxFiles: number): string[] {
  const files: string[] = [];
  const testPatterns = [".test.ts", ".test.js", ".spec.ts", ".spec.js", "test_", "_test.py"];
  const testDirs = ["tests", "test", "__tests__", "spec"];

  function walk(dir: string) {
    if (files.length >= maxFiles) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= maxFiles) return;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (testDirs.includes(entry.name) || !["node_modules", ".git", "dist", "build", "fixtures"].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && testPatterns.some(p => entry.name.includes(p))) {
          files.push(fullPath);
        }
      }
    } catch {}
  }

  walk(rootDir);
  return files;
}
