import fs from "fs";
import path from "path";

export interface ProjectSetup {
  installCommand: string | null;
  devCommand: string | null;
  buildCommand: string | null;
  testCommand: string | null;
  startCommand: string | null;
  envVars: EnvVar[];
  requirements: string[];
}

export interface EnvVar {
  name: string;
  required: boolean;
  defaultValue: string | null;
  description: string | null;
}

export function extractProjectSetup(rootDir: string): ProjectSetup {
  const setup: ProjectSetup = {
    installCommand: null,
    devCommand: null,
    buildCommand: null,
    testCommand: null,
    startCommand: null,
    envVars: [],
    requirements: [],
  };

  const packageJsonPath = path.join(rootDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      if (pkg.scripts) {
        setup.installCommand = "npm install";
        setup.devCommand = pkg.scripts.dev || null;
        setup.buildCommand = pkg.scripts.build || null;
        setup.testCommand = pkg.scripts.test || null;
        setup.startCommand = pkg.scripts.start || null;
      }
      if (pkg.engines?.node) {
        setup.requirements.push(`Node.js ${pkg.engines.node}`);
      }
    } catch {}
  }

  const makefilePath = path.join(rootDir, "Makefile");
  if (fs.existsSync(makefilePath)) {
    try {
      const content = fs.readFileSync(makefilePath, "utf-8");
      const targets = content.match(/^(\w+):/gm);
      if (targets) {
        if (!setup.installCommand && targets.includes("install:")) setup.installCommand = "make install";
        if (!setup.devCommand && targets.includes("dev:")) setup.devCommand = "make dev";
        if (!setup.buildCommand && targets.includes("build:")) setup.buildCommand = "make build";
        if (!setup.testCommand && targets.includes("test:")) setup.testCommand = "make test";
      }
    } catch {}
  }

  const dockerComposePath = path.join(rootDir, "docker-compose.yml");
  if (fs.existsSync(dockerComposePath)) {
    setup.requirements.push("Docker");
    setup.requirements.push("Docker Compose");
  }

  const requirementsTxtPath = path.join(rootDir, "requirements.txt");
  if (fs.existsSync(requirementsTxtPath)) {
    setup.installCommand = "pip install -r requirements.txt";
    setup.requirements.push("Python");
  }

  const pyprojectPath = path.join(rootDir, "pyproject.toml");
  if (fs.existsSync(pyprojectPath)) {
    try {
      const content = fs.readFileSync(pyprojectPath, "utf-8");
      if (content.includes("poetry")) {
        setup.installCommand = "poetry install";
        setup.requirements.push("Poetry");
      }
    } catch {}
  }

  const gemfilePath = path.join(rootDir, "Gemfile");
  if (fs.existsSync(gemfilePath)) {
    setup.installCommand = "bundle install";
    setup.requirements.push("Ruby");
    setup.requirements.push("Bundler");
  }

  const pomPath = path.join(rootDir, "pom.xml");
  if (fs.existsSync(pomPath)) {
    setup.installCommand = "mvn install";
    setup.buildCommand = "mvn package";
    setup.testCommand = "mvn test";
    setup.requirements.push("Java");
    setup.requirements.push("Maven");
  }

  const gradlePath = path.join(rootDir, "build.gradle");
  if (fs.existsSync(gradlePath) || fs.existsSync(path.join(rootDir, "build.gradle.kts"))) {
    setup.installCommand = "./gradlew build";
    setup.testCommand = "./gradlew test";
    setup.requirements.push("Java");
    setup.requirements.push("Gradle");
  }

  const cargoPath = path.join(rootDir, "Cargo.toml");
  if (fs.existsSync(cargoPath)) {
    setup.installCommand = "cargo build";
    setup.testCommand = "cargo test";
    setup.requirements.push("Rust");
    setup.requirements.push("Cargo");
  }

  const goModPath = path.join(rootDir, "go.mod");
  if (fs.existsSync(goModPath)) {
    setup.installCommand = "go mod download";
    setup.buildCommand = "go build ./...";
    setup.testCommand = "go test ./...";
    setup.requirements.push("Go");
  }

  setup.envVars = detectEnvVars(rootDir);

  return setup;
}

function detectEnvVars(rootDir: string): EnvVar[] {
  const vars: EnvVar[] = [];
  const seen = new Set<string>();

  const envExampleFiles = [".env.example", ".env.template", ".env.local.example", ".env.sample"];

  for (const envFile of envExampleFiles) {
    const envPath = path.join(rootDir, envFile);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        const lines = content.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;

          const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)?$/);
          if (match) {
            const name = match[1];
            const value = match[2]?.replace(/^["']|["']$/g, "") || null;

            if (!seen.has(name)) {
              seen.add(name);
              vars.push({
                name,
                required: !value || value === "",
                defaultValue: value || null,
                description: null,
              });
            }
          }
        }
      } catch {}
    }
  }

  if (vars.length === 0) {
    const sourceFiles = findSourceFiles(rootDir, 50);
    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        const envRefs = content.match(/process\.env\.([A-Z_][A-Z0-9_]*)/g) || [];
        const osEnvs = content.match(/os\.environ\.get\(["']([A-Z_][A-Z0-9_]*)/g) || [];

        for (const ref of [...envRefs, ...osEnvs]) {
          const match = ref.match(/([A-Z_][A-Z0-9_]*)/);
          if (match && !seen.has(match[1])) {
            seen.add(match[1]);
            vars.push({
              name: match[1],
              required: true,
              defaultValue: null,
              description: null,
            });
          }
        }
      } catch {}
    }
  }

  return vars;
}

function findSourceFiles(rootDir: string, maxFiles: number): string[] {
  const files: string[] = [];
  const extensions = [".ts", ".js", ".py", ".go", ".rs", ".java", ".rb", ".php"];

  function walk(dir: string) {
    if (files.length >= maxFiles) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= maxFiles) return;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !["node_modules", ".git", "dist", "build", "__pycache__", "vendor"].includes(entry.name)) {
          walk(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch {}
  }

  walk(rootDir);
  return files;
}
