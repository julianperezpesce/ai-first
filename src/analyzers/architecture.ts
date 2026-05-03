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
  
  const hasViews = dirs.some(d => d.includes("views") || d.includes("templates") || d.includes("pages"));
  const hasControllers = dirs.some(d => d.includes("controllers") || d.includes("handlers") || d.includes("api"));
  const hasModels = dirs.some(d => d.includes("models") || d.includes("entities") || d.includes("schemas"));
  const hasServices = dirs.some(d => d.includes("services") || d.includes("usecases") || d.includes("business"));
  const hasRepositories = dirs.some(d => d.includes("repositories") || d.includes("dao") || d.includes("persistence"));
  
  const isAPIProject = hasControllers && !hasViews && (hasServices || hasRepositories);
  
  if (isAPIProject) {
    patterns.push("Layered Architecture (REST API)");
  }
  
  // Strict MVC - requires views/templates
  else if (dirs.some(d => d.includes("controllers")) && hasViews && hasModels) {
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
  
  // Layered (for projects that don't qualify as REST API)
  if (!isAPIProject && dirs.some(d => d.includes("layers") || d.includes("services") || d.includes("repositories") || d.includes("controllers"))) {
    patterns.push("Layered Architecture");
  }
  
  // Monorepo
  if (dirs.some(d => d === "packages" || d.startsWith("packages/")) ||
      dirs.some(d => d === "apps" || d.startsWith("apps/"))) {
    patterns.push("Monorepo");
  }
  
  // Microservices - check for multiple service subdirectories
  const serviceSubdirs = new Set<string>();
  const apiSubdirs = new Set<string>();
  const versionPattern = /^v?\d+$/i;
  
  for (const file of files) {
    const parts = file.relativePath.split("/");
    const servicesIndex = parts.indexOf("services");
    if (servicesIndex >= 0 && servicesIndex < parts.length - 2) {
      const subdir = parts[servicesIndex + 1];
      if (!versionPattern.test(subdir)) {
        serviceSubdirs.add(subdir);
      }
    }
    if (parts[0] === "api" && parts.length > 2) {
      const subdir = parts[1];
      if (!versionPattern.test(subdir)) {
        apiSubdirs.add(subdir);
      }
    }
  }
  
  if (serviceSubdirs.size >= 2 || apiSubdirs.size >= 2) {
    patterns.push("Microservices");
  } else if (!isAPIProject && (dirs.some(d => d === "services" || d === "api") ||
             files.some(f => f.relativePath.includes("/services/") || f.relativePath.includes("/api/")) ||
             serviceSubdirs.size === 1 || apiSubdirs.size === 1)) {
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
  
  // CLI Tool - skip DI advice for CLI
  if (dirs.some(d => d.includes("commands") || d.includes("cli"))) {
    patterns.push("CLI Application");
  }
  
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
  
  // Domain keyword detection - extract business domain from directory name
  const domainPatterns: Array<{ keywords: string[]; domain: string }> = [
    // User management and authentication
    { keywords: ["user", "users", "account", "accounts", "profile", "profiles"], domain: "User management" },
    { keywords: ["auth", "authentication", "authorization", "login", "signin", "signup", "password", "credential"], domain: "Authentication" },
    
    // Order processing and payments
    { keywords: ["order", "orders", "purchase", "purchases", "checkout", "cart", "basket"], domain: "Order processing" },
    { keywords: ["payment", "payments", "invoice", "invoices", "billing", "transaction", "checkout"], domain: "Payment processing" },
    
    // Product and inventory
    { keywords: ["product", "products", "catalog", "catalogs", "item", "items", "sku"], domain: "Product catalog" },
    { keywords: ["inventory", "stock", "warehouse", "supply", "supplies"], domain: "Inventory management" },
    
    // Content management
    { keywords: ["blog", "blogs", "post", "posts", "article", "articles"], domain: "Blog/Content management" },
    { keywords: ["cms", "content", "page", "pages"], domain: "Content management" },
    
    // Messaging and notifications
    { keywords: ["message", "messages", "chat", "conversation"], domain: "Messaging" },
    { keywords: ["notification", "notifications", "alert", "alerts", "push"], domain: "Notifications" },
    { keywords: ["email", "mail", "smtp"], domain: "Email handling" },
    { keywords: ["sms", "twilio", "message"], domain: "SMS/Communication" },
    
    // Reporting and analytics
    { keywords: ["report", "reports", "analytics", "dashboard", "dashboards", "metric", "metrics", "stat", "stats", "statistics"], domain: "Reporting and analytics" },
    
    // Administration
    { keywords: ["admin", "administrator", "management"], domain: "Administration" },
    { keywords: ["settings", "setting", "config", "configuration", "preference", "preferences"], domain: "Configuration" },
    
    // File and media management
    { keywords: ["upload", "uploads", "file", "files", "media", "asset", "assets", "image", "images", "document", "documents"], domain: "File and media management" },
    
    // API layer
    { keywords: ["api", "endpoint", "endpoints", "route", "routes", "rest", "graphql"], domain: "API" },
    
    // Background processing
    { keywords: ["worker", "workers", "job", "jobs", "task", "tasks", "queue", "queues", "cron", "scheduler", "background"], domain: "Background processing" },
    
    // Webhooks and integrations
    { keywords: ["webhook", "webhooks", "integration", "integrations", "callback"], domain: "Webhooks and integrations" },
    
    // Session and caching
    { keywords: ["session", "sessions", "cache", "caching", "redis", "memcached"], domain: "Session and caching" },
    
    // Comments and reviews
    { keywords: ["comment", "comments", "review", "reviews", "rating", "feedback"], domain: "Comments and reviews" },
    
    // Search
    { keywords: ["search", "searchable", "query", "filter"], domain: "Search functionality" },
  ];
  
  let detectedDomain: string | null = null;
  for (const pattern of domainPatterns) {
    if (pattern.keywords.some(keyword => name.includes(keyword))) {
      detectedDomain = pattern.domain;
      break;
    }
  }
  
  const technicalPatterns: Array<{ keywords: string[]; responsibility: string }> = [
    { keywords: ["api", "controller", "route", "routes", "endpoint", "endpoints", "rest"], responsibility: "API endpoints and request handling" },
    { keywords: ["service", "services", "usecase", "usecases", "handler", "handlers", "business"], responsibility: "Business logic and use cases" },
    { keywords: ["model", "models", "entity", "entities", "schema", "schemas", "domain"], responsibility: "Data models and entities" },
    { keywords: ["repository", "repositories", "persistence", "db", "database", "dao", "data"], responsibility: "Data persistence and database operations" },
    { keywords: ["view", "views", "page", "pages", "screen", "screens", "component", "components", "ui"], responsibility: "UI components and views" },
    { keywords: ["middleware"], responsibility: "Request/response middleware" },
    { keywords: ["util", "utils", "utility", "helper", "helpers", "lib", "libs", "common", "shared"], responsibility: "Utility functions and helpers" },
    { keywords: ["test", "tests", "spec", "specs", "mock", "mocks", "fixture", "fixtures", "__tests__"], responsibility: "Testing utilities and mocks" },
    { keywords: ["types", "type", "interface", "interfaces", "typescript"], responsibility: "Type definitions and interfaces" },
    { keywords: ["constant", "constants", "const"], responsibility: "Constants and configuration values" },
  ];
  
  let detectedTechnical: string | null = null;
  for (const pattern of technicalPatterns) {
    if (pattern.keywords.some(keyword => name.includes(keyword))) {
      detectedTechnical = pattern.responsibility;
      break;
    }
  }
  
  if (detectedDomain && detectedTechnical) {
    if (detectedTechnical.includes("API") || detectedTechnical.includes("endpoint")) {
      return `${detectedDomain} API`;
    }
    if (detectedTechnical.includes("Business logic") || detectedTechnical.includes("use case")) {
      return `${detectedDomain} business logic`;
    }
    if (detectedTechnical.includes("Data model") || detectedTechnical.includes("entity")) {
      return `${detectedDomain} models and entities`;
    }
    if (detectedTechnical.includes("Data persistence") || detectedTechnical.includes("database")) {
      return `${detectedDomain} data persistence`;
    }
    if (detectedTechnical.includes("UI") || detectedTechnical.includes("view")) {
      return `${detectedDomain} UI components`;
    }
    return `${detectedDomain} - ${detectedTechnical}`;
  }
  
  if (detectedDomain) {
    if (name.includes("service") || name.includes("handler")) {
      return `${detectedDomain} services`;
    }
    if (name.includes("model") || name.includes("entity")) {
      return `${detectedDomain} models`;
    }
    if (name.includes("controller") || name.includes("api")) {
      return `${detectedDomain} API`;
    }
    if (name.includes("repository") || name.includes("db")) {
      return `${detectedDomain} data layer`;
    }
    return detectedDomain;
  }
  
  if (detectedTechnical) {
    return detectedTechnical;
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
  const lines: string[] = [];
  
  lines.push(`# Architecture`);
  lines.push("");
  lines.push(analysis.description);
  lines.push("");
  
  if (analysis.modules.length > 0) {
    lines.push(`## Components`);
    lines.push("");
    lines.push("| Component | Type | Path | Files |");
    lines.push("|-----------|------|------|-------|");
    
    for (const mod of analysis.modules) {
      const modType = mod.responsibility.toLowerCase().includes("api") ? "module" :
                      mod.responsibility.toLowerCase().includes("service") ? "service" :
                      mod.responsibility.toLowerCase().includes("ui") || mod.responsibility.toLowerCase().includes("view") ? "ui" :
                      mod.responsibility.toLowerCase().includes("data") || mod.responsibility.toLowerCase().includes("model") ? "data" :
                      "module";
      lines.push(`| ${mod.name} | ${modType} | \`${mod.path}\` | ${mod.dependencies.length + 1} |`);
    }
    lines.push("");
  }
  
  lines.push(`## Module Details`);
  lines.push("");
  
  for (const mod of analysis.modules) {
    lines.push(`### ${mod.name}`);
    lines.push(`- **Path**: \`${mod.path}\``);
    lines.push(`- **Responsibility**: ${mod.responsibility}`);
    if (mod.dependencies.length > 0) {
      lines.push(`- **Depends on**: ${mod.dependencies.join(", ")}`);
    }
    lines.push("");
  }
  
  lines.push(`## Recommendations`);
  lines.push("");
  lines.push(`- Keep the architecture consistent as the project grows`);
  lines.push(`- Follow the established layer structure`);
  lines.push(`- Use dependency injection to manage module relationships`);
  lines.push("");
  lines.push(`---`);
  lines.push(`*Generated by ai-first*`);
  
  return lines.join("\n");
}
