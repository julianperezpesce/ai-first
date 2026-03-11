# Incremental Analysis

AI-First supports incremental updates that refresh only changed files without requiring a full repository analysis. This enables self-healing context for AI agents.

## Why Incremental Updates?

Running `ai-first init` analyzes the entire repository, which can be slow for large codebases. Incremental updates:

- **Fast**: Only analyzes changed files
- **Efficient**: Updates only affected metadata
- **Continuous**: Keeps context fresh between analysis runs

## How It Works

1. **Detect Changes**: Uses `git diff` or filesystem timestamps
2. **Re-analyze**: Extracts symbols/dependencies from changed files
3. **Update Metadata**: Updates symbols, dependencies, features, flows
4. **Rebuild Graph**: Updates knowledge graph with changes

## Usage

### CLI Command

```bash
# Incremental update (uses git)
ai-first update

# Use filesystem timestamps instead of git
ai-first update --no-git

# Custom root directory
ai-first update --root /path/to/project

# JSON output
ai-first update --json
```

### Programmatic Usage

```typescript
import { 
  runIncrementalUpdate,
  detectChangedFiles,
  updateSymbols,
  updateFeatures,
  updateFlows
} from 'ai-first';

// Full incremental update
const result = runIncrementalUpdate('/path/to/project');

console.log(result.changedFiles);
console.log(result.updatedSymbols);
console.log(result.updatedFeatures);

// Or use individual functions
const changes = detectChangedFiles('/path/to/project');
const updated = updateSymbols('/path/to/project', changes, aiDir);
```

## Output

```
🔄 Running incremental update in: /path/to/project

📁 Changed files: 5
   modified: src/auth/login.ts
   modified: src/auth/userService.ts
   added: src/payments/checkout.ts
   deleted: src/old/legacy.ts

🔧 Updated:
   Symbols: 12
   Dependencies: 2
   Features: auth
   Flows: login
   Knowledge Graph: ✅
```

## API Reference

### runIncrementalUpdate(rootDir, aiDir?)

Performs full incremental update. Returns:

```typescript
{
  changedFiles: ChangedFile[];
  updatedSymbols: number;
  updatedDependencies: number;
  updatedFeatures: string[];
  updatedFlows: string[];
  graphUpdated: boolean;
  errors: string[];
}
```

### detectChangedFiles(rootDir, useGit?)

Detects changed files using git (default) or filesystem timestamps.

### updateSymbols(rootDir, changes, aiDir)

Re-extracts symbols from changed files and updates `ai/symbols.json`.

### updateDependencies(rootDir, changes, aiDir)

Re-extracts dependencies from changed package files.

### updateFeatures(rootDir, changes, aiDir)

Updates features that contain changed files.

### updateFlows(rootDir, changes, aiDir)

Updates flows that contain changed files.

### updateKnowledgeGraph(rootDir, aiDir)

Rebuilds the knowledge graph with current data.

## Self-Healing Context

Incremental updates enable self-healing context for AI agents:

1. Agent makes changes to codebase
2. Developer runs `ai-first update` 
3. AI context is refreshed with new/changed files
4. Agent's next query uses updated context

This creates a feedback loop where the AI context stays fresh without manual full re-analysis.
