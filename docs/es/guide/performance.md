# Optimización de Rendimiento

AI-First está optimizado para manejar repositorios grandes eficientemente a través de análisis incremental y caché inteligente.

## Indexación Incremental

AI-First rastrea cambios de archivos para evitar reprocesar todo el repositorio en cada ejecución.

### Cómo Funciona

1. **Rastreo de Hash de Archivos**: El contenido de cada archivo es hasheado (MD5)
2. **Almacenamiento de Estado**: Los hashes se almacenan en `ai/index-state.json`
3. **Detección de Cambios**: En cada ejecución, solo los archivos modificados son re-indexados

### Formato del Archivo de Estado

```json
{
  "version": "1.0.0",
  "lastIndexed": "2026-03-10T12:00:00.000Z",
  "totalFiles": 150,
  "files": {
    "src/auth/AuthService.ts": {
      "path": "src/auth/AuthService.ts",
      "hash": "abc123...",
      "mtime": 1699531200000,
      "size": 1024,
      "indexedAt": "2026-03-10T12:00:00.000Z"
    }
  }
}
```

### Ejemplo de Salida CLI

```
🗄️  Generating index for: /project

   Total files: 150
   To index: 5
   Unchanged: 145
   New: 2
   Deleted: 0
```

## Contextos Semánticos

Los contextos semánticos (features y flows) se regeneran basados en la estructura actual del módulo:

- **Features**: Derivado de `modules.json` - regenerado cuando cambia la estructura de módulos
- **Flows**: Derivado de `symbol-graph.json` - regenerado cuando cambian las relaciones de símbolos

Estos son cálculos ligeros comparados con la extracción completa de símbolos.

## Consejos de Rendimiento

### 1. Usar Modo Incremental

El comportamiento por defecto es incremental. No uses `--force` a menos que sea necesario.

```bash
# Incremental (por defecto)
ai-first map

# Rebuild completo
ai-first map --force
```

### 2. Excluir Archivos Innecesarios

Usa `.aiignore` para excluir directorios grandes o irrelevantes:

```
# .aiignore
node_modules/
dist/
build/
coverage/
*.log
```

### 3. Repositorios Grandes

Para repositorios con >2000 archivos, la indexación semántica se habilita automáticamente:

```bash
ai-first map
# Usa modo semántico automáticamente para repos grandes
```

### 4. Integración con Git

AI-First puede usar Git para detectar archivos cambiados:

```bash
# Solo analizar archivos cambiados
git commit -am "update" && ai-first map
```

## Benchmarks

| Tamaño del Repositorio | Archivos | Tiempo (Primera vez) | Tiempo (Incremental) |
|------------------------|----------|----------------------|---------------------|
| Pequeño                | 50       | 0.3s                | 0.1s                |
| Mediano                | 200      | 1.2s                | 0.3s                |
| Grande                 | 1000     | 5.5s                | 1.2s                |
| Huge                   | 5000     | 28s                 | 5s                  |

## Solución de Problemas

### Rendimiento Lento

1. **Verificar cantidad de archivos**: `ai-first doctor`
2. **Excluir directorios**: Agregar a `.aiignore`
3. **Limpiar caché**: Eliminar `ai/index-state.json`

### Problemas de Memoria

Para repositorios muy grandes (>10k archivos):

```bash
ai-first map --semantic
```

Esto usa análisis por streaming para reducir el uso de memoria.
