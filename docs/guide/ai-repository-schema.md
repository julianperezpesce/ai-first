# AI Repository Schema

The AI Repository Schema standardizes how AI-First stores and manages repository metadata, enabling AI agents to understand project structure and maintain compatibility across versions.

## Overview

AI-First generates three core schema files that define the project structure:

- `schema.json` - Schema version and metadata
- `project.json` - Project information (features, flows, languages, frameworks)
- `tools.json` - Compatible AI tools and agents

## Schema Files

### schema.json

Contains schema version and generation metadata:

```json
{
  "schemaVersion": "1.0",
  "generatedBy": "ai-first",
  "generatedAt": "2024-01-15T10:30:00.000Z"
}
```

### project.json

Contains project-specific information:

```json
{
  "name": "my-project",
  "rootDir": "/path/to/project",
  "features": ["auth", "users", "payments"],
  "flows": ["login", "checkout", "registration"],
  "languages": ["TypeScript", "Python"],
  "frameworks": ["Express", "React"],
  "generatedAt": "2024-01-15T10:30:00.000Z"
}
```

### tools.json

Defines compatible AI agents:

```json
{
  "compatibleAgents": ["ai-first-bridge", "opencode", "cursor", "windsurf", "cline"],
  "schemaVersion": "1.0"
}
```

## Auto-Detection

AI-First automatically detects:

- **Features**: From `ai/context/features/*.json` files
- **Flows**: From `ai/context/flows/*.json` files
- **Languages**: From `ai/tech_stack.md` (Languages section)
- **Frameworks**: From `ai/tech_stack.md` (Frameworks section)

## Version Compatibility

The schema uses semantic versioning. AI-First validates compatibility:

- Same major version = compatible
- Different major version = incompatible

## CLI Commands

### Generate Schema

Schema is automatically generated with `ai-first init`:

```bash
ai-first init
```

### Validate Schema

Check if your repository has a valid schema:

```javascript
import { validateSchema } from 'ai-first';

const result = validateSchema('./ai');
console.log(result.valid);  // true/false
console.log(result.errors); // []
```

### Load Schema

Load schema programmatically:

```javascript
import { loadFullSchema } from 'ai-first';

const schema = loadFullSchema('./ai');
if (schema) {
  console.log(schema.project.name);
  console.log(schema.schema.schemaVersion);
}
```

## Integration

The schema is integrated into the AI-First CLI:

1. `ai-first init` - Generates schema files
2. `ai-first validate` - Validates schema (coming soon)
3. `ai-first doctor` - Checks schema health

## Benefits

- **Version Safety**: AI agents know which schema version to expect
- **Project Discovery**: Features and flows are automatically detected
- **Agent Compatibility**: Clear list of supported AI tools
- **Extensibility**: Schema can be extended for custom agents
