import { describe, it, expect } from "vitest";
import { detectTechStack } from "../src/analyzers/techStack.js";
import { analyzeArchitecture } from "../src/analyzers/architecture.js";
import { FileInfo } from "../src/core/repoScanner.js";
import fs from "fs";
import path from "path";
import os from "os";

function createTempProjectDir(files: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-framework-test-"));
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(tempDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content);
  }
  return tempDir;
}

function createFileInfo(relativePath: string, name: string, extension: string): FileInfo {
  return {
    path: path.join("/tmp", relativePath),
    relativePath,
    name,
    extension,
  };
}

describe("Framework Detection - NestJS", () => {
  it("should detect NestJS from @nestjs/common in dependencies", () => {
    const tempDir = createTempProjectDir({
      "package.json": JSON.stringify({
        name: "nestjs-app",
        dependencies: {
          "@nestjs/common": "^10.0.0",
          "@nestjs/core": "^10.0.0",
          "@nestjs/platform-express": "^10.0.0",
        },
      }),
      "src/main.ts": "// main file",
    });

    const files: FileInfo[] = [
      createFileInfo("package.json", "package.json", ""),
      createFileInfo("src/main.ts", "main.ts", "ts"),
    ];

    const techStack = detectTechStack(files, tempDir);
    
    expect(techStack.frameworks).toContain("NestJS");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect NestJS from @nestjs/* packages in devDependencies", () => {
    const tempDir = createTempProjectDir({
      "package.json": JSON.stringify({
        name: "nestjs-app",
        devDependencies: {
          "@nestjs/testing": "^10.0.0",
          "@nestjs/cli": "^10.0.0",
        },
      }),
    });

    const files: FileInfo[] = [createFileInfo("package.json", "package.json", "")];

    const techStack = detectTechStack(files, tempDir);
    
    expect(techStack.frameworks).toContain("NestJS");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should not detect NestJS when only 'nest' is present without @nestjs/*", () => {
    const tempDir = createTempProjectDir({
      "package.json": JSON.stringify({
        name: "other-app",
        dependencies: {
          "nestjs-stuff": "1.0.0",
        },
      }),
    });

    const files: FileInfo[] = [createFileInfo("package.json", "package.json", "")];

    const techStack = detectTechStack(files, tempDir);
    
    // Should not detect NestJS from "nestjs-stuff" package
    expect(techStack.frameworks).not.toContain("NestJS");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

describe("Framework Detection - Spring Boot", () => {
  it("should detect Spring Boot from pom.xml", () => {
    const tempDir = createTempProjectDir({
      "pom.xml": `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.0.0</version>
  </parent>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
  </dependencies>
</project>`,
      "src/main/java/com/example/Application.java": "package com.example;",
    });

    const files: FileInfo[] = [
      createFileInfo("pom.xml", "pom.xml", ""),
      createFileInfo("src/main/java/com/example/Application.java", "Application.java", "java"),
    ];

    const techStack = detectTechStack(files, tempDir);
    
    expect(techStack.frameworks).toContain("Spring Boot");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect Spring Boot from build.gradle", () => {
    const tempDir = createTempProjectDir({
      "build.gradle": `plugins {
    id 'java'
    id 'org.springframework.boot' version '3.0.0'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
}`,
    });

    const files: FileInfo[] = [
      createFileInfo("build.gradle", "build.gradle", ""),
    ];

    const techStack = detectTechStack(files, tempDir);
    
    expect(techStack.frameworks).toContain("Spring Boot");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect Spring Boot from build.gradle.kts", () => {
    const tempDir = createTempProjectDir({
      "build.gradle.kts": `plugins {
    java
    id("org.springframework.boot") version "3.0.0"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
}`,
    });

    const files: FileInfo[] = [
      createFileInfo("build.gradle.kts", "build.gradle.kts", ""),
    ];

    const techStack = detectTechStack(files, tempDir);
    
    expect(techStack.frameworks).toContain("Spring Boot");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect Spring Boot from spring-boot in pom.xml", () => {
    const tempDir = createTempProjectDir({
      "pom.xml": `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
  </dependencies>
</project>`,
    });

    const files: FileInfo[] = [createFileInfo("pom.xml", "pom.xml", "")];

    const techStack = detectTechStack(files, tempDir);
    
    expect(techStack.frameworks).toContain("Spring Boot");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

describe("Architecture Detection - Microservices vs API Server", () => {
  it("should detect API Server for single services directory", () => {
    const files: FileInfo[] = [
      createFileInfo("src/controllers/user.js", "user.js", "js"),
      createFileInfo("src/services/userService.js", "userService.js", "js"),
      createFileInfo("package.json", "package.json", ""),
    ];

    const architecture = analyzeArchitecture(files, "/tmp");
    
    // Should detect API Server, not Microservices
    expect(architecture.description).not.toContain("Microservices");
    expect(architecture.description).toContain("API Server");
  });

  it("should detect Microservices for multiple service directories", () => {
    const files: FileInfo[] = [
      createFileInfo("services/user/src/index.js", "index.js", "js"),
      createFileInfo("services/order/src/index.js", "index.js", "js"),
      createFileInfo("services/payment/src/index.js", "index.js", "js"),
      createFileInfo("package.json", "package.json", ""),
    ];

    const architecture = analyzeArchitecture(files, "/tmp");
    
    // Should detect Microservices when there are multiple service directories
    expect(architecture.description).toContain("Microservices");
  });

  it("should detect API Server for single api directory", () => {
    const files: FileInfo[] = [
      createFileInfo("api/routes.js", "routes.js", "js"),
      createFileInfo("api/controllers.js", "controllers.js", "js"),
    ];

    const architecture = analyzeArchitecture(files, "/tmp");
    
    // Should detect API Server, not Microservices
    expect(architecture.description).not.toContain("Microservices");
    expect(architecture.description).toContain("API Server");
  });

  it("should detect API Server for nested api directories", () => {
    const files: FileInfo[] = [
      createFileInfo("api/v1/routes.js", "routes.js", "js"),
      createFileInfo("api/v2/routes.js", "routes.js", "js"),
      createFileInfo("api/v3/routes.js", "routes.js", "js"),
    ];

    const architecture = analyzeArchitecture(files, "/tmp");
    
    // Should detect API Server for nested api directories, not Microservices
    expect(architecture.description).not.toContain("Microservices");
    expect(architecture.description).toContain("API Server");
  });
});

describe("Framework Detection - Integration Tests", () => {
  it("should detect NestJS in nestjs-backend test project", () => {
    const testProjectPath = path.join(process.cwd(), "fixtures/nestjs-backend");
    
    const files: FileInfo[] = [
      createFileInfo("package.json", "package.json", ""),
      createFileInfo("src/main.ts", "main.ts", "ts"),
    ];

    const techStack = detectTechStack(files, testProjectPath);
    
    expect(techStack.frameworks).toContain("NestJS");
  });

  it("should detect Spring Boot in spring-boot-app test project", () => {
    const testProjectPath = path.join(process.cwd(), "fixtures/spring-boot-app");
    
    const files: FileInfo[] = [
      createFileInfo("pom.xml", "pom.xml", ""),
    ];

    const techStack = detectTechStack(files, testProjectPath);
    
    expect(techStack.frameworks).toContain("Spring Boot");
  });

  it("should detect API Server for express-api test project", () => {
    const testProjectPath = path.join(process.cwd(), "fixtures/express-api");
    
    const files: FileInfo[] = [
      createFileInfo("src/routes/index.js", "index.js", "js"),
      createFileInfo("src/services/dataService.js", "dataService.js", "js"),
    ];

    const architecture = analyzeArchitecture(files, testProjectPath);
    
    // Should detect API Server, not Microservices
    expect(architecture.description).not.toContain("Microservices");
    expect(architecture.description).toContain("API Server");
  });
});

describe("Framework Detection - Python Content-Based", () => {
  it("should detect Django from Python imports", () => {
    const tempDir = createTempProjectDir({
      "blog/models.py": "from django.db import models\nclass Post(models.Model):\n    title = models.CharField(max_length=200)",
      "blog/views.py": "from django.http import JsonResponse\nfrom django.views import View",
    });

    const files: FileInfo[] = [
      createFileInfo("blog/models.py", "models.py", "py"),
      createFileInfo("blog/views.py", "views.py", "py"),
    ];

    const techStack = detectTechStack(files, tempDir);
    
    // Django detected from content
    expect(techStack.frameworks.some(f => f.toLowerCase() === "django")).toBe(true);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect Flask from Python imports", () => {
    const tempDir = createTempProjectDir({
      "app.py": "from flask import Flask, jsonify, request\napp = Flask(__name__)",
      "routes.py": "from flask import Blueprint, jsonify",
    });

    const files: FileInfo[] = [
      createFileInfo("app.py", "app.py", "py"),
      createFileInfo("routes.py", "routes.py", "py"),
    ];

    const techStack = detectTechStack(files, tempDir);
    
    expect(techStack.frameworks.some(f => f.toLowerCase() === "flask")).toBe(true);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect FastAPI from Python imports", () => {
    const tempDir = createTempProjectDir({
      "main.py": "from fastapi import FastAPI, Depends\napp = FastAPI()",
      "schemas.py": "from fastapi import Body, Query\nfrom pydantic import BaseModel",
    });

    const files: FileInfo[] = [
      createFileInfo("main.py", "main.py", "py"),
      createFileInfo("schemas.py", "schemas.py", "py"),
    ];

    const techStack = detectTechStack(files, tempDir);
    
    expect(techStack.frameworks.some(f => f.toLowerCase() === "fastapi")).toBe(true);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

describe("Architecture Detection - API vs MVC", () => {
  it("should detect API Server for controllers without views", () => {
    const files: FileInfo[] = [
      createFileInfo("src/controllers/userController.js", "userController.js", "js"),
      createFileInfo("src/services/userService.js", "userService.js", "js"),
      createFileInfo("src/repositories/userRepository.js", "userRepository.js", "js"),
    ];

    const architecture = analyzeArchitecture(files, "/tmp");
    
    // Should detect API Server when no views/templates exist (not MVC)
    expect(architecture.description).toContain("API Server");
    expect(architecture.description).not.toContain("MVC");
  });

  it("should not detect MVC for simple directory structures", () => {
    const files: FileInfo[] = [
      createFileInfo("src/controllers/userController.js", "userController.js", "js"),
      createFileInfo("src/models/userModel.js", "userModel.js", "js"),
      createFileInfo("src/views/userView.js", "userView.js", "js"),
    ];

    const architecture = analyzeArchitecture(files, "/tmp");
    
    // MVC requires specific directory structure (controllers/, views/, models/)
    // Not just files with "view" in name
    expect(architecture.description).not.toContain("MVC");
  });

  it("should detect CLI Application for commands directory", () => {
    const files: FileInfo[] = [
      createFileInfo("commands/init.js", "init.js", "js"),
      createFileInfo("commands/deploy.js", "deploy.js", "js"),
    ];

    const architecture = analyzeArchitecture(files, "/tmp");
    
    expect(architecture.description).toContain("CLI");
  });
});
