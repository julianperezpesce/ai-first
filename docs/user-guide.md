# AI-First User Guide

This guide describes the main CLI commands available in AI-First.

---

## ai-first init

Initializes AI-First in the repository.

Creates configuration files and prepares the project for AI navigation.

**What it does:**
- Scans the repository
- Generates context files with project metadata
- Creates ai_context.md with unified overview

**Files created:**
- ai_context.md
- repo_map.json
- symbols.json
- dependencies.json
- architecture.md
- tech_stack.md
- entrypoints.md
- conventions.md
- ai_rules.md
- summary.md
- repo_map.md

**When to use:**
- First time setup
- When you need full project context

---

## ai-first index

Indexes the repository so AI tools can search and retrieve code efficiently.

**Processes:**
- source files
- modules
- project structure
- dependencies

**Output:**
- index.db (SQLite database)

**When to use:**
- Large codebases
- When you need fast symbol queries

---

## ai-first summarize

Generates a high-level architecture map of the repository.

**What it creates:**
- hierarchy.json with repository structure
- Folder summaries based on naming patterns
- File summaries with exports and imports

**When to use:**
- Developer onboarding
- AI agents
- Documentation

---

## ai-first context

Generates lightweight context files optimized for LLMs.

**Output:**
- repo_map.json
- symbols.json
- dependencies.json
- ai_context.md

**When to use:**
- Quick context generation
- Specific AI tasks

---

## ai-first watch

Monitors file changes and incrementally updates the index.

**Features:**
- Incremental updates
- File hash tracking
- Debounced updates

**When to use:**
- During active development
- Long-running development sessions

---

## ai-first query

Queries the SQLite index for symbols, imports, and file relationships.

**Subcommands:**
- symbol <name> - Find symbol definitions
- dependents <file> - Find dependent files
- imports <file> - Find imported files
- exports <file> - Find exports
- files - List indexed files
- stats - Show index statistics

**When to use:**
- Finding specific functions or classes
- Understanding code relationships

---

For more information, see the [README](../README.md).
