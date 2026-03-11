# Análisis Incremental

AI-First soporta actualizaciones incrementales que actualizan solo los archivos cambiados sin requerir un análisis completo del repositorio. Esto habilita contexto auto-curativo para agentes IA.

## Por qué Actualizaciones Incrementales?

Ejecutar `ai-first init` analiza todo el repositorio, lo cual puede ser lento para codebases grandes. Las actualizaciones incrementales:

- **Rápido**: Solo analiza archivos cambiados
- **Eficiente**: Actualiza solo metadatos afectados
- **Continuo**: Mantiene el contexto fresco entre ejecuciones

## Cómo Funciona

1. **Detectar Cambios**: Usa `git diff` o timestamps del sistema de archivos
2. **Re-analizar**: Extrae símbolos/dependencias de archivos cambiados
3. **Actualizar Metadata**: Actualiza símbolos, dependencias, features, flows
4. **Reconstruir Grafo**: Actualiza el grafo de conocimiento con cambios

## Uso

### Comando CLI

```bash
# Actualización incremental (usa git)
ai-first update

# Usar timestamps del sistema en lugar de git
ai-first update --no-git

# Directorio raíz personalizado
ai-first update --root /path/to/project

# Salida JSON
ai-first update --json
```

### Uso Programático

```typescript
import { 
  runIncrementalUpdate,
  detectChangedFiles,
  updateSymbols,
  updateFeatures,
  updateFlows
} from 'ai-first';

// Actualización incremental completa
const result = runIncrementalUpdate('/path/to/project');

console.log(result.changedFiles);
console.log(result.updatedSymbols);
console.log(result.updatedFeatures);

// O usar funciones individuales
const changes = detectChangedFiles('/path/to/project');
const updated = updateSymbols('/path/to/project', changes, aiDir);
```

## Salida

```
🔄 Running incremental update in: /path/to/project

📁 Changed files: 5
   modified: src/auth/login.ts
   modified: src/auth/userService.ts
   added: src/payments/checkout.ts
   deleted: src/old/legacy.ts

🔧 Updated:
   Symbols: 12
   Dependencies: 2
   Features: auth
   Flows: login
   Knowledge Graph: ✅
```

## Referencia API

### runIncrementalUpdate(rootDir, aiDir?)

Realiza actualización incremental completa. Retorna:

```typescript
{
  changedFiles: ChangedFile[];
  updatedSymbols: number;
  updatedDependencies: number;
  updatedFeatures: string[];
  updatedFlows: string[];
  graphUpdated: boolean;
  errors: string[];
}
```

### detectChangedFiles(rootDir, useGit?)

Detecta archivos cambiados usando git (default) o timestamps del sistema.

### updateSymbols(rootDir, changes, aiDir)

Re-extrae símbolos de archivos cambiados y actualiza `ai/symbols.json`.

### updateDependencies(rootDir, changes, aiDir)

Re-extrae dependencias de archivos de paquetes cambiados.

### updateFeatures(rootDir, changes, aiDir)

Actualiza features que contienen archivos cambiados.

### updateFlows(rootDir, changes, aiDir)

Actualiza flows que contienen archivos cambiados.

### updateKnowledgeGraph(rootDir, aiDir)

Reconstruye el grafo de conocimiento con datos actuales.

## Contexto Auto-Curativo

Las actualizaciones incrementales habilitan contexto auto-curativo para agentes IA:

1. El agente hace cambios al codebase
2. El desarrollador corre `ai-first update`
3. El contexto IA se refresca con archivos nuevos/cambiados
4. La siguiente consulta del agente usa contexto actualizado

Esto crea un ciclo de retroalimentación donde el contexto IA se mantiene fresco sin análisis manual completo.
