# Bugs y Problemas Encontrados

## Historial

### 2026-03-17

#### Bug 1: Features y Flows vacíos (YA CORREGIDO)
**Estado**: ✅ Corregido  
**Fecha**: 2026-03-17  
**Severidad**: Alta  

**Descripción**: Al ejecutar `ai-first init`, los directorios `ai/context/features/` y `ai/context/flows/` estaban vacíos.

**Causa raíz**: La función `isEntrypoint` en `src/core/semanticContexts.ts` solo buscaba patrones en el nombre del archivo (`authController.ts`), pero no consideraba que los archivos podían estar en directorios como `/commands/`, `/handlers/`, etc.

**Solución implementada**: Se modificó `isEntrypoint` para que también detecte entrypoints cuando el path contiene `/commands/`, `/handlers/`, `/controllers/`, `/services/`, `/routes/`.

**Archivos modificados**:
- `src/core/semanticContexts.ts`

---

#### Bug 2: Relaciones de símbolos (Parcial - Limitación conocida)
**Estado**: ⚠️ Parcialmente corregido - Limitación arquitectónica  
**Fecha**: 2026-03-17  
**Severidad**: Media  

**Problema original**: El comando `context` no mostraba todos los tipos de relaciones disponibles.

**Progreso**:
- ✅ FIXED: Ahora muestra todos los tipos: Calls, Called by, Imports, Exports, References
- ✅ FIXED: Imports/Exports se detectan correctamente (resuelto en Bug 11)
- ⚠️ KNOWN LIMITATION: Calls y Called by siempre muestran 0

**Limitación técnica**:
El sistema actual NO puede detectar relaciones de llamada (calls/called_by) porque:
1. Requiere análisis del AST (Abstract Syntax Tree) completo
2. Necesita resolver scopes, imports, y referencias de variables
3. El parser actual es basado en regex, no en AST real
4. Para implementarlo completamente se necesitaría:
   - Integrar TypeScript compiler API o Babel
   - Reconstruir el grafo de llamadas completo
   - Mapear cada llamada de función a su símbolo correspondiente
   - **Esfuerzo estimado**: 3-5 días de desarrollo intensivo

**Impacto**: Bajo-Medio. Las relaciones imports/exports funcionan correctamente y son las más importantes para entender dependencias.

**Decisión**: Aceptar como limitación conocida. El 80% del valor está en imports/exports que funcionan correctamente.

**Archivos involucrados**:
- `src/commands/ai-first.ts` (muestra los tipos)
- `src/core/symbolGraph.ts` (necesitaría AST parser para calls)

---

#### Bug 3:duplicado en CHANGELOG.md
**Estado**: ⚠️ Pendiente  
**Fecha**: 2026-03-17  
**Severidad**: Baja  

**Descripción**: El archivo CHANGELOG.md contiene contenido duplicado. Las mismas features aparecen listadas múltiples veces.

**Ejemplos**:
- Líneas 15-16: "AI Repository Schema" duplicado
- Líneas 21-22: "Incremental Analysis" duplicado
- Líneas 25-28: "Repository Knowledge Graph" duplicado

**Acción sugerida**: Limpiar manualmente el archivo, eliminando duplicados.

---

#### Bug 4: Vulnerabilidades en dependencias de dev
**Estado**: ⚠️ Parcialmente corregido - Riesgo aceptado  
**Fecha**: 2026-03-17  
**Severidad**: Baja  

**Descripción**: Vulnerabilidades en dependencias de desarrollo (`vitepress`, `vitest`, `esbuild`).

**Progreso**:
- Inicial: 6 vulnerabilidades moderate
- Después de actualizar vitest a 4.x: 3 vulnerabilidades moderate

**Vulnerabilidades restantes**:
- `esbuild <=0.24.2` (a través de `vite` -> `vitepress`)
- Afecta solo el servidor de desarrollo de Vite

**Notas**:
- Todas las vulnerabilidades son en dependencias de **desarrollo**
- No afectan el runtime de producción de ai-first-cli
- Requieren acceso al servidor de desarrollo local para explotarse
- Solución completa requeriría romper compatibilidad con vitepress

**Decisión**: Aceptar el riesgo dado el bajo impacto y alto costo de migración.

---

## Pendientes por hacer

- [ ] Investigar Bug 2: Relaciones de símbolos mostrando 0 (parcial - detecta imports/exports pero no calls)
- [ ] Limpiar CHANGELOG.md duplicado (ya está limpio en versión 1.1.4)
- [x] Evaluar vulnerabilidades de npm audit - Reducidas de 6 a 3, riesgo aceptado
- [x] Bug 7: Flows con rutas incorrectas en Express - CORREGIDO
- [x] Bug 2: Context muestra relationships - PARCIALMENTE CORREGIDO
- [x] Bug 10: Símbolos Apex no extraídos - CORREGIDO
- [x] Bug 11: Python/JSX no detectan imports - CORREGIDO

---

### Bug 8: Extensiones Salesforce no incluidas en escaneo
**Estado**: ✅ Corregido  
**Fecha**: 2026-03-17  
**Severidad**: Alta  

**Descripción**: Las extensiones de Salesforce (.cls, .trigger) no estaban incluidas en DEFAULT_INCLUDE_EXTENSIONS, por lo que el scanner no detectaba archivos Apex.

**Archivo modificado**: `src/utils/fileUtils.ts`

**Extensiones agregadas**: `.cls`, `.trigger`, `.apex`, `.object`

**Verificación**: Ahora el proyecto `salesforce-cli` detecta los archivos .cls y .trigger.

---

### Bug 9: TechStack no detecta Salesforce
**Estado**: ⚠️ Pendiente  
**Fecha**: 2026-03-17  
**Severidad**: Media  

**Descripción**: Aunque ahora se escanean los archivos Apex, el analizador de techStack no detecta Salesforce como framework. Debería identificar proyectos con `sfdx-project.json` y archivos `.cls`.

**Solución sugerida**: Agregar detección de Salesforce en `src/analyzers/techStack.ts` buscando archivos `sfdx-project.json` o extensiones `.cls`.

---

### Bug 10: Analyzer de símbolos no soporta Apex
**Estado**: ✅ Corregido  
**Fecha**: 2026-03-17  
**Severidad**: Alta  

**Descripción**: El archivo `symbols.json` no extrae símbolos de archivos Apex (.cls). El comando `map` genera 0 símbolos para proyectos Salesforce.

**Causa raíz**: El analyzer `src/analyzers/symbols.ts` no incluye lógica para parsear Apex. No había un parser para las extensiones `.cls` y `.trigger`.

**Solución implementada**: 
- Se agregó la función `parseApex()` en `src/analyzers/symbols.ts`
- Se agregaron las extensiones `.cls` y `.trigger` al switch de `parseFileForSymbols()`
- El parser detecta: clases (con `with sharing`, `without sharing`), interfaces, métodos (con `@AuraEnabled`), y triggers

**Archivo modificado**: `src/analyzers/symbols.ts`

**Verificación**:
```bash
node dist/commands/ai-first.js map --root test-projects/salesforce-cli
# Output: "Symbols: 7"
# Extrae: AccountController, createAccount, updateAccountRating, 
#          OpportunityController, closeWon, validateOpportunity, AccountTrigger
```

### Bug 5: Features vacíos con comando `init`
**Estado**: ✅ Corregido  
**Severidad**: Alta  

**Descripción**: El comando `init` no genera features ni flows porque no crea el archivo `modules.json` que es requerido por `generateSemanticContexts()`.

**Solución implementada**: 
1. Se modificó `runAIFirst()` en `src/commands/ai-first.ts` para generar `modules.json` antes de llamar a `generateSemanticContexts()`
2. Se agregaron más raíces de candidatos en `semanticContexts.ts` para detectar proyectos MVC/Express
3. Se relajó el mínimo de archivos de 3 a 2 para proyectos pequeños
4. Se agregaron extensiones de Salesforce a `SOURCE_EXTENSIONS`
5. Se simplificó la lógica para usar módulos directamente de `modules.json`

**Archivos modificados**:
- `src/commands/ai-first.ts`
- `src/core/semanticContexts.ts`
- `src/utils/fileUtils.ts`

---

### Bug 6: Features no detectados en proyectos JS/Python/React
**Estado**: ✅ Corregido  
**Severidad**: Alta  

**Descripción**: Los proyectos JavaScript, Python y React no generaban features.

**Solución implementada**: 
- Se agregaron `controllers`, `routes`, `handlers`, `views`, `pages` a `CANDIDATE_ROOTS`
- Se eliminó `models` y `services` de `IGNORED_FOLDERS`
- Se cambió la lógica para usar módulos directamente de `modules.json` en lugar de buscar subdirectorios
- Se relajó el mínimo de archivos de 3 a 2

---

### Bug 7: Flows con rutas incorrectas en Express
**Estado**: ✅ Corregido  
**Fecha**: 2026-03-17  
**Severidad**: Media  

**Descripción**: Los flows generados para Express tenían rutas incorrectas y dependencias npm.

**Problema**:
- Dependencias npm como `jsonwebtoken` aparecían en los flows
- Rutas mal formadas como `controllers/../services/authService/index`

**Causa raíz**: La función `normalizeImportPath` no filtraba dependencias npm y no normalizaba rutas correctamente.

**Solución implementada**:
- Modificada `normalizeImportPath` para retornar `null` en lugar del path para dependencias npm
- Agregada normalización de rutas con `path.normalize()` para eliminar `.` y `..`
- Eliminado slash inicial si está presente

**Archivo modificado**: `src/analyzers/dependencies.ts`

**Verificación**:
```json
{
  "name": "auth",
  "entrypoint": "controllers/authController.js",
  "files": [
    "controllers/authController.js",
    "services/authService.js"
  ]
}
```

---

### Bug 11: Python/JSX no detectan imports (solo exports)
**Estado**: ✅ Corregido  
**Fecha**: 2026-03-17  
**Severidad**: Alta  

**Descripción**: Los proyectos Python y React/JSX solo detectaban relaciones de tipo "exports", pero no "imports". Esto causaba que el symbol graph mostrara 0 imports para estos proyectos.

**Causa raíz**: 
1. `findTargetSymbol` en `symbolGraph.ts` no encontraba los símbolos objetivo porque buscaba por nombre exacto, pero los símbolos tienen IDs como `file.py#functionName`
2. `normalizeImportPath` en `dependencies.ts` añadía `/index` a todas las rutas de importación, pero esto es incorrecto para imports como `../context/AuthContext` que deberían resolverse a `AuthContext.tsx`

**Solución implementada**:
1. Se modificó `findTargetSymbol` para buscar símbolos en el archivo objetivo cuando no encuentra match exacto
2. Se simplificó `normalizeImportPath` para usar `path.join()` correctamente y eliminar la lógica incorrecta de `/index`

**Archivos modificados**:
- `src/core/symbolGraph.ts`
- `src/analyzers/dependencies.ts`

**Verificación**:
- python-cli: 7 imports, 14 exports ✅
- react-app: 38 imports, 12 exports ✅

---

### Bug A: index command no genera index.db
**Estado**: ✅ Corregido  
**Fecha**: 2026-03-17  
**Severidad**: Alta  

**Descripción**: El comando `index` generaba el archivo `index.db` en el directorio actual en lugar de en el directorio especificado por `--root`.

**Causa raíz**: El `outputPath` se inicializaba con `process.cwd()` antes de parsear los argumentos, y no se actualizaba cuando se especificaba `--root`.

**Solución implementada**: Se modificó el comando `index` para que:
1. El `outputPath` sea `null` inicialmente
2. Se calcule el path por defecto basado en `rootDir` después de parsear todos los argumentos
3. Solo si no se especificó `--output` explícitamente

**Archivos modificados**:
- `src/commands/ai-first.ts`

**Verificación**: 
```bash
ai-first index --root test-projects/express-api
# Ahora genera: test-projects/express-api/ai/index.db ✅
```

---

### Bug B: graph command falla sin repositorio git
**Estado**: ✅ Corregido  
**Fecha**: 2026-03-17  
**Severidad**: Alta  

**Descripción**: El comando `graph` fallaba con exit code 1 si el proyecto no era un repositorio git.

**Causa raíz**: El comando requería explícitamente un repositorio git y hacía `process.exit(1)` si no lo encontraba.

**Solución implementada**: 
1. Se cambió el error fatal a un warning
2. Se permite generar el knowledge graph sin información git
3. Se usa la información disponible (features, flows, symbols, dependencies)
4. Se agregó la opción `--no-git` para forzar modo sin git

**Archivos modificados**:
- `src/commands/ai-first.ts`

**Verificación**:
```bash
ai-first graph --root test-projects/express-api
# Antes: ❌ Exit 1 - "Not a git repository"
# Después: ✅ Exit 0 - Genera knowledge-graph.json
```

---

### Bug C: query command falla
**Estado**: ✅ Corregido  
**Fecha**: 2026-03-17  
**Severidad**: Media  

**Descripción**: El comando `query` fallaba con exit code 1 porque no encontraba el archivo `index.db`.

**Causa raíz**: Era un efecto secundario del Bug A. Como `index` no generaba `index.db` en la ubicación correcta, `query` no podía encontrarlo.

**Solución implementada**: Se corrigió el Bug A, lo cual resolvió automáticamente el Bug C.

**Archivos involucrados**:
- `src/commands/ai-first.ts` (mismo fix que Bug A)

**Verificación**:
```bash
ai-first query symbol login --root test-projects/express-api
# Antes: ❌ Exit 1 - "Index not found"
# Después: ✅ Exit 0 - Encuentra símbolos
```

---

## Bugs Pendientes

- [ ] Bug 2 (Parcial): Calls/Called by detection requiere AST parser completo (limitación aceptada)
- [ ] Bug 4 (Parcial): 3 vulnerabilidades npm restantes (riesgo aceptado - dev only)

### Bug D: Contador de features/flows incorrecto en Salesforce CLI
**Estado**: ⚠️ Confirmado - Fix pendiente
**Fecha**: 2026-03-22
**Severidad**: Baja (cosmético)

**Descripción**: El comando `ai-first init` muestra "Created 0 features, 0 flows" para proyectos Salesforce, pero los archivos SÍ se generan correctamente.

**Evidencia**:
```bash
# Mensaje mostrado:
✅ Created 0 features, 0 flows

# Realidad:
$ ls test-projects/salesforce-cli/ai-context/context/features/
→ force-app.json  (1 feature válido)

$ ls test-projects/salesforce-cli/ai-context/context/flows/
→ account.json, opportunity.json  (2 flows válidos)
```

**Impacto**: Ninguno en funcionalidad. Los archivos se generan correctamente, solo el mensaje de conteo es incorrecto.

**Fix sugerido**: Revisar la función `runAIFirst()` en `src/commands/ai-first.ts` donde se cuenta features/flows para el mensaje de salida.

---

---

## Nuevos Issues Identificados (Para futuras versiones)

### Issue 1: Testing de proyectos diversos
**Estado**: ⚠️ Pendiente
**Severidad**: Media

**Problema**: Actualmente solo se testean 5 tipos de proyectos (Express, NestJS, Python, React, Salesforce). Hay muchos más frameworks/lenguajes soportados que no tienen tests:
- Laravel (PHP)
- Django/Flask (Python web)
- Rails (Ruby)
- Spring Boot (Java)
- Phoenix (Elixir)
- ASP.NET Core (C#)
- Blazor (.NET)
- FastAPI (Python)
- Y más...

**Solución sugerida**: Crear test projects para cada framework soportado y automatizar las pruebas.

---

### Issue 2: Archivos duplicados
**Estado**: ⚠️ Pendiente
**Severidad**: Media

**Problema**: Se generan archivos duplicados con diferentes convenciones de nombre:
- `repo-map.json` (kebab-case)
- `repo_map.json` (snake_case)
- `repo_map.md` (snake_case)

**Impacto**: Confusión para usuarios, archivos innecesarios que ocupan espacio.

**Solución sugerida**: Consolidar en un solo archivo usando snake_case consistente: `repo_map.json`.

---

### Issue 3: Inconsistencias en convenciones de nomenclatura
**Estado**: ⚠️ Pendiente
**Severidad**: Baja-Media

**Problema**: Mezcla de convenciones de nombre en archivos generados:
- Kebab-case: `repo-map.json`, `module-graph.json`, `symbol-graph.json`
- Snake_case: `repo_map.md`, `ai_context.md`, `tech_stack.md`
- CamelCase: `aiContext` (en código), `contextPacket`

**Impacto**: Dificulta recordar nombres de archivos, inconsistencia visual.

**Solución sugerida**: Estandarizar todo a snake_case:
- `repo_map.json` (no `repo-map.json`)
- `module_graph.json` (no `module-graph.json`)
- `symbol_graph.json` (no `symbol-graph.json`)
- `ai_context.md` (ya está bien)

---

### Issue 4: Organización de carpeta ai/
**Estado**: ⚠️ Pendiente
**Severidad**: Media

**Problema**: La carpeta `ai/` contiene archivos que NO son generados por el CLI:
- `ai/` en el repositorio contiene archivos del propio proyecto (meta)
- Los usuarios esperan que `ai/` solo contenga archivos generados por `ai-first`
- Mezcla de archivos de ejemplo/documentación con archivos de análisis real

**Impacto**: Confusión sobre qué archivos deberían versionarse vs ignorarse.

**Solución sugerida**:
1. Renombrar la carpeta de ejemplo/documentación a `.ai-example/` o `ai-example/`
2. O mover los archivos de ejemplo a `docs/examples/ai/`
3. Agregar `.ai/` a `.gitignore` para que los usuarios no versionen archivos generados
4. Documentar claramente qué archivos son generados vs manuales

---

### Issue 5: Limpieza de archivos temporales/cache
**Estado**: ⚠️ Pendiente
**Severidad**: Baja

**Problema**: Archivos temporales y de caché se acumulan en `ai/`:
- `cache.json` - puede ser grande
- `index-state.json` - estado interno
- `embeddings.json` - muy grande (706KB en ejemplo)

**Solución sugerida**:
1. Crear subcarpeta `ai/.cache/` para archivos temporales
2. Agregar `ai/.cache/` a `.gitignore` por defecto
3. Documentar qué archivos son seguros para versionar

---

### Issue 6: Documentación desactualizada
**Estado**: ⚠️ Pendiente
**Severidad**: Baja

**Problema**: Algunos archivos README tienen información desactualizada:
- Referencias a comandos que cambiaron de nombre
- Ejemplos con rutas antiguas
- Badge links que podrían estar rotos

**Solución sugerida**: Revisión completa de documentación en inglés y español.

---

### Issue 7: Mejorar manejo de errores en git command
**Estado**: ⚠️ Pendiente  
**Severidad**: Baja

**Problema**: El comando `git` muestra error crudo cuando no hay repositorio:
```
❌ Not a git repository
EXIT_CODE: 1
```

**Solución sugerida**: Mostrar mensaje más amigable:
```
⚠️  No git repository found in <path>
💡  Run 'git init' first to enable git analysis
```

---

*Documento actualizado: 2026-03-17*
