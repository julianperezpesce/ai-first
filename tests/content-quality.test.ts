import { describe, it, expect } from "vitest";
import { generateSummary } from "../src/core/repoMapper.js";
import { generateArchitectureFile } from "../src/analyzers/architecture.js";
import type { FileInfo } from "../src/core/repoScanner.js";

describe("Content Quality - Purpose Section", () => {
  it("should include ## Purpose section in summary", () => {
    const files: FileInfo[] = [
      { path: "/test/manage.py", relativePath: "manage.py", name: "manage.py", extension: "py" },
      { path: "/test/blog/models.py", relativePath: "blog/models.py", name: "models.py", extension: "py" },
    ];

    const summary = generateSummary(files);

    expect(summary).toContain("## Purpose");
    expect(summary).toMatch(/This is a \*\*Django\*\*/);
  });

  it("should detect Flask from app.py", () => {
    const files: FileInfo[] = [
      { path: "/test/app.py", relativePath: "app.py", name: "app.py", extension: "py" },
    ];

    const summary = generateSummary(files);

    expect(summary).toContain("## Purpose");
    expect(summary).toMatch(/Flask/);
  });

  it("should detect Express from package.json and controllers", () => {
    const files: FileInfo[] = [
      { path: "/test/package.json", relativePath: "package.json", name: "package.json", extension: "json" },
      { path: "/test/src/controllers/index.js", relativePath: "src/controllers/index.js", name: "index.js", extension: "js" },
    ];

    const summary = generateSummary(files);

    expect(summary).toContain("## Purpose");
    expect(summary).toMatch(/Express/);
  });

  it("should detect Spring Boot from pom.xml", () => {
    const files: FileInfo[] = [
      { path: "/test/pom.xml", relativePath: "pom.xml", name: "pom.xml", extension: "xml" },
      { path: "/test/src/main.java", relativePath: "src/main.java", name: "main.java", extension: "java" },
    ];

    const summary = generateSummary(files);

    expect(summary).toContain("## Purpose");
    expect(summary).toMatch(/Spring Boot/);
  });

  it("should detect Go from go.mod", () => {
    const files: FileInfo[] = [
      { path: "/test/go.mod", relativePath: "go.mod", name: "go.mod", extension: "mod" },
    ];

    const summary = generateSummary(files);

    expect(summary).toContain("## Purpose");
    expect(summary).toMatch(/Go/);
  });

  it("should detect Rails from Gemfile", () => {
    const files: FileInfo[] = [
      { path: "/test/Gemfile", relativePath: "Gemfile", name: "Gemfile", extension: "file" },
    ];

    const summary = generateSummary(files);

    expect(summary).toContain("## Purpose");
    expect(summary).toMatch(/Ruby on Rails/);
  });

  it("should detect Rust from Cargo.toml", () => {
    const files: FileInfo[] = [
      { path: "/test/Cargo.toml", relativePath: "Cargo.toml", name: "Cargo.toml", extension: "toml" },
    ];

    const summary = generateSummary(files);

    expect(summary).toContain("## Purpose");
    expect(summary).toMatch(/Rust/);
  });

  it("should detect Salesforce from sfdx-project.json", () => {
    const files: FileInfo[] = [
      { path: "/test/sfdx-project.json", relativePath: "sfdx-project.json", name: "sfdx-project.json", extension: "json" },
    ];

    const summary = generateSummary(files);

    expect(summary).toContain("## Purpose");
    expect(summary).toMatch(/Salesforce/);
  });

  it("should not have generic 'This repository contains X files' in purpose", () => {
    const files: FileInfo[] = [
      { path: "/test/manage.py", relativePath: "manage.py", name: "manage.py", extension: "py" },
    ];

    const summary = generateSummary(files);
    const purposeSection = summary.split("## Overview")[0];

    expect(purposeSection).not.toMatch(/This repository contains/);
  });
});

describe("Content Quality - Components Section", () => {
  it("should include ## Components section in architecture", () => {
    const analysis = {
      pattern: "Layered Architecture",
      layers: ["API", "Service", "Data"],
      modules: [
        {
          name: "auth",
          path: "src/auth",
          responsibility: "Authentication and authorization",
          dependencies: ["users", "sessions"],
        },
        {
          name: "users",
          path: "src/users",
          responsibility: "User management",
          dependencies: ["database"],
        },
      ],
      description: "## Architectural Pattern\n**Primary**: Layered Architecture",
    };

    const architecture = generateArchitectureFile(analysis);

    expect(architecture).toContain("## Components");
    expect(architecture).toContain("| Component | Type | Path | Files |");
    expect(architecture).toContain("| auth |");
    expect(architecture).toContain("| users |");
  });

  it("should include ## Module Details after ## Components", () => {
    const analysis = {
      pattern: "MVC",
      layers: [],
      modules: [
        {
          name: "blog",
          path: "blog",
          responsibility: "Blog posts management",
          dependencies: [],
        },
      ],
      description: "## Architectural Pattern\n**Primary**: MVC",
    };

    const architecture = generateArchitectureFile(analysis);

    const componentsIndex = architecture.indexOf("## Components");
    const moduleDetailsIndex = architecture.indexOf("## Module Details");

    expect(componentsIndex).toBeLessThan(moduleDetailsIndex);
  });

  it("should list module responsibilities in Module Details", () => {
    const analysis = {
      pattern: "Clean Architecture",
      layers: [],
      modules: [
        {
          name: "orders",
          path: "src/orders",
          responsibility: "Order processing and fulfillment",
          dependencies: ["payments"],
        },
      ],
      description: "## Architectural Pattern\n**Primary**: Clean Architecture",
    };

    const architecture = generateArchitectureFile(analysis);

    expect(architecture).toContain("### orders");
    expect(architecture).toContain("**Responsibility**: Order processing and fulfillment");
  });
});

describe("Content Quality - No Generic Phrases", () => {
  it("generateSummary should not start with generic phrases", () => {
    const files: FileInfo[] = [
      { path: "/test/main.py", relativePath: "main.py", name: "main.py", extension: "py" },
    ];

    const summary = generateSummary(files);
    const lines = summary.split("\n");
    const purposeContent = summary.split("## Purpose")[1]?.split("## Overview")[0] || "";

    expect(purposeContent).not.toMatch(/^This repository contains.*files/);
  });
});
