import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { readFile } from "../utils/fileUtils.js";
let SQL = null;
/**
 * Initialize SQL.js
 */
async function getSql() {
    if (!SQL) {
        SQL = await initSqlJs();
    }
    return SQL;
}
/**
 * Supported languages
 */
const LANGUAGE_MAP = {
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
    scala: "scala",
};
/**
 * Language detection
 */
function detectLanguage(extension) {
    return LANGUAGE_MAP[extension] || "unknown";
}
/**
 * Create database schema
 */
function createSchema(db) {
    db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      language TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS symbols (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      file_id INTEGER NOT NULL,
      line INTEGER,
      exported INTEGER DEFAULT 0,
      FOREIGN KEY (file_id) REFERENCES files(id)
    )
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_file_id INTEGER NOT NULL,
      target_file TEXT NOT NULL,
      type TEXT NOT NULL,
      FOREIGN KEY (source_file_id) REFERENCES files(id)
    )
  `);
    // Indexes for faster queries
    db.run("CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name)");
    db.run("CREATE INDEX IF NOT EXISTS idx_symbols_type ON symbols(type)");
    db.run("CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(file_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_imports_source ON imports(source_file_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_imports_target ON imports(target_file)");
}
/**
 * Parse file for symbols (reuse from symbols analyzer)
 */
function parseFileForSymbols(file) {
    const symbols = [];
    try {
        const content = readFile(file.path);
        const lines = content.split("\n");
        if (file.extension === "ts" || file.extension === "tsx" || file.extension === "js" || file.extension === "jsx") {
            parseJsTs(file, content, lines, symbols);
        }
        else if (file.extension === "py") {
            parsePython(file, lines, symbols);
        }
        else if (file.extension === "go") {
            parseGo(file, lines, symbols);
        }
    }
    catch { }
    return symbols;
}
/**
 * Parse JavaScript/TypeScript
 */
function parseJsTs(file, content, lines, symbols) {
    const patterns = [
        { regex: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()/, type: "function" },
        { regex: /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/, type: "function" },
        { regex: /class\s+(\w+)/, type: "class" },
        { regex: /interface\s+(\w+)/, type: "interface" },
        { regex: /type\s+(\w+)/, type: "type" },
        { regex: /enum\s+(\w+)/, type: "enum" },
        { regex: /(?:export\s+)?(?:const|let)\s+(\w+)/, type: "const" },
        { regex: /export\s+module\s+(\w+)/, type: "module" },
    ];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        for (const p of patterns) {
            const match = line.match(p.regex);
            if (match) {
                const name = match[1] || match[2] || match[3];
                if (name && !name.startsWith("_") && name.length > 1) {
                    symbols.push({
                        name,
                        type: p.type,
                        line: i + 1,
                        exported: line.startsWith("export"),
                    });
                }
            }
        }
    }
}
/**
 * Parse Python
 */
function parsePython(file, lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/^class\s+(\w+)/);
        if (classMatch) {
            symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: true });
            continue;
        }
        const funcMatch = line.match(/^def\s+(\w+)/);
        if (funcMatch) {
            symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: true });
            continue;
        }
        const constMatch = line.match(/^([A-Z][A-Z0-9_]*)\s*=/);
        if (constMatch) {
            symbols.push({ name: constMatch[1], type: "const", line: i + 1, exported: true });
        }
    }
}
/**
 * Parse Go
 */
function parseGo(file, lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const funcMatch = line.match(/^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)/);
        if (funcMatch && funcMatch[1] !== "init") {
            symbols.push({
                name: funcMatch[1],
                type: "function",
                line: i + 1,
                exported: line.startsWith("func") && !line.startsWith("func (") && /func\s+[A-Z]/.test(line),
            });
        }
        const typeMatch = line.match(/^type\s+(\w+)/);
        if (typeMatch) {
            symbols.push({ name: typeMatch[1], type: "type", line: i + 1, exported: true });
        }
    }
}
/**
 * Parse file for imports
 */
function parseFileForImports(file) {
    const imports = [];
    try {
        const content = readFile(file.path);
        if (file.extension === "ts" || file.extension === "tsx" || file.extension === "js" || file.extension === "jsx") {
            // ES6 imports
            const es6Matches = content.matchAll(/import\s+(?:[\w{},\s]+\s+from\s+)?['"]([@\w\-./]+)['"]/g);
            for (const match of es6Matches) {
                imports.push({ target_file: match[1], type: "import" });
            }
            // CommonJS
            const requireMatches = content.matchAll(/require\s*\(\s*['"]([@\w\-./]+)['"]\s*\)/g);
            for (const match of requireMatches) {
                imports.push({ target_file: match[1], type: "require" });
            }
        }
        else if (file.extension === "py") {
            const fromMatches = content.matchAll(/^from\s+([@\w.]+)\s+import/gm);
            for (const match of fromMatches) {
                imports.push({ target_file: match[1].replace(/\./g, "/"), type: "from" });
            }
            const importMatches = content.matchAll(/^import\s+([@\w.]+)/gm);
            for (const match of importMatches) {
                imports.push({ target_file: match[1].replace(/\./g, "/"), type: "import" });
            }
        }
        else if (file.extension === "go") {
            const importMatches = content.matchAll(/import\s+(?:\(\s*)?["']([@\w\-./]+)["']/g);
            for (const match of importMatches) {
                imports.push({ target_file: match[1], type: "import" });
            }
        }
    }
    catch { }
    return imports;
}
/**
 * Generate repository index
 */
export async function generateIndex(rootDir, outputPath) {
    try {
        const sql = await getSql();
        if (!sql) {
            throw new Error("Failed to initialize SQL.js");
        }
        const db = new sql.Database();
        // Create schema
        createSchema(db);
        // Get files
        const { getAllFiles, getRelativePath } = await import("../utils/fileUtils.js");
        const excludePatterns = ["node_modules", ".git", "dist", "build", "venv"];
        const allFiles = getAllFiles(rootDir, excludePatterns);
        const files = [];
        for (const filePath of allFiles) {
            const relativePath = getRelativePath(rootDir, filePath);
            const parts = relativePath.split("/");
            const fileName = parts.pop() || "";
            const lastDot = fileName.lastIndexOf(".");
            const extension = lastDot > 0 ? fileName.slice(lastDot + 1) : "";
            files.push({
                path: filePath,
                relativePath,
                name: fileName,
                extension,
            });
        }
        // Insert files and get their IDs
        const fileIdMap = new Map();
        for (const file of files) {
            const language = detectLanguage(file.extension);
            db.run("INSERT OR IGNORE INTO files (path, language) VALUES (?, ?)", [file.relativePath, language]);
            // Get the file ID
            const result = db.exec("SELECT id FROM files WHERE path = ?", [file.relativePath]);
            if (result.length > 0 && result[0].values.length > 0) {
                fileIdMap.set(file.relativePath, result[0].values[0][0]);
            }
        }
        // Insert symbols
        let symbolCount = 0;
        for (const file of files) {
            const fileId = fileIdMap.get(file.relativePath);
            if (!fileId)
                continue;
            const symbols = parseFileForSymbols(file);
            for (const sym of symbols) {
                db.run("INSERT INTO symbols (name, type, file_id, line, exported) VALUES (?, ?, ?, ?, ?)", [sym.name, sym.type, fileId, sym.line, sym.exported ? 1 : 0]);
                symbolCount++;
            }
        }
        // Insert imports
        let importCount = 0;
        for (const file of files) {
            const fileId = fileIdMap.get(file.relativePath);
            if (!fileId)
                continue;
            const imports = parseFileForImports(file);
            for (const imp of imports) {
                db.run("INSERT INTO imports (source_file_id, target_file, type) VALUES (?, ?, ?)", [fileId, imp.target_file, imp.type]);
                importCount++;
            }
        }
        // Save database
        const data = db.export();
        const buffer = Buffer.from(data);
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, buffer);
        return {
            success: true,
            dbPath: outputPath,
            stats: {
                files: files.length,
                symbols: symbolCount,
                imports: importCount,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            dbPath: outputPath,
            stats: { files: 0, symbols: 0, imports: 0 },
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Example queries for AI agents
 */
export const EXAMPLE_QUERIES = {
    // Find all functions in a file
    findFunctionsInFile: `
    SELECT s.name, s.line 
    FROM symbols s
    JOIN files f ON s.file_id = f.id
    WHERE f.path = ? AND s.type = 'function'
    ORDER BY s.line
  `,
    // Find where a symbol is defined
    findSymbolDefinition: `
    SELECT f.path, s.line, s.type
    FROM symbols s
    JOIN files f ON s.file_id = f.id
    WHERE s.name = ?
  `,
    // Find all files importing a specific module
    findImporters: `
    SELECT f.path, i.type
    FROM imports i
    JOIN files f ON i.source_file_id = f.id
    WHERE i.target_file LIKE ?
  `,
    // Find all exported symbols
    findExports: `
    SELECT s.name, s.type, f.path
    FROM symbols s
    JOIN files f ON s.file_id = f.id
    WHERE s.exported = 1
    ORDER BY f.path, s.name
  `,
    // Find all classes
    findClasses: `
    SELECT s.name, f.path, s.line
    FROM symbols s
    JOIN files f ON s.file_id = f.id
    WHERE s.type = 'class'
    ORDER BY f.path
  `,
    // Get file dependencies
    getFileDependencies: `
    SELECT i.target_file, i.type
    FROM imports i
    JOIN files f ON i.source_file_id = f.id
    WHERE f.path = ?
  `,
    // Search symbols by pattern
    searchSymbols: `
    SELECT s.name, s.type, f.path, s.line
    FROM symbols s
    JOIN files f ON s.file_id = f.id
    WHERE s.name LIKE ?
    LIMIT 50
  `,
    // Get language statistics
    languageStats: `
    SELECT language, COUNT(*) as count
    FROM files
    GROUP BY language
    ORDER BY count DESC
  `,
};
//# sourceMappingURL=indexer.js.map