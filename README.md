# ai-first

> CLI tool that prepares any repository to be used effectively by AI coding agents

`ai-first` scans your repository and generates a structured AI context layer, so AI assistants can understand your project quickly without reading the entire codebase.

---

## Problem

When you give an AI access to your code, it often has to read thousands of files to understand the project. This is:

- **Slow** — AI spends valuable tokens reading files
- **Expensive** — More context = higher API costs
- **Incomplete** — AI misses important context and conventions

## Solution

**ai-first** generates structured documentation that tells AI agents:

- What languages and frameworks you use
- How your project is organized
- Where the entry points are
- What coding conventions you follow

---

## Quickstart

```bash
# Run with npx (no installation)
npx ai-first init

# Or install globally
npm install -g ai-first
ai-first init
```

This creates an `ai/` folder with all context files.

---

## Example Output

Running `ai-first init` generates these files in `ai/`:

```
ai/
├── ai_context.md      # Unified context (start here!)
├── repo_map.md        # Repository structure (human-readable)
├── repo_map.json      # Repository structure (machine-readable)
├── summary.md         # Files by type and directory
├── architecture.md    # Architecture pattern analysis
├── tech_stack.md      # Languages & frameworks detected
├── entrypoints.md     # Entry points (CLI, API, server)
├── conventions.md     # Coding conventions
├── symbols.json       # Functions, classes, interfaces
├── dependencies.json # Import dependencies
├── ai_rules.md        # Guidelines for AI assistants
└── index.db           # SQLite database (with ai-first index)
```

### Sample `ai_context.md`

```markdown
# AI Context

> Repository context for AI assistants. Generated automatically.

---

## Quick Overview

- **Pattern**: MVC (Model-View-Controller)
- **Languages**: TypeScript, JavaScript
- **Frameworks**: React, Express.js
- **Total Files**: 156

---

## Tech Stack

**Languages**: TypeScript, JavaScript
**Frameworks**: React, Express.js

---

## Architecture

### Primary: MVC (Model-View-Controller)

### Key Modules

| Module | Responsibility |
|--------|----------------|
| `src/controllers` | Request handling |
| `src/services` | Business logic |
| `src/models` | Data models |

---

## Key Entrypoints

### Server
- `src/index.ts` - Main entry point
- `src/server.ts` - Server

### CLI
- `src/cli.ts` - CLI entry point

---

## Notes for AI Assistants

1. Follow the established naming conventions
2. Use the detected frameworks and libraries
3. Target the correct entrypoints for modifications
4. Maintain the detected architecture patterns
```

---

## Supported AI Agents

ai-first works with any AI coding assistant:

| Agent | Integration |
|-------|-------------|
| **OpenCode** | Use `ai/ai_context.md` as context |
| **Cursor** | Reference context files before prompts |
| **Claude Code** | Include context in prompts |
| **GitHub Copilot** | Context-aware suggestions |
| **Windsurf** | Project understanding |

### OpenCode Integration

Create `~/.config/opencode/commands/ai-first.md`:

```markdown
---
description: Generate AI context for the repository
agent: sisyphus
---

Run `ai-first init` in the current directory to generate AI context files.
```

---

## Architecture Overview

ai-first uses a modular analyzer architecture:

```
src/
├── commands/           # CLI entry point
│   └── ai-first.ts     # Main command handler
├── analyzers/          # Individual analyzers
│   ├── architecture.ts # Pattern detection
│   ├── techStack.ts    # Language/framework detection
│   ├── entrypoints.ts  # Entry point discovery
│   ├── conventions.ts  # Convention detection
│   ├── symbols.ts      # Function/class extraction
│   ├── dependencies.ts # Import analysis
│   └── aiRules.ts      # AI guidelines
├── core/               # Core processing
│   ├── repoScanner.ts  # File discovery
│   ├── repoMapper.ts   # Structure mapping
│   ├── indexer.ts     # SQLite indexing
│   └── contextGenerator.ts
└── utils/             # Utilities
    └── fileUtils.ts
```

### How It Works

1. **Scan** — Discover all files in the repository
2. **Analyze** — Run specialized analyzers on each file
3. **Generate** — Output structured context files

Each analyzer is independent and produces a specific output file.

---

## SQLite Index (Optional)

For fast queries, generate an SQLite database:

```bash
ai-first index
```

This creates `ai/index.db` with:

| Table | Description |
|-------|-------------|
| `files` | All source files with language |
| `symbols` | Functions, classes, interfaces, exports |
| `imports` | Import/require statements |

### Example Queries

```sql
-- Find all functions in a file
SELECT s.name, s.line 
FROM symbols s
JOIN files f ON s.file_id = f.id
WHERE f.path = 'src/index.ts' AND s.type = 'function'

-- Find where a symbol is defined
SELECT f.path, s.line, s.type
FROM symbols s
JOIN files f ON s.file_id = f.id
WHERE s.name = 'MyClass'

-- Find all files importing a module
SELECT f.path, i.type
FROM imports i
JOIN files f ON i.source_file_id = f.id
WHERE i.target_file LIKE '%utils%'
```

---

## The `/ai` Folder

After running `ai-first init`, the `ai/` folder contains all generated context:

| File | Purpose |
|------|---------|
| `ai_context.md` | **Start here** — unified overview |
| `repo_map.json` | Machine-readable file structure |
| `symbols.json` | Extracted functions/classes/interfaces |
| `dependencies.json` | Import relationships between files |
| `ai_context.md` | Combined context for AI agents |

### repo_map.json Structure

```json
{
  "generated": "2026-03-08T12:00:00Z",
  "total": 42,
  "files": [
    {
      "path": "src/index.ts",
      "type": "file",
      "extension": ".ts"
    }
  ],
  "directories": [
    {
      "path": "src",
      "type": "directory"
    }
  ]
}
```

### symbols.json Structure

```json
{
  "generated": "2026-03-08T12:00:00Z",
  "total": 77,
  "symbols": [
    {
      "name": "MyClass",
      "type": "class",
      "file": "src/index.ts",
      "line": 10,
      "exportType": "export"
    }
  ]
}
```

### dependencies.json Structure

```json
{
  "generated": "2026-03-08T12:00:00Z",
  "total": 59,
  "dependencies": [
    {
      "source": "src/analyzers/aiRules.ts",
      "target": "../core/repoScanner.js",
      "type": "import"
    }
  ]
}
```

---

## Features

### Deterministic Analysis
- No AI/LLM required — works offline
- Consistent results every time
- Fast execution

### Multi-Language Support
Detects projects in:
- **JavaScript/TypeScript**: .ts, .tsx, .js, .jsx, .mjs, .cjs
- **Python**: .py
- **Go**: .go
- **Rust**: .rs
- **Ruby**: .rb
- **PHP**: .php
- **Java**: .java
- **C#**: .cs
- **Kotlin**: .kt
- **Scala**: .scala
- **Swift**: .swift
- **Web**: Vue, Svelte, HTML, CSS, SCSS

### Smart Detection
- **Architecture patterns**: MVC, Clean Architecture, Hexagonal, Microservices, Monorepo, SPA
- **Frameworks**: React, Vue, Next.js, Django, Express, FastAPI, Spring, Rails
- **Testing**: Jest, Vitest, pytest, Mocha, RSpec
- **Linters/Formatters**: ESLint, Prettier, Pylint, RuboCop

---

## Roadmap

- [ ] Language-server protocol (LSP) integration for richer symbol data
- [ ] Watch mode for auto-regeneration on file changes
- [ ] Custom analyzer plugin system
- [ ] Git integration (analyze commits, PRs)
- [ ] Multi-repo analysis
- [ ] IDE extensions (VS Code, JetBrains)

---

## License

MIT
