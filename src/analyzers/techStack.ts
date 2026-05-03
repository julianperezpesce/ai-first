import { FileInfo } from "../core/repoScanner.js";
import { readFile, readJsonFile } from "../utils/fileUtils.js";
import path from "path";
import fs from "fs";

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
  salesforce?: {
    apiVersion?: string;
    packageDirectories?: string[];
    namespace?: string;
    sObjects?: string[];
    apexClasses?: number;
    triggers?: number;
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
  const salesforce = detectSalesforceInfo(files, rootDir);
  
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
    salesforce,
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
    dockerfile: "Docker", yaml: "YAML", yml: "YAML", json: "JSON", xml: "XML",
    md: "Markdown", mdx: "Markdown",
  };
  
  const langs = Array.from(extensions).map(ext => langMap[ext]).filter(Boolean);
  
  // Filter out non-primary languages that are typically config/docs
  const primaryLangs = langs.filter(l => 
    !["YAML", "JSON", "XML", "Markdown", "Shell", "Bash", "Docker", "CSS", "SCSS", "LESS"].includes(l)
  );
  
  if (primaryLangs.length > 0) {
    // Add Markdown for docs, JSON for config files
    const allLangs = [...new Set(primaryLangs)];
    if (extensions.has("md") || extensions.has("mdx")) allLangs.push("Markdown");
    if (extensions.has("json")) allLangs.push("JSON");
    return allLangs;
  }
  
  return [...new Set(langs)];
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
    
    // Check for @nestjs/* packages (NestJS framework)
    const hasNestJs = Object.keys(deps).some(dep => dep.startsWith("@nestjs/"));
    if (hasNestJs && !frameworks.includes("NestJS")) {
      frameworks.push("NestJS");
    }
    
    // Check for Spring Boot in dependencies
    const hasSpringBoot = Object.keys(deps).some(dep => dep.startsWith("@spring.io/") || dep.includes("spring-boot"));
    if (hasSpringBoot && !frameworks.includes("Spring Boot")) {
      frameworks.push("Spring Boot");
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
    "sfdx-project.json": "Salesforce DX",
    "force-app": "Salesforce",
  };
  
  for (const [indicator, framework] of Object.entries(frameworkIndicators)) {
    if (fileNames.has(indicator) || files.some(f => f.name.includes(indicator))) {
      if (!frameworks.includes(framework)) {
        frameworks.push(framework);
      }
    }
  }
  
  // Detect Spring Boot from pom.xml
  try {
    const pomPath = path.join(rootDir, "pom.xml");
    if (fs.existsSync(pomPath)) {
      const pomContent = readFile(pomPath);
      if (pomContent.includes("spring-boot") && !frameworks.includes("Spring Boot")) {
        frameworks.push("Spring Boot");
      }
      if (pomContent.includes("spring-boot-starter-parent") && !frameworks.includes("Spring Boot")) {
        frameworks.push("Spring Boot");
      }
    }
  } catch {}
  
  // Detect Spring Boot from build.gradle
  try {
    const gradlePath = path.join(rootDir, "build.gradle");
    const gradleKtsPath = path.join(rootDir, "build.gradle.kts");
    let gradleContent = "";
    if (fs.existsSync(gradlePath)) {
      gradleContent = readFile(gradlePath);
    } else if (fs.existsSync(gradleKtsPath)) {
      gradleContent = readFile(gradleKtsPath);
    }
    if (gradleContent.includes("spring-boot") && !frameworks.includes("Spring Boot")) {
      frameworks.push("Spring Boot");
    }
    if (gradleContent.includes("org.springframework.boot") && !frameworks.includes("Spring Boot")) {
      frameworks.push("Spring Boot");
    }
  } catch {}
   
  // Detect Laravel from composer.json
  try {
    const composerPath = path.join(rootDir, "composer.json");
    if (fs.existsSync(composerPath)) {
      const composerContent = readFile(composerPath);
      // Check for laravel/framework or illuminate packages
      if ((composerContent.includes("laravel/framework") || composerContent.includes("illuminate/")) && !frameworks.includes("Laravel")) {
        frameworks.push("Laravel");
      }
    }
  } catch {}
    
  // Detect Python frameworks from requirements.txt, Pipfile, pyproject.toml
  try {
    const pythonFrameworkMap: Record<string, string[]> = {
      "django": ["Django"],
      "flask": ["Flask"],
      "fastapi": ["FastAPI"],
      "tornado": ["Tornado"],
      "pyramid": ["Pyramid"],
      "bottle": ["Bottle"],
      "cherrypy": ["CherryPy"],
    };
    
    // Check requirements.txt
    const reqPath = path.join(rootDir, "requirements.txt");
    if (fs.existsSync(reqPath)) {
      const reqContent = readFile(reqPath);
      for (const [dep, names] of Object.entries(pythonFrameworkMap)) {
        if (reqContent.toLowerCase().includes(dep.toLowerCase()) && !frameworks.some(f => names.includes(f))) {
          frameworks.push(...names);
        }
      }
    }
    
    // Check Pipfile
    const pipfilePath = path.join(rootDir, "Pipfile");
    if (fs.existsSync(pipfilePath)) {
      const pipfileContent = readFile(pipfilePath);
      for (const [dep, names] of Object.entries(pythonFrameworkMap)) {
        if (pipfileContent.toLowerCase().includes(dep.toLowerCase()) && !frameworks.some(f => names.includes(f))) {
          frameworks.push(...names);
        }
      }
    }
    
    // Check pyproject.toml
    const pyprojectPath = path.join(rootDir, "pyproject.toml");
    if (fs.existsSync(pyprojectPath)) {
      const pyprojectContent = readFile(pyprojectPath);
      for (const [dep, names] of Object.entries(pythonFrameworkMap)) {
        if (pyprojectContent.toLowerCase().includes(dep.toLowerCase()) && !frameworks.some(f => names.includes(f))) {
          frameworks.push(...names);
        }
      }
    }
  } catch {}
   
  // Detect SwiftUI from Swift files
  const swiftFiles = files.filter(f => f.extension === "swift");
  for (const swiftFile of swiftFiles) {
    try {
      const content = readFile(path.join(rootDir, swiftFile.relativePath));
      if (content.includes("import SwiftUI")) {
        if (!frameworks.includes("SwiftUI")) {
          frameworks.push("SwiftUI");
        }
        if (!frameworks.includes("iOS")) {
          frameworks.push("iOS");
        }
        break;
      }
    } catch {}
  }
  
  // Content-based Python framework detection (highest priority)
  const pythonFrameworkCounts: Record<string, number> = {
    django: 0,
    flask: 0,
    fastapi: 0,
  };
  
  const pythonFiles = files.filter(f => f.extension === "py");
  for (const pyFile of pythonFiles.slice(0, 50)) {
    try {
      const content = readFile(path.join(rootDir, pyFile.relativePath));
      const lowerContent = content.toLowerCase();
      
      if (lowerContent.includes("from django") || lowerContent.includes("import django")) {
        pythonFrameworkCounts.django++;
      }
      if (lowerContent.includes("from flask") || lowerContent.includes("import flask")) {
        pythonFrameworkCounts.flask++;
      }
      if (lowerContent.includes("from fastapi") || lowerContent.includes("import fastapi")) {
        pythonFrameworkCounts.fastapi++;
      }
    } catch {}
  }
  
  // If content analysis found a clear winner, use it to resolve conflicts
  const contentWinner = Object.entries(pythonFrameworkCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (contentWinner) {
    const [framework] = contentWinner;
    const frameworkName = framework.charAt(0).toUpperCase() + framework.slice(1);
    
    // Only override package-based detection if content strongly disagrees
    if (!frameworks.includes(frameworkName)) {
      frameworks.push(frameworkName);
    }
  }
  
  return [...new Set(frameworks)];
}

/**
 * Detect Node.js libraries from package.json
 */
function detectNodeLibraries(rootDir: string): string[] {
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
  
  return libraries;
}

function detectSwiftLibraries(rootDir: string): string[] {
  const libraries: string[] = [];
  const packagePath = path.join(rootDir, "Package.swift");

  try {
    const content = readFile(packagePath);
    const libMap: Record<string, string> = {
      "Vapor": "Vapor",
      "Fluent": "Fluent ORM",
      "FluentPostgresDriver": "Fluent PostgreSQL",
      "FluentMySQLDriver": "Fluent MySQL",
      "FluentSQLiteDriver": "Fluent SQLite",
      "FluentMongoDriver": "Fluent MongoDB",
      "Leaf": "Leaf",
      "APNS": "APNS",
      "Queues": "Queues",
      "QueuesRedisDriver": "Queues Redis",
      "QueuesFluentDriver": "Queues Fluent",
      "Mailgun": "Mailgun",
      "SendGrid": "SendGrid",
      "JWTKit": "JWTKit",
      "Crypto": "Apple CryptoKit",
      "NIO": "SwiftNIO",
      "NIOSSL": "SwiftNIO SSL",
      "NIOHTTP1": "SwiftNIO HTTP",
      "NIOWebSocket": "SwiftNIO WebSocket",
      "NIOTransportServices": "SwiftNIO Transport Services",
      "AsyncHTTPClient": "AsyncHTTPClient",
      "Alamofire": "Alamofire",
      "Moya": "Moya",
      "RxSwift": "RxSwift",
      "PromiseKit": "PromiseKit",
      "SwiftyJSON": "SwiftyJSON",
      "ObjectMapper": "ObjectMapper",
      "SnapKit": "SnapKit",
      "Kingfisher": "Kingfisher",
      "SDWebImage": "SDWebImage Swift",
      "Lottie": "Lottie",
      "SwiftLint": "SwiftLint",
      "SwiftFormat": "SwiftFormat",
    };

    const depPattern = /\.package\s*\(\s*url:\s*"[^"]+"\s*,\s*(?:from|\.upToNextMajor|\.upToNextMinor|\.exact):\s*"[^"]+"\s*\)/g;
    let match;

    while ((match = depPattern.exec(content)) !== null) {
      const depString = match[0];
      const urlMatch = depString.match(/url:\s*"([^"]+)"/);
      if (urlMatch) {
        const url = urlMatch[1];
        const depName = url.split("/").pop()?.replace(".git", "") || "";
        const libName = libMap[depName] || depName;
        if (!libraries.includes(libName)) {
          libraries.push(libName);
        }
      }
    }
  } catch {}

  return libraries;
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

function detectGradleLibraries(_files: FileInfo[], rootDir: string): string[] {
  const libraries: string[] = [];
  const gradleFiles: string[] = [];

  function findGradleFiles(dir: string, depth: number = 0) {
    if (depth > 3) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          findGradleFiles(fullPath, depth + 1);
        } else if (entry.isFile() && (entry.name === 'build.gradle' || entry.name === 'build.gradle.kts')) {
          gradleFiles.push(fullPath);
        }
      }
    } catch {}
  }

  findGradleFiles(rootDir);

  const libMap: Record<string, string> = {
    "androidx.core": "AndroidX Core", "androidx.appcompat": "AppCompat",
    "com.google.android.material": "Material Design",
    "androidx.constraintlayout": "ConstraintLayout",
    "androidx.navigation": "Navigation", "androidx.room": "Room",
    "org.jetbrains.kotlin": "Kotlin", "kotlinx.coroutines": "Kotlin Coroutines",
    "com.squareup.retrofit2": "Retrofit", "com.squareup.okhttp3": "OkHttp",
    "com.google.dagger": "Dagger", "junit": "JUnit",
    "org.mockito": "Mockito", "com.jakewharton.timber": "Timber",
    "com.github.bumptech.glide": "Glide", "io.coil-kt": "Coil",
    "com.google.code.gson": "Gson",
  };

  for (const gf of gradleFiles) {
    try {
      const content = readFile(gf);
      const depPattern = /(?:implementation|api|compileOnly|runtimeOnly|testImplementation|androidTestImplementation|kapt|annotationProcessor)\s*(?:\(|\s)?['"]([^'"]+)['"](?:\))?/g;
      let match;
      while ((match = depPattern.exec(content)) !== null) {
        const parts = match[1].split(':');
        if (parts.length >= 2) {
          const libName = libMap[parts[0]] || `${parts[0]}:${parts[1]}`;
          if (!libraries.includes(libName)) libraries.push(libName);
        }
      }
      if (content.includes("com.android.application") && !libraries.includes("Android Gradle Plugin")) {
        libraries.push("Android Gradle Plugin");
      }
    } catch {}
  }

  return libraries;
}

function detectCargoLibraries(rootDir: string): string[] {
  const libraries: string[] = [];
  try {
    const content = readFile(path.join(rootDir, "Cargo.toml"));
    const libMap: Record<string, string> = {
      tokio: "Tokio", serde: "Serde", "serde_json": "Serde JSON",
      reqwest: "Reqwest", actix_web: "Actix Web", axum: "Axum",
      sqlx: "SQLx", diesel: "Diesel", mongodb: "MongoDB",
      redis: "Redis", chrono: "Chrono", regex: "Regex",
      clap: "Clap", log: "Log", tracing: "Tracing",
      anyhow: "Anyhow", thiserror: "ThisError", rayon: "Rayon",
      uuid: "UUID", rand: "Rand", hyper: "Hyper",
    };
    const depSection = content.match(/\[dependencies\]([^\[]*)/);
    if (depSection) {
      const depPattern = /^(\w+)\s*=/gm;
      let match;
      while ((match = depPattern.exec(depSection[1])) !== null) {
        const libName = libMap[match[1]] || match[1];
        if (!libraries.includes(libName)) libraries.push(libName);
      }
    }
  } catch {}
  return libraries;
}

function detectGoLibraries(rootDir: string): string[] {
  const libraries: string[] = [];
  try {
    const content = readFile(path.join(rootDir, "go.mod"));
    const libMap: Record<string, string> = {
      "gin-gonic/gin": "Gin", "labstack/echo": "Echo",
      "gorilla/mux": "Gorilla Mux", "go-chi/chi": "Chi",
      "gofiber/fiber": "Fiber", "gorm.io/gorm": "GORM",
      "github.com/jmoiron/sqlx": "SQLx",
      "github.com/lib/pq": "PostgreSQL Driver",
      "github.com/spf13/cobra": "Cobra", "github.com/spf13/viper": "Viper",
    };
    const requirePattern = /^\s*(\S+)\s+v?[\d\.]+/gm;
    let match;
    while ((match = requirePattern.exec(content)) !== null) {
      const libName = libMap[match[1]] || match[1];
      if (!libraries.includes(libName)) libraries.push(libName);
    }
  } catch {}
  return libraries;
}

function detectMavenLibraries(rootDir: string): string[] {
  const libraries: string[] = [];
  try {
    const content = readFile(path.join(rootDir, "pom.xml"));
    const libMap: Record<string, string> = {
      "org.springframework.boot": "Spring Boot",
      "org.springframework": "Spring Framework",
      "org.springframework.data": "Spring Data",
      "org.springframework.security": "Spring Security",
      "org.springframework.cloud": "Spring Cloud",
    };
    const depPattern = /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>/g;
    let match;
    while ((match = depPattern.exec(content)) !== null) {
      const libName = libMap[match[1]] || `${match[1]}:${match[2]}`;
      if (!libraries.includes(libName)) libraries.push(libName);
    }
  } catch {}
  return libraries;
}

function detectLibraries(files: FileInfo[], rootDir: string): string[] {
  const libraries: string[] = [];

  libraries.push(...detectNodeLibraries(rootDir));
  libraries.push(...detectGradleLibraries(files, rootDir));
  libraries.push(...detectCargoLibraries(rootDir));
  libraries.push(...detectGoLibraries(rootDir));
  libraries.push(...detectMavenLibraries(rootDir));
  libraries.push(...detectSwiftLibraries(rootDir));

  return [...new Set(libraries)];
}

/**
 * Detect Salesforce project information
 */
function detectSalesforceInfo(files: FileInfo[], rootDir: string): TechStack["salesforce"] {
  const sfdxPath = path.join(rootDir, "sfdx-project.json");
  
  if (!fs.existsSync(sfdxPath)) {
    return undefined;
  }
  
  try {
    const sfdxConfig = readJsonFile(sfdxPath) as {
      sourceApiVersion?: string;
      packageDirectories?: Array<{ path: string; default?: boolean }>;
      namespace?: string;
    };
    
    // Count Apex files
    const apexFiles = files.filter(f => f.extension === "cls" || f.extension === "trigger");
    const apexClasses = files.filter(f => f.extension === "cls").length;
    const triggers = files.filter(f => f.extension === "trigger").length;
    
    // Detect SObjects from trigger files
    const sObjects = new Set<string>();
    for (const file of files) {
      if (file.extension === "trigger") {
        try {
          const content = readFile(file.path);
          const match = content.match(/trigger\s+\w+\s+on\s+(\w+)/i);
          if (match) {
            sObjects.add(match[1]);
          }
        } catch {}
      }
    }
    
    return {
      apiVersion: sfdxConfig.sourceApiVersion,
      packageDirectories: sfdxConfig.packageDirectories?.map(p => p.path),
      namespace: sfdxConfig.namespace,
      sObjects: Array.from(sObjects),
      apexClasses,
      triggers,
    };
  } catch {
    return undefined;
  }
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
  
  // Add Salesforce section if applicable
  if (stack.salesforce) {
    content += "## Salesforce\n";
    content += `- **API Version**: ${stack.salesforce.apiVersion || "N/A"}\n`;
    content += `- **Apex Classes**: ${stack.salesforce.apexClasses}\n`;
    content += `- **Triggers**: ${stack.salesforce.triggers}\n`;
    content += `- **SObjects**: ${stack.salesforce.sObjects?.join(", ") || "N/A"}\n`;
    if (stack.salesforce.namespace) {
      content += `- **Namespace**: ${stack.salesforce.namespace}\n`;
    }
    content += "\n";
  }
  
  content += "---\n*Generated by ai-first*\n";
  
  return content;
}
