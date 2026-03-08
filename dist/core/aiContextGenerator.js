import fs from "fs";
import path from "path";
import { readFile, DEFAULT_EXCLUDE_PATTERNS, getAllFiles as scanFiles, getRelativePath } from "../utils/fileUtils.js";
/**
 * Generate AI context for the repository
 */
export async function generateAIContext(rootDir, outputDir = "ai") {
    const filesCreated = [];
    try {
        // Get all files
        const allFiles = scanFiles(rootDir, DEFAULT_EXCLUDE_PATTERNS);
        const files = [];
        const folders = new Set();
        for (const filePath of allFiles) {
            const relativePath = getRelativePath(rootDir, filePath);
            const parts = relativePath.split("/");
            const fileName = parts.pop() || "";
            const lastDot = fileName.lastIndexOf(".");
            const extension = lastDot > 0 ? fileName.slice(lastDot + 1) : "";
            // Track folders
            for (const part of parts) {
                folders.add(part);
            }
            files.push({
                path: filePath,
                relativePath,
                name: fileName,
                extension,
            });
        }
        // Ensure output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // 1. Generate repo_map.json
        const repoMap = generateRepoMapJson(files);
        const repoMapPath = path.join(outputDir, "repo_map.json");
        fs.writeFileSync(repoMapPath, repoMap, "utf-8");
        filesCreated.push(repoMapPath);
        // 2. Generate symbols.json (exported only)
        const symbols = generateSymbolsJson(files);
        const symbolsPath = path.join(outputDir, "symbols.json");
        fs.writeFileSync(symbolsPath, symbols, "utf-8");
        filesCreated.push(symbolsPath);
        // 3. Generate dependencies.json
        const dependencies = generateDependenciesJson(files);
        const depsPath = path.join(outputDir, "dependencies.json");
        fs.writeFileSync(depsPath, dependencies, "utf-8");
        filesCreated.push(depsPath);
        // 4. Generate ai_context.md (LLM optimized)
        const aiContext = generateAIContextMarkdown(files, rootDir);
        const aiContextPath = path.join(outputDir, "ai_context.md");
        fs.writeFileSync(aiContextPath, aiContext, "utf-8");
        filesCreated.push(aiContextPath);
        return {
            success: true,
            outputDir,
            filesCreated,
            stats: {
                files: files.length,
                folders: folders.size,
                symbols: countSymbols(symbols),
                dependencies: countDependencies(dependencies),
            },
        };
    }
    catch (error) {
        return {
            success: false,
            outputDir,
            filesCreated,
            stats: { files: 0, folders: 0, symbols: 0, dependencies: 0 },
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Generate repo_map.json - folder structure
 */
function generateRepoMapJson(files) {
    const tree = {};
    for (const file of files) {
        const parts = file.relativePath.split("/");
        let current = tree;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1;
            if (isFile) {
                current[part] = {
                    type: "file",
                    name: part,
                };
            }
            else {
                if (!current[part]) {
                    current[part] = {
                        type: "directory",
                        name: part,
                        children: {},
                    };
                }
                current = current[part].children;
            }
        }
    }
    return JSON.stringify({
        generated: new Date().toISOString(),
        structure: tree,
        summary: {
            totalFiles: files.length,
            byExtension: getExtensionStats(files),
        },
    }, null, 2);
}
/**
 * Generate symbols.json - exported symbols only
 */
function generateSymbolsJson(files) {
    const allSymbols = [];
    for (const file of files) {
        const ext = file.extension;
        if (!["ts", "tsx", "js", "jsx", "py", "go", "java", "cs", "rb", "php", "swift", "kt", "rs", "cls"].includes(ext)) {
            continue;
        }
        try {
            const content = readFile(file.path);
            const lines = content.split("\n");
            if (["ts", "tsx", "js", "jsx"].includes(ext)) {
                extractJsTsSymbols(lines, file.relativePath, allSymbols);
            }
            else if (ext === "py") {
                extractPythonSymbols(lines, file.relativePath, allSymbols);
            }
            else if (ext === "go") {
                extractGoSymbols(lines, file.relativePath, allSymbols);
            }
            else if (ext === "java" || ext === "cs") {
                extractJavaSymbols(lines, file.relativePath, allSymbols);
            }
            else if (ext === "rb") {
                extractRubySymbols(lines, file.relativePath, allSymbols);
            }
            else if (ext === "php") {
                extractPHPSymbols(lines, file.relativePath, allSymbols);
            }
            else if (ext === "swift") {
                extractSwiftSymbols(lines, file.relativePath, allSymbols);
            }
            else if (ext === "kt") {
                extractKotlinSymbols(lines, file.relativePath, allSymbols);
            }
            else if (ext === "rs") {
                extractRustSymbols(lines, file.relativePath, allSymbols);
            }
            else if (ext === "cls") {
                extractApexSymbols(lines, file.relativePath, allSymbols);
            }
        }
        catch { }
    }
    // Group by file
    const byFile = {};
    for (const sym of allSymbols) {
        if (!byFile[sym.file])
            byFile[sym.file] = [];
        byFile[sym.file].push(sym);
    }
    return JSON.stringify({
        generated: new Date().toISOString(),
        total: allSymbols.length,
        symbols: allSymbols,
        byFile,
    }, null, 2);
}
/**
 * Extract JavaScript/TypeScript exported symbols
 */
function extractJsTsSymbols(lines, filePath, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        // export function name(
        const funcMatch = line.match(/^export\s+(?:async\s+)?function\s+(\w+)/);
        if (funcMatch) {
            symbols.push({ name: funcMatch[1], type: "function", file: filePath, line: lineNum, exportType: "export" });
        }
        // export class Name
        const classMatch = line.match(/^export\s+class\s+(\w+)/);
        if (classMatch) {
            symbols.push({ name: classMatch[1], type: "class", file: filePath, line: lineNum, exportType: "export" });
        }
        // export interface Name
        const interfaceMatch = line.match(/^export\s+interface\s+(\w+)/);
        if (interfaceMatch) {
            symbols.push({ name: interfaceMatch[1], type: "interface", file: filePath, line: lineNum, exportType: "export" });
        }
        // export const/let/var name
        const constMatch = line.match(/^export\s+(?:const|let|var)\s+(\w+)/);
        if (constMatch) {
            symbols.push({ name: constMatch[1], type: "const", file: filePath, line: lineNum, exportType: "export" });
        }
        // export { name } or export { name as alias }
        const namedExport = line.match(/^export\s+\{([^}]+)\}/);
        if (namedExport) {
            const exports = namedExport[1].split(",");
            for (const exp of exports) {
                const name = exp.trim().split(" as ")[0].trim();
                if (name) {
                    symbols.push({ name, type: "named_export", file: filePath, line: lineNum, exportType: "named" });
                }
            }
        }
        // export default
        const defaultMatch = line.match(/^export\s+default\s+(?:function\s+|class\s+|const\s+)?(\w+)?/);
        if (defaultMatch && defaultMatch[1]) {
            symbols.push({ name: defaultMatch[1], type: "default", file: filePath, line: lineNum, exportType: "default" });
        }
    }
}
/**
 * Extract Python symbols
 */
function extractPythonSymbols(lines, filePath, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        // class Name:
        const classMatch = line.match(/^class\s+(\w+)/);
        if (classMatch) {
            symbols.push({ name: classMatch[1], type: "class", file: filePath, line: lineNum });
        }
        // def name(
        const funcMatch = line.match(/^def\s+(\w+)/);
        if (funcMatch) {
            symbols.push({ name: funcMatch[1], type: "function", file: filePath, line: lineNum });
        }
        // __all__ = [...] (explicit exports)
        const allMatch = line.match(/^__all__\s*=\s*\[([^\]]+)\]/);
        if (allMatch) {
            const exports = allMatch[1].split(",");
            for (const exp of exports) {
                const name = exp.trim().replace(/['"]/g, "");
                if (name) {
                    symbols.push({ name, type: "explicit_export", file: filePath, line: lineNum, exportType: "__all__" });
                }
            }
        }
    }
}
/**
 * Extract Go symbols
 */
function extractGoSymbols(lines, filePath, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        // func Name(
        const funcMatch = line.match(/^func\s+(?:\(\w+\s+\*?\w+\)\s+)?([A-Z]\w+)/);
        if (funcMatch) {
            symbols.push({ name: funcMatch[1], type: "function", file: filePath, line: lineNum });
        }
        // type Name struct/interface
        const typeMatch = line.match(/^type\s+(\w+)/);
        if (typeMatch) {
            symbols.push({ name: typeMatch[1], type: "type", file: filePath, line: lineNum });
        }
    }
}
/**
 * Extract Java/C# symbols
 */
function extractJavaSymbols(lines, filePath, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        // public class Name
        const classMatch = line.match(/^public\s+(?:abstract\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({ name: classMatch[1], type: "class", file: filePath, line: lineNum });
        }
        // public interface Name
        const interfaceMatch = line.match(/^public\s+interface\s+(\w+)/);
        if (interfaceMatch) {
            symbols.push({ name: interfaceMatch[1], type: "interface", file: filePath, line: lineNum });
        }
        // public Type name(
        const methodMatch = line.match(/^public\s+(?:static\s+)?(?:async\s+)?(?:\w+)\s+(\w+)\s*\(/);
        if (methodMatch && !["if", "for", "while", "switch", "catch"].includes(methodMatch[1])) {
            symbols.push({ name: methodMatch[1], type: "method", file: filePath, line: lineNum });
        }
    }
}
/**
 * Extract Ruby symbols
 */
function extractRubySymbols(lines, filePath, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        const classMatch = line.match(/^class\s+(\w+)/);
        if (classMatch) {
            symbols.push({ name: classMatch[1], type: "class", file: filePath, line: lineNum });
        }
        const moduleMatch = line.match(/^module\s+(\w+)/);
        if (moduleMatch) {
            symbols.push({ name: moduleMatch[1], type: "module", file: filePath, line: lineNum });
        }
        const methodMatch = line.match(/^def\s+(\w+)/);
        if (methodMatch) {
            symbols.push({ name: methodMatch[1], type: "method", file: filePath, line: lineNum });
        }
    }
}
/**
 * Extract PHP symbols
 */
function extractPHPSymbols(lines, filePath, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        const classMatch = line.match(/^(?:final\s+)?(?:abstract\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({ name: classMatch[1], type: "class", file: filePath, line: lineNum });
        }
        const interfaceMatch = line.match(/^interface\s+(\w+)/);
        if (interfaceMatch) {
            symbols.push({ name: interfaceMatch[1], type: "interface", file: filePath, line: lineNum });
        }
        const functionMatch = line.match(/^function\s+(\w+)/);
        if (functionMatch) {
            symbols.push({ name: functionMatch[1], type: "function", file: filePath, line: lineNum });
        }
    }
}
/**
 * Extract Swift symbols
 */
function extractSwiftSymbols(lines, filePath, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        const classMatch = line.match(/^(?:public\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({ name: classMatch[1], type: "class", file: filePath, line: lineNum });
        }
        const structMatch = line.match(/^(?:public\s+)?struct\s+(\w+)/);
        if (structMatch) {
            symbols.push({ name: structMatch[1], type: "struct", file: filePath, line: lineNum });
        }
        const protocolMatch = line.match(/^(?:public\s+)?protocol\s+(\w+)/);
        if (protocolMatch) {
            symbols.push({ name: protocolMatch[1], type: "protocol", file: filePath, line: lineNum });
        }
        const funcMatch = line.match(/^(?:public\s+)?func\s+(\w+)/);
        if (funcMatch) {
            symbols.push({ name: funcMatch[1], type: "function", file: filePath, line: lineNum });
        }
    }
}
/**
 * Extract Kotlin symbols
 */
function extractKotlinSymbols(lines, filePath, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        const classMatch = line.match(/^(?:open\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({ name: classMatch[1], type: "class", file: filePath, line: lineNum });
        }
        const interfaceMatch = line.match(/^interface\s+(\w+)/);
        if (interfaceMatch) {
            symbols.push({ name: interfaceMatch[1], type: "interface", file: filePath, line: lineNum });
        }
        const funcMatch = line.match(/^fun\s+(\w+)/);
        if (funcMatch) {
            symbols.push({ name: funcMatch[1], type: "function", file: filePath, line: lineNum });
        }
    }
}
/**
 * Extract Rust symbols
 */
function extractRustSymbols(lines, filePath, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        const funcMatch = line.match(/^pub\s+fn\s+(\w+)/);
        if (funcMatch) {
            symbols.push({ name: funcMatch[1], type: "function", file: filePath, line: lineNum });
        }
        const structMatch = line.match(/^pub\s+struct\s+(\w+)/);
        if (structMatch) {
            symbols.push({ name: structMatch[1], type: "struct", file: filePath, line: lineNum });
        }
        const enumMatch = line.match(/^pub\s+enum\s+(\w+)/);
        if (enumMatch) {
            symbols.push({ name: enumMatch[1], type: "enum", file: filePath, line: lineNum });
        }
        const traitMatch = line.match(/^pub\s+trait\s+(\w+)/);
        if (traitMatch) {
            symbols.push({ name: traitMatch[1], type: "trait", file: filePath, line: lineNum });
        }
    }
}
/**
 * Extract Apex symbols
 */
function extractApexSymbols(lines, filePath, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        const classMatch = line.match(/^(?:public\s+)?(?:virtual\s+)?(?:abstract\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({ name: classMatch[1], type: "class", file: filePath, line: lineNum });
        }
        const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
        if (interfaceMatch) {
            symbols.push({ name: interfaceMatch[1], type: "interface", file: filePath, line: lineNum });
        }
        const triggerMatch = line.match(/^trigger\s+(\w+)/);
        if (triggerMatch) {
            symbols.push({ name: triggerMatch[1], type: "trigger", file: filePath, line: lineNum });
        }
    }
}
/**
 * Generate dependencies.json - import graph
 */
function generateDependenciesJson(files) {
    const dependencies = [];
    for (const file of files) {
        const ext = file.extension;
        try {
            const content = readFile(file.path);
            if (["ts", "tsx", "js", "jsx"].includes(ext)) {
                // ES6 and CommonJS imports
                const es6Matches = content.matchAll(/import\s+(?:[\w{},\s]+\s+from\s+)?['"]([@\w\-./]+)['"]/g);
                for (const match of es6Matches) {
                    dependencies.push({ source: file.relativePath, target: match[1], type: "import" });
                }
                const requireMatches = content.matchAll(/require\s*\(\s*['"]([@\w\-./]+)['"]\s*\)/g);
                for (const match of requireMatches) {
                    dependencies.push({ source: file.relativePath, target: match[1], type: "require" });
                }
            }
            else if (ext === "py") {
                const fromMatches = content.matchAll(/^from\s+([@\w.]+)\s+import/gm);
                for (const match of fromMatches) {
                    dependencies.push({ source: file.relativePath, target: match[1].replace(/\./g, "/"), type: "from" });
                }
                const importMatches = content.matchAll(/^import\s+([@\w.]+)/gm);
                for (const match of importMatches) {
                    dependencies.push({ source: file.relativePath, target: match[1].replace(/\./g, "/"), type: "import" });
                }
            }
            else if (ext === "go") {
                const importMatches = content.matchAll(/import\s+(?:\(\s*)?["']([@\w\-./]+)["']/g);
                for (const match of importMatches) {
                    dependencies.push({ source: file.relativePath, target: match[1], type: "import" });
                }
            }
            else if (ext === "java" || ext === "cs") {
                const javaMatches = content.matchAll(/^import\s+([\w.]+);/gm);
                for (const match of javaMatches) {
                    if (!match[1].startsWith("java.") && !match[1].startsWith("javax.")) {
                        dependencies.push({ source: file.relativePath, target: match[1].replace(/\./g, "/"), type: "import" });
                    }
                }
            }
            else if (ext === "rb") {
                const requireMatches = content.matchAll(/require(?:_relative)?\s+['"]([@\w\-./]+)['"]/g);
                for (const match of requireMatches) {
                    dependencies.push({ source: file.relativePath, target: match[1], type: "require" });
                }
            }
            else if (ext === "php") {
                const useMatches = content.matchAll(/^use\s+([\w\\]+)/gm);
                for (const match of useMatches) {
                    dependencies.push({ source: file.relativePath, target: match[1].replace(/\\/, "/"), type: "use" });
                }
            }
            else if (ext === "swift") {
                const importMatches = content.matchAll(/^import\s+(\w+)/gm);
                for (const match of importMatches) {
                    dependencies.push({ source: file.relativePath, target: match[1], type: "import" });
                }
            }
        }
        catch { }
    }
    // Group by source file
    const byFile = {};
    for (const dep of dependencies) {
        if (!byFile[dep.source])
            byFile[dep.source] = [];
        byFile[dep.source].push(dep);
    }
    return JSON.stringify({
        generated: new Date().toISOString(),
        total: dependencies.length,
        dependencies,
        byFile,
    }, null, 2);
}
/**
 * Generate ai_context.md - LLM optimized summary
 */
function generateAIContextMarkdown(files, rootDir) {
    const lines = [];
    // Header
    lines.push("# AI Context");
    lines.push("");
    lines.push("> Repository context for AI assistants. Generated automatically.");
    lines.push("");
    lines.push("---");
    lines.push("");
    // Quick Stats
    const extStats = getExtensionStats(files);
    const languages = Object.keys(extStats).sort((a, b) => extStats[b] - extStats[a]);
    lines.push("## Quick Overview");
    lines.push("");
    lines.push(`- **Total Files**: ${files.length}`);
    lines.push(`- **Languages**: ${languages.join(", ")}`);
    lines.push("");
    lines.push("---");
    lines.push("");
    // File Structure (top-level directories)
    const topDirs = new Set();
    for (const file of files) {
        const parts = file.relativePath.split("/");
        if (parts.length > 1) {
            topDirs.add(parts[0]);
        }
    }
    lines.push("## Project Structure");
    lines.push("");
    lines.push("```");
    const tree = buildSimpleTree(files);
    lines.push(tree);
    lines.push("```");
    lines.push("");
    lines.push("---");
    lines.push("");
    // Key Files (important entry points)
    const entryPoints = findEntrypoints(files);
    lines.push("## Entry Points");
    lines.push("");
    for (const ep of entryPoints) {
        lines.push(`- \`${ep.path}\` - ${ep.description}`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
    // Detected Conventions
    const conventions = detectConventions(files);
    lines.push("## Conventions");
    lines.push("");
    for (const conv of conventions) {
        lines.push(`- ${conv}`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
    // Key Modules
    const modules = detectModules(files);
    lines.push("## Key Modules");
    lines.push("");
    for (const mod of modules) {
        lines.push(`### ${mod.name}`);
        lines.push(`- ${mod.description}`);
        lines.push(`- Files: ${mod.fileCount}`);
        lines.push("");
    }
    lines.push("");
    lines.push("---");
    lines.push("");
    // Architecture hints
    lines.push("## Architecture Hints");
    lines.push("");
    const archHints = detectArchitectureHints(files);
    for (const hint of archHints) {
        lines.push(`- ${hint}`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
    // Footer
    lines.push("## For AI Assistants");
    lines.push("");
    lines.push("When working with this codebase:");
    lines.push("");
    lines.push("1. Check `symbols.json` for exported functions/classes");
    lines.push("2. Check `dependencies.json` for import relationships");
    lines.push("3. Follow the conventions listed above");
    lines.push("4. Target entry points for modifications");
    lines.push("");
    lines.push("*Generated by ai-first*");
    return lines.join("\n");
}
/**
 * Get file extension statistics
 */
function getExtensionStats(files) {
    const stats = {};
    for (const file of files) {
        const ext = file.extension || "no-ext";
        stats[ext] = (stats[ext] || 0) + 1;
    }
    return stats;
}
/**
 * Build simple tree representation
 */
function buildSimpleTree(files) {
    const dirs = new Map();
    for (const file of files) {
        const parts = file.relativePath.split("/");
        if (parts.length === 1) {
            // Root level file
            continue;
        }
        const dir = parts[0];
        if (!dirs.has(dir)) {
            dirs.set(dir, new Set());
        }
        dirs.get(dir).add(parts[1] || parts[parts.length - 1]);
    }
    const lines = [];
    for (const [dir, subdirs] of dirs) {
        lines.push(`${dir}/`);
        for (const sub of subdirs) {
            lines.push(`  ${sub}`);
        }
    }
    return lines.slice(0, 30).join("\n") + (dirs.size > 30 ? "\n  ..." : "");
}
/**
 * Find entry points
 */
function findEntrypoints(files) {
    const entryPoints = [];
    for (const file of files) {
        const name = file.name.toLowerCase();
        const ext = file.extension;
        // Main entry files
        if (name === "index.js" || name === "index.ts" || name === "main.js" || name === "main.ts") {
            entryPoints.push({ path: file.relativePath, description: "Main entry point" });
        }
        // Server files
        if (name === "server.js" || name === "server.ts" || name === "app.js" || name === "app.ts") {
            entryPoints.push({ path: file.relativePath, description: "Server entry" });
        }
        // CLI
        if (name === "cli.js" || name === "cli.ts" || name === "bin.js") {
            entryPoints.push({ path: file.relativePath, description: "CLI entry" });
        }
        // Test files
        if (name.includes(".test.") || name.includes(".spec.") || name.startsWith("test_") || name.startsWith("__tests__")) {
            entryPoints.push({ path: file.relativePath, description: "Test file" });
        }
        // Config files
        if (["json", "yaml", "yml", "toml", "ini", "conf"].includes(ext)) {
            if (name === "package.json" || name === "tsconfig.json" || name === "jest.config" || name === ".eslintrc") {
                entryPoints.push({ path: file.relativePath, description: "Configuration" });
            }
        }
    }
    return entryPoints.slice(0, 15);
}
/**
 * Detect coding conventions
 */
function detectConventions(files) {
    const conventions = [];
    // Check for specific patterns
    const fileNames = files.map(f => f.name);
    // Naming conventions
    if (fileNames.some(f => /^[A-Z][a-z]+[A-Z]/.test(f))) {
        conventions.push("PascalCase for classes/components");
    }
    if (fileNames.some(f => /^[a-z]+-[a-z]+/.test(f))) {
        conventions.push("kebab-case for files");
    }
    if (fileNames.some(f => f.includes("_"))) {
        conventions.push("snake_case for some files");
    }
    // Testing
    if (fileNames.some(f => f.includes(".test.") || f.includes(".spec."))) {
        conventions.push("Jest/Vitest testing (.test.ts, .spec.ts)");
    }
    if (fileNames.some(f => f.startsWith("test_") || f.startsWith("__tests__"))) {
        conventions.push("Test files in test/ or __tests__ directories");
    }
    // Linting
    if (fileNames.includes(".eslintrc.json") || fileNames.includes(".eslintrc.js")) {
        conventions.push("ESLint for linting");
    }
    if (fileNames.includes("prettier.config.js") || fileNames.includes(".prettierrc")) {
        conventions.push("Prettier for formatting");
    }
    return conventions.length > 0 ? conventions : ["No specific conventions detected"];
}
/**
 * Detect key modules
 */
function detectModules(files) {
    const modules = [];
    const dirCounts = new Map();
    for (const file of files) {
        const parts = file.relativePath.split("/");
        if (parts.length > 1) {
            const dir = parts[0];
            dirCounts.set(dir, (dirCounts.get(dir) || 0) + 1);
        }
    }
    const sortedDirs = Array.from(dirCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const descriptions = {
        src: "Source code",
        lib: "Library code",
        core: "Core functionality",
        utils: "Utilities",
        helpers: "Helper functions",
        components: "UI components",
        pages: "Page components",
        routes: "Route definitions",
        services: "Business logic",
        api: "API handlers",
        models: "Data models",
        controllers: "Controllers",
        views: "View templates",
        tests: "Test files",
        config: "Configuration",
        scripts: "Build scripts",
        docs: "Documentation",
    };
    for (const [name, count] of sortedDirs) {
        modules.push({
            name,
            description: descriptions[name] || `${name} module`,
            fileCount: count,
        });
    }
    return modules;
}
/**
 * Detect architecture hints
 */
function detectArchitectureHints(files) {
    const hints = [];
    const paths = files.map(f => f.relativePath).join(" ");
    // MVC pattern
    if (paths.includes("/controllers/") && paths.includes("/models/") && paths.includes("/views/")) {
        hints.push("MVC architecture detected (controllers, models, views)");
    }
    // Clean Architecture
    if (paths.includes("/domain/") && (paths.includes("/application/") || paths.includes("/usecases/")) && paths.includes("/infrastructure/")) {
        hints.push("Clean Architecture pattern (domain, application, infrastructure)");
    }
    // Feature-based
    if (paths.includes("/features/") || paths.includes("/modules/")) {
        hints.push("Feature-based or modular architecture");
    }
    // Microservices
    if (paths.includes("/services/") && paths.includes("/handlers/")) {
        hints.push("Microservice pattern");
    }
    // SPA
    if (paths.includes("/components/") && (paths.includes("/pages/") || paths.includes("/routes/"))) {
        hints.push("Single Page Application (SPA)");
    }
    // Monorepo
    const topDirs = new Set(files.map(f => f.relativePath.split("/")[0]));
    if (topDirs.has("packages") || topDirs.has("apps")) {
        hints.push("Monorepo structure detected");
    }
    // React
    if (paths.includes("useState") || paths.includes("useEffect") || paths.includes(".jsx")) {
        hints.push("React framework detected");
    }
    // Vue
    if (paths.includes("<template>") || paths.includes(".vue")) {
        hints.push("Vue.js framework detected");
    }
    // Next.js
    if (paths.includes("/pages/") && paths.includes("/components/")) {
        hints.push("Next.js or similar SSR framework");
    }
    // Express
    if (paths.includes("express") || paths.includes("app.get") || paths.includes("app.post")) {
        hints.push("Express.js server");
    }
    // FastAPI
    if (paths.includes("@app") || paths.includes("FastAPI")) {
        hints.push("FastAPI (Python) backend");
    }
    // Django
    if (paths.includes("settings.py") && paths.includes("models.py") && paths.includes("views.py")) {
        hints.push("Django framework");
    }
    return hints.length > 0 ? hints : ["Standard project structure"];
}
/**
 * Count symbols in JSON
 */
function countSymbols(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        return data.total || 0;
    }
    catch {
        return 0;
    }
}
/**
 * Count dependencies in JSON
 */
function countDependencies(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        return data.total || 0;
    }
    catch {
        return 0;
    }
}
//# sourceMappingURL=aiContextGenerator.js.map