# ai-first

> CLI tool that prepares any repository to be used effectively by AI coding agents (OpenCode, Cursor, Claude Code, etc.)

`ai-first` scans your repository and generates a structured AI context layer, so AI assistants can understand your project quickly without reading the entire codebase.

## Why?

When you give an AI access to your code, it often has to read thousands of files to understand the project. This is slow, expensive, and sometimes the AI misses important context.

**ai-first solves this** by generating structured documentation that tells AI agents:

- What languages and frameworks you use
- How your project is organized
- Where the entry points are
- What coding conventions you follow

## Installation

### Quick Start (npx)
```bash
npx ai-first init
```

### Global Installation
```bash
npm install -g ai-first
ai-first init
```

### Local Installation
```bash
npm install ai-first
npx ai-first init
```

## Usage

### Basic Usage
```bash
ai-first init
```

This creates an `ai/` folder with all the context files.

### Generate SQLite Index
```bash
ai-first index
```

This creates an `ai/index.db` SQLite database for fast queries.

### Options
```bash
ai-first --help

Options:
  -r, --root <dir>      Root directory to scan (default: current directory)
  -o, --output <dir>   Output directory (default: ./ai)
  -h, --help           Show help message
```

## Output

The tool generates the following files in an `ai/` directory:

```
ai/
├── ai_context.md      # Unified context for AI agents (most important!)
├── repo_map.md        # Repository structure (human-readable)
├── repo_map.json      # Repository structure (machine-readable)
├── summary.md         # Summary by file type and directory
├── architecture.md    # Architecture pattern analysis
├── tech_stack.md     # Languages, frameworks, libraries detected
├── entrypoints.md    # Entry points (CLI, API, server)
├── conventions.md    # Coding conventions detected
├── symbols.json      # Functions, classes, interfaces extracted
├── dependencies.json # Import/require dependencies between files
├── ai_rules.md      # Guidelines for AI assistants
└── index.db         # SQLite database for fast queries
```

### ai_context.md Example

```markdown
# AI Context

> This file provides a comprehensive overview of the repository for AI coding assistants.

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

**Package Managers**: npm

---

## Architecture

## Architectural Pattern
**Primary**: MVC (Model-View-Controller)

## Key Modules
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

## Features

### ✅ Deterministic Analysis
- No AI/LLM required - works offline
- Consistent results every time
- Fast execution

### 🌍 Multi-Language Support
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
- **Salesforce Apex**: .cls
- **Web**: Vue (.vue), Svelte (.svelte), HTML, CSS, SCSS, Less

### 🔍 Smart Detection
- **Architecture patterns**: MVC, Clean Architecture, Hexagonal, Microservices, Monorepo, SPA
- **Frameworks**: React, Vue, Next.js, Django, Express, FastAPI, Spring, Rails, etc.
- **Testing**: Jest, Vitest, pytest, Mocha, RSpec, etc.
- **Linters/Formatters**: ESLint, Prettier, Pylint, RuboCop, etc.

### 🎯 Entry Point Discovery
Automatically finds:
- CLI commands
- API servers
- Background workers
- Client entry points
- Library exports

## Use Cases

### 1. OpenCode / Cursor / Claude Code
Give the AI context before asking questions:
```bash
ai-first init
# Then ask AI to read ai/ai_context.md
```

### 2. Onboarding New Developers
```bash
ai-first init
# New developer reads ai/ai_context.md to understand the project
```

### 3. Project Documentation
```bash
ai-first init
# Generate current state documentation automatically
```

## SQLite Index

For fast queries, generate an SQLite database:

```bash
ai-first index
```

This creates `ai/index.db` with the following tables:

### Tables

| Table | Description |
|-------|-------------|
| `files` | All source files with language |
| `symbols` | Functions, classes, interfaces, exports |
| `imports` | Import/require statements between files |

### Supported Languages (Index)
The indexer extracts symbols and imports from:
- JavaScript/TypeScript, Python, Go, Rust
- Java, C#, Ruby, PHP, Swift, Kotlin, Scala
- Salesforce Apex (.cls)

### Example Queries

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

-- Find all exported symbols
SELECT s.name, s.type, f.path
FROM symbols s
JOIN files f ON s.file_id = f.id
WHERE s.exported = 1

-- Search symbols by pattern
SELECT s.name, s.type, f.path, s.line
FROM symbols s
JOIN files f ON s.file_id = f.id
WHERE s.name LIKE '%Handler%'
LIMIT 50

-- Get language statistics
SELECT language, COUNT(*) as count
FROM files
GROUP BY language
ORDER BY count DESC
```

## Comparison

## Configuration

### Custom Output Directory
```bash
ai-first init --output ./docs/ai
```

### Custom Root Directory
```bash
ai-first init --root ./my-project
```

## Integrations

### OpenCode
Create `~/.config/opencode/commands/ai-first.md`:
```markdown
---
description: Generate AI context for the repository
agent: sisyphus
---

Run `ai-first init` in the current directory to generate AI context files.

Then confirm which files were created.
```

### VS Code
Add to `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Generate AI Context",
      "type": "shell",
      "command": "npx ai-first init",
      "problemMatcher": []
    }
  ]
}
```

## License

MIT

## Author

Created for AI-assisted development.
