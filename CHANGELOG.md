# Changelog & Roadmap

All notable changes to `ai-first` will be documented in this file.

---

## [Unreleased]

---

## [1.1.4] - 2026-03-17

### Fixed
- **Bug 1**: Features and flows were empty because `isEntrypoint` only checked file names, not directory paths (e.g., `/commands/`, `/handlers/`)
- **Bug 2**: Context command now displays all relationship types (Exports, References) in addition to Calls, Called by, Imports
- **Bug 5**: `init` command now generates `modules.json`, required for feature/flow detection
- **Bug 6**: Features now detected in projects without `src/` prefix (Express, React, etc.)
- **Bug 7**: Fixed incorrect paths in flows (removed npm dependencies and normalized paths)
- **Bug 8**: Salesforce extensions (`.cls`, `.trigger`, `.apex`) added to file scanner
- **Bug 10**: Added Apex symbol parser to extract classes, methods, and triggers from Salesforce files
- **Bug 11**: Fixed import detection in Python and React/JSX projects (was only detecting exports)

### Added
- **Functional Test Suite**: Added test projects for multiple frameworks:
  - `express-api` (Express.js)
  - `nestjs-backend` (NestJS)
  - `python-cli` (Python)
  - `react-app` (React + Vite)
  - `salesforce-cli` (Salesforce DX)
- **E2E Tests**: Test runner script and documentation in `tests/e2e/`
- **BUGS.md**: Tracking file for known issues and their status

### Changed
- Reduced minimum files for features from 3 to 2 (for small projects)
- Added `controllers`, `routes`, `handlers`, `views`, `pages` to candidate roots
- Removed `models`, `services` from ignored folders (now detected as features)

---

## [1.1.3] - 2026-03-11

### Added
- **CLI Progress Feedback**: Added ora-based progress indicators for repository analysis
- **Lazy Context Generation**: Staged indexing for faster CLI startup
- **Lazy Analyzer Module**: `src/core/lazyAnalyzer.ts` with buildMinimalIndex, expandFeatureContext, expandFlowContext
- **AI Repository Schema**: Standardized schema system (schema.json, project.json, tools.json)
- **Schema Validation**: Programmatic schema validation API
- **Incremental Analysis**: Update repository context incrementally when files change
- **Update CLI Command**: `ai-first update` to perform incremental updates
- **Repository Knowledge Graph**: Unify all repository intelligence into a single navigable graph
- **Graph CLI Command**: `ai-first graph` to generate knowledge graph
- **Git Intelligence**: Analyze git activity for AI context
- **Git CLI Command**: `ai-first git` to analyze repository activity
- **Adapter SDK**: Developer-friendly `createAdapter()` API for custom ecosystem adapters
- **Community Adapters**: Pre-built adapters for Laravel, NestJS, Spring Boot, Phoenix, FastAPI
- **Business Feature Detection**: Auto-detect business modules (auth, users, payments)
- **Flow Detection**: Generate execution chains spanning multiple architectural layers
- **Android/Kotlin Support**: Android framework detection, SDK version extraction, Gradle parsing

### Improved
- Incremental repository analysis with change detection
- Performance benchmarks for various repository sizes

---

## [1.1.0] - 2026-03-09

### Added
- Enhanced symbol indexing with `filePath#symbolName` IDs
- Extended symbol graph relationships: calls, called_by, imports, references, instantiates, extends, implements, exports
- Reverse symbol references (`ai/graph/symbol-references.json`)
- File index with symbol mappings (`ai/files.json`)
- Code Context Packets (CCP) with depth, ranking, and multiple formats
- Context CLI flags: `--depth`, `--max-symbols`, `--format`, `--save`
- Incremental indexing with file hash cache (`ai/cache.json`)
- Context ranking system based on graph distance and relationships
- Documentation: Architecture guide and Commands reference

---

## [1.0.0] - 2026-03-01

### Added
- Initial release
- Repository scanning and structure analysis
- Symbol extraction for multiple languages
- Dependency analysis
- AI context generation
- Architecture pattern detection
- Tech stack detection

---

## Roadmap

### Phase 1: Core Infrastructure ✅
- Repository scanning
- Symbol extraction
- Dependency analysis

### Phase 2: Intelligence ✅
- Symbol graph
- Context packets
- Feature/flow detection

### Phase 3: Ecosystem ✅
- Adapters for popular frameworks
- Multi-language support
- Salesforce/Apex support (partial)

### Phase 4: Optimization (In Progress)
- Incremental updates
- Lazy loading
- Performance improvements

### Phase 5: Community (Planned)
- Plugin system
- Custom rules
- CI/CD integration
