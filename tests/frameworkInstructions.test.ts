import { describe, it, expect } from "vitest";
import { detectFrameworkFromFiles, generateFrameworkInstructions } from "../src/analyzers/frameworkInstructions.js";
import { scanRepo } from "../src/core/repoScanner.js";

describe("Framework Instructions - Django", () => {
  it("should detect Django from real project", () => {
    const { files } = scanRepo("test-projects/django-app");
    const frameworks = detectFrameworkFromFiles(files, "test-projects/django-app");
    expect(frameworks).toContain("Django");
  });

  it("should generate Django instructions for real project", () => {
    const { files } = scanRepo("test-projects/django-app");
    const instructions = generateFrameworkInstructions(files, "test-projects/django-app");
    expect(instructions).toContain("## Framework Instructions");
    expect(instructions).toContain("### Django");
    expect(instructions).toContain("python manage.py");
    expect(instructions).toContain("makemigrations");
  });

  it("should include DRF guidance", () => {
    const { files } = scanRepo("test-projects/django-app");
    const instructions = generateFrameworkInstructions(files, "test-projects/django-app");
    expect(instructions).toContain("Django REST Framework");
    expect(instructions).toContain("ViewSets");
    expect(instructions).toContain("Serializers");
  });
});

describe("Framework Instructions - Express.js", () => {
  it("should detect Express.js from real project", () => {
    const { files } = scanRepo("test-projects/express-api");
    const frameworks = detectFrameworkFromFiles(files, "test-projects/express-api");
    expect(frameworks).toContain("Express.js");
  });

  it("should generate Express instructions for real project", () => {
    const { files } = scanRepo("test-projects/express-api");
    const instructions = generateFrameworkInstructions(files, "test-projects/express-api");
    expect(instructions).toContain("## Framework Instructions");
    expect(instructions).toContain("### Express.js");
    expect(instructions).toContain("Middleware Order");
    expect(instructions).toContain("express.Router()");
  });
});

describe("Framework Instructions - FastAPI", () => {
  it("should detect FastAPI from real project", () => {
    const { files } = scanRepo("test-projects/fastapi-app");
    const frameworks = detectFrameworkFromFiles(files, "test-projects/fastapi-app");
    expect(frameworks).toContain("FastAPI");
  });

  it("should generate FastAPI instructions for real project", () => {
    const { files } = scanRepo("test-projects/fastapi-app");
    const instructions = generateFrameworkInstructions(files, "test-projects/fastapi-app");
    expect(instructions).toContain("## Framework Instructions");
    expect(instructions).toContain("### FastAPI");
    expect(instructions).toContain("Pydantic");
    expect(instructions).toContain("Depends()");
  });
});

describe("Framework Instructions - Flask", () => {
  it("should detect Flask from real project", () => {
    const { files } = scanRepo("test-projects/flask-app");
    const frameworks = detectFrameworkFromFiles(files, "test-projects/flask-app");
    expect(frameworks).toContain("Flask");
  });

  it("should generate Flask instructions for real project", () => {
    const { files } = scanRepo("test-projects/flask-app");
    const instructions = generateFrameworkInstructions(files, "test-projects/flask-app");
    expect(instructions).toContain("## Framework Instructions");
    expect(instructions).toContain("### Flask");
    expect(instructions).toContain("Blueprints");
  });
});

describe("Framework Instructions - NestJS", () => {
  it("should detect NestJS from real project", () => {
    const { files } = scanRepo("test-projects/nestjs-backend");
    const frameworks = detectFrameworkFromFiles(files, "test-projects/nestjs-backend");
    expect(frameworks).toContain("NestJS");
  });

  it("should generate NestJS instructions for real project", () => {
    const { files } = scanRepo("test-projects/nestjs-backend");
    const instructions = generateFrameworkInstructions(files, "test-projects/nestjs-backend");
    expect(instructions).toContain("## Framework Instructions");
    expect(instructions).toContain("### NestJS");
    expect(instructions).toContain("@Module()");
  });
});

describe("Framework Instructions - Laravel", () => {
  it("should detect Laravel from real project", () => {
    const { files } = scanRepo("test-projects/laravel-app");
    const frameworks = detectFrameworkFromFiles(files, "test-projects/laravel-app");
    expect(frameworks).toContain("Laravel");
  });

  it("should generate Laravel instructions for real project", () => {
    const { files } = scanRepo("test-projects/laravel-app");
    const instructions = generateFrameworkInstructions(files, "test-projects/laravel-app");
    expect(instructions).toContain("## Framework Instructions");
    expect(instructions).toContain("### Laravel");
    expect(instructions).toContain("php artisan");
    expect(instructions).toContain("Eloquent");
  });
});

describe("Framework Instructions - Rails", () => {
  it("should not generate Rails instructions (Rails detection requires package.json with rails dependency)", () => {
    const { files } = scanRepo("test-projects/rails-app");
    const instructions = generateFrameworkInstructions(files, "test-projects/rails-app");
    expect(instructions).toBe("");
  });
});

describe("Framework Instructions - Spring Boot", () => {
  it("should detect Spring Boot from real project", () => {
    const { files } = scanRepo("test-projects/spring-boot-app");
    const frameworks = detectFrameworkFromFiles(files, "test-projects/spring-boot-app");
    expect(frameworks).toContain("Spring Boot");
  });

  it("should generate Spring Boot instructions for real project", () => {
    const { files } = scanRepo("test-projects/spring-boot-app");
    const instructions = generateFrameworkInstructions(files, "test-projects/spring-boot-app");
    expect(instructions).toContain("## Framework Instructions");
    expect(instructions).toContain("### Spring Boot");
    expect(instructions).toContain("@SpringBootApplication");
  });
});

describe("Framework Instructions - No Framework", () => {
  it("should return empty for Python CLI (no web framework)", () => {
    const { files } = scanRepo("test-projects/python-cli");
    const instructions = generateFrameworkInstructions(files, "test-projects/python-cli");
    expect(instructions).toBe("");
  });

  it("should return empty for React (frontend only)", () => {
    const { files } = scanRepo("test-projects/react-app");
    const instructions = generateFrameworkInstructions(files, "test-projects/react-app");
    expect(instructions).toBe("");
  });
});