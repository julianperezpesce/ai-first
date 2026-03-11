import { describe, it, expect, beforeEach } from "vitest";
import {
  buildMinimalIndex,
  expandFeatureContext,
  expandFlowContext,
  expandFullContext,
  getLazyIndexState,
  hasMinimalIndex,
  loadMinimalIndex,
  MinimalIndex,
  LazyIndexState
} from "../src/core/lazyAnalyzer.js";
import fs from "fs";
import path from "path";
import os from "os";

function createTempProjectDir(files: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-lazy-test-"));
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(tempDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content);
  }
  return tempDir;
}

describe("Lazy Analyzer", () => {
  describe("buildMinimalIndex", () => {
    it("should build minimal index with Stage 1 data", () => {
      const projectDir = createTempProjectDir({
        "package.json": '{"name": "test"}',
        "src/index.js": "export const hello = () => {}",
        "src/utils.js": "export const util = () => {}"
      });
      
      const aiDir = path.join(projectDir, "ai");
      fs.mkdirSync(aiDir, { recursive: true });
      
      const result = buildMinimalIndex(projectDir, aiDir);
      
      expect(result.languages).toBeDefined();
      expect(result.frameworks).toBeDefined();
      expect(result.entrypoints).toBeDefined();
      expect(result.repoMap).toBeDefined();
      expect(result.generatedAt).toBeDefined();
      
      // Check state file
      const state = getLazyIndexState(aiDir);
      expect(state?.stage1Complete).toBe(true);
      expect(state?.stage2Complete).toBe(false);
      
      // Check minimal index file
      expect(hasMinimalIndex(aiDir)).toBe(true);
      const minimal = loadMinimalIndex(aiDir);
      expect(minimal?.languages).toBeDefined();
    });

    it("should create minimal-index.json file", () => {
      const projectDir = createTempProjectDir({
        "package.json": '{"name": "test"}',
        "src/app.js": "const app = {}"
      });
      
      const aiDir = path.join(projectDir, "ai");
      fs.mkdirSync(aiDir, { recursive: true });
      
      buildMinimalIndex(projectDir, aiDir);
      
      const indexPath = path.join(aiDir, "minimal-index.json");
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const content = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
      expect(content.languages).toBeDefined();
    });
  });

  describe("expandFeatureContext", () => {
    it("should expand context for a specific feature", () => {
      const projectDir = createTempProjectDir({
        "package.json": '{"name": "test"}',
        "src/auth/login.js": "export const login = () => {}",
        "src/auth/logout.js": "export const logout = () => {}"
      });
      
      const aiDir = path.join(projectDir, "ai");
      fs.mkdirSync(aiDir, { recursive: true });
      
      // Build minimal first
      buildMinimalIndex(projectDir, aiDir);
      
      // Expand feature
      const result = expandFeatureContext(projectDir, aiDir, "auth");
      
      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      
      // Check state was updated
      const state = getLazyIndexState(aiDir);
      expect(state?.featuresExpanded).toContain("auth");
    });
  });

  describe("expandFlowContext", () => {
    it("should expand context for a specific flow", () => {
      const projectDir = createTempProjectDir({
        "package.json": '{"name": "test"}',
        "src/user.js": "import { auth } from './auth'",
        "src/auth.js": "export const auth = {}"
      });
      
      const aiDir = path.join(projectDir, "ai");
      fs.mkdirSync(aiDir, { recursive: true });
      
      // Build minimal first
      buildMinimalIndex(projectDir, aiDir);
      
      // Expand flow
      const result = expandFlowContext(projectDir, aiDir, "user");
      
      expect(result.success).toBe(true);
      
      // Check state was updated
      const state = getLazyIndexState(aiDir);
      expect(state?.flowsExpanded).toContain("user");
    });
  });

  describe("expandFullContext", () => {
    it("should expand all context (Stage 2)", () => {
      const projectDir = createTempProjectDir({
        "package.json": '{"name": "test"}',
        "src/index.js": "export const index = () => {}"
      });
      
      const aiDir = path.join(projectDir, "ai");
      fs.mkdirSync(aiDir, { recursive: true });
      
      buildMinimalIndex(projectDir, aiDir);
      
      const result = expandFullContext(projectDir, aiDir);
      
      expect(result.symbols).toBeDefined();
      expect(result.dependencies).toBeDefined();
      expect(result.features).toBeDefined();
      expect(result.flows).toBeDefined();
      
      // Check stage 2 is complete
      const state = getLazyIndexState(aiDir);
      expect(state?.stage2Complete).toBe(true);
    });
  });

  describe("getLazyIndexState", () => {
    it("should return null when no state exists", () => {
      const projectDir = createTempProjectDir({
        "package.json": "{}"
      });
      const aiDir = path.join(projectDir, "ai");
      
      const state = getLazyIndexState(aiDir);
      expect(state).toBeNull();
    });

    it("should return state when it exists", () => {
      const projectDir = createTempProjectDir({
        "package.json": "{}"
      });
      const aiDir = path.join(projectDir, "ai");
      fs.mkdirSync(aiDir, { recursive: true });
      
      buildMinimalIndex(projectDir, aiDir);
      
      const state = getLazyIndexState(aiDir);
      expect(state).not.toBeNull();
      expect(state?.stage1Complete).toBe(true);
    });
  });

  describe("hasMinimalIndex", () => {
    it("should return false when no minimal index exists", () => {
      const projectDir = createTempProjectDir({
        "package.json": "{}"
      });
      const aiDir = path.join(projectDir, "ai");
      
      expect(hasMinimalIndex(aiDir)).toBe(false);
    });

    it("should return true when minimal index exists", () => {
      const projectDir = createTempProjectDir({
        "package.json": "{}"
      });
      const aiDir = path.join(projectDir, "ai");
      fs.mkdirSync(aiDir, { recursive: true });
      
      buildMinimalIndex(projectDir, aiDir);
      
      expect(hasMinimalIndex(aiDir)).toBe(true);
    });
  });

  describe("loadMinimalIndex", () => {
    it("should return null when no minimal index exists", () => {
      const projectDir = createTempProjectDir({
        "package.json": "{}"
      });
      const aiDir = path.join(projectDir, "ai");
      
      const index = loadMinimalIndex(aiDir);
      expect(index).toBeNull();
    });

    it("should load minimal index when it exists", () => {
      const projectDir = createTempProjectDir({
        "package.json": "{}"
      });
      const aiDir = path.join(projectDir, "ai");
      fs.mkdirSync(aiDir, { recursive: true });
      
      buildMinimalIndex(projectDir, aiDir);
      
      const index = loadMinimalIndex(aiDir);
      expect(index).not.toBeNull();
      expect(index?.repoMap).toBeDefined();
    });
  });
});
