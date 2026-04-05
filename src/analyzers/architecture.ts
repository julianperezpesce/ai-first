import { FileInfo, groupByDirectory, groupByExtension } from "../core/repoScanner.js";
import { readFile } from "../utils/fileUtils.js";
import path from "path";

export interface ArchitectureAnalysis {
  pattern: string;
  layers: string[];
  modules: ModuleInfo[];
  description: string;
}

export interface ModuleInfo {
  name: string;
  path: string;
  responsibility: string;
  dependencies: string[];
}

/**
 * Detect architecture pattern and analyze structure
 */
export function analyzeArchitecture(
  files: FileInfo[],
  rootDir: string
): ArchitectureAnalysis {
  const directories = Array.from(groupByDirectory(files).keys());
  const extensions = Array.from(groupByExtension(files).keys());
  
  // Detect patterns based on directory structure
  const patterns = detectPatterns(directories, extensions, files);
  
  // Identify layers
  const layers = detectLayers(directories);
  
  // Identify modules
  const modules = detectModules(files, directories);
  
  // Generate description
  const description = generateArchitectureDescription(patterns, layers, modules, extensions);
  
  return {
    pattern: patterns[0] || "Monolithic",
    layers,
    modules,
    description,
  };
}

/**
 * Detect architecture patterns from directory structure
 */
function detectPatterns(directories: string[], extensions: string[], files: FileInfo[]): string[] {
  const patterns: string[] = [];
  const dirs = directories.filter(d => d && d !== "root");
  
  // Check for common patterns
  const hasSrc = dirs.some(d => d === "src" || d.startsWith("src/"));
  const hasTest = dirs.some(d => d === "test" || d.startsWith("test/") || d === "__tests__");
  const hasLib = dirs.some(d => d === "lib" || d.startsWith("lib/"));
  const hasInternal = dirs.some(d => d === "internal" || d.startsWith("internal/"));
  const hasPackages = dirs.some(d => d === "packages" || d.startsWith("packages/"));
  const hasApps = dirs.some(d => d === "apps" || d.startsWith("apps/"));
  
  // MVC patterns
  if (dirs.some(d => d.includes("controllers") || d.includes("views") || d.includes("models"))) {
    patterns.push("MVC (Model-View-Controller)");
  }
  
  // Hexagonal / Ports & Adapters
  if (dirs.some(d => d.includes("domain") || d.includes("application") || d.includes("infrastructure") || d.includes("ports") || d.includes("adapters"))) {
    patterns.push("Hexagonal (Ports & Adapters)");
  }
  
  // Clean Architecture
  if (dirs.some(d => d.includes("entities") || d.includes("use-cases") || d.includes("interfaces"))) {
    patterns.push("Clean Architecture");
  }
  
  // Layered
  if (dirs.some(d => d.includes("layers") || d.includes("services") || d.includes("repositories") || d.includes("controllers"))) {
    patterns.push("Layered Architecture");
  }
  
  // Monorepo
  if (hasPackages || hasApps) {
    patterns.push("Monorepo");
  }
  
  // Microservices - check for multiple service subdirectories
  const serviceSubdirs = new Set<string>();
  const apiSubdirs = new Set<string>();
  const versionPattern = /^v?\d+$/i;
  
  for (const file of files) {
    const parts = file.relativePath.split("/");
    // Check for services/*/ pattern (must be an actual subdirectory, not a file)
    const servicesIndex = parts.indexOf("services");
    if (servicesIndex >= 0 && servicesIndex < parts.length - 2) {
      // parts.length - 2 ensures there's at least one directory after 'services' before the file
      const subdir = parts[servicesIndex + 1];
      if (!versionPattern.test(subdir)) {
        serviceSubdirs.add(subdir);
      }
    }
    // Check for api/*/ pattern at root level (must be an actual subdirectory)
    if (parts[0] === "api" && parts.length > 2) {
      // parts.length > 2 ensures there's at least one directory after 'api' before the file
      const subdir = parts[1];
      if (!versionPattern.test(subdir)) {
        apiSubdirs.add(subdir);
      }
    }
  }
  
  if (serviceSubdirs.size >= 2 || apiSubdirs.size >= 2) {
    patterns.push("Microservices");
  } else if (dirs.some(d => d === "services" || d === "api") ||
             files.some(f => f.relativePath.includes("/services/") || f.relativePath.includes("/api/")) ||
             serviceSubdirs.size === 1 || apiSubdirs.size === 1) {
    patterns.push("API Server");
  }
  
  // Serverless / Functions
  if (dirs.some(d => d.includes("functions") || d.includes("handlers") || d.includes("lambda"))) {
    patterns.push("Serverless / Functions");
  }
  
  // SPA / Frontend
  if (extensions.includes("vue") || extensions.includes("svelte") || extensions.includes("jsx") || extensions.includes("tsx")) {
    if (dirs.some(d => d.includes("components") || d.includes("pages") || d.includes("routes"))) {
      patterns.push("SPA (Single Page Application)");
    }
  }
  
  // CLI Tool
  if (dirs.some(d => d.includes("commands") || d.includes("cli"))) {
    patterns.push("CLI Application");
  }
  
  // Default if no pattern detected
  if (patterns.length === 0) {
    patterns.push("Flat / Simple Structure");
  }
  
  return patterns;
}

/**
 * Detect layers in the architecture
 */
function detectLayers(directories: string[]): string[] {
  const layers: string[] = [];
  const dirs = directories.filter(d => d && d !== "root");
  
  const layerMap: Record<string, string[]> = {
    "presentation": ["ui", "views", "pages", "screens", "components", "templates"],
    "application": ["services", "use-cases", "handlers", "controllers", "api", "routes", "endpoints"],
    "domain": ["domain", "entities", "models", "business", "core"],
    "infrastructure": ["infrastructure", "adapters", "repositories", "persistence", "db", "database", "config"],
    "utilities": ["utils", "helpers", "lib", "shared", "common", "tools"],
    "tests": ["test", "tests", "__tests__", "spec", "mocks", "fixtures"],
    "assets": ["assets", "public", "static", "resources", "media"],
    "config": ["config", "configs", ".config", ".env"],
  };
  
  for (const [layerName, keywords] of Object.entries(layerMap)) {
    if (dirs.some(d => keywords.some(k => d.includes(k)))) {
      layers.push(layerName);
    }
  }
  
  return layers;
}

/**
 * Detect modules in the project
 */
function detectModules(files: FileInfo[], directories: string[]): ModuleInfo[] {
  const modules: ModuleInfo[] = [];
  const dirs = directories.filter(d => d && d !== "root");
  
  for (const dir of dirs.slice(0, 20)) { // Limit to 20 modules
    // Skip root-level files (entries without "/" that are not real directories)
    // A proper directory should have files under it with path "dir/file"
    const moduleFiles = files.filter(f => f.relativePath.startsWith(dir + "/"));
    
    // Skip if no files found under this directory (it's likely a root-level file misidentified as directory)
    if (moduleFiles.length === 0) {
      continue;
    }
    
    const mainFiles = moduleFiles.filter(f => {
      const name = f.name.toLowerCase();
      return name === "index.ts" || name === "mod.ts" || name === "mod.rs" || 
             name === "mod.py" || name === "__init__.py" || 
             name === dir.split("/").pop() + ".ts" ||
             name === dir.split("/").pop() + ".js";
    });
    
    const responsibility = inferModuleResponsibility(dir, moduleFiles.map(f => f.extension));
    
    modules.push({
      name: dir.split("/").pop() || dir,
      path: dir,
      responsibility,
      dependencies: inferDependencies(dir),
    });
  }
  
  return modules;
}

/**
 * Infer module responsibility from its name and file types
 */
function inferModuleResponsibility(dir: string, extensions: string[]): string {
  const name = dir.toLowerCase();
  
  if (name.includes("api") || name.includes("controller") || name.includes("route") || name.includes("endpoint")) {
    return "API endpoints and request handling";
  }
  if (name.includes("service") || name.includes("usecase") || name.includes("handler")) {
    return "Business logic and use cases";
  }
  if (name.includes("model") || name.includes("entity") || name.includes("schema")) {
    return "Data models and entities";
  }
  if (name.includes("repository") || name.includes("persistence") || name.includes("db")) {
    return "Data persistence and database operations";
  }
  if (name.includes("view") || name.includes("page") || name.includes("screen") || name.includes("component")) {
    return "UI components and views";
  }
  if (name.includes("config") || name.includes("env")) {
    return "Configuration management";
  }
  if (name.includes("util") || name.includes("helper") || name.includes("lib")) {
    return "Utility functions and helpers";
  }
  if (name.includes("test") || name.includes("spec") || name.includes("mock")) {
    return "Testing utilities and mocks";
  }
  if (name.includes("middleware")) {
    return "Request/response middleware";
  }
  if (name.includes("auth") || name.includes("security") || name.includes("login")) {
    return "Authentication and authorization";
  }

  // Infer from file types
  const uniqueExts = [...new Set(extensions)];
  if (uniqueExts.includes("ts") || uniqueExts.includes("tsx") || uniqueExts.includes("js") || uniqueExts.includes("jsx")) {
    if (uniqueExts.includes("css") || uniqueExts.includes("scss") || uniqueExts.includes("less")) {
      return "Frontend components and styling";
    }
    return "JavaScript/TypeScript implementation";
  }
  if (uniqueExts.includes("py")) {
    return "Python implementation";
  }
  if (uniqueExts.includes("java")) {
    return "Java implementation";
  }
  if (uniqueExts.includes("go")) {
    return "Go implementation";
  }
  if (uniqueExts.includes("rs")) {
    return "Rust implementation";
  }
  if (uniqueExts.includes("php")) {
    return "PHP implementation";
  }
  if (uniqueExts.includes("rb")) {
    return "Ruby implementation";
  }
  if (uniqueExts.includes("swift")) {
    return "Swift implementation";
  }
  if (uniqueExts.includes("kt")) {
    return "Kotlin implementation";
  }
  if (uniqueExts.includes("cls") || uniqueExts.includes("trigger")) {
    return "Apex/Salesforce implementation";
  }

  // Fallback based on file count and primary language
  if (extensions.length === 1) {
    return "Single file module";
  }
  const primaryExt = uniqueExts[0] || 'code';
  return `${primaryExt.toUpperCase()} module with ${extensions.length} files`;
}

/**
 * Infer module dependencies
 */
function inferDependencies(dir: string): string[] {
  const deps: string[] = [];
  const name = dir.toLowerCase();
  
  // Common dependency relationships
  if (name.includes("controller") || name.includes("api")) {
    deps.push("service", "model");
  }
  if (name.includes("service") || name.includes("usecase")) {
    deps.push("model", "repository");
  }
  if (name.includes("repository")) {
    deps.push("model");
  }
  if (name.includes("component") || name.includes("view") || name.includes("page")) {
    deps.push("service", "model", "util");
  }
  
  return deps;
}

/**
 * Generate architecture description
 */
function generateArchitectureDescription(
  patterns: string[],
  layers: string[],
  modules: ModuleInfo[],
  extensions: string[]
): string {
  const lines: string[] = [];
  
  lines.push(`## Architectural Pattern`);
  lines.push(`**Primary**: ${patterns[0] || "Unknown"}`);
  if (patterns.length > 1) {
    lines.push(`**Secondary**: ${patterns.slice(1).join(", ")}`);
  }
  lines.push("");
  
  if (layers.length > 0) {
    lines.push(`## Layers Identified`);
    lines.push(layers.map(l => `- ${l.charAt(0).toUpperCase() + l.slice(1)}`).join("\n"));
    lines.push("");
  }
  
  if (modules.length > 0) {
    lines.push(`## Key Modules`);
    lines.push("| Module | Responsibility |");
    lines.push("|--------|----------------|");
    for (const mod of modules.slice(0, 10)) {
      lines.push(`| \`${mod.path}\` | ${mod.responsibility} |`);
    }
    lines.push("");
  }
  
  return lines.join("\n");
}

/**
 * Generate architecture.md content
 */
export function generateArchitectureFile(analysis: ArchitectureAnalysis): string {
  return `# Architecture

${analysis.description}

## Module Details

${analysis.modules.map(m => `### ${m.name}
- **Path**: \`${m.path}\`
- **Responsibility**: ${m.responsibility}
${m.dependencies.length > 0 ? `- **Depends on**: ${m.dependencies.join(", ")}` : ""}
`).join("\n")}

## Recommendations

- Keep the architecture consistent as the project grows
- Follow the established layer structure
- Use dependency injection to manage module relationships

---
*Generated by ai-first*
`;
}
