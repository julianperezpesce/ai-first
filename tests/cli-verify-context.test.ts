import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";

const PROJECT_ROOT = process.cwd();
const CLI_PATH = path.join(PROJECT_ROOT, "dist/commands/ai-first.js");

async function runCLI(args: string[], cwd: string = PROJECT_ROOT, timeoutMs: number = 60000) {
  return new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
    const child = spawn("node", [CLI_PATH, ...args], { cwd, stdio: "pipe" });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, exitCode: 124 });
    }, timeoutMs);

    child.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: stderr + error.message, exitCode: 1 });
    });
  });
}

function parseJsonOutput(stdout: string) {
  return JSON.parse(stdout.slice(stdout.indexOf("{")));
}

function createProject(files: Record<string, string>) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "af-verify-context-"));
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }
  return rootDir;
}

describe("CLI verify ai-context", () => {
  let tempDirs: string[] = [];

  beforeEach(() => {
    tempDirs = [];
  });

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("passes for freshly generated context", async () => {
    const rootDir = createProject({
      "package.json": JSON.stringify({
        name: "verify-demo",
        type: "module",
        scripts: { test: "vitest run" },
        devDependencies: { vitest: "^4.0.0" },
      }),
      "src/index.ts": "export const answer = 42;\n",
      "tests/index.test.ts": "import { expect, it } from 'vitest';\nit('works', () => expect(true).toBe(true));\n",
    });
    tempDirs.push(rootDir);
    const outputDir = path.join(rootDir, "ai-context");

    const init = await runCLI(["init", "--root", rootDir, "--output", outputDir, "--json"]);
    expect(init.exitCode).toBe(0);

    const verify = await runCLI(["verify", "ai-context", "--root", rootDir, "--output", outputDir, "--json"]);
    expect(verify.exitCode).toBe(0);
    const result = parseJsonOutput(verify.stdout);
    expect(result.status).toBe("trusted");
    expect(result.score).toBe(100);
  });

  it("fails when generated context is stale", async () => {
    const rootDir = createProject({
      "package.json": JSON.stringify({ name: "stale-demo", type: "module" }),
      "src/index.ts": "export const answer = 42;\n",
    });
    tempDirs.push(rootDir);
    const outputDir = path.join(rootDir, "ai-context");

    const init = await runCLI(["init", "--root", rootDir, "--output", outputDir, "--json"]);
    expect(init.exitCode).toBe(0);

    fs.writeFileSync(path.join(rootDir, "src/index.ts"), "export const answer = 43;\n");

    const verify = await runCLI(["verify", "ai-context", "--root", rootDir, "--output", outputDir, "--json"]);
    expect(verify.exitCode).toBe(1);
    const result = parseJsonOutput(verify.stdout);
    expect(result.status).not.toBe("trusted");
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "context-freshness",
          status: "fail",
        }),
      ])
    );
  });

  it("fails when context is missing", async () => {
    const rootDir = createProject({
      "package.json": JSON.stringify({ name: "missing-demo", type: "module" }),
      "src/index.ts": "export const answer = 42;\n",
    });
    tempDirs.push(rootDir);
    const outputDir = path.join(rootDir, "missing-ai-context");

    const verify = await runCLI(["verify", "ai-context", "--root", rootDir, "--output", outputDir, "--json"]);
    expect(verify.exitCode).toBe(1);
    const result = parseJsonOutput(verify.stdout);
    expect(result.status).toBe("untrusted");
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "manifest-present",
          status: "fail",
        }),
      ])
    );
  });
});
