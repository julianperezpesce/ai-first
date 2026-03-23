import { readFile, readJsonFile } from "../utils/fileUtils.js";
import path from "path";
import fs from "fs";
/**
 * Detect technology stack from repository
 */
export function detectTechStack(files, rootDir) {
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
    const description = generateTechStackDescription(languages, frameworks, libraries, tools, packageManagers, testing, linters, formatters);
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
function detectLanguages(extensions) {
    const langMap = {
        ts: "TypeScript", tsx: "TypeScript (React)", js: "JavaScript", jsx: "JavaScript (React)",
        py: "Python", java: "Java", cs: "C#", go: "Go", rs: "Rust", rb: "Ruby",
        php: "PHP", swift: "Swift", kt: "Kotlin", scala: "Scala", vue: "Vue",
        svelte: "Svelte", html: "HTML", css: "CSS", scss: "SCSS", less: "LESS",
        sql: "SQL", sh: "Shell", bash: "Bash", zsh: "Zsh", ps1: "PowerShell",
        yaml: "YAML", yml: "YAML", toml: "TOML", xml: "XML", json: "JSON",
        md: "Markdown", tex: "LaTeX", r: "R", lua: "Lua", pl: "Perl",
        hs: "Haskell", ex: "Elixir", erl: "Erlang", clj: "Clojure", dart: "Dart",
        cls: "Apex", trigger: "Apex Trigger",
    };
    const detected = [];
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
function detectFrameworks(files, fileNames, rootDir) {
    const frameworks = [];
    try {
        const pkgPath = path.join(rootDir, "package.json");
        const pkg = readJsonFile(pkgPath);
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        const frameworkMap = {
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
    }
    catch { }
    const frameworkIndicators = {
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
    return [...new Set(frameworks)];
}
/**
 * Detect Node.js libraries from package.json
 */
function detectNodeLibraries(rootDir) {
    const libraries = [];
    try {
        const pkgPath = path.join(rootDir, "package.json");
        const pkg = readJsonFile(pkgPath);
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        const libMap = {
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
    }
    catch { }
    return libraries;
}
function detectSwiftLibraries(rootDir) {
    const libraries = [];
    const packagePath = path.join(rootDir, "Package.swift");
    try {
        const content = readFile(packagePath);
        const libMap = {
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
    }
    catch { }
    return libraries;
}
/**
 * Detect development tools
 */
function detectTools(files, fileNames) {
    const tools = [];
    const toolIndicators = {
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
function detectPackageManagers(files) {
    const managers = [];
    const fileNames = files.map(f => f.name);
    if (fileNames.includes("package.json")) {
        managers.push("npm");
        if (fileNames.includes("pnpm-lock.yaml"))
            managers.push("pnpm");
        if (fileNames.includes("yarn.lock"))
            managers.push("Yarn");
    }
    if (fileNames.includes("requirements.txt") || fileNames.includes("Pipfile")) {
        managers.push("pip");
        if (fileNames.includes("poetry.lock"))
            managers.push("Poetry");
    }
    if (fileNames.includes("go.mod"))
        managers.push("Go Modules");
    if (fileNames.includes("Cargo.toml"))
        managers.push("Cargo");
    if (fileNames.includes("Gemfile"))
        managers.push("Bundler");
    if (fileNames.includes("composer.json"))
        managers.push("Composer");
    return managers;
}
/**
 * Detect testing frameworks
 */
function detectTesting(files, fileNames) {
    const testing = [];
    const testIndicators = {
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
function detectLinters(files, fileNames) {
    const linters = [];
    const lintIndicators = {
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
function detectFormatters(files, fileNames) {
    const formatters = [];
    const formatIndicators = {
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
function detectAndroidSDK(files, rootDir) {
    const fileNames = files.map(f => f.name);
    const hasAndroid = fileNames.some(n => n === "build.gradle" || n === "build.gradle.kts" ||
        n === "app/build.gradle" || n === "app/build.gradle.kts");
    if (!hasAndroid)
        return undefined;
    const android = {};
    const gradleFiles = files.filter(f => f.name === "build.gradle" || f.name === "build.gradle.kts" ||
        f.relativePath.includes("app/build.gradle"));
    for (const gf of gradleFiles) {
        try {
            const content = readFile(path.join(rootDir, gf.relativePath));
            const minSdkMatch = content.match(/minSdk(?:Version)?\s*[=:]\s*(\d+)/);
            const targetSdkMatch = content.match(/targetSdk(?:Version)?\s*[=:]\s*(\d+)/);
            const compileSdkMatch = content.match(/compileSdk(?:Version)?\s*[=:]\s*(\d+)/);
            if (minSdkMatch && !android.minSdk)
                android.minSdk = minSdkMatch[1];
            if (targetSdkMatch && !android.targetSdk)
                android.targetSdk = targetSdkMatch[1];
            if (compileSdkMatch && !android.compileSdk)
                android.compileSdk = compileSdkMatch[1];
        }
        catch { }
    }
    try {
        const propsPath = path.join(rootDir, "gradle/wrapper/gradle-wrapper.properties");
        const props = readFile(propsPath);
        const v = props.match(/gradle-(\d+\.\d+)/);
        if (v)
            android.gradleVersion = v[1];
    }
    catch { }
    return (android.minSdk || android.targetSdk || android.compileSdk || android.gradleVersion) ? android : undefined;
}
/**
 * Generate tech stack description
 */
function generateTechStackDescription(languages, frameworks, libraries, tools, packageManagers, testing, linters, formatters) {
    const lines = [];
    if (languages.length > 0)
        lines.push(`**Languages**: ${languages.join(", ")}`);
    if (frameworks.length > 0)
        lines.push(`**Frameworks**: ${frameworks.join(", ")}`);
    if (libraries.length > 0)
        lines.push(`**Libraries**: ${libraries.join(", ")}`);
    if (tools.length > 0)
        lines.push(`**Tools**: ${tools.join(", ")}`);
    if (packageManagers.length > 0)
        lines.push(`**Package Managers**: ${packageManagers.join(", ")}`);
    if (testing.length > 0)
        lines.push(`**Testing**: ${testing.join(", ")}`);
    if (linters.length > 0)
        lines.push(`**Linters**: ${linters.join(", ")}`);
    if (formatters.length > 0)
        lines.push(`**Formatters**: ${formatters.join(", ")}`);
    return lines.join("\n\n");
}
function detectGradleLibraries(_files, rootDir) {
    const libraries = [];
    const gradleFiles = [];
    function findGradleFiles(dir, depth = 0) {
        if (depth > 3)
            return;
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    findGradleFiles(fullPath, depth + 1);
                }
                else if (entry.isFile() && (entry.name === 'build.gradle' || entry.name === 'build.gradle.kts')) {
                    gradleFiles.push(fullPath);
                }
            }
        }
        catch { }
    }
    findGradleFiles(rootDir);
    const libMap = {
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
                    if (!libraries.includes(libName))
                        libraries.push(libName);
                }
            }
            if (content.includes("com.android.application") && !libraries.includes("Android Gradle Plugin")) {
                libraries.push("Android Gradle Plugin");
            }
        }
        catch { }
    }
    return libraries;
}
function detectCargoLibraries(rootDir) {
    const libraries = [];
    try {
        const content = readFile(path.join(rootDir, "Cargo.toml"));
        const libMap = {
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
                if (!libraries.includes(libName))
                    libraries.push(libName);
            }
        }
    }
    catch { }
    return libraries;
}
function detectGoLibraries(rootDir) {
    const libraries = [];
    try {
        const content = readFile(path.join(rootDir, "go.mod"));
        const libMap = {
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
            if (!libraries.includes(libName))
                libraries.push(libName);
        }
    }
    catch { }
    return libraries;
}
function detectMavenLibraries(rootDir) {
    const libraries = [];
    try {
        const content = readFile(path.join(rootDir, "pom.xml"));
        const libMap = {
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
            if (!libraries.includes(libName))
                libraries.push(libName);
        }
    }
    catch { }
    return libraries;
}
function detectLibraries(files, rootDir) {
    const libraries = [];
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
function detectSalesforceInfo(files, rootDir) {
    const sfdxPath = path.join(rootDir, "sfdx-project.json");
    if (!fs.existsSync(sfdxPath)) {
        return undefined;
    }
    try {
        const sfdxConfig = readJsonFile(sfdxPath);
        // Count Apex files
        const apexFiles = files.filter(f => f.extension === "cls" || f.extension === "trigger");
        const apexClasses = files.filter(f => f.extension === "cls").length;
        const triggers = files.filter(f => f.extension === "trigger").length;
        // Detect SObjects from trigger files
        const sObjects = new Set();
        for (const file of files) {
            if (file.extension === "trigger") {
                try {
                    const content = readFile(file.path);
                    const match = content.match(/trigger\s+\w+\s+on\s+(\w+)/i);
                    if (match) {
                        sObjects.add(match[1]);
                    }
                }
                catch { }
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
    }
    catch {
        return undefined;
    }
}
/**
 * Generate tech_stack.md content
 */
export function generateTechStackFile(stack) {
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
//# sourceMappingURL=techStack.js.map