import { describe, it, expect } from "vitest";
import { architectureDetector } from "../src/core/analysis/architectureDetector.js";

describe("Architecture Detector", () => {
  it("should detect MVC pattern", () => {
    const symbols = [
      { id: "src/controllers/user.ts#UserController", name: "UserController", type: "class", file: "src/controllers/user.ts" },
      { id: "src/models/user.ts#User", name: "User", type: "class", file: "src/models/user.ts" },
      { id: "src/views/user.html#UserView", name: "UserView", type: "class", file: "src/views/user.html" },
    ];

    const graph = {
      edges: [
        { from: "src/controllers/user.ts#UserController", to: "src/models/user.ts#User", type: "import" },
      ],
    };

    const result = architectureDetector.detect(symbols, graph);

    expect(result.primary).not.toBeNull();
    expect(result.primary?.name).toContain("MVC");
    expect(result.primary?.confidence).toBeGreaterThan(0.5);
    expect(result.primary?.evidence.length).toBeGreaterThan(0);
  });

  it("should detect Layered Architecture", () => {
    const symbols = [
      { id: "src/api/controller.ts#ApiController", name: "ApiController", type: "class", file: "src/api/controller.ts" },
      { id: "src/services/user.ts#UserService", name: "UserService", type: "class", file: "src/services/user.ts" },
      { id: "src/repositories/user.ts#UserRepository", name: "UserRepository", type: "class", file: "src/repositories/user.ts" },
    ];

    const graph = {
      edges: [
        { from: "src/api/controller.ts#ApiController", to: "src/services/user.ts#UserService", type: "import" },
        { from: "src/services/user.ts#UserService", to: "src/repositories/user.ts#UserRepository", type: "import" },
      ],
    };

    const result = architectureDetector.detect(symbols, graph);

    expect(result.layers.length).toBeGreaterThanOrEqual(2);
    
    const apiLayer = result.layers.find(l => l.name.includes("API"));
    expect(apiLayer).toBeDefined();
    expect(apiLayer?.symbols).toContain("src/api/controller.ts#ApiController");

    const serviceLayer = result.layers.find(l => l.name.includes("Service"));
    expect(serviceLayer).toBeDefined();
    expect(serviceLayer?.symbols).toContain("src/services/user.ts#UserService");
  });

  it("should detect Clean Architecture", () => {
    const symbols = [
      { id: "src/domain/entity.ts#User", name: "User", type: "class", file: "src/domain/entity.ts" },
      { id: "src/usecases/create.ts#CreateUserUseCase", name: "CreateUserUseCase", type: "class", file: "src/usecases/create.ts" },
      { id: "src/interfaces/controller.ts#UserController", name: "UserController", type: "class", file: "src/interfaces/controller.ts" },
    ];

    const graph = {
      edges: [
        { from: "src/usecases/create.ts#CreateUserUseCase", to: "src/domain/entity.ts#User", type: "import" },
      ],
    };

    const result = architectureDetector.detect(symbols, graph);

    const cleanArch = result.secondary.find(p => p.name.includes("Clean"));
    expect(cleanArch || result.primary?.name.includes("Clean")).toBeTruthy();
  });

  it("should detect entry points", () => {
    const symbols = [
      { id: "src/main.ts#main", name: "main", type: "function", file: "src/main.ts" },
      { id: "src/index.ts#bootstrap", name: "bootstrap", type: "function", file: "src/index.ts" },
      { id: "src/utils/helper.ts#helper", name: "helper", type: "function", file: "src/utils/helper.ts" },
    ];

    const graph = { edges: [] };

    const result = architectureDetector.detect(symbols, graph);

    expect(result.entryPoints).toContain("src/main.ts#main");
    expect(result.entryPoints).toContain("src/index.ts#bootstrap");
    expect(result.entryPoints).not.toContain("src/utils/helper.ts#helper");
  });

  it("should detect multiple patterns", () => {
    const symbols = [
      { id: "src/controllers/home.ts#HomeController", name: "HomeController", type: "class", file: "src/controllers/home.ts" },
      { id: "src/models/user.ts#User", name: "User", type: "class", file: "src/models/user.ts" },
      { id: "src/services/auth.ts#AuthService", name: "AuthService", type: "class", file: "src/services/auth.ts" },
      { id: "src/repositories/user.ts#UserRepository", name: "UserRepository", type: "class", file: "src/repositories/user.ts" },
    ];

    const graph = {
      edges: [
        { from: "src/controllers/home.ts#HomeController", to: "src/services/auth.ts#AuthService", type: "import" },
        { from: "src/services/auth.ts#AuthService", to: "src/repositories/user.ts#UserRepository", type: "import" },
      ],
    };

    const result = architectureDetector.detect(symbols, graph);

    expect(result.secondary.length).toBeGreaterThan(0);
    const totalPatterns = (result.primary ? 1 : 0) + result.secondary.length;
    expect(totalPatterns).toBeGreaterThanOrEqual(1);
  });

  it("should return empty analysis for unknown patterns", () => {
    const symbols = [
      { id: "src/utils/helper.ts#helper", name: "helper", type: "function", file: "src/utils/helper.ts" },
    ];

    const graph = { edges: [] };

    const result = architectureDetector.detect(symbols, graph);

    expect(result.primary).toBeNull();
    expect(result.layers.length).toBe(0);
  });

  it("should detect API layer components", () => {
    const symbols = [
      { id: "src/routes/user.ts#userRoutes", name: "userRoutes", type: "const", file: "src/routes/user.ts" },
      { id: "src/handlers/auth.ts#authHandler", name: "authHandler", type: "function", file: "src/handlers/auth.ts" },
    ];

    const graph = { edges: [] };

    const result = architectureDetector.detect(symbols, graph);

    const apiLayer = result.layers.find(l => l.name.includes("API"));
    expect(apiLayer).toBeDefined();
    expect(apiLayer?.symbols.length).toBeGreaterThanOrEqual(1);
  });
});
