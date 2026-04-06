import { describe, it, expect } from "vitest";
import { generateApiContracts } from "../src/analyzers/apiContracts.js";
import { scanRepo } from "../src/core/repoScanner.js";

describe("API Contracts", () => {
  describe("generateApiContracts", () => {
    it("should return empty string when no endpoints found", () => {
      const { files } = scanRepo("test-projects/python-cli");
      const contracts = generateApiContracts(files, "test-projects/python-cli");
      expect(contracts).toBe("");
    });

    it("should generate API contracts section header", () => {
      const { files } = scanRepo("test-projects/express-api");
      const contracts = generateApiContracts(files, "test-projects/express-api");
      expect(contracts).toContain("## API Contracts");
    });

    it("should format endpoints with method and path", () => {
      const { files } = scanRepo("test-projects/express-api");
      const contracts = generateApiContracts(files, "test-projects/express-api");
      expect(contracts).toMatch(/### (GET|POST|PUT|DELETE|PATCH)/);
    });

    it("should include handler information", () => {
      const { files } = scanRepo("test-projects/express-api");
      const contracts = generateApiContracts(files, "test-projects/express-api");
      expect(contracts).toContain("**Handler**");
    });

    it("should include description", () => {
      const { files } = scanRepo("test-projects/express-api");
      const contracts = generateApiContracts(files, "test-projects/express-api");
      expect(contracts).toContain("**Description**");
    });
  });
});

describe("API Contracts - Express Endpoints", () => {
  it("should detect Express GET endpoints", () => {
    const { files } = scanRepo("test-projects/express-api");
    const contracts = generateApiContracts(files, "test-projects/express-api");
    expect(contracts).toContain("GET");
  });

  it("should detect Express POST endpoints", () => {
    const { files } = scanRepo("test-projects/express-api");
    const contracts = generateApiContracts(files, "test-projects/express-api");
    expect(contracts).toContain("POST");
  });
});

describe("API Contracts - NestJS Endpoints", () => {
  it("should detect NestJS endpoints when present", () => {
    const { files } = scanRepo("test-projects/nestjs-backend");
    const contracts = generateApiContracts(files, "test-projects/nestjs-backend");
    expect(contracts).toContain("GET");
  });
});

describe("API Contracts - FastAPI Endpoints", () => {
  it("should detect FastAPI endpoints when present", () => {
    const { files } = scanRepo("test-projects/fastapi-app");
    const contracts = generateApiContracts(files, "test-projects/fastapi-app");
    expect(contracts).toContain("GET");
  });
});

describe("API Contracts - Spring Boot Endpoints", () => {
  it("should detect Spring Boot endpoints when present", () => {
    const { files } = scanRepo("test-projects/spring-boot-app");
    const contracts = generateApiContracts(files, "test-projects/spring-boot-app");
    expect(contracts).toContain("GET");
  });
});

describe("API Contracts - Django REST Framework", () => {
  it("should detect Django endpoints when present", () => {
    const { files } = scanRepo("test-projects/django-app");
    const contracts = generateApiContracts(files, "test-projects/django-app");
    expect(contracts).toContain("GET");
  });
});