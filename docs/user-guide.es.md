# Guía de Usuario de AI-First

Esta guía describe los principales comandos CLI disponibles en AI-First.

---

## ai-first init

Inicializa AI-First en el repositorio.

Crea archivos de configuración y prepara el proyecto para navegación IA.

**Qué hace:**
- Escanea el repositorio
- Genera archivos de contexto con metadatos del proyecto
- Crea ai_context.md con vista general unificada

**Archivos creados:**
- ai_context.md
- repo_map.json
- symbols.json
- dependencies.json
- architecture.md
- tech_stack.md
- entrypoints.md
- conventions.md
- ai_rules.md
- summary.md
- repo_map.md

**Cuándo usar:**
- Configuración inicial
- Cuando necesitas el contexto completo del proyecto

---

## ai-first index

Indexa el repositorio para permitir búsquedas inteligentes de código.

**Procesos:**
- archivos fuente
- módulos
- estructura del proyecto
- dependencias

**Salida:**
- index.db (base de datos SQLite)

**Cuándo usar:**
- Bases de código grandes
- Cuando necesitas consultas rápidas de símbolos

---

## ai-first summarize

Genera un mapa de arquitectura de alto nivel del repositorio.

**Qué crea:**
- hierarchy.json con estructura del repositorio
- Resúmenes de carpetas basados en patrones de nombres
- Resúmenes de archivos con exports e imports

**Cuándo usar:**
- Incorporación de desarrolladores
- Agentes IA
- Documentación

---

## ai-first context

Genera archivos de contexto ligeros optimizados para LLMs.

**Salida:**
- repo_map.json
- symbols.json
- dependencies.json
- ai_context.md

**Cuándo usar:**
- Generación de contexto rápido
- Tareas específicas de IA

---

## ai-first watch

Monitorea cambios de archivos y actualiza el índice incrementalmente.

**Características:**
- Actualizaciones incrementales
- Seguimiento de hash de archivos
- Actualizaciones con debounce

**Cuándo usar:**
- Durante desarrollo activo
- Sesiones de desarrollo prolongadas

---

## ai-first query

Consulta el índice SQLite para símbolos, imports y relaciones de archivos.

**Subcomandos:**
- symbol <nombre> - Encontrar definiciones de símbolos
- dependents <archivo> - Encontrar archivos dependientes
- imports <archivo> - Encontrar archivos importados
- exports <archivo> - Encontrar exports
- files - Listar archivos indexados
- stats - Mostrar estadísticas del índice

**Cuándo usar:**
- Encontrando funciones o clases específicas
- Entendiendo relaciones de código

---

Para más información, consulta el [README](../README.es.md).
