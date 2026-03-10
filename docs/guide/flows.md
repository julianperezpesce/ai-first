# Flow Detection

Flows represent business execution chains that traverse multiple architectural layers in your codebase.

## Overview

Flow detection identifies how data flows through your application from entrypoints to data access layers.

### Example Flow

```
LoginController → AuthService → UserRepository
```

This represents the typical three-tier architecture:
1. **API Layer**: LoginController (entrypoint)
2. **Service Layer**: AuthService (business logic)
3. **Data Layer**: UserRepository (persistence)

## Detection Methods

AI-First uses multiple fallback methods to detect flows:

### 1. Symbol Graph (Primary)

When symbol relationships are strong, flows are detected by analyzing:
- Function calls (`calls`)
- Module imports (`imports`)
- Symbol references (`references`)

**Requirements:**
- Symbol graph density ≥ 0.5
- At least 10 relationships

### 2. Folder Structure (Fallback)

When symbol graph is weak, flows are inferred from:
- File naming conventions (e.g., `authController.ts`, `authService.ts`)
- Grouping by feature prefix

**Example:**
- `authController.ts` → feature: `auth`
- `authService.ts` → belongs to `auth` flow
- `authRepository.ts` → belongs to `auth` flow

### 3. Import Analysis (Fallback)

Uses dependency analysis to trace execution paths:
1. Start from entrypoint files
2. Follow import statements
3. Build chain up to MAX_FLOW_DEPTH

## Configuration

### Limits

| Parameter | Value | Description |
|-----------|-------|-------------|
| `MAX_FLOW_DEPTH` | 5 | Maximum traversal depth |
| `MAX_FLOW_FILES` | 30 | Maximum files per flow |

### Entrypoints

Flows must start from one of these file types:
- Controller
- Route
- Handler
- Command

### Layers

Supported architectural layers:
| Layer | Patterns |
|-------|----------|
| api | controller, handler, route, router, endpoint |
| service | service, services, usecase, interactor |
| data | repository, repo, dal, dao, data, persistence |
| domain | model, entity, schema, domain |

## Requirements

A valid flow must have:
- **Minimum 3 files**
- **Minimum 2 architectural layers**

## Output Format

Flows are written to: `ai/context/flows/<flow-name>.json`

```json
{
  "name": "auth",
  "entrypoint": "api/authController.js",
  "files": [
    "api/authController.js",
    "services/authService.js",
    "data/authRepository.js"
  ],
  "depth": 3,
  "layers": ["api", "service", "data"]
}
```

### Output Fields

| Field | Description |
|-------|-------------|
| `name` | Flow identifier (derived from entrypoint) |
| `entrypoint` | Starting file (Controller/Route/Handler/Command) |
| `files` | All files in the flow chain |
| `depth` | Actual traversal depth |
| `layers` | Unique layers traversed |

## Usage

Flows are automatically generated when running:

```bash
ai-first map
# or
ai-first init
```

## Integration

Flows work with Features to provide complete context:

- **Features**: Identify business modules (auth, users, payments)
- **Flows**: Identify how code executes within features

Together they enable AI agents to:
1. Understand business domain structure
2. Trace execution paths
3. Locate relevant code for modifications
