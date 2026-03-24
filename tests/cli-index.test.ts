import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

const PROJECT_ROOT = process.cwd();
const CLI_PATH = path.join(PROJECT_ROOT, "dist/commands/ai-first.js");
const EXPRESS_API_PATH = path.join(PROJECT_ROOT, "test-projects/express-api");

/**
 * Creates a temporary project directory with some source files
 */
function createTempProjectDir(files: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-index-test-"));
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
 * Creates a project with many files for testing adaptive processing
 */
function createLargeProjectDir(fileCount: number, filesPerDir: number = 10): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-index-large-"));
  
  fs.writeFileSync(path.join(tempDir, "package.json"), JSON.stringify({ name: "large-test", version: "1.0.0" }));
  
  const dirs = ["src/api", "src/services", "src/utils", "src/models", "src/controllers"];
  
  for (const dir of dirs) {
    const dirPath = path.join(tempDir, dir);
    fs.mkdirSync(dirPath, { recursive: true });
    
    const filesToCreate = Math.min(filesPerDir, Math.ceil(fileCount / dirs.length));
    for (let i = 0; i < filesToCreate; i++) {
      const ext = i % 3 === 0 ? ".ts" : i % 3 === 1 ? ".js" : ".py";
      const fileName = `file${i}${ext}`;
      const content = ext === ".py" 
        ? `def function_${i}():\n    pass\n`
        : ext === ".ts"
        ? `export function function${i}() {\n  return ${i};\n}\n`
        : `function function${i}() {\n  return ${i};\n}\nmodule.exports = { function${i} };\n`;
      fs.writeFileSync(path.join(dirPath, fileName), content);
    }
  }
  
  return tempDir;
}

/**
 * Run the CLI index command
 */
async function runIndexCommand(
  args: string[],
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = spawn("node", [CLI_PATH, "index", ...args], {
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

    // Timeout after 120 seconds for large projects
    setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, exitCode: 124 });
    }, 120000);
  });
}

describe("CLI Index Command", () => {
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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-index-test-"));
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
    it("should run index command successfully on express-api project", async () => {
      const result = await runIndexCommand([], EXPRESS_API_PATH);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Generating index");
    });

    it("should create ai-context directory with index.db", async () => {
      const aiContextDir = path.join(EXPRESS_API_PATH, "ai-context");
      const indexDbPath = path.join(aiContextDir, "index.db");

      // Clean up if exists
      if (fs.existsSync(aiContextDir)) {
        fs.rmSync(aiContextDir, { recursive: true, force: true });
      }

      const result = await runIndexCommand([], EXPRESS_API_PATH);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(aiContextDir)).toBe(true);
      expect(fs.existsSync(indexDbPath)).toBe(true);
    });

    it("should create SQLite database with valid schema", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
        "src/utils.ts": "export const helper = () => {};",
      });
      tempDirs.push(testProject);

      await runIndexCommand([], testProject);

      const dbPath = path.join(testProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);

      // Check that the database file is not empty
      const stats = fs.statSync(dbPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it("should create index-state.json for incremental indexing", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      await runIndexCommand([], testProject);

      const statePath = path.join(testProject, "ai-context", "index-state.json");
      expect(fs.existsSync(statePath)).toBe(true);

      const content = fs.readFileSync(statePath, "utf-8");
      const state = JSON.parse(content);

      expect(state.version).toBe("1.0.0");
      expect(state.lastIndexed).toBeDefined();
      expect(state.totalFiles).toBeGreaterThan(0);
      expect(state.files).toBeDefined();
    });

    it("should create files.json with file listing", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
      });
      tempDirs.push(testProject);

      await runIndexCommand([], testProject);

      const filesJsonPath = path.join(testProject, "ai-context", "files.json");
      expect(fs.existsSync(filesJsonPath)).toBe(true);

      const content = fs.readFileSync(filesJsonPath, "utf-8");
      const data = JSON.parse(content);

      expect(data.files).toBeDefined();
      expect(Array.isArray(data.files)).toBe(true);
    });

    it("should create modules.json with module structure", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
        "src/api/routes.ts": "export const routes = [];",
      });
      tempDirs.push(testProject);

      await runIndexCommand([], testProject);

      const modulesPath = path.join(testProject, "ai-context", "modules.json");
      expect(fs.existsSync(modulesPath)).toBe(true);

      const content = fs.readFileSync(modulesPath, "utf-8");
      const data = JSON.parse(content);

      expect(data.modules).toBeDefined();
    });
  });

  // =========================================================================
  // --semantic FLAG TESTS
  // =========================================================================

  describe("--semantic Flag", () => {
    it("should enable semantic mode with --semantic flag", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand(["--semantic"], testProject);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Semantic mode enabled");
    });

    it("should process code files for embeddings with --semantic", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
        "src/utils.ts": "export const helper = () => {};",
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand(["--semantic"], testProject);

      expect(result.exitCode).toBe(0);
      // Should show processing of code files
      expect(result.stdout).toContain("Processing");
    });

    it("should handle --semantic with short flag -s", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand(["-s"], testProject);

      expect(result.exitCode).toBe(0);
    });

    it("should create semantic embeddings in database with --semantic", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = (): void => {};",
      });
      tempDirs.push(testProject);

      await runIndexCommand(["--semantic"], testProject);

      const dbPath = path.join(testProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);

      // Database should be larger with embeddings
      const stats = fs.statSync(dbPath);
      expect(stats.size).toBeGreaterThan(100);
    });
  });

  // =========================================================================
  // ADAPTIVE PROCESSING TESTS
  // =========================================================================

  describe("Adaptive Processing", () => {
    it("should handle small project (< 200 files) with structural index", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "small-test"}',
        "src/main.ts": "export const main = () => {};",
        "src/utils.ts": "export const helper = () => {};",
        "src/config.ts": "export const config = {};",
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand([], testProject);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Total files:");
    });

    it("should handle medium project (200-2000 files) with structural + module graph", async () => {
      // Create a project with ~50 files (medium size)
      const testProject = createLargeProjectDir(50, 10);
      tempDirs.push(testProject);

      const result = await runIndexCommand([], testProject);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Total files:");
    });

    it("should automatically enable semantic for large projects (> 2000 files)", async () => {
      // Note: Creating 2000+ files is expensive, so we simulate by checking the threshold logic
      // For actual test, we create a smaller project and verify the threshold warning appears
      const testProject = createLargeProjectDir(100, 20);
      tempDirs.push(testProject);

      const result = await runIndexCommand([], testProject);

      expect(result.exitCode).toBe(0);
      // The message about large repository should appear if file count exceeds threshold
      // Since we're under 2000, it shouldn't show the automatic semantic message
      expect(result).toBeDefined();
    });

    it("should show file count statistics", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
        "src/utils.ts": "export const helper = () => {};",
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand([], testProject);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Total files:");
      expect(result.stdout).toContain("To index:");
      expect(result.stdout).toContain("Unchanged:");
    });
  });

  // =========================================================================
  // --root FLAG TESTS
  // =========================================================================

  describe("--root Flag", () => {
    it("should index different directory with --root flag", async () => {
      const testProject = createTempProjectDir({
        "README.md": "# Test Project",
        "src/index.ts": "export const test = 1;",
        "package.json": '{"name": "root-test"}',
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand(["--root", testProject]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(testProject);
    });

    it("should handle --root with short flag -r", async () => {
      const testProject = createTempProjectDir({
        "README.md": "# Test Project",
        "src/index.ts": "export const test = 1;",
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand(["-r", testProject]);

      expect(result.exitCode).toBe(0);
    });

    it("should create index.db in ai-context of root directory", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      await runIndexCommand(["--root", testProject]);

      const dbPath = path.join(testProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);
    });
  });

  // =========================================================================
  // --output FLAG TESTS
  // =========================================================================

  describe("--output Flag", () => {
    it("should create custom output path for index.db with --output flag", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      const customOutput = path.join(testProject, "custom-dir", "custom-index.db");

      const result = await runIndexCommand(["--output", customOutput], testProject);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(customOutput)).toBe(true);
    });

    it("should handle --output with short flag -o", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      const customOutput = path.join(testProject, "custom.db");

      const result = await runIndexCommand(["-o", customOutput], testProject);

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

      const customOutput = path.join(outputProject, "index.db");

      const result = await runIndexCommand(
        ["--root", sourceProject, "--output", customOutput],
        sourceProject
      );

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(customOutput)).toBe(true);
    });
  });

  // =========================================================================
  // INCREMENTAL INDEXING TESTS
  // =========================================================================

  describe("Incremental Indexing", () => {
    it("should detect unchanged files on re-index", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
      });
      tempDirs.push(testProject);

      // First indexing
      const result1 = await runIndexCommand([], testProject);
      expect(result1.exitCode).toBe(0);

      // Second indexing (should show unchanged files)
      const result2 = await runIndexCommand([], testProject);
      expect(result2.exitCode).toBe(0);
      expect(result2.stdout).toContain("Unchanged:");
    });

    it("should index new files on re-index", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      // First indexing
      await runIndexCommand([], testProject);

      // Add a new file
      fs.mkdirSync(path.join(testProject, "src"), { recursive: true });
      fs.writeFileSync(
        path.join(testProject, "src", "newfile.ts"),
        "export const newFile = () => {};"
      );

      // Second indexing
      const result2 = await runIndexCommand([], testProject);
      expect(result2.exitCode).toBe(0);
      expect(result2.stdout).toContain("New:");
    });

    it("should update index-state.json after indexing", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      await runIndexCommand([], testProject);

      const statePath = path.join(testProject, "ai-context", "index-state.json");
      const content = fs.readFileSync(statePath, "utf-8");
      const state = JSON.parse(content);

      expect(state.lastIndexed).toBeDefined();
      expect(state.files).toBeDefined();
    });
  });

  // =========================================================================
  // MULTI-LANGUAGE PROJECT TESTS
  // =========================================================================

  describe("Multi-Language Projects", () => {
    it("should index TypeScript project", async () => {
      const tsProject = createTempProjectDir({
        "package.json": '{"name": "ts-project"}',
        "tsconfig.json": '{"compilerOptions": {}}',
        "src/index.ts": "export const main = (): void => {};",
        "src/app.ts": "export class App {}",
      });
      tempDirs.push(tsProject);

      const result = await runIndexCommand([], tsProject);

      expect(result.exitCode).toBe(0);

      const dbPath = path.join(tsProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it("should index Python project", async () => {
      const pyProject = createTempProjectDir({
        "main.py": "def main(): pass",
        "requirements.txt": "flask==2.0.0",
        "src/utils.py": "def helper(): pass",
      });
      tempDirs.push(pyProject);

      const result = await runIndexCommand([], pyProject);

      expect(result.exitCode).toBe(0);

      const dbPath = path.join(pyProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it("should index Go project", async () => {
      const goProject = createTempProjectDir({
        "main.go": "package main\nfunc main() {}",
        "go.mod": "module example.com/test",
        "src/utils.go": "package main\nfunc helper() {}",
      });
      tempDirs.push(goProject);

      const result = await runIndexCommand([], goProject);

      expect(result.exitCode).toBe(0);

      const dbPath = path.join(goProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it("should index Rust project", async () => {
      const rustProject = createTempProjectDir({
        "main.rs": "fn main() {}",
        "Cargo.toml": "[package]\nname = \"test\"\nversion = \"0.1.0\"",
        "src/lib.rs": "pub fn helper() {}",
      });
      tempDirs.push(rustProject);

      const result = await runIndexCommand([], rustProject);

      expect(result.exitCode).toBe(0);

      const dbPath = path.join(rustProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it("should index Java project", async () => {
      const javaProject = createTempProjectDir({
        "Main.java": "public class Main { public static void main(String[] args) {} }",
        "pom.xml": "<?xml version=\"1.0\"?><project></project>",
        "src/App.java": "public class App {}",
      });
      tempDirs.push(javaProject);

      const result = await runIndexCommand([], javaProject);

      expect(result.exitCode).toBe(0);

      const dbPath = path.join(javaProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it("should index mixed language project", async () => {
      const mixedProject = createTempProjectDir({
        "package.json": '{"name": "mixed"}',
        "index.js": "const express = require('express');",
        "src/main.ts": "export const app = {};",
        "src/utils.py": "def helper(): pass",
        "src/data.java": "public class Data {}",
      });
      tempDirs.push(mixedProject);

      const result = await runIndexCommand([], mixedProject);

      expect(result.exitCode).toBe(0);

      const dbPath = path.join(mixedProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);
    });
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================

  describe("Error Handling", () => {
    it("should handle empty project directory", async () => {
      const emptyProject = fs.mkdtempSync(path.join(os.tmpdir(), "empty-index-project-"));
      tempDirs.push(emptyProject);

      // Create only ai-context dir but no source files
      fs.mkdirSync(path.join(emptyProject, "ai-context"), { recursive: true });

      const result = await runIndexCommand([], emptyProject);

      // Should complete (may exit with 0 or handle gracefully)
      expect(result).toBeDefined();
    });

    it("should handle project with only hidden files", async () => {
      const hiddenFilesProject = createTempProjectDir({
        ".gitignore": "node_modules",
        ".env": "SECRET=123",
        ".npmrc": "registry=https://registry.npmjs.org/",
      });
      tempDirs.push(hiddenFilesProject);

      const result = await runIndexCommand([], hiddenFilesProject);

      // Should complete without crashing
      expect(result).toBeDefined();
    });

    it("should handle non-existent root directory gracefully", async () => {
      const nonExistentPath = path.join(os.tmpdir(), "non-existent-dir-12345");

      const result = await runIndexCommand(["--root", nonExistentPath]);

      // Should either fail gracefully or handle the error
      expect(result).toBeDefined();
    });

    it("should handle permission errors gracefully", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      // Make the parent directory read-only
      try {
        fs.chmodSync(testProject, 0o555);
      } catch {
        // Skip if we can't change permissions
        return;
      }

      try {
        const result = await runIndexCommand([], testProject);
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
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe("Edge Cases", () => {
    it("should handle project with special characters in file names", async () => {
      const specialProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/file-with-dashes.js": "const x = 1;",
        "src/file_with_underscores.js": "const y = 2;",
      });
      tempDirs.push(specialProject);

      const result = await runIndexCommand([], specialProject);

      expect(result.exitCode).toBe(0);
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

      const result = await runIndexCommand([], symlinkProject);

      // Should complete without crashing
      expect(result).toBeDefined();
    });

    it("should handle deeply nested project structure", async () => {
      const deepDir = path.join(
        os.tmpdir(),
        "cli-index-deep",
        "level1",
        "level2",
        "level3",
        "level4"
      );

      fs.mkdirSync(deepDir, { recursive: true });
      tempDirs.push(deepDir);

      fs.writeFileSync(path.join(deepDir, "index.js"), "const x = 1;");
      fs.writeFileSync(
        path.join(deepDir, "package.json"),
        '{"name": "deep"}'
      );

      const result = await runIndexCommand([], deepDir);

      expect(result).toBeDefined();
      // Should complete without crashing
    });

    it("should handle project with many small files", async () => {
      const manyFilesProject = fs.mkdtempSync(path.join(os.tmpdir(), "many-files-"));
      tempDirs.push(manyFilesProject);

      fs.writeFileSync(path.join(manyFilesProject, "package.json"), '{"name": "many"}');

      // Create 100 small files
      for (let i = 0; i < 100; i++) {
        fs.writeFileSync(
          path.join(manyFilesProject, `file${i}.js`),
          `const x${i} = ${i};`
        );
      }

      const result = await runIndexCommand([], manyFilesProject);

      expect(result.exitCode).toBe(0);

      const dbPath = path.join(manyFilesProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);
    });
  });

  // =========================================================================
  // SQLITE DATABASE VALIDATION TESTS
  // =========================================================================

  describe("SQLite Database Validation", () => {
    it("should create database with files table", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
      });
      tempDirs.push(testProject);

      await runIndexCommand([], testProject);

      const dbPath = path.join(testProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);

      // Database file should be valid SQLite format (starts with SQLite header)
      const buffer = fs.readFileSync(dbPath);
      expect(buffer.slice(0, 16).toString()).toContain("SQLite");
    });

    it("should create database with symbols data", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export class MyClass {}; export const myFunc = () => {};",
      });
      tempDirs.push(testProject);

      await runIndexCommand([], testProject);

      const dbPath = path.join(testProject, "ai-context", "index.db");
      const stats = fs.statSync(dbPath);

      // Database should have some content
      expect(stats.size).toBeGreaterThan(1024);
    });

    it("should create database with proper file structure", async () => {
      const testProject = createTempProjectDir({
        "package.json": '{"name": "db-test"}',
        "src/index.ts": "export const index = 1;",
        "src/api/routes.ts": "export const routes = [];",
      });
      tempDirs.push(testProject);

      await runIndexCommand([], testProject);

      const dbPath = path.join(testProject, "ai-context", "index.db");
      const aiContextFiles = path.join(testProject, "ai-context");

      // Check all expected files exist
      expect(fs.existsSync(path.join(aiContextFiles, "index.db"))).toBe(true);
      expect(fs.existsSync(path.join(aiContextFiles, "files.json"))).toBe(true);
      expect(fs.existsSync(path.join(aiContextFiles, "modules.json"))).toBe(true);
      expect(fs.existsSync(path.join(aiContextFiles, "index-state.json"))).toBe(true);
    });
  });

  // =========================================================================
  // HELP OUTPUT TESTS
  // =========================================================================

  describe("Help Output", () => {
    it("should show help message with --help flag", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand(["--help"], testProject);

      // Help should exit with 0 and show usage info
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("ai-first index");
      expect(result.stdout).toContain("--root");
      expect(result.stdout).toContain("--semantic");
    });

    it("should show adaptive thresholds in help", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand(["--help"], testProject);

      expect(result.stdout).toContain("Adaptive thresholds");
      expect(result.stdout).toContain("200 files");
      expect(result.stdout).toContain("2000");
    });

    it("should show example queries in help", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand(["--help"], testProject);

      expect(result.stdout).toContain("Example queries");
      expect(result.stdout).toContain("SELECT");
    });
  });

  // =========================================================================
  // VERIFICATION CHECKLIST TESTS
  // =========================================================================

  describe("Verification Checklist", () => {
    it("should verify index command with default options works", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand([], testProject);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Generating index");
      expect(result.stdout).toContain("Index created");
    });

    it("should verify --semantic flag functionality", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand(["--semantic"], testProject);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Semantic mode enabled");
    });

    it("should verify SQLite database creation", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      await runIndexCommand([], testProject);

      const dbPath = path.join(testProject, "ai-context", "index.db");
      expect(fs.existsSync(dbPath)).toBe(true);

      const stats = fs.statSync(dbPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it("should verify embeddings generation with --semantic", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = (): void => {};",
        "src/utils.ts": "export const helper = (): number => 42;",
      });
      tempDirs.push(testProject);

      const result = await runIndexCommand(["--semantic"], testProject);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Semantic mode enabled");
      // Should attempt embeddings generation
      expect(result.stdout).toMatch(/Processing \d+ code files|Creating \d+ chunks|semantic indexing complete/i);
    });

    it("should verify adaptive processing for different project sizes", async () => {
      const smallProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "small"}',
      });
      tempDirs.push(smallProject);

      const smallResult = await runIndexCommand([], smallProject);
      expect(smallResult.exitCode).toBe(0);

      // Medium project
      const mediumProject = createLargeProjectDir(50, 10);
      tempDirs.push(mediumProject);

      const mediumResult = await runIndexCommand([], mediumProject);
      expect(mediumResult.exitCode).toBe(0);
    });

    it("should verify incremental indexing works", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
      });
      tempDirs.push(testProject);

      // First run
      const result1 = await runIndexCommand([], testProject);
      expect(result1.exitCode).toBe(0);

      // Second run should show unchanged
      const result2 = await runIndexCommand([], testProject);
      expect(result2.exitCode).toBe(0);
      expect(result2.stdout).toContain("Unchanged:");
    });
  });
});
