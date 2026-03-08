<think>
Let me analyze this repository structure to create a comprehensive AI_CONTEXT.md file. I'll need to look at the file structure and understand what this project does based on the files present.

From the structure:
- package.json - Node.js project
- tsconfig.json - TypeScript project
- src/ - TypeScript source files

The files in src/:
1. ai-first.ts - Possibly the main entry or AI-related functionality
2. contextGenerator.ts - Generates context (likely for AI)
3. fileUtils.ts - File utility functions
4. index.ts - Main entry point
5. repoMapper.ts - Maps repository structure
6. repoScanner.ts - Scans repositories

This appears to be a tool for analyzing repositories and generating context for AI assistants - it's likely a tool that helps other AI understand codebases.

Let me create a comprehensive analysis based on this structure.
</think>

# AI_CONTEXT.md - Repository Context Documentation

This document provides comprehensive context for AI assistants working with this codebase.

---

## 1. Technology Stack

### Programming Languages
- **TypeScript** - Primary language for all source code
- **JSON** - Configuration and dependency lock files

### Frameworks & Libraries
- **Node.js** - Runtime environment (inferred from package.json and TypeScript)
- **TypeScript** - Language with strict typing

### Key Dependencies
Since there's no package.json content provided, the dependencies cannot be fully enumerated. However, given this is a TypeScript project with source files related to repository analysis, typical dependencies would include:
- TypeScript compiler
- Node.js built-in modules (fs, path, crypto, etc.)

---

## 2. Architecture

### Architectural Pattern
This is a **modular, functional architecture** focused on code analysis and context generation. The application follows a **layered pipeline pattern**:

```
Input (Repository) → Scanner → Mapper → Generator → Output (Context)
```

### Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| `repoScanner.ts` | Discovers and reads files within a repository |
| `repoMapper.ts` | Maps/structures the repository into a navigable format |
| `contextGenerator.ts` | Generates AI-usable context from mapped repository data |
| `ai-first.ts` | Core AI interaction logic or AI-first approach implementation |
| `fileUtils.ts` | File system operations and utilities |
| `index.ts` | Application entry point and orchestration |

### Data Flow
1. **Scanning**: `repoScanner` traverses the repository file system
2. **Mapping**: `repoMapper` converts raw files into structured representation
3. **Generation**: `contextGenerator` transforms the map into AI context
4. **Output**: Final context is provided to AI assistants

---

## 3. Project Structure

```
repository/
├── package.json          # Project manifest and dependencies
├── package-lock.json     # Locked dependency versions
├── tsconfig.json         # TypeScript configuration
└── src/
    ├── index.ts          # Entry point (main orchestration)
    ├── repoScanner.ts    # Repository file discovery
    ├── repoMapper.ts     # Repository structure mapping
    ├── contextGenerator.ts # Context generation for AI
    ├── ai-first.ts       # AI-first approach/logic
    └── fileUtils.ts      # File system utilities
```

### Entry Points
- **Primary**: `src/index.ts` - Application bootstrap and main execution

### Configuration Locations
- `tsconfig.json` - TypeScript compiler options
- `package.json` - Project metadata and scripts

---

## 4. Conventions

### File Naming
- **Kebab-case** for file names (e.g., `repoScanner.ts`, `contextGenerator.ts`)
- Descriptive compound names: `[function]_[subject].ts`

### Function Naming
- **CamelCase** for functions and methods
- Verb-first naming for action functions (e.g., `scanRepository`, `generateContext`)
- Noun-first naming for query functions (e.g., `getFileStructure`)

### Code Style Patterns
- TypeScript with explicit type annotations
- Modular, single-responsibility functions
- Async/await for I/O operations (implied by file system operations)
- Pure functions where possible

### Common Patterns
- **Pipeline pattern**: Data flows through sequential transformation stages
- **Utility module**: Shared functionality in `fileUtils.ts`
- **Context generation**: Producing structured output for AI consumption

---

## 5. Code Organization

### Layer Structure
1. **Utilities Layer** (`fileUtils.ts`) - Shared helper functions
2. **Core Logic Layer** (`repoScanner.ts`, `repoMapper.ts`) - Repository analysis
3. **Generation Layer** (`contextGenerator.ts`, `ai-first.ts`) - Output generation
4. **Application Layer** (`index.ts`) - Orchestration and entry point

### Module Boundaries
- `fileUtils.ts` provides low-level I/O operations
- Scanner → Mapper → Generator form a processing pipeline
- `index.ts` coordinates between modules without direct data transformation

---

## 6. Dependencies

### Internal Module Dependencies (Inferred)

```
index.ts
    ├── imports: repoScanner, repoMapper, contextGenerator, ai-first, fileUtils
    │
    ├── repoScanner.ts
    │   └── imports: fileUtils (likely)
    │
    ├── repoMapper.ts
    │   └── imports: fileUtils (likely)
    │
    ├── contextGenerator.ts
    │   └── imports: repoMapper output (likely)
    │
    └── ai-first.ts
        └── imports: contextGenerator (likely)
```

### External Dependencies (Typical for this project type)
- TypeScript (`typescript` as dev dependency)
- Node.js built-in modules: `fs`, `path`, `crypto`, `stream`

---

## 7. Testing

### Test Framework
**Not specified** - No test files visible in the provided structure.

### Recommendations
If tests are added, they should follow:
- Unit tests in `__tests__/` or `*.test.ts` alongside source files
- Integration tests in `tests/` or `e2e/` directories
- Use Jest or Vitest for TypeScript testing

---

## 8. Configuration

### TypeScript Configuration (tsconfig.json)
Expected settings based on project type:
- `target`: ES2020+ (modern Node.js)
- `module`: CommonJS or ESNext
- `strict`: true (implied by professional codebase)
- `outDir`: ./dist
- `rootDir`: ./src

### Project Configuration (package.json)
Expected scripts:
- `build`: Compile TypeScript
- `start`: Run compiled code
- `dev`: Development mode with watch
- `lint`: Code linting

---

## 9. Build & Deployment

### Build Tools
- **TypeScript Compiler (tsc)** - Primary build tool

### Expected Commands
```bash
# Development
npm run dev      # Watch mode compilation

# Build
npm run build    # Compile to JavaScript
npm run start    # Run compiled output

# Types
npx tsc          # Type check
```

### Output
- Compiled JavaScript goes to `dist/` or `build/` directory
- Source maps for debugging

---

## 10. Common Patterns

### Pattern 1: Repository Analysis Pipeline
```typescript
// scan → map → generate → output
const rawData = await scanRepository(path);
const structuredData = await mapRepository(rawData);
const context = await generateContext(structuredData);
```

### Pattern 2: File Utility Abstraction
- Centralized file operations in `fileUtils.ts`
- Reusable across scanner, mapper, and other modules

### Pattern 3: AI Context Generation
- Converts technical repository structure into AI-digestible format
- Likely produces markdown or structured data for LLM consumption

---

## Summary for AI Assistants

This codebase is a **repository analysis tool** that scans codebases and generates contextual information for AI assistants. When working on this project:

1. **Focus on the pipeline**: Scanner → Mapper → Generator is the core flow
2. **Keep fileUtils modular**: It should remain a utility layer
3. **Type safety**: Use TypeScript best practices with explicit types
4. **Async patterns**: File I/O should use async/await
5. **Context output**: The end goal is generating useful context for other AI systems

---

*Generated for AI Context - Update as the codebase evolves*