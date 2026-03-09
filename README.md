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
#RB|
#KB|---

#RR|## ⚡ Quick Start

#KB|Initialize AI-First in your repository:

#KB|```
#KB|ai-first init
#KB|```

#KB|Index the repository so AI agents can understand the codebase:

#KB|```
#KB|ai-first index
#KB|```

#KB|Generate a repository architecture map:

#KB|```
#KB|ai-first summarize
#KB|```

#KB|* `init` generates 11 context files with project metadata
#KB|* `index` creates a SQLite database for fast symbol queries
#KB|* `summarize` creates hierarchical summaries for AI navigation

#KB|---

#RR|## ❓ Why AI-First?

#KB|AI coding assistants often struggle with large repositories.

#KB|Common problems:

#KB|* limited context windows
#KB|* lack of architectural awareness
#KB|* difficulty navigating large codebases
#KB|* missing relationships between modules

#KB|AI-First solves this by creating a repository intelligence layer.

#KB|This allows AI agents to:

#KB|* understand project structure
#KB|* retrieve relevant code
#KB|* navigate large repositories
#KB|* maintain architectural context

#KB|---
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
#TH|```

#KB|### Data Flow

#KB|```
#KB|User CLI
#KB|   │
#KB|   ▼
#KB|AI-First CLI
#KB|   │
#KB|   ├── Repository Scanner
#KB|   │        │
#KB|   │        ▼
#KB|   │   File Analysis
#KB|   │
#KB|   ├── Index Engine
#KB|   │        │
#KB|   │        ▼
#KB|   │   SQLite Index
#KB|   │
#KB|   └── Architecture Mapper
#KB|            │
#KB|            ▼
#KB|     Repository Map
#KB|```

#ZX|

---

## 📁 Generated Files

```
ai/
├── ai_context.md      # ⭐ Start here — unified overview
├── repo_map.json      # Machine-readable structure
├── symbols.json       # Extracted functions/classes
├── dependencies.json  # Import relationships
├── architecture.md    # Architecture pattern
├── tech_stack.md      # Languages & frameworks
├── entrypoints.md     # Entry points
├── conventions.md     # Coding conventions
└── index.db           # SQLite (with ai-first index)
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

# Generate SQLite index for fast queries
ai-first index

# Force semantic indexing (for large repos)
ai-first index --semantic

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

---

## 🔎 Semantic Index

For large repositories (>2000 files), semantic indexing is automatically enabled:

```bash
# Force semantic indexing
ai-first index --semantic
```

Semantic indexing:
- Chunks files by function/class boundaries
- Generates embeddings for semantic search
- Supports repositories up to 100k files
- Skips binaries and large files (>1MB)

---

## 🌍 Multi-Language Support

| Category | Languages |
|----------|-----------|
| **Web** | JavaScript, TypeScript, Python, Go, Rust |
| **Backend** | Java, C#, PHP, Ruby, Go, Rust, Kotlin |
| **Mobile** | Swift, Kotlin |
| **Frontend** | Vue, Svelte, React, HTML, CSS, SCSS |
| **Testing** | Jest, Vitest, pytest, Mocha, RSpec |

---

## 📋 Roadmap

### v1.1 (Coming Soon)
- [ ] Watch mode for auto-regeneration
- [ ] Git integration (analyze recent changes)

### v1.2 (Planned)
- [ ] LSP integration for richer symbols
- [ ] Custom analyzer plugins

### v2.0 (Future)
- [ ] Multi-repo analysis
- [ ] IDE extensions (VS Code, JetBrains)
- [ ] CI/CD integration

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

#PN|---

#RR|## 🌎 Languages

#KB|This documentation is available in:

#KB|* English (default)
#KB|* Español → [README.es.md](./README.es.md)

#KB|---

## 📄 License

MIT © [Julian Perez Pesce](https://github.com/julianperezpesce)
