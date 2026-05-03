# Changelog & Roadmap

All notable changes to `ai-first` will be documented in this file.

---

## [Unreleased]

### 🚀 Content Quality Improvements

#### ✨ Framework Detection Enhancements
- **Weighted Detection Signals** - Added custom `weight` property to `DetectionSignal` interface
  - Enables more specific framework detection (manage.py=5 vs requirements.txt=1)
  - Updated `baseAdapter.ts` and `adapterRegistry.ts`
  - Better scoring for framework-specific files

- **Content-Based Python Framework Detection** - Enhanced `src/analyzers/techStack.ts`
  - Analyzes actual Python imports to distinguish Django/Flask/FastAPI
  - Scans up to 50 Python files for framework-specific imports
  - Resolves conflicts from package-based detection

#### 🔧 Architecture Detection Fixes
- **API vs MVC Pattern Detection** - Updated `src/analyzers/architecture.ts`
  - Now requires views/templates for MVC pattern (not just controllers)
  - APIs without views are correctly labeled "Layered Architecture (REST API)"
  - CLI tools get appropriate pattern without generic DI advice

- **Context-Aware Recommendations** - Updated `src/core/generation/architectureGenerator.ts`
  - CLI projects: recommends command parser libraries
  - REST APIs: recommends layered separation
  - No more generic DI advice for inappropriate project types

#### 📝 Description Quality Improvements
- **Better Project Purpose Inference** - Updated `src/core/repoMapper.ts`
  - Extracts domain from directory names (auth → authentication, order → e-commerce)
  - Fallback descriptions are more specific (e.g., "service-oriented application")
  - 12 domain pattern categories

- **Improved Project Type Detection** - Updated `src/core/generation/aiContextGenerator.ts`
  - No more "Generic Application" or "software project" generic fallbacks
  - Uses architecture pattern info when available
  - Maps to: REST API, Microservices, Frontend Application, Backend Service, etc.

- **Enhanced Entry Point Descriptions** - Updated `describeEntryPoint()`
  - Now recognizes: CLI commands, workers, schedulers, consumers/producers
  - More specific handlers: auth, middleware, services, repositories
  - 15+ entry point type categories

#### 🛠️ New Utilities
- **FileStatsCalculator** - `src/utils/fileStatsCalculator.ts`
  - Centralized file counting logic
  - Consistent statistics across generators
  - Validation for count consistency

- **README Parser** - `src/utils/readmeParser.ts`
  - Extracts title and description from README.md
  - Detects documentation sections (installation, usage, examples)

- **Text Utils** - `src/utils/textUtils.ts`
  - Description deduplication
  - Removes redundant phrases ("API API" → "API")

#### ✅ Testing
- All 1138 tests passing
- Build compiles without errors

---

## [1.3.10] - 2026-04-05

### 🎯 Framework Instructions & API Contracts

**Branch:** `1.3.10`

#### ✨ New Features

- **Framework Instructions Generator** - New `src/analyzers/frameworkInstructions.ts`
  - Generates framework-specific instructions for ai_rules.md
  - Supports: Django, Rails, Laravel, Express.js, NestJS, Spring Boot, FastAPI, Flask
  - Includes: management commands, ORM patterns, routing conventions, DI patterns, testing guidelines

- **API Contracts Generator** - New `src/analyzers/apiContracts.ts`
  - Documents API endpoints with request/response schemas
  - Supports: Express, NestJS, Spring Boot, FastAPI, Django REST Framework
  - Extracts: HTTP methods, paths, handlers, schemas

- **Enhanced Module Descriptions** - Improved `inferModuleResponsibility()` in `src/analyzers/architecture.ts`
  - Detects domain keywords (user, auth, order, product, payment, etc.)
  - Generates specific descriptions: "User management API" instead of "API endpoints"
  - 17 domain pattern categories added

- **Entrypoints Format Upgrade** - Updated `generateEntrypointsFile()` in `src/analyzers/entrypoints.ts`
  - Changed from table format to header-per-entry format
  - Each entry now uses `####` header with bullet points
  - Better readability and AI parsing

#### 🧪 Testing

- **All 1089 tests passing** (+13 new tests for new features)
- Build compiles without errors

#### 📋 Target

- Evaluator score target: >4.5/5.0

## [1.3.9-1] - 2026-04-05

### 🐛 Entrypoint Detection Fixes

**Branch:** `1.3.9-1`

#### 🐛 Bug Fixes

- **Content-based detection** - Re-enabled content signal matching in adapterRegistry
  - Previously returned `false` for all content signals
  - Now implements `matchContentSignal()` to search file contents
  - Performance: Limited to 100 files and 3 directory depth

#### ✨ New Features

- **FastAPI adapter signals** - Added detection signals to FastAPI adapter
  - `from fastapi import` - Content pattern
  - `import fastapi` - Content pattern
  - `FastAPI(` - Content pattern
  - `pyproject.toml` - File pattern
  - `requirements.txt` - File pattern

- **Python entrypoint detection** - New `discoverPythonEntrypoints()` function
  - `manage.py` → Django CLI entrypoint
  - `app.py` → Flask/FastAPI server entrypoint
  - `main.py` → Python application entrypoint
  - `__init__.py` → Library exports detection
  - `pyproject.toml` → Poetry/uv CLI scripts
  - `setup.py` → Console scripts entry points

- **Spring Boot entrypoint detection** - New `discoverSpringBootEntrypoints()` function
  - `@SpringBootApplication` → Main application class
  - `@RestController` / `@Controller` → API endpoints
  - `pom.xml` → Maven project metadata
  - `build.gradle` → Gradle project with Spring Boot detection

#### 🧪 Testing

- **9 new unit tests** for Python and Spring Boot entrypoint detection
- All 1076 tests passing

#### 📊 Evaluator Results

| Project | Before | After | Δ |
|---------|--------|-------|---|
| fastapi-framework | 3.63 | 4.13 | +0.50 |
| spring-petclinic | 3.64 | 4.18 | +0.54 |
| filament-laravel | 3.64 | 4.27 | +0.63 |
| go-zero-framework | 3.67 | 4.25 | +0.58 |
| **Average** | **3.95** | **4.17** | **+0.22** |

All 22 projects passing with score ≥ 3.5

## [1.3.9-2] - 2026-04-05

### 📝 Content Quality Improvements

**Branch:** `1.3.9-2`

#### ✨ New Features

- **Purpose section in summary.md** - `generateSummary()` now adds `## Purpose` section
  - Detects frameworks from file names (manage.py → Django, app.py → Flask, etc.)
  - Infers project purpose based on detected frameworks and structure
  - Example output: "This is a **Django** REST API for blog posts with JWT authentication"

- **Components section in architecture.md** - `generateArchitectureFile()` now adds `## Components` table
  - Table format: Component | Type | Path | Files
  - Provides quick overview of all modules before detailed section

- **Improved generateDescription()** - Avoids generic phrases like "A REST API application with X classes"
  - Uses entrypoints to infer specific project purpose
  - Falls back to architectural pattern if no entrypoints available

#### 📊 Evaluator Results

| Project | Before | After | Δ |
|---------|--------|-------|---|
| django-app | 4.41 | 4.55 | +0.14 |
| fastapi-app | 4.18 | 4.32 | +0.14 |
| flask-app | 3.64 | 3.77 | +0.13 |
| laravel-app | 4.35 | 4.50 | +0.15 |
| rails-app | 3.75 | 3.90 | +0.15 |
| **Average** | **4.17** | **4.28** | **+0.11** |

#### 📋 Pending Suggestions (for v1.3.10)

- API contracts feature (Express/NestJS/Spring/FastAPI/Django)
- Framework-specific instructions (Django, Rails, Laravel, Express, NestJS, Spring, FastAPI)
- Entry points with ### headers
- Generic module descriptions replacement

See [docs/planning/done/evaluator-suggestions-1.3.9.md](./docs/planning/done/evaluator-suggestions-1.3.9.md) for full list.

## [1.3.9] - 2026-03-30

### 🚀 MCP Server Fixes & Improvements

**Branch:** `feature/v1.3.9-mcp-and-evaluator`

#### 🐛 Bug Fixes

- **query_symbols implementation** - Fixed to actually query SQLite index and return real results
- **get_architecture implementation** - Fixed to use analyzeArchitecture() with real data
- **Version correction** - Fixed version from 1.4.0 to 1.3.8 in MCP server

#### ✨ New Features

- **--install-mcp flag** - Auto-configure OpenCode MCP server
  - Added `--install-mcp` option to `af init` command
  - Added `--mcp` alias for convenience
  - Generates `.opencode/mcp.json` with MCP server configuration
  - Creates `.opencode` directory if it doesn't exist

#### 🧪 Testing

- **New MCP unit tests** - 6 tests added for MCP install functionality
- **MCP E2E tests** - Added to E2E test suite
- **All 22 evaluator projects regenerated** - Ensured consistent quality

#### 📊 Evaluator Results

- Average score: 3.64/5.0
- All 22 projects passing (previously 3 were failing)

## [1.3.8] - 2026-03-29

### 🚀 Major Features & Architecture Improvements

**Branch:** `feature/v1.3.8-improvements`

#### ✨ New Features

- **Configuration System** - Full support for `ai-first.config.json`
  - Load and validate configuration from JSON files
  - 4 built-in presets: `full`, `quick`, `api`, `docs`
  - Custom preset support
  - Configuration merging and validation

- **Library/API Mode** - Use ai-first as a Node.js library
  - Full TypeScript support with exported types
  - Programmatic access to all core functions
  - Perfect for building tools on top of ai-first

- **Content Compression** - Reduce tokens by up to 70%
  - **Inclusion Levels**: `full`, `compress`, `directory`, `exclude`
  - **Detail Levels**: `full`, `signatures`, `skeleton`
  - Smart content processing preserves imports, exports, and signatures
  - Language-aware compression for TypeScript, Python, Go, Rust

- **Git Blame Integration** - Track code authorship
  - Get blame information for any file
  - Format options: `inline` (per line) or `block` (grouped by author)
  - Shows author, date, and commit hash
  - Helps identify who wrote what and when

- **MCP Server Support** - Model Context Protocol integration
  - Native MCP server for AI agent integration
  - 3 built-in tools:
    - `generate_context` - Generate AI context for repository
    - `query_symbols` - Search symbols in indexed repository
    - `get_architecture` - Get architecture analysis
  - Works with Cursor, Claude Code, and other MCP-compatible agents

- **RAG Vector Search** - Semantic search for your codebase
  - Local vector index (no cloud required)
  - Search with natural language queries
  - Find related code by meaning, not just text matching
  - Perfect for large codebases and onboarding

- **Multi-Repository Support** - Handle monorepos and microservices
  - Scan multiple repositories in one command
  - Git submodule detection and support
  - Cross-repository dependency tracking
  - Unified context across services

#### 🔧 Technical Improvements

- New modular architecture with separate packages:
  - `src/config/` - Configuration management
  - `src/core/content/` - Content processing and compression
  - `src/core/rag/` - Vector search and semantic indexing
  - `src/core/multiRepo/` - Multi-repository support
  - `src/mcp/` - Model Context Protocol server

- Added `@modelcontextprotocol/sdk` dependency for MCP support
- Comprehensive test suite for configuration system
- Benchmark scripts for token reduction measurement

#### 📚 Documentation

- New "Programmatic API" section in README
- Complete FEATURES_GUIDE.md for developers
- Implementation planning documents
- Configuration file examples

#### 📦 New Dependencies

```json
"@modelcontextprotocol/sdk": "^1.0.4"
```

## [1.3.7] - 2026-03-28

### 🎯 AI Context Quality Evaluator

**Branch:** `feature/migrate-evaluator-to-private-repo`

#### Added

- **Context Quality Evaluation System**
  - Built-in evaluator to measure AI context quality (score 0-5)
  - Hierarchical evaluation in 3 levels: Structure, Content, AI Assessment
  - Conditional scoring that doesn't penalize for optional features
  - 100% cost savings when quality score ≥ 3.5 (skips AI evaluation)
  - Categorized improvement suggestions: IMPLEMENTED, USER_ACTION, KNOWN_LIMITATION, IMPROVEMENT

- **New Evaluation Checks**
  - Entry Point Documentation check (15 pts)
  - Documentation Completeness check (15 pts)
  - API Contracts validation (conditional)
  - Framework Instructions validation (conditional)
  - Freshness tracking check (conditional)

- **Evaluator Repository Migration**
  - Extracted evaluator to private repository: `ai-first-evaluator`
  - Integrated as dev dependency via npm
  - Added evaluation scripts: `npm run evaluate`, `npm run evaluate:ci`, `npm run evaluate:quick`
  - Post-install script to auto-build evaluator

#### Changed

- **Improved Scoring Logic**
  - Fixed bug allowing scores > 5.0 (now properly capped)
  - Better Spring Boot framework detection
  - Content Quality scoring increased to 80 points (from 50)

#### Test Results

- **1041 Tests Passing** (+15 new evaluation tests)
- **31 Test Files**
- **100% Pass Rate**
- **11/11 Test Projects Passing**
- **Average Score: 3.88/5.0**
- **Cost Savings: 100%**

---

## [1.3.6] - 2026-03-28

### 🎯 AI Recommendations Implementation

**Branch:** `feature/ai-recommendations-v1.3.6`

#### Added

- **Go Entrypoints Detection** (T1)
  - Detect `main.go` with `func main()`
  - Extract HTTP handlers (`http.HandleFunc`)
  - Identify service ports (`:8080`, `:3000`)
  - Parse structs and methods
  - Read `go.mod` for module information

- **Rust Entrypoints Detection** (T2)
  - Detect `main.rs` with `fn main()`
  - Extract `Cargo.toml` configuration
  - Identify structs and implementations
  - Support for binary and library projects

- **PHP Entrypoints Detection** (T3)
  - Detect `index.php` entrypoints
  - Support Laravel convention (`public/index.php`)
  - Parse `composer.json` dependencies
  - Detect Laravel and Symfony frameworks

- **Comprehensive Test Suite** (T4, T8, T12)
  - 16 tests for Go/Rust/PHP entrypoints
  - 14 tests for framework detection
  - All Apex class tests now passing (was 40/43, now 43/43)

#### Fixed

- **Framework Detection** (T5-T7)
  - NestJS: Now correctly detects `@nestjs/*` packages
  - Spring Boot: Parses `pom.xml` and `build.gradle`/`build.gradle.kts`
  - Express: Shows "API Server" instead of "Microservices" for single services

- **Apex Parser Improvements** (T9)
  - Handle multi-line annotations (`@AuraEnabled(cacheable=true)`)
  - Support generic return types (`List<Account>`, `Map<String, Object>`)
  - Detect `webservice` methods
  - Fix method signature extraction with parameters

- **Architecture Descriptions** (T15)
  - Replace "Contains X files" with functional descriptions
  - Infer responsibility from file types (TypeScript, Python, Java, etc.)
  - Language-specific descriptions (e.g., "JavaScript/TypeScript implementation")

- **Development Directory Filtering** (T14)
  - Exclude `test-projects/` from analysis
  - Exclude `.ai-dev/` and `.ai-dev-out/`
  - Exclude `ai-context/` directory
  - Prevent test artifacts from polluting results

#### Test Results

- 1026 tests passing (+30 new tests)
- 0 tests failing (100% pass rate!)
- Fixed 3 pre-existing Apex test failures
- All 11 test projects validated

## [1.3.5] - 2026-03-24

### 🧪 Comprehensive Testing Suite

**Branch:** `feature/comprehensive-testing-suite`

#### Added

- **Complete Test Coverage**
  - 996 total tests (+827 new tests)
  - 27 test files covering all scenarios
  - 100% CLI command coverage (14 commands)
  - 100% Salesforce component coverage

- **Salesforce Testing Suite** (531 tests)
  - Apex Classes detection (43 tests)
  - Apex Triggers detection (67 tests)
  - Lightning Web Components (73 tests)
  - Flows and Process Builders (74 tests)
  - Custom Objects and Fields (147 tests)
  - SFDX Metadata and Integration (127 tests)
  - Real enterprise Salesforce project with 24 files

- **CLI Commands Testing** (296 tests)
  - `init` command with all flags (33 tests)
  - `index` command with adaptive thresholds (49 tests)
  - `watch`, `context`, `summarize`, `query` commands (69 tests)
  - `doctor`, `explore`, `map`, `adapters` commands (79 tests)
  - `git`, `graph`, `update`, `help` commands (66 tests)

#### Enhanced

- **Framework Detection Improvements**
  - NestJS: Fixed detection of `@nestjs/*` scoped packages
  - Spring Boot: Now appears in Frameworks section with Layered architecture
  - Express: Correctly identified as API Server (not Microservices)
  - Django: MTV (Model-Template-View) pattern detection
  - Rails: MVC with Rails conventions
  - Laravel: Service Container, Providers, Facades, Eloquent ORM detection

- **Entrypoints Detection**
  - Go: main.go, HTTP handlers, service ports
  - Rust: main.rs, structs, CLI arguments
  - PHP: index.php, Laravel/FastRoute detection
  - Python CLI: argparse commands, console_scripts
  - Spring Boot: @RestController, @RequestMapping endpoints

- **Symbol Extraction**
  - Go: Functions, types, imports with content
  - Rust: Structs, functions, Cargo.toml binary names
  - Laravel: Service Container and Provider detection

- **Architecture Analysis**
  - Functional module grouping (CLI Commands, Adapters, Language Parsers, Indexer)
  - Removed generic "Contains X files" descriptions
  - ai-first-cli self-analysis with functional descriptions

#### Test Results

- 996 unit tests passing (was 169)
- 11/11 adapter functional tests passing
- All 14 CLI commands tested
- 100% Salesforce component coverage
- Zero regression in existing functionality

## [1.3.4] - 2026-03-23

### 🚀 Enhanced iOS/SwiftUI Support

### 🚀 Enhanced iOS/SwiftUI Support

**Branch:** `feature/phase3-universal-framework-detection`

#### Added

- **SwiftUI Framework Detection**
  - File: `src/analyzers/techStack.ts`
  - Detects SwiftUI framework when `import SwiftUI` is found in Swift files
  - Also detects iOS framework alongside SwiftUI

- **SwiftUI Entrypoints Detection**
  - File: `src/analyzers/entrypoints.ts`
  - Added `discoverSwiftUIEntrypoints()` function
  - Extracts SwiftUI Views (structs conforming to View)
  - Detects @main app entry points
  - ContentView marked as main SwiftUI view

- **Swift Symbol Parsing**
  - File: `src/analyzers/symbols.ts`
  - Added `parseSwift()` function
  - Extracts structs, classes, functions, enums, protocols, constants
  - Supports Swift syntax: struct, class, func, enum, protocol, let, var

#### Test Results

- 169 unit tests passing
- 11/11 adapter functional tests passing
- iOS/SwiftUI user simulation successful

## [1.3.3] - 2026-03-23

### 🐛 Fixed "Contains 0 files" Errors

**Branch:** `feature/phase2-containsfiles-fix`

#### Fixed

- **Architecture Module Detection**
  - File: `src/analyzers/architecture.ts`
  - Fixed bug where root-level files (README.md, CHANGELOG.md, etc.) were incorrectly treated as modules
  - Root files no longer appear as "Contains 0 files" entries
  - Only actual directories are now listed as modules

- **Salesforce Entrypoints Detection**
  - File: `src/analyzers/entrypoints.ts`
  - Added `discoverSalesforceEntrypoints()` function
  - Apex classes now appear as entrypoints
  - Apex triggers now appear as entrypoints
  - Detects @AuraEnabled, @RestResource, and @webservice annotated methods

#### Test Results

- 169 unit tests passing
- 11/11 adapter functional tests passing
- Salesforce user simulation successful

## [1.3.2] - 2026-03-23

### 🚀 Enhanced Salesforce/Apex Support

**Branch:** `feature/phase1-apex-salesforce-parser`
**Total Changes:** 12 new tests, improved parser accuracy

#### Added

- **Improved Apex Parser**
  - File: `src/analyzers/symbols.ts`
  - Enhanced regex for class detection (supports with/without/inherited sharing)
  - Better method extraction for @AuraEnabled and webservice methods
  - Trigger detection with SObject mapping
  - 12 comprehensive unit tests added

- **Salesforce TechStack Detection**
  - File: `src/analyzers/techStack.ts`
  - Detects Apex and Apex Trigger languages
  - Reads sfdx-project.json for metadata
  - Extracts: apiVersion, packageDirectories, namespace
  - Counts: apexClasses, triggers
  - Auto-detects SObjects from trigger definitions

- **New Interface: SalesforceInfo**
  - Added to TechStack interface
  - Tracks Salesforce-specific project metadata

#### Changed

- **Language Detection**
  - Added "Apex" and "Apex Trigger" to language map
  - File extensions: .cls, .trigger

- **Framework Detection**
  - Added "Salesforce DX" framework indicator
  - Detects via sfdx-project.json

#### Test Results

All tests passing:
- 169 unit tests (was 157)
- 12 new Apex-specific tests
- 11 adapter tests still passing
- Salesforce project correctly detected

#### Documentation

- Updated README.md with Salesforce section
- Updated README.es.md (Spanish)
- Added Apex to supported languages list

## [1.3.0] - 2026-03-22

### 🚀 Release v1.3.0 - AST-Based Semantic Analysis

**Branch:** `master` (merged from beta)
**Total Changes:** 5 phases, 157 tests, 13 bug fixes

### Phase 1: AST Parsing

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

### Phase 4: Context Generation with Semantic Analysis - Completed (v1.6.0)

**Date:** 2026-03-21
**Branch:** `feature/phase-4-context-generation`

#### Added

- **AI Context Generator Enriched**
  - File: `src/core/generation/aiContextGenerator.ts`
  - Generates ai_context.md with semantic analysis
  - Includes architecture pattern detection with confidence
  - Shows tech stack (languages, frameworks, libraries)
  - Lists business flows with dependencies
  - Provides metrics (total files, symbols, complexity)
  - Getting started guide for AI assistants

- **Flow Generator with Real Dependencies**
  - File: `src/core/generation/flowGenerator.ts`
  - Generates flows with actual imports and calls
  - Detects architectural layers (API, Service, Data, UI)
  - Calculates complexity (low/medium/high)
  - Traces call chains from entry points
  - Shows file responsibilities and symbols

- **Architecture Generator with Diagrams**
  - File: `src/core/generation/architectureGenerator.ts`
  - Generates ASCII architecture diagrams
  - Creates Mermaid diagrams for visualization
  - Shows layer hierarchy and relationships
  - Displays module dependencies
  - Provides architectural recommendations

- **Comprehensive Test Suite**
  - 8 tests for generation modules
  - Total: 150 tests passing (was 142)

#### Generated Output Examples

**ai_context.md now includes:**
```markdown
# AI Context: ProjectName

## Project Overview
**Type**: REST API / Web Service
**Description**: Layered Architecture with 45 classes and 23 functions

## Architecture
### Pattern: Layered Architecture
**Confidence**: 85%

### Layers
#### API Layer
**Responsibility**: Handle HTTP requests
**Components**: UserController, AuthController

## Tech Stack
### Languages
- TypeScript

### Frameworks
- NestJS / Express
```

**architecture.md now includes:**
- ASCII diagrams showing layer hierarchy
- Mermaid diagrams for visualization
- Module dependency graphs
- Architectural recommendations

#### Technical Details

- New module: `src/core/generation/` with index exports
- Integration with analysis modules from Phase 2 and 3
- Markdown generation with templates
- No breaking changes, enhanced output only

---

### Phase 5: Code Quality - Completed (v1.2.0)

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

### Phase 5: Integration and Optimization - Completed (v1.3.0)

**Date:** 2026-03-21
**Branch:** `feature/phase-5-integration`

#### Added

- **Analysis Pipeline**
  - File: `src/core/pipeline.ts`
  - Orchestrates all analysis phases (AST parsing → Dependency Analysis → Architecture Detection → Context Generation)
  - Unified interface for running complete analysis
  - Performance metrics tracking (duration, cache hit rate)
  - Error handling with graceful fallbacks

- **Caching System**
  - LRU cache for parsed symbols (max 1000 entries)
  - Cache hit/miss tracking and metrics
  - Batch processing (50 files per batch) for memory efficiency
  - Performance improvement: 40-60% faster on repeated runs

- **Comprehensive Integration Test Suite**
  - File: `tests/pipeline.integration.test.ts`
  - 7 new integration tests covering:
    - TypeScript AST parsing
    - Architecture pattern detection (MVC, Layered, etc.)
    - AI context generation
    - Dependency graph generation
    - Error handling and edge cases
  - Total: 157 tests passing (was 150)

#### Improved

- **Performance Optimizations**
  - Symbol extraction now uses batch processing for large repositories
  - Memory-efficient caching prevents OOM on large codebases
  - Cache hit rate reporting in metrics
  - Benchmark target: <30s for 1000 files (achieved: ~2s for 1000 cached files)

- **Error Handling**
  - Graceful degradation when AST parsing fails (falls back to regex)
  - Detailed error logging for debugging
  - Continues analysis even if individual files fail

#### Test Results

All 157 tests passing:
- Unit tests: 150 (existing)
- Integration tests: 7 (new)
- Adapter E2E tests: 16 (all passing)

### Phase 6: Community (Planned)
- Plugin system
- Custom rules
- CI/CD integration
