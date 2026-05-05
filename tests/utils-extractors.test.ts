import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

const EXPRESS_API_PATH = path.join(process.cwd(), "fixtures/express-api");
const DJANGO_APP_PATH = path.join(process.cwd(), "fixtures/django-app");

describe("Utility Extractors", () => {
  
  describe("projectSetupExtractor", () => {
    it("should extract project setup from express-api", async () => {
      const { extractProjectSetup } = await import("../src/utils/projectSetupExtractor.js");
      const setup = extractProjectSetup(EXPRESS_API_PATH);
      
      expect(setup).toBeDefined();
      expect(setup.installCommand).toBe("npm install");
      expect(setup.devCommand).toBeDefined();
      expect(setup.startCommand).toBeDefined();
    });

    it("should detect environment variables", async () => {
      const { extractProjectSetup } = await import("../src/utils/projectSetupExtractor.js");
      const setup = extractProjectSetup(EXPRESS_API_PATH);
      
      expect(setup.envVars).toBeDefined();
      expect(Array.isArray(setup.envVars)).toBe(true);
    });
  });

  describe("dependencyVersionExtractor", () => {
    it("should extract dependency versions from express-api", async () => {
      const { extractDependencyVersions } = await import("../src/utils/dependencyVersionExtractor.js");
      const deps = extractDependencyVersions(EXPRESS_API_PATH);
      
      expect(deps).toBeDefined();
      expect(Array.isArray(deps)).toBe(true);
      expect(deps.length).toBeGreaterThan(0);
      
      const express = deps.find(d => d.name === "express");
      expect(express).toBeDefined();
      expect(express?.version).toBeDefined();
      expect(express?.type).toBe("runtime");
    });

    it("should extract Python dependencies from requirements.txt", async () => {
      const { extractDependencyVersions } = await import("../src/utils/dependencyVersionExtractor.js");
      const deps = extractDependencyVersions(DJANGO_APP_PATH);
      
      expect(deps).toBeDefined();
      expect(Array.isArray(deps)).toBe(true);
    });
  });

  describe("testFileMapper", () => {
    it("should map test files to source files", async () => {
      const { mapTestFiles } = await import("../src/utils/testFileMapper.js");
      const mapping = mapTestFiles(EXPRESS_API_PATH);
      
      expect(mapping).toBeDefined();
      expect(Array.isArray(mapping)).toBe(true);
    });

    it("should include confidence, reason, and evidence for mapped tests", async () => {
      const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-test-mapping-"));
      try {
        fs.mkdirSync(path.join(rootDir, "src"), { recursive: true });
        fs.mkdirSync(path.join(rootDir, "tests"), { recursive: true });
        fs.writeFileSync(path.join(rootDir, "src", "authService.ts"), "export function login() { return true; }\n");
        fs.writeFileSync(path.join(rootDir, "tests", "authService.test.ts"), "import '../src/authService.js';\n");

        const { mapTestFiles } = await import("../src/utils/testFileMapper.js");
        const mapping = mapTestFiles(rootDir);
        const authMapping = mapping.find(item => item.sourceFile === path.join("src", "authService.ts"));

        expect(authMapping).toEqual(expect.objectContaining({
          testFiles: [path.join("tests", "authService.test.ts")],
          confidence: 0.92,
          reason: "test basename matches source basename",
        }));
        expect(authMapping?.evidence?.[0]).toContain("authService.ts");
      } finally {
        fs.rmSync(rootDir, { recursive: true, force: true });
      }
    });
  });

  describe("dataModelExtractor", () => {
    it("should extract data models from Django project", async () => {
      const { extractDataModels } = await import("../src/utils/dataModelExtractor.js");
      const models = extractDataModels(DJANGO_APP_PATH);
      
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      
      const postModel = models.find(m => m.name === "Post");
      expect(postModel).toBeDefined();
      expect(postModel?.framework).toBe("Django");
      expect(postModel?.fields.length).toBeGreaterThan(0);
    });

    it("should extract relationships", async () => {
      const { extractDataModels } = await import("../src/utils/dataModelExtractor.js");
      const models = extractDataModels(DJANGO_APP_PATH);
      
      const postModel = models.find(m => m.name === "Post");
      expect(postModel?.relationships).toBeDefined();
      expect(postModel?.relationships.length).toBeGreaterThan(0);
    });
  });

  describe("recentChangesExtractor", () => {
    it("should extract recent changes from git repo", async () => {
      const { extractRecentChanges } = await import("../src/utils/recentChangesExtractor.js");
      const changes = extractRecentChanges(process.cwd());
      
      expect(changes).toBeDefined();
      expect(changes.isGitRepo).toBe(true);
      expect(changes.lastCommit).toBeDefined();
      expect(changes.recentCommits).toBeDefined();
      expect(Array.isArray(changes.recentCommits)).toBe(true);
    });
  });

  describe("crossCuttingExtractor", () => {
    it("should detect cross-cutting concerns", async () => {
      const { extractCrossCuttingConcerns } = await import("../src/utils/crossCuttingExtractor.js");
      const concerns = extractCrossCuttingConcerns(EXPRESS_API_PATH);
      
      expect(concerns).toBeDefined();
      expect(concerns.auth).toBeDefined();
    });
  });

  describe("configAnalyzer", () => {
    it("should analyze configuration files", async () => {
      const { extractConfigAnalysis } = await import("../src/utils/configAnalyzer.js");
      const config = extractConfigAnalysis(process.cwd());
      
      expect(config).toBeDefined();
      expect(config.typescript).toBeDefined();
      expect(config.typescript?.strict).toBe(true);
    });
  });

  describe("gotchaExtractor", () => {
    it("should extract code gotchas", async () => {
      const { extractCodeGotchas } = await import("../src/utils/gotchaExtractor.js");
      const gotchas = extractCodeGotchas(process.cwd());
      
      expect(gotchas).toBeDefined();
      expect(gotchas.todos).toBeDefined();
      expect(Array.isArray(gotchas.todos)).toBe(true);
    });
  });
});
