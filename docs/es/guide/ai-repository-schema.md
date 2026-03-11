# Esquema de Repositorio AI

El Esquema de Repositorio AI estandariza cómo AI-First almacena y administra los metadatos del repositorio, permitiendo que los agentes de IA comprendan la estructura del proyecto y mantengan compatibilidad entre versiones.

## Descripción General

AI-First genera tres archivos de esquema principales que definen la estructura del proyecto:

- `schema.json` - Versión del esquema y metadatos
- `project.json` - Información del proyecto (features, flows, lenguajes, frameworks)
- `tools.json` - Herramientas y agentes de IA compatibles

## Archivos de Esquema

### schema.json

Contiene la versión del esquema y metadatos de generación:

```json
{
  "schemaVersion": "1.0",
  "generatedBy": "ai-first",
  "generatedAt": "2024-01-15T10:30:00.000Z"
}
```

### project.json

Contiene información específica del proyecto:

```json
{
  "name": "mi-proyecto",
  "rootDir": "/ruta/al/proyecto",
  "features": ["auth", "users", "payments"],
  "flows": ["login", "checkout", "registration"],
  "languages": ["TypeScript", "Python"],
  "frameworks": ["Express", "React"],
  "generatedAt": "2024-01-15T10:30:00.000Z"
}
```

### tools.json

Define los agentes de IA compatibles:

```json
{
  "compatibleAgents": ["ai-first-bridge", "opencode", "cursor", "windsurf", "cline"],
  "schemaVersion": "1.0"
}
```

## Detección Automática

AI-First detecta automáticamente:

- **Features**: Desde archivos `ai/context/features/*.json`
- **Flows**: Desde archivos `ai/context/flows/*.json`
- **Lenguajes**: Desde `ai/tech_stack.md` (sección Languages)
- **Frameworks**: Desde `ai/tech_stack.md` (sección Frameworks)

## Compatibilidad de Versiones

El esquema usa versionamiento semántico. AI-First valida la compatibilidad:

- Misma versión mayor = compatible
- Diferente versión mayor = incompatible

## Comandos CLI

### Generar Esquema

El esquema se genera automáticamente con `ai-first init`:

```bash
ai-first init
```

### Validar Esquema

Verifica si tu repositorio tiene un esquema válido:

```javascript
import { validateSchema } from 'ai-first';

const result = validateSchema('./ai');
console.log(result.valid);  // true/false
console.log(result.errors); // []
```

### Cargar Esquema

Carga el esquema programáticamente:

```javascript
import { loadFullSchema } from 'ai-first';

const schema = loadFullSchema('./ai');
if (schema) {
  console.log(schema.project.name);
  console.log(schema.schema.schemaVersion);
}
```

## Integración

El esquema está integrado en el CLI de AI-First:

1. `ai-first init` - Genera archivos de esquema
2. `ai-first validate` - Valida el esquema (próximamente)
3. `ai-first doctor` - Verifica la salud del esquema

## Beneficios

- **Seguridad de Versión**: Los agentes de IA saben qué versión del esquema esperar
- **Descubrimiento de Proyecto**: Features y flows se detectan automáticamente
- **Compatibilidad de Agentes**: Lista clara de herramientas de IA compatibles
- **Extensibilidad**: El esquema puede extenderse para agentes personalizados
