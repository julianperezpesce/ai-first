import fs from "fs";
import path from "path";
import { loadSymbolGraph } from "./symbolGraph.js";
import { readFile } from "../utils/fileUtils.js";
/**
 * Generate context packet for a specific symbol
 */
export function generateContextPacket(symbolName, aiDir, rootDir) {
    const graph = loadSymbolGraph(aiDir);
    if (!graph) {
        console.error("Symbol graph not found. Run 'ai-first init' first.");
        return null;
    }
    // Find the symbol (try ID first, then name)
    let symbol = graph.symbols.find(s => s.id === symbolName || s.id.endsWith(`.${symbolName}`));
    // If not found by ID, try just by name
    if (!symbol) {
        symbol = graph.symbols.find(s => s.name === symbolName);
    }
    if (!symbol) {
        console.error(`Symbol '${symbolName}' not found.`);
        console.log(`\nAvailable symbols (first 20):`);
        for (const s of graph.symbols.slice(0, 20)) {
            console.log(`  - ${s.id}`);
        }
        if (graph.symbols.length > 20) {
            console.log(`  ... and ${graph.symbols.length - 20} more`);
        }
        return null;
    }
    // Get relationships
    const relationships = graph.bySymbol[symbol.id] || [];
    const calls = relationships
        .filter(r => r.type === "calls")
        .map(r => r.targetId);
    const calledBy = relationships
        .filter(r => r.type === "called_by")
        .map(r => r.targetId);
    const imports = relationships
        .filter(r => r.type === "imports")
        .map(r => r.targetId);
    // Get related symbols
    const allRelatedIds = new Set([...calls, ...calledBy, ...imports]);
    const relatedSymbols = graph.symbols.filter(s => allRelatedIds.has(s.id)).map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        file: s.file,
        line: s.line,
    }));
    // Get source code
    let sourceCode = "";
    try {
        const fullPath = path.join(rootDir, symbol.file);
        if (fs.existsSync(fullPath)) {
            const content = readFile(fullPath);
            const lines = content.split("\n");
            // Get context around the symbol (10 lines before and after)
            const startLine = Math.max(0, (symbol.line || 1) - 10);
            const endLine = Math.min(lines.length, (symbol.line || 1) + 10);
            sourceCode = lines.slice(startLine, endLine).join("\n");
            // Add line numbers
            sourceCode = lines.slice(startLine, endLine).map((line, i) => `${startLine + i + 1}: ${line}`).join("\n");
        }
    }
    catch {
        sourceCode = "[Source code not available]";
    }
    // Generate summary
    const summary = generateSummary(symbol, calls.length, calledBy.length, imports.length, relatedSymbols.length);
    return {
        symbol: {
            id: symbol.id,
            name: symbol.name,
            type: symbol.type,
            file: symbol.file,
            line: symbol.line,
            export: symbol.export,
        },
        sourceCode,
        relationships: {
            calls,
            calledBy,
            imports,
            references: [],
        },
        relatedSymbols,
        summary,
    };
}
/**
 * Generate human-readable summary
 */
function generateSummary(symbol, callsCount, calledByCount, importsCount, relatedCount) {
    const parts = [];
    parts.push(`**${symbol.name}** is a ${symbol.type} defined as \`${symbol.id}\`.`);
    if (callsCount > 0) {
        parts.push(`It calls ${callsCount} other symbol${callsCount > 1 ? 's' : ''}.`);
    }
    if (calledByCount > 0) {
        parts.push(`It is called by ${calledByCount} other symbol${calledByCount > 1 ? 's' : ''}.`);
    }
    if (importsCount > 0) {
        parts.push(`It imports ${importsCount} module${importsCount > 1 ? 's' : ''}.`);
    }
    if (relatedCount > 0) {
        parts.push(`There are ${relatedCount} related symbols in the graph.`);
    }
    return parts.join(" ");
}
/**
 * Save context packet to file
 */
export function saveContextPacket(packet, aiDir) {
    const contextDir = path.join(aiDir, "context");
    // Ensure context directory exists
    if (!fs.existsSync(contextDir)) {
        fs.mkdirSync(contextDir, { recursive: true });
    }
    // Create safe filename from symbol ID
    const safeName = packet.symbol.id.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(contextDir, `${safeName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(packet, null, 2));
    return filePath;
}
/**
 * List all available context packets
 */
export function listContextPackets(aiDir) {
    const contextDir = path.join(aiDir, "context");
    if (!fs.existsSync(contextDir)) {
        return [];
    }
    return fs.readdirSync(contextDir)
        .filter(f => f.endsWith(".json"))
        .map(f => f.replace(".json", ""));
}
/**
 * Load a context packet from file
 */
export function loadContextPacket(symbolId, aiDir) {
    const safeName = symbolId.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(aiDir, "context", `${safeName}.json`);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=contextPacket.js.map