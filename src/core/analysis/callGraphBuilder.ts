export interface Call {
  caller: string;
  callee: string;
  location: {
    file: string;
    line: number;
    character: number;
  };
  arguments?: string[];
}

export interface CallGraph {
  nodes: string[];
  edges: Call[];
  callsByFunction: Map<string, Call[]>;
  calledBy: Map<string, Call[]>;
}

export class CallGraphBuilder {
  buildCallGraph(
    symbols: Array<{
      id: string;
      name: string;
      file: string;
      type: string;
    }>,
    callExpressions: Array<{
      caller: string;
      callee: string;
      line: number;
      character: number;
      args?: string[];
    }>
  ): CallGraph {
    const graph: CallGraph = {
      nodes: symbols.map((s) => s.id),
      edges: [],
      callsByFunction: new Map(),
      calledBy: new Map(),
    };

    for (const expr of callExpressions) {
      const call: Call = {
        caller: expr.caller,
        callee: expr.callee,
        location: {
          file: expr.caller.split("#")[0],
          line: expr.line,
          character: expr.character,
        },
        arguments: expr.args,
      };

      graph.edges.push(call);

      const callerCalls = graph.callsByFunction.get(expr.caller) || [];
      callerCalls.push(call);
      graph.callsByFunction.set(expr.caller, callerCalls);

      const calleeCalled = graph.calledBy.get(expr.callee) || [];
      calleeCalled.push(call);
      graph.calledBy.set(expr.callee, calleeCalled);
    }

    return graph;
  }

  findUnusedFunctions(graph: CallGraph): string[] {
    const unused: string[] = [];

    for (const node of graph.nodes) {
      const calledBy = graph.calledBy.get(node);
      const isEntryPoint = this.isEntryPoint(node);

      if ((!calledBy || calledBy.length === 0) && !isEntryPoint) {
        unused.push(node);
      }
    }

    return unused;
  }

  findDeadCode(graph: CallGraph, entryPoints: string[]): string[] {
    const reachable = new Set<string>();

    const traverse = (node: string) => {
      if (reachable.has(node)) return;
      reachable.add(node);

      const calls = graph.callsByFunction.get(node) || [];
      for (const call of calls) {
        traverse(call.callee);
      }
    };

    for (const entry of entryPoints) {
      traverse(entry);
    }

    return graph.nodes.filter((n) => !reachable.has(n));
  }

  getCallChain(graph: CallGraph, startFunction: string, depth: number = 5): string[] {
    const chain: string[] = [];
    const visited = new Set<string>();

    const traverse = (func: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(func)) return;

      visited.add(func);
      chain.push(func);

      const calls = graph.callsByFunction.get(func) || [];
      for (const call of calls) {
        traverse(call.callee, currentDepth + 1);
      }
    };

    traverse(startFunction, 0);
    return chain;
  }

  calculateComplexity(graph: CallGraph, functionId: string): number {
    const outgoing = graph.callsByFunction.get(functionId) || [];
    const incoming = graph.calledBy.get(functionId) || [];

    return outgoing.length + incoming.length * 2;
  }

  private isEntryPoint(symbolId: string): boolean {
    const name = symbolId.split("#")[1] || "";
    const file = symbolId.split("#")[0] || "";

    const entryPatterns = [
      /main$/,
      /index$/,
      /init$/,
      /start$/,
      /handler$/,
      /controller$/,
      /route$/,
    ];

    if (entryPatterns.some((p) => p.test(name))) return true;

    if (
      file.includes("main.") ||
      file.includes("index.") ||
      file.includes("app.")
    ) {
      return true;
    }

    return false;
  }
}

export const callGraphBuilder = new CallGraphBuilder();
