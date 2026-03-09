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
✅ Generated ai/ai_context.md (0.3s)
✅ Generated ai/symbols.json (0.1s)  
✅ Generated ai/dependencies.json (0.1s)
✅ Generated 11 context files

🎉 Ready! Give ai/ai_context.md to your AI assistant.
```

**Resultado:** La IA comprende tu proyecto en ~500 tokens en lugar de 50,000.
<!-- END FIRST 10 SECONDS VALUE -->

#WK|---

#HM|## ⚡ Inicio Rápido

#HV|Configura y ejecuta en menos de un minuto:

#HV|```bash
#HV|# 1. Inicializa AI-First en tu repositorio
#HV|npx ai-first init
#HV|
#HV|# 2. Genera índice SQLite para consultas rápidas (recomendado)
#HV|npx ai-first index
#HV|
#HV|# 3. Observa cambios en archivos (opcional, para desarrollo)
#HV|npx ai-first watch
#HV|
#HV|# 4. Consulta símbolos cuando sea necesario
#HV|npx ai-first query symbol MiClase
#HV|```

#HV|**Qué hace cada paso:**
#HV|- `init` — Genera 11 archivos de contexto incluyendo ai_context.md, symbols.json y más
#HV|- `index` — Crea una base de datos SQLite buscar código rápidamente
#HV|- `watch` — Monitorea cambios de archivos y actualiza el índice incrementalmente
#HV|- `query` — Te permite buscar símbolos, imports y relaciones entre archivos

#HV|¡Eso es todo! Tu repositorio ahora está listo para IA. Da `ai/ai_context.md` a tu asistente de IA.

#KB|---

#RR|## ⚡ Inicio Rápido

#KB|Inicializa AI-First en tu repositorio:

#KB|```
#KB|ai-first init
#KB|```

#KB|Indexa el repositorio para que los agentes de IA puedan entender el código:

#KB|```
#KB|ai-first index
#KB|```

#KB|Genera un mapa de arquitectura del repositorio:

#KB|```
#KB|ai-first summarize
#KB|```

#KB|* `init` genera 11 archivos de contexto con metadatos del proyecto
#KB|* `index` crea una base de datos SQLite para consultas rápidas de símbolos
#KB|* `summarize` crea resúmenes jerárquicos para navegación IA

#KB|---

#XN|#YB|## ❓ Por qué AI-First?

#KB|Los asistentes de código IA a menudo tienen dificultades con repositorios grandes.

#KB|Problemas típicos incluyen:

#KB|* ventanas de contexto limitadas
#KB|* falta de conocimiento arquitectónico
#KB|* dificultad para navegar bases de código grandes
#KB|* relaciones perdidas entre módulos

#KB|AI-First resuelve este problema construyendo una **capa de inteligencia del repositorio**.

#KB|Crea metadatos estructurados que permiten a los agentes IA:

#KB|* entender la estructura del proyecto
#KB|* recuperar código relevante
#KB|* navegar repositorios grandes
#KB|* mantener contexto arquitectónico

#KB|---

#KB|Los asistentes de código IA a menudo tienen dificultades con repositorios grandes.

#KB|Problemas típicos incluyen:

#KB|* **Ventanas de contexto limitadas** — No pueden procesar bases de código completas
#KB|* **Falta de conocimiento arquitectónico** — Pierden estructura y patrones del proyecto
#KB|* **Dificultad para navegar** — No pueden encontrar código relevante eficientemente
#KB|* **Relaciones perdidas** — No entienden las dependencias entre módulos

#KB|AI-First resuelve esto construyendo una **capa de inteligencia del repositorio**.

#KB|Crea metadatos estructurados que permiten a los agentes IA:

#KB|* Entender la estructura del proyecto de un vistazo
#KB|* Recuperar código relevante instantáneamente
#KB|* Navegar repositorios grandes eficientemente
#KB|* Mantener contexto arquitectónico a través de conversaciones

#KB|---

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
# Luego pregunta a la IA: "Lee ai/ai_context.md y ayúdame a agregar una característica"
```

### 2. Incorporación de Nuevos Desarrolladores
```bash
ai-first init
# El nuevo desarrollador lee ai/ai_context.md → comprende el proyecto en 2 minutos
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

Tú: "Lee ai/ai_context.md, luego agrega autenticación"
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
│   ├── techStack.ts    # Detección de lenguaje/framework
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
├── ai_rules.md        # Reglas específicas para IA
└── hierarchy.json    # Resumen jerárquico del repositorio
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

# Generar índice SQLite para consultas rápidas
ai-first index

# Directorio de salida personalizado
ai-first init --output ./docs/ai

# Directorio raíz personalizado
ai-first init --root ./my-project
```

---

## 📖 Guía de Usuario

### Descripción de Comandos

ai-first provee 6 comandos para generar contexto IA para tu repositorio:

#### 1. `init` — Generar Contexto Completo (Predeterminado)
```bash
ai-first init [options]

# O simplemente:
ai-first
```

**Descripción:** Genera todos los archivos de contexto IA a la vez. Es el punto de partida recomendado.

**Opciones:**
- `-r, --root <dir>` — Directorio raíz (predeterminado: directorio actual)
- `-o, --output <dir>` — Directorio de salida (predeterminado: ./ai)
- `-h, --help` — Mostrar ayuda

**Salida:** Crea 11 archivos incluyendo ai_context.md, symbols.json, dependencies.json, architecture.md, y más.

---

#### 2. `index` — Generar Índice SQLite
```bash
ai-first index [options]
```

**Descripción:** Crea una base de datos SQLite para consultas rápidas de símbolos. Esencial para proyectos grandes.

**Opciones:**
- `-r, --root <dir>` — Directorio raíz (predeterminado: directorio actual)
- `-o, --output <path>` — Ruta de salida (predeterminado: ./ai/index.db)
- `-h, --help` — Mostrar ayuda

**Salida:** index.db — Base de datos SQLite con tablas de archivos, símbolos, imports y hashes.

---

#### 3. `watch` — Indexación Incremental
```bash
ai-first watch [options]
```

**Descripción:** Observa cambios en archivos y actualiza el índice incrementalmente. Perfecto para desarrollo.

**Opciones:**
- `-r, --root <dir>` — Directorio raíz (predeterminado: directorio actual)
- `-o, --output <path>` — Ruta de salida (predeterminado: ./ai/index.db)
- `-d, --debounce <ms>` — Retraso de debounce (predeterminado: 300ms)
- `-h, --help` — Mostrar ayuda

**Características:**
- Actualizaciones incrementales (solo archivos cambiados se re-indexan)
- Seguimiento de hash de archivos para detección de cambios
- Actualizaciones con debounce para manejar cambios rápidos
- Presiona Ctrl+C para dejar de observar

---

#### 4. `context` — Contexto Optimizado para LLM
```bash
ai-first context [options]
```

**Descripción:** Genera archivos de contexto ligeros optimizados para LLMs. Más rápido que init.

**Opciones:**
- `-r, --root <dir>` — Directorio raíz (predeterminado: directorio actual)
- `-o, --output <dir>` — Directorio de salida (predeterminado: ./ai)
- `-h, --help` — Mostrar ayuda

**Salida:** repo_map.json, symbols.json, dependencies.json, ai_context.md

---

#### 5. `summarize` — Resúmenes Jerárquicos
```bash
ai-first summarize [options]
```

**Descripción:** Genera resúmenes jerárquicos del repositorio optimizados para navegación IA.

**Opciones:**
- `-r, --root <dir>` — Directorio raíz (predeterminado: directorio actual)
- `-o, --output <path>` — Ruta de salida (predeterminado: ./ai/hierarchy.json)
- `-h, --help` — Mostrar ayuda

**Salida:** hierarchy.json con:
- Resumen del repositorio (nombre, descripción, propósito)
- Resúmenes de carpetas (propósito basado en nombres)
- Resúmenes de archivos (exports, imports, clases/funciones clave)

---

#### 6. `query` — Consultar el Índice
```bash
ai-first query <subcomando> [options]
```

**Descripción:** Consulta el índice SQLite para símbolos, imports y relaciones de archivos.

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

# Mostrar estadísticas del índice
ai-first query stats
```

---

### Inicio Rápido

```bash
# 1. Generar contexto completo (recomendado la primera vez)
npx ai-first init

# 2. Crear índice SQLite para consultas rápidas
npx ai-first index

# 3. Observar cambios (opcional, para desarrollo)
npx ai-first watch

# 4. Consultar símbolos cuando sea necesario
npx ai-first query symbol MyClass
```

#TM|---

#RR|## 🌎 Idiomas

#KB|Esta documentación está disponible en:

#KB|* **English** (por defecto) — [README.md](./README.md)
#KB|* **Español** — [README.es.md](./README.es.md)

#KB|Para más detalles, consulta la [Guía de Usuario](./docs/user-guide.es.md).

#KB|---

## 🌍 Soporte Multi-Lenguaje

| Categoría | Lenguajes |
|-----------|-----------|
| **Web** | JavaScript, TypeScript, Python, Go, Rust |
| **Backend** | Java, C#, PHP, Ruby, Go, Rust, Kotlin |
| **Móvil** | Swift, Kotlin |
| **Frontend** | Vue, Svelte, React, HTML, CSS, SCSS |
| **Testing** | Jest, Vitest, pytest, Mocha, RSpec |

---

## 📋 Roadmap

### v1.1 (Próximamente)
- [ ] Modo watch para auto-regeneración
- [ ] Integración con Git (analizar cambios recientes)

### v1.2 (Planificado)
- [ ] Integración LSP para símbolos más ricos
- [ ] Plugins de analizadores personalizados

### v2.0 (Futuro)
- [ ] Análisis multi-repositorio
- [ ] Extensiones de IDE (VS Code, JetBrains)
- [ ] Integración CI/CD

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

## 📄 Licencia

MIT © [Julian Perez Pesce](https://github.com/julianperezpesce)
