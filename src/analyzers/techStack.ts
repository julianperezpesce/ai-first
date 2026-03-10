import { FileInfo } from "../core/repoScanner.js";
import { readFile, readJsonFile } from "../utils/fileUtils.js";
import path from "path";

export interface TechStack {
  languages: string[];
  frameworks: string[];
  libraries: string[];
  tools: string[];
  packageManagers: string[];
  testing: string[];
  linters: string[];
  formatters: string[];
  description: string;
  android?: {
    minSdk?: string;
    targetSdk?: string;
    compileSdk?: string;
    gradleVersion?: string;
    kotlinVersion?: string;
  };
}

/**
 * Detect technology stack from repository
 */
export function detectTechStack(files: FileInfo[], rootDir: string): TechStack {
  const extensions = new Set(files.map(f => f.extension));
  const fileNames = new Set(files.map(f => f.name));
  
  const languages = detectLanguages(extensions);
  const frameworks = detectFrameworks(files, fileNames, rootDir);
  const libraries = detectLibraries(files, rootDir);
  const tools = detectTools(files, fileNames);
  const packageManagers = detectPackageManagers(files);
  const testing = detectTesting(files, fileNames);
  const linters = detectLinters(files, fileNames);
  const formatters = detectFormatters(files, fileNames);
  
  const description = generateTechStackDescription(
    languages, frameworks, libraries, tools, packageManagers, testing, linters, formatters
  );
  
  const android = detectAndroidSDK(files, rootDir);
  
  return {
    languages,
    frameworks,
    libraries,
    tools,
    packageManagers,
    testing,
    linters,
    formatters,
    description,
    android,
  };
}

/**
 * Detect programming languages
 */
function detectLanguages(extensions: Set<string>): string[] {
  const langMap: Record<string, string> = {
    ts: "TypeScript", tsx: "TypeScript (React)", js: "JavaScript", jsx: "JavaScript (React)",
    py: "Python", java: "Java", cs: "C#", go: "Go", rs: "Rust", rb: "Ruby",
    php: "PHP", swift: "Swift", kt: "Kotlin", scala: "Scala", vue: "Vue",
    svelte: "Svelte", html: "HTML", css: "CSS", scss: "SCSS", less: "LESS",
    sql: "SQL", sh: "Shell", bash: "Bash", zsh: "Zsh", ps1: "PowerShell",
    yaml: "YAML", yml: "YAML", toml: "TOML", xml: "XML", json: "JSON",
    md: "Markdown", tex: "LaTeX", r: "R", lua: "Lua", pl: "Perl",
    hs: "Haskell", ex: "Elixir", erl: "Erlang", clj: "Clojure", dart: "Dart",
  };
  
  const detected: string[] = [];
  for (const ext of extensions) {
    if (langMap[ext]) {
      detected.push(langMap[ext]);
    }
  }
  return detected;
}

/**
 * Detect frameworks
 */
function detectFrameworks(files: FileInfo[], fileNames: Set<string>, rootDir: string): string[] {
  const frameworks: string[] = [];
  
  try {
    const pkgPath = path.join(rootDir, "package.json");
    const pkg = readJsonFile(pkgPath) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    
    const frameworkMap: Record<string, string[]> = {
      "react": ["React", "Next.js", "Remix"],
      "vue": ["Vue.js", "Nuxt.js"],
      "svelte": ["Svelte", "SvelteKit"],
      "angular": ["Angular"],
      "express": ["Express.js"],
      "fastify": ["Fastify"],
      "nest": ["NestJS"],
      "django": ["Django"],
      "flask": ["Flask"],
      "fastapi": ["FastAPI"],
      "spring": ["Spring"],
      "rails": ["Ruby on Rails"],
      "laravel": ["Laravel"],
      "next": ["Next.js"],
      "nuxt": ["Nuxt.js"],
      "sveltekit": ["SvelteKit"],
      "astro": ["Astro"],
      "electron": ["Electron"],
      "cordova": ["Cordova"],
      "cap": ["Capacitor"],
      "expo": ["Expo"],
      "react-native": ["React Native"],
    };
    
    for (const [dep, names] of Object.entries(frameworkMap)) {
      if (deps[dep]) {
        frameworks.push(...names);
      }
    }
  } catch {}
  
  const frameworkIndicators: Record<string, string> = {
    "next.config": "Next.js",
    "nuxt.config": "Nuxt.js",
    "svelte.config": "Svelte",
    "astro.config": "Astro",
    "vite.config": "Vite",
    "webpack.config": "Webpack",
    "rollup.config": "Rollup",
    "jest.config": "Jest",
    "tailwind.config": "Tailwind CSS",
    "postcss.config": "PostCSS",
    "babel.config": "Babel",
    "tsconfig": "TypeScript",
    "build.gradle": "Android",
    "build.gradle.kts": "Android",
    "settings.gradle": "Android",
    "AndroidManifest.xml": "Android",
  };
  
  for (const [indicator, framework] of Object.entries(frameworkIndicators)) {
    if (fileNames.has(indicator) || files.some(f => f.name.includes(indicator))) {
      if (!frameworks.includes(framework)) {
        frameworks.push(framework);
      }
    }
  }
  
  return [...new Set(frameworks)];
}

/**
 * Detect libraries
 */
function detectLibraries(files: FileInfo[], rootDir: string): string[] {
  const libraries: string[] = [];
  
  try {
    const pkgPath = path.join(rootDir, "package.json");
    const pkg = readJsonFile(pkgPath) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    
    const libMap: Record<string, string> = {
      "axios": "Axios", "lodash": "Lodash", "moment": "Moment.js",
      "date-fns": "date-fns", "uuid": "UUID", "joi": "Joi",
      "zod": "Zod", "yup": "Yup", "prisma": "Prisma",
      "typeorm": "TypeORM", "sequelize": "Sequelize", "mongoose": "Mongoose",
      "redis": "Redis", "pg": "PostgreSQL", "mysql": "MySQL",
      "mongodb": "MongoDB", "socket.io": "Socket.io", "graphql": "GraphQL",
      "passport": "Passport.js", "bcrypt": "Bcrypt", "jsonwebtoken": "JWT",
      "stripe": "Stripe", "nodemailer": "Nodemailer", "multer": "Multer",
      "sharp": "Sharp", "puppeteer": "Puppeteer", "playwright": "Playwright",
      "winston": "Winston", "pino": "Pino", "dotenv": "dotenv",
    };
    
    for (const [dep, name] of Object.entries(libMap)) {
      if (deps[dep]) {
        libraries.push(name);
      }
    }
  } catch {}
  
  return [...new Set(libraries)];
}

/**
 * Detect development tools
 */
function detectTools(files: FileInfo[], fileNames: Set<string>): string[] {
  const tools: string[] = [];
  
  const toolIndicators: Record<string, string> = {
    "docker-compose": "Docker Compose",
    "Dockerfile": "Docker",
    "jest.config": "Jest",
    "vitest.config": "Vitest",
    "cypress.json": "Cypress",
    "eslint.config": "ESLint",
    "prettier.config": "Prettier",
    "husky": "Husky",
    "lint-staged": "lint-staged",
    "turbo": "Turborepo",
    "nx": "Nx",
  };
  
  for (const [indicator, tool] of Object.entries(toolIndicators)) {
    if (fileNames.has(indicator) || files.some(f => f.name.includes(indicator))) {
      tools.push(tool);
    }
  }
  
  return tools;
}

/**
 * Detect package managers
 */
function detectPackageManagers(files: FileInfo[]): string[] {
  const managers: string[] = [];
  const fileNames = files.map(f => f.name);
  
  if (fileNames.includes("package.json")) {
    managers.push("npm");
    if (fileNames.includes("pnpm-lock.yaml")) managers.push("pnpm");
    if (fileNames.includes("yarn.lock")) managers.push("Yarn");
  }
  if (fileNames.includes("requirements.txt") || fileNames.includes("Pipfile")) {
    managers.push("pip");
    if (fileNames.includes("poetry.lock")) managers.push("Poetry");
  }
  if (fileNames.includes("go.mod")) managers.push("Go Modules");
  if (fileNames.includes("Cargo.toml")) managers.push("Cargo");
  if (fileNames.includes("Gemfile")) managers.push("Bundler");
  if (fileNames.includes("composer.json")) managers.push("Composer");
  
  return managers;
}

/**
 * Detect testing frameworks
 */
function detectTesting(files: FileInfo[], fileNames: Set<string>): string[] {
  const testing: string[] = [];
  
  const testIndicators: Record<string, string> = {
    "jest.config": "Jest",
    "vitest.config": "Vitest",
    "mocha.opts": "Mocha",
    "karma.conf": "Karma",
    "cypress.json": "Cypress",
    "playwright.config": "Playwright",
    "pytest.ini": "pytest",
    "conftest.py": "pytest",
    "rspec": "RSpec",
    "xctest": "XCTest",
  };
  
  for (const [indicator, framework] of Object.entries(testIndicators)) {
    if (fileNames.has(indicator) || files.some(f => f.name.includes(indicator))) {
      testing.push(framework);
    }
  }
  
  return testing;
}

/**
 * Detect linters
 */
function detectLinters(files: FileInfo[], fileNames: Set<string>): string[] {
  const linters: string[] = [];
  
  const lintIndicators: Record<string, string> = {
    ".eslintrc": "ESLint",
    "eslint.config": "ESLint",
    "pylintrc": "Pylint",
    ".rubocop": "RuboCop",
    "golangci-lint": "golangci-lint",
    "swiftlint": "SwiftLint",
  };
  
  for (const [indicator, linter] of Object.entries(lintIndicators)) {
    if (fileNames.has(indicator) || files.some(f => f.name.includes(indicator))) {
      linters.push(linter);
    }
  }
  
  return linters;
}

/**
 * Detect formatters
 */
function detectFormatters(files: FileInfo[], fileNames: Set<string>): string[] {
  const formatters: string[] = [];
  
  const formatIndicators: Record<string, string> = {
    ".prettierrc": "Prettier",
    "prettier.config": "Prettier",
    "rustfmt.toml": "rustfmt",
    "black": "Black",
    "isort": "isort",
    ".editorconfig": "EditorConfig",
  };
  
  for (const [indicator, formatter] of Object.entries(formatIndicators)) {
    if (fileNames.has(indicator) || files.some(f => f.name.includes(indicator))) {
      formatters.push(formatter);
    }
  }
  
  return formatters;
}

/**
 * Detect Android SDK versions from build.gradle files
 */
function detectAndroidSDK(files: FileInfo[], rootDir: string): TechStack["android"] {
  const fileNames = files.map(f => f.name);
  const hasAndroid = fileNames.some(n => 
    n === "build.gradle" || n === "build.gradle.kts" || 
    n === "app/build.gradle" || n === "app/build.gradle.kts"
  );
  
  if (!hasAndroid) return undefined;
  
  const android: TechStack["android"] = {};
  
  const gradleFiles = files.filter(f => 
    f.name === "build.gradle" || f.name === "build.gradle.kts" ||
    f.relativePath.includes("app/build.gradle")
  );
  
  for (const gf of gradleFiles) {
    try {
      const content = readFile(path.join(rootDir, gf.relativePath));
      const minSdkMatch = content.match(/minSdk(?:Version)?\s*[=:]\s*(\d+)/);
      const targetSdkMatch = content.match(/targetSdk(?:Version)?\s*[=:]\s*(\d+)/);
      const compileSdkMatch = content.match(/compileSdk(?:Version)?\s*[=:]\s*(\d+)/);
      
      if (minSdkMatch && !android.minSdk) android.minSdk = minSdkMatch[1];
      if (targetSdkMatch && !android.targetSdk) android.targetSdk = targetSdkMatch[1];
      if (compileSdkMatch && !android.compileSdk) android.compileSdk = compileSdkMatch[1];
    } catch {}
  }
  
  try {
    const propsPath = path.join(rootDir, "gradle/wrapper/gradle-wrapper.properties");
    const props = readFile(propsPath);
    const v = props.match(/gradle-(\d+\.\d+)/);
    if (v) android.gradleVersion = v[1];
  } catch {}
  
  return (android.minSdk || android.targetSdk || android.compileSdk || android.gradleVersion) ? android : undefined;
}

/**
 * Generate tech stack description
 */
function generateTechStackDescription(
  languages: string[],
  frameworks: string[],
  libraries: string[],
  tools: string[],
  packageManagers: string[],
  testing: string[],
  linters: string[],
  formatters: string[]
): string {
  const lines: string[] = [];
  
  if (languages.length > 0) lines.push(`**Languages**: ${languages.join(", ")}`);
  if (frameworks.length > 0) lines.push(`**Frameworks**: ${frameworks.join(", ")}`);
  if (libraries.length > 0) lines.push(`**Libraries**: ${libraries.join(", ")}`);
  if (tools.length > 0) lines.push(`**Tools**: ${tools.join(", ")}`);
  if (packageManagers.length > 0) lines.push(`**Package Managers**: ${packageManagers.join(", ")}`);
  if (testing.length > 0) lines.push(`**Testing**: ${testing.join(", ")}`);
  if (linters.length > 0) lines.push(`**Linters**: ${linters.join(", ")}`);
  if (formatters.length > 0) lines.push(`**Formatters**: ${formatters.join(", ")}`);
  
  return lines.join("\n\n");
}

/**
 * Generate tech_stack.md content
 */
export function generateTechStackFile(stack: TechStack): string {
  let content = "# Technology Stack\n\n";
  content += stack.description + "\n\n";
  
  content += "## Languages\n" + (stack.languages.map(l => `- ${l}`).join("\n") || "- Unknown") + "\n\n";
  content += "## Frameworks\n" + (stack.frameworks.map(f => `- ${f}`).join("\n") || "- None detected") + "\n\n";
  content += "## Key Libraries\n" + (stack.libraries.map(l => `- ${l}`).join("\n") || "- None detected") + "\n\n";
  content += "## Development Tools\n" + (stack.tools.map(t => `- ${t}`).join("\n") || "- None detected") + "\n\n";
  content += "## Package Managers\n" + (stack.packageManagers.map(p => `- ${p}`).join("\n") || "- None detected") + "\n\n";
  content += "## Testing\n" + (stack.testing.map(t => `- ${t}`).join("\n") || "- None detected") + "\n\n";
  content += "## Linters\n" + (stack.linters.map(l => `- ${l}`).join("\n") || "- None detected") + "\n\n";
  content += "## Formatters\n" + (stack.formatters.map(f => `- ${f}`).join("\n") || "- None detected") + "\n\n";
  content += "---\n*Generated by ai-first*\n";
  
  return content;
}
