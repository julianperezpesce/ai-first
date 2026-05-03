import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

const PROJECT_ROOT = process.cwd();
const CLI_PATH = path.join(PROJECT_ROOT, "dist/commands/ai-first.js");
const EXPRESS_API_PATH = path.join(PROJECT_ROOT, "fixtures/express-api");

async function runCLI(args: string[], cwd: string = process.cwd(), timeoutMs: number = 60000) {
  return new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
    const child = spawn("node", [CLI_PATH, ...args], { cwd, stdio: "pipe" });
    let stdout = "", stderr = "";
    child.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
    const timer = setTimeout(() => { child.kill(); resolve({ stdout, stderr, exitCode: 1 }); }, timeoutMs);
    child.on("close", (code) => { clearTimeout(timer); resolve({ stdout, stderr, exitCode: code ?? 0 }); });
  });
}

describe("New CLI Features (v1.4.0+)", () => {
  let tempDir: string;

  beforeAll(() => { tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "af-new-features-")); });
  afterAll(() => { try { fs.rmSync(tempDir, { recursive: true }); } catch {} });

  describe("--json output", () => {
    it("should output valid JSON", async () => {
      const result = await runCLI(["init", "--root", EXPRESS_API_PATH, "--json", "--output", tempDir]);
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.split("\n").filter(l => l.startsWith("{")).pop() || "{}");
      expect(json.success).toBe(true);
      expect(Array.isArray(json.filesCreated)).toBe(true);
    });
  });

  describe("--diff output", () => {
    it("should show context diff", async () => {
      const result = await runCLI(["init", "--root", EXPRESS_API_PATH, "--diff", "--output", path.join(tempDir, "diff-test")]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Context Diff");
    });
  });

  describe("doctor command", () => {
    it("should run doctor with enhanced checks", async () => {
      const result = await runCLI(["doctor", "--root", EXPRESS_API_PATH]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Repository scanned");
      expect(result.stdout).toContain("Languages detected");
      expect(result.stdout).toContain("Large files");
      expect(result.stdout).toContain("AI directory");
      expect(result.stdout).toContain("SQLite index");
    });

    it("should show test coverage check", async () => {
      const result = await runCLI(["doctor", "--root", EXPRESS_API_PATH]);
      expect(result.stdout).toContain("Test coverage");
    });

    it("should show dependencies check", async () => {
      const result = await runCLI(["doctor", "--root", EXPRESS_API_PATH]);
      expect(result.stdout).toContain("Dependencies");
    });
  });

  describe("pr-description command", () => {
    it("should generate PR description", async () => {
      const result = await runCLI(["pr-description", "--from", "HEAD~3"], PROJECT_ROOT);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Commits");
      expect(result.stdout).toContain("Files Changed");
    });
  });
});
