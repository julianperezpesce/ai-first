import fs from "fs";
import path from "path";
import { confidence } from "./findingMetadata.js";

export interface ConfigAnalysis {
  typescript: TypeScriptConfig | null;
  eslint: ESLintConfig | null;
  prettier: PrettierConfig | null;
  testing: TestingConfig | null;
  docker: DockerConfig | null;
  evidence?: ConfigEvidence[];
}

export interface ConfigEvidence {
  area: "typescript" | "eslint" | "prettier" | "testing" | "docker";
  confidence: number;
  evidence: string[];
  reason: string;
}

export interface TypeScriptConfig {
  strict: boolean;
  target: string;
  module: string;
  moduleResolution: string;
  paths: Record<string, string[]>;
}

export interface ESLintConfig {
  extends: string[];
  plugins: string[];
  rules: Record<string, unknown>;
}

export interface PrettierConfig {
  semi: boolean;
  singleQuote: boolean;
  trailingComma: string;
  printWidth: number;
}

export interface TestingConfig {
  framework: string;
  coverageThreshold: number | null;
  testMatch: string[];
}

export interface DockerConfig {
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  baseImage: string | null;
}

export function extractConfigAnalysis(rootDir: string): ConfigAnalysis {
  const analysis: ConfigAnalysis = {
    typescript: extractTypeScriptConfig(rootDir),
    eslint: extractESLintConfig(rootDir),
    prettier: extractPrettierConfig(rootDir),
    testing: extractTestingConfig(rootDir),
    docker: extractDockerConfig(rootDir),
  };
  analysis.evidence = collectConfigEvidence(rootDir, analysis);
  return analysis;
}

function collectConfigEvidence(rootDir: string, analysis: ConfigAnalysis): ConfigEvidence[] {
  const evidence: ConfigEvidence[] = [];
  const add = (entry: ConfigEvidence) => evidence.push(entry);
  const exists = (filePath: string) => fs.existsSync(path.join(rootDir, filePath));

  if (analysis.typescript) {
    add({
      area: "typescript",
      confidence: confidence(0.98),
      evidence: ["tsconfig.json"],
      reason: "TypeScript compiler options were parsed from tsconfig.json",
    });
  }

  if (analysis.eslint) {
    const eslintFiles = [".eslintrc.js", ".eslintrc.json", ".eslintrc.yml", ".eslintrc.yaml", ".eslintrc", "package.json"]
      .filter(file => exists(file));
    add({
      area: "eslint",
      confidence: confidence(eslintFiles.some(file => file !== "package.json") ? 0.9 : 0.75),
      evidence: eslintFiles.length > 0 ? eslintFiles : ["ESLint config detected"],
      reason: "ESLint configuration was detected from config files or package.json",
    });
  }

  if (analysis.prettier) {
    const prettierFiles = [".prettierrc", ".prettierrc.json", ".prettierrc.js", ".prettierrc.yml", ".prettierrc.yaml", "package.json"]
      .filter(file => exists(file));
    add({
      area: "prettier",
      confidence: confidence(prettierFiles.some(file => file !== "package.json") ? 0.9 : 0.75),
      evidence: prettierFiles.length > 0 ? prettierFiles : ["Prettier config detected"],
      reason: "Prettier configuration was detected from config files or package.json",
    });
  }

  if (analysis.testing) {
    const testingEvidence = ["vitest.config.ts", "jest.config.js", "pytest.ini"]
      .filter(file => exists(file));
    const packageJsonPath = path.join(rootDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as {
          scripts?: Record<string, string>;
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        if (deps.vitest) testingEvidence.push("package.json dependency vitest");
        if (deps.jest) testingEvidence.push("package.json dependency jest");
        for (const [scriptName, script] of Object.entries(pkg.scripts || {})) {
          if (script.includes("vitest") || script.includes("jest") || script.includes("pytest")) {
            testingEvidence.push(`package.json scripts.${scriptName} = ${script}`);
          }
        }
      } catch {}
    }
    add({
      area: "testing",
      confidence: confidence(testingEvidence.length > 0 ? 0.95 : 0.7),
      evidence: testingEvidence.length > 0 ? testingEvidence : [`framework=${analysis.testing.framework}`],
      reason: "Testing framework was detected from test config, dependencies, or scripts",
    });
  }

  if (analysis.docker?.hasDockerfile || analysis.docker?.hasDockerCompose) {
    const dockerEvidence = ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"].filter(file => exists(file));
    add({
      area: "docker",
      confidence: confidence(0.95),
      evidence: dockerEvidence,
      reason: "Docker configuration files were found in the repository root",
    });
  }

  return evidence;
}

function extractTypeScriptConfig(rootDir: string): TypeScriptConfig | null {
  const tsconfigPath = path.join(rootDir, "tsconfig.json");
  if (!fs.existsSync(tsconfigPath)) return null;

  try {
    const content = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
    const compilerOptions = content.compilerOptions || {};

    return {
      strict: compilerOptions.strict === true,
      target: compilerOptions.target || "ES5",
      module: compilerOptions.module || "commonjs",
      moduleResolution: compilerOptions.moduleResolution || "node",
      paths: compilerOptions.paths || {},
    };
  } catch {
    return null;
  }
}

function extractESLintConfig(rootDir: string): ESLintConfig | null {
  const configFiles = [".eslintrc.js", ".eslintrc.json", ".eslintrc.yml", ".eslintrc.yaml", ".eslintrc"];

  for (const configFile of configFiles) {
    const configPath = path.join(rootDir, configFile);
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, "utf-8");
        let config: Record<string, unknown>;

        if (configFile.endsWith(".js")) {
          return { extends: [], plugins: [], rules: {} };
        } else if (configFile.endsWith(".yml") || configFile.endsWith(".yaml")) {
          return { extends: [], plugins: [], rules: {} };
        } else {
          config = JSON.parse(content);
        }

        return {
          extends: Array.isArray(config.extends) ? config.extends as string[] : config.extends ? [config.extends as string] : [],
          plugins: Array.isArray(config.plugins) ? config.plugins as string[] : [],
          rules: (config.rules as Record<string, unknown>) || {},
        };
      } catch {
        return null;
      }
    }
  }

  const packageJsonPath = path.join(rootDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      if (pkg.eslintConfig) {
        return {
          extends: Array.isArray(pkg.eslintConfig.extends) ? pkg.eslintConfig.extends : pkg.eslintConfig.extends ? [pkg.eslintConfig.extends] : [],
          plugins: Array.isArray(pkg.eslintConfig.plugins) ? pkg.eslintConfig.plugins : [],
          rules: pkg.eslintConfig.rules || {},
        };
      }
    } catch {}
  }

  return null;
}

function extractPrettierConfig(rootDir: string): PrettierConfig | null {
  const configFiles = [".prettierrc", ".prettierrc.json", ".prettierrc.js", ".prettierrc.yml", ".prettierrc.yaml"];

  for (const configFile of configFiles) {
    const configPath = path.join(rootDir, configFile);
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, "utf-8");
        let config: Record<string, unknown>;

        if (configFile.endsWith(".js")) {
          return null;
        } else if (configFile.endsWith(".yml") || configFile.endsWith(".yaml")) {
          return null;
        } else {
          config = JSON.parse(content);
        }

        return {
          semi: config.semi !== false,
          singleQuote: config.singleQuote === true,
          trailingComma: (config.trailingComma as string) || "none",
          printWidth: (config.printWidth as number) || 80,
        };
      } catch {
        return null;
      }
    }
  }

  const packageJsonPath = path.join(rootDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      if (pkg.prettier) {
        return {
          semi: pkg.prettier.semi !== false,
          singleQuote: pkg.prettier.singleQuote === true,
          trailingComma: pkg.prettier.trailingComma || "none",
          printWidth: pkg.prettier.printWidth || 80,
        };
      }
    } catch {}
  }

  return null;
}

function extractTestingConfig(rootDir: string): TestingConfig | null {
  const jestConfigPath = path.join(rootDir, "jest.config.js");
  const vitestConfigPath = path.join(rootDir, "vitest.config.ts");
  const pytestIniPath = path.join(rootDir, "pytest.ini");
  const packageJsonPath = path.join(rootDir, "package.json");

  if (fs.existsSync(jestConfigPath) || fs.existsSync(vitestConfigPath)) {
    let coverageThreshold: number | null = null;

    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        if (pkg.jest?.coverageThreshold?.global?.lines) {
          coverageThreshold = pkg.jest.coverageThreshold.global.lines;
        }
      } catch {}
    }

    return {
      framework: fs.existsSync(vitestConfigPath) ? "Vitest" : "Jest",
      coverageThreshold,
      testMatch: ["**/*.test.ts", "**/*.test.js", "**/*.spec.ts", "**/*.spec.js"],
    };
  }

  if (fs.existsSync(pytestIniPath)) {
    return {
      framework: "pytest",
      coverageThreshold: null,
      testMatch: ["test_*.py", "*_test.py"],
    };
  }

  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as {
        scripts?: Record<string, string>;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const scripts = pkg.scripts || {};
      const scriptValues = Object.values(scripts);

      if (deps.vitest || scriptValues.some(script => script.includes("vitest"))) {
        return {
          framework: "Vitest",
          coverageThreshold: null,
          testMatch: ["**/*.test.ts", "**/*.test.js", "**/*.spec.ts", "**/*.spec.js"],
        };
      }

      if (deps.jest || scriptValues.some(script => script.includes("jest"))) {
        return {
          framework: "Jest",
          coverageThreshold: null,
          testMatch: ["**/*.test.ts", "**/*.test.js", "**/*.spec.ts", "**/*.spec.js"],
        };
      }
    } catch {}
  }

  return null;
}

function extractDockerConfig(rootDir: string): DockerConfig {
  const hasDockerfile = fs.existsSync(path.join(rootDir, "Dockerfile"));
  const hasDockerCompose = fs.existsSync(path.join(rootDir, "docker-compose.yml")) || fs.existsSync(path.join(rootDir, "docker-compose.yaml"));

  let baseImage: string | null = null;
  if (hasDockerfile) {
    try {
      const content = fs.readFileSync(path.join(rootDir, "Dockerfile"), "utf-8");
      const fromMatch = content.match(/^FROM\s+(.+)$/m);
      if (fromMatch) {
        baseImage = fromMatch[1].trim();
      }
    } catch {}
  }

  return {
    hasDockerfile,
    hasDockerCompose,
    baseImage,
  };
}
