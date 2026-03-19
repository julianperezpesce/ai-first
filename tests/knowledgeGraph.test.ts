import { describe, it, expect } from "vitest";
import {
  createNodes,
  createEdges,
  buildKnowledgeGraph,
  loadKnowledgeGraph,
  getNodesByType,
  getEdgesByType,
  getNeighbors
} from "../src/core/knowledgeGraphBuilder.js";
import fs from "fs";
import path from "path";
import os from "os";

describe("Knowledge Graph Builder", () => {
  const testRoot = process.cwd();
  const testAiDir = path.join(testRoot, "ai-context");

  describe("createNodes", () => {
    it("should create nodes from ai directory", () => {
      const nodes = createNodes(testAiDir);
      expect(nodes.length).toBeGreaterThan(0);
      expect(nodes[0]).toHaveProperty("id");
      expect(nodes[0]).toHaveProperty("type");
    });
  });

  describe("createEdges", () => {
    it("should create edges from ai directory", () => {
      const edges = createEdges(testAiDir);
      expect(edges.length).toBeGreaterThan(0);
      expect(edges[0]).toHaveProperty("from");
      expect(edges[0]).toHaveProperty("to");
      expect(edges[0]).toHaveProperty("type");
    });

    it("should create valid edge types", () => {
      const edges = createEdges(testAiDir);
      const validTypes = ["contains", "implements", "declares", "references", "modifies"];
      for (const edge of edges) {
        expect(validTypes).toContain(edge.type);
      }
    });
  });

  describe("buildKnowledgeGraph", () => {
    it("should build and save knowledge graph with data", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-graph-test-"));
      const aiDir = path.join(tempDir, "ai");
      fs.mkdirSync(path.join(aiDir, "graph"), { recursive: true });
      fs.mkdirSync(path.join(aiDir, "git"), { recursive: true });
      
      fs.writeFileSync(path.join(aiDir, "git", "commit-activity.json"), JSON.stringify({
        totalCommits: 10,
        dateRange: { start: "2026-01-01", end: "2026-03-11" },
        files: { "src/test.ts": 5, "src/index.ts": 3 }
      }));
      
      fs.writeFileSync(path.join(aiDir, "files.json"), JSON.stringify(["src/test.ts", "src/index.ts"]));
      
      const graph = buildKnowledgeGraph(tempDir, aiDir);
      
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);
      expect(graph.metadata).toHaveProperty("generated");
      expect(graph.metadata).toHaveProperty("sources");
      expect(graph.metadata).toHaveProperty("nodeCount");
      expect(graph.metadata).toHaveProperty("edgeCount");
      
      expect(fs.existsSync(path.join(aiDir, "graph", "knowledge-graph.json"))).toBe(true);
      
      fs.rmSync(tempDir, { recursive: true });
    });
  });

  describe("loadKnowledgeGraph", () => {
    it("should load existing knowledge graph", () => {
      const graph = loadKnowledgeGraph(testAiDir);
      if (graph) {
        expect(graph.nodes).toBeDefined();
        expect(graph.edges).toBeDefined();
        expect(graph.metadata).toBeDefined();
      }
    });

    it("should return null for non-existent graph", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-graph-test-"));
      const aiDir = path.join(tempDir, "ai");
      
      const graph = loadKnowledgeGraph(aiDir);
      expect(graph).toBeNull();
      
      fs.rmSync(tempDir, { recursive: true });
    });
  });

  describe("getNodesByType", () => {
    it("should filter nodes by type", () => {
      const graph = loadKnowledgeGraph(testAiDir);
      if (graph) {
        const commitNodes = getNodesByType(graph, "commit");
        for (const node of commitNodes) {
          expect(node.type).toBe("commit");
        }
      }
    });
  });

  describe("getEdgesByType", () => {
    it("should filter edges by type", () => {
      const graph = loadKnowledgeGraph(testAiDir);
      if (graph) {
        const modifiesEdges = getEdgesByType(graph, "modifies");
        for (const edge of modifiesEdges) {
          expect(edge.type).toBe("modifies");
        }
      }
    });
  });

  describe("getNeighbors", () => {
    it("should find neighboring nodes", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-graph-test-"));
      const aiDir = path.join(tempDir, "ai");
      fs.mkdirSync(path.join(aiDir, "graph"), { recursive: true });
      fs.mkdirSync(path.join(aiDir, "git"), { recursive: true });
      
      fs.writeFileSync(path.join(aiDir, "git", "commit-activity.json"), JSON.stringify({
        totalCommits: 10,
        dateRange: { start: "2026-01-01", end: "2026-03-11" },
        files: { "src/test.ts": 5 }
      }));
      fs.writeFileSync(path.join(aiDir, "files.json"), JSON.stringify(["src/test.ts"]));
      
      const graph = buildKnowledgeGraph(tempDir, aiDir);
      
      if (graph.nodes.length > 0) {
        const firstNode = graph.nodes[0].id;
        const neighbors = getNeighbors(graph, firstNode);
        expect(Array.isArray(neighbors)).toBe(true);
      }
      
      fs.rmSync(tempDir, { recursive: true });
    });
  });
});
