import { readFile } from "../utils/fileUtils.js";
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
    const byType = {};
    for (const sym of symbols) {
        if (!byType[sym.type])
            byType[sym.type] = [];
        byType[sym.type].push(sym);
    }
    return { symbols, byFile, byType };
}
/**
 * Parse a single file for symbols
 */
function parseFileForSymbols(file) {
    const symbols = [];
    try {
        const content = readFile(file.path);
        const lines = content.split("\n");
        // Determine parser based on extension
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
        // Functions: function name() or const name = function
        { regex: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()/, type: "function" },
        // Arrow functions: const name = () =>
        { regex: /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/, type: "function" },
        // Classes: class Name
        { regex: /class\s+(\w+)/, type: "class" },
        // Interfaces: interface Name
        { regex: /interface\s+(\w+)/, type: "interface" },
        // Types: type Name =
        { regex: /type\s+(\w+)/, type: "type" },
        // Enums: enum Name
        { regex: /enum\s+(\w+)/, type: "enum" },
        // Constants: export const Name or const Name =
        { regex: /(?:export\s+)?(?:const|let)\s+(\w+)/, type: "const" },
        // Modules: export module Name
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
        // Classes: class Name:
        const classMatch = line.match(/^class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                name: classMatch[1],
                type: "class",
                file: file.relativePath,
                line: i + 1,
                export: line.startsWith("class") && !line.startsWith("class _"),
            });
            continue;
        }
        // Functions: def name(
        const funcMatch = line.match(/^def\s+(\w+)/);
        if (funcMatch) {
            symbols.push({
                name: funcMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
                export: line.startsWith("def"),
            });
            continue;
        }
        // Constants: NAME = or @constant
        const constMatch = line.match(/^([A-Z][A-Z0-9_]*)\s*=/);
        if (constMatch) {
            symbols.push({
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
        // Functions: func Name(
        const funcMatch = line.match(/^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)/);
        if (funcMatch && funcMatch[1] !== "init") {
            symbols.push({
                name: funcMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
                export: line.startsWith("func") && !line.startsWith("func (") && /func\s+[A-Z]/.test(line),
            });
        }
        // Types: type Name
        const typeMatch = line.match(/^type\s+(\w+)/);
        if (typeMatch) {
            symbols.push({
                name: typeMatch[1],
                type: "type",
                file: file.relativePath,
                line: i + 1,
            });
        }
        // Constants: const Name
        const constMatch = line.match(/^const\s+(?:\(\s*)?(\w+)/);
        if (constMatch) {
            symbols.push({
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
        // Functions: fn name(
        const funcMatch = line.match(/^pub\s+fn\s+(\w+)/);
        if (funcMatch) {
            symbols.push({
                name: funcMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
                export: line.startsWith("pub"),
            });
        }
        // Structs: struct Name
        const structMatch = line.match(/^pub\s+struct\s+(\w+)/);
        if (structMatch) {
            symbols.push({
                name: structMatch[1],
                type: "class",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        // Enums: enum Name
        const enumMatch = line.match(/^pub\s+enum\s+(\w+)/);
        if (enumMatch) {
            symbols.push({
                name: enumMatch[1],
                type: "enum",
                file: file.relativePath,
                line: i + 1,
                export: true,
            });
        }
        // Constants: const NAME
        const constMatch = line.match(/^pub\s+const\s+(\w+)/);
        if (constMatch) {
            symbols.push({
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
        // Classes: public class Name
        const classMatch = line.match(/^(?:public\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                name: classMatch[1],
                type: "class",
                file: file.relativePath,
                line: i + 1,
            });
        }
        // Interfaces: public interface Name
        const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
        if (interfaceMatch) {
            symbols.push({
                name: interfaceMatch[1],
                type: "interface",
                file: file.relativePath,
                line: i + 1,
            });
        }
        // Methods: public Type name(
        const methodMatch = line.match(/^(?:public|private|protected)\s+(?:static\s+)?(?:\w+)\s+(\w+)\s*\(/);
        if (methodMatch && methodMatch[1] !== "if" && methodMatch[1] !== "for") {
            symbols.push({
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
        // Classes: public class Name
        const classMatch = line.match(/^(?:public\s+)?(?:partial\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                name: classMatch[1],
                type: "class",
                file: file.relativePath,
                line: i + 1,
            });
        }
        // Interfaces: public interface Name
        const interfaceMatch = line.match(/^(?:public\s+)?interface\s+(\w+)/);
        if (interfaceMatch) {
            symbols.push({
                name: interfaceMatch[1],
                type: "interface",
                file: file.relativePath,
                line: i + 1,
            });
        }
        // Methods: public Type Name(
        const methodMatch = line.match(/^(?:public|private|protected|internal)\s+(?:static\s+)?(?:async\s+)?(?:\w+)\s+(\w+)\s*\(/);
        if (methodMatch) {
            symbols.push({
                name: methodMatch[1],
                type: "function",
                file: file.relativePath,
                line: i + 1,
            });
        }
    }
}
/**
 * Generate symbols.json
 */
export function generateSymbolsJson(analysis) {
    const output = {
        total: analysis.symbols.length,
        byType: analysis.byType,
        byFile: analysis.byFile,
        exported: analysis.symbols.filter(s => s.export),
    };
    return JSON.stringify(output, null, 2);
}
//# sourceMappingURL=symbols.js.map