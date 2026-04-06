import { describe, it, expect } from "vitest";
import { analyzeArchitecture, ArchitectureAnalysis } from "../src/analyzers/architecture.js";
import { FileInfo } from "../src/core/repoScanner.js";

describe("Architecture - Module Descriptions", () => {
  describe("inferModuleResponsibility with domain keywords", () => {
    it("should detect user management module", () => {
      const files: FileInfo[] = [
        { name: "index.ts", path: "/test/users/index.ts", relativePath: "users/index.ts", extension: "ts" },
        { name: "controller.ts", path: "/test/users/controller.ts", relativePath: "users/controller.ts", extension: "ts" },
        { name: "service.ts", path: "/test/users/service.ts", relativePath: "users/service.ts", extension: "ts" },
      ];
      const result = analyzeArchitecture(files, "/test");
      const usersModule = result.modules.find(m => m.path === "users");
      
      expect(usersModule).toBeDefined();
      expect(usersModule?.responsibility.toLowerCase()).toContain("user");
    });

    it("should detect auth module with authentication responsibility", () => {
      const files: FileInfo[] = [
        { name: "index.ts", path: "/test/auth/index.ts", relativePath: "auth/index.ts", extension: "ts" },
        { name: "login.ts", path: "/test/auth/login.ts", relativePath: "auth/login.ts", extension: "ts" },
      ];
      const result = analyzeArchitecture(files, "/test");
      const authModule = result.modules.find(m => m.path === "auth");
      
      expect(authModule).toBeDefined();
      expect(authModule?.responsibility.toLowerCase()).toContain("authentication");
    });

    it("should detect order module with order processing", () => {
      const files: FileInfo[] = [
        { name: "index.ts", path: "/test/orders/index.ts", relativePath: "orders/index.ts", extension: "ts" },
        { name: "checkout.ts", path: "/test/orders/checkout.ts", relativePath: "orders/checkout.ts", extension: "ts" },
      ];
      const result = analyzeArchitecture(files, "/test");
      const ordersModule = result.modules.find(m => m.path === "orders");
      
      expect(ordersModule).toBeDefined();
      expect(ordersModule?.responsibility.toLowerCase()).toContain("order");
    });

    it("should detect product module with catalog responsibility", () => {
      const files: FileInfo[] = [
        { name: "index.ts", path: "/test/products/index.ts", relativePath: "products/index.ts", extension: "ts" },
        { name: "catalog.ts", path: "/test/products/catalog.ts", relativePath: "products/catalog.ts", extension: "ts" },
      ];
      const result = analyzeArchitecture(files, "/test");
      const productsModule = result.modules.find(m => m.path === "products");
      
      expect(productsModule).toBeDefined();
      expect(productsModule?.responsibility.toLowerCase()).toContain("product");
    });

    it("should detect payment module with payment processing", () => {
      const files: FileInfo[] = [
        { name: "index.ts", path: "/test/payments/index.ts", relativePath: "payments/index.ts", extension: "ts" },
        { name: "processor.ts", path: "/test/payments/processor.ts", relativePath: "payments/processor.ts", extension: "ts" },
      ];
      const result = analyzeArchitecture(files, "/test");
      const paymentsModule = result.modules.find(m => m.path === "payments");
      
      expect(paymentsModule).toBeDefined();
      expect(paymentsModule?.responsibility.toLowerCase()).toContain("payment");
    });

    it("should combine domain + technical responsibility", () => {
      const files: FileInfo[] = [
        { name: "index.ts", path: "/test/users/api.ts", relativePath: "users/api.ts", extension: "ts" },
      ];
      const result = analyzeArchitecture(files, "/test");
      const apiModule = result.modules.find(m => m.path === "users");
      
      expect(apiModule).toBeDefined();
      const resp = apiModule?.responsibility.toLowerCase() || "";
      expect(resp.includes("user") || resp.includes("api")).toBeTruthy();
    });

    it("should fallback to language description for unrecognized directories", () => {
      const files: FileInfo[] = [
        { name: "index.ts", path: "/test/xyz/index.ts", relativePath: "xyz/index.ts", extension: "ts" },
      ];
      const result = analyzeArchitecture(files, "/test");
      const xyzModule = result.modules.find(m => m.path === "xyz");
      
      expect(xyzModule).toBeDefined();
      expect(xyzModule?.responsibility).toContain("TypeScript");
    });

    it("should detect blog/content management module", () => {
      const files: FileInfo[] = [
        { name: "index.ts", path: "/test/blog/index.ts", relativePath: "blog/index.ts", extension: "ts" },
        { name: "post.ts", path: "/test/blog/post.ts", relativePath: "blog/post.ts", extension: "ts" },
      ];
      const result = analyzeArchitecture(files, "/test");
      const blogModule = result.modules.find(m => m.path === "blog");
      
      expect(blogModule).toBeDefined();
      expect(blogModule?.responsibility.toLowerCase()).toContain("blog");
    });

    it("should detect message/notification module", () => {
      const files: FileInfo[] = [
        { name: "index.ts", path: "/test/messages/index.ts", relativePath: "messages/index.ts", extension: "ts" },
        { name: "sender.ts", path: "/test/messages/sender.ts", relativePath: "messages/sender.ts", extension: "ts" },
      ];
      const result = analyzeArchitecture(files, "/test");
      const messagesModule = result.modules.find(m => m.path === "messages");
      
      expect(messagesModule).toBeDefined();
      expect(messagesModule?.responsibility.toLowerCase()).toContain("messaging");
    });

    it("should detect admin/settings module", () => {
      const files: FileInfo[] = [
        { name: "index.ts", path: "/test/admin/index.ts", relativePath: "admin/index.ts", extension: "ts" },
        { name: "config.ts", path: "/test/admin/config.ts", relativePath: "admin/config.ts", extension: "ts" },
      ];
      const result = analyzeArchitecture(files, "/test");
      const adminModule = result.modules.find(m => m.path === "admin");
      
      expect(adminModule).toBeDefined();
      expect(adminModule?.responsibility.toLowerCase()).toContain("admin");
    });
  });
});