import { describe, it, expect } from "vitest";
import { discoverEntrypoints, Entrypoint } from "../src/analyzers/entrypoints.js";
import { FileInfo } from "../src/core/repoScanner.js";
import fs from "fs";
import path from "path";
import os from "os";

function createTempProjectDir(files: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-entrypoints-test-"));
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

describe("Entrypoints - Go Language", () => {
  it("should detect main.go with func main()", () => {
    const tempDir = createTempProjectDir({
      "main.go": `package main

import "net/http"

func main() {
    http.ListenAndServe(":8080", nil)
}`,
    });

    const files: FileInfo[] = [createFileInfo("main.go", "main.go", "go")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const mainEntry = entrypoints.find(ep => ep.name === "main.go");
    expect(mainEntry).toBeDefined();
    expect(mainEntry?.type).toBe("server");
    expect(mainEntry?.path).toBe("main.go");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect HTTP handlers in Go", () => {
    const tempDir = createTempProjectDir({
      "main.go": `package main

import "net/http"

func main() {
    http.HandleFunc("/users", handleUsers)
    http.HandleFunc("/posts", handlePosts)
    http.ListenAndServe(":3000", nil)
}

func handleUsers(w http.ResponseWriter, r *http.Request) {}
func handlePosts(w http.ResponseWriter, r *http.Request) {}`,
    });

    const files: FileInfo[] = [createFileInfo("main.go", "main.go", "go")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const mainEntry = entrypoints.find(ep => ep.name === "main.go");
    expect(mainEntry).toBeDefined();
    expect(mainEntry?.description).toContain("/users");
    expect(mainEntry?.description).toContain("/posts");
    expect(mainEntry?.description).toContain(":3000");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect go.mod file", () => {
    const tempDir = createTempProjectDir({
      "main.go": "package main\n\nfunc main() {}",
      "go.mod": "module github.com/example/app\n\ngo 1.21",
    });

    const files: FileInfo[] = [
      createFileInfo("main.go", "main.go", "go"),
      createFileInfo("go.mod", "go.mod", ""),
    ];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const modEntry = entrypoints.find(ep => ep.name === "go.mod");
    expect(modEntry).toBeDefined();
    expect(modEntry?.type).toBe("config");
    expect(modEntry?.description).toContain("github.com/example/app");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect structs in Go modules", () => {
    const tempDir = createTempProjectDir({
      "models.go": `package models

type User struct {
    ID   int
    Name string
}

type Post struct {
    Title string
    Body  string
}`,
    });

    const files: FileInfo[] = [createFileInfo("models.go", "models.go", "go")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const modelEntry = entrypoints.find(ep => ep.name === "models.go");
    expect(modelEntry).toBeDefined();
    expect(modelEntry?.type).toBe("library");
    expect(modelEntry?.description).toContain("User");
    expect(modelEntry?.description).toContain("Post");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

describe("Entrypoints - Rust Language", () => {
  it("should detect main.rs with fn main()", () => {
    const tempDir = createTempProjectDir({
      "src/main.rs": `fn main() {
    println!("Hello, world!");
}`,
    });

    const files: FileInfo[] = [createFileInfo("src/main.rs", "main.rs", "rs")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const mainEntry = entrypoints.find(ep => ep.name === "main.rs");
    expect(mainEntry).toBeDefined();
    expect(mainEntry?.type).toBe("cli");
    expect(mainEntry?.path).toBe("src/main.rs");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect structs and implementations in main.rs", () => {
    const tempDir = createTempProjectDir({
      "src/main.rs": `struct Config {
    name: String,
}

impl Config {
    fn new() -> Self {
        Config { name: "app".to_string() }
    }
}

fn main() {}`,
    });

    const files: FileInfo[] = [createFileInfo("src/main.rs", "main.rs", "rs")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const mainEntry = entrypoints.find(ep => ep.name === "main.rs");
    expect(mainEntry).toBeDefined();
    expect(mainEntry?.description).toContain("Config");
    expect(mainEntry?.description).toContain("implementations");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect lib.rs as library", () => {
    const tempDir = createTempProjectDir({
      "src/lib.rs": `pub fn public_function() {}

pub fn another_public_fn() {}`,
    });

    const files: FileInfo[] = [createFileInfo("src/lib.rs", "lib.rs", "rs")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const libEntry = entrypoints.find(ep => ep.name === "lib.rs");
    expect(libEntry).toBeDefined();
    expect(libEntry?.type).toBe("library");
    expect(libEntry?.description).toContain("public_function");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect Cargo.toml with project info", () => {
    const tempDir = createTempProjectDir({
      "src/main.rs": "fn main() {}",
      "Cargo.toml": `[package]
name = "my-app"
version = "1.0.0"
edition = "2021"`,
    });

    const files: FileInfo[] = [
      createFileInfo("src/main.rs", "main.rs", "rs"),
      createFileInfo("Cargo.toml", "Cargo.toml", ""),
    ];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const cargoEntry = entrypoints.find(ep => ep.name === "Cargo.toml");
    expect(cargoEntry).toBeDefined();
    expect(cargoEntry?.type).toBe("config");
    expect(cargoEntry?.description).toContain("my-app");
    expect(cargoEntry?.description).toContain("v1.0.0");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

describe("Entrypoints - PHP Language", () => {
  it("should detect index.php", () => {
    const tempDir = createTempProjectDir({
      "index.php": `<?php
echo "Hello, World!";`,
    });

    const files: FileInfo[] = [createFileInfo("index.php", "index.php", "php")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const indexEntry = entrypoints.find(ep => ep.name === "index.php");
    expect(indexEntry).toBeDefined();
    expect(indexEntry?.type).toBe("api");
    expect(indexEntry?.path).toBe("index.php");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect public/index.php as server", () => {
    const tempDir = createTempProjectDir({
      "public/index.php": `<?php
require_once __DIR__ . '/../vendor/autoload.php';`,
    });

    const files: FileInfo[] = [createFileInfo("public/index.php", "index.php", "php")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const indexEntry = entrypoints.find(ep => ep.name === "index.php");
    expect(indexEntry).toBeDefined();
    expect(indexEntry?.type).toBe("server");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect PHP classes and routes", () => {
    const tempDir = createTempProjectDir({
      "index.php": `<?php

class UserController {
    public function index() {}
}

class Router {
    public function add() {}
}

$router = new Router();
$router->add('GET', '/users', function() {});`,
    });

    const files: FileInfo[] = [createFileInfo("index.php", "index.php", "php")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const indexEntry = entrypoints.find(ep => ep.name === "index.php");
    expect(indexEntry).toBeDefined();
    expect(indexEntry?.description).toContain("UserController");
    expect(indexEntry?.description).toContain("Router");
    expect(indexEntry?.description).toContain("/users");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect composer.json with Laravel", () => {
    const tempDir = createTempProjectDir({
      "index.php": "<?php echo 'Hello';",
      "composer.json": JSON.stringify({
        name: "example/laravel-app",
        description: "My Laravel application",
        require: {
          "laravel/framework": "^10.0",
        },
      }),
    });

    const files: FileInfo[] = [
      createFileInfo("index.php", "index.php", "php"),
      createFileInfo("composer.json", "composer.json", ""),
    ];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const composerEntry = entrypoints.find(ep => ep.name === "composer.json");
    expect(composerEntry).toBeDefined();
    expect(composerEntry?.type).toBe("config");
    expect(composerEntry?.description).toContain("example/laravel-app");
    expect(composerEntry?.description).toContain("Laravel");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect composer.json with Symfony", () => {
    const tempDir = createTempProjectDir({
      "index.php": "<?php echo 'Hello';",
      "composer.json": JSON.stringify({
        name: "example/symfony-app",
        require: {
          "symfony/framework-bundle": "^6.0",
        },
      }),
    });

    const files: FileInfo[] = [
      createFileInfo("index.php", "index.php", "php"),
      createFileInfo("composer.json", "composer.json", ""),
    ];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const composerEntry = entrypoints.find(ep => ep.name === "composer.json");
    expect(composerEntry).toBeDefined();
    expect(composerEntry?.description).toContain("Symfony");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

describe("Entrypoints - Integration with Test Projects", () => {
  it("should detect Go microservice entrypoints", () => {
    const testProjectPath = path.join(process.cwd(), "test-projects/go-microservice");
    
    const files: FileInfo[] = [
      createFileInfo("main.go", "main.go", "go"),
    ];

    const entrypoints = discoverEntrypoints(files, testProjectPath);

    const mainEntry = entrypoints.find(ep => ep.name === "main.go");
    expect(mainEntry).toBeDefined();
    expect(mainEntry?.type).toBe("server");
  });

  it("should detect Rust CLI entrypoints", () => {
    const testProjectPath = path.join(process.cwd(), "test-projects/rust-cli");
    
    const files: FileInfo[] = [
      createFileInfo("src/main.rs", "main.rs", "rs"),
    ];

    const entrypoints = discoverEntrypoints(files, testProjectPath);

    const mainEntry = entrypoints.find(ep => ep.name === "main.rs");
    expect(mainEntry).toBeDefined();
    expect(mainEntry?.type).toBe("cli");
  });

  it("should detect PHP vanilla entrypoints", () => {
    const testProjectPath = path.join(process.cwd(), "test-projects/php-vanilla");
    
    const files: FileInfo[] = [
      createFileInfo("index.php", "index.php", "php"),
    ];

    const entrypoints = discoverEntrypoints(files, testProjectPath);

    const indexEntry = entrypoints.find(ep => ep.name === "index.php");
    expect(indexEntry).toBeDefined();
    expect(indexEntry?.type).toBe("api");
  });
});

describe("Entrypoints - Python Language", () => {
  it("should detect manage.py as Django CLI entrypoint", () => {
    const tempDir = createTempProjectDir({
      "manage.py": "#!/usr/bin/env python\nimport sys\nif __name__ == '__main__':\n    pass",
    });

    const files: FileInfo[] = [createFileInfo("manage.py", "manage.py", "py")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const manageEntry = entrypoints.find(ep => ep.name === "manage.py");
    expect(manageEntry).toBeDefined();
    expect(manageEntry?.type).toBe("cli");
    expect(manageEntry?.command).toBe("python manage.py");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect app.py as server entrypoint", () => {
    const tempDir = createTempProjectDir({
      "app.py": "from flask import Flask\napp = Flask(__name__)",
    });

    const files: FileInfo[] = [createFileInfo("app.py", "app.py", "py")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const appEntry = entrypoints.find(ep => ep.name === "app.py");
    expect(appEntry).toBeDefined();
    expect(appEntry?.type).toBe("server");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect main.py as server entrypoint", () => {
    const tempDir = createTempProjectDir({
      "main.py": "if __name__ == '__main__':\n    print('Hello')",
    });

    const files: FileInfo[] = [createFileInfo("main.py", "main.py", "py")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const mainEntry = entrypoints.find(ep => ep.name === "main.py");
    expect(mainEntry).toBeDefined();
    expect(mainEntry?.type).toBe("server");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect __init__.py exports", () => {
    const tempDir = createTempProjectDir({
      "mypackage/__init__.py": "from .module import MyClass\n__all__ = ['MyClass', 'helper']",
    });

    const files: FileInfo[] = [createFileInfo("mypackage/__init__.py", "__init__.py", "py")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const packageEntry = entrypoints.find(ep => ep.name === "mypackage package");
    expect(packageEntry).toBeDefined();
    expect(packageEntry?.type).toBe("library");
    expect(packageEntry?.description).toContain("MyClass");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect pyproject.toml scripts", () => {
    const tempDir = createTempProjectDir({
      "app.py": "print('hello')",
      "pyproject.toml": "[project.scripts]\nmyapp = 'app:main'\ncli = 'app:cli'",
    });

    const files: FileInfo[] = [createFileInfo("app.py", "app.py", "py")];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const myappEntry = entrypoints.find(ep => ep.name === "myapp");
    expect(myappEntry).toBeDefined();
    expect(myappEntry?.type).toBe("cli");

    const cliEntry = entrypoints.find(ep => ep.name === "cli");
    expect(cliEntry).toBeDefined();

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

describe("Entrypoints - Spring Boot Language", () => {
  it("should detect @SpringBootApplication class", () => {
    const tempDir = createTempProjectDir({
      "pom.xml": "<project><artifactId>myapp</artifactId><version>1.0.0</version></project>",
      "src/main/java/com/example/DemoApplication.java": `
package com.example;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}`,
    });

    const files: FileInfo[] = [
      createFileInfo("src/main/java/com/example/DemoApplication.java", "DemoApplication.java", "java"),
      createFileInfo("pom.xml", "pom.xml", ""),
    ];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const appEntry = entrypoints.find(ep => ep.name === "DemoApplication");
    expect(appEntry).toBeDefined();
    expect(appEntry?.type).toBe("server");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect @RestController with endpoints", () => {
    const tempDir = createTempProjectDir({
      "pom.xml": "<project><artifactId>myapp</artifactId></project>",
      "src/main/java/com/example/UserController.java": `
package com.example;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {
    @GetMapping("/")
    public List<User> getUsers() { return null; }
    
    @PostMapping("/")
    public User createUser() { return null; }
}`,
    });

    const files: FileInfo[] = [
      createFileInfo("src/main/java/com/example/UserController.java", "UserController.java", "java"),
      createFileInfo("pom.xml", "pom.xml", ""),
    ];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const controllerEntry = entrypoints.find(ep => ep.name === "UserController");
    expect(controllerEntry).toBeDefined();
    expect(controllerEntry?.type).toBe("api");
    expect(controllerEntry?.description).toContain("/users");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect pom.xml", () => {
    const tempDir = createTempProjectDir({
      "pom.xml": "<project><artifactId>myapp</artifactId><version>2.0.0</version></project>",
      "src/App.java": "public class App {}",
    });

    const files: FileInfo[] = [
      createFileInfo("pom.xml", "pom.xml", ""),
      createFileInfo("src/App.java", "App.java", "java"),
    ];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const pomEntry = entrypoints.find(ep => ep.name === "pom.xml");
    expect(pomEntry).toBeDefined();
    expect(pomEntry?.type).toBe("config");
    expect(pomEntry?.description).toContain("myapp");
    expect(pomEntry?.description).toContain("2.0.0");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should detect build.gradle with Spring Boot", () => {
    const tempDir = createTempProjectDir({
      "build.gradle": "plugins { id 'org.springframework.boot' version '3.0.0' }",
      "src/main/java/App.java": "public class App {}",
    });

    const files: FileInfo[] = [
      createFileInfo("src/main/java/App.java", "App.java", "java"),
      createFileInfo("build.gradle", "build.gradle", ""),
    ];
    const entrypoints = discoverEntrypoints(files, tempDir);

    const gradleEntry = entrypoints.find(ep => ep.name === "build.gradle");
    expect(gradleEntry).toBeDefined();
    expect(gradleEntry?.type).toBe("config");
    expect(gradleEntry?.description).toContain("Spring Boot");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
