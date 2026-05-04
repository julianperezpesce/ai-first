# Lecciones de Proyectos para Mejorar ai-first-cli

> NO se trata de integrar, se trata de aprender qué hacen bien y traerlo a ai-first

---

## 1. Graphify → Mejorar detección de relaciones y visualización

### Lo que hacen bien:
- **AST-aware chunking con tree-sitter** (25 lenguajes) - extrae funciones, clases, imports, call graphs
- **Knowledge graph interactivo** (graph.html) con clustering Leiden
- **Query en lenguaje natural** sobre el grafo: `graphify query "what connects auth to db?"`
- **Multimodal**: PDFs, imágenes, videos, audio
- **Modo incremental** (`--update`): solo re-extrae archivos cambiados

### Mejoras para ai-first:
| Feature de Graphify | Cómo aplicarlo en ai-first |
|---------------------|---------------------------|
| tree-sitter AST chunking | Mejorar `symbols.ts` y `patternExtractor.ts` para usar tree-sitter en vez de regex |
| graph.html interactivo | Mejorar `af graph` con visualización HTML real (D3/vis.js) |
| Query natural | Nuevo comando: `af ask "¿cómo funciona auth?"` |
| --update incremental | Mejorar `af update` para solo re-analizar archivos cambiados |
| Clustering Leiden | Agregar agrupación de módulos por afinidad en `af explore` |
| Multimodal | Agregar extracción de texto de PDFs y Markdown |

---

## 2. ChromaDB / FAISS → Semantic Search

### Lo que hacen bien:
- **Búsqueda semántica**: encontrar código por significado, no por keywords
- **Persistencia local**: la DB vive en disco, no requiere servidor
- **Metadatos por chunk**: archivo, función, tipo, docstring

### Mejoras para ai-first:
| Feature | Cómo aplicarlo |
|---------|---------------|
| Semantic search | `af search "authentication flow"` → devuelve funciones relevantes |
| Embeddings locales | Usar `@xenova/transformers` (ya es dependencia) para generar embeddings |
| Index persistente | Guardar embeddings en el `index.db` SQLite que ya existe |
| Chunking inteligente | Dividir código por función con tree-sitter, guardar en `ai-context/chunks/` |

---

## 3. codeqai → Chat con el código

### Lo que hacen bien:
- **Chat con tu codebase**: preguntás en lenguaje natural y responde con código
- **Sync con git**: solo re-indexa archivos cambiados (compara hashes)
- **100% local**: sin APIs externas

### Mejoras para ai-first:
| Feature | Cómo aplicarlo |
|---------|---------------|
| Chat mode | `af chat` → CLI interactivo que responde preguntas sobre el código |
| Git-synced index | `af index` ya trackea cambios con hashes. Mejorarlo para actualizar solo diffs |
| Respuestas con snippets | Que `af ask` devuelva fragmentos de código, no solo nombres de archivos |

---

## 4. mcp-code-search → MCP Server enriquecido

### Lo que hacen bien:
- **Hybrid search**: vector + keyword combinado
- **Incremental indexing**: solo archivos nuevos/cambiados
- **Config file** (`.code-search.toml`): personalización por proyecto
- **20+ lenguajes** con tree-sitter

### Mejoras para ai-first:
| Feature | Cómo aplicarlo |
|---------|---------------|
| Hybrid search MCP | Agregar `search_code` tool al MCP server (semántico + texto) |
| `.ai-first.toml` | Config file más rico que el JSON actual |
| Incremental indexing | Mejorar `af index` para ser verdaderamente incremental |
| Más lenguajes | Expandir el parser TypeScript actual a tree-sitter multi-lenguaje |

---

## 5. claude-context-local → Zero-cost local

### Lo que hacen bien:
- **100% local, zero API costs**: embeddings con Gemma local
- **Per-project isolated index**: cada proyecto su propio `.code-search-index/`
- **MCP native**: se integra como tool de Claude Code
- **Plantilla lista**: un solo comando para instalar

### Mejoras para ai-first:
| Feature | Cómo aplicarlo |
|---------|---------------|
| Embeddings locales | Usar `@xenova/transformers` (all-MiniLM-L6-v2, 80MB) |
| Template auto-install | `af install --platform opencode` como Graphify |
| Zero-cost promise | Marketing: "100% local, sin API keys, sin costo" |
| Per-project index | `ai-context/index.db` ya es per-project. Mejorarlo |

---

## 📊 Plan de Mejoras Priorizado

### 🔴 Fase 1: Search + Chat (mayor impacto)
```bash
af search "how does authentication work"    # búsqueda semántica
af ask "explain the login flow"             # chat con contexto
```
- Usar `@xenova/transformers` (ya instalado) para embeddings
- Guardar en SQLite (ya tenemos index.db)
- Chunking por función con tree-sitter

### 🟡 Fase 2: Mejor detección (calidad)
- Reemplazar regex por tree-sitter en `symbols.ts` y `patternExtractor.ts`
- Soporte para 25+ lenguajes (hoy son ~10 con regex)
- Extracción de docstrings y comentarios (rationale)

### 🟢 Fase 3: Visualización + UX
- `af graph --html` → grafo interactivo tipo Graphify
- `af serve` → dashboard con búsqueda + grafo + contexto
- `af install --platform opencode` → auto-install

---

## 💡 La killer feature que NADIE tiene

**Contexto + Grafo + Búsqueda en UN solo comando**:

```bash
af understand "authentication"
# Devuelve:
# 1. Contexto: "Auth usa JWT con middleware en src/middleware/auth.ts"
# 2. Grafo: "AuthController → AuthService → UserRepository → Database"
# 3. Código: snippets de las funciones relevantes
# 4. Tests: "tests/auth.test.ts cubre login, register, refresh"
```

Ninguna herramienta hace esto hoy. Graphify da el grafo pero no el contexto. ChromaDB da búsqueda pero no el grafo. codeqai da chat pero no el contexto estructurado.

**ai-first sería la única que une las 3 cosas.**
