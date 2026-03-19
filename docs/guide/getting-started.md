# Getting Started

AI-First is a CLI tool that prepares any repository to be used effectively by AI coding agents. It generates instant context so AI agents understand your codebase in seconds, not minutes.

## Why AI-First?

AI coding assistants often struggle with large repositories due to:

- **Limited context windows** - Can't read all files
- **Lack of architectural awareness** - Don't understand project structure
- **Difficulty navigating** - Can't find relevant code
- **Missing relationships** - Don't understand module dependencies

AI-First solves this by creating a **repository intelligence layer** that provides:

- Project structure and architecture
- Extracted symbols (functions, classes, interfaces)
- Dependency graph
- Coding conventions
- Entry points

## Quick Start

```bash
# Install globally (recommended)
npm install -g ai-first

# Or run without install
npx ai-first init
```

## Generate Context

```bash
# Initialize AI-First in your repository
ai-first init

# This generates:
# - ai-context/ai_context.md      # Unified context (start here!)
# - ai-context/repo_map.json      # Machine-readable structure
# - ai-context/symbols.json       # Extracted functions/classes
# - ai-context/dependencies.json   # Import relationships
# - ai-context/architecture.md    # Architecture pattern
# - ai-context/tech_stack.md      # Languages & frameworks
```

## Index for Fast Queries

```bash
# Create SQLite index for fast symbol queries
ai-first index

# For large repos, enable semantic search
ai-first index --semantic
```

## Use with AI Agents

After running `ai-first init`, give the AI agent the `ai-context/ai_context.md` file. It contains:

- Project overview
- Architecture pattern
- Tech stack
- Entry points
- Key conventions

## Supported AI Agents

| Agent | How to Use |
|-------|------------|
| **OpenCode** | `~/.config/opencode/commands/ai-first.md` |
| **Cursor** | Reference `ai-context/ai_context.md` in prompts |
| **Claude Code** | Include context in system prompt |
| **Windsurf** | Project understanding |
| **GitHub Copilot** | Context-aware suggestions |

## Next Steps

- [Installation Guide](/guide/installation) - More installation options
- [Quick Start Tutorial](/guide/quick-start) - Step-by-step walkthrough
- [Architecture](/guide/architecture) - How AI-First works
- [Examples](/examples/) - Real-world usage examples
