export interface EnrichedFlow {
  name: string;
  entrypoint: string;
  type: string;
  responsibility: string;
  files: Array<{
    path: string;
    responsibility: string;
    symbols: string[];
  }>;
  layers: string[];
  dependencies: {
    imports: string[];
    calls: string[];
    implementsInterfaces: string[];
  };
  complexity: "low" | "medium" | "high";
  depth: number;
}

export class FlowGenerator {
  generateFlows(
    entryPoints: string[],
    symbols: Array<{
      id: string;
      name: string;
      type: string;
      file: string;
    }>,
    dependencyGraph: {
      edges: Array<{ from: string; to: string; type: string }>;
    },
    callGraph: {
      edges: Array<{ caller: string; callee: string }>;
    },
    inheritanceGraph: {
      edges: Array<{ child: string; parent: string; type: string }>;
    }
  ): EnrichedFlow[] {
    const flows: EnrichedFlow[] = [];

    for (const entryPoint of entryPoints) {
      const flow = this.analyzeFlow(
        entryPoint,
        symbols,
        dependencyGraph,
        callGraph,
        inheritanceGraph
      );
      flows.push(flow);
    }

    return flows;
  }

  private analyzeFlow(
    entryPoint: string,
    symbols: Array<{
      id: string;
      name: string;
      type: string;
      file: string;
    }>,
    dependencyGraph: {
      edges: Array<{ from: string; to: string; type: string }>;
    },
    callGraph: {
      edges: Array<{ caller: string; callee: string }>;
    },
    inheritanceGraph: {
      edges: Array<{ child: string; parent: string; type: string }>;
    }
  ): EnrichedFlow {
    const entrySymbol = symbols.find((s) => s.id === entryPoint);
    const visited = new Set<string>();
    const files = new Map<string, string[]>();
    const layers = new Set<string>();

    const traverse = (symbolId: string, depth: number = 0) => {
      if (visited.has(symbolId) || depth > 10) return;
      visited.add(symbolId);

      const symbol = symbols.find((s) => s.id === symbolId);
      if (symbol) {
        const fileSymbols = files.get(symbol.file) || [];
        fileSymbols.push(symbol.name);
        files.set(symbol.file, fileSymbols);

        const layer = this.detectLayer(symbol);
        if (layer) layers.add(layer);
      }

      const outgoingCalls = callGraph.edges.filter((e) => e.caller === symbolId);
      for (const call of outgoingCalls) {
        traverse(call.callee, depth + 1);
      }

      const outgoingDeps = dependencyGraph.edges.filter(
        (e) => e.from === symbolId && e.type === "import"
      );
      for (const dep of outgoingDeps) {
        if (symbols.some((s) => s.id === dep.to)) {
          traverse(dep.to, depth + 1);
        }
      }
    };

    traverse(entryPoint);

    const imports = dependencyGraph.edges
      .filter((e) => e.from === entryPoint && e.type === "import")
      .map((e) => e.to);

    const calls = callGraph.edges
      .filter((e) => e.caller === entryPoint)
      .map((e) => e.callee);

    const implementsInterfaces = inheritanceGraph.edges
      .filter((e) => e.child === entryPoint && e.type === "implements")
      .map((e) => e.parent);

    return {
      name: entrySymbol?.name || entryPoint.split("#")[1] || "unknown",
      entrypoint: entryPoint,
      type: this.classifyFlowType(entrySymbol),
      responsibility: this.inferResponsibility(entrySymbol),
      files: Array.from(files.entries()).map(([path, syms]) => ({
        path,
        responsibility: this.describeFile(path, syms),
        symbols: syms,
      })),
      layers: Array.from(layers),
      dependencies: {
        imports: [...new Set(imports)],
        calls: [...new Set(calls)],
        implementsInterfaces: [...new Set(implementsInterfaces)],
      },
      complexity: this.calculateComplexity(visited.size, files.size),
      depth: visited.size,
    };
  }

  private detectLayer(symbol: {
    name: string;
    file: string;
  }): string | null {
    const name = symbol.name.toLowerCase();
    const file = symbol.file.toLowerCase();

    if (
      name.includes("controller") ||
      name.includes("route") ||
      name.includes("handler") ||
      file.includes("controller") ||
      file.includes("routes")
    ) {
      return "api";
    }
    if (
      name.includes("service") ||
      name.includes("usecase") ||
      file.includes("service") ||
      file.includes("usecase")
    ) {
      return "service";
    }
    if (
      name.includes("repository") ||
      name.includes("model") ||
      file.includes("repository") ||
      file.includes("model")
    ) {
      return "data";
    }
    if (name.includes("component") || file.includes("component")) {
      return "ui";
    }
    return null;
  }

  private classifyFlowType(symbol?: {
    name: string;
    type: string;
  }): string {
    if (!symbol) return "unknown";

    const name = symbol.name.toLowerCase();

    if (name.includes("auth")) return "Authentication Flow";
    if (name.includes("user")) return "User Management Flow";
    if (name.includes("payment")) return "Payment Processing Flow";
    if (name.includes("order")) return "Order Processing Flow";
    if (name.includes("notification")) return "Notification Flow";
    if (name.includes("report")) return "Reporting Flow";
    if (symbol.type === "function") return "API Endpoint";
    if (symbol.type === "class") return "Service Handler";

    return "Business Flow";
  }

  private inferResponsibility(symbol?: { name: string }): string {
    if (!symbol) return "Unknown responsibility";

    const name = symbol.name.toLowerCase();

    if (name.includes("create")) return "Creation and initialization";
    if (name.includes("get") || name.includes("find")) return "Data retrieval";
    if (name.includes("update")) return "Data modification";
    if (name.includes("delete") || name.includes("remove")) return "Data deletion";
    if (name.includes("validate")) return "Data validation";
    if (name.includes("process")) return "Business logic processing";
    if (name.includes("handle")) return "Event/request handling";

    return `Manages ${symbol.name} operations`;
  }

  private describeFile(path: string, symbols: string[]): string {
    if (path.includes("controller")) return "API endpoint definitions";
    if (path.includes("service")) return "Business logic implementation";
    if (path.includes("repository")) return "Data access layer";
    if (path.includes("model")) return "Data models and entities";
    if (path.includes("route")) return "URL routing configuration";
    if (path.includes("middleware")) return "Request/response middleware";
    if (path.includes("component")) return "UI component";
    return `Contains ${symbols.length} symbols`;
  }

  private calculateComplexity(
    symbolCount: number,
    fileCount: number
  ): "low" | "medium" | "high" {
    if (symbolCount < 5 && fileCount <= 2) return "low";
    if (symbolCount > 15 || fileCount > 5) return "high";
    return "medium";
  }
}

export const flowGenerator = new FlowGenerator();
