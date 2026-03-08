# Changelog & Roadmap

All notable changes to `ai-first` will be documented in this file.

---

## [Unreleased]

### Added
- `symbols.json` - Extracts functions, classes, interfaces from code
- `dependencies.json` - Analyzes import/require dependencies between files
- `ai_rules.md` - Generates guidelines for AI assistants
- `repo_map.json` - Machine-readable repository structure
- Support for `init` command

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

### Phase 3 (Planned)
- [ ] Support for more languages (PHP, Ruby, Scala)
- [ ] Configuration file support (`ai-first.config.json`)
- [ ] Custom rules/plugins system
- [ ] CI/CD integration templates

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
