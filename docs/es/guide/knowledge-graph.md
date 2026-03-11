# Grafo de Conocimiento

El Grafo de Conocimiento unifica toda la inteligencia del repositorio en un solo grafo navegable que los agentes IA pueden usar para entender la estructura y relaciones del código.

## Por qué un Grafo de Conocimiento?

El análisis tradicional de código produce salidas separadas (símbolos, dependencias, features, flows, actividad git). El Grafo de Conocimiento conecta todo:

- **Feature → Flow → File**: Entender qué features existen y cómo se conectan al código
- **File → Symbol → File**: Navegar relaciones del código
- **Commit → File**: Ver qué fue cambiado y por quién

## Estructura del Grafo

### Nodos

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feature` | Feature de negocio | `auth`, `payments` |
| `flow` | Flujo de ejecución | `login`, `checkout` |
| `file` | Archivo fuente | `src/auth/login.ts` |
| `symbol` | Símbolo de código | `src/auth/login.ts#login` |
| `commit` | Commit git | `commit:src/auth/login.ts` |

### Aristas

| Tipo | Desde | Hacia | Descripción |
|------|-------|-------|-------------|
| `contains` | feature | flow | Feature contiene este flow |
| `implements` | flow | file | Flow implementado en archivo |
| `declares` | file | symbol símbolo |
| ` | Archivo declarareferences` | symbol | file | Símbolo referencia archivo |
| `modifies` | commit | file | Commit modificó archivo |

## Uso

### Comando CLI

```bash
# Generar grafo de conocimiento
ai-first graph

# Mostrar estadísticas
ai-first graph --stats

# Salida como JSON
ai-first graph --json

# Directorio raíz personalizado
ai-first graph --root /path/to/project
```

### Uso Programático

```typescript
import {
  buildKnowledgeGraph,
  loadKnowledgeGraph,
  getNodesByType,
  getEdgesByType,
  getNeighbors
} from 'ai-first';

// Construir grafo
const graph = buildKnowledgeGraph('/path/to/project');

// Cargar grafo existente
const graph = loadKnowledgeGraph('/path/to/ai');

// Consultar por tipo
const features = getNodesByType(graph, 'feature');
const flows = getNodesByType(graph, 'flow');

// Consultar por tipo de arista
const modificaciones = getEdgesByType(graph, 'modifies');

// Navegar vecinos
const relacionados = getNeighbors(graph, 'auth');
```

## Salida

Genera `ai/graph/knowledge-graph.json`:

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

## Integración

El Grafo de Conocimiento funciona con otras salidas de AI-First:

1. **Features** de `ai/context/features/`
2. **Flows** de `ai/context/flows/`
3. **Actividad git** de `ai/git/`
4. **Símbolos** de `ai/symbols.json`
5. **Dependencias** de `ai/dependencies.json`

## Referencia API

### buildKnowledgeGraph(rootDir, aiDir?)

Construye y guarda el grafo de conocimiento.

### loadKnowledgeGraph(aiDir)

Carga un grafo de conocimiento existente.

### getNodesByType(graph, type)

Filtrar nodos por tipo (feature, flow, file, symbol, commit).

### getEdgesByType(graph, type)

Filtrar aristas por tipo (contains, implements, declares, references, modifies).

### getNeighbors(graph, nodeId)

Encontrar todos los nodos conectados a un nodo dado.
