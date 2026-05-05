# ai-first

<p align="center">
  <a href="https://github.com/julianperezpesce/ai-first/stargazers">
    <img src="https://img.shields.io/github/stars/julianperezpesce/ai-first?style=flat&color=ffd700" alt="Stars">
  </a>
  <a href="https://www.npmjs.com/package/ai-first-cli">
    <img src="https://img.shields.io/npm/dt/ai-first-cli?color=blue" alt="NPM Downloads">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  </a>
  <a href="https://github.com/julianperezpesce/ai-first/issues">
    <img src="https://img.shields.io/github/issues/julianperezpesce/ai-first" alt="Issues">
  </a>
</p>

[English](./README.md)

AI-First es un CLI y servidor MCP que le da a los agentes de código IA una comprensión compacta y verificable de un repositorio antes de editarlo.

Genera `ai-context/` con arquitectura, símbolos, entrypoints, tests, dependencias, reglas, riesgos, metadata de frescura y un brief para agentes. También expone el mismo contexto mediante herramientas MCP para agentes compatibles con Model Context Protocol.

Release train actual: `v1.5`.

El objetivo no es crear más archivos de documentación. El objetivo es ayudar a un agente a responder: **qué es este repo, dónde debería trabajar, qué evidencia sostiene eso y cómo verifico mi cambio?**

## Por Qué Existe

Los agentes IA funcionan mejor cuando empiezan con contexto confiable en lugar de leer un subconjunto aleatorio de archivos. AI-First se enfoca en:

- Frescura: el contexto generado registra cuándo y desde qué estado de git/archivos fue creado.
- Evidencia: los datos importantes incluyen paths, referencias a package/config, razones y confianza.
- Foco por tarea: los agentes pueden pedir contexto para una tarea específica sin cargar todo el repo.
- Interfaces compartidas: humanos usan el CLI; agentes usan MCP; ambos comparten servicios core.
- Quality gates: CI y agentes pueden verificar si el repo y el contexto generado son confiables.

## Instalación

```bash
npm install -g ai-first-cli
```

Requisitos:

- Node.js 18+
- Git recomendado para frescura y análisis de cambios

El comando principal es `af`. El nombre legacy `ai-first` también funciona.

## Inicio en 30 Segundos

```bash
af init
af verify ai-context
```

Luego dale a tu agente uno de estos archivos/comandos:

- `ai-context/agent_brief.md` para un brief operativo corto.
- `ai-context/ai_context.md` para el contexto unificado del repositorio.
- `af context --task "add CLI command" --format markdown` para guía específica por tarea.

Prompt recomendado para agentes:

```text
Lee ai-context/agent_brief.md primero. Verifica si ai-context está fresco antes de confiar en él. Luego inspecciona los archivos fuente relevantes antes de editar.
```

## Flujos Principales

### Para Humanos

```bash
# Generar contexto del repositorio
af init

# Verificar si el contexto sigue fresco
af doctor context

# Auditar la calidad del contexto generado
af verify ai-context --json

# Obtener guía enfocada para un cambio
af context --task "fix MCP tool" --format markdown

# Entender un tema o flujo
af understand "auth login" --format json

# Ejecutar quality gates para IA/CI
af doctor --ci --json
```

### Para Agentes IA

Usa la herramienta más pequeña que responda la tarea:

| Necesidad | Preferir |
|-----------|----------|
| Iniciar una sesión en un repo | `get_project_brief` |
| Verificar si el contexto generado es confiable | `is_context_fresh`, `verify_ai_context` |
| Entender una feature, flujo o tema | `understand_topic` |
| Agregar o cambiar comportamiento | `get_context_for_task` |
| Trabajar sobre un archivo conocido | `get_context_for_file` |
| Buscar símbolos | `query_symbols` |
| Sugerir tests | `suggest_tests` |
| Verificar preparación para merge/release | `get_quality_gates` |

Consulta el [AI Agent Playbook](./docs/guide/ai-agent-playbook.md) para el orden recomendado de llamadas y reglas de confianza.

### Para Clientes MCP

Instala un perfil MCP local:

```bash
af install --list
af install --platform opencode
af install --platform codex
af install --platform claude-code
af install --platform cursor
af mcp doctor --json
```

Inicia el servidor stdio manualmente:

```bash
af mcp --root .
```

Inicia el servidor Streamable HTTP:

```bash
af mcp --transport http --host 127.0.0.1 --port 3847
```

El modo HTTP soporta bearer tokens:

```bash
AI_FIRST_MCP_TOKEN=secret af mcp --transport http --port 3847
```

La compatibilidad MCP depende del cliente. Una herramienta puede usar AI-First si soporta MCP local por stdio o MCP Streamable HTTP y puede cargar la configuración correspondiente. Consulta la [guía MCP](./docs/guide/mcp.md).

## Qué Se Genera

`af init` crea `ai-context/`, una carpeta de contexto de repositorio diseñada para humanos, CI y agentes:

```text
ai-context/
├── agent_brief.md          # Brief operativo corto para agentes IA
├── ai_context.md           # Contexto unificado legible
├── context_manifest.json   # Frescura, estado git y hashes
├── project.json            # Resumen machine-readable del proyecto
├── tech_stack.md           # Lenguajes, frameworks, tools, evidencia
├── architecture.md         # Estructura del repo y roles de módulos
├── entrypoints.md          # Entrypoints CLI/API/app/test
├── symbols.json            # Funciones, clases, interfaces
├── dependencies.json       # Imports y relaciones de dependencias
├── test-mapping.json       # Vínculos source-to-test con razones
├── security-audit.json     # Hallazgos con severidad/confianza/evidencia
├── performance-analysis.json
└── dead-code.json
```

El contexto generado es útil, pero no es automáticamente autoridad. Usa `af verify ai-context` o MCP `verify_ai_context` antes de depender de él.

## Comandos

| Comando | Propósito |
|---------|-----------|
| `af init` | Genera `ai-context/` |
| `af verify ai-context` | Puntúa la confianza del contexto de 0 a 100 |
| `af doctor context` | Verifica frescura del contexto |
| `af doctor --ci` | Ejecuta quality gates para CI y agentes |
| `af context --task <task>` | Genera contexto específico por tarea |
| `af understand <topic>` | Combina código, tests, arquitectura, git, riesgos y comandos para un tema |
| `af index` | Construye el índice SQLite de símbolos |
| `af query` | Consulta símbolos/imports/exports indexados |
| `af map` | Construye grafos y contexto semántico del repositorio |
| `af explore` | Explora dependencias de módulos |
| `af git` | Analiza actividad reciente de git |
| `af install --platform <client>` | Escribe config MCP para un cliente |
| `af mcp` | Inicia el servidor MCP |
| `af mcp doctor` | Diagnostica setup MCP |

La mayoría de comandos soportan `--root`, `--output` y `--json` cuando aplica.

## Confianza y Quality Gates

AI-First trata el contexto como un artefacto generado que puede quedar stale. El flujo de confianza es:

```bash
af init
af verify ai-context --json
af doctor --ci --json
```

`af verify ai-context` revisa:

- presencia del manifest
- frescura del contexto
- archivos requeridos
- evidencia de package/config para el stack detectado
- especificidad de arquitectura
- claims sospechosos de setup/env vars

`af doctor --ci` revisa preparación del repositorio:

- validez del bin en package
- scripts de build y test
- config TypeScript
- cobertura de workflows CI
- script de build de docs
- setup de evaluator
- config de semantic-release
- workflow de publicación NPM
- alineación README/package version
- seguridad shell en MCP
- confianza del contexto

Usa `af doctor --ci --run` cuando el entorno tenga permiso para ejecutar comandos de build/test/docs/evaluator.

## Repositorios Soportados

AI-First está optimizado para repositorios de aplicaciones multi-lenguaje. Incluye detectores y parsers para patrones comunes en:

- TypeScript, JavaScript, Python, Go, Rust, Java, PHP, Ruby, C#, Kotlin, Swift, Apex
- Node CLI/API, React/Vue/Svelte, apps web Python, Spring Boot, Laravel, Rails, Android/Kotlin, Salesforce DX
- Jest, Vitest, pytest, Mocha, RSpec y heurísticas de mapeo source-to-test

El soporte varía por lenguaje. Los hallazgos de alta confianza incluyen evidencia; los de baja confianza deberían verificarse contra el código fuente antes de editar.

## Qué No Es AI-First

- No reemplaza leer archivos fuente.
- No es un scanner de seguridad con garantías de vulnerabilidades.
- No es un producto hosted de code search.
- No está atado a un vendor de IA ni a una UI de agente.

Es una capa local de contexto que vuelve la comprensión del repositorio más barata, rápida y verificable.

## Documentación

- [AI Agent Playbook](./docs/guide/ai-agent-playbook.md)
- [Guía MCP](./docs/guide/mcp.md)
- [Guía de Configuración](./docs/guide/config.md)
- [Guía RAG y Search](./docs/guide/rag.md)
- [Guía Git Blame](./docs/guide/git-blame.md)
- [Especificación](./docs/spec.md)
- [Changelog](./CHANGELOG.md)

## Desarrollo

```bash
git clone https://github.com/julianperezpesce/ai-first.git
cd ai-first
npm install
npm run build
npm test
```

Checks útiles antes de entregar cambios:

```bash
npx tsc --noEmit
npm run docs:build
npm run build
npm test
af verify ai-context --json
af doctor --ci --json
```

## Licencia

MIT © [Julian Perez Pesce](https://github.com/julianperezpesce)
