[English](./README.md) | [Español](./README.es.md)

# ai-first

<p align="center">
  <a href="https://github.com/julianperezpesce/ai-first/stargazers">
    <img src="https://img.shields.io/github/stars/julianperezpesce/ai-first?style=flat&color=ffd700" alt="Stars">
  </a>
  <a href="https://www.npmjs.com/package/ai-first">
    <img src="https://img.shields.io/npm/dt/ai-first?color=blue" alt="NPM Downloads">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  </a>
  <a href="https://github.com/julianperezpesce/ai-first/issues">
    <img src="https://img.shields.io/github/issues/julianperezpesce/ai-first" alt="Issues">
  </a>
</p>

> **Dale superpoderes a tu asistente de código IA.** Genera contexto instantáneo del proyecto para que los agentes IA comprendan tu código en segundos, no en minutos.

<!-- START FIRST 10 SECONDS VALUE -->
## ⚡ En 10 Segundos

```
$ npx ai-first init
✅ Generated ai-context/ai_context.md (0.3s)
✅ Generated ai-context/symbols.json (0.1s)  
✅ Generated ai-context/dependencies.json (0.1s)
✅ Generated 11 context files

🎉 Ready! Give ai-context/ai_context.md to your AI assistant.
```

**Resultado:** La IA comprende tu proyecto en ~500 tokens en lugar de 50,000.
<!-- END FIRST 10 SECONDS VALUE -->

---

## ⚡ Inicio Rápido

Inicializa AI-First en tu repositorio:

```
ai-first init
```

Indexa el repositorio para que los agentes de IA puedan entender el código:

```
ai-first index
```

Genera un mapa de arquitectura del repositorio:

```
ai-first summarize
```

* `init` genera 11 archivos de contexto con metadatos del proyecto
* `index` crea una base de datos SQLite para consultas rápidas de símbolos
* `summarize` crea resúmenes jerárquicos para navegación IA

---

## ❓ Por qué AI-First?

Los asistentes de código IA a menudo tienen dificultades con repositorios grandes.

**Problemas comunes:**

* ventanas de contexto limitadas
* falta de conocimiento arquitectónico
* dificultad para navegar bases de código grandes
* relaciones perdidas entre módulos

AI-First resuelve esto creando una capa de inteligencia del repositorio.

Esto permite a los agentes IA:

* entender la estructura del proyecto
* recuperar código relevante
* navegar repositorios grandes
* mantener contexto arquitectónico

---

## 🚀 ¿Por qué ai-first?

| Antes de ai-first | Después de ai-first |
|-------------------|---------------------|
| La IA lee 500+ archivos para entender el proyecto | La IA lee 1 archivo con contexto completo |
| $5+ por proyecto en costos de API | ~$0.05 por proyecto |
| 30+ segundos para que la IA "se caliente" | Comprensión instantánea |
| La IA pierde convenciones y patrones | La IA conoce tu arquitectura |

---

## 📦 Instalación

```bash
# Inicio rápido (sin instalación)
npx ai-first init

# O instalar globalmente
npm install -g ai-first
ai-first init
```

---

## 🎯 Casos de Uso

### 1. Agentes de Código IA (OpenCode, Cursor, Claude Code)
```bash
ai-first init
# Luego pregunta a la IA: "Lee ai-context/ai_context.md y ayúdame a agregar una característica"
```

### 2. Incorporación de Nuevos Desarrolladores
```bash
ai-first init
# El nuevo desarrollador lee ai-context/ai_context.md → comprende el proyecto en 2 minutos
```

### 3. Documentación del Proyecto
```bash
ai-first init
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
$ ai-first init

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
ai/
├── ai_context.md      # ⭐ Empieza aquí — vista general unificada
├── repo_map.json      # Estructura legible por máquina
├── symbols.json       # Funciones/clases extraídas
├── dependencies.json  # Relaciones de imports
├── architecture.md   # Patrón de arquitectura
├── tech_stack.md      # Lenguajes y frameworks
├── entrypoints.md     # Puntos de entrada
├── conventions.md     # Convenciones de código
├── index.db           # SQLite (con índice ai-first)
│
├── graph/             # Generado por `ai-first map`
│   ├── module-graph.json   # Grafo de dependencias a nivel de módulo
│   └── symbol-graph.json   # Relaciones a nivel de símbolo (calls, imports, etc.)
│
└── context/           # Generado por `ai-first init` o `map`
    ├── features/      # Features de negocio detectados
    │   └── <modulo>.json
    └── flows/         # Cadenas de ejecución de negocio
        └── <flujo>.json
└── index.db           # SQLite (con índice ai-first)
```

---

## 🤖 Agentes IA Soportados

| Agente | Cómo Usarlo |
|--------|-------------|
| **OpenCode** | `~/.config/opencode/commands/ai-first.md` |
| **Cursor** | Referencia `ai/ai_context.md` en prompts |
| **Claude Code** | Incluye contexto en el prompt del sistema |
| **Windsurf** | Comprensión del proyecto |
| **GitHub Copilot** | Sugerencias conscientes del contexto |

---

## ⚡ Comandos Rápidos

```bash
# Generar contexto
ai-first init

# Generar índice SQLite
ai-first index

# Directorio de salida personalizado
ai-first init --output ./docs/ai

# Directorio raíz personalizado
ai-first init --root ./my-project
```

---

## 📦 Context Control Packs (CCP)

CCP (Context Control Packs) te permite crear contextos reutilizables y específicos para diferentes flujos de trabajo de IA.

### Cómo Funciona

1. **Generar Módulos de Contexto**: `ai-first init` crea módulos en `ai/context/`
2. **Crear un CCP**: Define qué módulos incluir para una tarea específica
3. **Usar en IA**: Referencia el CCP al trabajar con agentes de IA

### Ejemplo

```bash
ai-first ccp create tarea-auth --include repo,auth,api --description "Trabajo en autenticación"
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
// ai/context/features/<modulo>.json
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
// ai/context/flows/<nombre>.json
{
  "name": "login",
  "entrypoint": "src/auth/controller.js",
  "files": ["controller.js", "service.js", "repository.js"],
  "depth": 3,
  "layers": ["api", "service", "data"]
}
```

**Generado por:** `ai-first init` o `ai-first map`

---

## 🤖 Soporte Android/Kotlin

ai-first detecta e indexa automáticamente proyectos Android/Kotlin:

- **Detección de lenguaje**: Kotlin (.kt)
- **Detección de framework**: Android (vía build.gradle, AndroidManifest.xml)
- **Análisis de dependencias**: Dependencias Gradle (implementation, api, compile)
- **Puntos de entrada**: Activities, Services, BroadcastReceivers desde AndroidManifest.xml
- **Recursos**: Indexa res/layout, res/drawable, res/values
- **Multi-módulo**: Detecta módulos Gradle desde settings.gradle

### Archivos generados para proyectos Android

- `ai/tech_stack.md` - Muestra Android con versiones de SDK
- `ai/dependencies.json` - Dependencias Gradle en formato group:artifact:version
- `ai/entrypoints.md` - Activities, services, permisos de Android
- `ai/android-resources.json` - Layouts, drawables, values (si existe res/)
- `ai/gradle-modules.json` - Estructura multi-módulo (si existe settings.gradle)

---

## 📋 Roadmap

### Phase 1 ✅ (Completado)
- Infraestructura de testing con 11 proyectos de prueba

### Phase 2 ✅ (Completado)
- Fixes de calidad: extracción de símbolos, sanitización de nombres de flows
- Soporte para parsers PHP y Ruby agregado
- 11 adapters funcionando (100% cobertura)

### Phase 3 (Planificado)
- [ ] Indexación semántica mejorada
- [ ] Sistema de plugins para analizadores custom
- [ ] Soporte Scala
- [ ] Soporte de archivo de configuración (`ai-first.config.json`)
- [ ] Sistema de reglas/plugins custom
- [ ] Plantillas de integración CI/CD

### Phase 4 (Futuro)
- [ ] Integración con Git (analizar cambios recientes)
- [ ] Contexto aware de diff (qué cambió desde última ejecución)
- [ ] Modo interactivo
- [ ] Extensión de VS Code

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

ai-first detecta e indexa automáticamente proyectos Android/Kotlin:

- **Detección de lenguaje**: Kotlin (.kt)
- **Detección de framework**: Android (vía build.gradle, AndroidManifest.xml)
- **Análisis de dependencias**: Dependencias Gradle (implementation, api, compile)
- **Puntos de entrada**: Activities, Services, BroadcastReceivers desde AndroidManifest.xml
- **Recursos**: Indexa res/layout, res/drawable, res/values
- **Multi-módulo**: Detecta módulos Gradle desde settings.gradle

### Archivos generados para proyectos Android

- `ai/tech_stack.md` - Muestra Android con versiones de SDK
- `ai/dependencies.json` - Dependencias Gradle en formato group:artifact:version
- `ai/entrypoints.md` - Activities, services, permisos de Android
- `ai/android-resources.json` - Layouts, drawables, values (si existe res/)
- `ai/gradle-modules.json` - Estructura multi-módulo (si existe settings.gradle)

---

## 📄 Licencia

MIT © [Julian Perez Pesce](https://github.com/julianperezpesce)

MIT © [Julian Perez Pesce](https://github.com/julianperezpesce)
