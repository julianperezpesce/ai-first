[English](./README.md) | [Español](./README.es.md)

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

#WK|---

#HM|## ⚡ Quick Start

#HV|Get up and running in less than a minute:

#HV|```bash
#HV|# 1. Initialize AI-First in your repository
#HV|npx ai-first init
#HV|
#HV|# 2. Generate SQLite index for fast queries (recommended)
#HV|npx ai-first index
#HV|
#HV|# 3. Start watching for changes (optional, for development)
#HV|npx ai-first watch
#HV|
#HV|# 4. Query symbols when needed
#HV|npx ai-first query symbol MyClass
#HV|```

#HV|**What each step does:**
#HV|- `init` — Generates 11 context files including ai_context.md, symbols.json, and more
#HV|- `index` — Creates a searchable SQLite database for fast code lookups
#HV|- `watch` — Monitors file changes and incrementally updates the index
#HV|- `query` — Lets you search for symbols, imports, and file relationships

#HV|That's it! Your repository is now AI-ready. Give `ai/ai_context.md` to your AI assistant.

#HV|---

#RR|## 🚀 Why ai-first?

#KB|AI coding assistants often struggle with large repositories.

#KB|Typical problems include:

#KB|* **Limited context windows** — Can't process entire codebases
#KB|* **Lack of architectural awareness** — Misses project structure and patterns
#KB|* **Difficulty navigating** — Can't find relevant code efficiently
#KB|* **Missing relationships** — Doesn't understand module dependencies

#KB|AI-First solves this by building a **repository intelligence layer**.

#KB|It creates structured metadata that allows AI agents to:

#KB|* Understand project structure at a glance
#KB|* Retrieve relevant code instantly
#KB|* Navigate large repositories efficiently
#KB|* Maintain architectural context across conversations

#KB|---

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
├── ai_rules.md        # AI-specific guidelines
└── hierarchy.json     # Hierarchical repo summary (from summarize)
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

# Custom output directory
ai-first init --output ./docs/ai

# Custom root directory
ai-first init --root ./my-project
```

---

## 📖 User Guide

### Command Overview

ai-first provides 6 commands to generate AI context for your repository:

#### 1. `init` — Generate Full Context (Default)
```bash
ai-first init [options]

# Or simply:
ai-first
```

**Description:** Generates all AI context files at once. This is the recommended starting point.

**Options:**
- `-r, --root <dir>` — Root directory (default: current directory)
- `-o, --output <dir>` — Output directory (default: ./ai)
- `-h, --help` — Show help

**Output:** Creates 11 files including ai_context.md, symbols.json, dependencies.json, architecture.md, and more.

---

#### 2. `index` — Generate SQLite Index
```bash
ai-first index [options]
```

**Description:** Creates a SQLite database for fast symbol queries. Essential for large codebases.

**Options:**
- `-r, --root <dir>` — Root directory (default: current directory)
- `-o, --output <path>` — Output path (default: ./ai/index.db)
- `-h, --help` — Show help

**Output:** index.db — SQLite database with files, symbols, imports, and hashes tables.

---

#### 3. `watch` — Incremental Indexing
```bash
ai-first watch [options]
```

**Description:** Watches for file changes and incrementally updates the index. Perfect for development.

**Options:**
- `-r, --root <dir>` — Root directory (default: current directory)
- `-o, --output <path>` — Output path (default: ./ai/index.db)
- `-d, --debounce <ms>` — Debounce delay (default: 300ms)
- `-h, --help` — Show help

**Features:**
- Incremental updates (only changed files are re-indexed)
- File hash tracking for change detection
- Debounced updates to handle rapid file changes
- Press Ctrl+C to stop watching

---

#### 4. `context` — LLM-Optimized Context
```bash
ai-first context [options]
```

**Description:** Generates lightweight context files optimized for LLMs. Faster than init.

**Options:**
- `-r, --root <dir>` — Root directory (default: current directory)
- `-o, --output <dir>` — Output directory (default: ./ai)
- `-h, --help` — Show help

**Output:** repo_map.json, symbols.json, dependencies.json, ai_context.md

---

#### 5. `summarize` — Hierarchical Summaries
```bash
ai-first summarize [options]
```

**Description:** Generates hierarchical repository summaries optimized for AI navigation.

**Options:**
- `-r, --root <dir>` — Root directory (default: current directory)
- `-o, --output <path>` — Output path (default: ./ai/hierarchy.json)
- `-h, --help` — Show help

**Output:** hierarchy.json with:
- Repository summary (name, description, purpose)
- Folder summaries (purpose based on naming patterns)
- File summaries (exports, imports, key classes/functions)

---

#### 6. `query` — Query the Index
```bash
ai-first query <subcommand> [options]
```

**Description:** Query the SQLite index for symbols, imports, and file relationships.

**Subcommands:**
- `symbol <name>` — Find symbol definitions by name
- `dependents <file>` — Find files that depend on a file
- `imports <file>` — Find files imported by a file
- `exports <file>` — Find exports in a file
- `files` — List all indexed files
- `stats` — Show index statistics

**Options:**
- `-r, --root <dir>` — Root directory (default: current directory)
- `-d, --db <path>` — Database path (default: ./ai/index.db)

**Examples:**
```bash
# Find all functions named "handleSubmit"
ai-first query symbol handleSubmit

# Find files that depend on auth.ts
ai-first query dependents auth.ts

# Show index statistics
ai-first query stats
```

---

### Quick Start

```bash
# 1. Generate full context (recommended first time)
npx ai-first init

# 2. Create SQLite index for fast queries
npx ai-first index

# 3. Start watching for changes (optional, for development)
npx ai-first watch

# 4. Query symbols when needed
npx ai-first query symbol MyClass
```

#TM|---

#RR|## 🌎 Languages

#KB|This documentation is available in:

#KB|* **English** (default) — [README.md](./README.md)
#KB|* **Español** — [README.es.md](./README.es.md)

#KB|For more details, see the [User Guide](./docs/user-guide.md).

#KB|---

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

---

## 📄 License

MIT © [Julian Perez Pesce](https://github.com/julianperezpesce)
