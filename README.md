# ai-first

<p align="center">
  <a href="https://github.com/julianperezpesce/ai-first/stargazers">
    <img src="https://img.shields.io/github/stars/julianperezpesce/ai-first?style=flat&color=ffd700" alt="Stars">
  </a>
  <a href="https://www.npmjs.com/package/ai-first-cli">
    <img src="https://img.shields.io/npm/dt/ai-first-cli?color=blue" alt="NPM Downloads">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  </a>
  <a href="https://github.com/julianperezpesce/ai-first/issues">
    <img src="https://img.shields.io/github/issues/julianperezpesce/ai-first" alt="Issues">
  </a>
</p>

> **Give your AI coding assistant superpowers.** Generate instant project context so AI agents understand your codebase in seconds, not minutes.

---

## 🚀 What's New in v1.3.8

**MCP Server & Configuration System**

- ✅ **MCP Server Support**: Native Model Context Protocol server for AI agent integration
- ✅ **Configuration System**: Full `ai-first.config.json` support with 4 presets (`full`, `quick`, `api`, `docs`)
- ✅ **Content Compression**: Reduce tokens by up to 70% with smart content processing
- ✅ **Git Blame Integration**: Track code authorship with inline/block formatting
- ✅ **RAG Vector Search**: Semantic search for your codebase (no cloud required)
- ✅ **Multi-Repository Support**: Handle monorepos and microservices
- ✅ **1061 Tests Passing**: All tests passing with comprehensive coverage

### Previous: v1.3.7

**AI Context Quality Evaluator**

- ✅ **Go Entrypoints**: Automatic detection of `main.go`, HTTP handlers, and service ports
- ✅ **Rust Entrypoints**: Support for `main.rs`, `Cargo.toml`, and struct implementations  
- ✅ **PHP Entrypoints**: Detection of `index.php`, Laravel conventions, and Composer dependencies
- ✅ **Improved Framework Detection**: Fixed NestJS (`@nestjs/*`), Spring Boot (pom.xml/build.gradle), and Express (API Server vs Microservices)
- ✅ **Apex Parser**: Enhanced method signature parsing with generics support (`List<Account>`) and multi-line annotations
- ✅ **Architecture Descriptions**: Functional descriptions instead of generic "Contains X files"
- ✅ **1026 Tests Passing**: 100% success rate with 30 new tests added

---

## 📋 Table of Contents

- [Commands](#-commands-reference)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Use Cases](#-use-cases)
- [Benchmark](#-benchmark)
- [How It Works](#-how-it-works)
- [Generated Files](#-generated-files)
- [AI Agents](#-supported-ai-agents)
- [Roadmap](#-roadmap)
- [Contributing](#-for-contributors)

---

## ⚡ Commands Reference

| Command | Description |
|---------|-------------|
| `af init` | Generate all context files (symbols, dependencies, architecture, etc.) |
| `af index` | Create SQLite database for fast symbol queries |
| `af update` | Incrementally update context when files change |
| `af watch` | Watch for file changes and auto-update index |
| `af context` | Extract context around a specific symbol or function |
| `af explore` | Explore module dependencies interactively |
| `af map` | Generate repository map with all relationships |
| `af doctor` | Check repository health and AI readiness |
| `af query` | Query the index (symbols, imports, exports, stats) |
| `af adapters` | List supported language/framework adapters |
| `af git` | Show recent git activity and changed files |
| `af graph` | Display knowledge graph visualization |
| `af --completions` | Generate shell autocomplete script |

> **Note:** All commands work with `af` (recommended) or `ai-first` (legacy).

---

<!-- START FIRST 10 SECONDS VALUE -->
## ⚡ In 10 Seconds

```
$ npm install -g ai-first-cli
$ af init
✅ Generated ai-context/ai_context.md (0.3s)
✅ Generated ai-context/symbols.json (0.1s)  
✅ Generated ai-context/dependencies.json (0.1s)
✅ Generated 11 context files

🎉 Ready! Give ai-context/ai_context.md to your AI assistant.
```

**Result:** AI understands your project in ~500 tokens instead of 50,000.
<!-- END FIRST 10 SECONDS VALUE -->

## ⚡ Quick Start

Initialize AI-First in your repository:

```
af init
```

Index the repository so AI agents can understand the codebase:

```
af index
```

* `init` generates 11 context files with project metadata
* `index` creates a SQLite database for fast symbol queries

---

## 📦 Installation

### Requirements
- Node.js 18+ (for optional semantic indexing)

### Install

```bash
# Install globally (recommended)
npm install -g ai-first-cli

# Now you can use 'af' command
af init
af index
af doctor
```

### Other Installation Methods

```bash
# Homebrew (macOS/Linux)
brew tap julianperezpesce/tap
brew install ai-first-cli

# Install script (Linux/macOS/WSL)
curl -fsSL https://raw.githubusercontent.com/julianperezpesce/ai-first/master/install.sh | bash
```

### Shell Autocomplete

```bash
# For bash
af --completions > /usr/local/etc/bash_completion.d/af.bash
source /usr/local/etc/bash_completion.d/af.bash
```

---

## 🎯 Use Cases

### 1. AI Coding Agents (OpenCode, Cursor, Claude Code)
```bash
af init
# Then ask AI: "Read ai-context/ai_context.md and help me add a feature"
```

### 2. Onboarding New Developers
```bash
af init
# New dev reads ai-context/ai_context.md → understands project in 2 minutes
```

### 3. Project Documentation
```bash
af init
# Instant auto-generated documentation always up to date
```

---

## 💡 Before & After

### Before: AI Blind

```
You: "Add authentication to my API"
AI: *reads 200 files over 2 minutes*
AI: "I'm not sure about your auth structure..."
AI: *guesses wrong*
Result: Broken code, wasted tokens
```

### After: AI Enlightened

```
$ af init

You: "Read ai-context/ai_context.md, then add authentication"
AI: *reads 1 file (0.5s)*
AI: "I see you're using Express + JWT with auth in src/middleware/auth.ts"
AI: "I'll add authentication following your conventions..."
Result: Working code, 99% fewer tokens
```

---

## 📊 Benchmark

| Repository Size | Files Scanned | Time | Context Size |
|----------------|---------------|------|--------------|
| Small (Laptop) | 50 | 0.3s | ~500 tokens |
| Medium (Startup) | 200 | 1.2s | ~2,000 tokens |
| Large (Enterprise) | 1,000 | 5.5s | ~8,000 tokens |
| Huge (Monolith) | 5,000 | 28s | ~25,000 tokens |

**vs. Traditional Context:**
- Traditional: 50,000+ tokens (read all files)
- ai-first: 500-25,000 tokens (structured context)
- **Savings: 50-90% fewer tokens**

---

## 🔄 Comparison

| Feature | ai-first | raw codebase | context7 | Sourcegraph |
|---------|----------|--------------|----------|-------------|
| **Offline** | ✅ | ✅ | ❌ | ❌ |
| **No API key** | ✅ | ✅ | ❌ | ❌ |
| **Architecture detection** | ✅ | ❌ | ❌ | ❌ |
| **Convention extraction** | ✅ | ❌ | ❌ | ❌ |
| **Entry point discovery** | ✅ | ❌ | ❌ | ✅ |
| **SQLite index** | ✅ | ❌ | ❌ | ✅ |
| **Multi-language** | ✅ | ✅ | ✅ | ✅ |
| **Zero config** | ✅ | N/A | ❌ | ❌ |
| **Cost** | Free | Free | $19/mo | $19/mo |

---

## 🏗️ Architecture

```
src/
├── commands/           # CLI interface
├── analyzers/          # 7 independent analyzers
│   ├── architecture.ts # Pattern detection
│   ├── techStack.ts    # Language/framework detection
│   ├── entrypoints.ts  # Entry point discovery
│   ├── conventions.ts  # Convention detection
│   ├── symbols.ts      # Function/class extraction
│   ├── dependencies.ts # Import analysis
│   └── aiRules.ts     # AI guidelines
├── core/               # Processing engine
│   ├── parsers/        # AST-based language parsers
│   │   ├── typescriptParser.ts  # TS Compiler API
│   │   ├── pythonParser.ts      # Python AST parser
│   │   └── index.ts            # Parser registry
│   ├── repoScanner.ts  # File discovery
│   ├── indexer.ts      # SQLite indexing
│   └── contextGenerator.ts
└── utils/
```

### Data Flow

```
User CLI
   │
   ▼
AI-First CLI
   │
   ├── Repository Scanner
   │        │
   │        ▼
   │   File Analysis
   │
   ├── Index Engine
   │        │
   │        ▼
   │   SQLite Index
   │
    └── Architecture Mapper
             │
             ▼
      Repository Map
```

### AST-Based Language Parsers

ai-first uses real Abstract Syntax Tree (AST) parsers for accurate code analysis:

- **TypeScript/JavaScript**: TypeScript Compiler API
  - Extracts classes, interfaces, functions, enums
  - Detects inheritance (extends/implements)
  - Parses imports/exports and JSDoc comments
  - Handles decorators (@Component, @Injectable)

- **Python**: Custom recursive descent parser
  - Extracts classes, functions, methods
  - Detects decorators (@app.route, @dataclass)
  - Parses type hints and docstrings
  - Handles async/await syntax

- **Other languages**: Go, Rust, Java, PHP, Ruby (regex-based)

---

## 📁 Generated Files

```
ai-context/
├── ai_context.md      # ⭐ Start here — unified overview
├── repo_map.json      # Machine-readable structure
├── symbols.json       # Extracted functions/classes with unique IDs
├── dependencies.json  # Import relationships
├── architecture.md    # Architecture pattern
├── tech_stack.md      # Languages & frameworks
├── entrypoints.md     # Entry points
├── conventions.md     # Coding conventions
├── index.db           # SQLite index (generated by `af index`)
├── graph/             # Module dependency graphs (generated by `af map`)
│   ├── module-graph.json
│   └── symbol-graph.json
└── context/           # Business context (generated by `af init`)
    ├── features/      # Auto-detected business features
    │   └── <module>.json
    └── flows/         # Business execution chains
        └── <flow>.json
```

---

## 🤖 Supported AI Agents

| Agent | How to Use |
|-------|------------|
| **OpenCode** | `~/.config/opencode/commands/ai-first.md` |
| **Cursor** | Reference `ai-context/ai_context.md` in prompts |
| **Claude Code** | Include context in system prompt |
| **Windsurf** | Project understanding |
| **GitHub Copilot** | Context-aware suggestions |

---

## ⚡ Quick Commands

```bash
# Generate context
af init

# Generate symbol graph and context packets
af map

# Generate SQLite index for fast queries
af index

# Force semantic indexing (for large repos)
af index --semantic

# Generate context for a specific symbol
af context extractSymbols
af context MyClass

# Check repository health
af doctor

# Explore module dependencies
af explore all
af explore src

# Custom output directory
af init --output ./docs/ai

# Custom root directory
af init --root ./my-project
```

---

## 🩺 Doctor Command

Check repository health and AI readiness:

```bash
af doctor
af doctor --fix
```

The doctor command scans your repository and reports:
- Files scanned
- Languages detected
- Large files (>1MB)
- AI directory status
- Semantic index availability
- Module graph status
- SQLite index status

---

## 🕸️ Explore Command

Navigate module dependencies:

```bash
# List all modules
af explore all

# Explore specific module
af explore src
```

The explore command generates a module dependency graph based on imports.

---

## 🔎 Semantic Index

For large repositories (>2000 files), semantic indexing is automatically enabled:

```bash
# Force semantic indexing
af index --semantic
```

---

## 🎯 Semantic Contexts (Features & Flows)

Semantic contexts are auto-generated business-level understanding of your codebase.

### Features

Features represent real business modules detected from your project structure.

**Quality Filters:**
- Must have ≥ 3 source files
- Must contain an entrypoint (Controller, Route, Handler, Command, Service)
- Excluded: utils, helpers, types, interfaces, constants, config, models, dto, common

```json
// ai-context/context/features/<module>.json
{
  "feature": "auth",
  "files": ["src/auth/controller.js", "src/auth/service.js"],
  "entrypoints": ["src/auth/controller.js"]
}
```

### Flows

Flows represent business execution chains starting from entrypoints.

**Quality Filters:**
- Must span ≥ 3 files
- Must cross ≥ 2 architectural layers (api → service → data)
- Must start from an entrypoint (Controller, Route, Command, Handler)

```json
// ai-context/context/flows/<name>.json
{
  "name": "login",
  "entrypoint": "src/auth/controller.js",
  "files": ["controller.js", "service.js", "repository.js"],
  "depth": 3,
  "layers": ["api", "service", "data"]
}
```

**Generated by:** `af init` or `af map`
- Chunks files by function/class boundaries
- Generates embeddings for semantic search
- Supports repositories up to 100k files
- Skips binaries and large files (>1MB)

---

## 🌍 Multi-Language & Framework Support

### Languages

| Category | Languages |
|----------|-----------|
| **Web** | JavaScript, TypeScript, Python, **Go**, **Rust** |
| **Backend** | Java, C#, **PHP**, Ruby, **Go**, **Rust**, Kotlin, **Apex** |
| **Mobile** | Swift, Kotlin, Android |
| **Frontend** | Vue, Svelte, React, HTML, CSS, SCSS |
| **Testing** | Jest, Vitest, pytest, Mocha, RSpec |

**New in v1.3.6:** Full entrypoint detection for **Go** (handlers, ports), **Rust** (Cargo.toml, binaries), and **PHP** (index.php, Laravel).

### Frameworks (Tested)

| Framework | Language | Test Project | Status |
|-----------|----------|-------------|--------|
| **Django** | Python | `test-projects/django-app` | ✅ |
| **FastAPI** | Python | `test-projects/fastapi-app` | ✅ |
| **Flask** | Python | `test-projects/flask-app` | ✅ |
| **Laravel** | PHP | `test-projects/laravel-app` | ✅ |
| **Rails** | Ruby | `test-projects/rails-app` | ✅ |
| **Spring Boot** | Java | `test-projects/spring-boot-app` | ✅ Improved v1.3.6 |
| Express.js | JavaScript | `test-projects/express-api` | ✅ Fixed v1.3.6 |
| **NestJS** | TypeScript | `test-projects/nestjs-backend` | ✅ Fixed v1.3.6 |
| React | JavaScript | `test-projects/react-app` | ✅ |
| Python CLI | Python | `test-projects/python-cli` | ✅ |
| Salesforce DX | Apex | `test-projects/salesforce-cli` | ✅ Enhanced v1.3.6 |
| **Go** | Go | `test-projects/go-microservice` | ✅ **NEW v1.3.6** |
| **Rust** | Rust | `test-projects/rust-cli` | ✅ **NEW v1.3.6** |
| **PHP Vanilla** | PHP | `test-projects/php-vanilla` | ✅ **NEW v1.3.6** |

**v1.3.6 Improvements:**
- **NestJS**: Now correctly detects `@nestjs/*` scoped packages
- **Spring Boot**: Parses `pom.xml` and `build.gradle`/`build.gradle.kts`
- **Express**: Shows "API Server" instead of "Microservices" for single service directories
- **Apex**: Enhanced parser with generics support (`List<Account>`, `Map<String, Object>`)

ai-first automatically detects and indexes Android/Kotlin projects:

- **Language Detection**: Kotlin (.kt files)
- **Framework Detection**: Android (via build.gradle, AndroidManifest.xml)
- **Dependency Parsing**: Gradle dependencies (implementation, api, compile)
- **Entry Points**: Activities, Services, BroadcastReceivers from AndroidManifest.xml
- **Resources**: Indexes res/layout, res/drawable, res/values
- **Multi-module**: Detects Gradle modules from settings.gradle

### Generated Files for Android Projects

- `ai-context/tech_stack.md` - Shows Android framework with SDK versions
- `ai-context/dependencies.json` - Gradle dependencies with group:artifact:version
- `ai-context/entrypoints.md` - Android activities, services, permissions
- `ai-context/android-resources.json` - Layouts, drawables, values (if res/ exists)
- `ai-context/gradle-modules.json` - Multi-module structure (if settings.gradle exists)

### Salesforce Support ✅

ai-first provides comprehensive Salesforce/Apex development support with 531 dedicated tests:

**Apex Development**
- **Apex Classes**: Full detection with methods, properties, annotations (@AuraEnabled, @IsTest)
- **Apex Triggers**: All 7 trigger events (before/after insert, update, delete, undelete)
- **Batch Apex**: Database.Batchable implementations with start/execute/finish methods
- **Scheduled Apex**: Schedulable interface detection
- **Queueable Apex**: Queueable interface for async processing
- **Test Classes**: @IsTest annotation detection and test methods

**Lightning Web Components (LWC)**
- JavaScript controllers with @api, @track, @wire decorators
- HTML templates with conditional rendering and loops
- CSS styling and design tokens
- Component metadata (.js-meta.xml) with target configurations

**Flows and Automation**
- Screen Flows with input components
- Record-Triggered Flows with entry criteria
- Scheduled Flows
- Decision elements and logic

**SFDX and Metadata**
- sfdx-project.json configuration
- Custom Objects and Fields (8 field types supported)
- Profiles and Permission Sets
- Package.xml generation
- Source API version detection

**Generated Files for Salesforce Projects**
- `ai-context/tech_stack.md` - Salesforce framework with Apex language
- `ai-context/symbols.json` - Complete Apex symbol extraction
- `ai-context/entrypoints.md` - All entry points (@AuraEnabled, triggers, batches)
- `ai-context/architecture.md` - Apex trigger framework patterns
- `ai-context/flows/` - Flow-specific context files

---

## 🧪 Testing & Quality

### Comprehensive Test Suite

ai-first maintains exceptional code quality with **996 automated tests**:

| Test Category | Tests | Coverage |
|--------------|-------|----------|
| **Unit Tests** | 996 | Core analyzers, parsers, utilities |
| **Adapter Tests** | 11/11 | All framework adapters verified |
| **CLI Tests** | 296 | All 14 commands with flags |
| **Salesforce Tests** | 531 | Apex, LWC, Flows, SFDX |
| **Integration Tests** | 158 | Real project scenarios |

### Test Breakdown

**Salesforce Testing (531 tests)**
- Apex Classes: 43 tests (annotations, methods, sharing modes)
- Apex Triggers: 67 tests (7 trigger events, context variables)
- LWC Components: 73 tests (JS, HTML, CSS, metadata)
- Flows: 74 tests (Screen flows, Record-triggered flows)
- Custom Objects: 147 tests (8 field types, relationships)
- SFDX Integration: 127 tests (metadata, profiles, permissions)

**CLI Testing (296 tests)**
- `init`: 33 tests (flags, errors, overwrite)
- `index`: 49 tests (thresholds, semantic flag, SQLite)
- `watch`/`context`/`summarize`/`query`: 69 tests
- `doctor`/`explore`/`map`/`adapters`: 79 tests
- `git`/`graph`/`update`/`help`: 66 tests

### Quality Metrics

- **Test Coverage**: 90%+ code coverage
- **Pass Rate**: 100% (996/996 tests passing)
- **Framework Detection**: 100% accuracy on test projects
- **Zero Regressions**: All existing tests maintain compatibility
- **Performance**: Sub-second initialization for small projects

---

## 📋 Roadmap

### Phase 1 ✅ (Completed)
- Testing infrastructure with 11 test projects

### Phase 2 ✅ (Completed)
- Code quality fixes: symbol extraction, flow name sanitization
- PHP and Ruby parser support added
- All 11 adapters now working (100% coverage)

### Phase 3 ✅ (Completed)
- Enhanced semantic indexing
- PHP and Ruby support (Laravel and Rails test projects)
- Configuration file support (`ai-first.config.json`)
- Custom rules/plugins system
- CI/CD integration templates

### Phase 4 ✅ (Completed)
- Git integration (analyze recent changes)
- Diff-aware context (what changed since last run)
- Interactive mode
- SQLite index for fast symbol queries

### Phase 5 ✅ (Completed)
- Architecture: `ai/` → `ai-context/`
- Performance: embeddings to SQLite
- Documentation: comprehensive README improvements

---

## 👥 For Contributors

```bash
# Clone
git clone https://github.com/julianperezpesce/ai-first.git
cd ai-first

# Install
npm install

# Build
npm run build

# Test
npm test

# Dev mode
npm run dev
```

See [docs/architecture.md](./docs/architecture.md) for internal architecture.

---

## 📖 Documentation

- [Architecture](./docs/architecture.md) — Internal architecture
- [Spec](./docs/spec.md) — AI context format specification

---

## ⭐ Show Your Support

Give us a ⭐ if this project helped you!

---

## 🌎 Languages

This documentation is available in:

* English (default)
* Español → [README.es.md](./README.es.md)

---

## 📄 License

MIT © [Julian Perez Pesce](https://github.com/julianperezpesce)
