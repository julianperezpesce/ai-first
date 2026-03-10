# Detección de Flujos

Los flujos representan cadenas de ejecución empresarial que atraviesan múltiples capas arquitectónicas en tu código base.

## Descripción General

La detección de flujos identifica cómo fluyen los datos a través de tu aplicación desde los puntos de entrada hasta las capas de acceso a datos.

### Ejemplo de Flujo

```
LoginController → AuthService → UserRepository
```

Esto representa una arquitectura de tres niveles típica:
1. **Capa API**: LoginController (punto de entrada)
2. **Capa de Servicio**: AuthService (lógica de negocio)
3. **Capa de Datos**: UserRepository (persistencia)

## Métodos de Detección

AI-First usa múltiples métodos de respaldo para detectar flujos:

### 1. Grafo de Símbolos (Primario)

Cuando las relaciones de símbolos son fuertes, los flujos se detectan analizando:
- Llamadas de funciones (`calls`)
- Importaciones de módulos (`imports`)
- Referencias de símbolos (`references`)

**Requisitos:**
- Densidad del grafo de símbolos ≥ 0.5
- Al menos 10 relaciones

### 2. Estructura de Carpetas (Respaldo)

 Cuando el grafo de símbolos es débil, los flujos se infieren de:
- Convenciones de nombres de archivos (ej. `authController.ts`, `authService.ts`)
- Agrupación por prefijo de característica

**Ejemplo:**
- `authController.ts` → característica: `auth`
- `authService.ts` → pertenece al flujo `auth`
- `authRepository.ts` → pertenece al flujo `auth`

### 3. Análisis de Importaciones (Respaldo)

Usa el análisis de dependencias para rastrear rutas de ejecución:
1. Iniciar desde archivos de punto de entrada
2. Seguir declaraciones de importación
3. Construir cadena hasta MAX_FLOW_DEPTH

## Configuración

### Límites

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `MAX_FLOW_DEPTH` | 5 | Profundidad máxima de recorrido |
| `MAX_FLOW_FILES` | 30 | Máximo de archivos por flujo |

### Puntos de Entrada

Los flujos deben comenzar desde uno de estos tipos de archivos:
- Controller
- Route
- Handler
- Command

### Capas

Capas arquitectónicas soportadas:
| Capa | Patrones |
|-------|----------|
| api | controller, handler, route, router, endpoint |
| service | service, services, usecase, interactor |
| data | repository, repo, dal, dao, data, persistence |
| domain | model, entity, schema, domain |

## Requisitos

Un flujo válido debe tener:
- **Mínimo 3 archivos**
- **Mínimo 2 capas arquitectónicas**

## Formato de Salida

Los flujos se escriben en: `ai/context/flows/<nombre-flujo>.json`

```json
{
  "name": "auth",
  "entrypoint": "api/authController.js",
  "files": [
    "api/authController.js",
    "services/authService.js",
    "data/authRepository.js"
  ],
  "depth": 3,
  "layers": ["api", "service", "data"]
}
```

### Campos de Salida

| Campo | Descripción |
|-------|-------------|
| `name` | Identificador del flujo (derivado del punto de entrada) |
| `entrypoint` | Archivo de inicio (Controller/Route/Handler/Command) |
| `files` | Todos los archivos en la cadena del flujo |
| `depth` | Profundidad real del recorrido |
| `layers` | Capas únicas recorridas |

## Uso

Los flujos se generan automáticamente al ejecutar:

```bash
ai-first map
# o
ai-first init
```

## Integración

Los flujos funcionan con las Características para proporcionar contexto completo:

- **Características**: Identifican módulos de negocio (auth, users, payments)
- **Flujos**: Identifican cómo se ejecuta el código dentro de las características

Juntos permiten a los agentes de IA:
1. Entender la estructura del dominio de negocio
2. Rastrear rutas de ejecución
3. Localizar código relevante para modificaciones
