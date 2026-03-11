import { describe, it, expect } from "vitest";
import {
  detectChangedFiles,
  updateFeatures,
  updateFlows,
  updateKnowledgeGraph,
  runIncrementalUpdate,
  ChangedFile
} from "../src/core/incrementalAnalyzer.js";
import fs from "fs";
import path from "path";
import os from "os";

describe("Incremental Analyzer", () => {
  const testRoot = process.cwd();

  describe("detectChangedFiles", () => {
    it("should detect changes in git repository", () => {
      const changes = detectChangedFiles(testRoot);
      expect(Array.isArray(changes)).toBe(true);
    });

    it("should return empty array for non-git with no state", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-incr-test-"));
      const changes = detectChangedFiles(tempDir, false);
      expect(changes).toEqual([]);
      fs.rmSync(tempDir, { recursive: true });
    });
  });

  describe("runIncrementalUpdate", () => {
    it("should return error for non-existent ai directory", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-incr-test-"));
      const result = runIncrementalUpdate(tempDir);
      expect(result.errors.length).toBeGreaterThan(0);
      fs.rmSync(tempDir, { recursive: true });
    });

    it("should handle changes gracefully", () => {
      const aiDir = path.join(testRoot, "ai");
      const result = runIncrementalUpdate(testRoot, aiDir);
      expect(result).toHaveProperty("changedFiles");
      expect(result).toHaveProperty("updatedSymbols");
      expect(result).toHaveProperty("graphUpdated");
    });
  });

  describe("updateKnowledgeGraph", () => {
    it("should update knowledge graph", () => {
      const aiDir = path.join(testRoot, "ai");
      const updated = updateKnowledgeGraph(testRoot, aiDir);
      expect(typeof updated).toBe("boolean");
    });
  });

  describe("updateFeatures", () => {
    it("should return empty array when no features dir", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-incr-test-"));
      const aiDir = path.join(tempDir, "ai");
      fs.mkdirSync(path.join(aiDir, "context"), { recursive: true });
      
      const changes: ChangedFile[] = [];
      const result = updateFeatures(tempDir, changes, aiDir);
      expect(result).toEqual([]);
      
      fs.rmSync(tempDir, { recursive: true });
    });
  });

  describe("updateFlows", () => {
    it("should return empty array when no flows dir", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-incr-test-"));
      const aiDir = path.join(tempDir, "ai");
      fs.mkdirSync(path.join(aiDir, "context"), { recursive: true });
      
      const changes: ChangedFile[] = [];
      const result = updateFlows(tempDir, changes, aiDir);
      expect(result).toEqual([]);
      
      fs.rmSync(tempDir, { recursive: true });
    });
  });
});
