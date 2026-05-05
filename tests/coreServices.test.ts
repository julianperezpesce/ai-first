import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { generateContext, getProjectBrief } from "../src/core/services/contextService.js";
import { runContextDoctor } from "../src/core/services/doctorService.js";
import { analyzeChanges } from "../src/core/services/gitService.js";
import { getContextForTask } from "../src/core/services/taskContextService.js";
import { evaluateQualityGates } from "../src/core/services/qualityGateService.js";
import { evaluateMcpHttpSafety, getMcpCompatibilityProfiles, getMcpDoctor, installMcpProfile } from "../src/core/services/mcpCompatibilityService.js";
import { isMcpHttpRequestAuthorized, startMCPHttpServer } from "../src/mcp/server.js";
import { understandTopic } from "../src/core/services/understandService.js";

const tempDirs: string[] = [];

function createTempRepo(files: Record<string, string>): string {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-services-"));
  tempDirs.push(rootDir);

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }

  return rootDir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("core services", () => {
  it("returns generated project brief when agent_brief.md exists", () => {
    const rootDir = createTempRepo({
      "ai-context/agent_brief.md": "# Agent Brief\n\nGenerated brief.\n",
    });

    const result = getProjectBrief(rootDir);

    expect(result.source).toBe("generated-file");
    expect(result.brief).toContain("Generated brief");
  });

  it("falls back to live project brief when generated brief is missing", () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({ name: "service-demo", scripts: { test: "vitest run" }, devDependencies: { vitest: "^4.0.0" } }),
      "src/index.ts": "export const answer = 42;\n",
    });

    const result = getProjectBrief(rootDir);

    expect(result.source).toBe("live-analysis");
    expect(result.brief).toContain("# Agent Brief");
    expect(result.brief).toContain("Vitest");
  });

  it("runs context doctor through shared service", () => {
    const rootDir = createTempRepo({
      "src/index.ts": "export const answer = 42;\n",
    });

    const result = runContextDoctor({ rootDir, strict: true });

    expect(result.ok).toBe(false);
    expect(result.freshness.fresh).toBe(false);
    expect(result.verification?.status).toBe("untrusted");
  });

  it("uses safe git argument arrays for change analysis and degrades outside git repos", () => {
    const rootDir = createTempRepo({
      "src/index.ts": "export const answer = 42;\n",
    });

    const result = analyzeChanges(rootDir, "HEAD~1");

    expect(result.range).toBe("HEAD~1..HEAD");
    expect(result.files).toEqual([]);
    expect(result.commits).toEqual([]);
  });

  it("generates full context through the shared context service", async () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({ name: "service-generate-demo", scripts: { test: "vitest run" }, devDependencies: { vitest: "^4.0.0" } }),
      "src/index.ts": "export const answer = 42;\n",
      "tests/index.test.ts": "import { expect, it } from 'vitest';\nit('works', () => expect(true).toBe(true));\n",
    });
    const outputDir = path.join(rootDir, "ai-context");

    const result = await generateContext({ rootDir, outputDir });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "ai_context.md"))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "context_manifest.json"))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "agent_brief.md"))).toBe(true);
    expect(result.filesCreated).toContain(path.join(outputDir, "context_manifest.json"));
  });

  it("returns task-specific context with files, tests, commands, risks and contracts", () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({ name: "task-demo", scripts: { build: "tsc", test: "vitest run" } }),
      "src/commands/ai-first.ts": "export function cli() { return true; }\n",
      "src/core/services/contextService.ts": "export function service() { return true; }\n",
      "tests/cli-command.test.ts": "import { expect, it } from 'vitest';\nit('works', () => expect(true).toBe(true));\n",
    });

    const context = getContextForTask(rootDir, "add CLI command");

    expect(context.kind).toBe("cli-command");
    expect(context.relevantFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "src/commands/ai-first.ts",
          confidence: 0.94,
        }),
      ])
    );
    expect(context.commands.map(command => command.command)).toContain("npm run build");
    expect(context.commands.map(command => command.command)).toContain("npm test");
    expect(context.contracts).toContain("CLI owns args, formatting and exit codes.");
    expect(context.evidence).toEqual(expect.arrayContaining(["classified task as cli-command"]));
  });

  it("understands a topic using search, task context, architecture, tests and evidence", () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({ name: "understand-demo", scripts: { build: "tsc", test: "vitest run" } }),
      "src/services/authService.ts": "export function loginUser(token: string) {\n  return token.startsWith('jwt');\n}\n",
      "tests/authService.test.ts": "import { expect, it } from 'vitest';\nit('login', () => expect(true).toBe(true));\n",
    });

    const result = understandTopic(rootDir, "auth login");

    expect(result.topic).toBe("auth login");
    expect(result.files).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "src/services/authService.ts" }),
    ]));
    expect(result.snippets).toEqual(expect.arrayContaining([
      expect.objectContaining({ file: "src/services/authService.ts" }),
    ]));
    expect(result.commands.map(command => command.command)).toContain("npm run build");
    expect(result.evidence).toEqual(expect.arrayContaining([
      expect.stringContaining("semantic search returned"),
      expect.stringContaining("task context classified"),
    ]));
  });

  it("evaluates quality gates for CI without running commands by default", () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({
        name: "quality-demo",
        version: "1.5.0",
        bin: { af: "dist/commands/ai-first.js" },
        files: ["dist/", "README.md"],
        scripts: { build: "tsc", test: "vitest run", "docs:build": "vitepress build docs", evaluate: "node evaluator", "evaluate:quick": "node evaluator --skip-ai" },
        optionalDependencies: { "ai-first-evaluator": "github:test/evaluator" },
      }),
      "dist/commands/ai-first.js": "#!/usr/bin/env node\n",
      "tsconfig.json": JSON.stringify({ compilerOptions: {} }),
      "README.md": "# Quality Demo\n",
      ".github/workflows/ci.yml": "steps:\n  - run: npm ci\n  - run: npm run build\n  - run: npm test\n",
      ".github/workflows/publish.yml": "permissions:\n  id-token: write\nsteps:\n  - run: npm run build\n  - run: npm test\n  - run: npm publish --provenance --access public\n",
      ".releaserc.json": JSON.stringify({ branches: ["master"], plugins: ["@semantic-release/npm", "@semantic-release/github"] }),
      "evaluator.config.json": JSON.stringify({ projects: [{ priority: "high" }], thresholds: { minimumScore: 3.5 } }),
      "src/mcp/server.ts": "export const server = true;\n",
    });

    const result = evaluateQualityGates({ rootDir });

    expect(result.gates).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "package-bin", status: "pass" }),
      expect.objectContaining({ id: "script-build", status: "pass" }),
      expect.objectContaining({ id: "script-test", status: "pass" }),
      expect.objectContaining({ id: "ci-workflow", status: "pass" }),
      expect.objectContaining({ id: "evaluator-setup", status: "pass" }),
      expect.objectContaining({ id: "release-config", status: "pass" }),
      expect.objectContaining({ id: "publish-workflow", status: "pass" }),
    ]));
    expect(result.gates.some(gate => gate.id.startsWith("run-"))).toBe(false);
  });

  it("flags incomplete evaluator and release setup", () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({
        name: "quality-demo",
        version: "invalid",
        bin: { af: "dist/commands/ai-first.js" },
        files: ["src/"],
        scripts: { build: "tsc", test: "vitest run", "docs:build": "vitepress build docs" },
      }),
      "dist/commands/ai-first.js": "#!/usr/bin/env node\n",
      "tsconfig.json": JSON.stringify({ compilerOptions: {} }),
      "README.md": "# Quality Demo\n",
      "src/mcp/server.ts": "export const server = true;\n",
      "evaluator.config.json": JSON.stringify({ projects: [], thresholds: {} }),
      ".releaserc.json": JSON.stringify({ branches: ["master"], plugins: [] }),
    });

    const result = evaluateQualityGates({ rootDir });

    expect(result.gates).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "evaluator-setup", status: "fail" }),
      expect.objectContaining({ id: "release-config", status: "fail" }),
      expect.objectContaining({ id: "publish-workflow", status: "warn" }),
    ]));
  });

  it("lists MCP compatibility profiles for common agent clients", () => {
    const profiles = getMcpCompatibilityProfiles();

    expect(profiles).toEqual(expect.arrayContaining([
      expect.objectContaining({ platform: "opencode", transport: "stdio", installable: true }),
      expect.objectContaining({ platform: "codex", configPath: ".codex/config.toml" }),
      expect.objectContaining({ platform: "claude-code", configPath: ".mcp.json" }),
      expect.objectContaining({ platform: "remote-http", transport: "streamable-http" }),
    ]));
  });

  it("installs project-local MCP compatibility configs", () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({ name: "mcp-demo", bin: { af: "dist/commands/ai-first.js" } }),
      "dist/commands/ai-first.js": "#!/usr/bin/env node\n",
      "src/mcp/server.ts": "export const server = true;\n",
    });

    const result = installMcpProfile({ rootDir, platform: "opencode" });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(rootDir, "opencode.jsonc"))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, ".opencode", "mcp.json"))).toBe(true);

    const opencodeConfig = JSON.parse(fs.readFileSync(path.join(rootDir, "opencode.jsonc"), "utf-8"));
    expect(opencodeConfig.mcp["ai-first"]).toEqual({
      type: "local",
      command: ["af", "mcp", "--root", "."],
      enabled: true,
    });
  });

  it("reports MCP setup health without starting the stdio server", () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({ name: "mcp-demo", bin: { af: "dist/commands/ai-first.js" } }),
      "dist/commands/ai-first.js": "#!/usr/bin/env node\n",
      "src/mcp/server.ts": "export const server = true;\n",
      ".mcp.json": JSON.stringify({ mcpServers: { "ai-first": { command: "af", args: ["mcp"] } } }),
    });

    const result = getMcpDoctor(rootDir);

    expect(result.ok).toBe(true);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "mcp-source", status: "pass" }),
      expect.objectContaining({ id: "mcp-bin", status: "pass" }),
      expect.objectContaining({ id: "installed-profile", status: "pass" }),
    ]));
  });

  it("evaluates HTTP MCP safety for local, authenticated and unsafe binds", () => {
    expect(evaluateMcpHttpSafety({ host: "127.0.0.1", port: 3847 })).toEqual(expect.objectContaining({
      ok: true,
      status: "warn",
      localOnly: true,
      authEnabled: false,
    }));

    expect(evaluateMcpHttpSafety({ host: "0.0.0.0", port: 3847 })).toEqual(expect.objectContaining({
      ok: false,
      status: "fail",
      localOnly: false,
      authEnabled: false,
    }));

    expect(evaluateMcpHttpSafety({ host: "0.0.0.0", port: 3847, authToken: "secret" })).toEqual(expect.objectContaining({
      ok: true,
      status: "pass",
      localOnly: false,
      authEnabled: true,
    }));
  });

  it("reports HTTP MCP safety through doctor checks", () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({ name: "mcp-demo", bin: { af: "dist/commands/ai-first.js" } }),
      "dist/commands/ai-first.js": "#!/usr/bin/env node\n",
      "src/mcp/server.ts": "export const server = true;\n",
    });

    const unsafe = getMcpDoctor({ rootDir, transport: "streamable-http", host: "0.0.0.0" });
    expect(unsafe.ok).toBe(false);
    expect(unsafe.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "http-safety", status: "fail" }),
    ]));

    const safe = getMcpDoctor({ rootDir, transport: "streamable-http", host: "0.0.0.0", authToken: "secret" });
    expect(safe.ok).toBe(true);
    expect(safe.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "http-safety", status: "pass" }),
    ]));
  });

  it("checks HTTP MCP bearer authorization", () => {
    expect(isMcpHttpRequestAuthorized({}, undefined)).toBe(true);
    expect(isMcpHttpRequestAuthorized({ authorization: "Bearer secret" }, "secret")).toBe(true);
    expect(isMcpHttpRequestAuthorized({ authorization: "Bearer wrong" }, "secret")).toBe(false);
    expect(isMcpHttpRequestAuthorized({}, "secret")).toBe(false);
  });

  it("refuses non-local HTTP MCP bind without auth token", async () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({ name: "http-mcp-demo" }),
    });

    await expect(startMCPHttpServer({ rootDir, host: "0.0.0.0", port: 0 })).rejects.toThrow(/auth token/);
  });

  it("serves MCP over Streamable HTTP when sockets are available", async () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({ name: "http-mcp-demo", scripts: { test: "vitest run" } }),
      "src/index.ts": "export const answer = 42;\n",
    });
    let server: Awaited<ReturnType<typeof startMCPHttpServer>>;
    try {
      server = await startMCPHttpServer({ rootDir, port: 0, enableJsonResponse: true });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "EPERM") {
        expect(error.message).toContain("listen");
        return;
      }
      throw error;
    }
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const health = await fetch(`http://127.0.0.1:${port}/health`);
      expect(health.status).toBe(200);
      await expect(health.json()).resolves.toEqual(expect.objectContaining({
        ok: true,
        transport: "streamable-http",
        auth: "disabled",
      }));

      const initialize = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "accept": "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "ai-first-test", version: "1.0.0" },
          },
        }),
      });
      expect(initialize.status).toBe(200);
      const sessionId = initialize.headers.get("mcp-session-id");
      expect(sessionId).toBeTruthy();
      await expect(initialize.json()).resolves.toEqual(expect.objectContaining({
        jsonrpc: "2.0",
        id: 1,
      }));
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
    }
  });
});
