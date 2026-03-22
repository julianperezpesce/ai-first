import { readFile } from "../utils/fileUtils.js";
import { parserRegistry, createSymbolFromParsed } from "../core/parsers/index.js";
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
        const ext = "." + file.extension;
        if (parserRegistry.hasParser(ext)) {
            const parsed = parserRegistry.parse(file.relativePath, content, ext);
            if (parsed) {
                return createSymbolFromParsed(parsed, file.relativePath);
            }
        }
        const lines = content.split("\n");
        if (file.extension === "go") {
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
        else if (file.extension === "cls" || file.extension === "trigger") {
            parseApex(file, content, lines, symbols);
        }
        else if (file.extension === "php") {
            parsePHP(file, content, lines, symbols);
        }
        else if (file.extension === "rb") {
            parseRuby(file, content, lines, symbols);
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
 * Parse PHP files
 */
function parsePHP(file, content, lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Classes: class ClassName, public class ClassName
        const classMatch = line.match(/^(?:public\s+|private\s+|protected\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, classMatch[1]),
                name: classMatch[1],
                type: "class",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        // Interfaces: interface InterfaceName
        const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
        if (interfaceMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, interfaceMatch[1]),
                name: interfaceMatch[1],
                type: "interface",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        // Functions: function functionName
        const funcMatch = line.match(/^(?:public\s+|private\s+|protected\s+)?function\s+(\w+)/);
        if (funcMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, funcMatch[1]),
                name: funcMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        // Constants: const CONST_NAME
        const constMatch = line.match(/^const\s+(\w+)/);
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
 * Parse Ruby files
 */
function parseRuby(file, content, lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Classes: class ClassName
        const classMatch = line.match(/^class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, classMatch[1]),
                name: classMatch[1],
                type: "class",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        // Modules: module ModuleName
        const moduleMatch = line.match(/^module\s+(\w+)/);
        if (moduleMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, moduleMatch[1]),
                name: moduleMatch[1],
                type: "module",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        const methodMatch = line.match(/^def\s+(\w+)/);
        if (methodMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, methodMatch[1]),
                name: methodMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        const classMethodMatch = line.match(/^def\s+self\.(\w+)/);
        if (classMethodMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, classMethodMatch[1]),
                name: classMethodMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        // Constants: CONST_NAME =
        const constMatch = line.match(/^([A-Z][A-Z0-9_]*)\s*=/);
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
 * Parse Apex (Salesforce) files
 */
function parseApex(file, content, lines, symbols) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Classes: public with sharing class ClassName, public class ClassName, etc.
        const classMatch = line.match(/^(?:public\s+(?:with\s+sharing|without\s+sharing|inherited\s+sharing)\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, classMatch[1]),
                name: classMatch[1],
                type: "class",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        // Interfaces
        const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
        if (interfaceMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, interfaceMatch[1]),
                name: interfaceMatch[1],
                type: "interface",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        // Methods: public static ReturnType methodName(
        // Also handles @AuraEnabled public static ReturnType methodName(
        const methodMatch = line.match(/^(?:@\w+\s+)?(?:public|private|protected|global)\s+(?:static\s+)?(?:\w+)\s+(\w+)\s*\(/);
        if (methodMatch && !["if", "for", "while", "switch"].includes(methodMatch[1])) {
            symbols.push({
                id: generateSymbolId(file.relativePath, methodMatch[1]),
                name: methodMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
                export: line.includes("public") || line.includes("global"),
            });
        }
        // Triggers: trigger TriggerName on ObjectName
        const triggerMatch = line.match(/^trigger\s+(\w+)\s+on\s+(\w+)/);
        if (triggerMatch) {
            symbols.push({
                id: generateSymbolId(file.relativePath, triggerMatch[1]),
                name: triggerMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
                export: true,
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