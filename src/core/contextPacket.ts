import fs from "fs";
import path from "path";
import { 
  loadSymbolGraph, 
  loadSymbolReferences, 
  loadFileIndex, 
  SymbolRelationship, 
  SymbolReferences, 
  FileIndex 
} from "./symbolGraph.js";
import { readFile } from "../utils/fileUtils.js";

export type OutputFormat = "json" | "markdown" | "text";

export interface CodeContextPacket {
  // Symbol metadata
  symbol: {
    id: string;
    name: string;
    type: string;
    file: string;
    line?: number;
    export?: boolean;
    module?: string;
  };
  
  // Source code
  snippet: string;
  fullSource?: string;
  
  // Relationships
  relationships: {
    calls: string[];
    calledBy: string[];
    imports: string[];
    references: string[];
    instantiates?: string[];
    extends?: string[];
    implements?: string[];
    exports?: string[];
  };
  
  // Related symbols
  relatedSymbols: {
    id: string;
    name: string;
    type: string;
    file: string;
    line?: number;
    distance: number;  // Graph distance
  }[];
  
  // Callers (reverse references)
  callers: string[];
  
  // Module info
  module: string;
  file: string;
  
  // File neighbors
  fileNeighbors: {
    file: string;
    symbols: string[];
    relationship: string;
  }[];
  
  // Summary
  summary: string;
  
  // Ranking score
  relevanceScore?: number;
}

/**
 * Generate context packet for a specific symbol with depth and ranking
 */
export function generateContextPacket(
  symbolName: string,
  aiDir: string,
  rootDir: string,
  options: {
    depth?: number;
    format?: OutputFormat;
    maxSymbols?: number;
  } = {}
): CodeContextPacket | null {
  const { depth = 1, format = "json", maxSymbols = 50 } = options;

  const graph = loadSymbolGraph(aiDir);
  const refs = loadSymbolReferences(aiDir);
  const fileIndex = loadFileIndex(aiDir);
  
  if (!graph) {
    console.error("Symbol graph not found. Run 'ai-first map' first.");
    return null;
  }

  // Find the symbol
  let symbol = graph.symbols.find(s => 
    s.id === symbolName || 
    s.id.endsWith(`#${symbolName}`) ||
    s.name === symbolName
  );

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
  
  // Organize relationships by type
  const relsByType = organizeRelationships(relationships);
  
  // Get related symbols with depth
  const relatedSymbols = getRelatedSymbols(graph, symbol.id, depth, maxSymbols);
  
  // Get callers (reverse references)
  const callers = refs?.[symbol.id] || [];
  
  // Get file neighbors
  const fileNeighbors = getFileNeighbors(symbol.file, fileIndex, graph);
  
  // Get source code
  const { snippet, fullSource } = getSourceCode(symbol.file, symbol.line, rootDir);
  
  // Calculate relevance score
  const relevanceScore = calculateRelevance(symbol, relationships, callers, relatedSymbols);
  
  // Generate summary
  const summary = generateSummary(symbol, relsByType, callers.length, relatedSymbols.length);

  const module = symbol.file.split('/')[0];

  const packet: CodeContextPacket = {
    symbol: {
      id: symbol.id,
      name: symbol.name,
      type: symbol.type,
      file: symbol.file,
      line: symbol.line,
      export: symbol.export,
      module,
    },
    snippet,
    fullSource,
    relationships: {
      calls: relsByType.calls,
      calledBy: relsByType.calledBy,
      imports: relsByType.imports,
      references: relsByType.references,
      instantiates: relsByType.instantiates,
      extends: relsByType.extends,
      implements: relsByType.implements,
      exports: relsByType.exports,
    },
    relatedSymbols: relatedSymbols.slice(0, maxSymbols),
    callers,
    module,
    file: symbol.file,
    fileNeighbors,
    summary,
    relevanceScore,
  };

  // Format output
  if (format === "markdown") {
    return formatAsMarkdown(packet) as unknown as CodeContextPacket;
  } else if (format === "text") {
    return formatAsText(packet) as unknown as CodeContextPacket;
  }

  return packet;
}

/**
 * Organize relationships by type
 */
function organizeRelationships(relationships: SymbolRelationship[]): Record<string, string[]> {
  const result: Record<string, string[]> = {
    calls: [],
    calledBy: [],
    imports: [],
    references: [],
    instantiates: [],
    extends: [],
    implements: [],
    exports: [],
  };

  for (const rel of relationships) {
    if (result[rel.type]) {
      result[rel.type].push(rel.targetId);
    }
  }

  return result;
}

/**
 * Get related symbols with depth
 */
function getRelatedSymbols(
  graph: { symbols: any[]; bySymbol: Record<string, SymbolRelationship[]> },
  symbolId: string,
  depth: number,
  maxSymbols: number
): { id: string; name: string; type: string; file: string; line?: number; distance: number }[] {
  const related: Map<string, number> = new Map();
  const visited = new Set<string>();
  
  // BFS to find related symbols up to depth
  const queue: { id: string; distance: number }[] = [{ id: symbolId, distance: 0 }];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.distance > depth || visited.has(current.id)) continue;
    visited.add(current.id);
    
    const relationships = graph.bySymbol[current.id] || [];
    
    for (const rel of relationships) {
      if (rel.symbolId === rel.targetId) continue;  // Skip self
      
      if (!related.has(rel.targetId) || related.get(rel.targetId)! > current.distance + 1) {
        related.set(rel.targetId, current.distance + 1);
      }
      
      if (current.distance < depth) {
        queue.push({ id: rel.targetId, distance: current.distance + 1 });
      }
    }
  }

  // Convert to array with symbol info
  const result = [];
  for (const [id, distance] of related) {
    const sym = graph.symbols.find(s => s.id === id);
    if (sym) {
      result.push({
        id: sym.id,
        name: sym.name,
        type: sym.type,
        file: sym.file,
        line: sym.line,
        distance,
      });
    }
  }

  // Sort by distance
  result.sort((a, b) => a.distance - b.distance);
  
  return result;
}

/**
 * Get file neighbors (other files in same module or related modules)
 */
function getFileNeighbors(
  filePath: string,
  fileIndex: FileIndex | null,
  graph: { symbols: any[] }
): { file: string; symbols: string[]; relationship: string }[] {
  if (!fileIndex) return [];
  
  const neighbors: { file: string; symbols: string[]; relationship: string }[] = [];
  const module = filePath.split('/')[0];
  
  // Find files in same module
  for (const [otherFile, data] of Object.entries(fileIndex)) {
    if (otherFile === filePath) continue;
    
    if (data.module === module) {
      neighbors.push({
        file: otherFile,
        symbols: data.symbols,
        relationship: "same-module",
      });
    }
  }

  return neighbors.slice(0, 10);  // Limit to 10 neighbors
}

/**
 * Get source code snippet
 */
function getSourceCode(filePath: string, lineNum?: number, rootDir?: string): { snippet: string; fullSource?: string } {
  let fullSource = "";
  let snippet = "";
  
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(rootDir || "", filePath);
    if (fs.existsSync(fullPath)) {
      fullSource = readFile(fullPath);
      const lines = fullSource.split("\n");
      
      if (lineNum) {
        // Get context around the symbol
        const startLine = Math.max(0, lineNum - 10);
        const endLine = Math.min(lines.length, lineNum + 10);
        snippet = lines.slice(startLine, endLine).map((line, i) => 
          `${startLine + i + 1}: ${line}`
        ).join("\n");
      } else {
        // Return first 50 lines
        snippet = lines.slice(0, 50).join("\n");
      }
    }
  } catch {
    snippet = "[Source code not available]";
  }
  
  return { snippet, fullSource };
}

/**
 * Calculate relevance score
 */
function calculateRelevance(
  symbol: { id: string; type: string },
  relationships: SymbolRelationship[],
  callers: string[],
  relatedSymbols: { distance: number }[]
): number {
  let score = 0;
  
  // Base score for exported symbols
  if (symbol.type === "export") score += 10;
  
  // More callers = higher score
  score += callers.length * 5;
  
  // More relationships = higher score
  score += relationships.length * 2;
  
  // Closer related symbols = higher score
  for (const rel of relatedSymbols) {
    score += Math.max(0, 10 - rel.distance);
  }
  
  return Math.round(score);
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  symbol: { id: string; type: string; name: string },
  relsByType: Record<string, string[]>,
  callersCount: number,
  relatedCount: number
): string {
  const parts: string[] = [];
  
  parts.push(`**${symbol.name}** (${symbol.type}) defined as \`${symbol.id}\`.`);
  
  if (relsByType.calls.length > 0) {
    parts.push(`Calls ${relsByType.calls.length} symbol${relsByType.calls.length > 1 ? 's' : ''}.`);
  }
  
  if (callersCount > 0) {
    parts.push(`Called by ${callersCount} symbol${callersCount > 1 ? 's' : ''}.`);
  }
  
  if (relsByType.imports.length > 0) {
    parts.push(`Imports ${relsByType.imports.length} module${relsByType.imports.length > 1 ? 's' : ''}.`);
  }
  
  if (relsByType.instantiates?.length) {
    parts.push(`Instantiates ${relsByType.instantiates.length} class${relsByType.instantiates.length > 1 ? 'es' : ''}.`);
  }
  
  if (relsByType.extends?.length) {
    parts.push(`Extends ${relsByType.extends.length} class.`);
  }
  
  if (relsByType.implements?.length) {
    parts.push(`Implements ${relsByType.implements.length} interface.`);
  }
  
  if (relatedCount > 0) {
    parts.push(`${relatedCount} related symbols in graph.`);
  }
  
  return parts.join(" ");
}

/**
 * Format as markdown
 */
function formatAsMarkdown(packet: CodeContextPacket): string {
  let md = `# ${packet.symbol.name}\n\n`;
  md += `**Type:** ${packet.symbol.type} | **Module:** ${packet.module} | **File:** ${packet.symbol.file}:${packet.symbol.line || '?'}\n\n`;
  md += `**Relevance Score:** ${packet.relevanceScore || 0}\n\n`;
  md += `---\n\n`;
  md += `## Summary\n\n${packet.summary}\n\n`;
  md += `---\n\n`;
  md += `## Source Code\n\n\`\`\`\n${packet.snippet}\n\`\`\`\n\n`;
  
  if (packet.relationships.calls.length > 0) {
    md += `---\n\n## Calls\n\n`;
    for (const call of packet.relationships.calls) {
      md += `- ${call}\n`;
    }
    md += "\n";
  }
  
  if (packet.callers.length > 0) {
    md += `---\n\n## Called By\n\n`;
    for (const caller of packet.callers) {
      md += `- ${caller}\n`;
    }
    md += "\n";
  }
  
  if (packet.relatedSymbols.length > 0) {
    md += `---\n\n## Related Symbols\n\n`;
    for (const sym of packet.relatedSymbols.slice(0, 20)) {
      md += `- ${sym.id} (${sym.type}, distance: ${sym.distance})\n`;
    }
    md += "\n";
  }
  
  return md;
}

/**
 * Format as plain text
 */
function formatAsText(packet: CodeContextPacket): string {
  let text = `${packet.symbol.name} (${packet.symbol.type})\n`;
  text += `${"=".repeat(packet.symbol.name.length + 4)}\n\n`;
  text += `ID: ${packet.symbol.id}\n`;
  text += `File: ${packet.symbol.file}:${packet.symbol.line || '?'}\n`;
  text += `Module: ${packet.module}\n`;
  text += `Score: ${packet.relevanceScore || 0}\n\n`;
  text += `SUMMARY: ${packet.summary}\n\n`;
  text += `SOURCE:\n${packet.snippet}\n`;
  
  return text;
}

/**
 * Save context packet to file
 */
export function saveContextPacket(
  packet: CodeContextPacket,
  aiDir: string,
  format: OutputFormat = "json"
): string {
  const contextDir = path.join(aiDir, "context");
  
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  const safeName = packet.symbol.id.replace(/[^a-zA-Z0-9.#_-]/g, "_");
  const ext = format === "markdown" ? "md" : format === "text" ? "txt" : "json";
  const filePath = path.join(contextDir, `${safeName}.${ext}`);
  
  let content: string;
  if (format === "markdown") {
    content = formatAsMarkdown(packet);
  } else if (format === "text") {
    content = formatAsText(packet);
  } else {
    content = JSON.stringify(packet, null, 2);
  }
  
  fs.writeFileSync(filePath, content);
  
  return filePath;
}

/**
 * List all available context packets
 */
export function listContextPackets(aiDir: string): string[] {
  const contextDir = path.join(aiDir, "context");
  
  if (!fs.existsSync(contextDir)) {
    return [];
  }
  
  return fs.readdirSync(contextDir)
    .filter(f => f.endsWith(".json") || f.endsWith(".md") || f.endsWith(".txt"))
    .map(f => f.replace(/\.(json|md|txt)$/, ""));
}

/**
 * Load a context packet from file
 */
export function loadContextPacket(symbolId: string, aiDir: string): CodeContextPacket | null {
  const safeName = symbolId.replace(/[^a-zA-Z0-9.#_-]/g, "_");
  const filePath = path.join(aiDir, "context", `${safeName}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}
