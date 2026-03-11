# Lazy Context Generation

Lazy context generation improves CLI startup time by generating repository context in stages, only analyzing what's needed when it's needed.

## How It Works

### Stage 1: Minimal Index (Fast Startup)

When you run `ai-first init`, only essential metadata is generated:

- **repo-map**: Directory structure
- **languages**: Detected programming languages
- **frameworks**: Detected frameworks
- **entrypoints**: Application entry points

This stage is optimized for **fast startup** - typically under 1 second for most repositories.

### Stage 2: Full Context (On Demand)

Additional context is generated only when requested:

- **symbols**: Functions, classes, interfaces
- **dependencies**: Import relationships
- **features**: Business feature modules
- **flows**: Execution chains
- **knowledge graph**: Full repository graph

Trigger conditions:
- When a specific feature is accessed
- When the plugin requests detailed context
- When a CCP (Context Control Pack) is generated

## Performance Benefits

| Repository Size | Full Index | Lazy Index (Stage 1) |
|----------------|------------|----------------------|
| Small (50 files) | ~0.5s | ~0.1s |
| Medium (200 files) | ~2s | ~0.3s |
| Large (1000 files) | ~10s | ~1s |
| Huge (5000 files) | ~30s | ~3s |

**Time saved**: 70-90% for initial CLI startup

## Usage

### Default Behavior (Lazy)

```bash
ai-first init
# Generates minimal index only (~1s)
```

### Full Index (When Needed)

```bash
# Expand full context on demand
ai-first map
# or
ai-first context <symbol>
```

### Check Index State

```javascript
import { getLazyIndexState, hasMinimalIndex } from 'ai-first';

const aiDir = './ai';
console.log('Has minimal:', hasMinimalIndex(aiDir));

const state = getLazyIndexState(aiDir);
console.log('Stage 1:', state?.stage1Complete);
console.log('Stage 2:', state?.stage2Complete);
```

## API

### buildMinimalIndex(rootDir, aiDir)

Build Stage 1 minimal index:

```javascript
import { buildMinimalIndex } from 'ai-first';

const minimal = buildMinimalIndex('/path/to/project', '/path/to/project/ai');
console.log(minimal.languages); // ['TypeScript', 'JavaScript']
```

### expandFeatureContext(rootDir, aiDir, featureName)

Expand context for a specific feature:

```javascript
import { expandFeatureContext } from 'ai-first';

const result = expandFeatureContext('/path', '/path/ai', 'auth');
if (result.success) {
  console.log('Feature expanded:', result.files);
}
```

### expandFlowContext(rootDir, aiDir, flowName)

Expand context for a specific flow:

```javascript
import { expandFlowContext } from 'ai-first';

const result = expandFlowContext('/path', '/path/ai', 'login');
```

### expandFullContext(rootDir, aiDir)

Expand all context (Stage 2):

```javascript
import { expandFullContext } from 'ai-first';

const stats = expandFullContext('/path', '/path/ai');
console.log(stats);
// { symbols: 150, dependencies: 80, features: 5, flows: 3 }
```

## State Management

Lazy index state is stored in `ai/lazy-index-state.json`:

```json
{
  "stage1Complete": true,
  "stage2Complete": false,
  "featuresExpanded": ["auth", "users"],
  "flowsExpanded": ["login"],
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

## Integration

The lazy analyzer integrates with existing CLI commands:

- `ai-first init` - Stage 1 only (fast)
- `ai-first map` - Triggers Stage 2
- `ai-first context` - Expands specific context on demand
- `ai-first update` - Incremental updates maintain lazy state
