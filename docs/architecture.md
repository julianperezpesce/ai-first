# Architecture

This document explains the internal architecture of ai-first.

## Overview

ai-first is a CLI tool that analyzes repositories and generates structured AI context files. It follows a **modular analyzer pattern** where each analyzer is independent and produces a specific output.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ai-first CLI                          │
│                  (src/commands/)                         │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│    Scanners   │  │   Analyzers   │  │   Generators  │
│  (src/core/)  │  │ (src/analyzers)│ │   (src/core/) │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ File Discovery │  │ Code Analysis │  │ File Output   │
│ & Filtering    │  │ & Extraction  │  │ (ai/ folder)  │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Module Structure

```
src/
├── commands/           # CLI interface
│   └── ai-first.ts    # Main command handler
│
├── analyzers/          # Code analysis modules
│   ├── architecture.ts # Pattern detection
│   ├── techStack.ts   # Language/framework detection
│   ├── entrypoints.ts # Entry point discovery
│   ├── conventions.ts # Convention detection
│   ├── symbols.ts     # Symbol extraction
│   ├── dependencies.ts# Import analysis
│   └── aiRules.ts    # AI guidelines
│
├── core/              # Core processing
│   ├── repoScanner.ts # File discovery
│   ├── repoMapper.ts  # Structure mapping
│   ├── indexer.ts    # SQLite indexing
│   ├── contextGenerator.ts
│   └── aiContextGenerator.ts
│
└── utils/             # Shared utilities
    └── fileUtils.ts   # File I/O operations
```

## Core Components

### 1. Repo Scanner (`src/core/repoScanner.ts`)

Responsible for discovering and filtering files in the repository.

**Responsibilities:**
- Recursively scan directories
- Filter by include/exclude patterns
- Group files by extension and directory
- Return `FileInfo[]` with metadata

```typescript
interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  modified: Date;
}

interface ScanResult {
  files: FileInfo[];
  totalFiles: number;
  byExtension: Record<string, number>;
  byDirectory: Record<string, number>;
}
```

### 2. Analyzers (`src/analyzers/`)

Each analyzer is an independent module that performs specific analysis:

| Analyzer | Output | Analysis |
|----------|--------|----------|
| `techStack.ts` | `tech_stack.md` | Languages, frameworks, package managers |
| `architecture.ts` | `architecture.md` | MVC, Clean Architecture, patterns |
| `entrypoints.ts` | `entrypoints.md` | CLI, API servers, workers |
| `conventions.ts` | `conventions.md` | Naming, testing, git conventions |
| `symbols.ts` | `symbols.json` | Functions, classes, interfaces |
| `dependencies.ts` | `dependencies.json` | Import relationships |
| `aiRules.ts` | `ai_rules.md` | AI-specific guidelines |

**Analyzer Interface:**

```typescript
interface Analyzer<T> {
  analyze(scanResult: ScanResult): Promise<T>;
  generateOutput(data: T): string;
}
```

### 3. Repository Mapper (`src/core/repoMapper.ts`)

Generates structural representations of the repository.

**Outputs:**
- `repo_map.md` — Human-readable tree view
- `repo_map.json` — Machine-readable structure
- `summary.md` — Statistics by file type/directory

### 4. Indexer (`src/core/indexer.ts`)

Creates an SQLite database for fast queries.

**Database Schema:**

```sql
CREATE TABLE files (
  id INTEGER PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  extension TEXT,
  language TEXT,
  size INTEGER,
  modified INTEGER
);

CREATE TABLE symbols (
  id INTEGER PRIMARY KEY,
  file_id INTEGER REFERENCES files(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  line INTEGER,
  exported INTEGER DEFAULT 0
);

CREATE TABLE imports (
  id INTEGER PRIMARY KEY,
  source_file_id INTEGER REFERENCES files(id),
  target_file TEXT,
  target_module TEXT,
  type TEXT
);
```

## Data Flow

```
1. User runs: ai-first init

2. CLI (commands/ai-first.ts)
   └─> Calls: runAIFirst(options)

3. RepoScanner.scanRepo(rootDir)
   └─> Returns: ScanResult (all files)

4. Parallel Analyzers:
   ├─> TechStackAnalyzer.analyze()
   ├─> ArchitectureAnalyzer.analyze()
   ├─> EntrypointAnalyzer.analyze()
   ├─> ConventionAnalyzer.analyze()
   ├─> SymbolAnalyzer.analyze()
   ├─> DependencyAnalyzer.analyze()
   └─> AIRulesAnalyzer.analyze()

5. RepoMapper generates:
   ├─> repo_map.md
   ├─> repo_map.json
   └─> summary.md

6. ContextGenerator combines all:
   └─> ai_context.md

7. Output to: ai/ folder
```

## Design Principles

### 1. Analyzer Independence

Each analyzer runs independently:
- No shared state between analyzers
- Can run in parallel
- Easy to add new analyzers

### 2. Deterministic Output

- No randomness in analysis
- Same input = same output
- Works offline (no external APIs)

### 3. Extensibility

To add a new analyzer:
1. Create `src/analyzers/newAnalyzer.ts`
2. Implement `analyze()` and `generateOutput()`
3. Register in `src/commands/ai-first.ts`

### 4. Separation of Concerns

- **Scanning** — What files exist
- **Analysis** — What the files contain
- **Generation** — How to represent the data
- **Output** — Writing to disk

## Dependencies

### Runtime
- `chokidar` — File watching for watch mode
- `sql.js` — SQLite in JavaScript (WASM)

### Development
- `typescript` — Type safety
- `@types/node` — Node.js types

## Future Architecture Considerations

- **Plugin System**: Allow custom analyzers
- **LSP Integration**: Use language servers for richer analysis
- **Incremental Updates**: Only re-analyze changed files
- **Multi-Repo**: Analyze related repositories together
