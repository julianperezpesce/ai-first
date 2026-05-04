# AI-First + Graphify Integration Report

> Investigación real - Mayo 2026

---

## 1. Graphify (safishamsi/graphify) - 28K ⭐

**Qué hace**: Convierte cualquier carpeta (código, PDFs, imágenes, videos) en un **grafo de conocimiento consultable**. Soporta 25 lenguajes vía tree-sitter AST.

**Instalación**: `pip install graphifyy` (el CLI es `graphify`)

**Soporta nativamente OpenCode**: `graphify install --platform opencode`

**Flujo de 3 pasos**:
1. AST determinístico → estructura de código (sin LLM)
2. Transcripción de video/audio con Whisper local
3. Subagentes Claude en paralelo para docs/papers/imágenes

**Comandos clave**:
```bash
graphify query "what connects auth to the database?"
graphify path "UserService" "DatabasePool"
graphify explain "RateLimiter"
```

---

## 2. Herramientas de RAG Local

### ChromaDB (chroma-core/chroma) - 8K ⭐
**API simple para búsqueda semántica local**:
```python
import chromadb
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("code-search")
collection.add(ids=["func1"], documents=["def login(user, pass): ..."], metadatas=[{"file": "auth.py"}])
results = collection.query(query_texts=["authentication flow"], n_results=5)
```
- Persistencia local en disco
- Metadatos por chunk (archivo, función, tipo)
- Integración nativa con LangChain

### FAISS (facebookresearch/faiss) - 23K ⭐
**Alta performance, usado por codeqai y claude-context-local**:
- `faiss-cpu` para desarrollo, `faiss-gpu` para producción
- IndexFlatIP para búsqueda por cosine similarity
- 768 dimensiones típico (embedding models)

### LlamaIndex CodeSplitter - AST-aware chunking
```python
from llama_index.core.node_parser.text.code import CodeSplitter
splitter = CodeSplitter(language="python", chunk_lines=40, max_chars=1500)
chunks = splitter.split_text(code)
```
- Respeta boundaries de funciones/clases
- Extrae metadatos (file path, function name, docstring)
- Soporta 25+ lenguajes vía tree-sitter

---

## 3. Proyectos que ya hacen esto (inspiración)

| Proyecto | ⭐ | Stack | Lo que hace |
|----------|----|----|-------------|
| **codeqai** | 496 | Python/FAISS/tree-sitter | Semantic search + chat, sincronización git |
| **mcp-code-search** | ~50 | Python/LanceDB/tree-sitter | MCP server, hybrid search, 20+ lenguajes |
| **claude-context-local** | ~30 | Shell/FAISS/AST | 100% local, MCP server, Claude integración |
| **FarhanAliRaza** | ~100 | JS/FAISS/AST | Template para Claude Code, zero-cost |

**Lecciones de estos proyectos**:
- Todos usan **tree-sitter** para chunking AST-aware
- **FAISS** como vector store local (más rápido que Chroma)
- **MCP server** para exponer búsqueda a Claude/Cursor
- **Sincronización git** para actualizar solo archivos cambiados

---

## 4. Arquitectura de Integración Recomendada

```
┌──────────────────────────────────────────────────────────────┐
│  ai-first-cli v1.4.1                                         │
│  ├── ai-context/ (contexto estructurado)                     │
│  ├── symbols.json (funciones, clases)                        │
│  ├── dependencies.json (imports, relaciones)                 │
│  └── data-models.json (esquemas)                             │
├──────────────────────────────────────────────────────────────┤
│  Graphify                                                     │
│  ├── graph.json (grafo de conocimiento)                      │
│  ├── graph.html (visualización interactiva)                  │
│  └── GRAPH_REPORT.md (auditoría)                             │
├──────────────────────────────────────────────────────────────┤
│  RAG Layer (nuevo)                                           │
│  ├── ChromaDB o FAISS (vector store)                         │
│  ├── tree-sitter (AST chunking)                              │
│  └── sentence-transformers (embeddings locales)             │
├──────────────────────────────────────────────────────────────┤
│  AI Assistant (Claude Code / Cursor / OpenCode)              │
│  ├── graphify query "..." → respuesta del grafo              │
│  ├── af context → contexto estructurado                      │
│  └── semantic_search("...") → chunks de código relevantes    │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Plan de Implementación

### Fase 1: RAG básico (1-2 semanas)
```bash
af index --semantic --store chroma   # indexar código en ChromaDB
af search "authentication flow"       # búsqueda semántica
```
- Usar ChromaDB (más simple que FAISS para empezar)
- sentence-transformers con `all-MiniLM-L6-v2` (80MB, rápido)
- Chunking por función con tree-sitter (ya tienen TypeScript parser)

### Fase 2: MCP Server enriquecido (1 semana)
Agregar tools al MCP server:
- `search_code_semantic` → consulta ChromaDB
- `get_code_snippet` → devuelve función por nombre
- `find_similar_code` → encuentra código similar

### Fase 3: Integración Graphify (1 semana)
- `af export --format graphify` → exporta contexto como input de Graphify
- `graphify install --platform opencode` → activa skill
- CLAUDE.md con regla: "primero graphify query, luego af context, luego semantic_search"

### Fase 4: Dashboard unificado (2 semanas)
- `af serve` → dashboard local
- Muestra: contexto + grafo + búsqueda semántica
- Integración con graph.html de Graphify

---

## 6. CLAUDE.md Recomendado

```yaml
tools:
  - name: understand-codebase
    steps:
      - graphify query "$question"          # grafo de conocimiento
      - cat ai-context/ai_context.md        # contexto estructurado
      - af search "$question"               # búsqueda semántica (nuevo)
    
  - name: add-feature
    steps:
      - graphify path "$current" "$target"  # ruta entre componentes
      - af context --task "add-endpoint"    # contexto específico
      - af search "similar pattern"         # ejemplos existentes

hooks:
  post-edit:
    - af init --json                        # actualizar contexto
    - graphify ./ --update                  # actualizar grafo
    - python index_changed.py "$file"       # reindexar en ChromaDB
```

---

## 7. Dependencias Nuevas (a agregar)

```json
{
  "optionalDependencies": {
    "chromadb": "^0.5.0",
    "sentence-transformers": "^3.0.0",
    "tree-sitter": "^0.21.0",
    "graphifyy": "latest"
  }
}
```

---

*Reporte basado en investigación real de GitHub, mayo 2026*
*Proyectos analizados: Graphify (28K⭐), ChromaDB (8K⭐), FAISS (23K⭐), codeqai, mcp-code-search, claude-context-local*
