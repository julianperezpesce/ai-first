import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { execSync } from "child_process";

const PROJECT_ROOT = process.cwd();
const CLI_PATH = path.join(PROJECT_ROOT, "dist/commands/ai-first.js");

function createTempProjectDir(files: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-mcp-test-"));
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

function runInitCommand(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
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

    setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, exitCode: 124 });
    }, 60000);
  });
}

describe("CLI MCP Install", () => {
  const tempDirs: string[] = [];

  afterAll(() => {
    for (const dir of tempDirs) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {}
    }
  });

  describe("--install-mcp flag", () => {
    it("should create .opencode/mcp.json when --install-mcp is used", async () => {
      const tempDir = createTempProjectDir({
        "package.json": '{"name": "test-project"}',
        "src/index.js": "console.log('hello');",
      });
      tempDirs.push(tempDir);

      const result = await runInitCommand(["--install-mcp"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("MCP server configured");

      const mcpConfigPath = path.join(tempDir, ".opencode", "mcp.json");
      expect(fs.existsSync(mcpConfigPath)).toBe(true);

      const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
      expect(mcpConfig.mcpServers["ai-first"]).toBeDefined();
      expect(mcpConfig.mcpServers["ai-first"].command).toBe("af");
      expect(mcpConfig.mcpServers["ai-first"].args).toContain("mcp");
    });

    it("should create .opencode directory if it does not exist", async () => {
      const tempDir = createTempProjectDir({
        "package.json": '{"name": "test-project"}',
      });
      tempDirs.push(tempDir);

      expect(fs.existsSync(path.join(tempDir, ".opencode"))).toBe(false);

      await runInitCommand(["--install-mcp"], tempDir);

      expect(fs.existsSync(path.join(tempDir, ".opencode"))).toBe(true);
    });

    it("should not create .opencode/mcp.json when --install-mcp is not used", async () => {
      const tempDir = createTempProjectDir({
        "package.json": '{"name": "test-project"}',
      });
      tempDirs.push(tempDir);

      await runInitCommand([], tempDir);

      const mcpConfigPath = path.join(tempDir, ".opencode", "mcp.json");
      expect(fs.existsSync(mcpConfigPath)).toBe(false);
    });

    it("should work with --mcp alias", async () => {
      const tempDir = createTempProjectDir({
        "package.json": '{"name": "test-project"}',
      });
      tempDirs.push(tempDir);

      const result = await runInitCommand(["--mcp"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("MCP server configured");
    });

    it("should create valid MCP config for OpenCode", async () => {
      const tempDir = createTempProjectDir({
        "package.json": '{"name": "test-project"}',
        "src/app.ts": "const app = {};",
      });
      tempDirs.push(tempDir);

      await runInitCommand(["--install-mcp"], tempDir);

      const mcpConfigPath = path.join(tempDir, ".opencode", "mcp.json");
      const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));

      expect(mcpConfig.mcpServers["ai-first"]).toEqual({
        command: "af",
        args: ["mcp"],
        autoConnect: true,
      });
    });
  });

  describe("MCP command", () => {
    it("should start MCP server when 'mcp' command is used", async () => {
      const tempDir = createTempProjectDir({
        "package.json": '{"name": "test-project"}',
        "src/index.ts": "console.log('hello');",
      });
      tempDirs.push(tempDir);

      await runInitCommand(["--install-mcp"], tempDir);

      const mcpConfigPath = path.join(tempDir, ".opencode", "mcp.json");
      expect(fs.existsSync(mcpConfigPath)).toBe(true);
    });
  });
});
