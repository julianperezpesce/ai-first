import fs from "fs";
import path from "path";
import { scanRepo } from "./repoScanner.js";
import { extractSymbols } from "../analyzers/symbols.js";
import { analyzeDependencies } from "../analyzers/dependencies.js";
import { readFile } from "../utils/fileUtils.js";
/**
 * Generate symbol graph with bidirectional relationships
 */
export async function generateSymbolGraph(rootDir, outputDir) {
    const graphDir = path.join(outputDir, "graph");
    // Ensure graph directory exists
    if (!fs.existsSync(graphDir)) {
        fs.mkdirSync(graphDir, { recursive: true });
    }
    console.log("\n🕸️  Generating symbol graph...\n");
    // Scan repository
    const scanResult = scanRepo(rootDir);
    const files = scanResult.files;
    // Extract symbols
    const symbolsAnalysis = extractSymbols(files);
    const symbols = symbolsAnalysis.symbols;
    // Analyze dependencies
    const depsAnalysis = analyzeDependencies(files);
    // Build symbol relationships
    const relationships = buildSymbolRelationships(symbols, depsAnalysis, files);
    // Build bySymbol index
    const bySymbol = {};
    for (const rel of relationships) {
        if (!bySymbol[rel.symbolId]) {
            bySymbol[rel.symbolId] = [];
        }
        bySymbol[rel.symbolId].push(rel);
    }
    const graph = { symbols, relationships, bySymbol };
    // Write to file
    const graphFile = path.join(graphDir, "symbol-graph.json");
    fs.writeFileSync(graphFile, JSON.stringify(graph, null, 2));
    console.log(`   ✅ Created ${graphFile}`);
    console.log(`   📦 Symbols: ${symbols.length}`);
    console.log(`   🔗 Relationships: ${relationships.length}`);
    return { success: true };
}
/**
 * Build symbol relationships from dependencies and function calls
 */
function buildSymbolRelationships(symbols, depsAnalysis, files) {
    const relationships = [];
    const symbolMap = new Map();
    // Build symbol lookup map
    for (const sym of symbols) {
        symbolMap.set(sym.id, sym);
        symbolMap.set(sym.name, sym); // Also index by name for quick lookup
    }
    // Process file dependencies - create imports relationships
    for (const dep of depsAnalysis.dependencies) {
        // Find source symbol in the same file
        const sourceSymbols = symbols.filter(s => s.file === dep.source);
        // Try to find target symbol
        let targetSymbol;
        // First try to find by exact ID match (module.symbolName)
        targetSymbol = symbolMap.get(dep.target);
        // Then try by filename without extension
        if (!targetSymbol) {
            const targetName = dep.target.replace(/\.[^.]+$/, '').split('/').pop();
            if (targetName) {
                targetSymbol = symbolMap.get(targetName);
            }
        }
        // If we found a target, create import relationship
        if (targetSymbol && sourceSymbols.length > 0) {
            for (const source of sourceSymbols) {
                relationships.push({
                    symbolId: source.id,
                    targetId: targetSymbol.id,
                    type: "imports",
                });
            }
        }
    }
    // Analyze function calls within files
    for (const file of files) {
        try {
            const content = readFile(file.path);
            const fileSymbols = symbols.filter(s => s.file === file.relativePath);
            // Find function calls in the content
            const calls = findFunctionCalls(content, file.relativePath);
            for (const call of calls) {
                const caller = fileSymbols.find(s => s.name === call.caller && s.type === "function");
                const callee = symbolMap.get(call.callee);
                if (caller && callee) {
                    // Add calls relationship
                    relationships.push({
                        symbolId: caller.id,
                        targetId: callee.id,
                        type: "calls",
                    });
                }
            }
        }
        catch {
            // Ignore read errors
        }
    }
    // Build bidirectional relationships (called_by)
    const callsMap = new Map();
    for (const rel of relationships) {
        if (rel.type === "calls") {
            if (!callsMap.has(rel.targetId)) {
                callsMap.set(rel.targetId, new Set());
            }
            callsMap.get(rel.targetId)?.add(rel.symbolId);
        }
    }
    // Add called_by relationships
    for (const [calleeId, callers] of callsMap) {
        for (const callerId of callers) {
            // Check if this called_by relationship already exists
            const exists = relationships.some(r => r.symbolId === calleeId && r.targetId === callerId && r.type === "called_by");
            if (!exists) {
                relationships.push({
                    symbolId: calleeId,
                    targetId: callerId,
                    type: "called_by",
                });
            }
        }
    }
    return relationships;
}
/**
 * Find function calls within file content
 */
function findFunctionCalls(content, filePath) {
    const calls = [];
    const ext = filePath.split('.').pop();
    if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
        // Find function definitions
        const funcDefs = new Set();
        const funcMatches = content.matchAll(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*\([^)]*\)\s*\{)/g);
        for (const match of funcMatches) {
            const name = match[1] || match[2] || match[3];
            if (name)
                funcDefs.add(name);
        }
        // Find function calls (simple heuristic: identifier followed by parenthesis)
        const callMatches = content.matchAll(/(\w+)\s*\([^)]*\)\s*[;{]/g);
        for (const match of callMatches) {
            const callee = match[1];
            // Skip keywords and common built-ins
            if (callee && !['if', 'for', 'while', 'switch', 'return', 'console', 'require', 'import', 'export'].includes(callee)) {
                calls.push({ caller: "", callee });
            }
        }
    }
    else if (ext === "py") {
        // Python function calls
        const callMatches = content.matchAll(/(\w+)\s*\([^)]*\)/g);
        for (const match of callMatches) {
            const callee = match[1];
            if (callee && !['if', 'for', 'while', 'return', 'print', 'import', 'class', 'def'].includes(callee)) {
                calls.push({ caller: "", callee });
            }
        }
    }
    return calls;
}
/**
 * Load symbol graph from file
 */
export function loadSymbolGraph(aiDir) {
    const graphFile = path.join(aiDir, "graph", "symbol-graph.json");
    if (!fs.existsSync(graphFile)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(graphFile, "utf-8"));
    }
    catch {
        return null;
    }
}
/**
 * Get context for a specific symbol
 */
export function getSymbolContext(symbolId, aiDir) {
    const graph = loadSymbolGraph(aiDir);
    if (!graph)
        return [];
    return graph.bySymbol[symbolId] || [];
}
//# sourceMappingURL=symbolGraph.js.map