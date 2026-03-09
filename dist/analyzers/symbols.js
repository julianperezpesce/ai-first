import { readFile } from "../utils/fileUtils.js";
/**
 * Generate unique symbol ID from file path and symbol name
 * Format: filePath#symbolName (e.g., src/auth/login.ts#loginUser)
 */
export function generateSymbolId(filePath, symbolName) {
    return `${filePath}#${symbolName}`;
}
/**
 * Extract symbols from source files
 */
export function extractSymbols(files) {
    const symbols = [];
    const byFile = {};
    for (const file of files) {
        const fileSymbols = parseFileForSymbols(file);
        symbols.push(...fileSymbols);
        if (fileSymbols.length > 0) {
            byFile[file.relativePath] = fileSymbols;
        }
    }
    // Build byId index
    const byId = {};
    for (const sym of symbols) {
        byId[sym.id] = sym;
    }
    const byType = {};
    for (const sym of symbols) {
        if (!byType[sym.type])
            byType[sym.type] = [];
        byType[sym.type].push(sym);
    }
    return { symbols, byId, byFile, byType };
}
/**
 * Parse a single file for symbols
 */
function parseFileForSymbols(file) {
    const symbols = [];
    try {
        const content = readFile(file.path);
        const lines = content.split("\n");
        if (file.extension === "ts" || file.extension === "tsx" || file.extension === "js" || file.extension === "jsx") {
            parseJavaScriptTypeScript(file, content, lines, symbols);
        }
        else if (file.extension === "py") {
            parsePython(file, content, lines, symbols);
        }
        else if (file.extension === "go") {
            parseGo(file, content, lines, symbols);
        }
        else if (file.extension === "rs") {
            parseRust(file, content, lines, symbols);
        }
        else if (file.extension === "java") {
            parseJava(file, content, lines, symbols);
        }
        else if (file.extension === "cs") {
            parseCSharp(file, content, lines, symbols);
        }
    }
    catch { }
    return symbols;
}
/**
 * Parse JavaScript/TypeScript files
 */
function parseJavaScriptTypeScript(file, content, lines, symbols) {
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
                        id: generateSymbolId(file.relativePath, name),
                        name,
                        type: p.type,
                        file: file.relativePath,
                        line: i + 1,
                        export: line.startsWith("export"),
                    });
                }
            }
        }
    }
}
/**
 * Parse Python files
 */
function parsePython(file, content, lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/^class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, classMatch[1]),
                name: classMatch[1],
                type: "class",
                file: file.relativePath,
                line: i + 1,
                export: line.startsWith("class") && !line.startsWith("class _"),
            });
            continue;
        }
        const funcMatch = line.match(/^def\s+(\w+)/);
        if (funcMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, funcMatch[1]),
                name: funcMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
                export: line.startsWith("def"),
            });
            continue;
        }
        const constMatch = line.match(/^([A-Z][A-Z0-9_]*)\s*=/);
        if (constMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, constMatch[1]),
                name: constMatch[1],
                type: "const",
                file: file.relativePath,
                line: i + 1,
            });
        }
    }
}
/**
 * Parse Go files
 */
function parseGo(file, content, lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const funcMatch = line.match(/^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)/);
        if (funcMatch && funcMatch[1] !== "init") {
            symbols.push({
                id: generateSymbolId(file.relativePath, funcMatch[1]),
                name: funcMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
                export: line.startsWith("func") && !line.startsWith("func (") && /func\s+[A-Z]/.test(line),
            });
        }
        const typeMatch = line.match(/^type\s+(\w+)/);
        if (typeMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, typeMatch[1]),
                name: typeMatch[1],
                type: "type",
                file: file.relativePath,
                line: i + 1,
            });
        }
        const constMatch = line.match(/^const\s+(?:\(\s*)?(\w+)/);
        if (constMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, constMatch[1]),
                name: constMatch[1],
                type: "const",
                file: file.relativePath,
                line: i + 1,
            });
        }
    }
}
/**
 * Parse Rust files
 */
function parseRust(file, content, lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const funcMatch = line.match(/^pub\s+fn\s+(\w+)/);
        if (funcMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, funcMatch[1]),
                name: funcMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
                export: line.startsWith("pub"),
            });
        }
        const structMatch = line.match(/^pub\s+struct\s+(\w+)/);
        if (structMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, structMatch[1]),
                name: structMatch[1],
                type: "class",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        const enumMatch = line.match(/^pub\s+enum\s+(\w+)/);
        if (enumMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, enumMatch[1]),
                name: enumMatch[1],
                type: "enum",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        const constMatch = line.match(/^pub\s+const\s+(\w+)/);
        if (constMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, constMatch[1]),
                name: constMatch[1],
                type: "const",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
    }
}
/**
 * Parse Java files
 */
function parseJava(file, content, lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/^(?:public\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, classMatch[1]),
                name: classMatch[1],
                type: "class",
                file: file.relativePath,
                line: i + 1,
            });
        }
        const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
        if (interfaceMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, interfaceMatch[1]),
                name: interfaceMatch[1],
                type: "interface",
                file: file.relativePath,
                line: i + 1,
            });
        }
        const methodMatch = line.match(/^(?:public|private|protected)\s+(?:static\s+)?(?:\w+)\s+(\w+)\s*\(/);
        if (methodMatch && methodMatch[1] !== "if" && methodMatch[1] !== "for") {
            symbols.push({
                id: generateSymbolId(file.relativePath, methodMatch[1]),
                name: methodMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
            });
        }
    }
}
/**
 * Parse C# files
 */
function parseCSharp(file, content, lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const classMatch = line.match(/^(?:public\s+)?(?:partial\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, classMatch[1]),
                name: classMatch[1],
                type: "class",
                file: file.relativePath,
                line: i + 1,
            });
        }
        const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
        if (interfaceMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, interfaceMatch[1]),
                name: interfaceMatch[1],
                type: "interface",
                file: file.relativePath,
                line: i + 1,
            });
        }
        const methodMatch = line.match(/^(?:public|private|protected|internal)\s+(?:static\s+)?(?:async\s+)?(?:\w+)\s+(\w+)\s*\(/);
        if (methodMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, methodMatch[1]),
                name: methodMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
            });
        }
    }
}
/**
 * Generate symbols.json with indexed symbols
 */
export function generateSymbolsJson(analysis) {
    // Build symbols index with new ID format
    const symbolsIndex = {};
    for (const sym of analysis.symbols) {
        symbolsIndex[sym.id] = {
            name: sym.name,
            type: sym.type,
            file: sym.file,
            line: sym.line,
            module: sym.file.split('/')[0],
            export: sym.export
        };
    }
    const output = {
        symbols: symbolsIndex,
        total: analysis.symbols.length,
        byType: analysis.byType,
        byFile: analysis.byFile,
        exported: analysis.symbols.filter(s => s.export),
    };
    return JSON.stringify(output, null, 2);
}
//# sourceMappingURL=symbols.js.map