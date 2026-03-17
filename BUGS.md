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

#### Bug 2: Relaciones de símbolos muestran 0
**Estado**: ✅ Corregido  
**Fecha**: 2026-03-17  
**Severidad**: Media  

**Descripción**: El comando `context` no mostraba todos los tipos de relaciones disponibles. Solo mostraba: Calls, Called by, Imports, Instantites. Pero el graph tiene más tipos: Exports, References.

**Solución implementada**: Se modificó `src/commands/ai-first.ts` para mostrar también Exports y References.

**Nota**: Los problemas de detección de imports en Python y React se resolvieron en el Bug 11.

**Archivos modificados**:
- `src/commands/ai-first.ts`

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
**Estado**: ⚠️ Pendiente  
**Fecha**: 2026-03-17  
**Severidad**: Baja  

**Descripción**: 6 vulnerabilidades moderate en `vitepress` y `vitest` (relacionadas con `esbuild`).

**Comando que revela el problema**:
```bash
npm audit
```

**Output**:
```
6 moderate severity vulnerabilities
```

**Nota**: Todas las vulnerabilidades son en dependencias de **desarrollo**, no afectan el runtime de producción.

**Acción sugerida**: Evaluar actualizar a versiones sin vulnerabilidades, o aceptar el riesgo dado que solo afecta el entorno de desarrollo.

---

## Pendientes por hacer

- [ ] Investigar Bug 2: Relaciones de símbolos mostrando 0
- [ ] Limpiar CHANGELOG.md duplicado
- [ ] Evaluar vulnerabilidades de npm audit
- [ ] Bug 7: Flows con rutas incorrectas en Express (pendiente)
- [x] Bug 2: Context muestra relationships - PARCIALMENTE CORREGIDO
- [ ] Bug 10: Símbolos Apex no extraídos (0 símbolos en Salesforce)
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
**Estado**: ⚠️ Pendiente  
**Fecha**: 2026-03-17  
**Severidad**: Alta  

**Descripción**: El archivo `symbols.json` no extrae símbolos de archivos Apex (.cls). El comando `map` genera 0 símbolos para proyectos Salesforce.

**Comando**:
```bash
node dist/commands/ai-first.js map --root test-projects/salesforce-cli
# Output: "Symbols: 0"
```

**Causa raíz**: El analyzer `src/analyzers/symbols.ts` no incluye lógica para parsear Apex. Aunque `aiContextGenerator.ts` tiene soporte para Apex, no se usa para generar symbols.json.

**Solución sugerida**: Agregar soporte para Apex en `src/analyzers/symbols.ts` para extraer clases, métodos y triggers de archivos .cls.

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
**Estado**: ⚠️ Pendiente  
**Severidad**: Media  

**Descripción**: Los flows generados para Express tienen rutas incorrectas.

**Archivo problematico**: `test-projects/express-api/ai/context/flows/authController.json`

**Contenido actual**:
```json
{
  "name": "authController",
  "entrypoint": "controllers/authController.js",
  "files": [
    "controllers/authController.js",
    "jsonwebtoken",  ← INCORRECTO: es una dependencia npm
    "controllers/../services/authService/index"  ← INCORRECTO: ruta mal formada
  ]
}
```

**Solución sugerida**: Revisar el código de generación de flows en `src/core/semanticContexts.ts` para filtrar dependencias npm y corregir rutas.

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
