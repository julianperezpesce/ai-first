import fs from "fs";
import path from "path";
/**
 * Get file language from extension
 */
function getLanguage(ext) {
    const langMap = {
        ts: "typescript",
        tsx: "typescript",
        js: "javascript",
        jsx: "javascript",
        py: "python",
        go: "go",
        rs: "rust",
        java: "java",
        cs: "csharp",
        rb: "ruby",
        php: "php",
        swift: "swift",
        kt: "kotlin",
    };
    return langMap[ext] || "unknown";
}
/**
 * Chunk TypeScript/JavaScript files by functions and classes
 */
function chunkJS(content, filePath, options) {
    const chunks = [];
    const lines = content.split("\n");
    const ext = path.extname(filePath).slice(1);
    const language = getLanguage(ext);
    const maxSize = options.maxChunkSize || 2000;
    // Regex patterns for function/class detection
    const patterns = [
        // Function declarations: function name(...)
        { regex: /^(\s*)function\s+(\w+)/, type: "function", nameGroup: 2 },
        // Arrow functions: const name = (...) => or const name = function
        { regex: /^(\s*)const\s+(\w+)\s*=\s*(?:async\s*)?\(?/, type: "function", nameGroup: 2 },
        // Arrow functions: const name = () =>
        { regex: /^(\s*)const\s+(\w+)\s*=\s*(?:async\s*)?.*=>/, type: "function", nameGroup: 2 },
        // Class declarations
        { regex: /^(\s*)class\s+(\w+)/, type: "class", nameGroup: 2 },
        // Method in class: methodName(
        { regex: /^(\s*)(\w+)\s*\([^)]*\)\s*{?$/, type: "function", nameGroup: 2 },
        // Export function
        { regex: /^(\s*)export\s+function\s+(\w+)/, type: "function", nameGroup: 2 },
        // Export default function
        { regex: /^(\s*)export\s+default\s+function\s+(\w+)/, type: "function", nameGroup: 2 },
        // Export const
        { regex: /^(\s*)export\s+const\s+(\w+)/, type: "function", nameGroup: 2 },
    ];
    // Find all function/class boundaries
    const boundaries = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const p of patterns) {
            const match = line.match(p.regex);
            if (match) {
                boundaries.push({
                    line: i + 1,
                    name: match[p.nameGroup],
                    type: p.type
                });
                break;
            }
        }
    }
    // If no boundaries found, chunk the whole file
    if (boundaries.length === 0) {
        return [{
                id: `${filePath}:1-${lines.length}`,
                content: content.slice(0, maxSize),
                filePath,
                startLine: 1,
                endLine: lines.length,
                type: "file",
                language
            }];
    }
    // Sort by line number
    boundaries.sort((a, b) => a.line - b.line);
    // Create chunks between boundaries
    for (let i = 0; i < boundaries.length; i++) {
        const startLine = boundaries[i].line;
        const endLine = i < boundaries.length - 1 ? boundaries[i + 1].line - 1 : lines.length;
        const chunkContent = lines.slice(startLine - 1, endLine).join("\n");
        if (chunkContent.trim().length > 0) {
            chunks.push({
                id: `${filePath}:${startLine}-${endLine}`,
                content: chunkContent.slice(0, maxSize),
                filePath,
                startLine,
                endLine,
                type: boundaries[i].type,
                name: boundaries[i].name,
                language
            });
        }
    }
    return chunks;
}
/**
 * Chunk Python files by functions and classes
 */
function chunkPython(content, filePath, options) {
    const chunks = [];
    const lines = content.split("\n");
    const language = "python";
    const maxSize = options.maxChunkSize || 2000;
    // Python patterns
    const patterns = [
        { regex: /^(\s*)def\s+(\w+)/, type: "function" },
        { regex: /^(\s*)async\s+def\s+(\w+)/, type: "function" },
        { regex: /^(\s*)class\s+(\w+)/, type: "class" },
        { regex: /^(\s*)async\s+def\s+(\w+)/, type: "function" },
    ];
    const boundaries = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const p of patterns) {
            if (p.regex.test(line)) {
                boundaries.push({ line: i + 1, type: p.type });
                break;
            }
        }
    }
    if (boundaries.length === 0) {
        return [{
                id: `${filePath}:1-${lines.length}`,
                content: content.slice(0, maxSize),
                filePath,
                startLine: 1,
                endLine: lines.length,
                type: "file",
                language
            }];
    }
    boundaries.sort((a, b) => a.line - b.line);
    for (let i = 0; i < boundaries.length; i++) {
        const startLine = boundaries[i].line;
        const endLine = i < boundaries.length - 1 ? boundaries[i + 1].line - 1 : lines.length;
        const chunkContent = lines.slice(startLine - 1, endLine).join("\n");
        if (chunkContent.trim().length > 0) {
            chunks.push({
                id: `${filePath}:${startLine}-${endLine}`,
                content: chunkContent.slice(0, maxSize),
                filePath,
                startLine,
                endLine,
                type: boundaries[i].type,
                language
            });
        }
    }
    return chunks;
}
/**
 * Chunk Go files by functions and structs
 */
function chunkGo(content, filePath, options) {
    const chunks = [];
    const lines = content.split("\n");
    const language = "go";
    const maxSize = options.maxChunkSize || 2000;
    // Go patterns
    const patterns = [
        { regex: /^func\s+(\w+)/, type: "function" },
        { regex: /^func\s+\(\w+\s+\*?\w+\)\s+(\w+)/, type: "function" }, // method
        { regex: /^type\s+(\w+)\s+struct/, type: "class" },
    ];
    const boundaries = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const p of patterns) {
            if (p.regex.test(line)) {
                boundaries.push({ line: i + 1, type: p.type });
                break;
            }
        }
    }
    if (boundaries.length === 0) {
        return [{
                id: `${filePath}:1-${lines.length}`,
                content: content.slice(0, maxSize),
                filePath,
                startLine: 1,
                endLine: lines.length,
                type: "file",
                language
            }];
    }
    boundaries.sort((a, b) => a.line - b.line);
    for (let i = 0; i < boundaries.length; i++) {
        const startLine = boundaries[i].line;
        const endLine = i < boundaries.length - 1 ? boundaries[i + 1].line - 1 : lines.length;
        const chunkContent = lines.slice(startLine - 1, endLine).join("\n");
        if (chunkContent.trim().length > 0) {
            chunks.push({
                id: `${filePath}:${startLine}-${endLine}`,
                content: chunkContent.slice(0, maxSize),
                filePath,
                startLine,
                endLine,
                type: boundaries[i].type,
                language
            });
        }
    }
    return chunks;
}
/**
 * Generic chunk by size (fallback)
 */
function chunkBySize(content, filePath, options) {
    const chunks = [];
    const lines = content.split("\n");
    const maxSize = options.maxChunkSize || 2000;
    const overlap = options.overlap || 10;
    const ext = path.extname(filePath).slice(1);
    const language = getLanguage(ext);
    let chunkLines = [];
    let startLine = 1;
    for (let i = 0; i < lines.length; i++) {
        chunkLines.push(lines[i]);
        // Create chunk when size exceeded or at end
        if (chunkLines.join("\n").length >= maxSize || i === lines.length - 1) {
            chunks.push({
                id: `${filePath}:${startLine}-${i + 1}`,
                content: chunkLines.join("\n"),
                filePath,
                startLine,
                endLine: i + 1,
                type: "file",
                language
            });
            // Start next chunk with overlap
            const overlapStart = Math.max(0, chunkLines.length - overlap);
            chunkLines = chunkLines.slice(overlapStart);
            startLine = i - chunkLines.length + 2;
        }
    }
    return chunks;
}
/**
 * Main chunking function - dispatches to language-specific chunkers
 */
export function chunkFile(filePath, options = {}) {
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        const ext = path.extname(filePath).slice(1).toLowerCase();
        // Skip binary files and very large files
        if (!content)
            return [];
        const maxSize = options.maxChunkSize || 2000;
        if (content.length > maxSize * 10) {
            // Very large file - just chunk by size
            return chunkBySize(content, filePath, options);
        }
        switch (ext) {
            case "ts":
            case "tsx":
            case "js":
            case "jsx":
            case "mjs":
            case "cjs":
                return chunkJS(content, filePath, options);
            case "py":
                return chunkPython(content, filePath, options);
            case "go":
                return chunkGo(content, filePath, options);
            default:
                return chunkBySize(content, filePath, options);
        }
    }
    catch (error) {
        console.error(`   ⚠️  Failed to chunk ${filePath}:`, error);
        return [];
    }
}
/**
 * Chunk multiple files
 */
export function chunkFiles(filePaths, options = {}) {
    const allChunks = [];
    for (const filePath of filePaths) {
        const chunks = chunkFile(filePath, options);
        allChunks.push(...chunks);
    }
    return allChunks;
}
//# sourceMappingURL=chunker.js.map