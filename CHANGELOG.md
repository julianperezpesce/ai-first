# Changelog & Roadmap

All notable changes to `ai-first` will be documented in this file.

---

## [Unreleased]

### Added
- `ai-first doctor` - Health check command for repository readiness
- `ai-first explore <module>` - Navigate module dependencies
- `ai-first map` - Generate repository architecture map
- `ai-first index --semantic` - Semantic indexing with embeddings
- `index-state.json` - Track file changes for incremental indexing
- `files.json` - List of all indexed files with metadata
- `modules.json` - Detected modules and their structure
- `module-graph.json` - Module dependency graph
- `embeddings.json` - Semantic embeddings for code search
- SQLite index with adaptive sizing for large repos

### New Generated Files
- `ai/files.json` - File inventory with hash, size, line count
- `ai/modules.json` - Module detection and hierarchy
- `ai/module-graph.json` - Import-based dependency graph
- `ai/embeddings.json` - Vector embeddings for semantic search

---

## [1.0.0] - 2026-03-08

### Added
- Initial release
- Core analyzers:
  - `repo_map.md` - Repository structure tree view
  - `summary.md` - Files by extension and directory
  - `architecture.md` - Pattern detection (MVC, Clean Architecture, etc.)
  - `tech_stack.md` - Languages, frameworks, libraries
  - `entrypoints.md` - CLI, API, server entry points
  - `conventions.md` - Naming, testing, linting conventions
  - `ai_context.md` - Unified AI context
- `symbols.json` - Extracts functions, classes, interfaces from code
- `dependencies.json` - Analyzes import/require dependencies between files
- `ai_rules.md` - Generates guidelines for AI assistants
- `repo_map.json` - Machine-readable repository structure
- `index.db` - SQLite database for fast queries (`ai-first index`)

### Features
- Multi-language support (TypeScript, Python, Go, Rust, Java, C#, etc.)
- Deterministic analysis (no AI/LLM required)
- Works offline
- CLI interface with `--root` and `--output` options

---

## Roadmap

### Phase 1 (Done ✅)
- [x] Core CLI structure
- [x] Basic analyzers (architecture, tech stack, entrypoints, conventions)
- [x] Unified context generation

### Phase 2 (Done ✅)
- [x] Symbol extraction (functions, classes, interfaces)
- [x] Dependency analysis
- [x] AI rules generation
- [x] Machine-readable outputs (JSON)

### Phase 3 (In Progress)
- [x] Health check command (`ai-first doctor`)
- [x] Module exploration (`ai-first explore`)
- [x] Repository mapping (`ai-first map`)
- [x] Semantic indexing with embeddings
- [x] Incremental indexing (track file changes)
- [ ] Configuration file support (`ai-first.config.json`)
- [ ] Custom rules/plugins system

### Phase 4 (Future)
- [ ] Git integration (analyze recent changes)
- [ ] Diff-aware context (what changed since last run)
- [ ] Interactive mode
- [ ] VS Code extension

---

## How to Update

After each push to GitHub:
1. Update this changelog with new changes
2. Update version if needed (semver)
3. Push changes

```bash
git add CHANGELOG.md
git commit -m "Update changelog"
git push
```
