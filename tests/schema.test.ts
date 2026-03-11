import { describe, it, expect, beforeEach } from "vitest";
import {
  generateSchema,
  generateProject,
  generateTools,
  generateAllSchema,
  loadSchema,
  loadProject,
  loadTools,
  loadFullSchema,
  isCompatible,
  validateSchema,
  SCHEMA_VERSION,
  GENERATED_BY
} from "../src/core/schema.js";
import fs from "fs";
import path from "path";
import os from "os";

function createTempAiDir(): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-schema-test-"));
  const aiDir = path.join(tempDir, "ai");
  fs.mkdirSync(aiDir, { recursive: true });
  return aiDir;
}

describe("Schema System", () => {
  describe("generateSchema", () => {
    it("should generate schema.json with correct version", () => {
      const aiDir = createTempAiDir();
      const schema = generateSchema(aiDir);
      
      expect(schema.schemaVersion).toBe(SCHEMA_VERSION);
      expect(schema.generatedBy).toBe(GENERATED_BY);
      expect(schema.generatedAt).toBeDefined();
      
      // Verify file was created
      const schemaPath = path.join(aiDir, "schema.json");
      expect(fs.existsSync(schemaPath)).toBe(true);
      
      const loaded = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
      expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    });
  });

  describe("generateProject", () => {
    it("should generate project.json with project info", () => {
      const aiDir = createTempAiDir();
      const rootDir = "/test/project";
      
      const project = generateProject(rootDir, aiDir, {
        name: "test-project",
        features: ["auth", "users"],
        flows: ["login", "register"],
        languages: ["TypeScript"],
        frameworks: ["Express"]
      });
      
      expect(project.name).toBe("test-project");
      expect(project.rootDir).toBe(rootDir);
      expect(project.features).toEqual(["auth", "users"]);
      expect(project.flows).toEqual(["login", "register"]);
      expect(project.languages).toEqual(["TypeScript"]);
      expect(project.frameworks).toEqual(["Express"]);
      expect(project.generatedAt).toBeDefined();
      
      const projectPath = path.join(aiDir, "project.json");
      expect(fs.existsSync(projectPath)).toBe(true);
    });

    it("should auto-detect features from context directory", () => {
      const aiDir = createTempAiDir();
      const rootDir = "/test/project";
      
      // Create features directory with files
      const featuresDir = path.join(aiDir, "context", "features");
      fs.mkdirSync(featuresDir, { recursive: true });
      fs.writeFileSync(path.join(featuresDir, "auth.json"), "{}");
      fs.writeFileSync(path.join(featuresDir, "users.json"), "{}");
      
      const project = generateProject(rootDir, aiDir);
      expect(project.features).toContain("auth");
      expect(project.features).toContain("users");
    });
  });

  describe("generateTools", () => {
    it("should generate tools.json with compatible agents", () => {
      const aiDir = createTempAiDir();
      const tools = generateTools(aiDir);
      
      expect(tools.compatibleAgents).toContain("opencode");
      expect(tools.compatibleAgents).toContain("cursor");
      expect(tools.schemaVersion).toBe(SCHEMA_VERSION);
      
      const toolsPath = path.join(aiDir, "tools.json");
      expect(fs.existsSync(toolsPath)).toBe(true);
    });
  });

  describe("generateAllSchema", () => {
    it("should generate all schema files at once", () => {
      const aiDir = createTempAiDir();
      const rootDir = "/test/project";
      
      const result = generateAllSchema(rootDir, aiDir, {
        projectName: "full-test"
      });
      
      expect(result.schema).toBeDefined();
      expect(result.project).toBeDefined();
      expect(result.tools).toBeDefined();
      
      expect(fs.existsSync(path.join(aiDir, "schema.json"))).toBe(true);
      expect(fs.existsSync(path.join(aiDir, "project.json"))).toBe(true);
      expect(fs.existsSync(path.join(aiDir, "tools.json"))).toBe(true);
    });
  });

  describe("loadSchema", () => {
    it("should load schema from existing file", () => {
      const aiDir = createTempAiDir();
      generateSchema(aiDir);
      
      const loaded = loadSchema(aiDir);
      expect(loaded).not.toBeNull();
      expect(loaded?.schemaVersion).toBe(SCHEMA_VERSION);
    });

    it("should return null for missing schema", () => {
      const aiDir = createTempAiDir();
      const loaded = loadSchema(aiDir);
      expect(loaded).toBeNull();
    });
  });

  describe("loadFullSchema", () => {
    it("should load all schema files", () => {
      const aiDir = createTempAiDir();
      generateAllSchema("/test", aiDir);
      
      const full = loadFullSchema(aiDir);
      expect(full).not.toBeNull();
      expect(full?.schema).toBeDefined();
      expect(full?.project).toBeDefined();
      expect(full?.tools).toBeDefined();
    });

    it("should return null if any file is missing", () => {
      const aiDir = createTempAiDir();
      generateSchema(aiDir);
      
      const full = loadFullSchema(aiDir);
      expect(full).toBeNull();
    });
  });

  describe("isCompatible", () => {
    it("should return true for same major version", () => {
      expect(isCompatible("1.0")).toBe(true);
      expect(isCompatible("1.5")).toBe(true);
    });

    it("should return false for different major version", () => {
      expect(isCompatible("2.0")).toBe(false);
      expect(isCompatible("0.9")).toBe(false);
    });
  });

  describe("validateSchema", () => {
    it("should validate complete schema", () => {
      const aiDir = createTempAiDir();
      generateAllSchema("/test", aiDir);
      
      const result = validateSchema(aiDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing files", () => {
      const aiDir = createTempAiDir();
      
      const result = validateSchema(aiDir);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should detect incompatible version", () => {
      const aiDir = createTempAiDir();
      generateAllSchema("/test", aiDir);
      
      // Manually write incompatible version
      const schemaPath = path.join(aiDir, "schema.json");
      const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
      schema.schemaVersion = "99.0.0";
      fs.writeFileSync(schemaPath, JSON.stringify(schema));
      
      const result = validateSchema(aiDir);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Incompatible"))).toBe(true);
    });
  });
});
