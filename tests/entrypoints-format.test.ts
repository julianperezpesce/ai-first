import { describe, it, expect } from "vitest";
import { discoverEntrypoints, generateEntrypointsFile, Entrypoint } from "../src/analyzers/entrypoints.js";
import { FileInfo } from "../src/core/repoScanner.js";

describe("Entrypoints - Generate File Format", () => {
  const mockEntrypoints: Entrypoint[] = [
    {
      name: "manage.py",
      path: "manage.py",
      type: "cli",
      description: "Django management commands",
      command: "python manage.py"
    },
    {
      name: "server.js",
      path: "server.js",
      type: "server",
      description: "Express server entrypoint"
    }
  ];

  it("should generate # Entrypoints header", () => {
    const output = generateEntrypointsFile(mockEntrypoints);
    expect(output).toContain("# Entrypoints");
  });

  it("should use ### for category headers", () => {
    const output = generateEntrypointsFile(mockEntrypoints);
    expect(output).toContain("### CLI Commands");
    expect(output).toContain("### Server Entry Points");
  });

  it("should use #### for individual entry headers", () => {
    const output = generateEntrypointsFile(mockEntrypoints);
    expect(output).toContain("#### manage.py");
    expect(output).toContain("#### server.js");
  });

  it("should format entry details as bullet points", () => {
    const output = generateEntrypointsFile(mockEntrypoints);
    expect(output).toContain("**Path**");
    expect(output).toContain("**Description**");
  });

  it("should include command when available", () => {
    const output = generateEntrypointsFile(mockEntrypoints);
    expect(output).toContain("**Command**");
    expect(output).toContain("python manage.py");
  });

  it("should not use table format", () => {
    const output = generateEntrypointsFile(mockEntrypoints);
    expect(output).not.toContain("| Name | Path |");
  });

  it("should group entries by type", () => {
    const output = generateEntrypointsFile(mockEntrypoints);
    expect(output).toContain("### CLI Commands");
    expect(output).toContain("### Server Entry Points");
  });
});

describe("Entrypoints - API Endpoints", () => {
  const apiEntrypoints: Entrypoint[] = [
    {
      name: "UsersController",
      path: "src/controllers/UsersController.ts",
      type: "api",
      description: "REST API endpoints for user management"
    }
  ];

  it("should use ### for API Endpoints category", () => {
    const output = generateEntrypointsFile(apiEntrypoints);
    expect(output).toContain("### API Endpoints");
  });

  it("should use #### for individual API entry", () => {
    const output = generateEntrypointsFile(apiEntrypoints);
    expect(output).toContain("#### UsersController");
  });

  it("should include path for API entries", () => {
    const output = generateEntrypointsFile(apiEntrypoints);
    expect(output).toContain("src/controllers/UsersController.ts");
  });
});