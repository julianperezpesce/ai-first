import { describe, it, expect } from "vitest";
import {
  dependencyAnalyzer,
  callGraphBuilder,
  inheritanceAnalyzer,
} from "../src/core/analysis/index.js";

describe("Dependency Analyzer", () => {
  it("should analyze imports", () => {
    const filePath = "src/auth/service.ts";
    const imports = [
      { name: "express", module: "express", isDefault: true },
      { name: "User", module: "./user.model", isDefault: false },
    ];
    const exports = ["AuthService"];

    const relations = dependencyAnalyzer.analyzeImports(filePath, imports, exports);

    expect(relations).toHaveLength(3);

    const expressImport = relations.find((r) => r.to === "express");
    expect(expressImport).toBeDefined();
    expect(expressImport?.type).toBe("import");
    expect(expressImport?.isDefault).toBe(true);

    const userImport = relations.find((r) => r.to === "./user.model");
    expect(userImport?.symbols).toContain("User");

    const authExport = relations.find((r) => r.type === "export");
    expect(authExport?.symbols).toContain("AuthService");
  });

  it("should build dependency graph", () => {
    const files = [
      {
        filePath: "src/auth.ts",
        imports: [{ name: "User", module: "./user", isDefault: false }],
        exports: ["AuthService"],
      },
      {
        filePath: "src/user.ts",
        imports: [{ name: "db", module: "./db", isDefault: true }],
        exports: ["User", "UserRepository"],
      },
    ];

    const graph = dependencyAnalyzer.buildDependencyGraph(files);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes).toContain("src/auth.ts");
    expect(graph.nodes).toContain("src/user.ts");
    expect(graph.edges.length).toBeGreaterThanOrEqual(3);
  });

  it("should detect circular dependencies", () => {
    const graph = dependencyAnalyzer.buildDependencyGraph([
      {
        filePath: "src/a.ts",
        imports: [{ name: "B", module: "src/b.ts", isDefault: false }],
        exports: ["A"],
      },
      {
        filePath: "src/b.ts",
        imports: [{ name: "C", module: "src/c.ts", isDefault: false }],
        exports: ["B"],
      },
      {
        filePath: "src/c.ts",
        imports: [{ name: "A", module: "src/a.ts", isDefault: false }],
        exports: ["C"],
      },
    ]);

    const cycles = dependencyAnalyzer.detectCircularDependencies(graph);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it("should calculate metrics", () => {
    const graph = dependencyAnalyzer.buildDependencyGraph([
      {
        filePath: "src/a.ts",
        imports: [
          { name: "utils", module: "./utils", isDefault: true },
          { name: "helper", module: "./helper", isDefault: false },
        ],
        exports: ["A"],
      },
      {
        filePath: "src/b.ts",
        imports: [{ name: "utils", module: "./utils", isDefault: true }],
        exports: ["B"],
      },
    ]);

    const metrics = dependencyAnalyzer.calculateMetrics(graph);

    expect(metrics.totalFiles).toBe(2);
    expect(metrics.totalImports).toBe(3);
    expect(metrics.avgImportsPerFile).toBe(1.5);
    expect(metrics.mostImported[0].module).toBe("./utils");
    expect(metrics.mostImported[0].count).toBe(2);
  });
});

describe("Call Graph Builder", () => {
  it("should build call graph", () => {
    const symbols = [
      { id: "src/a.ts#main", name: "main", file: "src/a.ts", type: "function" },
      { id: "src/a.ts#helper", name: "helper", file: "src/a.ts", type: "function" },
      { id: "src/b.ts#utils", name: "utils", file: "src/b.ts", type: "function" },
    ];

    const calls = [
      {
        caller: "src/a.ts#main",
        callee: "src/a.ts#helper",
        line: 10,
        character: 5,
      },
      {
        caller: "src/a.ts#helper",
        callee: "src/b.ts#utils",
        line: 20,
        character: 8,
      },
    ];

    const graph = callGraphBuilder.buildCallGraph(symbols, calls);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);

    const mainCalls = graph.callsByFunction.get("src/a.ts#main");
    expect(mainCalls).toHaveLength(1);
    expect(mainCalls?.[0].callee).toBe("src/a.ts#helper");
  });

  it("should find unused functions", () => {
    const graph = callGraphBuilder.buildCallGraph(
      [
        { id: "src/a.ts#main", name: "main", file: "src/a.ts", type: "function" },
        { id: "src/a.ts#used", name: "used", file: "src/a.ts", type: "function" },
        { id: "src/a.ts#unused", name: "unused", file: "src/a.ts", type: "function" },
      ],
      [
        {
          caller: "src/a.ts#main",
          callee: "src/a.ts#used",
          line: 10,
          character: 5,
        },
      ]
    );

    const unused = callGraphBuilder.findUnusedFunctions(graph);
    expect(unused).toContain("src/a.ts#unused");
    expect(unused).not.toContain("src/a.ts#main");
    expect(unused).not.toContain("src/a.ts#used");
  });

  it("should get call chain", () => {
    const graph = callGraphBuilder.buildCallGraph(
      [
        { id: "main", name: "main", file: "main.ts", type: "function" },
        { id: "a", name: "a", file: "a.ts", type: "function" },
        { id: "b", name: "b", file: "b.ts", type: "function" },
        { id: "c", name: "c", file: "c.ts", type: "function" },
      ],
      [
        { caller: "main", callee: "a", line: 1, character: 1 },
        { caller: "a", callee: "b", line: 2, character: 2 },
        { caller: "b", callee: "c", line: 3, character: 3 },
      ]
    );

    const chain = callGraphBuilder.getCallChain(graph, "main", 5);
    expect(chain).toContain("main");
    expect(chain).toContain("a");
    expect(chain).toContain("b");
    expect(chain).toContain("c");
  });
});

describe("Inheritance Analyzer", () => {
  it("should build inheritance hierarchy", () => {
    const symbols = [
      {
        id: "Animal",
        name: "Animal",
        type: "class",
        heritage: {},
      },
      {
        id: "Dog",
        name: "Dog",
        type: "class",
        heritage: { extends: ["Animal"] },
      },
      {
        id: "Cat",
        name: "Cat",
        type: "class",
        heritage: { extends: ["Animal"] },
      },
      {
        id: "IAnimal",
        name: "IAnimal",
        type: "interface",
        heritage: {},
      },
      {
        id: "DogWithInterface",
        name: "DogWithInterface",
        type: "class",
        heritage: { extends: ["Animal"], implements: ["IAnimal"] },
      },
    ];

    const graph = inheritanceAnalyzer.buildHierarchy(symbols);

    expect(graph.nodes).toHaveLength(5);
    expect(graph.edges).toHaveLength(4);

    const dogExtends = graph.edges.filter((e) => e.child === "Dog" && e.type === "extends");
    expect(dogExtends).toHaveLength(1);
    expect(dogExtends[0].parent).toBe("Animal");

    const implementsEdge = graph.edges.find((e) => e.type === "implements");
    expect(implementsEdge).toBeDefined();
  });

  it("should get ancestors", () => {
    const graph = inheritanceAnalyzer.buildHierarchy([
      { id: "A", name: "A", type: "class", heritage: {} },
      { id: "B", name: "B", type: "class", heritage: { extends: ["A"] } },
      { id: "C", name: "C", type: "class", heritage: { extends: ["B"] } },
    ]);

    const ancestors = inheritanceAnalyzer.getAncestors(graph, "C");
    expect(ancestors).toContain("B");
    expect(ancestors).toContain("A");
  });

  it("should get descendants", () => {
    const graph = inheritanceAnalyzer.buildHierarchy([
      { id: "A", name: "A", type: "class", heritage: {} },
      { id: "B", name: "B", type: "class", heritage: { extends: ["A"] } },
      { id: "C", name: "C", type: "class", heritage: { extends: ["B"] } },
      { id: "D", name: "D", type: "class", heritage: { extends: ["A"] } },
    ]);

    const descendants = inheritanceAnalyzer.getDescendants(graph, "A");
    expect(descendants).toContain("B");
    expect(descendants).toContain("C");
    expect(descendants).toContain("D");
  });

  it("should calculate inheritance depth", () => {
    const graph = inheritanceAnalyzer.buildHierarchy([
      { id: "A", name: "A", type: "class", heritage: {} },
      { id: "B", name: "B", type: "class", heritage: { extends: ["A"] } },
      { id: "C", name: "C", type: "class", heritage: { extends: ["B"] } },
    ]);

    const depths = inheritanceAnalyzer.detectInheritanceDepth(graph);
    expect(depths.get("A")).toBe(0);
    expect(depths.get("B")).toBe(1);
    expect(depths.get("C")).toBe(2);
  });

  it("should find base classes", () => {
    const graph = inheritanceAnalyzer.buildHierarchy([
      { id: "A", name: "A", type: "class", heritage: {} },
      { id: "B", name: "B", type: "class", heritage: { extends: ["A"] } },
      { id: "C", name: "C", type: "class", heritage: {} },
    ]);

    const baseClasses = inheritanceAnalyzer.findBaseClasses(graph);
    expect(baseClasses).toContain("A");
    expect(baseClasses).toContain("C");
    expect(baseClasses).not.toContain("B");
  });
});
