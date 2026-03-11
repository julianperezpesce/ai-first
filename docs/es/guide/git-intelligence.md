# Inteligencia Git

AI-First puede analizar tu repositorio git para proporcionar a los agentes IA contexto sobre la actividad reciente, ayudándolos a priorizar archivos relevantes y entender qué ha sido modificado recientemente.

## Por qué Inteligencia Git?

Cuando trabajas con asistentes de codificación IA, conocer qué archivos han sido modificados recientemente ayuda a la IA a:

- **Priorizar revisión** - Enfocarse en archivos modificados recently al sugerir modificaciones
- **Entender contexto** - Saber qué features/flows están siendo desarrollados activamente
- **Evitar conflictos** - Identificar archivos que fueron modificados recientemente para prevenir sobreescritura
- **Rastrear cambios** - Ver patrones de commits y frecuencia de actividad

## Cómo Funciona

La Inteligencia Git analiza tu historial git para generar metadata sobre la actividad reciente del repositorio:

1. **Detecta repositorio git** - Verifica si el proyecto es un repositorio git
2. **Analiza commits recientes** - Extrae datos de commits (default: últimos 50 commits, últimos 30 días)
3. **Mapea a features/flows** - Correlaciona archivos cambiados con features y flows detectados
4. **Genera metadata** - Archivos JSON de salida para consumo de IA

## Archivos Generados

Cuando ejecutas `ai-first git`, los siguientes archivos se crean en `ai/git/`:

### recent-files.json

Lista de archivos recientemente cambiados:

```json
[
  "src/auth/loginController.ts",
  "src/auth/sessionService.ts",
  "src/payments/checkoutFlow.ts"
]
```

### recent-features.json

Features que han sido modificados recientemente:

```json
["auth", "payments"]
```

### recent-flows.json

Flows que han sido modificados recientemente:

```json
["login", "checkout"]
```

### commit-activity.json

Datos detallados de frecuencia de commits:

```json
{
  "totalCommits": 50,
  "dateRange": {
    "start": "2026-02-01",
    "end": "2026-03-10"
  },
  "files": {
    "src/auth/loginController.ts": 5,
    "src/auth/sessionService.ts": 3
  },
  "features": {
    "auth": 8,
    "payments": 12
  },
  "flows": {
    "login": 4,
    "checkout": 7
  }
}
```

## Uso

### Comando CLI

```bash
# Analizar actividad git
ai-first git

# Analizar con más commits
ai-first git --limit 100

# Mostrar actividad detallada
ai-first git --activity

# Salida como JSON
ai-first git --json
```

### Opciones

| Opción | Alias | Descripción |
|--------|-------|-------------|
| `--root` | `-r` | Directorio raíz (default: actual) |
| `--limit` | `-n` | Número de commits (default: 50) |
| `--activity` | `-a` | Mostrar actividad detallada |
| `--json` | | Salida como JSON |
| `--help` | `-h` | Mostrar ayuda |

### Uso Programático

```typescript
import { 
  detectGitRepository,
  getRecentCommits,
  analyzeGitActivity,
  generateGitContext 
} from 'ai-first';

// Verificar si es repo git
if (detectGitRepository('/path/to/project')) {
  // Obtener commits recientes
  const commits = getRecentCommits('/path/to/project');
  
  // Analizar actividad
  const activity = analyzeGitActivity('/path/to/project');
  
  // Generar archivos de contexto
  const context = generateGitContext('/path/to/project');
}
```

## Referencia API

### detectGitRepository(rootDir: string): boolean

Verifica si un directorio es un repositorio git.

### getRecentCommits(rootDir: string, limit?: number): GitCommit[]

Retorna commits recientes con cambios de archivos.

### extractChangedFiles(commits: GitCommit[]): RecentFile[]

Extrae y cuenta archivos cambiados de commits.

### mapFilesToFeatures(rootDir: string, files: string[]): string[]

Mapea archivos cambiados a features detectados.

### mapFilesToFlows(rootDir: string, files: string[]): string[]

Mapea archivos cambiados a flows detectados.

### analyzeGitActivity(rootDir: string): GitActivity | null

Analiza actividad git y retorna datos agregados.

### generateGitContext(rootDir: string, aiDir?: string): GitContext

Genera todos los archivos de contexto git en `ai/git/`.

## Integración con Contexto IA

La inteligencia git se integra con el sistema de contexto IA:

1. Ejecuta `ai-first init` para generar features y flows
2. Ejecuta `ai-first git` para analizar actividad git
3. Los agentes IA pueden leer los archivos en `ai/git/` para entender cambios recientes

Esto proporciona una imagen completa de la estructura de tu código y su actividad de desarrollo.
