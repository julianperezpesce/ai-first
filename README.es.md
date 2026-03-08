# ai-first

> Herramienta CLI que prepara cualquier repositorio para ser usado eficazmente por agentes de código IA (OpenCode, Cursor, Claude Code, etc.)

`ai-first` escanea tu repositorio y genera una capa de contexto estructurada para que los asistentes de IA puedan entender tu proyecto rápidamente sin tener que leer todo el código.

## ¿Por qué?

Cuando le das acceso a una IA a tu código, a menudo tiene que leer miles de archivos para entender el proyecto. Esto es lento, costoso y a veces la IA pierde contexto importante.

**ai-first solve esto** generando documentación estructurada que les dice a los agentes de IA:

- Qué lenguajes y frameworks usas
- Cómo está organizado tu proyecto
- Dónde están los puntos de entrada
- Qué convenciones de código sigues

## Instalación

### Inicio Rápido (npx)
```bash
npx ai-first init
```

### Instalación Global
```bash
npm install -g ai-first
ai-first init
```

### Instalación Local
```bash
npm install ai-first
npx ai-first init
```

## Uso

### Uso Básico
```bash
ai-first init
```

Esto crea una carpeta `ai/` con todos los archivos de contexto.

### Opciones
```bash
ai-first --help

Options:
  -r, --root <dir>      Directorio raíz a escanear (default: directorio actual)
  -o, --output <dir>  Directorio de salida (default: ./ai)
  -h, --help           Mostrar ayuda
```

## Salida

La herramienta genera los siguientes archivos en un directorio `ai/`:

```
ai/
├── ai_context.md      # Contexto unificado para agentes IA (¡el más importante!)
├── repo_map.md        # Estructura del repositorio (vista de árbol)
├── summary.md         # Resumen por tipo de archivo y directorio
├── architecture.md    # Análisis del patrón de arquitectura
├── tech_stack.md      # Lenguajes, frameworks, librerías detectados
├── entrypoints.md     # Puntos de entrada (CLI, API, servidor)
└── conventions.md    # Convenciones de código detectadas
```

### Ejemplo de ai_context.md

```markdown
# AI Context

> Este archivo proporciona una visión general integral del repositorio para asistentes de IA.

---

## Vista Rápida

- **Patrón**: MVC (Model-View-Controller)
- **Lenguajes**: TypeScript, JavaScript
- **Frameworks**: React, Express.js
- **Total de Archivos**: 156

---

## Stack Tecnológico

**Lenguajes**: TypeScript, JavaScript

**Frameworks**: React, Express.js

**Gestores de Paquetes**: npm

---

## Arquitectura

## Patrón Arquitectónico
**Primario**: MVC (Model-View-Controller)

## Módulos Clave
| Módulo | Responsabilidad |
|--------|----------------|
| `src/controllers` | Manejo de solicitudes |
| `src/services` | Lógica de negocio |
| `src/models` | Modelos de datos |

---

## Puntos de Entrada

### Servidor
- `src/index.ts` - Punto de entrada principal
- `src/server.ts` - Servidor

### CLI
- `src/cli.ts` - Punto de entrada CLI

---

## Notas para Asistentes de IA

1. Sigue las convenciones de nombres establecidas
2. Usa los frameworks y librerías detectados
3. Apunta a los puntos de entrada correctos para modificaciones
4. Mantén los patrones de arquitectura detectados
```

## Características

### ✅ Análisis Determinista
- No requiere IA/LLM - funciona sin conexión
- Resultados consistentes cada vez
- Ejecución rápida

### 🌍 Soporte Multi-Lenguaje
Detecta proyectos en:
- TypeScript/JavaScript
- Python
- Go
- Rust
- Ruby
- Java
- C#
- Y más...

### 🔍 Detección Inteligente
- **Patrones de arquitectura**: MVC, Clean Architecture, Hexagonal, Microservicios, Monorepo, SPA
- **Frameworks**: React, Vue, Next.js, Django, Express, FastAPI, Spring, Rails, etc.
- **Testing**: Jest, Vitest, pytest, Mocha, RSpec, etc.
- **Linters/Formateadores**: ESLint, Prettier, Pylint, RuboCop, etc.

### 🎯 Descubrimiento de Puntos de Entrada
Encuentra automáticamente:
- Comandos CLI
- Servidores API
- Workers en segundo plano
- Puntos de entrada de cliente
- Exports de librerías

## Casos de Uso

### 1. OpenCode / Cursor / Claude Code
Dale contexto a la IA antes de hacer preguntas:
```bash
ai-first init
# Luego pregunta a la IA que lea ai/ai_context.md
```

### 2. Incorporación de Nuevos Desarrolladores
```bash
ai-first init
# El nuevo desarrollador lee ai/ai_context.md para entender el proyecto
```

### 3. Documentación del Proyecto
```bash
ai-first init
# Genera estado actual de documentación automáticamente
```

## Comparación

| Característica | ai-first | Análisis Manual |
|----------------|----------|-----------------|
| Velocidad | Segundos | Minutos/Horas |
| Consistencia | Determinista | Varía |
| Requiere LLM | No | Sí |
| Sin Conexión | Sí | No |
| Mantenimiento | Auto-actualiza | Manual |

## Configuración

### Directorio de Salida Personalizado
```bash
ai-first init --output ./docs/ai
```

### Directorio Raíz Personalizado
```bash
ai-first init --root ./mi-proyecto
```

## Integraciones

### OpenCode
Crea `~/.config/opencode/commands/ai-first.md`:
```markdown
---
description: Generar contexto de IA para el repositorio
agent: sisyphus
---

Ejecuta `ai-first init` en el directorio actual para generar archivos de contexto de IA.

Luego confirma qué archivos se crearon.
```

### VS Code
Agrega a `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Generar Contexto IA",
      "type": "shell",
      "command": "npx ai-first init",
      "problemMatcher": []
    }
  ]
}
```

## Licencia

MIT

## Autor

Creado para desarrollo asistido por IA.
