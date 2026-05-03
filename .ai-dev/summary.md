# Repository Summary
- **Total files**: 565
- **Main project files**: ~160 (excluding test-projects)
- **Test project files**: ~404 (in test-projects/)

## Files by Extension (Main Project Only)
  - .ts: 70 (TypeScript - main language)
  - .json: 20 (config files)
  - .md: 30 (documentation)
  - .js: 7 (JavaScript - CLI output)
  - .css: 1 (docs styling)
  - .test.ts: 8 (tests)

## Main Directories
| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/` | 49 | Main source code (TypeScript) |
| `src/commands/` | 3 | CLI commands |
| `src/core/` | 20 | Core business logic |
| `src/core/adapters/` | 12 | Framework adapters |
| `src/analyzers/` | 9 | Code analyzers |
| `tests/` | 8 | Unit tests |
| `docs/` | 32 | VitePress documentation |
| `examples/` | 4 | Usage examples |
| `test-projects/` | 404 | Sample projects for testing |

## Project Structure
```
ai-first/
├── src/                    # Main source (TypeScript)
│   ├── commands/           # CLI commands
│   ├── core/               # Business logic
│   │   └── adapters/       # Framework plugins
│   ├── analyzers/          # Code analysis
│   └── utils/              # Shared utilities
├── tests/                  # Unit tests
├── docs/                   # Documentation (VitePress)
├── examples/               # Usage examples
├── test-projects/          # Sample projects (excluded from analysis)
└── package.json            # Project config
```

## Key Files
- `src/commands/ai-first.ts` - CLI entry point
- `src/core/aiContextGenerator.ts` - Main context generator
- `src/core/repoScanner.ts` - Repository scanner
- `src/index.ts` - Library exports
- `package.json` - Project configuration
