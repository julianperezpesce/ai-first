export interface ArchitecturePattern {
  name: string;
  confidence: number;
  evidence: string[];
}

export interface Layer {
  name: string;
  files: string[];
  symbols: string[];
  responsibility: string;
}

export interface ArchitectureAnalysis {
  primary: ArchitecturePattern | null;
  secondary: ArchitecturePattern[];
  layers: Layer[];
  entryPoints: string[];
}

interface PatternMatcher {
  name: string;
  analyze(
    symbols: Array<{
      id: string;
      name: string;
      type: string;
      file: string;
    }>,
    dependencyGraph: {
      edges: Array<{ from: string; to: string; type: string }>;
    }
  ): { confidence: number; evidence: string[] };
}

export class ArchitectureDetector {
  private patterns: PatternMatcher[] = [
    {
      name: "MVC (Model-View-Controller)",
      analyze: (symbols, graph) => {
        const evidence: string[] = [];
        let score = 0;

        const controllers = symbols.filter(
          (s) =>
            s.name.toLowerCase().includes("controller") ||
            s.file.toLowerCase().includes("controller")
        );
        const models = symbols.filter(
          (s) =>
            s.name.toLowerCase().includes("model") ||
            s.file.toLowerCase().includes("model")
        );
        const views = symbols.filter(
          (s) =>
            s.name.toLowerCase().includes("view") ||
            s.file.toLowerCase().includes("view")
        );

        if (controllers.length > 0) {
          evidence.push(`Found ${controllers.length} controllers`);
          score += 0.3;
        }
        if (models.length > 0) {
          evidence.push(`Found ${models.length} models`);
          score += 0.3;
        }
        if (views.length > 0) {
          evidence.push(`Found ${views.length} views`);
          score += 0.2;
        }

        const controllerToModel = graph.edges.some(
          (e) =>
            e.from.toLowerCase().includes("controller") &&
            e.to.toLowerCase().includes("model")
        );
        if (controllerToModel) {
          evidence.push("Controllers import Models");
          score += 0.2;
        }

        return { confidence: Math.min(score, 1), evidence };
      },
    },
    {
      name: "Layered Architecture",
      analyze: (symbols, graph) => {
        const evidence: string[] = [];
        let score = 0;

        const layers = {
          api: symbols.filter(
            (s) =>
              s.name.toLowerCase().includes("controller") ||
              s.name.toLowerCase().includes("route") ||
              s.name.toLowerCase().includes("handler") ||
              s.file.toLowerCase().includes("controller") ||
              s.file.toLowerCase().includes("routes")
          ),
          service: symbols.filter(
            (s) =>
              s.name.toLowerCase().includes("service") ||
              s.name.toLowerCase().includes("usecase") ||
              s.file.toLowerCase().includes("service") ||
              s.file.toLowerCase().includes("usecase")
          ),
          data: symbols.filter(
            (s) =>
              s.name.toLowerCase().includes("repository") ||
              s.name.toLowerCase().includes("dao") ||
              s.name.toLowerCase().includes("model") ||
              s.file.toLowerCase().includes("repository") ||
              s.file.toLowerCase().includes("model")
          ),
        };

        if (layers.api.length > 0) {
          evidence.push(`API layer: ${layers.api.length} components`);
          score += 0.25;
        }
        if (layers.service.length > 0) {
          evidence.push(`Service layer: ${layers.service.length} components`);
          score += 0.25;
        }
        if (layers.data.length > 0) {
          evidence.push(`Data layer: ${layers.data.length} components`);
          score += 0.25;
        }

        const hasFlow =
          layers.api.some((api) =>
            graph.edges.some(
              (e) =>
                e.from === api.id &&
                layers.service.some((s) => s.id === e.to)
            )
          ) ||
          layers.service.some((svc) =>
            graph.edges.some(
              (e) =>
                e.from === svc.id &&
                layers.data.some((d) => d.id === e.to)
            )
          );

        if (hasFlow) {
          evidence.push("Layer flow detected: API → Service → Data");
          score += 0.25;
        }

        return { confidence: Math.min(score, 1), evidence };
      },
    },
    {
      name: "Clean Architecture",
      analyze: (symbols, graph) => {
        const evidence: string[] = [];
        let score = 0;

        const entities = symbols.filter(
          (s) =>
            s.file.toLowerCase().includes("entity") ||
            s.file.toLowerCase().includes("domain")
        );
        const useCases = symbols.filter(
          (s) =>
            s.file.toLowerCase().includes("usecase") ||
            s.file.toLowerCase().includes("interactor")
        );
        const interfaces = symbols.filter(
          (s) =>
            s.file.toLowerCase().includes("interface") ||
            s.file.toLowerCase().includes("adapter")
        );

        if (entities.length > 0) {
          evidence.push(`Entities layer: ${entities.length} components`);
          score += 0.3;
        }
        if (useCases.length > 0) {
          evidence.push(`Use Cases layer: ${useCases.length} components`);
          score += 0.3;
        }
        if (interfaces.length > 0) {
          evidence.push(`Interface Adapters: ${interfaces.length} components`);
          score += 0.2;
        }

        const dependencyRule =
          !graph.edges.some(
            (e) =>
              entities.some((ent) => ent.id === e.from) &&
              useCases.some((uc) => uc.id === e.to)
          );

        if (dependencyRule && entities.length > 0) {
          evidence.push("Dependency Rule: Entities have no external dependencies");
          score += 0.2;
        }

        return { confidence: Math.min(score, 1), evidence };
      },
    },
    {
      name: "Hexagonal Architecture (Ports & Adapters)",
      analyze: (symbols, graph) => {
        const evidence: string[] = [];
        let score = 0;

        const ports = symbols.filter(
          (s) =>
            s.name.toLowerCase().includes("port") ||
            s.file.toLowerCase().includes("port")
        );
        const adapters = symbols.filter(
          (s) =>
            s.name.toLowerCase().includes("adapter") ||
            s.file.toLowerCase().includes("adapter")
        );
        const domain = symbols.filter(
          (s) =>
            s.file.toLowerCase().includes("domain") ||
            (!s.file.toLowerCase().includes("adapter") &&
              !s.file.toLowerCase().includes("port"))
        );

        if (ports.length > 0) {
          evidence.push(`Ports: ${ports.length} interfaces`);
          score += 0.3;
        }
        if (adapters.length > 0) {
          evidence.push(`Adapters: ${adapters.length} implementations`);
          score += 0.3;
        }
        if (domain.length > 0) {
          evidence.push(`Domain: ${domain.length} components`);
          score += 0.2;
        }

        const portImplementations = adapters.some((adapter) =>
          graph.edges.some(
            (e) =>
              e.from === adapter.id &&
              ports.some((p) => e.to.includes(p.name))
          )
        );

        if (portImplementations) {
          evidence.push("Adapters implement Ports");
          score += 0.2;
        }

        return { confidence: Math.min(score, 1), evidence };
      },
    },
    {
      name: "Microservices",
      analyze: (symbols, graph) => {
        const evidence: string[] = [];
        let score = 0;

        const services = symbols.filter(
          (s) =>
            s.name.toLowerCase().includes("service") ||
            s.file.toLowerCase().includes("service")
        );

        const independentServices = services.filter((svc) => {
          const dependencies = graph.edges.filter((e) => e.from === svc.id);
          return dependencies.length <= 3;
        });

        if (services.length >= 3) {
          evidence.push(`Found ${services.length} services`);
          score += 0.3;
        }

        if (independentServices.length / services.length > 0.5) {
          evidence.push("Services are loosely coupled");
          score += 0.3;
        }

        const noCycles = this.hasNoCircularDependencies(graph);
        if (noCycles && services.length > 0) {
          evidence.push("No circular dependencies between services");
          score += 0.2;
        }

        return { confidence: Math.min(score, 1), evidence };
      },
    },
  ];

  detect(
    symbols: Array<{
      id: string;
      name: string;
      type: string;
      file: string;
    }>,
    dependencyGraph: {
      edges: Array<{ from: string; to: string; type: string }>;
    }
  ): ArchitectureAnalysis {
    const results: ArchitecturePattern[] = [];

    for (const pattern of this.patterns) {
      const result = pattern.analyze(symbols, dependencyGraph);
      if (result.confidence > 0.3) {
        results.push({
          name: pattern.name,
          confidence: result.confidence,
          evidence: result.evidence,
        });
      }
    }

    results.sort((a, b) => b.confidence - a.confidence);

    return {
      primary: results[0] || null,
      secondary: results.slice(1),
      layers: this.detectLayers(symbols),
      entryPoints: this.detectEntryPoints(symbols),
    };
  }

  private detectLayers(
    symbols: Array<{
      id: string;
      name: string;
      type: string;
      file: string;
    }>
  ): Layer[] {
    const layers: Layer[] = [];

    const apiLayer = {
      name: "API / Presentation",
      files: [] as string[],
      symbols: [] as string[],
      responsibility: "HTTP request handling, routing, validation",
    };

    const serviceLayer = {
      name: "Service / Business Logic",
      files: [] as string[],
      symbols: [] as string[],
      responsibility: "Business rules, use cases, workflows",
    };

    const dataLayer = {
      name: "Data / Persistence",
      files: [] as string[],
      symbols: [] as string[],
      responsibility: "Database access, queries, caching",
    };

    for (const symbol of symbols) {
      const name = symbol.name.toLowerCase();
      const file = symbol.file.toLowerCase();

      if (
        name.includes("controller") ||
        name.includes("route") ||
        name.includes("handler") ||
        name.includes("endpoint") ||
        file.includes("controller") ||
        file.includes("routes") ||
        file.includes("api")
      ) {
        if (!apiLayer.files.includes(symbol.file)) {
          apiLayer.files.push(symbol.file);
        }
        apiLayer.symbols.push(symbol.id);
      } else if (
        name.includes("service") ||
        name.includes("usecase") ||
        name.includes("manager") ||
        name.includes("handler") ||
        file.includes("service") ||
        file.includes("usecase") ||
        file.includes("business")
      ) {
        if (!serviceLayer.files.includes(symbol.file)) {
          serviceLayer.files.push(symbol.file);
        }
        serviceLayer.symbols.push(symbol.id);
      } else if (
        name.includes("repository") ||
        name.includes("dao") ||
        name.includes("model") ||
        name.includes("entity") ||
        file.includes("repository") ||
        file.includes("model") ||
        file.includes("data") ||
        file.includes("db")
      ) {
        if (!dataLayer.files.includes(symbol.file)) {
          dataLayer.files.push(symbol.file);
        }
        dataLayer.symbols.push(symbol.id);
      }
    }

    if (apiLayer.symbols.length > 0) layers.push(apiLayer);
    if (serviceLayer.symbols.length > 0) layers.push(serviceLayer);
    if (dataLayer.symbols.length > 0) layers.push(dataLayer);

    return layers;
  }

  private detectEntryPoints(
    symbols: Array<{
      id: string;
      name: string;
      type: string;
      file: string;
    }>
  ): string[] {
    const entryPoints: string[] = [];

    const patterns = [
      /main$/i,
      /index$/i,
      /init$/i,
      /start$/i,
      /server$/i,
      /app$/i,
      /bootstrap$/i,
      /handler$/i,
      /controller$/i,
    ];

    for (const symbol of symbols) {
      const name = symbol.name.toLowerCase();
      const file = symbol.file.toLowerCase();

      if (
        patterns.some((p) => p.test(name)) ||
        file.includes("main.") ||
        file.includes("index.") ||
        file.includes("app.") ||
        file.includes("server.")
      ) {
        entryPoints.push(symbol.id);
      }
    }

    return [...new Set(entryPoints)];
  }

  private hasNoCircularDependencies(graph: {
    edges: Array<{ from: string; to: string; type: string }>;
  }): boolean {
    const nodes = [...new Set(graph.edges.flatMap((e) => [e.from, e.to]))];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string): boolean => {
      if (recursionStack.has(node)) return false;
      if (visited.has(node)) return true;

      visited.add(node);
      recursionStack.add(node);

      const outgoing = graph.edges.filter((e) => e.from === node);
      for (const edge of outgoing) {
        if (!dfs(edge.to)) return false;
      }

      recursionStack.delete(node);
      return true;
    };

    for (const node of nodes) {
      if (!visited.has(node)) {
        if (!dfs(node)) return false;
      }
    }

    return true;
  }
}

export const architectureDetector = new ArchitectureDetector();
