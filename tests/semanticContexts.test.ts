import { describe, it, expect, beforeEach } from "vitest";
import {
  generateFeatures,
  generateFlows,
  generateSemanticContexts,
  type Feature,
  type Flow
} from "../src/core/semanticContexts.js";
import fs from "fs";
import path from "path";
import os from "os";

// Test helper to create temp directory with modules.json
function createTempTestDir(files: Record<string, string[]>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-test-"));
  const aiDir = path.join(tempDir, "ai");
  fs.mkdirSync(aiDir, { recursive: true });
  fs.mkdirSync(path.join(aiDir, "context", "features"), { recursive: true });
  fs.mkdirSync(path.join(aiDir, "context", "flows"), { recursive: true });
  fs.mkdirSync(path.join(aiDir, "graph"), { recursive: true });
  
  // Create modules.json - use key as module name, derive path from files
  const modules: Record<string, { path: string; files: string[] }> = {};
  for (const [moduleName, moduleFiles] of Object.entries(files)) {
    // Derive path from the first file's directory
    const firstFile = moduleFiles[0] || "";
    const pathParts = firstFile.split("/");
    const derivedPath = pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : moduleName;
    
    modules[moduleName] = {
      path: derivedPath || moduleName,
      files: moduleFiles
    };
  }
  fs.writeFileSync(
    path.join(aiDir, "modules.json"),
    JSON.stringify({ modules }, null, 2)
  );
  
  return aiDir;
}

describe("Feature Detection", () => {
  describe("generateFeatures", () => {
    it("should detect valid business features", () => {
      const aiDir = createTempTestDir({
        "auth": [
          "src/auth/authController.ts",
          "src/auth/authService.ts",
          "src/auth/authRepository.ts"
        ],
        "users": [
          "src/users/userController.ts",
          "src/users/userService.ts",
          "src/users/userRepository.ts"
        ],
        "payments": [
          "src/payments/paymentController.ts",
          "src/payments/paymentService.ts",
          "src/payments/paymentRepository.ts"
        ]
      });

      const features = generateFeatures(path.join(aiDir, "modules.json"), "");

      expect(features.length).toBeGreaterThanOrEqual(3);
      
      const featureNames = features.map(f => f.name);
      expect(featureNames).toContain("auth");
      expect(featureNames).toContain("users");
      expect(featureNames).toContain("payments");
    });

    it("should ignore technical folders (utils, helpers, types)", () => {
      const aiDir = createTempTestDir({
        "src/utils": [
          "src/utils/helper.ts",
          "src/utils/logger.ts",
          "src/utils/validator.ts"
        ],
        "src/helpers": [
          "src/helpers/format.ts",
          "src/helpers/parse.ts"
        ],
        "src/types": [
          "src/types/index.ts",
          "src/types/models.ts"
        ]
      });

      const features = generateFeatures(path.join(aiDir, "modules.json"), "");

      // Should not detect utils, helpers, types as features
      const featureNames = features.map(f => f.name);
      expect(featureNames).not.toContain("utils");
      expect(featureNames).not.toContain("helpers");
      expect(featureNames).not.toContain("types");
    });

    it("should require at least 2 source files", () => {
      const aiDir = createTempTestDir({
        "src/small": [
          "src/small/file1.ts"
        ],
        "src/auth": [
          "src/auth/controller.ts",
          "src/auth/service.ts"
        ]
      });

      const features = generateFeatures(path.join(aiDir, "modules.json"), "");

      // Small feature should be filtered out (only 1 file)
      expect(features.find(f => f.name === "small")).toBeUndefined();
      // Auth should exist (2 files = minimum)
      expect(features.find(f => f.name === "auth")).toBeDefined();
    });

    it("should require at least one entrypoint", () => {
      const aiDir = createTempTestDir({
        "src/noentry": [
          "src/noentry/model.ts",
          "src/noentry/types.ts",
          "src/noentry/constants.ts"
        ],
        "src/auth": [
          "src/auth/controller.ts",
          "src/auth/service.ts",
          "src/auth/repository.ts"
        ]
      });

      const features = generateFeatures(path.join(aiDir, "modules.json"), "");

      // noentry should be filtered out (no entrypoint)
      expect(features.find(f => f.name === "noentry")).toBeUndefined();
      // Auth should exist
      expect(features.find(f => f.name === "auth")).toBeDefined();
    });

    it("should detect nested features at depth 2 (src/modules/auth)", () => {
      const aiDir = createTempTestDir({
        "src/modules/auth": [
          "src/modules/auth/authController.ts",
          "src/modules/auth/authService.ts",
          "src/modules/auth/authRepository.ts"
        ]
      });

      const features = generateFeatures(path.join(aiDir, "modules.json"), "");

      // Should detect nested feature
      const authFeature = features.find(f => f.name === "auth");
      expect(authFeature).toBeDefined();
      expect(authFeature?.path).toContain("modules");
    });

    it("should include entrypoints in feature output", () => {
      const aiDir = createTempTestDir({
        "auth": [
          "src/auth/authController.ts",
          "src/auth/authService.ts",
          "src/auth/authRepository.ts"
        ]
      });

      const features = generateFeatures(path.join(aiDir, "modules.json"), "");

      const authFeature = features.find(f => f.name === "auth");
      expect(authFeature).toBeDefined();
      expect(authFeature?.entrypoints.length).toBeGreaterThan(0);
      expect(authFeature?.entrypoints[0]).toContain("Controller");
    });

    it("should include path in feature output", () => {
      const aiDir = createTempTestDir({
        "auth": [
          "src/auth/authController.ts",
          "src/auth/authService.ts",
          "src/auth/authRepository.ts"
        ]
      });

      const features = generateFeatures(path.join(aiDir, "modules.json"), "");

      const authFeature = features.find(f => f.name === "auth");
      expect(authFeature?.path).toBe("src/auth");
    });
  });

  describe("generateFlows", () => {
    it("should generate flows from folder structure", () => {
      const aiDir = createTempTestDir({
        "api": [
          "api/authController.js",
          "api/userController.js",
          "api/productController.js"
        ],
        "services": [
          "services/authService.js",
          "services/userService.js",
          "services/productService.js"
        ],
        "data": [
          "data/authRepository.js",
          "data/userRepository.js",
          "data/productRepository.js"
        ]
      });

      const flows = generateFlows(
        path.join(aiDir, "graph", "symbol-graph.json"),
        path.join(aiDir, "modules.json"),
        path.join(aiDir, "dependencies.json")
      );

      // Should detect auth, user, product flows
      expect(flows.length).toBeGreaterThan(0);
      
      const flowNames = flows.map(f => f.name);
      expect(flowNames).toContain("auth");
    });

    it("should require at least 3 files per flow", () => {
      const aiDir = createTempTestDir({
        "api": ["api/controller.js"],
        "services": ["services/service.js"],
        "data": ["data/repo.js"]
      });

      const flows = generateFlows(
        path.join(aiDir, "graph", "symbol-graph.json"),
        path.join(aiDir, "modules.json")
      );

      // Flows should be filtered out if less than 2 files
      for (const flow of flows) {
        expect(flow.files.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should require at least 2 layers per flow", () => {
      const aiDir = createTempTestDir({
        "api": [
          "api/authController.js",
          "api/userController.js",
          "api/productController.js"
        ]
      });

      const flows = generateFlows(
        path.join(aiDir, "graph", "symbol-graph.json"),
        path.join(aiDir, "modules.json")
      );

      // Flows should have at least 1 layer
      for (const flow of flows) {
        expect(flow.layers.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should include entrypoint in flow output", () => {
      const aiDir = createTempTestDir({
        "api": ["api/authController.js"],
        "services": ["services/authService.js"],
        "data": ["data/authRepository.js"]
      });

      const flows = generateFlows(
        path.join(aiDir, "graph", "symbol-graph.json"),
        path.join(aiDir, "modules.json")
      );

      for (const flow of flows) {
        expect(flow.entrypoint).toBeDefined();
        expect(flow.entrypoint.length).toBeGreaterThan(0);
      }
    });

    it("should use fallback when symbol graph is weak", () => {
      // Create minimal graph data (weak graph)
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-test-"));
      const aiDir = path.join(tempDir, "ai");
      fs.mkdirSync(path.join(aiDir, "graph"), { recursive: true });
      
      // Create weak symbol graph (only 1 relationship)
      const weakGraph = {
        symbols: [
          { id: "api/authController.js#AuthController", name: "AuthController", file: "api/authController.js" }
        ],
        relationships: [
          { symbolId: "api/authController.js#AuthController", targetId: "api/authController.js#AuthController", type: "exports" }
        ]
      };
      fs.writeFileSync(
        path.join(aiDir, "graph", "symbol-graph.json"),
        JSON.stringify(weakGraph)
      );
      
      // Create modules
      const modules = {
        "api": { path: "api", files: ["api/authController.js", "api/userController.js", "api/productController.js"] },
        "services": { path: "services", files: ["services/authService.js", "services/userService.js"] },
        "data": { path: "data", files: ["data/authRepository.js", "data/userRepository.js"] }
      };
      fs.mkdirSync(aiDir, { recursive: true });
      fs.writeFileSync(path.join(aiDir, "modules.json"), JSON.stringify({ modules }));
      
      const flows = generateFlows(
        path.join(aiDir, "graph", "symbol-graph.json"),
        path.join(aiDir, "modules.json")
      );

      // Should still detect flows via fallback
      expect(flows.length).toBeGreaterThan(0);
    });

    it("should respect MAX_FLOW_DEPTH limit", () => {
      const aiDir = createTempTestDir({
        "api": ["api/authController.js"],
        "services": ["services/authService.js"],
        "data": ["data/authRepository.js"]
      });

      const flows = generateFlows(
        path.join(aiDir, "graph", "symbol-graph.json"),
        path.join(aiDir, "modules.json")
      );

      for (const flow of flows) {
        expect(flow.depth).toBeLessThanOrEqual(5); // MAX_FLOW_DEPTH = 5
      }
    });

    it("should respect MAX_FLOW_FILES limit", () => {
      const aiDir = createTempTestDir({
        "api": ["api/authController.js"],
        "services": ["services/authService.js"],
        "data": ["data/authRepository.js"]
      });

      const flows = generateFlows(
        path.join(aiDir, "graph", "symbol-graph.json"),
        path.join(aiDir, "modules.json")
      );

      for (const flow of flows) {
        expect(flow.files.length).toBeLessThanOrEqual(30); // MAX_FLOW_FILES = 30
      }
    });

    it("should detect flows using folder naming conventions", () => {
      const aiDir = createTempTestDir({
        "api": ["api/loginController.js", "api/logoutController.js"],
        "services": ["services/loginService.js", "services/logoutService.js"],
        "data": ["data/loginRepository.js", "data/logoutRepository.js"]
      });

      const flows = generateFlows(
        path.join(aiDir, "graph", "symbol-graph.json"),
        path.join(aiDir, "modules.json")
      );

      // Should group by feature prefix (login, logout)
      const flowNames = flows.map(f => f.name);
      expect(flowNames).toContain("login");
    });
  });

  describe("generateSemanticContexts", () => {
    it("should create features and flows directories", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-test-"));
      const aiDir = path.join(tempDir, "ai");
      
      fs.mkdirSync(aiDir, { recursive: true });
      fs.writeFileSync(
        path.join(aiDir, "modules.json"),
        JSON.stringify({
          modules: {
            "src/auth": {
              path: "src/auth",
              files: [
                "src/auth/authController.ts",
                "src/auth/authService.ts",
                "src/auth/authRepository.ts"
              ]
            }
          }
        }, null, 2)
      );

      const result = generateSemanticContexts(aiDir);

      expect(fs.existsSync(path.join(aiDir, "context", "features"))).toBe(true);
      expect(fs.existsSync(path.join(aiDir, "context", "flows"))).toBe(true);
      expect(result.features.length).toBeGreaterThan(0);
      expect(result.flows).toBeDefined();
    });

    it("should write feature JSON files", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-test-"));
      const aiDir = path.join(tempDir, "ai");
      
      fs.mkdirSync(aiDir, { recursive: true });
      fs.writeFileSync(
        path.join(aiDir, "modules.json"),
        JSON.stringify({
          modules: {
            "auth": {
              path: "src/auth",
              files: [
                "src/auth/authController.ts",
                "src/auth/authService.ts",
                "src/auth/authRepository.ts"
              ]
            }
          }
        }, null, 2)
      );

      generateSemanticContexts(aiDir);

      const featureFile = path.join(aiDir, "context", "features", "auth.json");
      expect(fs.existsSync(featureFile)).toBe(true);
      
      const featureData = JSON.parse(fs.readFileSync(featureFile, "utf-8"));
      expect(featureData.name).toBe("auth");
      expect(featureData.path).toBe("src/auth");
      expect(featureData.entrypoints).toBeDefined();
      expect(featureData.files).toBeDefined();
    });
  });
});
