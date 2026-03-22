import { describe, it, expect } from "vitest";
import {
  aiContextGenerator,
  flowGenerator,
  architectureGenerator,
} from "../src/core/generation/index.js";

describe("AI Context Generator", () => {
  it("should generate enriched context", () => {
    const analysis = {
      architecture: {
        primary: {
          name: "Layered Architecture",
          confidence: 0.85,
          evidence: ["Found 3 layers", "Clear separation of concerns"],
        },
        secondary: [],
        layers: [
          {
            name: "API",
            symbols: ["src/controller.ts#UserController"],
            files: ["src/controller.ts"],
            responsibility: "Handle HTTP requests",
          },
          {
            name: "Service",
            symbols: ["src/service.ts#UserService"],
            files: ["src/service.ts"],
            responsibility: "Business logic",
          },
        ],
        entryPoints: ["src/main.ts#main"],
      },
      symbols: [
        { id: "src/controller.ts#UserController", name: "UserController", type: "class", file: "src/controller.ts" },
        { id: "src/service.ts#UserService", name: "UserService", type: "class", file: "src/service.ts" },
        { id: "src/main.ts#main", name: "main", type: "function", file: "src/main.ts" },
      ],
      dependencies: {
        totalDependencies: 10,
        dependencies: [
          { source: "src/controller.ts", target: "src/service.ts", type: "import" },
        ],
      },
      projectName: "TestApp",
    };

    const context = aiContextGenerator.generate(analysis);

    expect(context).toContain("# AI Context: TestApp");
    expect(context).toContain("Layered Architecture");
    expect(context).toContain("85%");
    expect(context).toContain("API");
    expect(context).toContain("Service");
    expect(context).toContain("main");
    expect(context).toContain("Total Files");
    expect(context).toContain("Total Symbols");
  });

  it("should detect project type", () => {
    const analysis = {
      architecture: {
        primary: null,
        secondary: [],
        layers: [],
        entryPoints: [],
      },
      symbols: [
        { id: "src/controller.ts#Test", name: "Test", type: "class", file: "src/controller.ts" },
      ],
      dependencies: { totalDependencies: 0, dependencies: [] },
      projectName: "Test",
    };

    const context = aiContextGenerator.generate(analysis);

    expect(context).toContain("MVC Web Application");
  });
});

describe("Flow Generator", () => {
  it("should generate enriched flows", () => {
    const entryPoints = ["src/auth.ts#login"];
    const symbols = [
      { id: "src/auth.ts#login", name: "login", type: "function", file: "src/auth.ts" },
      { id: "src/service.ts#validate", name: "validate", type: "function", file: "src/service.ts" },
    ];
    const dependencyGraph = {
      edges: [{ from: "src/auth.ts#login", to: "src/service.ts#validate", type: "import" }],
    };
    const callGraph = {
      edges: [{ caller: "src/auth.ts#login", callee: "src/service.ts#validate" }],
    };
    const inheritanceGraph = { edges: [] };

    const flows = flowGenerator.generateFlows(
      entryPoints,
      symbols,
      dependencyGraph,
      callGraph,
      inheritanceGraph
    );

    expect(flows).toHaveLength(1);
    expect(flows[0].name).toBe("login");
    expect(flows[0].type).toBe("API Endpoint");
    expect(flows[0].files).toHaveLength(2);
    expect(flows[0].dependencies.calls).toContain("src/service.ts#validate");
  });

  it("should detect layers in flow", () => {
    const entryPoints = ["src/controller.ts#getUser"];
    const symbols = [
      { id: "src/controller.ts#getUser", name: "getUser", type: "function", file: "src/controller.ts" },
      { id: "src/service.ts#findUser", name: "findUser", type: "function", file: "src/service.ts" },
    ];

    const callGraph = {
      edges: [{ caller: "src/controller.ts#getUser", callee: "src/service.ts#findUser" }],
    };

    const flows = flowGenerator.generateFlows(
      entryPoints,
      symbols,
      { edges: [] },
      callGraph,
      { edges: [] }
    );

    expect(flows[0].layers).toContain("api");
    expect(flows[0].layers).toContain("service");
  });

  it("should calculate complexity", () => {
    const entryPoints = ["src/simple.ts#simple"];
    const symbols = [{ id: "src/simple.ts#simple", name: "simple", type: "function", file: "src/simple.ts" }];

    const flows = flowGenerator.generateFlows(
      entryPoints,
      symbols,
      { edges: [] },
      { edges: [] },
      { edges: [] }
    );

    expect(flows[0].complexity).toBe("low");
    expect(flows[0].depth).toBe(1);
  });
});

describe("Architecture Generator", () => {
  it("should generate architecture markdown", () => {
    const analysis = {
      primary: {
        name: "MVC",
        confidence: 0.9,
        evidence: ["Found controllers", "Found models"],
      },
      secondary: [],
      layers: [
        { name: "Controller", symbols: ["ctrl1", "ctrl2"], files: ["ctrl.ts"], responsibility: "Handle requests" },
        { name: "Model", symbols: ["model1"], files: ["model.ts"], responsibility: "Data" },
      ],
      entryPoints: ["main"],
    };

    const dependencyGraph = {
      nodes: ["ctrl1", "model1"],
      edges: [{ from: "ctrl1", to: "model1", type: "import" }],
    };

    const markdown = architectureGenerator.generate(analysis, dependencyGraph);

    expect(markdown).toContain("# Architecture");
    expect(markdown).toContain("MVC");
    expect(markdown).toContain("90%");
    expect(markdown).toContain("Controller");
    expect(markdown).toContain("Model");
    expect(markdown).toContain("Architecture Diagram");
    expect(markdown).toContain("mermaid");
  });

  it("should generate mermaid diagram", () => {
    const analysis = {
      primary: { name: "Layered", confidence: 0.8, evidence: [] },
      secondary: [],
      layers: [{ name: "API", symbols: ["api1"], files: ["api.ts"], responsibility: "" }],
      entryPoints: [],
    };

    const dependencyGraph = {
      nodes: ["api1", "svc1"],
      edges: [{ from: "api1", to: "svc1", type: "import" }],
    };

    const markdown = architectureGenerator.generate(analysis, dependencyGraph);

    expect(markdown).toContain("graph TD");
    expect(markdown).toContain("api1");
    expect(markdown).toContain("svc1");
  });

  it("should handle unknown patterns", () => {
    const analysis = {
      primary: null,
      secondary: [],
      layers: [],
      entryPoints: [],
    };

    const markdown = architectureGenerator.generate(analysis, { nodes: [], edges: [] });

    expect(markdown).toContain("Unknown");
    expect(markdown).toContain("No strong pattern detected");
  });
});
