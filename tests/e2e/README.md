# ai-first E2E Test Suite

This directory contains end-to-end tests for ai-first-cli across different project types.

## Test Projects

| Project | Path | Type | Framework |
|---------|------|------|-----------|
| Express API | `fixtures/express-api` | Backend | Express.js |
| NestJS Backend | `fixtures/nestjs-backend` | Backend | NestJS |
| Python CLI | `fixtures/python-cli` | CLI | Python |
| React App | `fixtures/react-app` | Frontend | React + Vite |

## Test Commands

### Init Command Tests

```bash
# Test init on all projects
npm run test:e2e:init

# Individual project tests
node dist/commands/ai-first.js init --root fixtures/express-api
node dist/commands/ai-first.js init --root fixtures/nestjs-backend
node dist/commands/ai-first.js init --root fixtures/python-cli
node dist/commands/ai-first.js init --root fixtures/react-app
```

### Map Command Tests

```bash
# Test map on all projects
npm run test:e2e:map

# Individual project tests
node dist/commands/ai-first.js map --root fixtures/express-api
node dist/commands/ai-first.js map --root fixtures/nestjs-backend
node dist/commands/ai-first.js map --root fixtures/python-cli
node dist/commands/ai-first.js map --root fixtures/react-app
```

## Expected Results

### init command should generate:

- [x] `ai-context/repo_map.md`
- [x] `ai-context/repo_map.json`
- [x] `ai-context/summary.md`
- [x] `ai-context/architecture.md`
- [x] `ai-context/tech_stack.md`
- [x] `ai-context/entrypoints.md`
- [x] `ai-context/conventions.md`
- [x] `ai-context/symbols.json`
- [x] `ai-context/dependencies.json`
- [x] `ai-context/ai_rules.md`
- [x] `ai-context/ai_context.md`
- [ ] `ai-context/context/features/*.json` ← NOT WORKING
- [ ] `ai-context/context/flows/*.json` ← NOT WORKING (except NestJS with map)

### map command should generate:

- [x] `ai-context/graph/module-graph.json`
- [x] `ai-context/graph/symbol-graph.json`
- [x] `ai-context/files.json`
- [ ] `ai-context/context/features/*.json` ← NOT WORKING for JS/Python/React
- [x] `ai-context/context/flows/*.json` ← Only works for NestJS

## Running Tests

```bash
# Build first
npm run build

# Run init tests
for project in express-api nestjs-backend python-cli react-app; do
  rm -rf fixtures/$project/ai-context fixtures/$project/ai
  node dist/commands/ai-first.js init --root fixtures/$project
done

# Run map tests
for project in express-api nestjs-backend python-cli react-app; do
  rm -rf fixtures/$project/ai-context fixtures/$project/ai
  node dist/commands/ai-first.js map --root fixtures/$project
done
```
