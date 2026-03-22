# Comparativa: Resultados Esperados vs Obtenidos

## 📊 Resumen de Escenarios de Prueba

| Bug | Escenario | Esperado | Obtenido | Estado |
|-----|-----------|----------|----------|--------|
| **A** | `index` genera index.db | ✅ Genera en `--root/ai/` | ✅ GENERA index.db (45KB) | ✅ CORREGIDO |
| **B** | `graph` sin git | ✅ Genera knowledge-graph.json | ✅ GENERA con static analysis | ✅ CORREGIDO |
| **C** | `query` encuentra símbolos | ✅ Encuentra símbolos | ✅ Encuentra AuthController | ✅ CORREGIDO |

---

## 🔍 Detalle por Bug

### Bug A: index command - Generación de index.db

| Aspecto | Antes (Bug) | Después (Corregido) |
|---------|-------------|---------------------|
| **Exit Code** | 0 (engañoso) | 0 |
| **Archivo generado** | ❌ NO se generaba | ✅ `test-projects/nestjs-backend/ai/index.db` |
| **Tamaño** | N/A | 45,056 bytes |
| **Contenido** | N/A | 36 files, 18 symbols, 23 imports |
| **Path** | Se generaba en `process.cwd()` | Se genera en `--root/ai/` |

**Verificación:**
```bash
# ANTES
$ ai-first index --root test-projects/nestjs-backend
EXIT: 0
$ ls test-projects/nestjs-backend/ai/index.db
ls: no such file or directory ❌

# DESPUÉS
$ node dist/commands/ai-first.js index --root test-projects/nestjs-backend
✅ Index created: test-projects/nestjs-backend/ai/index.db
EXIT: 0
$ ls -la test-projects/nestjs-backend/ai/index.db
-rw-r--r-- 1 julian julian 45056 index.db ✅
```

---

### Bug B: graph command - Sin repositorio git

| Aspecto | Antes (Bug) | Después (Corregido) |
|---------|-------------|---------------------|
| **Exit Code** | ❌ 1 | ✅ 0 |
| **Repositorio git** | ❌ REQUERIDO | ✅ OPCIONAL |
| **Archivo generado** | ❌ NO | ✅ `ai/graph/knowledge-graph.json` |
| **Contenido** | N/A | Nodes: 4, Edges: 9 |
| **Modo de operación** | N/A | Static analysis fallback |

**Verificación:**
```bash
# ANTES
$ ai-first graph --root test-projects/express-api
❌ "Not a git repository"
EXIT: 1 ❌

# DESPUÉS
$ node dist/commands/ai-first.js graph --root test-projects/express-api
⚠️  Not a git repository - generating graph from static analysis only
✅ Generated: ai/graph/knowledge-graph.json
EXIT: 0 ✅
```

**Contenido generado:**
```json
{
  "nodes": [
    { "id": "auth", "type": "feature" },
    { "id": "users", "type": "feature" },
    { "id": "login", "type": "flow" },
    { "id": "register", "type": "flow" }
  ],
  "edges": [
    { "source": "auth", "target": "login", "type": "contains" },
    { "source": "auth", "target": "register", "type": "contains" },
    { "source": "login", "target": "auth", "type": "implements" }
    // ... total 9 edges
  ]
}
```

---

### Bug C: query command - Búsqueda de símbolos

| Aspecto | Antes (Bug) | Después (Corregido) |
|---------|-------------|---------------------|
| **Exit Code** | ❌ 1 | ✅ 0 |
| **Index encontrado** | ❌ NO | ✅ SÍ |
| **Símbolos encontrados** | ❌ 0 | ✅ 1 (AuthController) |
| **Archivo index.db** | ❌ No existía en path correcto | ✅ Existe |

**Verificación:**
```bash
# ANTES
$ ai-first query symbol AuthController --root test-projects/nestjs-backend
❌ "Index not found"
EXIT: 1 ❌

# DESPUÉS
$ node dist/commands/ai-first.js query symbol AuthController --root test-projects/nestjs-backend
🔍 Searching for symbol: AuthController

Found symbols:

Name                | Type       | File                           | Line
-------------------|------------|--------------------------------|------
AuthController     | class     | src/auth/auth.controller.ts   | 6

Total: 1 symbols
EXIT: 0 ✅
```

---

## 📈 Métricas Comparativas Completas

### Comandos Funcionales (antes y después)

| Comando | Proyecto | Antes | Después | Mejora |
|---------|----------|-------|---------|--------|
| **init** | express-api | ✅ Exit 0 | ✅ Exit 0 | - |
| **init** | nestjs-backend | ✅ Exit 0 | ✅ Exit 0 | - |
| **init** | python-cli | ✅ Exit 0 | ✅ Exit 0 | - |
| **init** | react-app | ✅ Exit 0 | ✅ Exit 0 | - |
| **init** | salesforce-cli | ✅ Exit 0 | ✅ Exit 0 | - |
| **map** | express-api | ✅ 49 symbols | ✅ 49 symbols | - |
| **map** | nestjs-backend | ✅ 18 symbols | ✅ 18 symbols | - |
| **map** | python-cli | ✅ 14 symbols | ✅ 14 symbols | - |
| **map** | react-app | ✅ 40 symbols | ✅ 40 symbols | - |
| **map** | salesforce-cli | ✅ 7 symbols | ✅ 7 symbols | - |
| **index** | nestjs-backend | ❌ NO genera index.db | ✅ Genera index.db | 🔧 |
| **graph** | express-api | ❌ Exit 1 | ✅ Exit 0 | 🔧 |
| **query** | nestjs-backend | ❌ Exit 1 | ✅ Encuentra símbolos | 🔧 |

---

## 🎯 Resumen Ejecutivo

### Bugs corregidos: 3/3

| Bug | Descripción | Corrección |
|-----|-------------|-------------|
| **A** | index generaba en cwd | Se calcula outputPath desde rootDir |
| **B** | graph requería git | Se agregó static analysis fallback |
| **C** | query no hallaba index | Resuelto al corregir Bug A |

### Estado final: ✅ 100% FUNCIONAL

- 12 comandos probados
- 12 comandos funcionando correctamente
- 0 comandos fallando

---

*Documento generado: 2026-03-17*
