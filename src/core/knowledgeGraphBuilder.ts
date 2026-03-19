import fs from "fs";
import path from "path";
import { ensureDir, writeFile, readJsonFile } from "../utils/fileUtils.js";

export type NodeType = "feature" | "flow" | "file" | "symbol" | "commit";
export type EdgeType = "contains" | "implements" | "declares" | "references" | "modifies";

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeEdge {
  from: string;
  to: string;
  type: EdgeType;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  metadata: {
    generated: string;
    sources: string[];
    nodeCount: number;
    edgeCount: number;
  };
}

function loadFeatures(aiDir: string) {
  const featuresPath = path.join(aiDir, "context", "features");
  if (!fs.existsSync(featuresPath)) return [];
  const features: Array<{name: string; path: string; files: string[]}> = [];
  try {
    for (const file of fs.readdirSync(featuresPath)) {
      if (!file.endsWith(".json")) continue;
      const data = readJsonFile(path.join(featuresPath, file)) as {name?: unknown; path?: unknown; files?: unknown};
      if (data?.name && Array.isArray(data.files)) {
        features.push({ name: String(data.name), path: String(data.path || ""), files: data.files.map(String) });
      }
    }
  } catch { return []; }
  return features;
}

function loadFlows(aiDir: string) {
  const flowsPath = path.join(aiDir, "context", "flows");
  if (!fs.existsSync(flowsPath)) return [];
  const flows: Array<{name: string; entrypoint: string; files: string[]}> = [];
  try {
    for (const file of fs.readdirSync(flowsPath)) {
      if (!file.endsWith(".json")) continue;
      const data = readJsonFile(path.join(flowsPath, file)) as {name?: unknown; entrypoint?: unknown; files?: unknown};
      if (data?.name && Array.isArray(data.files)) {
        flows.push({ name: String(data.name), entrypoint: String(data.entrypoint || ""), files: data.files.map(String) });
      }
    }
  } catch { return []; }
  return flows;
}

function loadGitActivity(aiDir: string) {
  const gitPath = path.join(aiDir, "git", "commit-activity.json");
  if (!fs.existsSync(gitPath)) return null;
  try {
    const data = readJsonFile(gitPath) as {totalCommits?: unknown; files?: unknown};
    if (typeof data?.totalCommits === "number" && typeof data?.files === "object") {
      return { totalCommits: data.totalCommits, files: data.files as Record<string, number> };
    }
  } catch { return null; }
  return null;
}

function loadSymbols(aiDir: string) {
  const symbolsPath = path.join(aiDir, "symbols.json");
  if (!fs.existsSync(symbolsPath)) return [];
  try {
    const data = readJsonFile(symbolsPath);
    if (Array.isArray(data)) {
      return data.slice(0, 1000).map((s: unknown) => {
        const sym = s as {name?: unknown; file?: unknown; type?: unknown; references?: unknown};
        return { name: String(sym.name || ""), file: String(sym.file || ""), type: sym.type ? String(sym.type) : undefined, references: Array.isArray(sym.references) ? sym.references.map(String) : undefined };
      });
    }
  } catch { return []; }
  return [];
}

function loadFiles(aiDir: string) {
  const filesPath = path.join(aiDir, "files.json");
  if (!fs.existsSync(filesPath)) return [];
  try {
    const data = readJsonFile(filesPath);
    if (Array.isArray(data)) {
      return data.slice(0, 500).map((f: unknown) => typeof f === "string" ? f : (f as {path?: unknown})?.path ? String((f as {path: unknown}).path) : String(f));
    }
  } catch { return []; }
  return [];
}

export function createNodes(aiDir: string): KnowledgeNode[] {
  const nodes: KnowledgeNode[] = [];
  const nodeIds = new Set<string>();
  const addNode = (id: string, type: NodeType, label?: string, metadata?: Record<string, unknown>) => {
    if (nodeIds.has(id)) return;
    nodeIds.add(id);
    nodes.push({ id, type, label: label || id, metadata });
  };
  for (const f of loadFeatures(aiDir)) addNode(f.name, "feature", f.name, { path: f.path, fileCount: f.files.length });
  for (const f of loadFlows(aiDir)) addNode(f.name, "flow", f.name, { entrypoint: f.entrypoint, fileCount: f.files.length });
  for (const f of loadFiles(aiDir)) addNode(f, "file", path.basename(f));
  for (const s of loadSymbols(aiDir)) if (s.file && s.name) addNode(`${s.file}#${s.name}`, "symbol", s.name, { file: s.file, symbolType: s.type });
  const git = loadGitActivity(aiDir);
  if (git) {
    for (const file of Object.entries(git.files).sort((a, b) => b[1] - a[1]).slice(0, 50).map(x => x[0])) {
      addNode(`commit:${file}`, "commit", path.basename(file), { file, commitCount: git.files[file] });
    }
  }
  return nodes;
}

export function createEdges(aiDir: string): KnowledgeEdge[] {
  const edges: KnowledgeEdge[] = [];
  const edgeKeys = new Set<string>();
  const addEdge = (from: string, to: string, type: EdgeType) => {
    const key = `${from}|${to}|${type}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ from, to, type });
  };
  const features = loadFeatures(aiDir);
  const flows = loadFlows(aiDir);
  for (const flow of flows) {
    for (const feature of features) {
      const intersection = flow.files.filter(f => feature.files.includes(f));
      if (intersection.length > 0) addEdge(feature.name, flow.name, "contains");
    }
  }
  for (const flow of flows) for (const file of flow.files) addEdge(flow.name, file, "implements");
  for (const s of loadSymbols(aiDir)) if (s.file && s.name) addEdge(s.file, `${s.file}#${s.name}`, "declares");
  for (const s of loadSymbols(aiDir)) if (s.file && s.references) for (const ref of s.references) addEdge(`${s.file}#${s.name}`, ref, "references");
  const git = loadGitActivity(aiDir);
  if (git) for (const file of Object.keys(git.files)) addEdge(`commit:${file}`, file, "modifies");
  return edges;
}

export function buildKnowledgeGraph(rootDir: string, aiDir?: string): KnowledgeGraph {
  const targetAiDir = aiDir || path.join(rootDir, ".ai-dev");
  const graphDir = path.join(targetAiDir, "graph");
  ensureDir(graphDir);
  const nodes = createNodes(targetAiDir);
  const edges = createEdges(targetAiDir);
  const sources: string[] = [];
  if (fs.existsSync(path.join(targetAiDir, "context", "features"))) sources.push("features");
  if (fs.existsSync(path.join(targetAiDir, "context", "flows"))) sources.push("flows");
  if (fs.existsSync(path.join(targetAiDir, "git"))) sources.push("git");
  if (fs.existsSync(path.join(targetAiDir, "symbols.json"))) sources.push("symbols");
  if (fs.existsSync(path.join(targetAiDir, "dependencies.json"))) sources.push("dependencies");
  const graph: KnowledgeGraph = { nodes, edges, metadata: { generated: new Date().toISOString(), sources, nodeCount: nodes.length, edgeCount: edges.length } };
  writeFile(path.join(graphDir, "knowledge-graph.json"), JSON.stringify(graph, null, 2));
  return graph;
}

export function loadKnowledgeGraph(aiDir: string): KnowledgeGraph | null {
  const graphPath = path.join(aiDir, "graph", "knowledge-graph.json");
  if (!fs.existsSync(graphPath)) return null;
  try { return readJsonFile(graphPath) as unknown as KnowledgeGraph; } catch { return null; }
}

export function getNodesByType(graph: KnowledgeGraph, type: NodeType): KnowledgeNode[] { return graph.nodes.filter(n => n.type === type); }
export function getEdgesByType(graph: KnowledgeGraph, type: EdgeType): KnowledgeEdge[] { return graph.edges.filter(e => e.type === type); }
export function getNeighbors(graph: KnowledgeGraph, nodeId: string): KnowledgeNode[] {
  const neighborIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.from === nodeId) neighborIds.add(edge.to);
    if (edge.to === nodeId) neighborIds.add(edge.from);
  }
  return graph.nodes.filter(n => neighborIds.has(n.id));
}
