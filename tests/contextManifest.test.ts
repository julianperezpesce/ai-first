import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { checkContextFreshness, createContextManifest, writeContextManifest } from "../src/core/contextManifest.js";
import { verifyContext } from "../src/core/contextVerifier.js";
import type { FileInfo } from "../src/core/repoScanner.js";

const tempDirs: string[] = [];

function createTempRepo(files: Record<string, string>): string {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-manifest-test-"));
  tempDirs.push(rootDir);

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }

  return rootDir;
}

function toFileInfo(rootDir: string, relativePath: string): FileInfo {
  return {
    path: path.join(rootDir, relativePath),
    relativePath,
    name: path.basename(relativePath),
    extension: path.extname(relativePath).replace(".", ""),
  };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("context manifest", () => {
  it("creates a manifest with source hashes and output metadata", () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({ name: "demo" }),
      "src/index.ts": "export const answer = 42;\n",
      "ai-context/ai_context.md": "# AI Context\n",
    });
    const outputDir = path.join(rootDir, "ai-context");

    const manifest = createContextManifest({
      rootDir,
      outputDir,
      files: [toFileInfo(rootDir, "package.json"), toFileInfo(rootDir, "src/index.ts")],
      aiFirstVersion: "1.5.1-test",
    });

    expect(manifest.schemaVersion).toBe("1.0");
    expect(manifest.scannedFiles).toBe(2);
    expect(manifest.files[0]).toHaveProperty("hash");
    expect(manifest.rootHash.length).toBe(64);
    expect(manifest.outputFiles).toContain("ai_context.md");
  });

  it("reports fresh context before files change and stale context after changes", () => {
    const rootDir = createTempRepo({
      "src/index.ts": "export const answer = 42;\n",
      "ai-context/ai_context.md": "# AI Context\n",
    });
    const outputDir = path.join(rootDir, "ai-context");
    const files = [toFileInfo(rootDir, "src/index.ts")];

    writeContextManifest(createContextManifest({ rootDir, outputDir, files, aiFirstVersion: "1.5.1-test" }));

    expect(checkContextFreshness(rootDir, outputDir).fresh).toBe(true);

    fs.writeFileSync(path.join(rootDir, "src/index.ts"), "export const answer = 43;\n");

    const freshness = checkContextFreshness(rootDir, outputDir);
    expect(freshness.fresh).toBe(false);
    expect(freshness.changedFiles).toContain("src/index.ts");
  });

  it("computes a degraded truth score when required context files are missing", () => {
    const rootDir = createTempRepo({
      "package.json": JSON.stringify({ scripts: { test: "vitest run" }, devDependencies: { vitest: "^4.0.0" } }),
      "src/index.ts": "export const answer = 42;\n",
      "ai-context/ai_context.md": "# AI Context\n",
    });
    const outputDir = path.join(rootDir, "ai-context");
    const files = [toFileInfo(rootDir, "package.json"), toFileInfo(rootDir, "src/index.ts")];

    writeContextManifest(createContextManifest({ rootDir, outputDir, files, aiFirstVersion: "1.5.1-test" }));

    const result = verifyContext(rootDir, outputDir);
    expect(result.score).toBeLessThan(100);
    expect(result.status).not.toBe("trusted");
    expect(result.checks.some(check => check.id === "required-files" && check.status === "fail")).toBe(true);
  });
});
