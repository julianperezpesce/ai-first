import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";
import { FileInfo } from "./repoScanner.js";
import { readFile } from "../utils/fileUtils.js";

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/**
 * Initialize SQL.js
 */
async function getSql(): Promise<typeof SQL> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

/**
 * Supported languages
 */
const LANGUAGE_MAP: Record<string, string> = {
  // TypeScript/JavaScript
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  // Backend
  py: "python",
  go: "go",
  rs: "rust",
  rb: "ruby",
  php: "php",
  java: "java",
  kt: "kotlin",
  scala: "scala",
  cs: "csharp",
  // Mobile
  swift: "swift",
  // Salesforce
  cls: "apex",
  // Web
  vue: "vue",
  svelte: "svelte",
  html: "html",
  css: "css",
  scss: "scss",
  less: "less",
};

/**
 * Language detection
 */
function detectLanguage(extension: string): string {
  return LANGUAGE_MAP[extension] || "unknown";
}

/**
 * Index result
 */
export interface IndexResult {
  success: boolean;
  dbPath: string;
  stats: {
    files: number;
    symbols: number;
    imports: number;
  };
  error?: string;
}

/**
 * Create database schema
 */
function createSchema(db: Database): void {
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
 * Parse file for symbols
 */
function parseFileForSymbols(file: FileInfo): { name: string; type: string; line: number; exported: boolean }[] {
  const symbols: { name: string; type: string; line: number; exported: boolean }[] = [];
  
  try {
    const content = readFile(file.path);
    const lines = content.split("\n");
    
    const ext = file.extension;
    
    if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
      parseJsTs(lines, symbols);
    } else if (ext === "py") {
      parsePython(lines, symbols);
    } else if (ext === "go") {
      parseGo(lines, symbols);
    } else if (ext === "java") {
      parseJava(lines, symbols);
    } else if (ext === "cs") {
      parseCSharp(lines, symbols);
    } else if (ext === "rb") {
      parseRuby(lines, symbols);
    } else if (ext === "php") {
      parsePHP(lines, symbols);
    } else if (ext === "swift") {
      parseSwift(lines, symbols);
    } else if (ext === "kt") {
      parseKotlin(lines, symbols);
    } else if (ext === "scala") {
      parseScala(lines, symbols);
    } else if (ext === "rs") {
      parseRust(lines, symbols);
    } else if (ext === "cls") {
      parseApex(lines, symbols);
    }
  } catch {}

  return symbols;
}

/**
 * Parse JavaScript/TypeScript
 */
function parseJsTs(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
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
function parsePython(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const classMatch = line.match(/^class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: true });
    }

    const funcMatch = line.match(/^def\s+(\w+)/);
    if (funcMatch) {
      symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: true });
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
function parseGo(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
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
 * Parse Java
 */
function parseJava(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const classMatch = line.match(/^(?:public\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: line.startsWith("public") });
    }

    const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
    if (interfaceMatch) {
      symbols.push({ name: interfaceMatch[1], type: "interface", line: i + 1, exported: line.startsWith("public") });
    }

    const methodMatch = line.match(/^(?:public|private|protected)\s+(?:static\s+)?(?:\w+)\s+(\w+)\s*\(/);
    if (methodMatch && !["if", "for", "while", "switch", "catch"].includes(methodMatch[1])) {
      symbols.push({ name: methodMatch[1], type: "function", line: i + 1, exported: line.startsWith("public") });
    }
  }
}

/**
 * Parse C#
 */
function parseCSharp(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const classMatch = line.match(/^(?:public\s+)?(?:partial\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: line.startsWith("public") });
    }

    const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
    if (interfaceMatch) {
      symbols.push({ name: interfaceMatch[1], type: "interface", line: i + 1, exported: line.startsWith("public") });
    }

    const methodMatch = line.match(/^(?:public|private|protected|internal)\s+(?:static\s+)?(?:async\s+)?(?:\w+)\s+(\w+)\s*\(/);
    if (methodMatch) {
      symbols.push({ name: methodMatch[1], type: "function", line: i + 1, exported: line.startsWith("public") });
    }
  }
}

/**
 * Parse Ruby
 */
function parseRuby(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const classMatch = line.match(/^class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: true });
    }

    const moduleMatch = line.match(/^module\s+(\w+)/);
    if (moduleMatch) {
      symbols.push({ name: moduleMatch[1], type: "module", line: i + 1, exported: true });
    }

    const methodMatch = line.match(/^def\s+(\w+)/);
    if (methodMatch) {
      symbols.push({ name: methodMatch[1], type: "function", line: i + 1, exported: true });
    }
  }
}

/**
 * Parse PHP
 */
function parsePHP(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const classMatch = line.match(/^(?:final\s+)?(?:abstract\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: true });
    }

    const interfaceMatch = line.match(/^interface\s+(\w+)/);
    if (interfaceMatch) {
      symbols.push({ name: interfaceMatch[1], type: "interface", line: i + 1, exported: true });
    }

    const traitMatch = line.match(/^trait\s+(\w+)/);
    if (traitMatch) {
      symbols.push({ name: traitMatch[1], type: "trait", line: i + 1, exported: true });
    }

    const functionMatch = line.match(/^function\s+(\w+)/);
    if (functionMatch) {
      symbols.push({ name: functionMatch[1], type: "function", line: i + 1, exported: true });
    }
  }
}

/**
 * Parse Swift
 */
function parseSwift(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const classMatch = line.match(/^(?:public\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: line.startsWith("public") });
    }

    const structMatch = line.match(/^(?:public\s+)?struct\s+(\w+)/);
    if (structMatch) {
      symbols.push({ name: structMatch[1], type: "struct", line: i + 1, exported: line.startsWith("public") });
    }

    const enumMatch = line.match(/^(?:public\s+)?enum\s+(\w+)/);
    if (enumMatch) {
      symbols.push({ name: enumMatch[1], type: "enum", line: i + 1, exported: line.startsWith("public") });
    }

    const protocolMatch = line.match(/^(?:public\s+)?protocol\s+(\w+)/);
    if (protocolMatch) {
      symbols.push({ name: protocolMatch[1], type: "protocol", line: i + 1, exported: line.startsWith("public") });
    }

    const funcMatch = line.match(/^(?:public\s+)?func\s+(\w+)/);
    if (funcMatch) {
      symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: line.startsWith("public") });
    }
  }
}

/**
 * Parse Kotlin
 */
function parseKotlin(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const classMatch = line.match(/^(?:open\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: true });
    }

    const objectMatch = line.match(/^object\s+(\w+)/);
    if (objectMatch) {
      symbols.push({ name: objectMatch[1], type: "object", line: i + 1, exported: true });
    }

    const interfaceMatch = line.match(/^interface\s+(\w+)/);
    if (interfaceMatch) {
      symbols.push({ name: interfaceMatch[1], type: "interface", line: i + 1, exported: true });
    }

    const funcMatch = line.match(/^fun\s+(\w+)/);
    if (funcMatch) {
      symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: line.startsWith("fun") });
    }
  }
}

/**
 * Parse Scala
 */
function parseScala(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const classMatch = line.match(/^(?:abstract\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: true });
    }

    const caseClassMatch = line.match(/^case\s+class\s+(\w+)/);
    if (caseClassMatch) {
      symbols.push({ name: caseClassMatch[1], type: "case_class", line: i + 1, exported: true });
    }

    const traitMatch = line.match(/^trait\s+(\w+)/);
    if (traitMatch) {
      symbols.push({ name: traitMatch[1], type: "trait", line: i + 1, exported: true });
    }

    const objectMatch = line.match(/^object\s+(\w+)/);
    if (objectMatch) {
      symbols.push({ name: objectMatch[1], type: "object", line: i + 1, exported: true });
    }

    const funcMatch = line.match(/^def\s+(\w+)/);
    if (funcMatch) {
      symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: true });
    }
  }
}

/**
 * Parse Rust
 */
function parseRust(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const funcMatch = line.match(/^pub\s+fn\s+(\w+)/);
    if (funcMatch) {
      symbols.push({ name: funcMatch[1], type: "function", line: i + 1, exported: true });
    }

    const structMatch = line.match(/^pub\s+struct\s+(\w+)/);
    if (structMatch) {
      symbols.push({ name: structMatch[1], type: "struct", line: i + 1, exported: true });
    }

    const enumMatch = line.match(/^pub\s+enum\s+(\w+)/);
    if (enumMatch) {
      symbols.push({ name: enumMatch[1], type: "enum", line: i + 1, exported: true });
    }

    const traitMatch = line.match(/^pub\s+trait\s+(\w+)/);
    if (traitMatch) {
      symbols.push({ name: traitMatch[1], type: "trait", line: i + 1, exported: true });
    }
  }
}

/**
 * Parse Apex (Salesforce)
 */
function parseApex(lines: string[], symbols: { name: string; type: string; line: number; exported: boolean }[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const classMatch = line.match(/^(?:public\s+)?(?:virtual\s+)?(?:abstract\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], type: "class", line: i + 1, exported: line.startsWith("public") });
    }

    const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
    if (interfaceMatch) {
      symbols.push({ name: interfaceMatch[1], type: "interface", line: i + 1, exported: line.startsWith("public") });
    }

    const triggerMatch = line.match(/^trigger\s+(\w+)/);
    if (triggerMatch) {
      symbols.push({ name: triggerMatch[1], type: "trigger", line: i + 1, exported: true });
    }

    const methodMatch = line.match(/^(?:public|private|protected|global)\s+(?:static\s+)?(?:\w+)\s+(\w+)\s*\(/);
    if (methodMatch && !["if", "for", "while", "switch", "catch"].includes(methodMatch[1])) {
      symbols.push({ name: methodMatch[1], type: "method", line: i + 1, exported: line.startsWith("public") || line.startsWith("global") });
    }
  }
}

/**
 * Parse file for imports
 */
function parseFileForImports(file: FileInfo): { target_file: string; type: string }[] {
  const imports: { target_file: string; type: string }[] = [];
  
  try {
    const content = readFile(file.path);
    const ext = file.extension;
    
    if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
      const es6Matches = content.matchAll(/import\s+(?:[\w{},\s]+\s+from\s+)?['"]([@\w\-./]+)['"]/g);
      for (const match of es6Matches) {
        imports.push({ target_file: match[1], type: "import" });
      }
      const requireMatches = content.matchAll(/require\s*\(\s*['"]([@\w\-./]+)['"]\s*\)/g);
      for (const match of requireMatches) {
        imports.push({ target_file: match[1], type: "require" });
      }
    } else if (ext === "py") {
      const fromMatches = content.matchAll(/^from\s+([@\w.]+)\s+import/gm);
      for (const match of fromMatches) {
        imports.push({ target_file: match[1].replace(/\./g, "/"), type: "from" });
      }
      const importMatches = content.matchAll(/^import\s+([@\w.]+)/gm);
      for (const match of importMatches) {
        imports.push({ target_file: match[1].replace(/\./g, "/"), type: "import" });
      }
    } else if (ext === "go") {
      const importMatches = content.matchAll(/import\s+(?:\(\s*)?["']([@\w\-./]+)["']/g);
      for (const match of importMatches) {
        imports.push({ target_file: match[1], type: "import" });
      }
    } else if (ext === "java" || ext === "cs") {
      const javaMatches = content.matchAll(/^import\s+([\w.]+);/gm);
      for (const match of javaMatches) {
        if (!match[1].startsWith("java.") && !match[1].startsWith("javax.") && !match[1].startsWith("System.")) {
          imports.push({ target_file: match[1].replace(/\./g, "/"), type: "import" });
        }
      }
    } else if (ext === "rb") {
      const requireMatches = content.matchAll(/require(?:_relative)?\s+['"]([@\w\-./]+)['"]/g);
      for (const match of requireMatches) {
        imports.push({ target_file: match[1], type: "require" });
      }
    } else if (ext === "php") {
      const requireMatches = content.matchAll(/(?:require|require_once|include|include_once)\s+['"]([@\w\-./]+)['"]/g);
      for (const match of requireMatches) {
        imports.push({ target_file: match[1], type: "require" });
      }
      const useMatches = content.matchAll(/^use\s+([\w\\]+)/gm);
      for (const match of useMatches) {
        imports.push({ target_file: match[1].replace(/\\/, "/"), type: "use" });
      }
    } else if (ext === "swift") {
      const importMatches = content.matchAll(/^import\s+(\w+)/gm);
      for (const match of importMatches) {
        imports.push({ target_file: match[1], type: "import" });
      }
    } else if (ext === "kt") {
      const importMatches = content.matchAll(/^import\s+([\w.]+)/gm);
      for (const match of importMatches) {
        if (!match[1].startsWith("kotlin.")) {
          imports.push({ target_file: match[1].replace(/\./g, "/"), type: "import" });
        }
      }
    } else if (ext === "scala") {
      const importMatches = content.matchAll(/^import\s+([\w._]+)/gm);
      for (const match of importMatches) {
        imports.push({ target_file: match[1].replace(/\./g, "/"), type: "import" });
      }
    } else if (ext === "rs") {
      const useMatches = content.matchAll(/^use\s+(?:crate|self|super)::([\w]+)/gm);
      for (const match of useMatches) {
        imports.push({ target_file: match[0].replace(/^use\s+/, "").replace(/::/g, "/"), type: "use" });
      }
    } else if (ext === "cls") {
      const usingMatches = content.matchAll(/^using\s+([\w.]+);/gm);
      for (const match of usingMatches) {
        imports.push({ target_file: match[1].replace(/\./g, "/"), type: "using" });
      }
    }
  } catch {}

  return imports;
}

/**
 * Generate repository index
 */
export async function generateIndex(rootDir: string, outputPath: string): Promise<IndexResult> {
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
    
    const files: FileInfo[] = [];
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
    const fileIdMap = new Map<string, number>();
    
    for (const file of files) {
      const language = detectLanguage(file.extension);
      db.run(
        "INSERT OR IGNORE INTO files (path, language) VALUES (?, ?)",
        [file.relativePath, language]
      );
      
      const result = db.exec("SELECT id FROM files WHERE path = ?", [file.relativePath]);
      if (result.length > 0 && result[0].values.length > 0) {
        fileIdMap.set(file.relativePath, result[0].values[0][0] as number);
      }
    }
    
    // Insert symbols
    let symbolCount = 0;
    for (const file of files) {
      const fileId = fileIdMap.get(file.relativePath);
      if (!fileId) continue;
      
      const symbols = parseFileForSymbols(file);
      for (const sym of symbols) {
        db.run(
          "INSERT INTO symbols (name, type, file_id, line, exported) VALUES (?, ?, ?, ?, ?)",
          [sym.name, sym.type, fileId, sym.line, sym.exported ? 1 : 0]
        );
        symbolCount++;
      }
    }
    
    // Insert imports
    let importCount = 0;
    for (const file of files) {
      const fileId = fileIdMap.get(file.relativePath);
      if (!fileId) continue;
      
      const fileImports = parseFileForImports(file);
      for (const imp of fileImports) {
        db.run(
          "INSERT INTO imports (source_file_id, target_file, type) VALUES (?, ?, ?)",
          [fileId, imp.target_file, imp.type]
        );
        importCount++;
      }
    }
    
    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    
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
  } catch (error) {
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
  findFunctionsInFile: `
    SELECT s.name, s.line 
    FROM symbols s
    JOIN files f ON s.file_id = f.id
    WHERE f.path = ? AND s.type = 'function'
    ORDER BY s.line
  `,
  
  findSymbolDefinition: `
    SELECT f.path, s.line, s.type
    FROM symbols s
    JOIN files f ON s.file_id = f.id
    WHERE s.name = ?
  `,
  
  findImporters: `
    SELECT f.path, i.type
    FROM imports i
    JOIN files f ON i.source_file_id = f.id
    WHERE i.target_file LIKE ?
  `,
  
  findExports: `
    SELECT s.name, s.type, f.path
    FROM symbols s
    JOIN files f ON s.file_id = f.id
    WHERE s.exported = 1
    ORDER BY f.path, s.name
  `,
  
  findClasses: `
    SELECT s.name, f.path, s.line
    FROM symbols s
    JOIN files f ON s.file_id = f.id
    WHERE s.type = 'class'
    ORDER BY f.path
  `,
  
  getFileDependencies: `
    SELECT i.target_file, i.type
    FROM imports i
    JOIN files f ON i.source_file_id = f.id
    WHERE f.path = ?
  `,
  
  searchSymbols: `
    SELECT s.name, s.type, f.path, s.line
    FROM symbols s
    JOIN files f ON s.file_id = f.id
    WHERE s.name LIKE ?
    LIMIT 50
  `,
  
  languageStats: `
    SELECT language, COUNT(*) as count
    FROM files
    GROUP BY language
    ORDER BY count DESC
  `,
};
