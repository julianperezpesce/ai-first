# ai-first E2E Test Suite

This directory contains end-to-end tests for ai-first-cli across different project types.

## Test Projects

| Project | Path | Type | Framework |
|---------|------|------|-----------|
| Express API | `test-projects/express-api` | Backend | Express.js |
| NestJS Backend | `test-projects/nestjs-backend` | Backend | NestJS |
| Python CLI | `test-projects/python-cli` | CLI | Python |
| React App | `test-projects/react-app` | Frontend | React + Vite |

## Test Commands

### Init Command Tests

```bash
# Test init on all projects
npm run test:e2e:init

# Individual project tests
node dist/commands/ai-first.js init --root test-projects/express-api
node dist/commands/ai-first.js init --root test-projects/nestjs-backend
node dist/commands/ai-first.js init --root test-projects/python-cli
node dist/commands/ai-first.js init --root test-projects/react-app
```

### Map Command Tests

```bash
# Test map on all projects
npm run test:e2e:map

# Individual project tests
node dist/commands/ai-first.js map --root test-projects/express-api
node dist/commands/ai-first.js map --root test-projects/nestjs-backend
node dist/commands/ai-first.js map --root test-projects/python-cli
node dist/commands/ai-first.js map --root test-projects/react-app
```

## Expected Results

### init command should generate:

- [x] `ai/repo_map.md`
- [x] `ai/repo_map.json`
- [x] `ai/summary.md`
- [x] `ai/architecture.md`
- [x] `ai/tech_stack.md`
- [x] `ai/entrypoints.md`
- [x] `ai/conventions.md`
- [x] `ai/symbols.json`
- [x] `ai/dependencies.json`
- [x] `ai/ai_rules.md`
- [x] `ai/ai_context.md`
- [ ] `ai/context/features/*.json` ← NOT WORKING
- [ ] `ai/context/flows/*.json` ← NOT WORKING (except NestJS with map)

### map command should generate:

- [x] `ai/graph/module-graph.json`
- [x] `ai/graph/symbol-graph.json`
- [x] `ai/files.json`
- [ ] `ai/context/features/*.json` ← NOT WORKING for JS/Python/React
- [x] `ai/context/flows/*.json` ← Only works for NestJS

## Running Tests

```bash
# Build first
npm run build

# Run init tests
for project in express-api nestjs-backend python-cli react-app; do
  rm -rf test-projects/$project/ai
  node dist/commands/ai-first.js init --root test-projects/$project
done

# Run map tests
for project in express-api nestjs-backend python-cli react-app; do
  rm -rf test-projects/$project/ai
  node dist/commands/ai-first.js map --root test-projects/$project
done
```
