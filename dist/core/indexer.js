import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import chokidar from "chokidar";
import { readFile, DEFAULT_EXCLUDE_PATTERNS } from "../utils/fileUtils.js";
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
    ts: "typescript", tsx: "typescript",
    js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
    py: "python", go: "go", rs: "rust",
    rb: "ruby", php: "php", java: "java", kt: "kotlin", scala: "scala", cs: "csharp",
    swift: "swift", cls: "apex",
    vue: "vue", svelte: "svelte", html: "html", css: "css", scss: "scss", less: "less",
};
function detectLanguage(extension) {
    return LANGUAGE_MAP[extension] || "unknown";
}
/**
 * IncrementalIndexer class for watch mode
 */
export class IncrementalIndexer {
    db = null;
    dbPath;
    rootDir;
    fileHashes = new Map();
    watcher = null;
    debounceTimers = new Map();
    debounceMs;
    stats = { files: 0, symbols: 0, imports: 0 };
    constructor(rootDir, outputPath, debounceMs = 300) {
        this.rootDir = rootDir;
        this.dbPath = outputPath;
        this.debounceMs = debounceMs;
    }
    /**
     * Initialize or load existing database
     */
    async initialize() {
        const sql = await getSql();
        if (!sql)
            throw new Error("Failed to initialize SQL.js");
        if (fs.existsSync(this.dbPath)) {
            const fileBuffer = fs.readFileSync(this.dbPath);
            this.db = new sql.Database(fileBuffer);
            await this.loadFileHashes();
        }
        else {
            this.db = new sql.Database();
            this.createSchema();
        }
    }
    /**
     * Create database schema
     */
    createSchema() {
        if (!this.db)
            return;
        this.db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        language TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        this.db.run(`
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
        this.db.run(`
      CREATE TABLE IF NOT EXISTS imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_file_id INTEGER NOT NULL,
        target_file TEXT NOT NULL,
        type TEXT NOT NULL,
        FOREIGN KEY (source_file_id) REFERENCES files(id)
      )
    `);
        this.db.run(`
      CREATE TABLE IF NOT EXISTS file_hashes (
        path TEXT PRIMARY KEY,
        hash TEXT NOT NULL,
        mtime INTEGER NOT NULL
      )
    `);
        this.createIndexes();
    }
    createIndexes() {
        if (!this.db)
            return;
        this.db.run("CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name)");
        this.db.run("CREATE INDEX IF NOT EXISTS idx_symbols_type ON symbols(type)");
        this.db.run("CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(file_id)");
        this.db.run("CREATE INDEX IF NOT EXISTS idx_imports_source ON imports(source_file_id)");
        this.db.run("CREATE INDEX IF NOT EXISTS idx_imports_target ON imports(target_file)");
    }
    /**
     * Load existing file hashes from database
     */
    async loadFileHashes() {
        if (!this.db)
            return;
        const result = this.db.exec("SELECT path, hash, mtime FROM file_hashes");
        if (result.length > 0) {
            for (const row of result[0].values) {
                this.fileHashes.set(row[0], {
                    hash: row[1],
                    mtime: row[2],
                });
            }
        }
    }
    /**
     * Compute file hash
     */
    computeHash(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath);
            const hash = crypto.createHash("md5").update(content).digest("hex");
            return { hash, mtime: stats.mtimeMs };
        }
        catch {
            return null;
        }
    }
    /**
     * Check if file has changed
     */
    hasFileChanged(filePath) {
        const current = this.computeHash(filePath);
        if (!current)
            return false;
        const existing = this.fileHashes.get(filePath);
        if (!existing)
            return true;
        return existing.hash !== current.hash || existing.mtime !== current.mtime;
    }
    /**
     * Update file hash in database
     */
    updateFileHash(filePath) {
        const current = this.computeHash(filePath);
        if (!current || !this.db)
            return;
        this.db.run("INSERT OR REPLACE INTO file_hashes (path, hash, mtime) VALUES (?, ?, ?)", [filePath, current.hash, current.mtime]);
        this.fileHashes.set(filePath, current);
    }
    /**
     * Get relative path
     */
    getRelativePath(filePath) {
        return path.relative(this.rootDir, filePath);
    }
    /**
     * Process a single file (add or update)
     */
    async processFile(filePath) {
        if (!this.db)
            return;
        const relativePath = this.getRelativePath(filePath);
        const fileName = path.basename(filePath);
        const lastDot = fileName.lastIndexOf(".");
        const extension = lastDot > 0 ? fileName.slice(lastDot + 1) : "";
        const language = detectLanguage(extension);
        // Get or create file ID
        let fileId;
        const existingFile = this.db.exec("SELECT id FROM files WHERE path = ?", [relativePath]);
        if (existingFile.length > 0 && existingFile[0].values.length > 0) {
            fileId = existingFile[0].values[0][0];
            this.db.run("UPDATE files SET language = ? WHERE id = ?", [language, fileId]);
        }
        else {
            this.db.run("INSERT INTO files (path, language) VALUES (?, ?)", [relativePath, language]);
            const result = this.db.exec("SELECT id FROM files WHERE path = ?", [relativePath]);
            fileId = result[0].values[0][0];
        }
        // Delete existing symbols and imports for this file
        this.db.run("DELETE FROM symbols WHERE file_id = ?", [fileId]);
        this.db.run("DELETE FROM imports WHERE source_file_id = ?", [fileId]);
        // Parse and insert new symbols
        const symbols = parseFileForSymbols(filePath, extension);
        for (const sym of symbols) {
            this.db.run("INSERT INTO symbols (name, type, file_id, line, exported) VALUES (?, ?, ?, ?, ?)", [sym.name, sym.type, fileId, sym.line, sym.exported ? 1 : 0]);
            this.stats.symbols++;
        }
        // Parse and insert new imports
        const imports = parseFileForImports(filePath, extension);
        for (const imp of imports) {
            this.db.run("INSERT INTO imports (source_file_id, target_file, type) VALUES (?, ?, ?)", [fileId, imp.target_file, imp.type]);
            this.stats.imports++;
        }
        this.updateFileHash(filePath);
        this.stats.files++;
    }
    /**
     * Remove a file from index
     */
    async removeFile(filePath) {
        if (!this.db)
            return;
        const relativePath = this.getRelativePath(filePath);
        const result = this.db.exec("SELECT id FROM files WHERE path = ?", [relativePath]);
        if (result.length > 0 && result[0].values.length > 0) {
            const fileId = result[0].values[0][0];
            this.db.run("DELETE FROM symbols WHERE file_id = ?", [fileId]);
            this.db.run("DELETE FROM imports WHERE source_file_id = ?", [fileId]);
            this.db.run("DELETE FROM files WHERE id = ?", [fileId]);
            this.db.run("DELETE FROM file_hashes WHERE path = ?", [relativePath]);
            this.fileHashes.delete(relativePath);
        }
    }
    /**
     * Save database to disk
     */
    save() {
        if (!this.db)
            return;
        const data = this.db.export();
        const buffer = Buffer.from(data);
        const outputDir = path.dirname(this.dbPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(this.dbPath, buffer);
    }
    /**
     * Start watching for file changes
     */
    async watch(ignoredPatterns = []) {
        const defaultIgnored = [
            ...DEFAULT_EXCLUDE_PATTERNS,
            "*.log",
            ".DS_Store",
            "Thumbs.db",
            ...ignoredPatterns,
        ];
        console.log(`\n👀 Watching for changes in: ${this.rootDir}`);
        console.log(`   Database: ${this.dbPath}`);
        console.log(`   Debounce: ${this.debounceMs}ms\n`);
        this.watcher = chokidar.watch(this.rootDir, {
            ignored: defaultIgnored,
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 200,
                pollInterval: 100,
            },
        });
        this.watcher
            .on("add", (filePath) => this.handleFileEvent("add", filePath))
            .on("change", (filePath) => this.handleFileEvent("change", filePath))
            .on("unlink", (filePath) => this.handleFileEvent("unlink", filePath))
            .on("error", (error) => console.error("Watch error:", error));
    }
    /**
     * Handle file events with debouncing
     */
    handleFileEvent(event, filePath) {
        const existingTimer = this.debounceTimers.get(filePath);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        const timer = setTimeout(async () => {
            this.debounceTimers.delete(filePath);
            try {
                if (event === "unlink") {
                    await this.removeFile(filePath);
                    console.log(`🗑️  Removed: ${this.getRelativePath(filePath)}`);
                }
                else if (this.hasFileChanged(filePath)) {
                    await this.processFile(filePath);
                    console.log(`📝 ${event === "add" ? "Added" : "Updated"}: ${this.getRelativePath(filePath)}`);
                }
                this.save();
            }
            catch (error) {
                console.error(`Error processing ${filePath}:`, error);
            }
        }, this.debounceMs);
        this.debounceTimers.set(filePath, timer);
    }
    /**
     * Stop watching
     */
    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        console.log("\n🛑 Watcher stopped");
    }
    /**
     * Get current stats
     */
    getStats() {
        return this.stats;
    }
}
/**
 * Parse file for symbols
 */
function parseFileForSymbols(filePath, extension) {
    const symbols = [];
    try {
        const content = readFile(filePath);
        const lines = content.split("\n");
        if (["ts", "tsx", "js", "jsx"].includes(extension)) {
            parseJsTs(lines, symbols);
        }
        else if (extension === "py") {
            parsePython(lines, symbols);
        }
        else if (extension === "go") {
            parseGo(lines, symbols);
        }
        else if (extension === "java") {
            parseJava(lines, symbols);
        }
        else if (extension === "cs") {
            parseCSharp(lines, symbols);
        }
        else if (extension === "rb") {
            parseRuby(lines, symbols);
        }
        else if (extension === "php") {
            parsePHP(lines, symbols);
        }
        else if (extension === "swift") {
            parseSwift(lines, symbols);
        }
        else if (extension === "kt") {
            parseKotlin(lines, symbols);
        }
        else if (extension === "scala") {
            parseScala(lines, symbols);
        }
        else if (extension === "rs") {
            parseRust(lines, symbols);
        }
        else if (extension === "cls") {
            parseApex(lines, symbols);
        }
    }
    catch { }
    return symbols;
}
function parseJsTs(lines, symbols) {
    const patterns = [
        { regex: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()/, type: "function" },
        { regex: /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/, type: "function" },
        { regex: /class\s+(\w+)/, type: "class" },
        { regex: /interface\s+(\w+)/, type: "interface" },
        { regex: /type\s+(\w+)/, type: "type" },
        { regex: /enum\s+(\w+)/, type: "enum" },
        { regex: /(?:export\s+)?(?:const|let)\s+(\w+)/, type: "const" },
    ];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        for (const p of patterns) {
            const match = line.match(p.regex);
            if (match) {
                const name = match[1] || match[2] || match[3];
                if (name && !name.startsWith("_") && name.length > 1) {
                    symbols.push({ name, type: p.type, line: i + 1, exported: line.startsWith("export") });
                }
            }
        }
    }
}
function parsePython(lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/^class\s+(\w+)/);
        if (classMatch)
            symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: true });
        const funcMatch = line.match(/^def\s+(\w+)/);
        if (funcMatch)
            symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: true });
    }
}
function parseGo(lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const funcMatch = line.match(/^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)/);
        if (funcMatch && funcMatch[1] !== "init") {
            symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: /func\s+[A-Z]/.test(line) });
        }
        const typeMatch = line.match(/^type\s+(\w+)/);
        if (typeMatch)
            symbols.push({ name: typeMatch[1], type: "type", line: i + 1, exported: true });
    }
}
function parseJava(lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/^(?:public\s+)?class\s+(\w+)/);
        if (classMatch)
            symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: line.startsWith("public") });
        const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
        if (interfaceMatch)
            symbols.push({ name: interfaceMatch[1], type: "interface", line: i + 1, exported: line.startsWith("public") });
    }
}
function parseCSharp(lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/^(?:public\s+)?class\s+(\w+)/);
        if (classMatch)
            symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: line.startsWith("public") });
    }
}
function parseRuby(lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/^class\s+(\w+)/);
        if (classMatch)
            symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: true });
        const funcMatch = line.match(/^def\s+(\w+)/);
        if (funcMatch)
            symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: true });
    }
}
function parsePHP(lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch)
            symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: true });
        const funcMatch = line.match(/function\s+(\w+)/);
        if (funcMatch)
            symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: true });
    }
}
function parseSwift(lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/^(?:public\s+)?class\s+(\w+)/);
        if (classMatch)
            symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: line.startsWith("public") });
        const funcMatch = line.match(/^(?:public\s+)?func\s+(\w+)/);
        if (funcMatch)
            symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: line.startsWith("public") });
    }
}
function parseKotlin(lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch)
            symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: true });
        const funcMatch = line.match(/fun\s+(\w+)/);
        if (funcMatch)
            symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: true });
    }
}
function parseScala(lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch)
            symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: true });
        const funcMatch = line.match(/def\s+(\w+)/);
        if (funcMatch)
            symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: true });
    }
}
function parseRust(lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const funcMatch = line.match(/^pub\s+fn\s+(\w+)/);
        if (funcMatch)
            symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: true });
        const structMatch = line.match(/^pub\s+struct\s+(\w+)/);
        if (structMatch)
            symbols.push({ name: structMatch[1], type: "struct", line: i + 1, exported: true });
    }
}
function parseApex(lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch)
            symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: line.startsWith("public") });
    }
}
/**
 * Parse file for imports
 */
function parseFileForImports(filePath, extension) {
    const imports = [];
    try {
        const content = readFile(filePath);
        if (["ts", "tsx", "js", "jsx"].includes(extension)) {
            const es6Matches = content.matchAll(/import\s+(?:[\w{},\s]+\s+from\s+)?['"]([@\w\-./]+)['"]/g);
            for (const match of es6Matches) {
                imports.push({ target_file: match[1], type: "import" });
            }
            const requireMatches = content.matchAll(/require\s*\(\s*['"]([@\w\-./]+)['"]\s*\)/g);
            for (const match of requireMatches) {
                imports.push({ target_file: match[1], type: "require" });
            }
        }
        else if (extension === "py") {
            const fromMatches = content.matchAll(/^from\s+([@\w.]+)\s+import/gm);
            for (const match of fromMatches) {
                imports.push({ target_file: match[1].replace(/\./g, "/"), type: "from" });
            }
            const importMatches = content.matchAll(/^import\s+([@\w.]+)/gm);
            for (const match of importMatches) {
                imports.push({ target_file: match[1].replace(/\./g, "/"), type: "import" });
            }
        }
        else if (extension === "go") {
            const importMatches = content.matchAll(/import\s+(?:\(\s*)?["']([@\w\-./]+)["']/g);
            for (const match of importMatches) {
                imports.push({ target_file: match[1], type: "import" });
            }
        }
    }
    catch { }
    return imports;
}
function computeFileHash(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath);
        const hash = crypto.createHash("md5").update(content).digest("hex");
        return { hash, mtime: stats.mtimeMs };
    }
    catch {
        return null;
    }
}
/**
 * Full index generation (for initial build)
 */
export async function generateIndex(rootDir, outputPath) {
    try {
        const sql = await getSql();
        if (!sql)
            throw new Error("Failed to initialize SQL.js");
        const db = new sql.Database();
        // Create schema
        db.run(`CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT NOT NULL UNIQUE, language TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
        db.run(`CREATE TABLE IF NOT EXISTS symbols (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, file_id INTEGER NOT NULL, line INTEGER, exported INTEGER DEFAULT 0, FOREIGN KEY (file_id) REFERENCES files(id))`);
        db.run(`CREATE TABLE IF NOT EXISTS imports (id INTEGER PRIMARY KEY AUTOINCREMENT, source_file_id INTEGER NOT NULL, target_file TEXT NOT NULL, type TEXT NOT NULL, FOREIGN KEY (source_file_id) REFERENCES files(id))`);
        db.run(`CREATE TABLE IF NOT EXISTS file_hashes (path TEXT PRIMARY KEY, hash TEXT NOT NULL, mtime INTEGER NOT NULL)`);
        db.run("CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name)");
        db.run("CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(file_id)");
        db.run("CREATE INDEX IF NOT EXISTS idx_imports_source ON imports(source_file_id)");
        const { getAllFiles, getRelativePath } = await import("../utils/fileUtils.js");
        const allFiles = getAllFiles(rootDir, DEFAULT_EXCLUDE_PATTERNS);
        const fileIdMap = new Map();
        let fileCount = 0, symbolCount = 0, importCount = 0;
        for (const filePath of allFiles) {
            const relativePath = getRelativePath(rootDir, filePath);
            const fileName = path.basename(filePath);
            const lastDot = fileName.lastIndexOf(".");
            const extension = lastDot > 0 ? fileName.slice(lastDot + 1) : "";
            const language = detectLanguage(extension);
            db.run("INSERT INTO files (path, language) VALUES (?, ?)", [relativePath, language]);
            const result = db.exec("SELECT id FROM files WHERE path = ?", [relativePath]);
            const fileId = result[0].values[0][0];
            fileIdMap.set(relativePath, fileId);
            fileCount++;
            const symbols = parseFileForSymbols(filePath, extension);
            for (const sym of symbols) {
                db.run("INSERT INTO symbols (name, type, file_id, line, exported) VALUES (?, ?, ?, ?, ?)", [sym.name, sym.type, fileId, sym.line, sym.exported ? 1 : 0]);
                symbolCount++;
            }
            const imports = parseFileForImports(filePath, extension);
            for (const imp of imports) {
                db.run("INSERT INTO imports (source_file_id, target_file, type) VALUES (?, ?, ?)", [fileId, imp.target_file, imp.type]);
                importCount++;
            }
            const hashData = computeFileHash(filePath);
            if (hashData) {
                db.run("INSERT INTO file_hashes (path, hash, mtime) VALUES (?, ?, ?)", [relativePath, hashData.hash, hashData.mtime]);
            }
        }
        const data = db.export();
        const buffer = Buffer.from(data);
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, buffer);
        db.close();
        return {
            success: true,
            dbPath: outputPath,
            stats: { files: fileCount, symbols: symbolCount, imports: importCount },
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
export const EXAMPLE_QUERIES = {
    findFunctionsInFile: `SELECT s.name, s.line FROM symbols s JOIN files f ON s.file_id = f.id WHERE f.path = ? AND s.type = 'function'`,
    findSymbolDefinition: `SELECT f.path, s.line, s.type FROM symbols s JOIN files f ON s.file_id = f.id WHERE s.name = ?`,
    findImporters: `SELECT f.path, i.type FROM imports i JOIN files f ON i.source_file_id = f.id WHERE i.target_file LIKE ?`,
    findExports: `SELECT s.name, s.type, f.path FROM symbols s JOIN files f ON s.file_id = f.id WHERE s.exported = 1`,
    findClasses: `SELECT s.name, f.path, s.line FROM symbols s JOIN files f ON s.file_id = f.id WHERE s.type = 'class'`,
    searchSymbols: `SELECT s.name, s.type, f.path, s.line FROM symbols s JOIN files f ON s.file_id = f.id WHERE s.name LIKE ? LIMIT 50`,
    languageStats: `SELECT language, COUNT(*) as count FROM files GROUP BY language ORDER BY count DESC`,
};
//# sourceMappingURL=indexer.js.map