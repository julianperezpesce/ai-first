export interface ImportRelation {
  from: string;
  to: string;
  type: "import" | "export" | "re-export";
  symbols?: string[];
  isDefault?: boolean;
  isNamespace?: boolean;
}

export interface DependencyGraph {
  nodes: string[];
  edges: ImportRelation[];
  importsByFile: Map<string, ImportRelation[]>;
  exportsByFile: Map<string, string[]>;
}

export class DependencyAnalyzer {
  analyzeImports(
    filePath: string,
    imports: Array<{
      name: string;
      module: string;
      isDefault?: boolean;
      isNamespace?: boolean;
    }>,
    exports: string[]
  ): ImportRelation[] {
    const relations: ImportRelation[] = [];

    for (const imp of imports) {
      relations.push({
        from: filePath,
        to: imp.module,
        type: "import",
        symbols: [imp.name],
        isDefault: imp.isDefault,
        isNamespace: imp.isNamespace,
      });
    }

    for (const exp of exports) {
      relations.push({
        from: filePath,
        to: "exports",
        type: "export",
        symbols: [exp],
      });
    }

    return relations;
  }

  buildDependencyGraph(
    parsedFiles: Array<{
      filePath: string;
      imports: Array<{
        name: string;
        module: string;
        isDefault?: boolean;
        isNamespace?: boolean;
      }>;
      exports: string[];
    }>
  ): DependencyGraph {
    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
      importsByFile: new Map(),
      exportsByFile: new Map(),
    };

    for (const file of parsedFiles) {
      graph.nodes.push(file.filePath);

      const relations = this.analyzeImports(
        file.filePath,
        file.imports,
        file.exports
      );

      graph.edges.push(...relations);

      const imports = relations.filter((r) => r.type === "import");
      graph.importsByFile.set(file.filePath, imports);

      const exports = relations
        .filter((r) => r.type === "export")
        .flatMap((r) => r.symbols || []);
      graph.exportsByFile.set(file.filePath, exports);
    }

    return graph;
  }

  detectCircularDependencies(graph: DependencyGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]) => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart).concat([node]));
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const outgoingEdges = graph.edges.filter((e) => e.from === node);
      for (const edge of outgoingEdges) {
        if (edge.type === "import") {
          dfs(edge.to, [...path]);
        }
      }

      recursionStack.delete(node);
    };

    for (const node of graph.nodes) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  calculateMetrics(graph: DependencyGraph): {
    totalFiles: number;
    totalImports: number;
    totalExports: number;
    avgImportsPerFile: number;
    mostImported: { module: string; count: number }[];
  } {
    const moduleImportCounts = new Map<string, number>();

    for (const edge of graph.edges) {
      if (edge.type === "import") {
        const count = moduleImportCounts.get(edge.to) || 0;
        moduleImportCounts.set(edge.to, count + 1);
      }
    }

    const mostImported = Array.from(moduleImportCounts.entries())
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const importEdges = graph.edges.filter((e) => e.type === "import");
    const exportEdges = graph.edges.filter((e) => e.type === "export");

    return {
      totalFiles: graph.nodes.length,
      totalImports: importEdges.length,
      totalExports: exportEdges.length,
      avgImportsPerFile:
        graph.nodes.length > 0 ? importEdges.length / graph.nodes.length : 0,
      mostImported,
    };
  }
}

export const dependencyAnalyzer = new DependencyAnalyzer();
