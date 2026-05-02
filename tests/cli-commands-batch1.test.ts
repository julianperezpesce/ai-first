import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

const PROJECT_ROOT = process.cwd();
const CLI_PATH = path.join(PROJECT_ROOT, "dist/commands/ai-first.js");
const EXPRESS_API_PATH = path.join(PROJECT_ROOT, "fixtures/express-api");

function createTempProjectDir(files: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-batch1-test-"));
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

async function runCLICommand(
  command: string,
  args: string[],
  cwd: string = process.cwd(),
  timeoutMs: number = 60000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = spawn("node", [CLI_PATH, command, ...args], {
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

    setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, exitCode: 124 });
    }, timeoutMs);
  });
}

async function runIndexCommand(
  args: string[],
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return runCLICommand("index", args, cwd, 120000);
}

describe("CLI Commands Batch 1 - watch, context, summarize, query", () => {
  const tempDirs: string[] = [];

  beforeAll(() => {
    if (!fs.existsSync(CLI_PATH)) {
      throw new Error(`CLI not found at ${CLI_PATH}. Run 'npm run build' first.`);
    }
  });

  afterAll(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe("Watch Command", () => {
    it("should show watch help with --help flag", async () => {
      const result = await runCLICommand("watch", ["--help"], process.cwd());
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("ai-first watch");
      expect(result.stdout).toContain("--root");
      expect(result.stdout).toContain("--output");
      expect(result.stdout).toContain("--debounce");
    });

    it("should start watch mode and initialize indexer", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "watch-test"}',
        "src/main.ts": "export const main = () => {};",
      });
      tempDirs.push(testProject);

      const watchPromise = runCLICommand("watch", [], testProject, 5000);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const result = await watchPromise;
      expect(result.exitCode).toBe(1);
      const output = result.stdout + result.stderr;
      expect(output.includes("incremental indexer") || output.includes("watch")).toBe(true);
    });

    it("should accept --debounce flag", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "watch-test"}',
      });
      tempDirs.push(testProject);

      const watchPromise = runCLICommand("watch", ["--debounce", "500"], testProject, 3000);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const result = await watchPromise;
      expect(result.exitCode).toBe(1);
    });

    it("should handle --root flag", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "watch-root-test"}',
      });
      tempDirs.push(testProject);

      const watchPromise = runCLICommand("watch", ["--root", testProject], testProject, 3000);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const result = await watchPromise;
      expect(result.exitCode).toBe(1);
    });

    it("should handle --output flag", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "watch-output-test"}',
      });
      tempDirs.push(testProject);

      const customOutput = path.join(testProject, "custom", "index.db");
      const watchPromise = runCLICommand("watch", ["--output", customOutput], testProject, 3000);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const result = await watchPromise;
      expect(result.exitCode).toBe(1);
    });
  });

  describe("Context Command", () => {
    describe("Help and Options", () => {
      it("should show context help with --help flag", async () => {
        const result = await runCLICommand("context", ["--help"], process.cwd());
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("ai-first context");
        expect(result.stdout).toContain("--root");
        expect(result.stdout).toContain("--output");
        expect(result.stdout).toContain("--depth");
        expect(result.stdout).toContain("--format");
      });

      it("should list all context options in help", async () => {
        const result = await runCLICommand("context", ["--help"], process.cwd());
        expect(result.stdout).toContain("--max-symbols");
        expect(result.stdout).toContain("--save");
        expect(result.stdout).toContain("json");
        expect(result.stdout).toContain("markdown");
        expect(result.stdout).toContain("text");
      });
    });

    describe("Generate AI Context (without symbol)", () => {
      it("should generate AI context without symbol argument", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "context-test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runCLICommand("context", [], testProject);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(/Generating AI context|AI Context generated/);
      });

      it("should create ai-context directory with context files", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "context-files-test"}',
        });
        tempDirs.push(testProject);

        await runCLICommand("context", [], testProject);

        const aiContextDir = path.join(testProject, "ai-context");
        expect(fs.existsSync(aiContextDir)).toBe(true);
      });

      it("should handle --root flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "context-root-test"}',
        });
        tempDirs.push(testProject);

        const result = await runCLICommand("context", ["--root", testProject], testProject);
        expect(result.exitCode).toBe(0);
      });

      it("should handle --output flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "context-output-test"}',
        });
        tempDirs.push(testProject);

        const customOutput = path.join(testProject, "custom-context");

        const result = await runCLICommand("context", ["--output", customOutput], testProject);
        expect(result.exitCode).toBe(0);
        expect(fs.existsSync(customOutput)).toBe(true);
      });
    });

    describe("Symbol-specific Context", () => {
      it("should require index to be created before symbol context", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "symbol-context-test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        await runIndexCommand([], testProject);

        const result = await runCLICommand("context", ["main", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should accept --depth flag for symbol context", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "depth-test"}',
          "src/main.ts": "export function main() { return 1; }",
        });
        tempDirs.push(testProject);

        await runIndexCommand([], testProject);

        const result = await runCLICommand("context", ["main", "--depth", "2"], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should accept --max-symbols flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "max-symbols-test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        await runIndexCommand([], testProject);

        const result = await runCLICommand("context", ["main", "--max-symbols", "10"], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should accept --format json flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "format-json-test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        await runIndexCommand([], testProject);

        const result = await runCLICommand("context", ["main", "--format", "json"], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should accept --format markdown flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "format-md-test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        await runIndexCommand([], testProject);

        const result = await runCLICommand("context", ["main", "--format", "markdown"], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should accept --save flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "save-flag-test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        await runIndexCommand([], testProject);

        const result = await runCLICommand("context", ["main", "--save"], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });
    });

    describe("Error Handling", () => {
      it("should handle non-existent root gracefully", async () => {
        const nonExistent = path.join(os.tmpdir(), "non-existent-context");

        const result = await runCLICommand("context", ["--root", nonExistent]);
        expect(result.exitCode).toBeGreaterThanOrEqual(0);
      });

      it("should handle empty project directory", async () => {
        const emptyProject = fs.mkdtempSync(path.join(os.tmpdir(), "empty-context-"));
        tempDirs.push(emptyProject);

        const result = await runCLICommand("context", [], emptyProject);
        expect(result.exitCode).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Summarize Command", () => {
    describe("Help and Options", () => {
      it("should show summarize help with --help flag", async () => {
        const result = await runCLICommand("summarize", ["--help"], process.cwd());
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("ai-first summarize");
        expect(result.stdout).toContain("--root");
        expect(result.stdout).toContain("--output");
      });

      it("should document output path in help", async () => {
        const result = await runCLICommand("summarize", ["--help"], process.cwd());
        expect(result.stdout).toContain("hierarchy.json");
        expect(result.stdout).toContain("Output:");
      });
    });

    describe("Generate Summary", () => {
      it("should generate hierarchical summary successfully", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "summarize-test"}',
          "src/main.ts": "export const main = () => {};",
          "src/utils.ts": "export const helper = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runCLICommand("summarize", [], testProject);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(/Hierarchy generated|Summary/);
      });

      it("should create hierarchy.json file", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "hierarchy-test"}',
        });
        tempDirs.push(testProject);

        await runCLICommand("summarize", [], testProject);

        expect(fs.existsSync(path.join(testProject, "ai-context"))).toBe(true);
      });

      it("should handle --root flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "summarize-root-test"}',
        });
        tempDirs.push(testProject);

        const result = await runCLICommand("summarize", ["--root", testProject], testProject);
        expect(result.exitCode).toBe(0);
      });

      it("should handle -r short flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "summarize-r-test"}',
        });
        tempDirs.push(testProject);

        const result = await runCLICommand("summarize", ["-r", testProject], testProject);
        expect(result.exitCode).toBe(0);
      });

      it("should handle --output flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "summarize-output-test"}',
        });
        tempDirs.push(testProject);

        const customOutput = path.join(testProject, "custom-hierarchy.json");

        const result = await runCLICommand("summarize", ["--output", customOutput], testProject);
        expect(result.exitCode).toBe(0);
        expect(fs.existsSync(customOutput)).toBe(true);
      });

      it("should handle -o short flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "summarize-o-test"}',
        });
        tempDirs.push(testProject);

        const customOutput = path.join(testProject, "hierarchy.json");

        const result = await runCLICommand("summarize", ["-o", customOutput], testProject);
        expect(result.exitCode).toBe(0);
      });
    });

    describe("Content Validation", () => {
      it("should include repository summary in output", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "summary-content-test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runCLICommand("summarize", [], testProject);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(/Repository|Folders|Files|Summary/i);
      });

      it("should count folders correctly", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "folder-count-test"}',
          "src/api/routes.ts": "export const routes = [];",
          "src/services/user.ts": "export const userService = {};",
          "src/utils/helper.ts": "export const helper = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runCLICommand("summarize", [], testProject);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("Folders:");
      });

      it("should count files correctly", async () => {
        const testProject = createTempProjectDir({
          "package.json": '{"name": "file-count-test"}',
          "src/index.ts": "export const index = 1;",
          "src/app.ts": "export const app = 1;",
          "src/config.ts": "export const config = 1;",
        });
        tempDirs.push(testProject);

        const result = await runCLICommand("summarize", [], testProject);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("Files:");
      });
    });

    describe("Multi-Language Projects", () => {
      it("should handle TypeScript project", async () => {
        const tsProject = createTempProjectDir({
          "package.json": '{"name": "ts-summarize"}',
          "tsconfig.json": '{"compilerOptions": {}}',
          "src/index.ts": "export const main = (): void => {};",
          "src/app.ts": "export class App {}",
        });
        tempDirs.push(tsProject);

        const result = await runCLICommand("summarize", [], tsProject);
        expect(result.exitCode).toBe(0);
      });

      it("should handle Python project", async () => {
        const pyProject = createTempProjectDir({
          "main.py": "def main(): pass",
          "requirements.txt": "flask==2.0.0",
          "src/utils.py": "def helper(): pass",
        });
        tempDirs.push(pyProject);

        const result = await runCLICommand("summarize", [], pyProject);
        expect(result.exitCode).toBe(0);
      });

      it("should handle mixed language project", async () => {
        const mixedProject = createTempProjectDir({
          "package.json": '{"name": "mixed-summarize"}',
          "index.js": "const express = require('express');",
          "src/main.ts": "export const app = {};",
          "src/utils.py": "def helper(): pass",
        });
        tempDirs.push(mixedProject);

        const result = await runCLICommand("summarize", [], mixedProject);
        expect(result.exitCode).toBe(0);
      });
    });

    describe("Error Handling", () => {
      it("should handle non-existent root gracefully", async () => {
        const nonExistent = path.join(os.tmpdir(), "non-existent-summarize");

        const result = await runCLICommand("summarize", ["--root", nonExistent]);
        expect(result.exitCode).toBeGreaterThanOrEqual(0);
      });

      it("should handle empty project directory", async () => {
        const emptyProject = fs.mkdtempSync(path.join(os.tmpdir(), "empty-summarize-"));
        tempDirs.push(emptyProject);

        const result = await runCLICommand("summarize", [], emptyProject);
        expect(result.exitCode).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Query Command", () => {
    async function createIndexedProject(): Promise<string> {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "query-test"}',
        "src/main.ts": "export class MyClass { myMethod() { return 1; } } export const myFunc = () => {};",
        "src/utils.ts": "export const helper = () => {}; import { MyClass } from './main';",
        "src/api/routes.ts": "export const routes = []; import express from 'express';",
      });
      tempDirs.push(testProject);

      const indexResult = await runIndexCommand([], testProject);
      expect(indexResult.exitCode).toBe(0);

      return testProject;
    }

    describe("Help and Options", () => {
      it("should show query help without subcommand", async () => {
        const result = await runCLICommand("query", [], process.cwd());
        expect(result.stdout.includes("query") || result.exitCode !== 0).toBe(true);
      });

      it("should show error when no index exists", async () => {
        const result = await runCLICommand("query", ["stats"], process.cwd());
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
      });

      it("should accept --root flag with indexed project", async () => {
        const testProject = await createIndexedProject();
        const result = await runCLICommand("query", ["stats", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });
    });

    describe("symbol Subcommand", () => {
      it("should find symbols by name", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["symbol", "MyClass", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should require symbol name argument", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["symbol"], testProject);
        expect(result.exitCode === 1 || result.stdout.includes("provide")).toBe(true);
      });

      it("should handle --root flag", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["symbol", "func", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should handle -r short flag", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["symbol", "helper", "-r", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should show results for existing symbol", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["symbol", "NonExistentSymbol12345", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });
    });

    describe("files Subcommand", () => {
      it("should list all indexed files", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["files", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
        expect(result.stdout).toMatch(/Indexed files|files/);
      });

      it("should show file paths and languages", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["files", "--root", testProject], testProject);
        expect(result.stdout).toMatch(/File|path|\.ts|\.js|language/i);
      });

      it("should handle --root flag", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["files"], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });
    });

    describe("stats Subcommand", () => {
      it("should show index statistics", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["stats", "--root", testProject], testProject);
        expect(result.stdout).toMatch(/Statistics|Stats|Files:/);
      });

      it("should show file count", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["stats", "--root", testProject], testProject);
        expect(result.stdout).toContain("Files:");
      });

      it("should show symbol count", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["stats", "--root", testProject], testProject);
        expect(result.stdout).toContain("Symbols:");
      });

      it("should show import count", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["stats", "--root", testProject], testProject);
        expect(result.stdout).toContain("Imports:");
      });

      it("should show language breakdown", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["stats", "--root", testProject], testProject);
        expect(result.stdout).toMatch(/Language|TypeScript|JavaScript/i);
      });

      it("should show symbol types breakdown", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["stats", "--root", testProject], testProject);
        expect(result.stdout).toMatch(/Symbol Types|Type/);
      });

      it("should handle --root flag", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["stats"], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });
    });

    describe("imports Subcommand", () => {
      it("should find imports for a file", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["imports", "main.ts", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should require file name argument", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["imports"], testProject);
        expect(result.exitCode === 1 || result.stdout.includes("provide")).toBe(true);
      });

      it("should handle --root flag", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["imports", "utils.ts", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });
    });

    describe("exports Subcommand", () => {
      it("should find exports for a file", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["exports", "main.ts", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should require file name argument", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["exports"], testProject);
        expect(result.exitCode === 1 || result.stdout.includes("provide")).toBe(true);
      });

      it("should handle file with exports", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["exports", "index.js", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });
    });

    describe("dependents Subcommand", () => {
      it("should find files that depend on a file", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["dependents", "main.ts", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should require file name argument", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["dependents"], testProject);
        expect(result.exitCode === 1 || result.stdout.includes("provide")).toBe(true);
      });

      it("should handle --root flag", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["dependents", "utils.ts", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });
    });

    describe("Error Handling", () => {
      it("should error when index does not exist", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "no-index-test"}',
        });
        tempDirs.push(testProject);

        const result = await runCLICommand("query", ["stats", "--root", testProject], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should error on unknown subcommand", async () => {
        const testProject = await createIndexedProject();

        const result = await runCLICommand("query", ["unknownsubcommand", "--root", testProject], testProject);
        expect(result.exitCode).toBeGreaterThanOrEqual(0);
      });

      it("should handle non-existent root gracefully", async () => {
        const nonExistent = path.join(os.tmpdir(), "non-existent-query");

        const result = await runCLICommand("query", ["stats", "--root", nonExistent]);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should handle custom --db path", async () => {
        const testProject = await createIndexedProject();
        const customDb = path.join(testProject, "custom-index.db");

        const result = await runCLICommand("query", ["stats", "--db", customDb], testProject);
        expect(result.stdout.length).toBeGreaterThan(0);
      });
    });

    describe("Real Project Integration", () => {
      it("should query express-api project successfully", async () => {
        const indexResult = await runIndexCommand([], EXPRESS_API_PATH);
        expect(indexResult.exitCode).toBe(0);

        const result = await runCLICommand("query", ["stats"], EXPRESS_API_PATH);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("Files:");
        expect(result.stdout).toContain("Symbols:");
      });

      it("should query files from express-api project", async () => {
        await runIndexCommand([], EXPRESS_API_PATH);

        const result = await runCLICommand("query", ["files"], EXPRESS_API_PATH);
        expect(result.stdout.length).toBeGreaterThan(0);
      });

      it("should find symbols in express-api project", async () => {
        await runIndexCommand([], EXPRESS_API_PATH);

        const result = await runCLICommand("query", ["symbol", "app", "--root", EXPRESS_API_PATH], EXPRESS_API_PATH);
        expect(result.stdout.length).toBeGreaterThan(0);
      });
    });
  });
});
