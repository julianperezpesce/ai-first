# Detección de Características

AI-First detecta automáticamente características empresariales y flujos desde la estructura de tu código base.

## Reglas de Detección de Características

### 1. Raíces de Candidatos

Las características se escanean dentro de:
- `src/*`
- `app/*`
- `packages/*`
- `services/*`
- `modules/*`
- `features/*`

### 2. Carpetas Ignoradas

Las carpetas técnicas son excluidas:
- `utils`, `helpers`, `types`, `interfaces`, `constants`
- `config`, `dto`, `models`, `common`, `shared`

### 3. Requisitos de Características

Una característica válida debe:
- Contener al menos 3 archivos fuente
- Contener al menos un punto de entrada (Controller, Route, Handler, Command, Service)
- Existir en profundidad 1 o 2: `src/auth`, `src/modules/auth`

## Formato de Salida de Características

```json
{
  "name": "auth",
  "path": "src/auth",
  "files": [
    "src/auth/authController.ts",
    "src/auth/authService.ts",
    "src/auth/authRepository.ts"
  ],
  "entrypoints": [
    "src/auth/authController.ts"
  ],
  "dependencies": ["users", "payments"]
}
```

## Detección de Flujos

Los flujos representan cadenas de ejecución empresarial que comienzan desde puntos de entrada:

- **Mínimo 3 archivos** por flujo
- **Mínimo 2 capas arquitectónicas** (api → service → data)
- Puntos de entrada: Controller, Route, Handler, Command

Los flujos se generan usando tres métodos de respaldo:
1. **Grafo de Símbolos** - Usa relaciones de llamada/importación
2. **Estructura de Carpetas** - Agrupa por prefijo de característica
3. **Análisis de Importaciones** - Sigue cadenas de dependencias

## Ubicación de Salida

Las características y flujos se escriben en:
```
ai/context/features/<caracteristica>.json
ai/context/flows/<flujo>.json
```
