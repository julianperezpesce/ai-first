import fs from "fs";
import path from "path";

export interface ImpactAnalysis {
  file: string;
  impacts: ImpactEntry[];
  impactedBy: string[];
}

export interface ImpactEntry {
  file: string;
  reason: string;
  type: "imports" | "imports-from" | "shared-dependency" | "test";
}

export function analyzeDependencyImpact(rootDir: string): ImpactAnalysis[] {
  const analyses: ImpactAnalysis[] = [];
  const sourceFiles = findSourceFiles(rootDir, 150);
  const importMap = buildImportMap(sourceFiles, rootDir);

  for (const file of sourceFiles) {
    const relativePath = path.relative(rootDir, file);
    const impacts: ImpactEntry[] = [];
    const impactedBy: string[] = [];

    const directImports = importMap.get(relativePath) || [];
    for (const imported of directImports) {
      impacts.push({
        file: imported,
        reason: `Direct import of ${path.basename(imported)}`,
        type: "imports",
      });
    }

    for (const [otherFile, imports] of importMap) {
      if (otherFile !== relativePath && imports.includes(relativePath)) {
        impacts.push({
          file: otherFile,
          reason: `Imports ${path.basename(relativePath)}`,
          type: "imports-from",
        });
        impactedBy.push(otherFile);
      }
    }

    const testFile = findRelatedTest(relativePath, rootDir);
    if (testFile) {
      impacts.push({
        file: testFile,
        reason: "Test file for this source",
        type: "test",
      });
    }

    if (impacts.length > 0) {
      analyses.push({
        file: relativePath,
        impacts: impacts.slice(0, 10),
        impactedBy: impactedBy.slice(0, 5),
      });
    }
  }

  return analyses.sort((a, b) => b.impacts.length - a.impacts.length).slice(0, 20);
}

function buildImportMap(files: string[], rootDir: string): Map<string, string[]> {
  const importMap = new Map<string, string[]>();

  for (const file of files) {
    const relativePath = path.relative(rootDir, file);
    const imports: string[] = [];

    try {
      const content = fs.readFileSync(file, "utf-8");
      const importPatterns = [
        /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
        /import\s+['"]([^'"]+)['"]/g,
        /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /from\s+(\w+)\s+import/g,
        /import\s+(\w+)/g,
      ];

      for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const importPath = match[1];
          if (importPath.startsWith(".") || importPath.startsWith("/")) {
            const resolved = resolveImportPath(importPath, file, rootDir);
            if (resolved) {
              imports.push(resolved);
            }
          }
        }
      }
    } catch {}

    importMap.set(relativePath, [...new Set(imports)]);
  }

  return importMap;
}

function resolveImportPath(importPath: string, fromFile: string, rootDir: string): string | null {
  const fromDir = path.dirname(fromFile);
  let resolved = path.resolve(fromDir, importPath);

  const extensions = [".ts", ".js", ".tsx", ".jsx", ".py", ".go", ".rs", ".java", ".rb", ".php"];

  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    return path.relative(rootDir, resolved);
  }

  for (const ext of extensions) {
    if (fs.existsSync(resolved + ext)) {
      return path.relative(rootDir, resolved + ext);
    }
  }

  if (fs.existsSync(path.join(resolved, "index.ts")) || fs.existsSync(path.join(resolved, "index.js"))) {
    return path.relative(rootDir, path.join(resolved, "index.ts"));
  }

  return null;
}

function findRelatedTest(sourceFile: string, rootDir: string): string | null {
  const basename = path.basename(sourceFile).replace(/\.(ts|js|py|go|rs|java|rb|php)$/, "");
  const dirname = path.dirname(sourceFile);

  const testPatterns = [
    `${basename}.test.ts`, `${basename}.test.js`,
    `${basename}.spec.ts`, `${basename}.spec.js`,
    `test_${basename}.py`, `${basename}_test.py`,
    `${basename}_test.go`, `${basename}Test.java`,
  ];

  const testDirs = ["tests", "test", "__tests__", "spec"];

  for (const testDir of testDirs) {
    for (const pattern of testPatterns) {
      const testPath = path.join(rootDir, testDir, pattern);
      if (fs.existsSync(testPath)) {
        return path.relative(rootDir, testPath);
      }
    }
  }

  for (const pattern of testPatterns) {
    const testPath = path.join(dirname, pattern);
    if (fs.existsSync(testPath)) {
      return path.relative(rootDir, testPath);
    }
  }

  return null;
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
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext)) && !entry.name.includes(".test.") && !entry.name.includes(".spec.")) {
          files.push(fullPath);
        }
      }
    } catch {}
  }

  walk(rootDir);
  return files;
}
