import { FileInfo } from "../core/repoScanner.js";
import { readFile } from "../utils/fileUtils.js";

export interface Dependency {
  source: string;
  target: string;
  type: "import" | "require" | "include" | "use" | "from";
}

export interface DependencyAnalysis {
  dependencies: Dependency[];
  byFile: Record<string, string[]>;
  modules: string[];
  circularDeps?: string[];
}

/**
 * Analyze dependencies between files
 */
export function analyzeDependencies(files: FileInfo[]): DependencyAnalysis {
  const dependencies: Dependency[] = [];
  const byFile: Record<string, string[]> = {};
  const modules = new Set<string>();

  for (const file of files) {
    const fileDeps = parseFileForDependencies(file);
    dependencies.push(...fileDeps);

    if (fileDeps.length > 0) {
      byFile[file.relativePath] = fileDeps.map(d => d.target);
    }

    // Track modules (files that are imported by others)
    if (fileDeps.length > 0) {
      modules.add(file.relativePath);
    }
  }

  // Detect potential circular dependencies
  const circularDeps = detectCircularDependencies(byFile);

  return {
    dependencies,
    byFile,
    modules: Array.from(modules),
    circularDeps: circularDeps.length > 0 ? circularDeps : undefined,
  };
}

/**
 * Parse a single file for dependencies
 */
function parseFileForDependencies(file: FileInfo): Dependency[] {
  const deps: Dependency[] = [];
  
  try {
    const content = readFile(file.path);
    
    if (file.extension === "ts" || file.extension === "tsx" || file.extension === "js" || file.extension === "jsx") {
      deps.push(...parseJavaScriptImports(content, file.relativePath));
    } else if (file.extension === "py") {
      deps.push(...parsePythonImports(content, file.relativePath));
    } else if (file.extension === "go") {
      deps.push(...parseGoImports(content, file.relativePath));
    } else if (file.extension === "rs") {
      deps.push(...parseRustImports(content, file.relativePath));
    } else if (file.extension === "java" || file.extension === "cs") {
      deps.push(...parseJavaImports(content, file.relativePath));
    } else if (file.extension === "gradle" || file.extension === "gradle.kts") {
      deps.push(...parseGradleDependencies(content, file.relativePath));
    }
  } catch {}

  return deps;
}

/**
 * Parse JavaScript/TypeScript imports
 */
function parseJavaScriptImports(content: string, sourceFile: string): Dependency[] {
  const deps: Dependency[] = [];
  
  // ES6 imports: import x from 'x' or import { x } from 'x'
  const es6Matches = content.matchAll(/import\s+(?:[\w{},\s]+\s+from\s+)?['"]([@\w\-./]+)['"]/g);
  for (const match of es6Matches) {
    const target = normalizeImportPath(match[1], sourceFile);
    if (target) {
      deps.push({ source: sourceFile, target, type: "import" });
    }
  }

  // CommonJS requires: require('x')
  const requireMatches = content.matchAll(/require\s*\(\s*['"]([@\w\-./]+)['"]\s*\)/g);
  for (const match of requireMatches) {
    const target = normalizeImportPath(match[1], sourceFile);
    if (target) {
      deps.push({ source: sourceFile, target, type: "require" });
    }
  }

  // TypeScript path imports: import x from '@alias/path'
  const pathMatches = content.matchAll(/import\s+[\w{},\s]+\s+from\s+['"]([@\w\-./]+)['"]/g);
  for (const match of pathMatches) {
    const target = normalizeImportPath(match[1], sourceFile);
    if (target) {
      deps.push({ source: sourceFile, target, type: "import" });
    }
  }

  return deps;
}

/**
 * Parse Python imports
 */
function parsePythonImports(content: string, sourceFile: string): Dependency[] {
  const deps: Dependency[] = [];
  
  // from x import y
  const fromMatches = content.matchAll(/^from\s+([@\w.]+)\s+import/gm);
  for (const match of fromMatches) {
    deps.push({
      source: sourceFile,
      target: match[1].replace(/\./g, "/") + ".py",
      type: "from",
    });
  }

  // import x
  const importMatches = content.matchAll(/^import\s+([@\w.]+)/gm);
  for (const match of importMatches) {
    deps.push({
      source: sourceFile,
      target: match[1].replace(/\./g, "/") + ".py",
      type: "import",
    });
  }

  return deps;
}

/**
 * Parse Go imports
 */
function parseGoImports(content: string, sourceFile: string): Dependency[] {
  const deps: Dependency[] = [];
  
  // import "package"
  const importMatches = content.matchAll(/import\s+(?:\(\s*)?["']([@\w\-./]+)["']/g);
  for (const match of importMatches) {
    deps.push({
      source: sourceFile,
      target: match[1],
      type: "import",
    });
  }

  // import alias "package"
  const aliasMatches = content.matchAll(/import\s+(\w+)\s+["']([@\w\-./]+)["']/g);
  for (const match of aliasMatches) {
    deps.push({
      source: sourceFile,
      target: match[2],
      type: "import",
    });
  }

  return deps;
}

/**
 * Parse Rust imports
 */
function parseRustImports(content: string, sourceFile: string): Dependency[] {
  const deps: Dependency[] = [];
  
  // use crate::path
  const useMatches = content.matchAll(/^use\s+(?:crate|self|super|@[\w-]+)::([\w]+)/gm);
  for (const match of useMatches) {
    deps.push({
      source: sourceFile,
      target: match[0].replace(/^use\s+/, "").replace(/::/g, "/") + ".rs",
      type: "use",
    });
  }

  // extern crate
  const externMatches = content.matchAll(/extern\s+crate\s+([\w-]+)/g);
  for (const match of externMatches) {
    deps.push({
      source: sourceFile,
      target: match[1],
      type: "import",
    });
  }

  return deps;
}

/**
 * Parse Java/C# imports
 */
function parseJavaImports(content: string, sourceFile: string): Dependency[] {
  const deps: Dependency[] = [];
  
  // Java: import package.Class;
  const javaMatches = content.matchAll(/^import\s+([\w.]+);/gm);
  for (const match of javaMatches) {
    if (!match[1].startsWith("java.") && !match[1].startsWith("javax.")) {
      deps.push({
        source: sourceFile,
        target: match[1].replace(/\./g, "/") + ".java",
        type: "import",
      });
    }
  }

  // C#: using Namespace;
  const csharpMatches = content.matchAll(/^using\s+([\w.]+);/gm);
  for (const match of csharpMatches) {
    deps.push({
      source: sourceFile,
      target: match[1].replace(/\./g, "/") + ".cs",
      type: "import",
    });
  }

  return deps;
}

/**
 * Normalize import path to relative file path
 */
function normalizeImportPath(importPath: string, sourceFile: string): string | null {
  // Skip node_modules and external packages
  if (importPath.startsWith("@")) {
    // Scoped package - keep as is
    return importPath;
  }
  
  if (importPath.startsWith(".")) {
    // Relative import - convert to file path
    const sourceDir = sourceFile.split("/").slice(0, -1).join("/");
    let target = sourceDir + "/" + importPath;
    
    // Handle index files
    if (!target.endsWith(".js") && !target.endsWith(".ts")) {
      target = target + "/index";
    }
    
    return target;
  }
  
  // Internal non-relative import
  return importPath;
}

/**
 * Detect circular dependencies
 */
function detectCircularDependencies(byFile: Record<string, string[]>): string[] {
  const circular: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(file: string, path: string[]): boolean {
    if (recursionStack.has(file)) {
      circular.push(`${file} -> ${file}`);
      return true;
    }

    if (visited.has(file)) return false;

    visited.add(file);
    recursionStack.add(file);

    const deps = byFile[file] || [];
    for (const dep of deps) {
      if (dfs(dep, [...path, file])) {
        return true;
      }
    }

    recursionStack.delete(file);
    return false;
  }

  for (const file of Object.keys(byFile)) {
    if (!visited.has(file)) {
      dfs(file, []);
    }
  }

  return [...new Set(circular)];
}

/**
 * Generate dependencies.json
 */
export function generateDependenciesJson(analysis: DependencyAnalysis): string {
  const output = {
    totalDependencies: analysis.dependencies.length,
    totalModules: analysis.modules.length,
    dependencies: analysis.dependencies,
    byFile: analysis.byFile,
    circularDependencies: analysis.circularDeps,
  };
  return JSON.stringify(output, null, 2);
}

/**
 * Parse Gradle dependencies from build.gradle files
 */
function parseGradleDependencies(content: string, sourceFile: string): Dependency[] {
  const deps: Dependency[] = [];
  
  // implementation "com.example:library:1.0"
  const implMatches = content.matchAll(/(?:implementation|api|compile|testImplementation|androidTestImplementation)\s+["\']([@\w.\-]+):([@\w.\-]+):([@\w.\-]+)["\']/g);
  for (const match of implMatches) {
    deps.push({
      source: sourceFile,
      target: `${match[1]}:${match[2]}:${match[3]}`,
      type: "import",
    });
  }
  
  // implementation project(":module")
  const projMatches = content.matchAll(/implementation\s+project\s*\(\s*["\']([@\w.\-]+)["\']\s*\)/g);
  for (const match of projMatches) {
    deps.push({
      source: sourceFile,
      target: `project:${match[1]}`,
      type: "import",
    });
  }
  
  // include ":module"
  const includeMatches = content.matchAll(/include\s*\(\s*["\']([@\w.\-]+)["\']\s*\)/g);
  for (const match of includeMatches) {
    deps.push({
      source: sourceFile,
      target: `module:${match[1]}`,
      type: "include",
    });
  }
  
  return deps;
}
