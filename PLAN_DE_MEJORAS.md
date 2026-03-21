# Plan de Mejoras — ai-first v2.0

## Fecha de Creación
2026-03-20

## Objetivo
Transformar `ai-context/` de un esqueleto automático en un **contexto rico y actionable** que permita a cualquier IA entender, modificar y extender proyectos de cualquier lenguaje/framework sin leer todo el código fuente.

---

## Lenguajes/Frameworks Soportados

| Lenguaje | Frameworks | Status Detección | Status Mejoras |
|----------|-----------|------------------|----------------|
| **JavaScript/TypeScript** | React, Vue, Angular, Next.js, NestJS, Express | ✅ Básico | Fase 1 |
| **Python** | Django, Flask, FastAPI | ✅ Básico | Fase 1 |
| **Kotlin/Java** | Android, Spring Boot | ⚠️ Parcial | **URGENTE** |
| **Go** | Stdlib, Gin, Echo | ⚠️ Mínimo | Fase 2 |
| **Rust** | Stdlib, Actix, Rocket | ⚠️ Mínimo | Fase 2 |
| **Ruby** | Rails, Sinatra | ✅ Básico | Fase 1 |
| **PHP** | Laravel, Symfony | ✅ Básico | Fase 1 |
| **C#/.NET** | ASP.NET Core, Blazor | ✅ Básico | Fase 1 |
| **Swift** | iOS, Vapor | ⚠️ Mínimo | Fase 2 |
| **Elixir** | Phoenix | ✅ Básico | Fase 1 |
| **Salesforce** | Apex, LWC | ✅ Básico | Fase 1 |

---

## Estado General del Plan

**Última actualización:** 2026-03-20  
**Fase actual:** Ninguna (planificación)  
**Progreso general:** 0%

---

## FASE 1: Fixes Críticos — Detection Engine
**Status:** `pending`  
**Fecha inicio:** —  
**Fecha objetivo:** —  
**Progreso:** 0%

### Objetivo
Arreglar bugs que causan "None detected" y flows vacíos en TODOS los lenguajes.

### Tareas

#### 1.1 Fix Layer Detection Bug (TODOS los lenguajes)
**Status:** `pending`  
**Prioridad:** CRÍTICA  
**Asignado:** —

**Archivos:**
- `src/core/semanticContexts.ts` (línea 103)

**Descripción:**
`getLayer()` usa match exacto. No detecta `auth.controller.ts` como "api" porque busca "controller" exacto.

**Implementación:**
```typescript
// Cambiar de:
if (parts.some(s => patterns.includes(s)))
// A:
if (parts.some(s => patterns.some(p => s.includes(p))))
```

**Criterios de éxito por lenguaje:**
- [ ] JS/TS: `userController.ts` → "api"
- [ ] Python: `auth_views.py` → "api"
- [ ] Kotlin: `UserRepository.kt` → "data"
- [ ] Go: `user_service.go` → "service"
- [ ] Rust: `auth_handler.rs` → "api"
- [ ] Ruby: `users_controller.rb` → "api"
- [ ] PHP: `UserController.php` → "api"
- [ ] C#: `UserController.cs` → "api"
- [ ] Swift: `UserService.swift` → "service"
- [ ] Elixir: `user_controller.ex` → "api"
- [ ] Apex: `UserController.cls` → "api"

**Tests:** Agregar en `tests/semanticContexts.test.ts`

---

#### 1.2 Detectar Librerías Gradle (Android/Kotlin)
**Status:** `pending`  
**Prioridad:** CRÍTICA  
**Asignado:** —

**Archivo:** `src/analyzers/techStack.ts`

**Problema:** `detectLibraries()` solo lee `package.json`. Android usa `build.gradle`.

**Implementación:**
```typescript
function detectGradleLibraries(files: FileInfo[], rootDir: string): string[] {
  const gradleFiles = files.filter(f => 
    f.name.endsWith('.gradle') || f.name.endsWith('.gradle.kts')
  );
  
  const libMap: Record<string, string> = {
    "androidx.leanback": "Android Leanback",
    "androidx.media3": "Media3 (ExoPlayer)",
    "com.google.dagger:hilt": "Dagger Hilt",
    "org.libtorrent4j": "libtorrent4j",
    "androidx.room": "Room",
    "com.squareup.retrofit2": "Retrofit",
    "com.squareup.okhttp3": "OkHttp",
    "io.coil-kt": "Coil",
    "org.jetbrains.kotlinx": "Kotlinx Coroutines",
  };
  
  // Parse implementation/api/compileOnly lines
  // implementation "group:artifact:version"
  // implementation("group:artifact:version")
}
```

**Criterios de éxito:**
- [ ] Detecta 5+ librerías en proyecto Android real
- [ ] Extrae versiones cuando están disponibles
- [ ] Soporte para Kotlin DSL (`build.gradle.kts`)

---

#### 1.3 Detectar Librerías Cargo (Rust)
**Status:** `pending`  
**Prioridad:** ALTA  
**Asignado:** —

**Archivo:** `src/analyzers/techStack.ts`

**Implementación:**
```typescript
function detectCargoLibraries(files: FileInfo[], rootDir: string): string[] {
  // Leer Cargo.toml
  // Parsear [dependencies] y [dev-dependencies]
  
  const libMap: Record<string, string> = {
    "tokio": "Tokio (async runtime)",
    "actix-web": "Actix-web",
    "rocket": "Rocket",
    "serde": "Serde",
    "diesel": "Diesel ORM",
    "sqlx": "SQLx",
  };
}
```

**Criterios de éxito:**
- [ ] Detecta tokio, serde, actix-web en proyecto Rust
- [ ] Soporte para versiones (semver)
- [ ] Detecta features habilitadas

---

#### 1.4 Detectar Librerías Go
**Status:** `pending`  
**Prioridad:** ALTA  
**Asignado:** —

**Archivo:** `src/analyzers/techStack.ts`

**Implementación:**
```typescript
function detectGoLibraries(files: FileInfo[], rootDir: string): string[] {
  // Leer go.mod
  // Parsear require statements
  
  const libMap: Record<string, string> = {
    "github.com/gin-gonic/gin": "Gin",
    "github.com/labstack/echo": "Echo",
    "github.com/gorilla/mux": "Gorilla Mux",
    "gorm.io/gorm": "GORM",
    "github.com/lib/pq": "pq (PostgreSQL)",
  };
}
```

---

#### 1.5 Detectar Librerías Maven (Java)
**Status:** `pending`  
**Prioridad:** ALTA  
**Asignado:** —

**Archivo:** `src/analyzers/techStack.ts`

**Implementación:**
```typescript
function detectMavenLibraries(files: FileInfo[], rootDir: string): string[] {
  // Leer pom.xml
  // Parsear <dependencies> section
  
  const libMap: Record<string, string> = {
    "spring-boot": "Spring Boot",
    "spring-web": "Spring Web",
    "hibernate": "Hibernate",
    "junit": "JUnit",
    "mockito": "Mockito",
  };
}
```

---

#### 1.6 Detectar Librerías Swift
**Status:** `pending`  
**Prioridad:** MEDIA  
**Asignado:** —

**Archivo:** `src/analyzers/techStack.ts`

**Implementación:**
```typescript
function detectSwiftLibraries(files: FileInfo[], rootDir: string): string[] {
  // Leer Package.swift
  // Parsear dependencies
  
  const libMap: Record<string, string> = {
    "vapor": "Vapor",
    "alamofire": "Alamofire",
    "swift-nio": "SwiftNIO",
  };
}
```

---

### Métricas Fase 1

| Métrica | Estado | Objetivo |
|---------|--------|----------|
| Librerías detectadas JS/TS | ✅ 20+ | Mantener |
| Librerías detectadas Python | ✅ 15+ | Mantener |
| Librerías detectadas Android | ❌ 0 | 10+ |
| Librerías detectadas Rust | ❌ 0 | 8+ |
| Librerías detectadas Go | ❌ 0 | 6+ |
| Librerías detectadas Java | ❌ 0 | 8+ |
| Flows con depth > 0 | ❌ <20% | >80% |
| Tests pasando | ✅ 93/93 | Mantener |

---

## FASE 2: Enriquecimiento — Rich Context
**Status:** `pending`  
**Fecha inicio:** —  
**Fecha objetivo:** —  
**Progreso:** 0%

### Objetivo
Flows sustanciales con relaciones reales y API documentada.

### Tareas

#### 2.1 Enriquecer Estructura de Flows
**Status:** `pending`  
**Prioridad:** ALTA  
**Asignado:** —

**Archivos:**
- `src/core/semanticContexts.ts`
- `src/core/flows/` (nuevo directorio)

**Nueva estructura de flow:**
```json
{
  "name": "PluginManager",
  "type": "Singleton",
  "language": "kotlin",
  "responsibility": "Gestión de ciclo de vida de plugins",
  "entrypoint": "app/src/main/java/.../PluginManager.kt",
  "files": ["..."],
  "dependencies": {
    "imports": ["android.content.pm.PackageManager"],
    "classes_used": ["Plugin", "PluginFragment"],
    "dependents": ["PluginBrowseFragment"]
  },
  "public_api": [
    {
      "method": "loadPlugin",
      "signature": "fun loadPlugin(apkPath: String): Result<Plugin>",
      "description": "Carga plugin desde APK"
    }
  ],
  "relations": {
    "uses": ["Plugin"],
    "used_by": ["PluginBrowseFragment"]
  },
  "data_flow": {
    "inputs": ["apkPath: String"],
    "outputs": ["Result<Plugin>"],
    "side_effects": ["File system read", "APK validation"]
  }
}
```

**Criterios por lenguaje:**
- [ ] JS/TS: Detecta exports, interfaces, tipos
- [ ] Python: Detecta clases, funciones, docstrings
- [ ] Kotlin: Detecta funciones suspend, data classes
- [ ] Go: Detecta interfaces, structs
- [ ] Rust: Detecta traits, impls
- [ ] Ruby: Detecta métodos, módulos
- [ ] PHP: Detecta clases, interfaces
- [ ] C#: Detecta métodos async, propiedades
- [ ] Swift: Detecta protocols, extensions
- [ ] Elixir: Detecta módulos, funciones
- [ ] Apex: Detecta clases, triggers

---

#### 2.2 Detectar Entrypoints por Lenguaje
**Status:** `pending`  
**Prioridad:** ALTA  
**Asignado:** —

**Archivo:** `src/analyzers/entrypoints.ts` (nuevo)

**Entrypoints a detectar por lenguaje:**

| Lenguaje | Entrypoints |
|----------|-------------|
| JS/TS | `index.js`, `main.ts`, `server.ts`, Express app |
| Python | `if __name__ == "__main__"`, Flask app, FastAPI app |
| Kotlin | `@HiltAndroidApp`, `Application` class, `main()` |
| Go | `func main()`, HTTP handlers |
| Rust | `fn main()`, `#[tokio::main]` |
| Ruby | `config.ru`, Rails controllers |
| PHP | `index.php`, `artisan`, Laravel routes |
| C# | `Program.cs`, `[ApiController]` |
| Swift | `@main`, `App` struct |
| Elixir | `defmodule` con `use Application` |
| Apex | Triggers, `@RestResource` |

**Salida:** `entrypoints.md` estructurado

---

#### 2.3 Generar DATA_FLOW.md
**Status:** `pending`  
**Prioridad:** MEDIA  
**Asignado:** —

**Archivo:** `src/analyzers/dataFlow.ts` (nuevo)

**Contenido:**
```markdown
# Flujo de Datos

## Flujo 1: [Nombre]
```
Step A
    ↓
Step B
    ↓
Step C
```

## Modelos
| Modelo | Campos | Usado en |
|--------|--------|----------|
```

---

### Métricas Fase 2

| Métrica | Estado | Objetivo |
|---------|--------|----------|
| Flows con API documentada | ❌ 0% | >70% |
| Entrypoints detectados | ❌ 0 | 3+ por proyecto |
| DATA_FLOW.md generado | ❌ No | Sí |
| Relaciones entre componentes | ❌ No | Sí |

---

## FASE 3: Reestructuración — Context Architecture
**Status:** `pending`  
**Fecha inicio:** —  
**Fecha objetivo:** —  
**Progreso:** 0%

### Objetivo
Organizar por dominios, no por tipo de archivo.

### Nueva Estructura

```
ai-context/
├── README.md                    # Índice maestro
├── PROJECT_OVERVIEW.md          # 1-min read
│
├── architecture/                # Decisiones arquitectónicas
│   ├── OVERVIEW.md
│   ├── COMPONENTS.md
│   ├── DATA_FLOW.md
│   └── DECISIONS.md
│
├── tech-stack/                  # Stack tecnológico completo
│   ├── CORE.md                  # Lenguajes, build tools
│   ├── FRAMEWORKS.md            # Frameworks detectados
│   ├── LIBRARIES.md             # Librerías con versiones
│   └── TOOLS.md                 # Dev tools, CI/CD
│
├── modules/                     # Por dominio funcional
│   ├── [modulo-1]/
│   │   ├── README.md
│   │   ├── API.md
│   │   └── DEPENDENCIES.md
│   └── [modulo-2]/
│       └── ...
│
├── api/                         # Interfaces públicas
│   ├── PUBLIC_INTERFACES.md
│   └── USAGE_EXAMPLES.md
│
└── context/                     # Datos estructurados
    ├── features/
    └── flows/
```

**Status por lenguaje:**
- [ ] JS/TS: Estructura Node.js/React
- [ ] Python: Estructura Django/Flask
- [ ] Kotlin: Estructura Android
- [ ] Go: Estructura Go modules
- [ ] Rust: Estructura Cargo workspace
- [ ] Ruby: Estructura Rails
- [ ] PHP: Estructura Laravel
- [ ] C#: Estructura .NET
- [ ] Swift: Estructura iOS/SPM
- [ ] Elixir: Estructura Phoenix
- [ ] Apex: Estructura Salesforce

---

## FASE 4: Calidad y Testing
**Status:** `pending`  
**Progreso:** 0%

### Tareas

#### 4.1 Checklist de Calidad Automatizado
**Status:** `pending`  
**Archivo:** `scripts/validate-context.js`

**Validaciones:**
- [ ] Cada archivo tiene descripción
- [ ] Cada módulo tiene README
- [ ] Flows tienen depth > 0
- [ ] Tech stack no dice "None detected"
- [ ] Entrypoints detectados

**Comando:** `af validate-context`

---

#### 4.2 Tests de Integración
**Status:** `pending`

Ver **PLAN_DE_TESTS.md** para detalles.

---

## Notas y Decisiones

### 2026-03-20
- Plan creado
- Se identificó que el bug de layer detection afecta TODOS los lenguajes
- Se decidió empezar con fixes críticos (Fase 1)

---

## Checklist de Aprobación

- [ ] Plan revisado por equipo
- [ ] Prioridades confirmadas
- [ ] Recursos asignados
- [ ] Fechas de milestone acordadas
- [ ] Tests aprobados

---

## Próximos Pasos

1. [ ] Aprobar este plan
2. [ ] Crear milestones en GitHub
3. [ ] Asignar desarrolladores
4. [ ] Empezar Fase 1.1 (Fix Layer Detection)
5. [ ] Actualizar este documento semanalmente

---

*Documento vivo — actualizar con cada avance*
