import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { extractSymbols } from "../src/analyzers/symbols.js";
import { generateSemanticContexts } from "../src/core/semanticContexts.js";

describe("Symbol Extraction - Extension Format Fix", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-symbols-"));
  const testFilePath = path.join(tempDir, "test.js");
  
  beforeEach(() => {
    const content = `
const express = require('express');
const authController = require('./authController');

const app = express();
const PORT = process.env.PORT || 3000;

function finalTest() {
  return 'test';
}

module.exports = app;
`;
    fs.writeFileSync(testFilePath, content);
  });
  
  afterEach(() => {
    fs.unlinkSync(testFilePath);
  });

  it("should extract symbols from .js files with proper extension", () => {
    const fileInfo = {
      path: testFilePath,
      relativePath: "test.js",
      extension: ".js",
      name: "test"
    };
    
    const result = extractSymbols([fileInfo]);
    
    expect(result.symbols.length).toBeGreaterThanOrEqual(5);
    expect(result.symbols.some(s => s.name === "express")).toBe(true);
    expect(result.symbols.some(s => s.name === "authController")).toBe(true);
    expect(result.symbols.some(s => s.name === "app")).toBe(true);
    expect(result.symbols.some(s => s.name === "PORT")).toBe(true);
    expect(result.symbols.some(s => s.name === "finalTest")).toBe(true);
  });

  it("should extract symbols from .ts files", () => {
    const tsFilePath = path.join(tempDir, "test.ts");
    const content = `
export class UserController {
  public async getUser(id: string) { }
}

export const MAX_USERS = 100;
`;
    fs.writeFileSync(tsFilePath, content);
    
    const fileInfo = {
      path: tsFilePath,
      relativePath: "test.ts",
      extension: ".ts",
      name: "test"
    };
    
    const result = extractSymbols([fileInfo]);
    
    expect(result.symbols.length).toBeGreaterThanOrEqual(2);
    expect(result.symbols.some(s => s.name === "UserController")).toBe(true);
    expect(result.symbols.some(s => s.name === "MAX_USERS")).toBe(true);
    
    fs.unlinkSync(tsFilePath);
  });

  it("should NOT extract symbols if extension is passed without dot", () => {
    const fileInfo = {
      path: testFilePath,
      relativePath: "test.js",
      extension: "js",
      name: "test"
    };
    
    const result = extractSymbols([fileInfo]);
    
    expect(result.symbols.length).toBe(0);
  });
});

describe("Flow Name Sanitization", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-flows-"));
  
  function createTestModules(modules: Record<string, { path: string; files: string[] }>) {
    const aiDir = path.join(tempDir, "ai");
    fs.mkdirSync(path.join(aiDir, "context", "flows"), { recursive: true });
    fs.mkdirSync(path.join(aiDir, "graph"), { recursive: true });
    fs.writeFileSync(path.join(aiDir, "modules.json"), JSON.stringify({ modules }));
    fs.writeFileSync(path.join(aiDir, "symbols.json"), JSON.stringify({ symbols: {}, byType: {}, byFile: {} }));
    fs.writeFileSync(path.join(aiDir, "graph", "symbol-graph.json"), JSON.stringify({ symbols: [], relationships: [] }));
    return aiDir;
  }

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should NOT create flow files with double dots", () => {
    const modules = {
      "auth": {
        path: "src/users",
        files: [
          "src/users/users.controller.ts",
          "src/users/users.service.ts"
        ]
      }
    };
    
    const aiDir = createTestModules(modules);
    generateSemanticContexts(aiDir);
    
    const flowsDir = path.join(aiDir, "context", "flows");
    const files = fs.readdirSync(flowsDir);
    
    expect(files.some(f => f.includes(".."))).toBe(false);
    expect(files.some(f => f === "users.json")).toBe(true);
  });

  it("should NOT create flow files with trailing underscores", () => {
    const modules = {
      "add": {
        path: "cli",
        files: [
          "cli/add_command.py",
          "cli/list_command.py"
        ]
      }
    };
    
    const aiDir = createTestModules(modules);
    generateSemanticContexts(aiDir);
    
    const flowsDir = path.join(aiDir, "context", "flows");
    const files = fs.readdirSync(flowsDir);
    
    expect(files.some(f => f.endsWith("_.json"))).toBe(false);
  });

  it("should sanitize special characters in flow names", () => {
    const modules = {
      "test-flow": {
        path: "api/test-flow",
        files: [
          "api/test-flow/controller.ts",
          "api/test-flow/service.ts",
          "api/test-flow/repository.ts"
        ]
      }
    };
    
    const aiDir = createTestModules(modules);
    generateSemanticContexts(aiDir);
    
    const flowsDir = path.join(aiDir, "context", "flows");
    const files = fs.readdirSync(flowsDir);
    
    expect(files.every(f => /^[a-zA-Z0-9_.-]+$/.test(f.replace(".json", "")))).toBe(true);
  });
});

describe("File Name Consolidation (repo-map -> repo_map)", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-consolidation-"));
  
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should only create repo_map.json, not repo-map.json", () => {
    const aiDir = path.join(tempDir, "ai");
    fs.mkdirSync(aiDir, { recursive: true });
    
    const testData = { test: "data" };
    fs.writeFileSync(path.join(aiDir, "repo_map.json"), JSON.stringify(testData));
    
    expect(fs.existsSync(path.join(aiDir, "repo_map.json"))).toBe(true);
    expect(fs.existsSync(path.join(aiDir, "repo-map.json"))).toBe(false);
  });

  it("should handle migration scenario correctly", () => {
    const aiDir = path.join(tempDir, "ai");
    fs.mkdirSync(aiDir, { recursive: true });
    
    fs.writeFileSync(path.join(aiDir, "repo_map.json"), JSON.stringify({ version: "new" }));
    fs.writeFileSync(path.join(aiDir, "repo-map.json"), JSON.stringify({ version: "old" }));
    
    expect(fs.existsSync(path.join(aiDir, "repo_map.json"))).toBe(true);
    expect(fs.existsSync(path.join(aiDir, "repo-map.json"))).toBe(true);
  });
});
