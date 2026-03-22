import { describe, it, expect, beforeEach } from "vitest";
import { AnalysisPipeline } from "../src/core/pipeline";
import type { FileInfo } from "../src/core/repoScanner";

describe("AnalysisPipeline Integration", () => {
  let pipeline: AnalysisPipeline;

  beforeEach(() => {
    pipeline = new AnalysisPipeline();
  });

  it("should analyze TypeScript files with AST parser", async () => {
    const files: FileInfo[] = [
      {
        path: "/project/src/user.ts",
        relativePath: "src/user.ts",
        name: "user.ts",
        extension: "ts",
      },
    ];

    const content = `
      export class User {
        name: string;
        constructor(name: string) {
          this.name = name;
        }
      }
      
      export function createUser(name: string): User {
        return new User(name);
      }
      
      export interface IUser {
        name: string;
      }
      
      export type UserId = string;
    `;

    const fs = await import("node:fs");
    const tempFile = "/tmp/test-user.ts";
    fs.writeFileSync(tempFile, content);

    files[0].path = tempFile;

    const result = await pipeline.run(files, "TestProject");

    expect(result.symbols.symbols.length).toBeGreaterThan(0);
    expect(result.symbols.symbols.some(s => s.name === "User" && s.type === "class")).toBe(true);
    expect(result.symbols.symbols.some(s => s.name === "createUser" && s.type === "function")).toBe(true);
    expect(result.symbols.symbols.some(s => s.name === "IUser" && s.type === "interface")).toBe(true);
    expect(result.symbols.symbols.some(s => s.name === "UserId" && s.type === "type")).toBe(true);
    
    expect(result.metrics.duration).toBeGreaterThan(0);
    expect(result.metrics.filesProcessed).toBe(1);

    fs.unlinkSync(tempFile);
  });

  it("should detect architecture pattern", async () => {
    const files: FileInfo[] = [
      {
        path: "/project/src/controllers/userController.ts",
        relativePath: "src/controllers/userController.ts",
        name: "userController.ts",
        extension: "ts",
      },
      {
        path: "/project/src/services/userService.ts",
        relativePath: "src/services/userService.ts",
        name: "userService.ts",
        extension: "ts",
      },
      {
        path: "/project/src/repositories/userRepository.ts",
        relativePath: "src/repositories/userRepository.ts",
        name: "userRepository.ts",
        extension: "ts",
      },
    ];

    const controllerContent = `
      export class UserController {
        constructor(private userService: UserService) {}
        async getUser(id: string) {
          return this.userService.findById(id);
        }
      }
    `;

    const serviceContent = `
      export class UserService {
        constructor(private userRepo: UserRepository) {}
        async findById(id: string) {
          return this.userRepo.findOne(id);
        }
      }
    `;

    const repoContent = `
      export class UserRepository {
        async findOne(id: string) {
          return { id, name: "Test" };
        }
      }
    `;

    const fs = await import("node:fs");
    const filesWithContent = [
      { path: "/tmp/test-controller.ts", content: controllerContent },
      { path: "/tmp/test-service.ts", content: serviceContent },
      { path: "/tmp/test-repo.ts", content: repoContent },
    ];

    filesWithContent.forEach(({ path, content }) => {
      fs.writeFileSync(path, content);
    });

    files[0].path = "/tmp/test-controller.ts";
    files[1].path = "/tmp/test-service.ts";
    files[2].path = "/tmp/test-repo.ts";

    const result = await pipeline.run(files, "TestProject");

    expect(result.architecture.primary !== null || result.architecture.secondary.length > 0).toBe(true);
    expect(result.architecture.layers.length).toBeGreaterThan(0);
    expect(result.metrics.filesProcessed).toBe(3);

    filesWithContent.forEach(({ path }) => {
      fs.unlinkSync(path);
    });
  });

  it("should generate AI context", async () => {
    const files: FileInfo[] = [
      {
        path: "/project/src/auth.ts",
        relativePath: "src/auth.ts",
        name: "auth.ts",
        extension: "ts",
      },
    ];

    const content = `
      export function authenticate(token: string): boolean {
        return token.length > 0;
      }
      
      export class AuthMiddleware {
        handle(req: any, res: any, next: any) {
          next();
        }
      }
    `;

    const fs = await import("node:fs");
    fs.writeFileSync("/tmp/test-auth.ts", content);
    files[0].path = "/tmp/test-auth.ts";

    const result = await pipeline.run(files, "AuthService");

    expect(result.aiContext).toContain("AuthService");
    expect(result.aiContext.length).toBeGreaterThan(100);
    expect(result.architectureDoc.length).toBeGreaterThan(0);

    fs.unlinkSync("/tmp/test-auth.ts");
  });

  it("should cache and clear cache correctly", async () => {
    const pipeline = new AnalysisPipeline();
    
    expect(pipeline.getMetrics().cacheSize).toBe(0);
    
    pipeline.clearCache();
    expect(pipeline.getMetrics().cacheSize).toBe(0);
  });

  it("should handle empty file list", async () => {
    const result = await pipeline.run([], "EmptyProject");

    expect(result.symbols.symbols).toEqual([]);
    expect(result.metrics.filesProcessed).toBe(0);
    expect(result.metrics.duration).toBeGreaterThanOrEqual(0);
  });

  it("should handle unsupported file types gracefully", async () => {
    const files: FileInfo[] = [
      {
        path: "/project/readme.md",
        relativePath: "readme.md",
        name: "readme.md",
        extension: "md",
      },
      {
        path: "/project/config.yaml",
        relativePath: "config.yaml",
        name: "config.yaml",
        extension: "yaml",
      },
    ];

    const result = await pipeline.run(files, "MixedProject");

    expect(result.metrics.filesProcessed).toBe(2);
    expect(result.symbols.symbols.length).toBe(0);
  });

  it("should generate dependency graph", async () => {
    const files: FileInfo[] = [
      {
        path: "/project/src/app.ts",
        relativePath: "src/app.ts",
        name: "app.ts",
        extension: "ts",
      },
    ];

    const content = `
      import { UserService } from './services/userService';
      import { Config } from './config';
      
      export class App {
        constructor(private userService: UserService) {}
        start() {
          console.log('Starting...');
        }
      }
      
      export const app = new App();
    `;

    const fs = await import("node:fs");
    fs.writeFileSync("/tmp/test-app.ts", content);
    files[0].path = "/tmp/test-app.ts";

    const result = await pipeline.run(files, "TestApp");

    expect(result.dependencyGraph).toBeDefined();
    expect(result.dependencyGraph.edges).toBeDefined();
    expect(result.dependencyGraph.nodes).toBeDefined();

    fs.unlinkSync("/tmp/test-app.ts");
  });
});
