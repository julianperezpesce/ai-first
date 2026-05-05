import { describe, it, expect } from "vitest";
import { generateAgentBrief } from "../src/core/agentBrief.js";

describe("agent brief", () => {
  it("generates a short actionable brief for AI agents", () => {
    const brief = generateAgentBrief({
      rootDir: "/repo/ai-first",
      setup: {
        installCommand: "npm install",
        buildCommand: "npm run build",
        testCommand: "npm test",
        devCommand: "npm run dev",
        startCommand: null,
        requirements: ["Node.js >=18"],
        envVars: [{ name: "API_KEY", required: true, defaultValue: null, description: null }],
      },
      techStack: {
        languages: ["TypeScript"],
        frameworks: ["VitePress"],
        libraries: ["Model Context Protocol SDK"],
        tools: [],
        packageManagers: ["npm"],
        testing: ["Vitest"],
        linters: [],
        formatters: [],
        description: "",
      },
      architecture: {
        pattern: "CLI Application with Plugin Architecture",
        layers: ["application"],
        modules: [
          { name: "commands", path: "src/commands", responsibility: "CLI command routing", dependencies: [] },
          { name: "core", path: "src/core", responsibility: "Reusable analysis engine", dependencies: [] },
          { name: "mcp", path: "src/mcp", responsibility: "Model Context Protocol server", dependencies: [] },
        ],
        description: "",
      },
      freshness: {
        fresh: true,
        reason: "context is fresh",
        manifestPath: "/repo/ai-first/ai-context/context_manifest.json",
        currentCommit: "abc",
        manifestCommit: "abc",
        dirty: false,
        changedFiles: [],
        missingFiles: [],
        addedFiles: [],
      },
    });

    expect(brief).toContain("# Agent Brief");
    expect(brief).toContain("Build: `npm run build`");
    expect(brief).toContain("`src/commands`: CLI command routing");
    expect(brief).toContain("Run `af verify ai-context`");
    expect(brief).toContain("Status: fresh");
  });
});
