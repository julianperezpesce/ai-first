# Generación de Contexto Perezcoso (Lazy)

La generación de contexto perezcoso mejora el tiempo de inicio del CLI al generar el contexto del repositorio en etapas, analizando solo lo necesario cuando se necesita.

## Cómo Funciona

### Etapa 1: Índice Mínimo (Inicio Rápido)

Cuando ejecutas `ai-first init`, solo se genera metadatos esenciales:

- **repo-map**: Estructura de directorios
- **languages**: Lenguajes de programación detectados
- **frameworks**: Frameworks detectados
- **entrypoints**: Puntos de entrada de la aplicación

Esta etapa está optimizada para un **inicio rápido** - típicamente menos de 1 segundo para la mayoría de los repositorios.

### Etapa 2: Contexto Completo (Bajo Demanda)

El contexto adicional se genera solo cuando se solicita:

- **symbols**: Funciones, clases, interfaces
- **dependencies**: Relaciones de importación
- **features**: Módulos de características de negocio
- **flows**: Cadenas de ejecución
- **knowledge graph**: Gráfico completo del repositorio

Condiciones de activación:
- Cuando se accede a una característica específica
- Cuando el plugin solicita contexto detallado
- Cuando se genera un CCP (Context Control Pack)

## Beneficios de Rendimiento

| Tamaño del Repositorio | Índice Completo | Índice Perezcoso (Etapa 1) |
|------------------------|-----------------|---------------------------|
| Pequeño (50 archivos) | ~0.5s | ~0.1s |
| Mediano (200 archivos) | ~2s | ~0.3s |
| Grande (1000 archivos) | ~10s | ~1s |
| Enorme (5000 archivos) | ~30s | ~3s |

**Tiempo ahorrado**: 70-90% para el inicio inicial del CLI

## Uso

### Comportamiento Predeterminado (Perezcoso)

```bash
ai-first init
# Genera solo índice mínimo (~1s)
```

### Índice Completo (Cuando se Necesita)

```bash
# Expandir contexto completo bajo demanda
ai-first map
# o
ai-first context <symbol>
```

### Verificar Estado del Índice

```javascript
import { getLazyIndexState, hasMinimalIndex } from 'ai-first';

const aiDir = './ai';
console.log('Tiene mínimo:', hasMinimalIndex(aiDir));

const state = getLazyIndexState(aiDir);
console.log('Etapa 1:', state?.stage1Complete);
console.log('Etapa 2:', state?.stage2Complete);
```

## API

### buildMinimalIndex(rootDir, aiDir)

Construir índice mínimo de Etapa 1:

```javascript
import { buildMinimalIndex } from 'ai-first';

const minimal = buildMinimalIndex('/ruta/al/proyecto', '/ruta/al/proyecto/ai');
console.log(minimal.languages); // ['TypeScript', 'JavaScript']
```

### expandFeatureContext(rootDir, aiDir, featureName)

Expandir contexto para una característica específica:

```javascript
import { expandFeatureContext } from 'ai-first';

const result = expandFeatureContext('/ruta', '/ruta/ai', 'auth');
if (result.success) {
  console.log('Característica expandida:', result.files);
}
```

### expandFlowContext(rootDir, aiDir, flowName)

Expandir contexto para un flujo específico:

```javascript
import { expandFlowContext } from 'ai-first';

const result = expandFlowContext('/ruta', '/ruta/ai', 'login');
```

### expandFullContext(rootDir, aiDir)

Expandir todo el contexto (Etapa 2):

```javascript
import { expandFullContext } from 'ai-first';

const stats = expandFullContext('/ruta', '/ruta/ai');
console.log(stats);
// { symbols: 150, dependencies: 80, features: 5, flows: 3 }
```

## Gestión de Estado

El estado del índice perezcoso se guarda en `ai/lazy-index-state.json`:

```json
{
  "stage1Complete": true,
  "stage2Complete": false,
  "featuresExpanded": ["auth", "users"],
  "flowsExpanded": ["login"],
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

## Integración

El analizador perezcoso se integra con los comandos CLI existentes:

- `ai-first init` - Solo Etapa 1 (rápido)
- `ai-first map` - Activa Etapa 2
- `ai-first context` - Expande contexto específico bajo demanda
- `ai-first update` - Las actualizaciones incrementales mantienen el estado perezcoso
