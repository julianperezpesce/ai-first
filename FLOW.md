# Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        ai-first CLI                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. scanRepo(rootDir)                                       │
│     - Recursively scan directory                            │
│     - Filter by includeExtensions                           │
│     - Return: FileInfo[]                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Create output directory (default: ./ai)                │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────────┐ ┌───────────┐ ┌─────────────┐
    │ 3a. repoMapper  │ │3b. techStack│ │3c. architecture│
    │ - repo_map.md   │ │ - tech_stack│ │ - architecture│
    │ - repo_map.json │ │    .md     │ │    .md       │
    │ - summary.md    │ │             │ │               │
    └─────────────────┘ └─────────────┘ └─────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │ 4. Analyzers Pipeline                                   │
    │ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │
    │ │entrypoints   │ │conventions   │ │symbols (NEW)    │  │
    │ │.md           │ │.md           │ │.json (NEW)      │  │
    └──────────────┘ └──────────────┘ └──────────────────┘  │
    ┌──────────────────┐ ┌──────────────┐                    │
    │dependencies (NEW)│ │ai_rules (NEW)│                    │
    │.json             │ │.md           │                    │
    └──────────────────┘ └──────────────┘                    │
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │ 5. generateUnifiedContext()                             │
    │    - Combines all analysis into ai_context.md           │
    └─────────────────────────────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │ 6. Output Files                                          │
    │   ai/                                                    │
    │   ├── ai_context.md      ← UNIFIED (most important!)    │
    │   ├── repo_map.md                                        │
    │   ├── repo_map.json     ← NEW                            │
    │   ├── summary.md                                        │
    │   ├── architecture.md                                    │
    │   ├── tech_stack.md                                      │
    │   ├── entrypoints.md                                     │
    │   ├── conventions.md                                     │
    │   ├── symbols.json       ← NEW                           │
    │   ├── dependencies.json  ← NEW                           │
    │   └── ai_rules.md       ← NEW                           │
    └─────────────────────────────────────────────────────────┘
```

---

## Execution Flow

```
User runs: ai-first init

    │
    ▼
┌────────────────────────────────────┐
│ CLI Entry Point                     │
│ - Parse args (--root, --output)    │
│ - Handle 'init' command            │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ runAIFirst(options)                │
│ - rootDir: process.cwd()           │
│ - outputDir: ./ai                  │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ scanRepo(rootDir)                   │
│ Returns: { files: FileInfo[] }      │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ For each analyzer:                  │
│ 1. analyze(files, rootDir)         │
│ 2. generateXxxFile(result)        │
│ 3. writeFile(outputPath, content)  │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ generateUnifiedContext()            │
│ - Combines all results             │
│ - Creates ai_context.md            │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ Return: { success, filesCreated }  │
└────────────────────────────────────┘
```

---

## Analyzer Details

| Analyzer | Output | Description |
|----------|--------|-------------|
| `repoMapper` | repo_map.md, repo_map.json, summary.md | Directory tree & file stats |
| `techStack` | tech_stack.md | Languages, frameworks, package managers |
| `architecture` | architecture.md | MVC, Clean Architecture, Hexagonal, etc. |
| `entrypoints` | entrypoints.md | CLI, API, server entry points |
| `conventions` | conventions.md | Naming, testing, linting conventions |
| `symbols` | symbols.json | Functions, classes, interfaces (NEW) |
| `dependencies` | dependencies.json | Import graph (NEW) |
| `aiRules` | ai_rules.md | Guidelines for AI (NEW) |
