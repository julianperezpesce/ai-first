import fs from "fs";
import path from "path";
import { scanRepo } from "./repoScanner.js";
/**
 * Generate module dependency graph based on imports
 */
export async function generateModuleGraph(rootDir, outputDir) {
    const graphDir = path.join(outputDir, "graph");
    // Ensure graph directory exists
    if (!fs.existsSync(graphDir)) {
        fs.mkdirSync(graphDir, { recursive: true });
    }
    console.log("\n🕸️  Generating module graph...\n");
    // Scan repository
    const scanResult = scanRepo(rootDir);
    const files = scanResult.files;
    // Group files by top-level directory (module)
    const moduleFiles = new Map();
    const moduleDeps = new Map();
    for (const file of files) {
        const parts = file.relativePath.split("/");
        // Skip root files and special directories
        if (parts.length < 2)
            continue;
        if (parts[0] === "ai" || parts[0] === "node_modules" || parts[0] === ".git")
            continue;
        if (parts[0] === "dist" || parts[0] === "build" || parts[0] === "coverage")
            continue;
        const moduleName = parts[0];
        if (!moduleFiles.has(moduleName)) {
            moduleFiles.set(moduleName, []);
            moduleDeps.set(moduleName, new Set());
        }
        moduleFiles.get(moduleName)?.push(file.relativePath);
        // Parse imports to find dependencies
        const deps = parseFileImports(file, rootDir);
        for (const dep of deps) {
            const depModule = getModuleFromPath(dep);
            if (depModule && depModule !== moduleName) {
                moduleDeps.get(moduleName)?.add(depModule);
            }
        }
    }
    // Build graph
    const modules = [];
    const dependencies = [];
    for (const [name, filePaths] of moduleFiles) {
        modules.push({
            name,
            paths: filePaths.sort()
        });
    }
    for (const [from, deps] of moduleDeps) {
        for (const to of deps) {
            // Avoid duplicate dependencies
            if (!dependencies.some(d => d.from === from && d.to === to)) {
                dependencies.push({ from, to });
            }
        }
    }
    // Sort modules alphabetically
    modules.sort((a, b) => a.name.localeCompare(b.name));
    const graph = { modules, dependencies };
    // Write to file
    const graphFile = path.join(graphDir, "module-graph.json");
    fs.writeFileSync(graphFile, JSON.stringify(graph, null, 2));
    console.log(`   ✅ Created ${graphFile}`);
    console.log(`   📦 Modules: ${modules.length}`);
    console.log(`   🔗 Dependencies: ${dependencies.length}`);
    return { success: true };
}
/**
 * Parse file for imports
 */
function parseFileImports(file, rootDir) {
    const imports = [];
    try {
        const content = fs.readFileSync(file.path, "utf-8");
        const ext = file.extension;
        if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
            // ES6 imports
            const es6Matches = content.matchAll(/import\s+(?:[\w{},\s]+\s+from\s+)?['"]([@\w\-./]+)['"]/g);
            for (const match of es6Matches) {
                imports.push(match[1]);
            }
            // CommonJS requires
            const requireMatches = content.matchAll(/require\s*\(\s*['"]([@\w\-./]+)['"]\s*\)/g);
            for (const match of requireMatches) {
                imports.push(match[1]);
            }
        }
        else if (ext === "py") {
            // Python imports
            const fromMatches = content.matchAll(/^from\s+([@\w.]+)\s+import/gm);
            for (const match of fromMatches) {
                imports.push(match[1]);
            }
            const importMatches = content.matchAll(/^import\s+([@\w.]+)/gm);
            for (const match of importMatches) {
                imports.push(match[1]);
            }
        }
        else if (ext === "go") {
            // Go imports
            const importMatches = content.matchAll(/import\s+(?:\(\s*)?["']([@\w\-./]+)["']/g);
            for (const match of importMatches) {
                imports.push(match[1]);
            }
        }
        else if (ext === "rs") {
            // Rust imports
            const useMatches = content.matchAll(/^use\s+(?:crate|self|super|@[\w-]+)::/gm);
            for (const match of useMatches) {
                imports.push(match[0]);
            }
        }
    }
    catch {
        // Ignore read errors
    }
    return imports;
}
/**
 * Get module name from import path
 */
function getModuleFromPath(importPath) {
    // Skip external packages
    if (importPath.startsWith("@")) {
        // For scoped packages, get the scope name
        const parts = importPath.split("/");
        return parts[0];
    }
    if (!importPath.startsWith(".")) {
        // Internal non-relative import - might be a module
        const parts = importPath.split("/");
        return parts[0];
    }
    // Relative import - convert to module
    return null;
}
/**
 * Load module graph from file
 */
export function loadModuleGraph(aiDir) {
    const graphFile = path.join(aiDir, "graph", "module-graph.json");
    if (!fs.existsSync(graphFile)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(graphFile, "utf-8"));
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=moduleGraph.js.map