# ai-first

<p align="center">
  <a href="https://github.com/julianperezpesce/ai-first/stargazers">
    <img src="https://img.shields.io/github/stars/julianperezpesce/ai-first?style=flat&color=ffd700" alt="Stars">
  </a>
  <a href="https://www.npmjs.com/package/ai-first">
    <img src="https://img.shields.io/npm/dt/ai-first?color=blue" alt="NPM Downloads">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  </a>
  <a href="https://github.com/julianperezpesce/ai-first/issues">
    <img src="https://img.shields.io/github/issues/julianperezpesce/ai-first" alt="Issues">
  </a>
</p>

> **Give your AI coding assistant superpowers.** Generate instant project context so AI agents understand your codebase in seconds, not minutes.

<!-- START FIRST 10 SECONDS VALUE -->
## ⚡ In 10 Seconds

```
$ npx ai-first init
✅ Generated ai/ai_context.md (0.3s)
✅ Generated ai/symbols.json (0.1s)  
✅ Generated ai/dependencies.json (0.1s)
✅ Generated 11 context files

🎉 Ready! Give ai/ai_context.md to your AI assistant.
```

**Result:** AI understands your project in ~500 tokens instead of 50,000.
<!-- END FIRST 10 SECONDS VALUE -->

---

---

## ⚡ Quick Start

Initialize AI-First in your repository:

```
ai-first init
```

Index the repository so AI agents can understand the codebase:

```
ai-first index
```

Generate a repository architecture map:

```
ai-first summarize
```

* `init` generates 11 context files with project metadata
* `index` creates a SQLite database for fast symbol queries
* `summarize` creates hierarchical summaries for AI navigation

---

## ❓ Why AI-First?

AI coding assistants often struggle with large repositories.

Common problems:

* limited context windows
* lack of architectural awareness
* difficulty navigating large codebases
* missing relationships between modules

AI-First solves this by creating a repository intelligence layer.

This allows AI agents to:

* understand project structure
* retrieve relevant code
* navigate large repositories
* maintain architectural context

---
## 🚀 Why ai-first?

| Before ai-first | After ai-first |
|-----------------|----------------|
| AI reads 500+ files to understand project | AI reads 1 file with full context |
| $5+ per project in API costs | ~$0.05 per project |
| 30+ seconds for AI to "warm up" | Instant understanding |
| AI misses conventions & patterns | AI knows your architecture |

---

## 📦 Installation

```bash
# Quick start (no install)
npx ai-first init

# Or install globally
npm install -g ai-first
ai-first init
```

---

## 🎯 Use Cases

### 1. AI Coding Agents (OpenCode, Cursor, Claude Code)
```bash
ai-first init
# Then ask AI: "Read ai/ai_context.md and help me add a feature"
```

### 2. Onboarding New Developers
```bash
ai-first init
# New dev reads ai/ai_context.md → understands project in 2 minutes
```

### 3. Project Documentation
```bash
ai-first init
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
$ ai-first init

You: "Read ai/ai_context.md, then add authentication"
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



---

## 📁 Generated Files

```
ai/
├── ai_context.md      # ⭐ Start here — unified overview
├── repo_map.json      # Machine-readable structure
├── symbols.json       # Extracted functions/classes with unique IDs
├── dependencies.json  # Import relationships
├── architecture.md    # Architecture pattern
├── tech_stack.md     # Languages & frameworks
├── entrypoints.md    # Entry points
├── conventions.md    # Coding conventions
├── index.db          # SQLite (with ai-first index)
│
├── graph/             # Generated by `ai-first map`
│   ├── module-graph.json   # Module-level dependency graph
│   └── symbol-graph.json   # Symbol-level relationships (calls, imports, etc.)
│
└── context/           # Generated by `ai-first init` or `map`
    ├── features/      # Auto-detected business features
    │   └── <module>.json
    └── flows/         # Business execution chains
        └── <flow>.json
├── index.db          # SQLite (with ai-first index)
│
├── graph/             # Generated by `ai-first map`
│   ├── module-graph.json   # Module-level dependency graph
│   └── symbol-graph.json   # Symbol-level relationships (calls, imports, etc.)
│
└── context/           # Generated by `ai-first context <symbol>`
    └── <symbol>.json # Code Context Packets (CCP)
```

---

## 🤖 Supported AI Agents

| Agent | How to Use |
|-------|------------|
| **OpenCode** | `~/.config/opencode/commands/ai-first.md` |
| **Cursor** | Reference `ai/ai_context.md` in prompts |
| **Claude Code** | Include context in system prompt |
| **Windsurf** | Project understanding |
| **GitHub Copilot** | Context-aware suggestions |

---

## ⚡ Quick Commands

```bash
# Generate context
ai-first init

# Generate symbol graph and context packets
ai-first map

# Generate SQLite index for fast queries
ai-first index

# Force semantic indexing (for large repos)
ai-first index --semantic

# Generate context for a specific symbol
ai-first context extractSymbols
ai-first context MyClass

# Check repository health
ai-first doctor

# Explore module dependencies
ai-first explore all
ai-first explore src

# Custom output directory
ai-first init --output ./docs/ai

# Custom root directory
ai-first init --root ./my-project
```

---

## 🩺 Doctor Command

Check repository health and AI readiness:

```bash
ai-first doctor
ai-first doctor --fix
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
ai-first explore all

# Explore specific module
ai-first explore src
```

The explore command generates a module dependency graph based on imports.
QB|---
QB|
QB|## 📦 Context Control Packs (CCP)
QB|
QB|CCP (Context Control Packs) allow you to create reusable, task-specific contexts for different AI workflows.
QB|
QB|### How It Works
QB|
QB|1. **Generate Context Modules**: `ai-first init` creates context modules in `ai/context/`
QB|2. **Create a CCP**: Define which modules to include for a specific task
QB|3. **Use in AI**: Reference the CCP when working with AI agents
QB|
QB|### CCP Commands
QB|
QB|```bash
QB|# Create a new CCP with specific context modules
QB|ai-first ccp create auth-task --include repo,auth,api --description "Authentication feature work"
QB|
QB|# List all available CCPs
QB|ai-first ccp list
QB|
QB|# Show CCP details
QB|ai-first ccp show auth-task
QB|```
QB|
QB|### CCP Structure
QB|
QB|```
QB|ai/
QB|├── context/           # Context modules (auto-generated)
QB|│   ├── repo.json      # Base repository context
QB|│   ├── auth.json      # Auth feature context
QB|│   └── <feature>.json
QB|│
QB|└── ccp/              # CCP definitions
QB|    └── <name>/
QB|        └── context.json
QB|```
QB|
QB|### Example CCP (context.json)
QB|
QB|```json
QB|{
QB|  "task": "auth-feature",
QB|  "description": "Work on authentication feature",
QB|  "includes": [
QB|    "../../context/repo.json",
QB|    "../../context/auth.json",
QB|    "../../context/api.json"
QB|  ]
QB|}
QB|```
QB|
QB|Use case: Create task-specific contexts like `"fix-bug"`, `"add-feature"`, `"refactor"`, etc.
QB|
QB|---
QB|
---

## 🔎 Semantic Index

For large repositories (>2000 files), semantic indexing is automatically enabled:

```bash
# Force semantic indexing
ai-first index --semantic
```

NP|---

## 🎯 Semantic Contexts (Features & Flows)

Semantic contexts are auto-generated business-level understanding of your codebase.

### Features

Features represent real business modules detected from your project structure.

**Quality Filters:**
- Must have ≥ 3 source files
- Must contain an entrypoint (Controller, Route, Handler, Command, Service)
- Excluded: utils, helpers, types, interfaces, constants, config, models, dto, common

```json
// ai/context/features/<module>.json
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
// ai/context/flows/<name>.json
{
  "name": "login",
  "entrypoint": "src/auth/controller.js",
  "files": ["controller.js", "service.js", "repository.js"],
  "depth": 3,
  "layers": ["api", "service", "data"]
}
```

**Generated by:** `ai-first init` or `ai-first map`
- Chunks files by function/class boundaries
- Generates embeddings for semantic search
- Supports repositories up to 100k files
- Skips binaries and large files (>1MB)

---

## 🌍 Multi-Language & Framework Support

### Languages

| Category | Languages |
|----------|-----------|
| **Web** | JavaScript, TypeScript, Python, Go, Rust |
| **Backend** | Java, C#, PHP, Ruby, Go, Rust, Kotlin |
| **Mobile** | Swift, Kotlin, Android |
| **Frontend** | Vue, Svelte, React, HTML, CSS, SCSS |
| **Testing** | Jest, Vitest, pytest, Mocha, RSpec |

### Frameworks (Tested)

| Framework | Language | Test Project |
|-----------|----------|-------------|
| **Django** | Python | `test-projects/django-app` |
| **FastAPI** | Python | `test-projects/fastapi-app` |
| **Flask** | Python | `test-projects/flask-app` |
| **Laravel** | PHP | `test-projects/laravel-app` |
| **Rails** | Ruby | `test-projects/rails-app` |
| **Spring Boot** | Java | `test-projects/spring-boot-app` |
| Express.js | JavaScript | `test-projects/express-api` |
| NestJS | TypeScript | `test-projects/nestjs-backend` |
| React | JavaScript | `test-projects/react-app` |
| Python CLI | Python | `test-projects/python-cli` |
| Salesforce DX | Apex | `test-projects/salesforce-cli` |
HM|
XZ|ai-first automatically detects and indexes Android/Kotlin projects:
HM|
RV|- **Language Detection**: Kotlin (.kt files)
- **Framework Detection**: Android (via build.gradle, AndroidManifest.xml)
- **Dependency Parsing**: Gradle dependencies (implementation, api, compile)
- **Entry Points**: Activities, Services, BroadcastReceivers from AndroidManifest.xml
- **Resources**: Indexes res/layout, res/drawable, res/values
- **Multi-module**: Detects Gradle modules from settings.gradle
HM|
XZ|### Generated Files for Android Projects
HM|
XZ|- `ai/tech_stack.md` - Shows Android framework with SDK versions
- `ai/dependencies.json` - Gradle dependencies with group:artifact:version
- `ai/entrypoints.md` - Android activities, services, permissions
- `ai/android-resources.json` - Layouts, drawables, values (if res/ exists)
- `ai/gradle-modules.json` - Multi-module structure (if settings.gradle exists)
HM|
NM|---

---

## 📋 Roadmap

### Phase 2 (In Progress)
- [ ] Enhanced semantic indexing
- [ ] Plugin system for custom analyzers

### Phase 3 (Planned)
- [x] PHP support (Laravel test project)
- [x] Ruby support (Rails test project)
- [ ] Scala support
- [ ] Configuration file support (`ai-first.config.json`)
- [ ] Custom rules/plugins system
- [ ] CI/CD integration templates

### Phase 4 (Future)
- [ ] Git integration (analyze recent changes)
- [ ] Diff-aware context (what changed since last run)
- [ ] Interactive mode
- [ ] VS Code extension

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
