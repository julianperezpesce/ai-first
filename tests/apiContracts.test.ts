import { describe, it, expect } from "vitest";
import { generateApiContracts } from "../src/analyzers/apiContracts.js";
import { scanRepo } from "../src/core/repoScanner.js";

describe("API Contracts", () => {
  describe("generateApiContracts", () => {
    it("should return empty string when no endpoints found", () => {
      const { files } = scanRepo("fixtures/python-cli");
      const contracts = generateApiContracts(files, "fixtures/python-cli");
      expect(contracts).toBe("");
    });

    it("should generate API contracts section header", () => {
      const { files } = scanRepo("fixtures/express-api");
      const contracts = generateApiContracts(files, "fixtures/express-api");
      expect(contracts).toContain("## API Contracts");
    });

    it("should format endpoints with method and path", () => {
      const { files } = scanRepo("fixtures/express-api");
      const contracts = generateApiContracts(files, "fixtures/express-api");
      expect(contracts).toMatch(/### (GET|POST|PUT|DELETE|PATCH)/);
    });

    it("should include handler information", () => {
      const { files } = scanRepo("fixtures/express-api");
      const contracts = generateApiContracts(files, "fixtures/express-api");
      expect(contracts).toContain("**Handler**");
    });

    it("should include description", () => {
      const { files } = scanRepo("fixtures/express-api");
      const contracts = generateApiContracts(files, "fixtures/express-api");
      expect(contracts).toContain("**Description**");
    });
  });
});

describe("API Contracts - Express Endpoints", () => {
  it("should detect Express GET endpoints", () => {
    const { files } = scanRepo("fixtures/express-api");
    const contracts = generateApiContracts(files, "fixtures/express-api");
    expect(contracts).toContain("GET");
  });

  it("should detect Express POST endpoints", () => {
    const { files } = scanRepo("fixtures/express-api");
    const contracts = generateApiContracts(files, "fixtures/express-api");
    expect(contracts).toContain("POST");
  });
});

describe("API Contracts - NestJS Endpoints", () => {
  it("should detect NestJS endpoints when present", () => {
    const { files } = scanRepo("fixtures/nestjs-backend");
    const contracts = generateApiContracts(files, "fixtures/nestjs-backend");
    expect(contracts).toContain("GET");
  });
});

describe("API Contracts - FastAPI Endpoints", () => {
  it("should detect FastAPI endpoints when present", () => {
    const { files } = scanRepo("fixtures/fastapi-app");
    const contracts = generateApiContracts(files, "fixtures/fastapi-app");
    expect(contracts).toContain("GET");
  });
});

describe("API Contracts - Spring Boot Endpoints", () => {
  it("should detect Spring Boot endpoints when present", () => {
    const { files } = scanRepo("fixtures/spring-boot-app");
    const contracts = generateApiContracts(files, "fixtures/spring-boot-app");
    expect(contracts).toContain("GET");
  });
});

describe("API Contracts - Django REST Framework", () => {
  it("should detect Django endpoints when present", () => {
    const { files } = scanRepo("fixtures/django-app");
    const contracts = generateApiContracts(files, "fixtures/django-app");
    expect(contracts).toContain("GET");
  });
});