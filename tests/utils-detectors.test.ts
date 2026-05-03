import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const EXPRESS_API_PATH = path.join(process.cwd(), "fixtures/express-api");
const DJANGO_APP_PATH = path.join(process.cwd(), "fixtures/django-app");

describe("Utility Detectors", () => {
  
  describe("antiPatternDetector", () => {
    it("should detect anti-patterns", async () => {
      const { detectAntiPatterns } = await import("../src/utils/antiPatternDetector.js");
      const patterns = detectAntiPatterns(EXPRESS_API_PATH);
      
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe("securityAuditor", () => {
    it("should detect security issues", async () => {
      const { detectSecurityIssues } = await import("../src/utils/securityAuditor.js");
      const issues = detectSecurityIssues(EXPRESS_API_PATH);
      
      expect(issues).toBeDefined();
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe("performanceAnalyzer", () => {
    it("should detect performance issues", async () => {
      const { detectPerformanceIssues } = await import("../src/utils/performanceAnalyzer.js");
      const issues = detectPerformanceIssues(EXPRESS_API_PATH);
      
      expect(issues).toBeDefined();
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe("deadCodeDetector", () => {
    it("should detect dead code", async () => {
      const { detectDeadCode } = await import("../src/utils/deadCodeDetector.js");
      const deadCode = detectDeadCode(EXPRESS_API_PATH);
      
      expect(deadCode).toBeDefined();
      expect(deadCode.unusedFunctions).toBeDefined();
      expect(deadCode.unusedClasses).toBeDefined();
      expect(deadCode.unusedFiles).toBeDefined();
      expect(Array.isArray(deadCode.unusedFunctions)).toBe(true);
    });
  });

  describe("docCoverageAnalyzer", () => {
    it("should analyze documentation coverage", async () => {
      const { analyzeDocCoverage } = await import("../src/utils/docCoverageAnalyzer.js");
      const coverage = analyzeDocCoverage(EXPRESS_API_PATH);
      
      expect(coverage).toBeDefined();
      expect(coverage.totalFunctions).toBeDefined();
      expect(coverage.documentedFunctions).toBeDefined();
      expect(coverage.percentage).toBeDefined();
      expect(typeof coverage.percentage).toBe("number");
    });
  });

  describe("cicdDetector", () => {
    it("should detect CI/CD configuration", async () => {
      const { detectCICD } = await import("../src/utils/cicdDetector.js");
      const cicd = detectCICD(process.cwd());
      
      expect(cicd).toBeDefined();
      expect(cicd.platform).toBeDefined();
      expect(cicd.workflows).toBeDefined();
      expect(Array.isArray(cicd.workflows)).toBe(true);
    });
  });

  describe("migrationDetector", () => {
    it("should detect migrations", async () => {
      const { detectMigrations } = await import("../src/utils/migrationDetector.js");
      const migrations = detectMigrations(DJANGO_APP_PATH);
      
      expect(migrations).toBeDefined();
      expect(migrations.hasMigrations).toBeDefined();
      expect(typeof migrations.hasMigrations).toBe("boolean");
    });
  });

  describe("impactAnalyzer", () => {
    it("should analyze dependency impact", async () => {
      const { analyzeDependencyImpact } = await import("../src/utils/impactAnalyzer.js");
      const impact = analyzeDependencyImpact(EXPRESS_API_PATH);
      
      expect(impact).toBeDefined();
      expect(Array.isArray(impact)).toBe(true);
    });
  });

  describe("patternExtractor", () => {
    it("should extract code patterns", async () => {
      const { extractCodePatterns } = await import("../src/utils/patternExtractor.js");
      const patterns = extractCodePatterns(EXPRESS_API_PATH);
      
      expect(patterns).toBeDefined();
      expect(patterns.controllerPattern || patterns.servicePattern).toBeDefined();
    });
  });

  describe("contextDiff", () => {
    it("should generate context diff", async () => {
      const { generateContextDiff } = await import("../src/utils/contextDiff.js");
      const diff = generateContextDiff(path.join(EXPRESS_API_PATH, "ai-context"));
      
      expect(diff).toBeDefined();
      expect(diff.hasPreviousContext).toBeDefined();
      expect(typeof diff.hasPreviousContext).toBe("boolean");
    });
  });

  describe("taskContextGenerator", () => {
    it("should generate task-specific context", async () => {
      const { generateTaskContext } = await import("../src/utils/taskContextGenerator.js");
      const context = generateTaskContext(EXPRESS_API_PATH, "add-endpoint");
      
      expect(context).toBeDefined();
      expect(context.task).toBe("add-endpoint");
      expect(context.relevantFiles).toBeDefined();
      expect(Array.isArray(context.relevantFiles)).toBe(true);
      expect(context.suggestions).toBeDefined();
      expect(Array.isArray(context.suggestions)).toBe(true);
    });

    it("should detect endpoint-related files for add-endpoint task", async () => {
      const { generateTaskContext } = await import("../src/utils/taskContextGenerator.js");
      const context = generateTaskContext(EXPRESS_API_PATH, "add-endpoint");
      
      expect(context.relevantFiles.some(f => f.includes("controller"))).toBe(true);
    });
  });
});
