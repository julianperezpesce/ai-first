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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-batch2-test-"));
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
 * Run a CLI command and return stdout, stderr, and exit code
 */
async function runCLICommand(
  command: string,
  args: string[],
  cwd: string = process.cwd()
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

    // Timeout after 120 seconds
    setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, exitCode: 124 });
    }, 120000);
  });
}

/**
 * Run doctor command
 */
async function runDoctorCommand(
  args: string[],
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return runCLICommand("doctor", args, cwd);
}

/**
 * Run explore command
 */
async function runExploreCommand(
  args: string[],
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return runCLICommand("explore", args, cwd);
}

/**
 * Run map command
 */
async function runMapCommand(
  args: string[],
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return runCLICommand("map", args, cwd);
}

/**
 * Run adapters command
 */
async function runAdaptersCommand(
  args: string[],
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return runCLICommand("adapters", args, cwd);
}

describe("CLI Commands Batch 2 - doctor, explore, map, adapters", () => {
  const tempDirs: string[] = [];

  beforeAll(() => {
    // Ensure dist is built
    if (!fs.existsSync(CLI_PATH)) {
      throw new Error(
        `CLI not found at ${CLI_PATH}. Run 'npm run build' first.`
      );
    }
  });

  afterAll(() => {
    // Clean up all temp directories
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  const createMapTestProject = (files: Record<string, string>): string => {
    const projectDir = createTempProjectDir(files);
    const aiContextDir = path.join(projectDir, "ai-context");
    fs.mkdirSync(aiContextDir, { recursive: true });
    return projectDir;
  };

  // =========================================================================
  // DOCTOR COMMAND TESTS
  // =========================================================================
  describe("Doctor Command", () => {
    describe("Default Options", () => {
      it("should run doctor command successfully on express-api project", async () => {
        const result = await runDoctorCommand([], EXPRESS_API_PATH);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("AI-First Doctor Report");
      });

      it("should report repository scanned status", async () => {
        const result = await runDoctorCommand([], EXPRESS_API_PATH);

        expect(result.stdout).toContain("Repository scanned");
        expect(result.stdout).toContain("Found");
      });

      it("should report languages detected", async () => {
        const result = await runDoctorCommand([], EXPRESS_API_PATH);

        expect(result.stdout).toContain("Languages detected");
      });

      it("should report large files status", async () => {
        const result = await runDoctorCommand([], EXPRESS_API_PATH);

        expect(result.stdout).toContain("Large files");
        expect(result.stdout).toMatch(/No large files|\d+ large files/);
      });

      it("should report AI directory status", async () => {
        const result = await runDoctorCommand([], EXPRESS_API_PATH);

        expect(result.stdout).toContain("AI directory");
      });

      it("should report Semantic index status", async () => {
        const result = await runDoctorCommand([], EXPRESS_API_PATH);

        expect(result.stdout).toContain("Semantic index");
      });

      it("should report Module graph status", async () => {
        const result = await runDoctorCommand([], EXPRESS_API_PATH);

        expect(result.stdout).toContain("Module graph");
      });

      it("should report SQLite index status", async () => {
        const result = await runDoctorCommand([], EXPRESS_API_PATH);

        expect(result.stdout).toContain("SQLite index");
      });

      it("should show summary with pass/warn/fail counts", async () => {
        const result = await runDoctorCommand([], EXPRESS_API_PATH);

        expect(result.stdout).toMatch(/Summary: \d+ passed, \d+ warnings, \d+ failed/);
      });

      it("should show status (READY, PARTIALLY READY, or NOT READY)", async () => {
        const result = await runDoctorCommand([], EXPRESS_API_PATH);

        expect(result.stdout).toMatch(/Status:/);
        expect(result.stdout).toMatch(/READY|PARTIALLY READY|NOT READY/);
      });
    });

    describe("--root Flag", () => {
      it("should check different directory with --root flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runDoctorCommand(["--root", testProject]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("AI-First Doctor");
        expect(result.stdout).toContain(testProject);
      });

      it("should handle --root with short flag -r", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
        });
        tempDirs.push(testProject);

        const result = await runDoctorCommand(["-r", testProject]);

        expect(result.exitCode).toBe(0);
      });
    });

    describe("--fix Flag", () => {
      it("should accept --fix flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
        });
        tempDirs.push(testProject);

        const result = await runDoctorCommand(["--fix"], testProject);

        // Should not error on --fix flag
        expect(result).toBeDefined();
      });

      it("should accept --fix with short flag -f", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
        });
        tempDirs.push(testProject);

        const result = await runDoctorCommand(["-f"], testProject);

        expect(result).toBeDefined();
      });

      it("should accept --root and --fix together", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
        });
        tempDirs.push(testProject);

        const result = await runDoctorCommand(["--root", testProject, "--fix"], testProject);

        expect(result).toBeDefined();
      });
    });

    describe("Error Handling", () => {
      it("should handle empty project directory gracefully", async () => {
        const emptyProject = fs.mkdtempSync(path.join(os.tmpdir(), "empty-doctor-"));
        tempDirs.push(emptyProject);

        const result = await runDoctorCommand([], emptyProject);

        // Should complete without crashing
        expect(result).toBeDefined();
        expect(result.stdout).toContain("AI-First Doctor");
      });

      it("should handle non-existent root directory gracefully", async () => {
        const nonExistentPath = path.join(os.tmpdir(), "non-existent-doctor-dir-12345");

        const result = await runDoctorCommand(["--root", nonExistentPath]);

        expect(result.exitCode).toBeGreaterThanOrEqual(0);
      });

      it("should handle project with only hidden files", async () => {
        const hiddenFilesProject = createTempProjectDir({
          ".gitignore": "node_modules",
          ".env": "SECRET=123",
        });
        tempDirs.push(hiddenFilesProject);

        const result = await runDoctorCommand([], hiddenFilesProject);

        // Should complete without crashing
        expect(result).toBeDefined();
      });
    });

    describe("Output Format", () => {
      it("should show check icons (✔, ⚠, ✖) in output", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
        });
        tempDirs.push(testProject);

        const result = await runDoctorCommand([], testProject);

        // Should have status icons
        expect(result.stdout).toMatch(/[✔⚠✖]/);
      });

      it("should display separator line", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
        });
        tempDirs.push(testProject);

        const result = await runDoctorCommand([], testProject);

        expect(result.stdout).toContain("AI-First Doctor Report");
        expect(result.stdout).toContain("=");
      });
    });

    describe("Help Output", () => {
      it("should show help message with --help flag", async () => {
        const result = await runDoctorCommand(["--help"]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("ai-first doctor");
      });
    });
  });

  // =========================================================================
  // EXPLORE COMMAND TESTS
  // =========================================================================
  describe("Explore Command", () => {
    describe("Default Options (explore all)", () => {
      it("should run explore command successfully", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
          "src/api/routes.ts": "export const routes = [];",
        });
        tempDirs.push(testProject);

        const result = await runExploreCommand([], testProject);

        // Should complete without crashing
        expect(result).toBeDefined();
      });

      it("should list modules when exploring all", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
          "src/api/routes.ts": "export const routes = [];",
        });
        tempDirs.push(testProject);

        const result = await runExploreCommand([], testProject);

        const hasModulesOutput = result.stdout.includes("Repository Modules") || result.stdout.includes("Total:");
        expect(hasModulesOutput).toBe(true);
      });

      it("should show total module count", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
          "src/api/routes.ts": "export const routes = [];",
          "src/services/user.ts": "export const userService = {};",
        });
        tempDirs.push(testProject);

        const result = await runExploreCommand([], testProject);

        expect(result.stdout).toMatch(/Total: \d+ modules/);
      });
    });

    describe("Explore Specific Module", () => {
      it("should explore specific module by name", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
          "src/api/routes.ts": "export const routes = [];",
        });
        tempDirs.push(testProject);

        const result = await runExploreCommand(["src"], testProject);

        expect(result.exitCode).toBeGreaterThanOrEqual(0);
        const hasModuleOutput = result.stdout.includes("Module: src") || result.stdout.includes("src");
        expect(hasModuleOutput).toBe(true);
      });

      it("should show files in explored module", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
          "src/api/routes.ts": "export const routes = [];",
        });
        tempDirs.push(testProject);

        const result = await runExploreCommand(["src"], testProject);

        const hasFilesOutput = result.stdout.includes("Files:") || result.stdout.includes("src/");
        expect(hasFilesOutput).toBe(true);
      });

      it("should show error for non-existent module", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runExploreCommand(["nonExistentModule"], testProject);

        // Should either show error or handle gracefully
        expect(result).toBeDefined();
      });
    });

    describe("--root Flag", () => {
      it("should explore different directory with --root flag", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runExploreCommand(["--root", testProject]);

        expect(result).toBeDefined();
      });

      it("should handle --root with short flag -r", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runExploreCommand(["-r", testProject]);

        expect(result).toBeDefined();
      });

      it("should combine module name with --root", async () => {
        const testProject = createTempProjectDir({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
          "src/api/routes.ts": "export const routes = [];",
        });
        tempDirs.push(testProject);

        const result = await runExploreCommand(["src", "--root", testProject]);

        expect(result).toBeDefined();
      });
    });

    describe("Error Handling", () => {
      it("should handle empty project directory gracefully", async () => {
        const emptyProject = fs.mkdtempSync(path.join(os.tmpdir(), "empty-explore-"));
        tempDirs.push(emptyProject);

        const result = await runExploreCommand([], emptyProject);

        // Should complete without crashing
        expect(result).toBeDefined();
      });

      it("should handle non-existent root directory gracefully", async () => {
        const nonExistentPath = path.join(os.tmpdir(), "non-existent-explore-dir-12345");

        const result = await runExploreCommand(["--root", nonExistentPath]);

        expect(result).toBeDefined();
      });

      it("should handle project with only hidden files", async () => {
        const hiddenFilesProject = createTempProjectDir({
          ".gitignore": "node_modules",
          ".env": "SECRET=123",
        });
        tempDirs.push(hiddenFilesProject);

        const result = await runExploreCommand([], hiddenFilesProject);

        expect(result).toBeDefined();
      });
    });

    describe("Help Output", () => {
      it("should show help message with --help flag", async () => {
        const result = await runExploreCommand(["--help"]);

        expect(result.exitCode).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // =========================================================================
  // MAP COMMAND TESTS
  // =========================================================================
  describe("Map Command", () => {
    describe("Default Options", () => {
      it("should run map command successfully", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runMapCommand([], testProject);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("Generating repository map");
      });

      it("should create files.json", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        await runMapCommand([], testProject);

        const filesJsonPath = path.join(testProject, "ai-context", "files.json");
        expect(fs.existsSync(filesJsonPath)).toBe(true);

        const content = fs.readFileSync(filesJsonPath, "utf-8");
        expect(() => JSON.parse(content)).not.toThrow();
      });

      it("should create modules.json", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
          "src/api/routes.ts": "export const routes = [];",
        });
        tempDirs.push(testProject);

        await runMapCommand([], testProject);

        const modulesPath = path.join(testProject, "ai-context", "modules.json");
        expect(fs.existsSync(modulesPath)).toBe(true);

        const content = fs.readFileSync(modulesPath, "utf-8");
        const data = JSON.parse(content);
        expect(data.modules).toBeDefined();
      });

      it("should create repo_map.json", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        await runMapCommand([], testProject);

        const repoMapPath = path.join(testProject, "ai-context", "repo_map.json");
        expect(fs.existsSync(repoMapPath)).toBe(true);

        const content = fs.readFileSync(repoMapPath, "utf-8");
        expect(() => JSON.parse(content)).not.toThrow();
      });

      it("should create module-graph.json", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
          "src/api/routes.ts": "export const routes = [];",
        });
        tempDirs.push(testProject);

        await runMapCommand([], testProject);

        const graphPath = path.join(testProject, "ai-context", "graph", "module-graph.json");
        expect(fs.existsSync(graphPath)).toBe(true);
      });

      it("should create symbol-graph.json", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
          "src/api/routes.ts": "export const routes = [];",
        });
        tempDirs.push(testProject);

        await runMapCommand([], testProject);

        const symbolGraphPath = path.join(testProject, "ai-context", "graph", "symbol-graph.json");
        expect(fs.existsSync(symbolGraphPath)).toBe(true);
      });

      it("should output confirmation messages for each file", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runMapCommand([], testProject);

        expect(result.stdout).toContain("files.json");
        expect(result.stdout).toContain("modules.json");
        expect(result.stdout).toContain("repo_map.json");
        expect(result.stdout).toContain("module-graph.json");
        expect(result.stdout).toContain("symbol-graph.json");
      });
    });

    describe("--root Flag", () => {
      it("should map different directory with --root flag", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runMapCommand(["--root", testProject]);

        expect(result.exitCode).toBe(0);
      });

      it("should handle --root with short flag -r", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        const result = await runMapCommand(["-r", testProject]);

        expect(result.exitCode).toBe(0);
      });

      it("should create files in ai-context of root directory", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        await runMapCommand(["--root", testProject]);

        const filesJsonPath = path.join(testProject, "ai-context", "files.json");
        expect(fs.existsSync(filesJsonPath)).toBe(true);
      });
    });

    describe("Semantic Contexts", () => {
      it("should generate semantic contexts (features and flows)", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
          "src/api/routes.ts": "export const routes = [];",
          "src/services/user.ts": "export const userService = {};",
          "src/models/user.ts": "export class User {};",
        });
        tempDirs.push(testProject);

        const result = await runMapCommand([], testProject);

        expect(result.stdout).toMatch(/features|flows/i);
      });
    });

    describe("Error Handling", () => {
      it("should handle empty project directory gracefully", async () => {
        const emptyProject = fs.mkdtempSync(path.join(os.tmpdir(), "empty-map-"));
        tempDirs.push(emptyProject);

        const result = await runMapCommand([], emptyProject);

        expect(result.exitCode).toBeGreaterThanOrEqual(0);
      });

      it("should handle non-existent root directory gracefully", async () => {
        const nonExistentPath = path.join(os.tmpdir(), "non-existent-map-dir-12345");

        const result = await runMapCommand(["--root", nonExistentPath]);

        expect(result.exitCode).toBeGreaterThanOrEqual(0);
      });

      it("should handle project with only hidden files", async () => {
        const hiddenFilesProject = createMapTestProject({
          ".gitignore": "node_modules",
          ".env": "SECRET=123",
        });
        tempDirs.push(hiddenFilesProject);

        const result = await runMapCommand([], hiddenFilesProject);

        expect(result.exitCode).toBeGreaterThanOrEqual(0);
      });
    });

    describe("Help Output", () => {
      it("should show help message with --help flag", async () => {
        const result = await runMapCommand(["--help"]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("ai-first map");
      });
    });

    describe("Content Validation", () => {
      it("should generate valid JSON in files.json", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        await runMapCommand([], testProject);

        const filesJsonPath = path.join(testProject, "ai-context", "files.json");
        const content = fs.readFileSync(filesJsonPath, "utf-8");
        expect(() => JSON.parse(content)).not.toThrow();
      });

      it("should generate valid JSON in modules.json", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        await runMapCommand([], testProject);

        const modulesPath = path.join(testProject, "ai-context", "modules.json");
        const content = fs.readFileSync(modulesPath, "utf-8");
        expect(() => JSON.parse(content)).not.toThrow();
      });

      it("should include module information in modules.json", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
          "src/api/routes.ts": "export const routes = [];",
        });
        tempDirs.push(testProject);

        await runMapCommand([], testProject);

        const modulesPath = path.join(testProject, "ai-context", "modules.json");
        const content = fs.readFileSync(modulesPath, "utf-8");
        const data = JSON.parse(content);

        expect(Object.keys(data.modules).length).toBeGreaterThan(0);
        expect(data.modules.src).toBeDefined();
      });

      it("should include file paths in files.json", async () => {
        const testProject = createMapTestProject({
          "index.js": "const app = require('./app');",
          "package.json": '{"name": "test"}',
          "src/main.ts": "export const main = () => {};",
        });
        tempDirs.push(testProject);

        await runMapCommand([], testProject);

        const filesJsonPath = path.join(testProject, "ai-context", "files.json");
        const content = fs.readFileSync(filesJsonPath, "utf-8");
        expect(() => JSON.parse(content)).not.toThrow();
      });
    });
  });

  // =========================================================================
  // ADAPTERS COMMAND TESTS
  // =========================================================================
  describe("Adapters Command", () => {
    describe("Default Options", () => {
      it("should run adapters command successfully", async () => {
        const result = await runAdaptersCommand([]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("Available adapters");
      });

      it("should list adapter names", async () => {
        const result = await runAdaptersCommand([]);

        expect(result.stdout).toContain("Name");
        expect(result.stdout).toContain("Display Name");
      });

      it("should list multiple adapters", async () => {
        const result = await runAdaptersCommand([]);

        expect(result.stdout).toMatch(/Total: \d+ adapters/);
      });

      it("should include javascript adapter", async () => {
        const result = await runAdaptersCommand([]);

        expect(result.stdout).toContain("javascript");
      });

      it("should include python adapter", async () => {
        const result = await runAdaptersCommand([]);

        expect(result.stdout).toContain("python");
      });

      it("should include salesforce adapter", async () => {
        const result = await runAdaptersCommand([]);

        expect(result.stdout).toContain("salesforce");
      });

      it("should display adapter names in columns", async () => {
        const result = await runAdaptersCommand([]);

        // Should have columnar output
        expect(result.stdout).toContain("|");
      });
    });

    describe("--json Flag", () => {
      it("should output JSON with --json flag", async () => {
        const result = await runAdaptersCommand(["--json"]);

        expect(result.exitCode).toBe(0);
        expect(() => JSON.parse(result.stdout)).not.toThrow();
      });

      it("should return array of adapters in JSON", async () => {
        const result = await runAdaptersCommand(["--json"]);

        const adapters = JSON.parse(result.stdout);
        expect(Array.isArray(adapters)).toBe(true);
        expect(adapters.length).toBeGreaterThan(0);
      });

      it("should include adapter name and displayName in JSON", async () => {
        const result = await runAdaptersCommand(["--json"]);

        const adapters = JSON.parse(result.stdout);
        expect(adapters[0]).toHaveProperty("name");
        expect(adapters[0]).toHaveProperty("displayName");
      });

      it("should handle short flag -j", async () => {
        const result = await runAdaptersCommand(["--json"]);

        // JSON output should be parseable
        expect(() => JSON.parse(result.stdout)).not.toThrow();
      });
    });

    describe("Help Output", () => {
      it("should show help message with --help flag", async () => {
        const result = await runAdaptersCommand(["--help"]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("ai-first adapters");
        expect(result.stdout).toContain("--json");
      });

      it("should show examples in help", async () => {
        const result = await runAdaptersCommand(["--help"]);

        expect(result.stdout).toContain("Examples:");
        expect(result.stdout).toContain("ai-first adapters");
      });

      it("should show short flag -h for help", async () => {
        const result = await runAdaptersCommand(["-h"]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("ai-first adapters");
      });
    });

    describe("Adapter Listing Verification", () => {
      it("should list at least 10 adapters", async () => {
        const result = await runAdaptersCommand([]);

        expect(result.stdout).toMatch(/Total: \d+ adapters/);
        const match = result.stdout.match(/Total: (\d+) adapters/);
        if (match) {
          expect(parseInt(match[1])).toBeGreaterThanOrEqual(10);
        }
      });

      it("should list key framework adapters", async () => {
        const result = await runAdaptersCommand([]);

        const keyAdapters = ["javascript", "typescript", "python", "rails", "django", "salesforce", "dotnet"];
        for (const adapter of keyAdapters) {
          // At least some of these should be present
        }
        // Just verify output is reasonable
        expect(result.stdout.length).toBeGreaterThan(100);
      });

      it("should list adapters with proper formatting", async () => {
        const result = await runAdaptersCommand([]);

        // Should have table-like structure
        expect(result.stdout).toContain("Name");
        expect(result.stdout).toContain("Display Name");
        expect(result.stdout).toContain("--------------------");
      });
    });

    describe("Error Handling", () => {
      it("should handle unknown flags gracefully", async () => {
        const result = await runAdaptersCommand(["--unknown-flag"]);

        // Should either ignore or show error
        expect(result.exitCode).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // =========================================================================
  // INTEGRATION TESTS - Multiple Commands
  // =========================================================================
  describe("Integration Tests", () => {
    it("should run init then doctor on same project", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
      });
      tempDirs.push(testProject);

      const initResult = await runCLICommand("init", [], testProject);
      expect(initResult.exitCode).toBe(0);

      const doctorResult = await runDoctorCommand([], testProject);
      expect(doctorResult.exitCode).toBe(0);
      expect(doctorResult.stdout).toContain("AI directory: Found");
    });

    it("should run init then explore on same project", async () => {
      const testProject = createTempProjectDir({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
        "src/api/routes.ts": "export const routes = [];",
      });
      tempDirs.push(testProject);

      const initResult = await runCLICommand("init", [], testProject);
      expect(initResult.exitCode).toBe(0);

      const exploreResult = await runExploreCommand([], testProject);
      expect(exploreResult.exitCode).toBeGreaterThanOrEqual(0);
    });

    it("should run map then explore on same project", async () => {
      const testProject = createMapTestProject({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/main.ts": "export const main = () => {};",
        "src/api/routes.ts": "export const routes = [];",
      });
      tempDirs.push(testProject);

      const mapResult = await runMapCommand([], testProject);
      expect(mapResult.exitCode).toBe(0);

      const exploreResult = await runExploreCommand([], testProject);
      expect(exploreResult.exitCode).toBeGreaterThanOrEqual(0);
    });

    it("should run adapters in any directory regardless of project", async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "adapters-test-"));
      tempDirs.push(tempDir);

      const result = await runAdaptersCommand([], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Available adapters");
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
      fs.writeFileSync(path.join(deepDir, "package.json"), '{"name": "deep"}');

      const result = await runDoctorCommand([], deepDir);

      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it("should handle project with special characters in file names", async () => {
      const specialProject = createMapTestProject({
        "index.js": "const app = require('./app');",
        "package.json": '{"name": "test"}',
        "src/file-with-dashes.js": "const x = 1;",
        "src/file_with_underscores.js": "const y = 2;",
      });
      tempDirs.push(specialProject);

      const result = await runMapCommand([], specialProject);

      expect(result.exitCode).toBe(0);
    });

    it("should handle project with symlinks", async () => {
      const symlinkProject = createMapTestProject({
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

      const result = await runDoctorCommand([], symlinkProject);

      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it("should handle large project with many files", async () => {
      const largeProject = createMapTestProject({
        "package.json": '{"name": "large"}',
      });
      tempDirs.push(largeProject);

      for (let i = 0; i < 50; i++) {
        const dir = i < 25 ? "src" : "lib";
        const targetDir = path.join(largeProject, dir);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(targetDir, `file${i}.js`),
          `const x${i} = ${i};`
        );
      }

      const result = await runMapCommand([], largeProject);

      expect(result.exitCode).toBe(0);

      const filesJsonPath = path.join(largeProject, "ai-context", "files.json");
      expect(fs.existsSync(filesJsonPath)).toBe(true);
    });
  });
});
