# Architecture

AI-First is designed as a modular pipeline that transforms your codebase into structured intelligence.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI-First CLI                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. scanRepo(rootDir)                                       │
│     - Recursively scan directory                             │
│     - Filter by includeExtensions                            │
│     - Return: FileInfo[]                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Create output directory (default: ./ai)                 │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────────┐ ┌───────────┐ ┌─────────────┐
    │  repoMapper     │ │techStack  │ │architecture │
    │ - repo_map.md   │ │ - tech_   │ │ - architec  │
    │ - repo_map.json │ │   stack   │ │   ture.md   │
    │ - summary.md    │ │    .md    │ │             │
    └─────────────────┘ └───────────┘ └─────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Analyzers Pipeline                                     │
│     ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐│
│     │entrypoints  │ │conventions   │ │symbols          ││
│     │.md          │ │.md           │ │.json            ││
│     └──────────────┘ └──────────────┘ └──────────────────┘│
│     ┌──────────────────┐ ┌──────────────┐                   │
│     │dependencies     │ │ai_rules      │                   │
│     │.json            │ │.md           │                   │
│     └──────────────────┘ └──────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. generateUnifiedContext()                               │
│     - Combines all analysis into ai_context.md              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Output Files                                           │
│   ai/                                                       │
│   ├── ai_context.md      ← UNIFIED (most important!)       │
│   ├── repo_map.md                                        │
│   ├── repo_map.json     ← NEW                              │
│   ├── summary.md                                        │
│   ├── architecture.md                                    │
│   ├── tech_stack.md                                      │
│   ├── entrypoints.md                                     │
│   ├── conventions.md                                     │
│   ├── symbols.json       ← NEW                            │
│   ├── dependencies.json  ← NEW                            │
│   ├── index.db           ← SQLite index                   │
│   └── ai_rules.md       ← NEW                             │
└─────────────────────────────────────────────────────────────┘
```

## Core Modules

### File Scanner (`src/core/repoScanner.ts`)
- Recursively scans directory
- Filters by file extension
- Returns file metadata (path, size, lines)

### Indexer (`src/core/indexer.ts`)
- Creates SQLite database
- Indexes symbols (functions, classes, interfaces)
- Enables fast queries

### Analyzers (`src/analyzers/`)
- **repoMapper**: Directory structure
- **techStack**: Languages & frameworks
- **architecture**: Pattern detection
- **entrypoints**: CLI/API entry points
- **conventions**: Coding conventions
- **symbols**: Function/class extraction
- **dependencies**: Import analysis

### Context Generator (`src/core/contextGenerator.ts`)
- Combines all analysis
- Creates unified `ai_context.md`

## Data Flow

1. User runs `ai-first init`
2. CLI parses arguments
3. `scanRepo()` discovers files
4. Each analyzer processes files
5. `generateUnifiedContext()` combines results
6. Output files written to `ai/` directory

## Extensibility

AI-First is designed to be extensible:

- Add new analyzers in `src/analyzers/`
- Custom rules in `ai_rules.md`
- Configuration file support (planned)
