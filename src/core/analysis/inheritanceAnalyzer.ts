export interface InheritanceRelation {
  child: string;
  parent: string;
  type: "extends" | "implements";
}

export interface InheritanceGraph {
  nodes: string[];
  edges: InheritanceRelation[];
  classHierarchy: Map<string, string[]>;
  implementations: Map<string, string[]>;
}

export class InheritanceAnalyzer {
  buildHierarchy(
    symbols: Array<{
      id: string;
      name: string;
      type: string;
      heritage?: {
        extends?: string[];
        implements?: string[];
      };
    }>
  ): InheritanceGraph {
    const graph: InheritanceGraph = {
      nodes: symbols.filter((s) => s.type === "class" || s.type === "interface").map((s) => s.id),
      edges: [],
      classHierarchy: new Map(),
      implementations: new Map(),
    };

    for (const symbol of symbols) {
      if (symbol.type !== "class" && symbol.type !== "interface") continue;

      const parents: string[] = [];

      if (symbol.heritage?.extends) {
        for (const parent of symbol.heritage.extends) {
          graph.edges.push({
            child: symbol.id,
            parent,
            type: "extends",
          });
          parents.push(parent);
        }
      }

      if (symbol.heritage?.implements) {
        for (const iface of symbol.heritage.implements) {
          graph.edges.push({
            child: symbol.id,
            parent: iface,
            type: "implements",
          });

          const impls = graph.implementations.get(iface) || [];
          impls.push(symbol.id);
          graph.implementations.set(iface, impls);
        }
      }

      if (parents.length > 0) {
        graph.classHierarchy.set(symbol.id, parents);
      }
    }

    return graph;
  }

  getAncestors(graph: InheritanceGraph, classId: string): string[] {
    const ancestors: string[] = [];
    const visited = new Set<string>();

    const traverse = (current: string) => {
      if (visited.has(current)) return;
      visited.add(current);

      const edges = graph.edges.filter((e) => e.child === current);
      for (const edge of edges) {
        ancestors.push(edge.parent);
        traverse(edge.parent);
      }
    };

    traverse(classId);
    return ancestors;
  }

  getDescendants(graph: InheritanceGraph, classId: string): string[] {
    const descendants: string[] = [];
    const visited = new Set<string>();

    const traverse = (current: string) => {
      if (visited.has(current)) return;
      visited.add(current);

      const edges = graph.edges.filter(
        (e) => e.parent === current && e.type === "extends"
      );
      for (const edge of edges) {
        descendants.push(edge.child);
        traverse(edge.child);
      }
    };

    traverse(classId);
    return descendants;
  }

  getImplementations(graph: InheritanceGraph, interfaceName: string): string[] {
    return graph.implementations.get(interfaceName) || [];
  }

  detectInheritanceDepth(graph: InheritanceGraph): Map<string, number> {
    const depths = new Map<string, number>();

    const calculateDepth = (classId: string): number => {
      if (depths.has(classId)) return depths.get(classId)!;

      const parents = graph.classHierarchy.get(classId) || [];
      if (parents.length === 0) {
        depths.set(classId, 0);
        return 0;
      }

      const parentDepths = parents.map((p) => calculateDepth(p));
      const depth = Math.max(...parentDepths) + 1;
      depths.set(classId, depth);
      return depth;
    };

    for (const node of graph.nodes) {
      calculateDepth(node);
    }

    return depths;
  }

  findBaseClasses(graph: InheritanceGraph): string[] {
    return graph.nodes.filter((node) => {
      const parents = graph.classHierarchy.get(node);
      return !parents || parents.length === 0;
    });
  }

  calculateInheritanceMetrics(graph: InheritanceGraph): {
    totalClasses: number;
    totalInterfaces: number;
    inheritanceDepth: number;
    multipleInheritance: number;
  } {
    const depths = this.detectInheritanceDepth(graph);
    const maxDepth = Math.max(...depths.values(), 0);

    const multipleInheritance = Array.from(graph.classHierarchy.values()).filter(
      (parents) => parents.length > 1
    ).length;

    return {
      totalClasses: graph.nodes.length,
      totalInterfaces: graph.implementations.size,
      inheritanceDepth: maxDepth,
      multipleInheritance,
    };
  }
}

export const inheritanceAnalyzer = new InheritanceAnalyzer();
