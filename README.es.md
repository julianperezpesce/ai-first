[English](./README.md) | [Español](./README.es.md)

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

> **Dale superpoderes a tu asistente de código IA.** Genera contexto instantáneo del proyecto para que los agentes IA comprendan tu código en segundos, no en minutos.

---

## 🚀 Novedades en v1.4.1

**12 nuevos comandos y flags** - Productividad y automatización

- ✅ `af init --watch`: Regenera contexto automáticamente al guardar archivos
- ✅ `af init --diff`: Muestra solo los cambios desde la última ejecución
- ✅ `af init --json`: Output machine-readable para CI/CD
- ✅ `af init --smart`: Análisis adaptativo según tamaño del repo
- ✅ `af init --repo <url>`: Genera contexto de un repositorio remoto
- ✅ `af pr-description`: Genera descripción de PR automática desde git
- ✅ `af install-hook`: Instala hook pre-commit para auto-actualizar contexto
- ✅ `af doctor` mejorado: Detecta .gitignore, tests, dependencias, README
- ✅ `af history`: Muestra evolución del contexto en el tiempo
- ✅ `.ai-first-ignore`: Archivo de exclusión personalizable por proyecto
- ✅ `af init --plugin`: Sistema de plugins para analyzers custom
- ✅ **Extensión VS Code**: `Ctrl+Shift+A` para generar contexto

**Anterior: v1.4.0**

**Contexto Inteligente & Análisis Profundo** - 26 nuevos módulos de análisis

- ✅ **Quick Start Automático**: Detecta comandos install/dev/test/start de package.json, Makefile, requirements.txt, etc.
- ✅ **Versiones de Dependencias**: Extrae versiones exactas de npm, pip, Bundler, Maven, Gradle, Cargo, Go modules
- ✅ **Mapeo Source → Test**: Vincula cada archivo fuente con sus tests correspondientes
- ✅ **Extracción de Modelos**: Schemas de Django, SQLAlchemy, TypeORM, Mongoose, Prisma, GORM
- ✅ **Variables de Entorno**: Detecta .env.example y process.env en el código
- ✅ **Preocupaciones Transversales**: Patrones de auth, logging, error handling, validación, caching
- ✅ **Análisis de Configuración**: TypeScript, ESLint, Prettier, testing framework, Docker
- ✅ **Cambios Recientes**: Actividad de git, commits, autores activos
- ✅ **Patrones de Código**: Ejemplos reales de controllers, services, tests extraídos del código
- ✅ **Auditoría de Seguridad**: SQL injection, XSS, hardcoded credentials, weak crypto
- ✅ **Análisis de Performance**: Nested loops, sequential awaits, unbounded queries
- ✅ **CI/CD Pipeline**: GitHub Actions, GitLab CI, Jenkins, CircleCI, Azure Pipelines
- ✅ **Migraciones de BD**: Django, Knex, Prisma, Flyway, Alembic, Rails
- ✅ **Contexto por Tarea**: `af context --task "add-endpoint"` genera contexto específico
- ✅ **Context Diff**: Cambios entre ejecuciones del contexto
- ✅ **Cobertura de Docs**: Análisis de JSDoc/docstrings
- ✅ **Detección de Código Muerto**: Funciones/clases no utilizadas
- ✅ **Salesforce Mejorado**: 4 features (apex-classes, apex-triggers, lwc, aura) + 163 tests nuevos
- ✅ **1330 Tests Pasando**: 44 archivos de test, 100% éxito

**[Leer la documentación →](./docs/NEW_FEATURES.md)**

**Anterior: v1.3.10**

- ✅ **Entrypoints Python**: Detección automática de `manage.py`, `app.py`, exports de `__init__.py`, scripts de `pyproject.toml`
- ✅ **Entrypoints Spring Boot**: Detección de `@SpringBootApplication`, `@RestController`, `pom.xml`, `build.gradle`
- ✅ **Detección por Contenido**: Re-habilitada la búsqueda de patrones de contenido para FastAPI/Flask/Django
- ✅ **Puntuación Evaluador**: Mejorada de 3.95 a **4.28/5.0** promedio

- ✅ **Servidor MCP**: Model Context Protocol nativo para Cursor, Claude Code y otros agentes IA
- ✅ **Presets de Configuración**: 4 presets (`full`, `quick`, `api`, `docs`) vía `ai-first.config.json`
- ✅ **Compresión de Contenido**: Reduce tokens hasta 70%
- ✅ **Git Blame**: Rastrea autoría del código directamente en tu contexto
- ✅ **Búsqueda RAG**: Busca código por significado (sin nube requerida)
- ✅ **Soporte Multi-Repo**: Maneja monorepos y microservicios

**[Leer las guías →](/guide/mcp)**

- ✅ **Entrypoints Go**: Detección automática de `main.go`, handlers HTTP y puertos de servicio
- ✅ **Entrypoints Rust**: Soporte para `main.rs`, `Cargo.toml` e implementaciones de structs
- ✅ **Entrypoints PHP**: Detección de `index.php`, convenciones Laravel y dependencias Composer
- ✅ **Detección de Frameworks Mejorada**: NestJS (`@nestjs/*`), Spring Boot (pom.xml/build.gradle) y Express (API Server vs Microservices)
- ✅ **Parser Apex**: Parsing mejorado de firmas de métodos con soporte de genéricos (`List<Account>`) y anotaciones multi-línea
- ✅ **Descripciones de Arquitectura**: Descripciones funcionales en lugar de "Contiene X archivos" genérico
- ✅ **1026 Tests Pasando**: 100% de éxito con 30 tests nuevos agregados

---

## 📋 Tabla de Contenidos

- [Comandos](#-referencia-de-comandos)
- [Inicio Rápido](#-inicio-rápido)
- [Instalación](#-instalación)
- [Casos de Uso](#-casos-de-uso)
- [Benchmark](#-benchmark)
- [Cómo Funciona](#-cómo-funciona)
- [Archivos Generados](#-archivos-generados)
- [Agentes IA](#-agentes-ia-soportados)
- [Roadmap](#-roadmap)
- [Contribuir](#-para-contribuidores)

---

## ⚡ Referencia de Comandos

| Comando | Descripción |
|---------|-------------|
| `af init` | Genera todos los archivos de contexto (símbolos, dependencias, arquitectura, etc.) |
| `af index` | Crea base de datos SQLite para consultas rápidas de símbolos |
| `af update` | Actualiza incrementally el contexto cuando archivos cambian |
| `af watch` | Observa cambios y actualiza el índice automáticamente |
| `af context` | Extrae contexto alrededor de un símbolo o función específica |
| `af explore` | Explora dependencias de módulos interactivamente |
| `af map` | Genera mapa del repositorio con todas las relaciones |
| `af doctor` | Verifica salud del repositorio y preparación para IA |
| `af query` | Consulta el índice (símbolos, imports, exports, stats) |
| `af adapters` | Lista adaptadores de lenguajes/frameworks soportados |
| `af git` | Muestra actividad reciente de git y archivos cambiados |
| `af graph` | Muestra visualización del grafo de conocimiento |
| `af --completions` | Genera script de autocompletado para shell |

> **Nota:** Todos los comandos funcionan con `af` (recomendado) o `ai-first` (legacy).

---

## ⚡ En 10 Segundos

```
$ npm install -g ai-first-cli
$ af init
✅ Generated ai-context/ai_context.md (0.3s)
✅ Generated ai-context/symbols.json (0.1s)  
✅ Generated ai-context/dependencies.json (0.1s)
✅ Generated 11 context files

🎉 Ready! Give ai-context/ai_context.md to your AI assistant.
```

**Resultado:** La IA comprende tu proyecto en ~500 tokens en lugar de 50,000.

---

## ⚡ Inicio Rápido

Inicializa AI-First en tu repositorio:

```
af init
```

Indexa el repositorio para que los agentes de IA puedan entender el código:

```
af index
```

* `init` genera 11 archivos de contexto con metadatos del proyecto
* `index` crea una base de datos SQLite para consultas rápidas de símbolos

---

## 📦 Instalación

### Requisitos
- Node.js 18+ (para indexación semántica opcional)

### Instalar

```bash
# Instalar globalmente (recomendado)
npm install -g ai-first-cli

# Ahora puedes usar el comando 'af'
af init
af index
af doctor
```

### Otros Métodos de Instalación

```bash
# Homebrew (macOS/Linux)
brew tap julianperezpesce/tap
brew install ai-first-cli

# Script de instalación (Linux/macOS/WSL)
curl -fsSL https://raw.githubusercontent.com/julianperezpesce/ai-first/master/install.sh | bash
```

### Autocompletado de Shell

```bash
# Para bash
af --completions > /usr/local/etc/bash_completion.d/af.bash
source /usr/local/etc/bash_completion.d/af.bash
```

---

## 🎯 Casos de Uso

### 1. Agentes de Código IA (OpenCode, Cursor, Claude Code)
```bash
af init
# Luego pregunta a la IA: "Lee ai-context/ai_context.md y ayúdame a agregar una característica"
```

### 2. Incorporación de Nuevos Desarrolladores
```bash
af init
# El nuevo desarrollador lee ai-context/ai_context.md → comprende el proyecto en 2 minutos
```

### 3. Documentación del Proyecto
```bash
af init
# Documentación automática instantánea siempre actualizada
```

---

## 💡 Antes y Después

### Antes: IA Ceguera

```
Tú: "Agregar autenticación a mi API"
IA: *lee 200 archivos en 2 minutos*
IA: "No estoy seguro de tu estructura de autenticación..."
IA: *adivina incorrectamente*
Resultado: Código roto, tokens desperdiciados
```

### Después: IA Ilustrada

```
$ af init

Tú: "Lee ai-context/ai_context.md, luego agrega autenticación"
IA: *lee 1 archivo (0.5s)*
IA: "Veo que usas Express + JWT con auth en src/middleware/auth.ts"
IA: "Agregaré autenticación siguiendo tus convenciones..."
Resultado: Código funcionando, 99% menos tokens
```

---

## 📊 Rendimiento

| Tamaño del Repositorio | Archivos Escaneados | Tiempo | Tamaño del Contexto |
|------------------------|---------------------|--------|---------------------|
| Pequeño (Laptop) | 50 | 0.3s | ~500 tokens |
| Mediano (Startup) | 200 | 1.2s | ~2,000 tokens |
| Grande (Empresa) | 1,000 | 5.5s | ~8,000 tokens |
| Enorme (Monolito) | 5,000 | 28s | ~25,000 tokens |

**vs. Contexto Tradicional:**
- Tradicional: 50,000+ tokens (leer todos los archivos)
- ai-first: 500-25,000 tokens (contexto estructurado)
- **Ahorro: 50-90% menos tokens**

---

## 🔄 Comparación

| Característica | ai-first | código base | context7 | Sourcegraph |
|----------------|----------|-------------|----------|-------------|
| **Sin conexión** | ✅ | ✅ | ❌ | ❌ |
| **Sin API key** | ✅ | ✅ | ❌ | ❌ |
| **Detección de arquitectura** | ✅ | ❌ | ❌ | ❌ |
| **Extracción de convenciones** | ✅ | ❌ | ❌ | ❌ |
| **Descubrimiento de puntos de entrada** | ✅ | ❌ | ❌ | ✅ |
| **Índice SQLite** | ✅ | ❌ | ❌ | ✅ |
| **Multi-lenguaje** | ✅ | ✅ | ✅ | ✅ |
| **Sin configuración** | ✅ | N/A | ❌ | ❌ |
| **Costo** | Gratis | Gratis | $19/mes | $19/mes |

---

## 🏗️ Arquitectura

```
src/
├── commands/           # Interfaz CLI
├── analyzers/          # 7 analizadores independientes
│   ├── architecture.ts # Detección de patrones
│   ├── techStack.ts   # Detección de lenguaje/framework
│   ├── entrypoints.ts  # Descubrimiento de puntos de entrada
│   ├── conventions.ts  # Detección de convenciones
│   ├── symbols.ts      # Extracción de funciones/clases
│   ├── dependencies.ts # Análisis de imports
│   └── aiRules.ts     # Reglas para IA
├── core/               # Motor de procesamiento
│   ├── repoScanner.ts  # Descubrimiento de archivos
│   ├── indexer.ts      # Indexación SQLite
│   └── contextGenerator.ts
└── utils/
```

### Flujo de Datos

```
Usuario CLI
   │
   ▼
AI-First CLI
   │
   ├── Repository Scanner
   │        │
   │        ▼
   │   Análisis de Archivos
   │
   ├── Index Engine
   │        │
   │        ▼
   │   Índice SQLite
   │
   └── Architecture Mapper
            │
            ▼
     Mapa del Repositorio
```

---

## 📁 Archivos Generados

```
ai-context/
├── ai_context.md      # ⭐ Empieza aquí — vista general unificada
├── repo_map.json      # Estructura legible por máquina
├── symbols.json       # Funciones/clases extraídas
├── dependencies.json  # Relaciones de imports
├── architecture.md    # Patrón de arquitectura
├── tech_stack.md      # Lenguajes y frameworks
├── entrypoints.md     # Puntos de entrada
├── conventions.md     # Convenciones de código
├── index.db           # Índice SQLite (generado por `af index`)
├── graph/             # Grafos de dependencias (generado por `af map`)
│   ├── module-graph.json
│   └── symbol-graph.json
└── context/           # Contexto de negocio (generado por `af init`)
    ├── features/      # Features de negocio detectados
    │   └── <modulo>.json
    └── flows/         # Cadenas de ejecución de negocio
        └── <flujo>.json
```

---

## 🤖 Agentes IA Soportados

| Agente | Cómo Usarlo |
|--------|-------------|
| **OpenCode** | `~/.config/opencode/commands/ai-first.md` |
| **Cursor** | Referencia `ai-context/ai_context.md` en prompts |
| **Claude Code** | Incluye contexto en el prompt del sistema |
| **Windsurf** | Comprensión del proyecto |
| **GitHub Copilot** | Sugerencias conscientes del contexto |

---

## ⚡ Comandos Rápidos

```bash
# Generar contexto
af init

# Generar índice SQLite
af index

# Directorio de salida personalizado
af init --output ./docs/ai

# Directorio raíz personalizado
af init --root ./my-project
```

---

## 📦 Context Control Packs (CCP)

CCP (Context Control Packs) te permite crear contextos reutilizables y específicos para diferentes flujos de trabajo de IA.

### Cómo Funciona

1. **Generar Módulos de Contexto**: `af init` crea módulos en `ai-context/context/`
2. **Crear un CCP**: Define qué módulos incluir para una tarea específica
3. **Usar en IA**: Referencia el CCP al trabajar con agentes de IA

### Ejemplo

```bash
af ccp create tarea-auth --include repo,auth,api --description "Trabajo en autenticación"
```

---

## 🎯 Contextos Semánticos (Features & Flows)

Los contextos semánticos son comprensión automática a nivel de negocio de tu código.

### Features

Los features representan módulos de negocio detectados desde la estructura del proyecto.

**Filtros de calidad:**
- Debe tener ≥ 3 archivos fuente
- Debe contener un entrypoint (Controller, Route, Handler, Command, Service)
- Excluidos: utils, helpers, types, interfaces, constants, config, models, dto, common

```json
// ai-context/context/features/<modulo>.json
{
  "feature": "auth",
  "files": ["src/auth/controller.js", "src/auth/service.js"],
  "entrypoints": ["src/auth/controller.js"]
}
```

### Flows

Los flows representan cadenas de ejecución de negocio desde entrypoints.

**Filtros de calidad:**
- Debe abarcar ≥ 3 archivos
- Debe cruzar ≥ 2 capas arquitectónicas (api → service → data)
- Debe iniciar desde un entrypoint (Controller, Route, Command, Handler)

```json
// ai-context/context/flows/<nombre>.json
{
  "name": "login",
  "entrypoint": "src/auth/controller.js",
  "files": ["controller.js", "service.js", "repository.js"],
  "depth": 3,
  "layers": ["api", "service", "data"]
}
```

**Generado por:** `af init` o `af map`

---

## 🌍 Soporte Multi-Lenguaje y Frameworks

### Lenguajes Soportados

| Categoría | Lenguajes |
|-----------|-----------|
| **Web** | JavaScript, TypeScript, Python, **Go**, **Rust** |
| **Backend** | Java, C#, **PHP**, Ruby, **Go**, **Rust**, Kotlin, **Apex** |
| **Mobile** | Swift, Kotlin, Android |
| **Frontend** | Vue, Svelte, React, HTML, CSS, SCSS |
| **Testing** | Jest, Vitest, pytest, Mocha, RSpec |

**Nuevo en v1.3.6:** Detección completa de entrypoints para **Go** (handlers, puertos), **Rust** (Cargo.toml, binarios), y **PHP** (index.php, Laravel).

### Frameworks (Testeados)

| Framework | Lenguaje | Proyecto de Prueba | Estado |
|-----------|----------|-------------------|--------|
| **Django** | Python | `test-projects/django-app` | ✅ |
| **FastAPI** | Python | `test-projects/fastapi-app` | ✅ |
| **Flask** | Python | `test-projects/flask-app` | ✅ |
| **Laravel** | PHP | `test-projects/laravel-app` | ✅ |
| **Rails** | Ruby | `test-projects/rails-app` | ✅ |
| **Spring Boot** | Java | `test-projects/spring-boot-app` | ✅ Mejorado v1.3.6 |
| Express.js | JavaScript | `test-projects/express-api` | ✅ Corregido v1.3.6 |
| **NestJS** | TypeScript | `test-projects/nestjs-backend` | ✅ Corregido v1.3.6 |
| React | JavaScript | `test-projects/react-app` | ✅ |
| Python CLI | Python | `test-projects/python-cli` | ✅ |
| Salesforce DX | Apex | `test-projects/salesforce-cli` | ✅ Mejorado v1.3.6 |
| **Go** | Go | `test-projects/go-microservice` | ✅ **NUEVO v1.3.6** |
| **Rust** | Rust | `test-projects/rust-cli` | ✅ **NUEVO v1.3.6** |
| **PHP Vanilla** | PHP | `test-projects/php-vanilla` | ✅ **NUEVO v1.3.6** |

**Mejoras v1.3.6:**
- **NestJS**: Ahora detecta correctamente paquetes scoped `@nestjs/*`
- **Spring Boot**: Parsea `pom.xml` y `build.gradle`/`build.gradle.kts`
- **Express**: Muestra "API Server" en lugar de "Microservices" para directorios de servicio único
- **Apex**: Parser mejorado con soporte de genéricos (`List<Account>`, `Map<String, Object>`)

---

## 🤖 Soporte Android/Kotlin

af detecta e indexa automáticamente proyectos Android/Kotlin:

- **Detección de lenguaje**: Kotlin (.kt)
- **Detección de framework**: Android (vía build.gradle, AndroidManifest.xml)
- **Análisis de dependencias**: Dependencias Gradle (implementation, api, compile)
- **Puntos de entrada**: Activities, Services, BroadcastReceivers desde AndroidManifest.xml
- **Recursos**: Indexa res/layout, res/drawable, res/values
- **Multi-módulo**: Detecta módulos Gradle desde settings.gradle

### Archivos generados para proyectos Android

- `ai-context/tech_stack.md` - Muestra Android con versiones de SDK
- `ai-context/dependencies.json` - Dependencias Gradle en formato group:artifact:version
- `ai-context/entrypoints.md` - Activities, services, permisos de Android
- `ai-context/android-resources.json` - Layouts, drawables, values (si existe res/)
- `ai-context/gradle-modules.json` - Estructura multi-módulo (si existe settings.gradle)

---

## 📋 Roadmap

### Phase 1 ✅ (Completado)
- Infraestructura de testing con 11 proyectos de prueba

### Phase 2 ✅ (Completado)
- Fixes de calidad: extracción de símbolos, sanitización de nombres de flows
- Soporte para parsers PHP y Ruby agregado
- 11 adapters funcionando (100% cobertura)

### Phase 3 ✅ (Completado)
- Indexación semántica mejorada
- Soporte PHP y Ruby (proyectos de prueba Laravel y Rails)
- Soporte de archivo de configuración (`ai-first.config.json`)
- Sistema de reglas/plugins custom
- Plantillas de integración CI/CD

### Phase 4 ✅ (Completado)
- Integración con Git (analizar cambios recientes)
- Contexto aware de diff (qué cambió desde última ejecución)
- Modo interactivo
- Índice SQLite para consultas rápidas de símbolos

### Phase 5 ✅ (Completado)
- Arquitectura: `ai/` → `ai-context/`
- Rendimiento: embeddings a SQLite
- Documentación: mejoras comprehensivas del README

---

## 👥 Para Contribuidores

```bash
# Clonar
git clone https://github.com/julianperezpesce/ai-first.git
cd ai-first

# Instalar
npm install

# Construir
npm run build

# Testear
npm test

# Modo desarrollo
npm run dev
```

Ver [docs/architecture.md](./docs/architecture.md) para arquitectura interna.

---

## 📖 Documentación

- [Architecture](./docs/architecture.md) — Arquitectura interna
- [Spec](./docs/spec.md) — Especificación del formato de contexto IA

---

## ⭐ Muestra Tu Apoyo

¡Danos una ⭐ si este proyecto te ayudó!

---

## 🤖 Soporte Android/Kotlin

af detecta e indexa automáticamente proyectos Android/Kotlin:

- **Detección de lenguaje**: Kotlin (.kt)
- **Detección de framework**: Android (vía build.gradle, AndroidManifest.xml)
- **Análisis de dependencias**: Dependencias Gradle (implementation, api, compile)
- **Puntos de entrada**: Activities, Services, BroadcastReceivers desde AndroidManifest.xml
- **Recursos**: Indexa res/layout, res/drawable, res/values
- **Multi-módulo**: Detecta módulos Gradle desde settings.gradle

### Archivos generados para proyectos Android

- `ai-context/tech_stack.md` - Muestra Android con versiones de SDK
- `ai-context/dependencies.json` - Dependencias Gradle en formato group:artifact:version
- `ai-context/entrypoints.md` - Activities, services, permisos de Android
- `ai-context/android-resources.json` - Layouts, drawables, values (si existe res/)
- `ai-context/gradle-modules.json` - Estructura multi-módulo (si existe settings.gradle)

### Soporte Salesforce (NUEVO ✅)

af detecta e indexa automáticamente proyectos Salesforce/Apex:

- **Detección de lenguaje**: Apex (.cls, .trigger)
- **Detección de framework**: Salesforce DX (vía sfdx-project.json)
- **Extracción de símbolos**: Clases, interfaces, métodos, triggers
- **Detección de SObjects**: Detecta automáticamente SObjects desde definiciones de triggers
- **Versión de API**: Lee sourceApiVersion desde sfdx-project.json
- **Puntos de entrada**: Clases Apex, triggers, métodos @AuraEnabled, métodos webservice

### Archivos generados para proyectos Salesforce

- `ai-context/tech_stack.md` - Muestra Salesforce con lenguaje Apex
- `ai-context/salesforce.json` - Metadatos específicos de Salesforce (apiVersion, sObjects, apexClasses, triggers)
- `ai-context/entrypoints.md` - Clases Apex, triggers y métodos
- `ai-context/symbols.json` - Todos los símbolos Apex extraídos con números de línea

---

## 📄 Licencia

MIT © [Julian Perez Pesce](https://github.com/julianperezpesce)
