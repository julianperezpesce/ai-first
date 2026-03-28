import fs from "fs";
import path from "path";
/**
 * Default patterns to exclude from scanning
 */
export const DEFAULT_EXCLUDE_PATTERNS = [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".nuxt",
    "coverage",
    ".vscode",
    ".idea",
    "__pycache__",
    ".pytest_cache",
    "venv",
    ".venv",
    "vendor",
    "target",
    ".cache",
    ".DS_Store",
    "test-projects",
    ".ai-dev",
    ".ai-dev-out",
    "ai-context",
    ".ai-first-ignore",
];
/**
 * File extensions to include in scanning
 */
export const DEFAULT_INCLUDE_EXTENSIONS = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".java",
    ".cs",
    ".go",
    ".rs",
    ".rb",
    ".php",
    ".swift",
    ".kt",
    ".scala",
    ".vue",
    ".svelte",
    ".html",
    ".css",
    ".scss",
    ".json",
    ".yaml",
    ".yml",
    ".md",
    // Salesforce
    ".cls",
    ".trigger",
    ".apex",
    ".object",
];
/**
 * Get all files in a directory recursively
 */
export function getAllFiles(dir, excludePatterns = DEFAULT_EXCLUDE_PATTERNS, includeExtensions = DEFAULT_INCLUDE_EXTENSIONS) {
    const files = [];
    function walk(currentDir) {
        try {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                // Skip excluded patterns
                if (excludePatterns.includes(entry.name)) {
                    continue;
                }
                if (entry.isDirectory()) {
                    walk(fullPath);
                }
                else if (entry.isFile()) {
                    // Check if extension is included
                    const ext = path.extname(entry.name);
                    if (includeExtensions.includes(ext) || includeExtensions.includes(path.extname(entry.name).replace(".", ""))) {
                        files.push(fullPath);
                    }
                }
            }
        }
        catch (error) {
            console.warn(`Warning: Could not read directory: ${currentDir}`);
        }
    }
    walk(dir);
    return files;
}
/**
 * Ensure a directory exists, create if it doesn't
 */
export function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
/**
 * Write content to a file
 */
export function writeFile(filePath, content) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf-8");
}
/**
 * Read file content
 */
export function readFile(filePath) {
    return fs.readFileSync(filePath, "utf-8");
}
/**
 * Get relative path from base directory
 */
export function getRelativePath(basePath, filePath) {
    return path.relative(basePath, filePath);
}
/**
 * Read and parse JSON file
 */
export function readJsonFile(filePath) {
    const content = readFile(filePath);
    return JSON.parse(content);
}
//# sourceMappingURL=fileUtils.js.map