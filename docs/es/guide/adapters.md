# Adaptadores de Análisis

AI-First usa un sistema de adaptadores para soportar múltiples lenguajes y frameworks sin modificar el motor de análisis central.

## Descripción General

Los adaptadores personalizan cómo AI-First detecta:
- **Raíces de características**: Dónde buscar características de negocio
- **Puntos de entrada**: Archivos que representan puntos de entrada
- **Capas**: Capas arquitectónicas en el código base
- **Carpetas ignoradas**: Directorios técnicos a omitir

## Adaptadores Soportados

| Adaptador | Señales de Detección |
|-----------|---------------------|
| JavaScript/TypeScript | `package.json`, `tsconfig.json`, `vite.config.ts` |
| Django | `manage.py`, `settings.py` |
| Flask/FastAPI | `app.py`, `main.py` |
| Ruby on Rails | `Gemfile`, `config.ru` |
| Salesforce | `sfdx-project.json`, `force-app/` |
| .NET | `*.csproj`, `Program.cs` |
| ASP.NET Core | `Startup.cs`, `Program.cs` |
| Blazor | `_Imports.razor`, `@page` |

## Arquitectura

```
analysis/
adapters/
  baseAdapter.ts      # Definición de interfaz
  javascriptAdapter.ts
  pythonAdapter.ts
  railsAdapter.ts
  salesforceAdapter.ts
  dotnetAdapter.ts
  adapterRegistry.ts  # Lógica de detección
```

## Interfaz del Adaptador

```typescript
interface AnalysisAdapter {
  name: string;
  displayName: string;
  detectionSignals: DetectionSignal[];
  featureRoots: string[];
  ignoredFolders: string[];
  entrypointPatterns: string[];
  layerRules: LayerRule[];
  supportedExtensions: string[];
  flowEntrypointPatterns: string[];
  flowExcludePatterns: string[];
}
```

## Señales de Detección

Los adaptadores se detectan usando señales:

```typescript
interface DetectionSignal {
  type: 'file' | 'directory' | 'content';
  pattern: string;
  contentPattern?: string;
}
```

Ejemplo:
```typescript
detectionSignals: [
  { type: 'file', pattern: 'package.json' },
  { type: 'file', pattern: 'tsconfig.json' },
  { type: 'directory', pattern: 'src' }
]
```

## Reglas de Capas

Cada adaptador define capas arquitectónicas:

```typescript
layerRules: [
  { name: 'api', priority: 1, patterns: ['controller', 'handler', 'route'] },
  { name: 'service', priority: 2, patterns: ['service', 'usecase'] },
  { name: 'data', priority: 3, patterns: ['repository', 'model'] }
]
```

## Uso

```typescript
import { detectAdapter, getAdapter } from './core/adapters/index.js';

// Auto-detectar tipo de proyecto
const adapter = detectAdapter('/path/to/project');
console.log(adapter.name); // 'javascript', 'django', etc.

// Obtener adaptador específico
const jsAdapter = getAdapter('javascript');
```

## Creando Adaptadores Personalizados

1. Crea un nuevo archivo en `src/core/adapters/`
2. Define tu adaptador:

```typescript
import { AnalysisAdapter } from './baseAdapter.js';

export const myAdapter: AnalysisAdapter = {
  name: 'myframework',
  displayName: 'My Framework',
  detectionSignals: [
    { type: 'file', pattern: 'my-framework.config.js' }
  ],
  featureRoots: ['src', 'lib'],
  ignoredFolders: ['node_modules', 'dist'],
  entrypointPatterns: ['controller', 'service'],
  layerRules: [
    { name: 'api', priority: 1, patterns: ['controller'] },
    { name: 'service', priority: 2, patterns: ['service'] },
    { name: 'data', priority: 3, patterns: ['model'] }
  ],
  supportedExtensions: ['.ts', '.js'],
  flowEntrypointPatterns: ['controller'],
  flowExcludePatterns: ['test', 'spec']
};
```

3. Regístralo en `adapterRegistry.ts`
4. Agrega tests

## Integración

Los adaptadores se integran con la detección de características y flujos:

- `featureRoots` → dónde encontrar características
- `ignoredFolders` → qué omitir
- `entrypointPatterns` → puntos de entrada de lógica de negocio
- `layerRules` → capas de la cadena de flujos

Esto permite que AI-First entienda cualquier estructura de código base.
