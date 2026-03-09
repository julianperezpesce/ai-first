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

## 🌎 Idiomas

Esta documentación está disponible en:

* English (por defecto)
* Español

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
