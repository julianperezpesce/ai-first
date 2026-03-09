# Guía de Usuario de AI-First

Esta guía describe los principales comandos CLI disponibles en AI-First.

AI-First provee 6 comandos para generar contexto IA para tu repositorio. Cada comando sirve un propósito específico.

---

## ai-first init

Inicializa AI-First en el repositorio y genera todos los archivos de contexto.

```bash
ai-first init [options]

# O simplemente:
ai-first
```

**Qué hace:**
- Escanea todo el repositorio
- Genera 11 archivos de contexto con metadatos del proyecto
- Crea un documento de contexto IA unificado

**Opciones:**
- `-r, --root <dir>` — Directorio raíz (predeterminado: directorio actual)
- `-o, --output <dir>` — Directorio de salida (predeterminado: ./ai)
- `-h, --help` — Mostrar ayuda

**Cuándo usar:**
- Configuración inicial
- Cuando necesitas el contexto completo del proyecto
- Antes de comenzar a trabajar con un asistente de código IA

**Archivos de salida:**
- `ai_context.md` — Vista general unificada (empieza aquí)
- `repo_map.json` — Estructura legible por máquina
- `symbols.json` — Funciones/clases extraídas
- `dependencies.json` — Relaciones de imports
- `architecture.md` — Patrón de arquitectura
- `tech_stack.md` — Lenguajes y frameworks
- `entrypoints.md` — Puntos de entrada
- `conventions.md` — Convenciones de código
- `ai_rules.md` — Reglas específicas para IA

---

## ai-first index

Crea una base de datos SQLite para consultas rápidas de símbolos.

```bash
ai-first index [options]
```

**Qué hace:**
- Indexa todos los archivos fuente
- Extrae símbolos (funciones, clases, variables)
- Analiza relaciones de imports
- Guarda todo en una base de datos SQLite

**Opciones:**
- `-r, --root <dir>` — Directorio raíz (predeterminado: directorio actual)
- `-o, --output <path>` — Ruta de salida (predeterminado: ./ai/index.db)
- `-h, --help` — Mostrar ayuda

**Cuándo usar:**
- Bases de código grandes donde necesitas búsquedas rápidas
- Cuando quieres consultar símbolos programáticamente
- Como base para el comando `watch`

**Salida:**
- `index.db` — Base de datos SQLite con tablas para archivos, símbolos, imports y hashes

---

## ai-first watch

Monitorea cambios de archivos y actualiza el índice incrementalmente.

```bash
ai-first watch [options]
```

**Qué hace:**
- Observa cambios en el sistema de archivos
- Actualiza incrementalmente solo los archivos cambiados
- Mantiene un índice vivo durante el desarrollo

**Opciones:**
- `-r, --root <dir>` — Directorio raíz (predeterminado: directorio actual)
- `-o, --output <path>` — Ruta de salida (predeterminado: ./ai/index.db)
- `-d, --debounce <ms>` — Retraso de debounce (predeterminado: 300ms)
- `-h, --help` — Mostrar ayuda

**Cuándo usar:**
- Durante desarrollo activo
- Cuando quieres contexto siempre actualizado
- Sesiones de desarrollo prolongadas

**Características:**
- Actualizaciones incrementales (solo archivos cambiados se re-indexan)
- Seguimiento de hash de archivos para detección de cambios
- Actualizaciones con debounce para manejar cambios rápidos
- Presiona Ctrl+C para dejar de observar

---

## ai-first context

Genera archivos de contexto ligeros optimizados para LLMs.

```bash
ai-first context [options]
```

**Qué hace:**
- Crea un subconjunto enfocado de archivos de contexto
- Optimizado para consumo de modelos de lenguaje
- Más rápido que el comando `init` completo

**Opciones:**
- `-r, --root <dir>` — Directorio raíz (predeterminado: directorio actual)
- `-o, --output <dir>` — Directorio de salida (predeterminado: ./ai)
- `-h, --help` — Mostrar ayuda

**Cuándo usar:**
- Cuando necesitas contexto ligero y rápido
- Para tareas específicas de IA
- Cuando no necesitas el análisis completo

**Salida:**
- `repo_map.json` — Estructura de carpetas
- `symbols.json` — Símbolos exportados
- `dependencies.json` — Grafo de imports
- `ai_context.md` — Resumen optimizado para LLM

---

## ai-first summarize

Genera resúmenes jerárquicos del repositorio optimizados para navegación IA.

```bash
ai-first summarize [options]
```

**Qué hace:**
- Analiza la estructura del repositorio
- Crea resúmenes jerárquicos
- Genera metadatos enfocados en navegación

**Opciones:**
- `-r, --root <dir>` — Directorio raíz (predeterminado: directorio actual)
- `-o, --output <path>` — Ruta de salida (predeterminado: ./ai/hierarchy.json)
- `-h, --help` — Mostrar ayuda

**Cuándo usar:**
- Cuando necesitas una vista de alto nivel
- Para agentes IA que navegan bases de código
- Entendiendo la estructura de proyectos grandes

**Salida:**
- `hierarchy.json` conteniendo:
  - Resumen del repositorio (nombre, descripción, propósito)
  - Resúmenes de carpetas (propósito basado en nombres)
  - Resúmenes de archivos (exports, imports, clases/funciones clave)

---

## ai-first query

Consulta el índice SQLite para símbolos, imports y relaciones de archivos.

```bash
ai-first query <subcomando> [options]
```

**Qué hace:**
- Busca símbolos indexados
- Encuentra dependencias de archivos
- Muestra estadísticas del repositorio

**Subcomandos:**
- `symbol <nombre>` — Encontrar definiciones de símbolos por nombre
- `dependents <archivo>` — Encontrar archivos que dependen de un archivo
- `imports <archivo>` — Encontrar archivos importados por un archivo
- `exports <archivo>` — Encontrar exports en un archivo
- `files` — Listar todos los archivos indexados
- `stats` — Mostrar estadísticas del índice

**Opciones:**
- `-r, --root <dir>` — Directorio raíz (predeterminado: directorio actual)
- `-d, --db <path>` — Ruta de la base de datos (predeterminado: ./ai/index.db)

**Ejemplos:**
```bash
# Encontrar todas las funciones llamadas "handleSubmit"
ai-first query symbol handleSubmit

# Encontrar archivos que dependen de auth.ts
ai-first query dependents auth.ts

# Encontrar imports en un archivo
ai-first query imports utils.ts

# Mostrar estadísticas del índice
ai-first query stats
```

**Cuándo usar:**
- Encontrando funciones o clases específicas
- Entendiendo relaciones de código
- Explorando bases de código desconocidas

---

## Referencia Rápida

| Comando | Propósito | Salida |
|---------|-----------|--------|
| `init` | Generación de contexto completo | 11 archivos |
| `index` | Base de datos SQLite | index.db |
| `watch` | Actualizaciones en vivo | index.db (vivo) |
| `context` | Contexto ligero | 4 archivos |
| `summarize` | Vista jerárquica | hierarchy.json |
| `query` | Buscar en índice | Salida en terminal |

---

## Próximos Pasos

1. Ejecuta `ai-first init` para generar contexto inicial
2. Ejecuta `ai-first index` para consultas rápidas
3. Usa `ai-first query` para explorar tu base de código
4. Da `ai/ai_context.md` a tu asistente de IA

Para más información, consulta el [README](../README.es.md).
