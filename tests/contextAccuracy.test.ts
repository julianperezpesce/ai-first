import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { detectTechStack } from "../src/analyzers/techStack.js";
import { analyzeArchitecture, generateArchitectureFile } from "../src/analyzers/architecture.js";
import { discoverEntrypoints } from "../src/analyzers/entrypoints.js";
import { extractConfigAnalysis } from "../src/utils/configAnalyzer.js";
import { extractProjectSetup } from "../src/utils/projectSetupExtractor.js";
import { generateProject } from "../src/core/schema.js";
import { verifyContext } from "../src/core/contextVerifier.js";
import type { FileInfo } from "../src/core/repoScanner.js";

const tempDirs: string[] = [];

function createTempProject(packageJson: Record<string, unknown>): string {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-accuracy-test-"));
  tempDirs.push(rootDir);
  fs.writeFileSync(path.join(rootDir, "package.json"), JSON.stringify(packageJson, null, 2));
  return rootDir;
}

function packageFile(rootDir: string): FileInfo {
  return {
    path: path.join(rootDir, "package.json"),
    relativePath: "package.json",
    name: "package.json",
    extension: "json",
  };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("context accuracy hardening", () => {
  it("detects ai-first Node tooling from package.json evidence", () => {
    const rootDir = createTempProject({
      scripts: {
        test: "vitest run",
        "docs:dev": "vitepress dev docs",
      },
      dependencies: {
        "@modelcontextprotocol/sdk": "^1.0.4",
        "sql.js": "^1.10.0",
      },
      devDependencies: {
        vitest: "^4.1.0",
        vitepress: "^1.6.4",
      },
    });

    const stack = detectTechStack([packageFile(rootDir)], rootDir);

    expect(stack.frameworks).toContain("VitePress");
    expect(stack.libraries).toContain("Model Context Protocol SDK");
    expect(stack.libraries).toContain("sql.js");
    expect(stack.testing).toContain("Vitest");
    expect(stack.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "framework",
          name: "VitePress",
          confidence: 0.95,
          evidence: expect.arrayContaining(["package.json dependency vitepress"]),
        }),
        expect.objectContaining({
          category: "testing",
          name: "Vitest",
          confidence: 0.95,
          evidence: expect.arrayContaining(["package.json dependency vitest"]),
        }),
      ])
    );
  });

  it("detects Vitest config from package.json scripts without vitest.config.ts", () => {
    const rootDir = createTempProject({
      scripts: { test: "vitest run" },
      devDependencies: { vitest: "^4.1.0" },
    });

    const config = extractConfigAnalysis(rootDir);

    expect(config.testing?.framework).toBe("Vitest");
    expect(config.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          area: "testing",
          confidence: 0.95,
          evidence: expect.arrayContaining([
            "package.json dependency vitest",
            "package.json scripts.test = vitest run",
          ]),
        }),
      ])
    );
  });

  it("adds confidence and evidence to package-declared entrypoints", () => {
    const rootDir = createTempProject({
      bin: { "ai-first-cli": "src/commands/ai-first.js" },
      scripts: { build: "tsc" },
    });
    const entrypoints = discoverEntrypoints([packageFile(rootDir)], rootDir);
    const cliEntrypoint = entrypoints.find(entrypoint => entrypoint.name === "ai-first-cli");
    const buildEntrypoint = entrypoints.find(entrypoint => entrypoint.name === "build");

    expect(cliEntrypoint).toEqual(expect.objectContaining({
      confidence: 0.95,
      reason: "CLI entrypoint declared explicitly in package.json bin",
      evidence: expect.arrayContaining(["package.json bin", "src/commands/ai-first.js"]),
    }));
    expect(buildEntrypoint).toEqual(expect.objectContaining({
      confidence: 0.95,
      reason: "Entrypoint declared explicitly in package.json scripts",
      evidence: expect.arrayContaining(["package.json#scripts.build"]),
    }));
  });

  it("parses bold markdown tech stack values into project.json", () => {
    const rootDir = createTempProject({});
    const aiDir = path.join(rootDir, "ai-context");
    fs.mkdirSync(aiDir, { recursive: true });
    fs.writeFileSync(path.join(aiDir, "tech_stack.md"), [
      "# Technology Stack",
      "",
      "**Languages**: TypeScript, Markdown, JSON",
      "",
      "**Frameworks**: VitePress",
    ].join("\n"));

    const project = generateProject(rootDir, aiDir);

    expect(project.languages).toEqual(["TypeScript", "Markdown", "JSON"]);
    expect(project.frameworks).toEqual(["VitePress"]);
  });

  it("describes ai-first source modules with specific responsibilities", () => {
    const files: FileInfo[] = [
      { path: "/repo/src/commands/ai-first.ts", relativePath: "src/commands/ai-first.ts", name: "ai-first.ts", extension: "ts" },
      { path: "/repo/src/core/contextManifest.ts", relativePath: "src/core/contextManifest.ts", name: "contextManifest.ts", extension: "ts" },
      { path: "/repo/src/mcp/server.ts", relativePath: "src/mcp/server.ts", name: "server.ts", extension: "ts" },
      { path: "/repo/tests/contextAccuracy.test.ts", relativePath: "tests/contextAccuracy.test.ts", name: "contextAccuracy.test.ts", extension: "ts" },
    ];

    const analysis = analyzeArchitecture(files, "/repo");
    const architecture = generateArchitectureFile(analysis);

    expect(architecture).toContain("CLI command routing");
    expect(architecture).toContain("Reusable analysis engine");
    expect(architecture).toContain("Model Context Protocol server");
    expect(architecture).not.toContain("JavaScript/TypeScript implementation");
    expect(architecture).not.toContain("Keep the architecture consistent as the project grows");
  });

  it("does not mark ambient shell env vars as required project configuration", () => {
    const rootDir = createTempProject({});
    fs.mkdirSync(path.join(rootDir, "src"), { recursive: true });
    fs.writeFileSync(path.join(rootDir, "src/index.ts"), [
      "const home = process.env.HOME;",
      "const apiKey = process.env.MINIMAX_API_KEY;",
      "const host = process.env.MINIMAX_API_HOST;",
    ].join("\n"));

    const setup = extractProjectSetup(rootDir);

    expect(setup.envVars.map(envVar => envVar.name)).not.toContain("HOME");
    expect(setup.envVars.map(envVar => envVar.name)).toContain("MINIMAX_API_KEY");
    expect(setup.envVars.map(envVar => envVar.name)).toContain("MINIMAX_API_HOST");
  });

  it("penalizes setup.json when ambient env vars are marked required", () => {
    const rootDir = createTempProject({});
    const aiDir = path.join(rootDir, "ai-context");
    fs.mkdirSync(aiDir, { recursive: true });
    fs.writeFileSync(path.join(aiDir, "context_manifest.json"), JSON.stringify({ schemaVersion: "1.0" }));
    fs.writeFileSync(path.join(aiDir, "ai_context.md"), "# AI Context");
    fs.writeFileSync(path.join(aiDir, "project.json"), "{}");
    fs.writeFileSync(path.join(aiDir, "tech_stack.md"), "# Technology Stack");
    fs.writeFileSync(path.join(aiDir, "architecture.md"), "# Architecture");
    fs.writeFileSync(path.join(aiDir, "entrypoints.md"), "# Entrypoints");
    fs.writeFileSync(path.join(aiDir, "setup.json"), JSON.stringify({
      envVars: [{ name: "HOME", required: true }],
    }));

    const result = verifyContext(rootDir, aiDir);
    const setupCheck = result.checks.find(check => check.id === "setup-env-vars");

    expect(setupCheck?.status).toBe("warn");
    expect(setupCheck?.message).toContain("HOME");
  });
});
