import fs from "fs";
import path from "path";
import { DEFAULT_EXCLUDE_PATTERNS, getAllFiles as scanFiles, getRelativePath } from "../utils/fileUtils.js";
import { AI_CONTEXT_DIR, getHierarchyPath } from "../utils/constants.js";
/**
 * Detect repository root purpose from README and package metadata
 */
function detectRepoPurpose(rootDir) {
    // Check package.json
    const packagePath = path.join(rootDir, "package.json");
    if (fs.existsSync(packagePath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
            if (pkg.name) {
                return pkg.name;
            }
            if (pkg.description) {
                return pkg.description;
            }
        }
        catch { }
    }
    // Check README
    const readmeNames = ["README.md", "README.mdx", "README", "readme.md"];
    for (const name of readmeNames) {
        const readmePath = path.join(rootDir, name);
        if (fs.existsSync(readmePath)) {
            try {
                const content = fs.readFileSync(readmePath, "utf-8");
                // Get first non-empty line that's not a comment
                const lines = content.split("\n");
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith("#")) {
                        // Return first substantial line (max 100 chars)
                        return trimmed.slice(0, 100);
                    }
                    if (trimmed.startsWith("# ")) {
                        return trimmed.slice(2).slice(0, 100);
                    }
                }
            }
            catch { }
        }
    }
    // Check for common project indicators
    const indicators = [
        { file: "Cargo.toml", type: "Rust" },
        { file: "go.mod", type: "Go" },
        { file: "pom.xml", type: "Java" },
        { file: "build.gradle", type: "Gradle" },
        { file: "requirements.txt", type: "Python" },
        { file: "Gemfile", type: "Ruby" },
        { file: "composer.json", type: "PHP" },
        { file: "Swift Package.swift", type: "Swift" },
        { file: "Project.swift", type: "Swift" },
        { file: "*.csproj", type: "C#" },
    ];
    for (const ind of indicators) {
        const files = fs.readdirSync(rootDir);
        if (files.some(f => f === ind.file || f.endsWith(ind.file.replace("*", "")))) {
            return `${ind.type} Project`;
        }
    }
    // Default
    return "Repository";
}
/**
 * Get folder description based on common naming patterns
 */
function getFolderDescription(folderName) {
    const descriptions = {
        src: "Source code",
        lib: "Library code",
        app: "Application code",
        core: "Core functionality",
        main: "Main entry point",
        utils: "Utility functions",
        helpers: "Helper modules",
        common: "Common/shared code",
        shared: "Shared modules",
        components: "UI components",
        pages: "Page components",
        views: "View templates",
        layouts: "Layout templates",
        routes: "Route definitions",
        router: "Router configuration",
        api: "API endpoints",
        controllers: "Request handlers",
        services: "Business logic",
        models: "Data models",
        entities: "Domain entities",
        repositories: "Data access layer",
        middleware: "Middleware functions",
        handlers: "Event handlers",
        config: "Configuration",
        configs: "Configuration files",
        conf: "Configuration",
        settings: "Settings",
        scripts: "Build/run scripts",
        tools: "Development tools",
        bin: "Executable scripts",
        cmd: "Command scripts",
        test: "Test files",
        tests: "Test files",
        spec: "Test specifications",
        __tests__: "Test suite",
        e2e: "End-to-end tests",
        integration: "Integration tests",
        unit: "Unit tests",
        fixtures: "Test fixtures",
        mocks: "Mock data",
        docs: "Documentation",
        doc: "Documentation",
        guide: "Guides",
        examples: "Example code",
        demo: "Demo application",
        public: "Static assets",
        static: "Static files",
        assets: "Media files",
        images: "Image assets",
        styles: "Style files",
        css: "CSS styles",
        scss: "SCSS styles",
        themes: "Theme files",
        locales: "Internationalization",
        i18n: "Translations",
        messages: "Message files",
        build: "Build output",
        dist: "Distribution files",
        target: "Build target",
        coverage: "Test coverage",
        node_modules: "Dependencies",
        vendor: "Third-party code",
        data: "Data files",
        db: "Database files",
        migrations: "Database migrations",
        seeds: "Seed data",
        hooks: "Git hooks",
        workflows: "CI/CD workflows",
        ".github": "GitHub configuration",
        ".vscode": "VS Code settings"
    };
    const lower = folderName.toLowerCase();
    return descriptions[lower] || `${folderName} module`;
}
/**
 * Summarize a file based on heuristics
 */
function summarizeFile(filePath, content) {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    const lines = content.split("\n");
    // Check for exports/default
    const exports = [];
    const importMatches = content.matchAll(/(?:export|import)\s+/g);
    for (const _ of importMatches) {
        exports.push("imports");
    }
    // Look for class/function definitions
    const classes = content.match(/class\s+\w+/g) || [];
    const functions = content.match(/(?:function|def|fn|func)\s+\w+/g) || [];
    const interfaces = content.match(/interface\s+\w+/g) || [];
    // Look for JSDoc/doc comments
    const commentMatch = content.match(/\/\*\*[\s\S]*?\*\//);
    let comment = "";
    if (commentMatch) {
        // Get first sentence from comment
        const firstLine = commentMatch[0].split("\n")[0];
        const descMatch = firstLine.match(/\*?\s*([^.].+)/);
        if (descMatch) {
            comment = descMatch[1].trim().slice(0, 80);
        }
    }
    // Build description
    const parts = [];
    // From comment
    if (comment) {
        parts.push(comment);
    }
    // From filename patterns
    if (fileName.includes(".test.") || fileName.includes(".spec.") || fileName.startsWith("test_")) {
        parts.push("test");
    }
    if (fileName === "index.ts" || fileName === "index.js") {
        parts.push("entry point");
    }
    if (fileName === "types.ts" || fileName === "d.ts") {
        parts.push("type definitions");
    }
    if (fileName === "constants.ts" || fileName === "config.ts") {
        parts.push("constants");
    }
    if (fileName === "utils.ts" || fileName === "helpers.ts") {
        parts.push("utilities");
    }
    if (fileName.includes("middleware")) {
        parts.push("middleware");
    }
    if (fileName.includes("controller") || fileName.includes("handler")) {
        parts.push("handler");
    }
    if (fileName.includes("service")) {
        parts.push("service");
    }
    if (fileName.includes("model") || fileName.includes("entity")) {
        parts.push("model");
    }
    if (fileName.includes("route")) {
        parts.push("routes");
    }
    // From definitions
    if (classes.length > 0) {
        parts.push(`class${classes.length > 1 ? "es" : ""}: ${classes.slice(0, 3).join(", ")}`);
    }
    if (functions.length > 0) {
        const fnNames = functions.slice(0, 3).map(f => f.split(/\s+/).pop());
        parts.push(`function${functions.length > 1 ? "s" : ""}: ${fnNames.join(", ")}`);
    }
    if (interfaces.length > 0) {
        parts.push(`interface${interfaces.length > 1 ? "s" : ""}: ${interfaces.slice(0, 3).join(", ")}`);
    }
    // If no description, infer from extension
    if (parts.length === 0) {
        const extDescriptions = {
            ts: "TypeScript file",
            tsx: "React component",
            js: "JavaScript file",
            jsx: "React component",
            py: "Python module",
            go: "Go source",
            rs: "Rust source",
            java: "Java class",
            cs: "C# source",
            rb: "Ruby script",
            php: "PHP script",
            swift: "Swift source",
            kt: "Kotlin source",
            sql: "SQL script",
            json: "JSON data",
            yaml: "YAML config",
            yml: "YAML config",
            md: "documentation",
            css: "styles",
            scss: "SCSS styles",
            html: "HTML template",
        };
        parts.push(extDescriptions[ext.slice(1)] || "source file");
    }
    return parts.slice(0, 2).join(" | ");
}
/**
 * Generate hierarchical repository summary
 */
export async function generateHierarchy(rootDir, outputPath = getHierarchyPath(rootDir)) {
    try {
        // Get all files
        const allFiles = scanFiles(rootDir, [...DEFAULT_EXCLUDE_PATTERNS, AI_CONTEXT_DIR, "ai", "node_modules"]);
        // Get files for analysis
        const files = [];
        for (const filePath of allFiles) {
            const relativePath = getRelativePath(rootDir, filePath);
            files.push({ path: filePath, relativePath });
        }
        // Detect repo purpose
        const repoPurpose = detectRepoPurpose(rootDir);
        // Generate folder summaries
        const folderCounts = new Map();
        const folderDescriptions = new Map();
        for (const file of files) {
            const parts = file.relativePath.split("/");
            if (parts.length > 1) {
                const folder = parts[0];
                folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
                // Use first folder occurrence to set description
                if (!folderDescriptions.has(folder)) {
                    folderDescriptions.set(folder, getFolderDescription(folder));
                }
            }
        }
        const folders = {};
        for (const [folder, desc] of folderDescriptions) {
            folders[folder] = desc;
        }
        // Generate file summaries (only for source files)
        const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".cs", ".rb", ".php", ".swift", ".kt", ".scala"];
        const filesSummaries = {};
        for (const file of files) {
            const ext = path.extname(file.path);
            if (sourceExtensions.includes(ext)) {
                try {
                    const content = fs.readFileSync(file.path, "utf-8");
                    const summary = summarizeFile(file.path, content);
                    filesSummaries[file.relativePath] = summary;
                }
                catch {
                    filesSummaries[file.relativePath] = "source file";
                }
            }
        }
        // Ensure output directory
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const summary = {
            repo: repoPurpose,
            folders,
            files: filesSummaries,
        };
        // Write output
        fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), "utf-8");
        return {
            success: true,
            outputPath,
            summary,
        };
    }
    catch (error) {
        return {
            success: false,
            outputPath,
            summary: { repo: "", folders: {}, files: {} },
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
//# sourceMappingURL=hierarchyGenerator.js.map