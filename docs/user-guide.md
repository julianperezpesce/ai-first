# AI-First User Guide

This guide describes the main CLI commands available in AI-First.

AI-First provides 6 commands to generate AI context for your repository. Each command serves a specific purpose.

---

## ai-first init

Initializes AI-First in the repository and generates all context files.

```bash
ai-first init [options]

# Or simply:
ai-first
```

**What it does:**
- Scans the entire repository
- Generates 11 context files with project metadata
- Creates a unified AI context document

**Options:**
- `-r, --root <dir>` — Root directory (default: current directory)
- `-o, --output <dir>` — Output directory (default: ./ai)
- `-h, --help` — Show help

**When to use:**
- First time setup
- When you need full project context
- Before starting work with an AI coding assistant

**Output files:**
- `ai_context.md` — Unified overview (start here)
- `repo_map.json` — Machine-readable structure
- `symbols.json` — Extracted functions/classes
- `dependencies.json` — Import relationships
- `architecture.md` — Architecture pattern
- `tech_stack.md` — Languages & frameworks
- `entrypoints.md` — Entry points
- `conventions.md` — Coding conventions
- `ai_rules.md` — AI-specific guidelines

---

## ai-first index

Creates a SQLite database for fast symbol queries.

```bash
ai-first index [options]
```

**What it does:**
- Indexes all source files
- Extracts symbols (functions, classes, variables)
- Analyzes import relationships
- Stores everything in a SQLite database

**Options:**
- `-r, --root <dir>` — Root directory (default: current directory)
- `-o, --output <path>` — Output path (default: ./ai/index.db)
- `-h, --help` — Show help

**When to use:**
- Large codebases where you need fast lookups
- When you want to query symbols programmatically
- As a foundation for the `watch` command

**Output:**
- `index.db` — SQLite database with tables for files, symbols, imports, and hashes

---

## ai-first watch

Monitors file changes and incrementally updates the index.

```bash
ai-first watch [options]
```

**What it does:**
- Watches for file system changes
- Incrementally updates only changed files
- Maintains a live index during development

**Options:**
- `-r, --root <dir>` — Root directory (default: current directory)
- `-o, --output <path>` — Output path (default: ./ai/index.db)
- `-d, --debounce <ms>` — Debounce delay (default: 300ms)
- `-h, --help` — Show help

**When to use:**
- During active development
- When you want always-up-to-date context
- Long-running development sessions

**Features:**
- Incremental updates (only changed files are re-indexed)
- File hash tracking for change detection
- Debounced updates to handle rapid file changes
- Press Ctrl+C to stop watching

---

## ai-first context

Generates lightweight context files optimized for LLMs.

```bash
ai-first context [options]
```

**What it does:**
- Creates a focused subset of context files
- Optimized for language model consumption
- Faster than full `init` command

**Options:**
- `-r, --root <dir>` — Root directory (default: current directory)
- `-o, --output <dir>` — Output directory (default: ./ai)
- `-h, --help` — Show help

**When to use:**
- When you need quick, lightweight context
- For specific AI tasks
- When you don't need the full analysis

**Output:**
- `repo_map.json` — Folder structure
- `symbols.json` — Exported symbols
- `dependencies.json` — Import graph
- `ai_context.md` — LLM-optimized summary

---

## ai-first summarize

Generates hierarchical repository summaries optimized for AI navigation.

```bash
ai-first summarize [options]
```

**What it does:**
- Analyzes repository structure
- Creates hierarchical summaries
- Generates navigation-focused metadata

**Options:**
- `-r, --root <dir>` — Root directory (default: current directory)
- `-o, --output <path>` — Output path (default: ./ai/hierarchy.json)
- `-h, --help` — Show help

**When to use:**
- When you need a high-level overview
- For AI agents that navigate codebases
- Understanding large project structure

**Output:**
- `hierarchy.json` containing:
  - Repository summary (name, description, purpose)
  - Folder summaries (purpose based on naming patterns)
  - File summaries (exports, imports, key classes/functions)

---

## ai-first query

Queries the SQLite index for symbols, imports, and file relationships.

```bash
ai-first query <subcommand> [options]
```

**What it does:**
- Searches indexed symbols
- Finds file dependencies
- Displays repository statistics

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

# Find imports in a file
ai-first query imports utils.ts

# Show index statistics
ai-first query stats
```

**When to use:**
- Finding specific functions or classes
- Understanding code relationships
- Exploring unfamiliar codebases

---

## Quick Reference

| Command | Purpose | Output |
|---------|---------|--------|
| `init` | Full context generation | 11 files |
| `index` | SQLite database | index.db |
| `watch` | Live updates | index.db (live) |
| `context` | Lightweight context | 4 files |
| `summarize` | Hierarchy overview | hierarchy.json |
| `query` | Search index | Terminal output |

---

## Next Steps

1. Run `ai-first init` to generate initial context
2. Run `ai-first index` for fast queries
3. Use `ai-first query` to explore your codebase
4. Give `ai/ai_context.md` to your AI assistant

For more information, see the [README](../README.md).
