# Changelog & Roadmap

All notable changes to `ai-first` will be documented in this file.

---

## [Unreleased]

### Added
- Enhanced symbol indexing with `filePath#symbolName` IDs
- Extended symbol graph relationships: calls, called_by, imports, references, instantiates, extends, implements, exports
- Reverse symbol references (`ai/graph/symbol-references.json`)
- File index with symbol mappings (`ai/files.json`)
- Code Context Packets (CCP) with depth, ranking, and multiple formats
- Context CLI flags: `--depth`, `--max-symbols`, `--format`, `--save`
- Incremental indexing with file hash cache (`ai/cache.json`)
YB|- Context ranking system based on graph distance and relationships
RR|- Android/Kotlin Support: Android framework detection, SDK version extraction, Gradle dependency parsing, AndroidManifest parsing, Android resources indexing, Gradle multi-module detection
PY|- Documentation: Architecture guide and Commands reference updated
- Documentation: Architecture guide and Commands reference updated

---

## [1.1.0] - 2026-03-09

All notable changes to `ai-first` will be documented in this file.

---

## [Unreleased]

### Added
- `ai-first context <symbol>` - Generate context packet for specific symbol
- `ai/graph/symbol-graph.json` - Symbol-level dependency graph with bidirectional relationships
- `ai/context/<symbol>.json` - Code Context Packets (CCP) for AI agents
- Unique symbol IDs (format: `module.symbolName`)
- Symbol relationships: calls, called_by, imports, references

---

## [1.1.0] - 2026-03-09

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
- feat: Add VitePress documentation site with SEO optimization (e0b3e35)
- fix: Add permissions and GITHUB_TOKEN to changelog workflow (062d952)
- chore: Update CHANGELOG with all new features (8c1f6d9)
- fix: Update roadmap to match planned features from CHANGELOG (7eca761)
- fix: Remove hash ID markers from README (d05db53)
- feat: Add incremental indexing and semantic search pipeline (e294a2c)
- feat: Add improved indexing with adaptive sizing, map command, incremental state (d0a172b)
- feat: Add doctor, explore commands and semantic indexing (50011da)
- fix: Correct YAML syntax in changelog workflow (5a1c819)
- Improve documentation with Quick Start, Why AI-First, Architecture diagram, Languages (7cc8f44)

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

## 📋 Roadmap

See [CHANGELOG.md](./CHANGELOG.md) for the complete roadmap:
- **Unreleased** section shows what's being worked on
- Version sections show completed features
- Future planned features are listed under each phase

---

## How to Update

After each feature release:
1. Update this changelog with new changes
2. Update version in `package.json` (semver)
3. Commit and push

```bash
git add CHANGELOG.md package.json
git commit -m "Release v1.x.x"
git push
```
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
