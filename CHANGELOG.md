# Changelog & Roadmap

All notable changes to `ai-first` will be documented in this file.

---

## [Unreleased]

### Phase 1: AST Parsing - Completed (v1.3.0)

**Date:** 2026-03-21
**Branch:** `feature/phase-1-ast-parsing`

#### Added

- **TypeScript Parser with TS Compiler API**
  - File: `src/core/parsers/typescriptParser.ts`
  - Extracts: classes, interfaces, functions, enums, types
  - Detects: inheritance (extends/implements), imports/exports
  - Parses: JSDoc comments, decorators (@Component, @Injectable)
  - Technology: TypeScript Compiler API

- **Python Parser with Enhanced Syntax Analysis**
  - File: `src/core/parsers/pythonParser.ts`
  - Extracts: classes, functions, methods
  - Detects: decorators (@app.route, @dataclass), type hints
  - Handles: async/await, docstrings
  - Technology: Custom recursive descent parser

- **Parser Registry (Factory Pattern)**
  - File: `src/core/parsers/index.ts`
  - Selects appropriate parser based on file extension
  - Extensible architecture for future parsers
  - Supported: .ts, .tsx, .js, .jsx, .py

- **Comprehensive Test Suite**
  - 9 tests for TypeScript parser
  - 8 tests for Python parser
  - 13 tests for Parser Registry
  - Total: 123 tests passing (was 93)

#### Changed

- **Symbol Extraction Engine**
  - File: `src/analyzers/symbols.ts`
  - Now uses AST parsers for TypeScript and Python
  - Falls back to regex for other languages (Go, Rust, Java, PHP, Ruby)
  - Result: More accurate symbol detection with metadata

#### Test Results

All 11 adapters working with improved accuracy:

| Adapter | Symbols | Status |
|---------|---------|--------|
| django-app | 84 | ✅ |
| laravel-app | 132 | ✅ |
| fastapi-app | 132 | ✅ |
| flask-app | 105 | ✅ |
| rails-app | 276 | ✅ |
| spring-boot-app | 64 | ✅ |
| nestjs-backend | 89 | ✅ |
| express-api | 100 | ✅ |
| react-app | 92 | ✅ |
| salesforce-cli | 21 | ✅ |
| python-cli | 18 | ✅ |

#### Migration Notes

No breaking changes. All existing functionality preserved.
AST parsing adds more metadata without changing output format.

---

### Phase 2: Dependency Analysis and Graph Building - Completed (v1.4.0)

**Date:** 2026-03-21
**Branch:** `feature/phase-1-ast-parsing` (continued)

#### Added

- **Dependency Analyzer**
  - File: `src/core/analysis/dependencyAnalyzer.ts`
  - Analyzes imports/exports between files
  - Builds dependency graph with nodes and edges
  - Detects circular dependencies
  - Calculates metrics (total imports, most imported modules)

- **Call Graph Builder**
  - File: `src/core/analysis/callGraphBuilder.ts`
  - Builds call graph between functions
  - Finds unused functions and dead code
  - Calculates call chains and complexity
  - Detects entry points

- **Inheritance Analyzer**
  - File: `src/core/analysis/inheritanceAnalyzer.ts`
  - Builds class hierarchy graphs
  - Detects extends and implements relationships
  - Finds ancestors and descendants
  - Calculates inheritance depth metrics

- **Comprehensive Test Suite**
  - 12 tests for analysis modules
  - Total: 135 tests passing (was 123)

#### Technical Details

- New module: `src/core/analysis/` with index exports
- Algorithms: DFS for cycle detection, recursive traversal for hierarchy
- Metrics: Import counts, inheritance depth, call complexity

---

### Phase 3: Architecture Detection - Completed (v1.5.0)

**Date:** 2026-03-21
**Branch:** `feature/phase-3-architecture-detection`

#### Added

- **Architecture Detector**
  - File: `src/core/analysis/architectureDetector.ts`
  - Detects MVC pattern (Models, Views, Controllers)
  - Detects Layered Architecture (API, Service, Data layers)
  - Detects Clean Architecture (Entities, Use Cases, Interfaces)
  - Detects Hexagonal Architecture (Ports & Adapters)
  - Detects Microservices pattern
  - Confidence scoring with evidence

- **Layer Detection**
  - API/Presentation layer (controllers, routes, handlers)
  - Service/Business layer (services, use cases)
  - Data/Persistence layer (repositories, models)
  - Automatic classification based on naming

- **Entry Point Detection**
  - Identifies main, index, bootstrap functions
  - Detects server entry points
  - Used for dead code analysis

- **Comprehensive Test Suite**
  - 7 tests for Architecture Detector
  - Total: 142 tests passing

#### Detected Patterns

| Pattern | Indicators | Example |
|---------|------------|---------|
| MVC | Controllers, Models, Views | `UserController`, `User`, `user.html` |
| Layered | API, Service, Data layers | `ApiController`, `UserService`, `UserRepository` |
| Clean | Entities, Use Cases | `User`, `CreateUserUseCase` |
| Hexagonal | Ports, Adapters | `UserPort`, `UserAdapter` |
| Microservices | Loosely coupled services | Multiple independent services |

#### Technical Details

- Pattern matching based on naming conventions and dependencies
- Confidence scoring: 0-1 based on evidence strength
- Layer detection uses file paths and symbol names
- No breaking changes, additive only

---

### Phase 4: Code Quality - Completed (v1.2.0)

**Date:** 2026-03-18

#### Fixed

- **Symbol Extraction Extension Bug**
  - Files affected: `src/analyzers/symbols.ts`
  - Issue: Extension checks were missing dots (`"js"` instead of `".js"`)
  - Fix: All extension checks now use correct format with dot

- **Flow Name Sanitization**
  - Files affected: `src/core/semanticContexts.ts`
  - Issue: Malformed flow names like `auth..json`, `add_.json`
  - Fix: Added `sanitizeFlowName()` function

- **Duplicate Files**
  - Issue: `repo-map.json` and `repo_map.json` coexisted
  - Fix: Consolidated to `repo_map.json` only

- **PHP Parser**
  - Files affected: `src/analyzers/symbols.ts`
  - Issue: Laravel adapter returned 0 symbols
  - Fix: Added `parsePHP()` function

- **Ruby Parser**
  - Files affected: `src/analyzers/symbols.ts`
  - Issue: Rails adapter returned 0 symbols
  - Fix: Added `parseRuby()` function

#### Added

- **Functional Tests for Phase 2 Fixes**
  - File: `tests/phase2-fixes.test.ts`
  - Tests symbol extraction, flow sanitization, file consolidation

- **Adapter Test Script**
  - File: `test_adapters.mjs`
  - Tests all 11 adapters for symbol extraction (11/11 PASS)

#### Changed

- **Breaking Change:** Flow files are now sanitized
  - Old names: `auth..json`, `users..json`, `add_.json`
  - New names: `auth.json`, `users.json`, `add.json`

- **Breaking Change:** `repo-map.json` renamed to `repo_map.json`

### Phase 3: Architecture - Completed (v1.2.0)

**Date:** 2026-03-18

#### Changed

- **Breaking Change:** Directory renamed from `ai/` to `ai-context/`
  - Reason: Hidden directory (starts with `.`) keeps project root cleaner
  - Affects: All generated files, test projects, documentation
  - Files updated: 21 source files + all README/docs

#### Technical Details

- Changed: `path.join(rootDir, "ai")` → `path.join(rootDir, "ai-context")` in all source files
- Renamed: Main project directory `ai/` → `ai-context/`
- Renamed: All 11 test project directories `*/ai/` → `*/ai-context/`
- Updated: README.md, README.es.md, CHANGELOG.md, PLAN_MEJORAS.md

### Phase 4: Performance - Completed (v1.2.0)

**Date:** 2026-03-19

#### Changed

- **Embeddings storage moved from JSON to SQLite**
  - Embeddings now stored in `index.db` alongside other index data
  - Removed `embeddings.json` file generation
  - Performance improvement: Single database file instead of multiple JSON files
  - Files affected: `src/core/embeddings.ts`, `src/commands/ai-first.ts`

#### Technical Details

- Added `embeddings` table to SQLite database
- Schema: `(id, vector, metadata, chunk_id, file_path, start_line, end_line, type, language)`
- Vector and metadata stored as JSON strings
- Same `index.db` used for files, symbols, imports, and embeddings

### Phase 5: Documentation - Completed (v1.2.0)

**Date:** 2026-03-19

#### Changed

- **Documentation consistency fixed**
  - Updated all documentation files to use `ai-context/` instead of `ai/`
  - Files updated: README.md, README.es.md, tests/e2e/README.md, examples/README.md
  - Files updated: docs/guide/quick-start.md, docs/guide/getting-started.md
  - Examples updated: examples/01-express-api.md, examples/02-react-app.md, examples/03-python-django.md

---

## [1.1.6] - 2026-03-18

### Added
- **Phase 1: Testing Infrastructure** - Complete test project coverage for 10/16 adapters (62.5%)
  - Test projects added:
    - `django-app` (Django Web framework)
    - `laravel-app` (Laravel PHP framework)
    - `fastapi-app` (FastAPI Python)
    - `flask-app` (Flask Python micro-framework)
    - `rails-app` (Ruby on Rails)
    - `spring-boot-app` (Spring Boot Java)
  - All 11 commands tested on all 11 projects (121/121 functional tests passing)
  - All projects generate valid JSON, SQLite databases, and Markdown files

### Fixed
- **Ruby Parser**: Added `parseRuby()` function to extract symbols from Ruby files
  - rails-app now extracts 74 symbols (was 0)
- **Flow Name Sanitization**: Added `sanitizeFileName()` function in semanticContexts.ts
  - Fixes malformed names: `auth..json` → `auth.json`, `add_.json` → `add.json`
- **Laravel/PHP Relationships**: Now properly detecting relationships (was 0, now 3+)

### Verified
- All 11 test projects pass doctor command (6/6 checks)
- All adapters detect their respective frameworks correctly
- All 11 commands (init, map, index, doctor, graph, summarize, update, explore, query, context, adapters) work on all projects

---

## [1.1.5] - 2026-03-17

### Fixed
- **Bug A**: `index` command now correctly generates `index.db` in the `--root/ai/` directory instead of current working directory
- **Bug B**: `graph` command now works without git repository (uses static analysis fallback)
- **Bug C**: `query` command now correctly finds symbols (depends on Bug A fix)
- **Comprehensive Testing**: All 11 commands tested on 5 different project types (55/55 tests passing)
  - Express.js API
  - NestJS Backend
  - Python CLI
  - React App
  - Salesforce CLI

### Verified
- All JSON output files are valid
- All SQLite databases are properly formatted
- All Markdown files are properly generated
- Exit codes are correct for all scenarios

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

### Security
- **Bug 4**: Reduced npm vulnerabilities from 6 to 3 (dev dependencies only)
- Updated `vitest` from 2.x to 4.x to resolve security issues
- Remaining 3 vulnerabilities in `esbuild` (via vitepress) - low risk, dev-only

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
