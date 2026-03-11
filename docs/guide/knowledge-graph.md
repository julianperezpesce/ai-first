# Knowledge Graph

The Knowledge Graph unifies all repository intelligence into a single navigable graph that AI agents can use to understand codebase structure and relationships.

## Why a Knowledge Graph?

Traditional code analysis produces separate outputs (symbols, dependencies, features, flows, git activity). The Knowledge Graph connects everything:

- **Feature → Flow → File**: Understand what features exist and how they connect to code
- **File → Symbol → File**: Navigate code relationships
- **Commit → File**: See what was changed and by whom

## Graph Structure

### Nodes

| Type | Description | Example |
|------|-------------|---------|
| `feature` | Business feature | `auth`, `payments` |
| `flow` | Execution flow | `login`, `checkout` |
| `file` | Source file | `src/auth/login.ts` |
| `symbol` | Code symbol | `src/auth/login.ts#login` |
| `commit` | Git commit | `commit:src/auth/login.ts` |

### Edges

| Type | From | To | Description |
|------|------|-----|-------------|
| `contains` | feature | flow | Feature contains this flow |
| `implements` | flow | file | Flow implemented in file |
| `declares` | file | symbol | File declares symbol |
| `references` | symbol | file | Symbol references file |
| `modifies` | commit | file | Commit modified file |

## Usage

### CLI Command

```bash
# Generate knowledge graph
ai-first graph

# Show statistics
ai-first graph --stats

# Output as JSON
ai-first graph --json

# Custom root directory
ai-first graph --root /path/to/project
```

### Programmatic Usage

```typescript
import {
  buildKnowledgeGraph,
  loadKnowledgeGraph,
  getNodesByType,
  getEdgesByType,
  getNeighbors
} from 'ai-first';

// Build graph
const graph = buildKnowledgeGraph('/path/to/project');

// Load existing graph
const graph = loadKnowledgeGraph('/path/to/ai');

// Query by type
const features = getNodesByType(graph, 'feature');
const flows = getNodesByType(graph, 'flow');

// Query by edge type
const modifications = getEdgesByType(graph, 'modifies');

// Navigate neighbors
const related = getNeighbors(graph, 'auth');
```

## Output

Generates `ai/graph/knowledge-graph.json`:

```json
{
  "nodes": [
    { "id": "auth", "type": "feature", "label": "auth" },
    { "id": "login", "type": "flow", "label": "login" },
    { "id": "src/auth/login.ts", "type": "file", "label": "login.ts" }
  ],
  "edges": [
    { "from": "auth", "to": "login", "type": "contains" },
    { "from": "login", "to": "src/auth/login.ts", "type": "implements" }
  ],
  "metadata": {
    "generated": "2026-03-11T12:00:00.000Z",
    "sources": ["features", "flows", "git", "symbols"],
    "nodeCount": 150,
    "edgeCount": 450
  }
}
```

## Integration

The Knowledge Graph works with other AI-First outputs:

1. **Features** from `ai/context/features/`
2. **Flows** from `ai/context/flows/`
3. **Git activity** from `ai/git/`
4. **Symbols** from `ai/symbols.json`
5. **Dependencies** from `ai/dependencies.json`

## API Reference

### buildKnowledgeGraph(rootDir, aiDir?)

Builds and saves the knowledge graph.

### loadKnowledgeGraph(aiDir)

Loads an existing knowledge graph.

### getNodesByType(graph, type)

Filter nodes by type (feature, flow, file, symbol, commit).

### getEdgesByType(graph, type)

Filter edges by type (contains, implements, declares, references, modifies).

### getNeighbors(graph, nodeId)

Find all nodes connected to a given node.
