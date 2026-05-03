# AI-First CLI - New Features Documentation

## Overview

This document describes the new features added to ai-first-cli for enhanced AI context generation.

---

## New Context Sections

### Quick Start
Automatically extracts setup commands from your project configuration.

**Detected from**: `package.json`, `Makefile`, `requirements.txt`, `pyproject.toml`, `Gemfile`, `pom.xml`, `build.gradle`, `Cargo.toml`, `go.mod`

**Output**:
```markdown
## Quick Start
| Command | Value |
|---------|-------|
| Install | `npm install` |
| Dev | `npm run dev` |
| Test | `npm test` |

**Requirements**: Node.js >=18.0.0

**Environment Variables**:
| Variable | Required | Default |
|----------|----------|---------|
| PORT | Yes | - |
| DATABASE_URL | Yes | - |
```

---

### Key Dependencies
Extracts dependency versions from package managers.

**Supported**: npm, pip, Bundler, Maven, Gradle, Cargo, Go modules

**Output**:
```markdown
## Key Dependencies
| Package | Version | Source |
|---------|---------|--------|
| express | ^4.18.2 | package.json |
| djangorestframework | >=3.14.0 | requirements.txt |
```

---

### Data Models
Extracts data model schemas from ORMs and frameworks.

**Supported frameworks**:
- Django (models.py)
- SQLAlchemy (models.py)
- TypeORM (.entity.ts)
- Mongoose (.model.ts)
- Prisma (schema.prisma)
- GORM (.go structs)

**Output**:
```markdown
## Data Models
### Post (Django)
| Field | Type | Required | Unique |
|-------|------|----------|--------|
| title | CharField | Yes | No |
| content | TextField | Yes | No |

**Relationships**: belongsTo User, hasMany Comment
```

---

### Test Coverage Map
Maps source files to their corresponding test files.

**Detection patterns**: `*.test.ts`, `*.spec.ts`, `test_*.py`, `*_test.go`, `*Test.java`

**Output**:
```markdown
## Test Coverage Map
- `controllers/authController.js` → `tests/authController.test.js`
- `services/userService.js` → `tests/userService.test.js`
```

---

### Cross-Cutting Concerns
Detects common architectural patterns across the codebase.

**Detected patterns**:
- **Auth**: JWT, Passport, Django Auth, NestJS Guards
- **Logging**: Winston, Pino, Bunyan, Python logging, NestJS Logger
- **Error Handling**: Custom AppError, HttpException, Express error handler
- **Validation**: Joi, Zod, class-validator, Pydantic, Yup
- **Caching**: Redis, Memcached, Spring Cache, Django Cache

---

### Configuration Analysis
Analyzes project configuration files.

**Detected**: TypeScript, ESLint, Prettier, Testing framework, Docker

**Output**:
```markdown
## Configuration
- TypeScript: strict=true, target=ES2022
- ESLint: airbnb
- Prettier: semi=true, singleQuote=true
- Testing: Vitest
- Docker: node:18-alpine
```

---

### Recent Activity
Shows recent git activity and active contributors.

**Output**:
```markdown
## Recent Activity
**Last commit**: feat: add new feature (Julian, 2026-05-02)

**Active contributors**: Julian (24 commits), Maria (12 commits)

**Recently modified**: `src/commands/ai-first.ts`, `src/utils/newFeature.ts`
```

---

### Code Notes
Extracts TODO, FIXME, HACK, and WARNING comments from code.

**Output**:
```markdown
## Code Notes
**TODOs**:
- `src/core/indexer.ts:45`: Add support for Go modules
- `src/analyzers/symbols.ts:89`: Improve type inference

**FIXMEs**:
- `src/commands/ai-first.ts:234`: Handle edge case for empty projects
```

---

### Code Patterns
Extracts real code examples from your codebase.

**Detected patterns**: Controllers, Services, Models, Middleware, Error handling, Tests

**Output**:
```markdown
## Code Patterns
### Controller pattern from authController.js
```javascript
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.login(email, password);
  res.json({ success: true, data: user });
});
```
```

---

### Security Notes
Detects potential security issues in the codebase.

**Detected issues**:
- SQL injection (string interpolation/concatenation in queries)
- XSS (innerHTML, dangerouslySetInnerHTML)
- Code injection (eval(), Function())
- CORS misconfiguration
- Hardcoded credentials
- Weak cryptography (MD5)
- Command injection

---

### Performance Notes
Detects potential performance issues.

**Detected issues**:
- Nested loops
- Unbounded queries (SELECT * without LIMIT)
- Sequential awaits (should use Promise.all)
- Synchronous file reads in async context
- RegExp creation inside loops

---

### CI/CD Pipeline
Detects CI/CD configuration.

**Supported platforms**: GitHub Actions, GitLab CI, Jenkins, CircleCI, Azure Pipelines

**Output**:
```markdown
## CI/CD Pipeline
**Platform**: GitHub Actions

- **ci.yml**: push, pull_request → build, test, lint
- **deploy.yml**: release → deploy
```

---

### Database Migrations
Detects database migration files.

**Supported frameworks**: Django, Knex, Prisma, Flyway, Alembic, Rails

**Output**:
```markdown
## Database Migrations
**Framework**: Django
**Migrations**: 12
**Tables**: users, posts, comments, roles
```

---

### Documentation Coverage
Analyzes documentation coverage in the codebase.

**Detects**: JSDoc comments, Python docstrings

**Output**:
```markdown
## Documentation Coverage
Documentation coverage: 37% (45/120 items documented)
```

---

### Potentially Unused Code
Detects potentially unused exports and files.

**Detection**: Exports that are never imported by other files

**Output**:
```markdown
## Potentially Unused Code
**Functions**: `oldHelper`, `deprecatedFunction`
**Classes**: `LegacyAdapter`
```

---

### Context Changes
Shows what changed between context generation runs.

**Output**:
```markdown
## Context Changes
3 new files, 2 modified files, 1 new dependency, +45 symbols
```

---

## New Commands

### Task-Specific Context
Generate context tailored to a specific development task.

**Usage**:
```bash
af context --task "add-endpoint"
af context --task "fix-auth-bug" --format markdown
af context --task "add-model" --save
```

**Supported tasks**:
- `add-endpoint` / `add-api` / `add-route` - For adding new API endpoints
- `add-model` / `add-schema` / `add-entity` - For adding data models
- `fix-auth` / `fix-login` / `fix-jwt` - For authentication-related work
- `fix-bug` / `fix-error` - For bug fixing
- `refactor` / `clean` / `improve` - For code refactoring
- `test` / `spec` - For writing tests

**Output formats**: `json`, `markdown`, `text`

---

## New Output Files

| File | Description |
|------|-------------|
| `setup.json` | Project setup commands and requirements |
| `dependency-versions.json` | Dependency versions from package managers |
| `test-mapping.json` | Source to test file mapping |
| `data-models.json` | Data model schemas |
| `recent-changes.json` | Recent git activity |
| `cross-cutting.json` | Cross-cutting concern patterns |
| `config-analysis.json` | Configuration file analysis |
| `gotchas.json` | TODO, FIXME, HACK comments |
| `impact-analysis.json` | Dependency impact analysis |
| `code-patterns.json` | Code pattern examples |
| `anti-patterns.json` | Anti-pattern detection |
| `security-audit.json` | Security issue detection |
| `performance.json` | Performance issue detection |
| `context-diff.json` | Context change tracking |
| `dead-code.json` | Unused code detection |
| `doc-coverage.json` | Documentation coverage |
| `cicd.json` | CI/CD pipeline configuration |
| `migrations.json` | Database migration info |

---

## Salesforce Improvements

### Feature Detection
The Salesforce adapter now detects 4 feature types instead of 1:

| Feature | Files |
|---------|-------|
| `apex-classes` | `.cls` files in `/classes/` |
| `apex-triggers` | `.trigger` files in `/triggers/` |
| `lwc` | Lightning Web Components in `/lwc/` |
| `aura` | Aura Components in `/aura/` |

### Supported Metadata
- Apex Classes (with annotations, methods, sharing modes)
- Apex Triggers (all 7 trigger events)
- LWC Components (JS, HTML, CSS, metadata)
- Aura Components (CMP, Controller, Helper)
- Flows (Screen, Record-triggered)
- Custom Objects (8 field types)
- Permission Sets (with field-level security)
- Visualforce Pages
- Platform Events
- Custom Metadata Types
- @InvocableMethod/@InvocableVariable
- Batch/Schedulable/Queueable patterns

---

## CI/CD Pipeline

### GitHub Actions CI
Runs on: push to master/main/beta, pull requests

**Jobs**:
- **test**: Runs tests on Node.js 18, 20, 22
- **lint**: TypeScript type checking
- **e2e**: End-to-end tests

### GitHub Actions Publish
Runs on: GitHub releases

**Steps**: Install → Build → Test → Publish to npm
