import { FileInfo, groupByDirectory, groupByExtension } from "./repoScanner.js";

export interface RepoMapOptions {
  maxDepth?: number;
  includeExtensions?: boolean;
  sortBy?: "name" | "directory";
}

/**
 * Generate a repo map from scanned files
 */
export function generateRepoMap(
  files: FileInfo[],
  options: RepoMapOptions = {}
): string {
  const { maxDepth = 3, includeExtensions = true, sortBy = "directory" } = options;

  const lines: string[] = [];
  lines.push("# Repository Map\n");

  // Group files
  const grouped =
    sortBy === "directory"
      ? groupByDirectory(files)
      : groupByExtension(files);

  if (sortBy === "directory") {
    // Sort directories alphabetically
    const sortedDirs = Array.from(grouped.keys()).sort();

    for (const dir of sortedDirs) {
      const dirFiles = grouped.get(dir)?.sort((a, b) => a.name.localeCompare(b.name)) || [];
      
      lines.push(`## ${dir === "root" ? "(root)" : dir}\n`);
      
      for (const file of dirFiles) {
        const ext = includeExtensions && file.extension ? `.${file.extension}` : "";
        const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
        const indent = dir === "root" ? "- " : "  - ";
        lines.push(`${indent}${nameWithoutExt}${ext}\n`);
      }
      lines.push("\n");
    }
  } else {
    // Sort by extension
    const sortedExts = Array.from(grouped.keys()).sort();

    for (const ext of sortedExts) {
      const extFiles = grouped.get(ext)?.sort((a, b) => a.name.localeCompare(b.name)) || [];
      
      lines.push(`## ${ext === "no-extension" ? "(no extension)" : `.${ext}`}\n`);
      
      for (const file of extFiles) {
        lines.push(`- ${file.relativePath}\n`);
      }
      lines.push("\n");
    }
  }

  return lines.join("");
}

/**
 * Generate a compact repo map (tree view)
 */
export function generateCompactRepoMap(files: FileInfo[]): string {
  const lines: string[] = [];
  lines.push("# Repository Structure (Tree View)\n");

  // Build tree structure
  const tree = buildTree(files);

  // Render tree
  renderTree(tree, "", lines);

  return lines.join("");
}

/**
 * Build a tree structure from files
 */
interface TreeNode {
  [key: string]: TreeNode | null;
}

function buildTree(files: FileInfo[]): TreeNode {
  const root: TreeNode = {};

  for (const file of files) {
    const parts = file.relativePath.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (!current[part]) {
        current[part] = isFile ? null : {};
      }
      if (!isFile && current[part]) {
        current = current[part] as TreeNode;
      }
    }
  }

  return root;
}

/**
 * Render tree to lines
 */
function renderTree(node: TreeNode, prefix: string, lines: string[]): void {
  const entries = Object.entries(node).sort(([a], [b]) => a.localeCompare(b));
  const dirs: string[] = [];
  const files: string[] = [];

  for (const [key, value] of entries) {
    if (value === null) {
      files.push(key);
    } else {
      dirs.push(key);
    }
  }

  // Render directories first, then files
  const allEntries = [...dirs.sort(), ...files.sort()];

  for (let i = 0; i < allEntries.length; i++) {
    const key = allEntries[i];
    const isLast = i === allEntries.length - 1;
    const isDir = dirs.includes(key);
    const connector = isLast ? "└── " : "├── ";

    lines.push(`${prefix}${connector}${key}${isDir ? "/" : ""}\n`);

    if (isDir) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      renderTree(node[key] as TreeNode, newPrefix, lines);
    }
  }
}

/**
 * Detect frameworks and technologies from file names
 */
function detectFrameworksFromFiles(files: FileInfo[]): string[] {
  const fileNames = new Set(files.map(f => f.name.toLowerCase()));
  const filePaths = files.map(f => f.relativePath.toLowerCase());
  const frameworks: string[] = [];

  // Python frameworks
  if (fileNames.has("manage.py") || fileNames.has("wsgi.py") || fileNames.has("asgi.py")) {
    frameworks.push("Django");
  }
  if (fileNames.has("app.py") || fileNames.has("main.py")) {
    frameworks.push("Flask");
  }
  if (fileNames.has("__init__.py")) {
    const pyFiles = files.filter(f => f.extension === "py");
    if (pyFiles.some(f => f.relativePath.includes("routers") || f.relativePath.includes("routes"))) {
      frameworks.push("FastAPI");
    }
  }

  // JavaScript/TypeScript frameworks
  if (fileNames.has("package.json")) {
    const pkgContent = files.find(f => f.name === "package.json");
    if (pkgContent) {
      try {
        const content = pkgContent.path; // Would need to read file
      } catch {
        // Ignore
      }
    }
  }
  if (fileNames.has("next.config.js") || fileNames.has("next.config.ts")) {
    frameworks.push("Next.js");
  }
  if (fileNames.has("gatsby-config.js") || fileNames.has("gatsby-config.ts")) {
    frameworks.push("Gatsby");
  }

  // Java frameworks
  if (fileNames.has("pom.xml")) {
    frameworks.push("Spring Boot");
  }
  if (fileNames.has("build.gradle") || fileNames.has("build.gradle.kts")) {
    frameworks.push("Gradle");
  }

  // Go
  if (fileNames.has("go.mod")) {
    frameworks.push("Go");
  }

  // Ruby
  if (fileNames.has("gemfile")) {
    frameworks.push("Ruby on Rails");
  }

  // PHP
  if (fileNames.has("composer.json")) {
    frameworks.push("PHP/Laravel");
  }

  // .NET
  if (fileNames.has("project.csproj") || fileNames.has("*.csproj")) {
    frameworks.push(".NET");
  }

  // Rust
  if (fileNames.has("cargo.toml")) {
    frameworks.push("Rust");
  }

  // Salesforce/Apex
  if (fileNames.has("sfdx-project.json") || fileNames.has("package.xml")) {
    frameworks.push("Salesforce");
  }

  // Check for specific directories
  if (filePaths.some(p => p.includes("/controllers/") || p.includes("/controller/"))) {
    if (!frameworks.includes("Express")) {
      frameworks.push("Express");
    }
  }
  if (filePaths.some(p => p.includes("/services/") || p.includes("/handlers/"))) {
    if (!frameworks.includes("NestJS")) {
      frameworks.push("NestJS");
    }
  }
  if (filePaths.some(p => p.includes("/components/") || p.includes("/pages/"))) {
    if (!frameworks.includes("React")) {
      frameworks.push("React");
    }
  }

  return frameworks;
}

/**
 * Infer project purpose from detected frameworks and structure
 */
function inferProjectPurpose(files: FileInfo[], frameworks: string[]): string {
  const filePaths = files.map(f => f.relativePath.toLowerCase());
  const purposes: string[] = [];

  const hasAPI = filePaths.some(p => 
    p.includes("/api/") || p.includes("/controllers/") || 
    p.includes("/routes/") || p.includes("/endpoints/")
  );
  const hasAuth = filePaths.some(p => 
    p.includes("/auth/") || p.includes("/login/") || 
    p.includes("/jwt/") || p.includes("/session/")
  );
  const hasDB = filePaths.some(p => 
    p.includes("/models/") || p.includes("/schemas/") || 
    p.includes("/repositories/") || p.includes("/db/")
  );
  const hasUI = filePaths.some(p => 
    p.includes("/views/") || p.includes("/components/") || 
    p.includes("/pages/") || p.includes("/screens/")
  );
  const isCLI = filePaths.some(p => 
    p.includes("/commands/") || p.includes("/cli/") || 
    filePaths.some(f => f.endsWith("/main.ts") || f.endsWith("/main.go"))
  );
  
  const domainInfo = extractDomainFromPaths(filePaths);

  if (isCLI) {
    purposes.push("CLI tool");
  }

  if (frameworks.includes("Django") || frameworks.includes("Flask") || frameworks.includes("FastAPI")) {
    if (hasAPI) {
      purposes.push("REST API");
    }
    if (hasAuth) {
      purposes.push("with JWT authentication");
    }
  }

  if (frameworks.includes("Express") || frameworks.includes("NestJS")) {
    if (hasAPI) {
      purposes.push("API server");
    }
    if (hasAuth) {
      purposes.push("with authentication");
    }
  }

  if (frameworks.includes("React") || frameworks.includes("Next.js") || frameworks.includes("Gatsby")) {
    if (hasAPI) {
      purposes.push("web application with API backend");
    } else {
      purposes.push("web application");
    }
  }

  if (frameworks.includes("Spring Boot")) {
    purposes.push("Spring Boot application");
    if (hasAPI) {
      purposes.push("REST API");
    }
  }

  if (frameworks.includes("Salesforce")) {
    purposes.push("Salesforce application");
    if (hasAPI) {
      purposes.push("with Apex REST endpoints");
    }
  }

  if (frameworks.includes("Ruby on Rails")) {
    purposes.push("Rails application");
  }

  if (frameworks.includes("Go")) {
    purposes.push("Go service");
  }

  if (frameworks.includes("Rust")) {
    purposes.push("Rust application");
  }

  if (frameworks.includes(".NET")) {
    purposes.push(".NET application");
  }

  if (purposes.length === 0) {
    if (hasUI) {
      purposes.push("web application");
    } else if (hasAPI) {
      purposes.push("API service");
    } else if (isCLI) {
      purposes.push("CLI tool");
    } else if (domainInfo) {
      purposes.push(domainInfo);
    } else {
      purposes.push("software project");
    }
  } else if (domainInfo && !isCLI) {
    purposes.push(`for ${domainInfo}`);
  }

  const uniqueFrameworks = [...new Set(frameworks)];
  if (uniqueFrameworks.length > 0) {
    return `This is a **${uniqueFrameworks.join(", ")}** ${purposes.join(" ")}.`;
  }

  return `This is a ${purposes.join(" ")}.`;
}

function extractDomainFromPaths(filePaths: string[]): string | null {
  const domainPatterns: Array<{ keywords: string[]; domain: string }> = [
    { keywords: ["auth", "login", "signup", "credential"], domain: "authentication" },
    { keywords: ["user", "account", "profile"], domain: "user management" },
    { keywords: ["order", "cart", "checkout", "purchase"], domain: "e-commerce" },
    { keywords: ["product", "catalog", "inventory"], domain: "product management" },
    { keywords: ["blog", "post", "article", "cms", "content"], domain: "content management" },
    { keywords: ["message", "chat", "notification", "email"], domain: "communication" },
    { keywords: ["payment", "invoice", "billing", "transaction"], domain: "payments" },
    { keywords: ["report", "analytics", "dashboard", "metric"], domain: "analytics" },
    { keywords: ["admin", "setting", "config", "preference"], domain: "administration" },
    { keywords: ["file", "upload", "media", "asset"], domain: "file management" },
    { keywords: ["search", "query", "filter"], domain: "search" },
    { keywords: ["pet", "vet", "owner", "clinic"], domain: "pet clinic" },
  ];
  
  for (const pattern of domainPatterns) {
    if (pattern.keywords.some(kw => filePaths.some(p => p.includes("/" + kw + "/") || p.includes("/" + kw + ".")))) {
      return pattern.domain;
    }
  }
  
  return null;
}

/**
 * Generate summary statistics
 */
export function generateSummary(files: FileInfo[]): string {
  const lines: string[] = [];
  lines.push("# Repository Summary\n\n");

  const total = files.length;
  
  // Detect frameworks
  const frameworks = detectFrameworksFromFiles(files);
  
  // Purpose section - NEW!
  const purpose = inferProjectPurpose(files, frameworks);
  lines.push(`## Purpose\n\n${purpose}\n\n`);
  
  // Overview section
  lines.push(`## Overview\n\n`);
  lines.push(`This repository contains **${total} files** organized into a codebase structure. `);
  
  // Detect main language
  const byExt = groupByExtension(files);
  const sortedExts = Array.from(byExt.entries()).sort((a, b) => b[1].length - a[1].length);
  if (sortedExts.length > 0) {
    const mainExt = sortedExts[0][0];
    const mainCount = sortedExts[0][1].length;
    lines.push(`The primary language is **${mainExt}** with ${mainCount} files. `);
  }
  
  // Detect main directories
  const byDir = groupByDirectory(files);
  const sortedDirs = Array.from(byDir.entries()).sort((a, b) => b[1].length - a[1].length).slice(0, 3);
  if (sortedDirs.length > 0) {
    const mainDirs = sortedDirs.map(([d, f]) => `\`${d}\` (${f.length} files)`).join(", ");
    lines.push(`Key directories: ${mainDirs}.\n`);
  }

  lines.push(`\n## File Statistics\n\n`);
  lines.push(`- **Total files**: ${total}\n`);

  // Count by extension
  const extCounts = Array.from(byExt.entries())
    .map(([ext, f]) => `  - .${ext}: ${f.length}`)
    .sort()
    .join("\n");

  lines.push(`\n### Files by Extension\n${extCounts}\n`);

  // Count by directory
  const dirCounts = Array.from(byDir.entries())
    .map(([dir, f]) => `  - ${dir === "root" ? "(root)" : dir}: ${f.length}`)
    .sort()
    .join("\n");

  lines.push(`\n### Files by Directory\n${dirCounts}\n`);

  return lines.join("");
}
