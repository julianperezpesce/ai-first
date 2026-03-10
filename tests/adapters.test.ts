import { describe, it, expect } from "vitest";
import {
  detectAdapter,
  detectAllAdapters,
  getAdapter,
  listAdapters
} from "../src/core/adapters/index.js";
import fs from "fs";
import path from "path";
import os from "os";

function createTempProjectDir(files: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-adapter-test-"));
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

describe("Adapter System", () => {
  describe("detectAdapter", () => {
    it("should detect JavaScript project with package.json", () => {
      const projectDir = createTempProjectDir({
        "package.json": '{"name": "test"}',
        "src/index.js": "// code"
      });
      const adapter = detectAdapter(projectDir);
      expect(adapter.name).toBe("javascript");
    });

    it("should detect TypeScript project with tsconfig.json", () => {
      const projectDir = createTempProjectDir({
        "package.json": '{"name": "test"}',
        "tsconfig.json": '{}'
      });
      const adapter = detectAdapter(projectDir);
      expect(adapter.name).toBe("javascript");
    });

    it("should detect Django project with manage.py", () => {
      const projectDir = createTempProjectDir({
        "manage.py": "# django",
        "settings.py": "DEBUG=True"
      });
      const adapter = detectAdapter(projectDir);
      expect(adapter.name).toBe("django");
    });

    it("should detect Flask project with app.py", () => {
      const projectDir = createTempProjectDir({
        "app.py": "from flask import Flask"
      });
      const adapter = detectAdapter(projectDir);
      expect(adapter.name).toBe("flask");
    });

    it("should detect Rails project with Gemfile", () => {
      const projectDir = createTempProjectDir({
        "Gemfile": "source 'https://rubygems.org'",
        "app/controllers/application_controller.rb": "class ApplicationController"
      });
      const adapter = detectAdapter(projectDir);
      expect(adapter.name).toBe("rails");
    });

    it("should detect Salesforce project with sfdx-project.json", () => {
      const projectDir = createTempProjectDir({
        "sfdx-project.json": '{"packageDirectories": []}',
        "force-app/main/default/classes/Test.cls": "public class Test {}"
      });
      const adapter = detectAdapter(projectDir);
      expect(adapter.name).toBe("salesforce");
    });

    it("should detect .NET project with .csproj", () => {
      const projectDir = createTempProjectDir({
        "test.csproj": "<Project></Project>"
      });
      const adapter = detectAdapter(projectDir);
      expect(["dotnet", "aspnetcore", "blazor"]).toContain(adapter.name);
    });

    it("should detect ASP.NET Core with Startup.cs and Program.cs", () => {
      const projectDir = createTempProjectDir({
        "test.csproj": "<Project></Project>",
        "Startup.cs": "public class Startup {}",
        "Program.cs": "CreateHostBuilder(args);"
      });
      const adapter = detectAdapter(projectDir);
      expect(adapter.name).toBe("aspnetcore");
    });

    it("should return default adapter for unknown project", () => {
      const projectDir = createTempProjectDir({
        "README.md": "# Test"
      });
      const adapter = detectAdapter(projectDir);
      expect(adapter.name).toBe("default");
    });
  });

  describe("detectAllAdapters", () => {
    it("should return adapters with confidence scores", () => {
      const projectDir = createTempProjectDir({
        "package.json": '{"name": "test"}'
      });
      const results = detectAllAdapters(projectDir);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].confidence).toBeGreaterThan(0);
    });
  });

  describe("getAdapter", () => {
    it("should return adapter by name", () => {
      const adapter = getAdapter("javascript");
      expect(adapter?.name).toBe("javascript");
    });

    it("should return undefined for unknown adapter", () => {
      const adapter = getAdapter("unknown");
      expect(adapter).toBeUndefined();
    });
  });

  describe("listAdapters", () => {
    it("should list all available adapters", () => {
      const adapters = listAdapters();
      expect(adapters.length).toBeGreaterThan(0);
      expect(adapters.find(a => a.name === "javascript")).toBeDefined();
      expect(adapters.find(a => a.name === "python")).toBeDefined();
      expect(adapters.find(a => a.name === "rails")).toBeDefined();
      expect(adapters.find(a => a.name === "salesforce")).toBeDefined();
      expect(adapters.find(a => a.name === "dotnet")).toBeDefined();
    });
  });

  describe("Adapter Configuration", () => {
    it("javascript adapter should have correct feature roots", () => {
      const adapter = getAdapter("javascript");
      expect(adapter?.featureRoots).toContain("src");
      expect(adapter?.featureRoots).toContain("app");
    });

    it("django adapter should detect views", () => {
      const adapter = getAdapter("django");
      expect(adapter?.entrypointPatterns).toContain("view");
    });

    it("salesforce adapter should detect LWC", () => {
      const adapter = getAdapter("salesforce");
      expect(adapter?.entrypointPatterns).toContain("LWC");
    });
  });
});
