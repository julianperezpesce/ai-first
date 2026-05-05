# Investigación de Ecosistema - Mayo 2026

> Lecciones de proyectos y sus issues para mejorar ai-first-cli

---

## 🔍 Nuevos Proyectos Descubiertos

| Proyecto | ⭐ | Lección para ai-first |
|----------|----|----------------------|
| **GitNexus** | 34K | Zero-server, browser-based. Issue: 200s para grafos grandes → **necesitamos paginación** |
| **ast-grep** | 13K | AST structural search como grep → **`af ast-search`** |
| **code-review-graph** | 9K | 6.8× menos tokens. Issue: auto-collapse oculta edges → **configurable threshold** |
| **Understand-Anything** | 8K | Knowledge graph interactivo. Issue: dashboard freezes → **Web Workers** |
| **cymbal** | ~300 | Tree-sitter SQLite, 9-33ms queries, 81-99% token savings → **inspiración directa** |
| **srclight** | ~100 | 42 MCP tools, GPU embeddings, hybrid search → **expandir MCP** |
| **code-memory** | 28 | 3 search modes (code/docs/history), local-first → **separar búsquedas** |
| **tree-sitter-analyzer** | ~50 | 17 langs, TOON format (56% token reduction) → **formato eficiente** |
| **grafema** | 25 | 30+ MCP tools, columnar graph DB → **grafo más eficiente** |
| **elastic/semantic-search** | ~200 | Production-grade, incremental updates → **indexado incremental** |

---

## 🐛 Issues que revelan problemas comunes

### Problema 1: Grafos grandes rompen todo
- **GitNexus #705**: 70MB response, 200s timeout para 58K símbolos
- **Understand-Anything #14**: 2,747 nodos → browser freezes
- **code-review-graph #132**: >300 nodos → auto-collapse rompe edges

**Solución para ai-first**: Implementar paginación/lazy loading en `af graph --html`.
Threshold configurable: mostrar resumen si >500 nodos, expandir on-demand.

### Problema 2: Tokens excesivos en AI agents
- **Understand-Anything #14**: 40% del quota en UN solo `/understand`
- **code-review-graph**: 6.8× token savings con grafo local

**Solución para ai-first**: 
- `af ask` ya devuelve snippets en vez de archivos completos
- Agregar TOON format (tree-sitter-analyzer: 56% token reduction)
- Implementar `af outline <file>` → estructura sin contenido

### Problema 3: Multi-repo manejo
- **GitNexus #635**: "Code not available" con múltiples repos

**Solución para ai-first**: Cada repo su propio `ai-context/`, 
soporte multi-repo con `af workspace`

### Problema 4: Embeddings rotos en UI
- **GitNexus #609**: Web UI reloads por embedding endpoint failure

**Solución para ai-first**: Mejorar `af serve` con health checks y graceful degradation.

---

## 💡 Mejoras concretas para ai-first

### 1. `af outline <file>` (de tree-sitter-analyzer)
```bash
af outline src/commands/ai-first.ts
# Devuelve estructura jerárquica sin el contenido:
# - runAIFirst() [async function, line 76]
#   - init flow [steps 1-15]
# - generateUnifiedContext() [function, line 419]
# 56% menos tokens que enviar el archivo completo
```

### 2. `af workspace` (de srclight)
```bash
af workspace add ./frontend ./backend ./shared
af workspace search "authentication"
af workspace index --all
```

### 3. `af ast-search` (de ast-grep)
```bash
af ast-search "function $NAME($$$) { $$$ }" --lang typescript
# Búsqueda estructural en vez de textual
```

### 4. Paginación en `af graph --html` (de GitNexus #705)
- Si >500 nodos: mostrar summary + search
- Expandir por comunidad/directorio on click
- Web Worker para layout computation

### 5. `af tldr <file>` (de grafema)
```bash
af tldr src/commands/ai-first.ts
# "CLI entry point. 1722 lines. 20+ commands handled via if/else chain.
#  Main flows: init → scan → analyze → generate. Key functions: runAIFirst(), generateUnifiedContext()"
```

### 6. Token budget tracking (de code-review-graph)
```bash
af init --budget 5000
# Limita el contexto generado a ~5000 tokens
# Prioriza secciones más útiles primero
```

---

## 📊 Matriz de priorización

| # | Mejora | Inspiración | Esfuerzo | Impacto |
|---|--------|------------|----------|---------|
| 1 | `af outline <file>` | tree-sitter-analyzer | Bajo | Alto (56% token savings) |
| 2 | Paginación en graph HTML | GitNexus #705 | Medio | Alto |
| 3 | `af workspace` | srclight | Medio | Alto |
| 4 | `af ast-search` | ast-grep | Alto | Medio |
| 5 | `af tldr <file>` | grafema | Bajo | Alto |
| 6 | `--budget` flag | code-review-graph | Bajo | Medio |

---

*Investigación basada en análisis de GitHub issues y repos, mayo 2026*
