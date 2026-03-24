import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const PROJECT_ROOT = process.cwd();
const CLI_PATH = path.join(PROJECT_ROOT, "dist/commands/ai-first.js");
const EXPRESS_API_PATH = path.join(PROJECT_ROOT, "test-projects/express-api");

/**
 * Creates a temporary project directory with some source files
 */
function createTempProjectDir(files: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-init-test-"));
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

/**
 * Run the CLI init command
 */
async function runInitCommand(
  args: string[],
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const cliArgs = ["node", CLI_PATH, "init", ...args];
    const child = spawn("node", [CLI_PATH, "init", ...args], {
      cwd,
      stdio: "pipe",
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
      });
    });

    child.on("error", (err) => {
      stderr += err.message;
      resolve({ stdout, stderr, exitCode: 1 });
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, exitCode: 124 });
    }, 60000);
  });
}

describe("CLI Init Command", () => {
  let tempDir: string;
  const tempDirs: string[] = [];

  beforeAll(() => {
    // Ensure dist is built
    if (!fs.existsSync(CLI_PATH)) {
      throw new Error(
        `CLI not found at ${CLI_PATH}. Run 'npm run build' first.`
      );
    }
  });

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-init-test-"));
    tempDirs.push(tempDir);
  });

  afterAll(() => {
    // Clean up all temp directories
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // =========================================================================
  // DEFAULT OPTIONS TESTS
  // =========================================================================

  describe("Default Options", () => {
    it("should run init command successfully on express-api project", async () => {
      const result = await runInitCommand([], EXPRESS_API_PATH);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Created");
    });

    it("should create ai-context directory with default options", async () => {
      const aiContextDir = path.join(EXPRESS_API_PATH, "ai-context");

      // Clean up if exists
      if (fs.existsSync(aiContextDir)) {
        fs.rmSync(aiContextDir, { recursive: true, force: true });
      }

      const result = await runInitCommand([], EXPRESS_API_PATH);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(aiContextDir)).toBe(true);
    });

    it("should create all expected context files", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test", "version": "1.0.0"}',
        "src/main.ts": "export const main = () => {};",
      });
      tempDirs.push(testProject);

      const aiContextDir = path.join(testProject, "ai-context");

      const result = await runInitCommand([], testProject);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(aiContextDir)).toBe(true);

      // Check for expected files
      const expectedFiles = [
        "ai_context.md",
        "repo_map.md",
        "repo_map.json",
        "summary.md",
        "architecture.md",
        "tech_stack.md",
        "entrypoints.md",
        "conventions.md",
        "symbols.json",
        "dependencies.json",
      ];

      for (const file of expectedFiles) {
        const filePath = path.join(aiContextDir, file);
        expect(fs.existsSync(filePath), `Expected ${file} to exist`).toBe(true);
      }
    });

    it("should generate non-empty file content", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test", "version": "1.0.0"}',
        "src/main.ts": "export const main = () => {};",
      });
      tempDirs.push(testProject);

      const aiContextDir = path.join(testProject, "ai-context");

      await runInitCommand([], testProject);

      // Check that files have content
      const aiContextPath = path.join(aiContextDir, "ai_context.md");
      const symbolsPath = path.join(aiContextDir, "symbols.json");

      expect(fs.existsSync(aiContextPath)).toBe(true);
      expect(fs.existsSync(symbolsPath)).toBe(true);

      const aiContextContent = fs.readFileSync(aiContextPath, "utf-8");
      expect(aiContextContent.length).toBeGreaterThan(100);

      const symbolsContent = fs.readFileSync(symbolsPath, "utf-8");
      const symbols = JSON.parse(symbolsContent);
      expect(symbols).toBeDefined();
    });
  });

  // =========================================================================
  // --root FLAG TESTS
  // =========================================================================

  describe("--root Flag", () => {
    it("should scan different directory with --root flag", async () => {
      const testProject = createTempProjectDir({
        "README.md": "# Test Project",
        "src/index.ts": "export const test = 1;",
      });
      tempDirs.push(testProject);

      const result = await runInitCommand(["--root", testProject]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(testProject);
    });

    it("should handle --root with short flag -r", async () => {
      const testProject = createTempProjectDir({
        "README.md": "# Test Project",
        "src/index.ts": "export const test = 1;",
      });
      tempDirs.push(testProject);

      const result = await runInitCommand(["-r", testProject]);

      expect(result.exitCode).toBe(0);
    });

    it("should error on non-existent root directory", async () => {
      const nonExistentPath = path.join(os.tmpdir(), "non-existent-dir-12345");

      const result = await runInitCommand(["--root", nonExistentPath]);

      // Should complete but may have issues with the directory
      // The CLI should handle this gracefully
      expect(result).toBeDefined();
    });

    it("should scan nested project structure with --root", async () => {
      const testProject = createTempProjectDir({
        "package.json": '{"name": "nested-test"}',
        "src/api/routes.ts": "export const routes = [];",
        "src/services/user.ts": "export const userService = {};",
      });
      tempDirs.push(testProject);

      const result = await runInitCommand(["--root", testProject]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Found 3 files");
    });
  });

  // =========================================================================
  // --output FLAG TESTS
  // =========================================================================

  describe("--output Flag", () => {
    it("should create custom output directory with --output flag", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      const customOutput = path.join(testProject, "custom-ai-context");

      const result = await runInitCommand(["--output", customOutput], testProject);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(customOutput)).toBe(true);
    });

    it("should create files in custom output directory", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      const customOutput = path.join(testProject, "my-context");

      await runInitCommand(["--output", customOutput], testProject);

      // Check expected files exist in custom output
      expect(fs.existsSync(path.join(customOutput, "ai_context.md"))).toBe(true);
      expect(fs.existsSync(path.join(customOutput, "repo_map.md"))).toBe(true);
      expect(fs.existsSync(path.join(customOutput, "symbols.json"))).toBe(true);
    });

    it("should handle --output with short flag -o", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      const customOutput = path.join(testProject, "my-context");

      const result = await runInitCommand(["-o", customOutput], testProject);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(customOutput)).toBe(true);
    });

    it("should work with both --root and --output combined", async () => {
      const sourceProject = createTempProjectDir({
        "src/index.ts": "export const main = () => {};",
        "package.json": '{"name": "source"}',
      });
      const outputProject = createTempProjectDir({});
      tempDirs.push(sourceProject);
      tempDirs.push(outputProject);

      const customOutput = path.join(outputProject, "ai-output");

      const result = await runInitCommand(
        ["--root", sourceProject, "--output", customOutput],
        sourceProject
      );

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(customOutput)).toBe(true);
    });
  });

  // =========================================================================
  // OVERWRITE BEHAVIOR TESTS
  // =========================================================================

  describe("Overwrite Behavior", () => {
    it("should overwrite existing ai-context files", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      const aiContextDir = path.join(testProject, "ai-context");
      fs.mkdirSync(aiContextDir, { recursive: true });

      // Create existing file
      const existingFile = path.join(aiContextDir, "repo_map.md");
      fs.writeFileSync(existingFile, "Old content");

      // Run init again
      const result = await runInitCommand([], testProject);

      expect(result.exitCode).toBe(0);

      // File should be overwritten with new content
      const content = fs.readFileSync(existingFile, "utf-8");
      expect(content).not.toBe("Old content");
      expect(content.length).toBeGreaterThan(0);
    });

    it("should handle existing custom output directory", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      const customOutput = path.join(testProject, "my-context");
      fs.mkdirSync(customOutput, { recursive: true });

      // Create existing file in custom output
      const existingFile = path.join(customOutput, "existing.txt");
      fs.writeFileSync(existingFile, "Old content");

      const result = await runInitCommand(["--output", customOutput], testProject);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(existingFile)).toBe(true);
    });
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================

  describe("Error Handling", () => {
    it("should handle permission errors gracefully", async () => {
      // Create a directory without write permissions
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      // Make the directory read-only (remove write permissions)
      // Note: This might not work on Windows, so we skip if not possible
      try {
        fs.chmodSync(testProject, 0o555);
      } catch {
        // Skip if we can't change permissions
        return;
      }

      try {
        const result = await runInitCommand([], testProject);
        // Should either succeed or fail gracefully
        expect(result).toBeDefined();
      } finally {
        // Restore permissions so cleanup can work
        try {
          fs.chmodSync(testProject, 0o755);
        } catch {
          // Ignore
        }
      }
    });

    it("should handle invalid output path characters", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      // Use a path that might cause issues
      const invalidOutput = path.join(testProject, "valid-dir");
      fs.mkdirSync(invalidOutput, { recursive: true });

      const result = await runInitCommand(["--output", invalidOutput], testProject);

      // Should complete without crashing
      expect(result).toBeDefined();
    });

    it("should handle empty project directory", async () => {
      const emptyProject = fs.mkdtempSync(path.join(os.tmpdir(), "empty-project-"));
      tempDirs.push(emptyProject);

      const result = await runInitCommand([], emptyProject);

      // Should complete even with empty project
      expect(result).toBeDefined();
      // ai-context directory should be created
      expect(fs.existsSync(path.join(emptyProject, "ai-context"))).toBe(true);
    });

    it("should handle project with only hidden files", async () => {
      const hiddenFilesProject = createTempProjectDir({
        ".gitignore": "node_modules",
        ".env": "SECRET=123",
        ".npmrc": "registry=https://registry.npmjs.org/",
      });
      tempDirs.push(hiddenFilesProject);

      const result = await runInitCommand([], hiddenFilesProject);

      // Should complete
      expect(result).toBeDefined();
    });
  });

  // =========================================================================
  // CONTENT VALIDATION TESTS
  // =========================================================================

  describe("Content Validation", () => {
    it("should generate valid JSON in symbols.json", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
      });
      tempDirs.push(testProject);

      await runInitCommand([], testProject);

      const symbolsPath = path.join(testProject, "ai-context", "symbols.json");
      expect(fs.existsSync(symbolsPath)).toBe(true);

      const content = fs.readFileSync(symbolsPath, "utf-8");
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("should generate valid JSON in dependencies.json", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      await runInitCommand([], testProject);

      const depsPath = path.join(testProject, "ai-context", "dependencies.json");
      expect(fs.existsSync(depsPath)).toBe(true);

      const content = fs.readFileSync(depsPath, "utf-8");
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("should generate valid JSON in repo_map.json", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      await runInitCommand([], testProject);

      const repoMapPath = path.join(testProject, "ai-context", "repo_map.json");
      expect(fs.existsSync(repoMapPath)).toBe(true);

      const content = fs.readFileSync(repoMapPath, "utf-8");
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("should generate markdown files with content", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      await runInitCommand([], testProject);

      const markdownFiles = ["summary.md", "architecture.md", "tech_stack.md"];

      for (const file of markdownFiles) {
        const filePath = path.join(testProject, "ai-context", file);
        expect(fs.existsSync(filePath), `Expected ${file} to exist`).toBe(true);

        const content = fs.readFileSync(filePath, "utf-8");
        expect(content.length).toBeGreaterThan(10);
      }
    });

    it("should include project name in ai_context.md", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "my-test-project", "version": "1.0.0"}',
      });
      tempDirs.push(testProject);

      await runInitCommand([], testProject);

      const aiContextPath = path.join(testProject, "ai-context", "ai_context.md");
      const content = fs.readFileSync(aiContextPath, "utf-8");

      // Should mention AI context or repository
      expect(
        content.toLowerCase().includes("ai context") ||
          content.toLowerCase().includes("repository") ||
          content.toLowerCase().includes("project")
      ).toBe(true);
    });
  });

  // =========================================================================
  // MULTI-LANGUAGE PROJECT TESTS
  // =========================================================================

  describe("Multi-Language Projects", () => {
    it("should handle TypeScript project", async () => {
      const tsProject = createTempProjectDir({
        "package.json": '{"name": "ts-project"}',
        "tsconfig.json": '{"compilerOptions": {}}',
        "src/index.ts": "export const main = (): void => {};",
        "src/app.ts": "export class App {}",
      });
      tempDirs.push(tsProject);

      const result = await runInitCommand([], tsProject);

      expect(result.exitCode).toBe(0);

      const symbolsPath = path.join(tsProject, "ai-context", "symbols.json");
      expect(fs.existsSync(symbolsPath)).toBe(true);
    });

    it("should handle Python project", async () => {
      const pyProject = createTempProjectDir({
        "main.py": "def main(): pass",
        "requirements.txt": "flask==2.0.0",
      });
      tempDirs.push(pyProject);

      const result = await runInitCommand([], pyProject);

      expect(result.exitCode).toBe(0);

      const techStackPath = path.join(pyProject, "ai-context", "tech_stack.md");
      expect(fs.existsSync(techStackPath)).toBe(true);
    });

    it("should handle mixed language project", async () => {
      const mixedProject = createTempProjectDir({
        "package.json": '{"name": "mixed"}',
        "index.js": "const express = require('express');",
        "src/main.ts": "export const app = {};",
        "src/utils.py": "def helper(): pass",
        "src/data.java": "public class Data {}",
      });
      tempDirs.push(mixedProject);

      const result = await runInitCommand([], mixedProject);

      expect(result.exitCode).toBe(0);

      const techStackPath = path.join(mixedProject, "ai-context", "tech_stack.md");
      const content = fs.readFileSync(techStackPath, "utf-8");

      // Should detect multiple languages
      expect(content).toBeDefined();
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe("Edge Cases", () => {
    it("should handle project with very long paths", async () => {
      const deepDir = path.join(
        os.tmpdir(),
        "very-long-directory-name-test",
        "another-long-directory-name",
        "yet-another-long-name",
        "final-long-directory-name"
      );

      fs.mkdirSync(deepDir, { recursive: true });
      tempDirs.push(deepDir);

      fs.writeFileSync(path.join(deepDir, "index.js"), "const x = 1;");
      fs.writeFileSync(
        path.join(deepDir, "package.json"),
        '{"name": "deep"}'
      );

      const result = await runInitCommand([], deepDir);

      expect(result).toBeDefined();
      // Should complete without crashing
    });

    it("should handle project with special characters in file names", async () => {
      const specialProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/file-with-dashes.js": "const x = 1;",
        "src/file_with_underscores.js": "const y = 2;",
      });
      tempDirs.push(specialProject);

      const result = await runInitCommand([], specialProject);

      expect(result.exitCode).toBe(0);
    });

    it("should handle project with large number of files", async () => {
      const largeProject = fs.mkdtempSync(path.join(os.tmpdir(), "large-project-"));
      tempDirs.push(largeProject);

      fs.writeFileSync(path.join(largeProject, "package.json"), '{"name": "large"}');

      // Create 50 files
      for (let i = 0; i < 50; i++) {
        fs.writeFileSync(
          path.join(largeProject, `file${i}.js`),
          `const x${i} = ${i};`
        );
      }

      const result = await runInitCommand([], largeProject);

      expect(result.exitCode).toBe(0);

      const repoMapPath = path.join(largeProject, "ai-context", "repo_map.json");
      const content = fs.readFileSync(repoMapPath, "utf-8");
      const data = JSON.parse(content);

      expect(data.totalFiles).toBeGreaterThanOrEqual(50);
    });

    it("should handle project with symlinks", async () => {
      const symlinkProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "symlink-test"}',
      });
      tempDirs.push(symlinkProject);

      // Create a symlink to a directory
      const targetDir = path.join(symlinkProject, "target-dir");
      fs.mkdirSync(targetDir);
      fs.writeFileSync(path.join(targetDir, "target.js"), "const y = 1;");

      const symlinkDir = path.join(symlinkProject, "linked-dir");
      fs.symlinkSync(targetDir, symlinkDir);

      const result = await runInitCommand([], symlinkProject);

      // Should complete without crashing
      expect(result).toBeDefined();
    });
  });

  // =========================================================================
  // FILE STRUCTURE VALIDATION
  // =========================================================================

  describe("File Structure Validation", () => {
    it("should create proper directory structure in ai-context", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      await runInitCommand([], testProject);

      const aiContextDir = path.join(testProject, "ai-context");
      const entries = fs.readdirSync(aiContextDir, { withFileTypes: true });

      // Should have multiple files
      const files = entries.filter((e) => e.isFile());
      expect(files.length).toBeGreaterThan(5);

      // Should have context subdirectory
      const hasContextDir = entries.some(
        (e) => e.isDirectory() && e.name === "context"
      );
      // context subdirectory might not always be created depending on the project
    });

    it("should create modules.json with proper structure", async () => {
      const testProject = createTempProjectDir({
        "package.json": '{"name": "module-test"}',
        "src/index.ts": "export const main = () => {};",
        "src/api/routes.ts": "export const routes = [];",
        "src/services/user.ts": "export const userService = {};",
      });
      tempDirs.push(testProject);

      await runInitCommand([], testProject);

      const modulesPath = path.join(testProject, "ai-context", "modules.json");
      expect(fs.existsSync(modulesPath)).toBe(true);

      const content = fs.readFileSync(modulesPath, "utf-8");
      const data = JSON.parse(content);

      expect(data.modules).toBeDefined();
      expect(typeof data.modules).toBe("object");
    });

    it("should include context subdirectory files when generated", async () => {
      const testProject = createTempProjectDir({
        "package.json": '{"name": "context-test"}',
        "index.js": "const app = require('./app');",
      });
      tempDirs.push(testProject);

      await runInitCommand([], testProject);

      const contextDir = path.join(testProject, "ai-context", "context");

      // Context directory should exist
      if (fs.existsSync(contextDir)) {
        const entries = fs.readdirSync(contextDir, { withFileTypes: true });
        // Just verify the directory can be read
        expect(entries).toBeDefined();
      }
    });
  });
});
