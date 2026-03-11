# Analysis Adapters

AI-First uses an adapter system to support multiple languages and frameworks without modifying the core analysis engine.

## Overview

Adapters customize how AI-First detects:
- **Feature roots**: Where to look for business features
- **Entrypoints**: Files that represent entry points
- **Layers**: Architectural layers in the codebase
- **Ignored folders**: Technical directories to skip

## Supported Adapters

| Adapter | Detection Signals |
|---------|-------------------|
| JavaScript/TypeScript | `package.json`, `tsconfig.json`, `vite.config.ts` |
| NestJS | `nest-cli.json`, `main.ts` |
| Django | `manage.py`, `settings.py` |
| Flask/FastAPI | `app.py`, `main.py`, `requirements.txt` |
| FastAPI | `main.py`, `app.py` |
| Ruby on Rails | `Gemfile`, `config.ru` |
| Laravel | `artisan`, `composer.json` |
| Elixir Phoenix | `mix.exs`, `phoenix` |
| Spring Boot | `pom.xml`, `build.gradle`, `application.java` |
| Salesforce | `sfdx-project.json`, `force-app/` |
| .NET | `*.csproj`, `Program.cs` |
| ASP.NET Core | `Startup.cs`, `Program.cs` |
| Blazor | `_Imports.razor`, `@page` |

| Adapter | Detection Signals |
|---------|------------------|
| JavaScript/TypeScript | `package.json`, `tsconfig.json`, `vite.config.ts` |
| Django | `manage.py`, `settings.py` |
| Flask/FastAPI | `app.py`, `main.py` |
| Ruby on Rails | `Gemfile`, `config.ru` |
| Salesforce | `sfdx-project.json`, `force-app/` |
| .NET | `*.csproj`, `Program.cs` |
| ASP.NET Core | `Startup.cs`, `Program.cs` |
| Blazor | `_Imports.razor`, `@page` |

## Architecture

```
analysis/
adapters/
  baseAdapter.ts      # Interface definition
  javascriptAdapter.ts
  pythonAdapter.ts
  railsAdapter.ts
  salesforceAdapter.ts
  dotnetAdapter.ts
  adapterRegistry.ts  # Detection logic
```

## Adapter Interface

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

## Detection Signals

Adapters are detected using signals:

```typescript
interface DetectionSignal {
  type: 'file' | 'directory' | 'content';
  pattern: string;
  contentPattern?: string;
}
```

Example:
```typescript
detectionSignals: [
  { type: 'file', pattern: 'package.json' },
  { type: 'file', pattern: 'tsconfig.json' },
  { type: 'directory', pattern: 'src' }
]
```

## Layer Rules

Each adapter defines architectural layers:

```typescript
layerRules: [
  { name: 'api', priority: 1, patterns: ['controller', 'handler', 'route'] },
  { name: 'service', priority: 2, patterns: ['service', 'usecase'] },
  { name: 'data', priority: 3, patterns: ['repository', 'model'] }
]
```

## Usage

```typescript
import { detectAdapter, getAdapter } from './core/adapters/index.js';

// Auto-detect project type
const adapter = detectAdapter('/path/to/project');
console.log(adapter.name); // 'javascript', 'django', etc.

// Get specific adapter
const jsAdapter = getAdapter('javascript');
```

## Creating Custom Adapters

1. Create a new file in `src/core/adapters/`
2. Define your adapter:

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
3. Register in `adapterRegistry.ts`
4. Add tests

## Using the Adapter SDK

AI-First provides a developer-friendly SDK for creating custom adapters:

```typescript
import { createAdapter, validateAdapter, fileSignal, directorySignal } from './core/adapters/sdk.js';

// Create adapter with sensible defaults
export const myAdapter = createAdapter({
  name: 'myframework',
  displayName: 'My Framework',
  detectionSignals: [
    fileSignal('my-framework.config.js'),
    directorySignal('src')
  ],
  featureRoots: ['src', 'lib', 'app'],
  entrypointPatterns: ['Controller', 'Service', 'Handler']
});

// Validate your adapter
const result = validateAdapter(myAdapter);
if (!result.valid) {
  console.error('Adapter errors:', result.errors);
}
```

### SDK Functions

- `createAdapter(config)` - Create adapter with defaults
- `validateAdapter(adapter)` - Validate adapter configuration
- `fileSignal(pattern)` - Create file detection signal
- `directorySignal(pattern)` - Create directory detection signal
- `contentSignal(pattern, contentPattern?)` - Create content-based signal
- `layerRule(name, priority, patterns)` - Create layer rule

## Community Adapters

Community adapters are located in `src/core/adapters/community/`:

- **Laravel** - PHP Laravel framework
- **NestJS** - Node.js progressive framework
- **Spring Boot** - Java/Kotlin framework
- **Phoenix** - Elixir web framework
- **FastAPI** - Python modern framework

### Listing Available Adapters

```bash
ai-first adapters
```

Output:
```
📦 Available adapters:

Name                | Display Name
--------------------|---
javascript        | JavaScript / TypeScript
nestjs            | NestJS
django            | Django
...
```

## Integration

3. Register in `adapterRegistry.ts`
4. Add tests

## Integration

Adapters integrate with feature and flow detection:

- `featureRoots` → where to find features
- `ignoredFolders` → what to skip
- `entrypointPatterns` → business logic entry points
- `layerRules` → flow chain layers

This allows AI-First to understand any codebase structure.
