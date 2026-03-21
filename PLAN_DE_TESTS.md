# Plan de Tests — ai-first v2.0

## Fecha de Creación
2026-03-20

## Objetivo
Asegurar que todas las mejoras del CLI funcionen correctamente en los 11 lenguajes/frameworks soportados.

---

## Estrategia de Testing

### Pirámide de Tests

```
        /\
       /  \    E2E Tests (5%)
      /____\   - Proyectos reales
     /      \  
    /--------\ Integration Tests (25%)
   /          \ - Feature detection
  /------------\ Unit Tests (70%)
 /              \ - Funciones individuales
/________________\
```

---

## Estado General de Tests

**Última actualización:** 2026-03-20  
**Tests actuales:** 93 pasando ✅  
**Cobertura:** ~60% (estimado)  
**Objetivo:** 95%+ cobertura

---

## Tests Unitarios

### Módulo: techStack.ts
**Status:** `in_progress`  
**Archivo:** `tests/techStack.test.ts` (nuevo)

| Test | Status | Prioridad | Lenguaje |
|------|--------|-----------|----------|
| Detecta librerías npm | ✅ | Media | JS/TS |
| Detecta librerías Python | ✅ | Media | Python |
| Detecta librerías Gradle | ❌ | **CRÍTICA** | Kotlin/Java |
| Detecta librerías Cargo | ❌ | ALTA | Rust |
| Detecta librerías Go | ❌ | ALTA | Go |
| Detecta librerías Maven | ❌ | ALTA | Java |
| Detecta librerías Swift | ❌ | MEDIA | Swift |
| Detecta Android SDK versions | ✅ | Media | Kotlin |

**Tests a implementar:**

```typescript
describe("techStack - Gradle Libraries", () => {
  it("should detect Media3 from build.gradle", () => {
    const files = [
      { name: "build.gradle", relativePath: "app/build.gradle", extension: "gradle" }
    ];
    const buildGradleContent = `
      dependencies {
        implementation "androidx.media3:media3-exoplayer:1.2.0"
        implementation "androidx.leanback:leanback:1.0.0"
      }
    `;
    // Mock readFile
    
    const stack = detectTechStack(files, "/tmp/android");
    expect(stack.libraries).toContain("Media3 (ExoPlayer)");
    expect(stack.libraries).toContain("Android Leanback");
  });
  
  it("should detect Dagger Hilt from build.gradle.kts", () => {
    const files = [
      { name: "build.gradle.kts", relativePath: "app/build.gradle.kts", extension: "kts" }
    ];
    const content = `
      dependencies {
        implementation("com.google.dagger:hilt-android:2.48")
      }
    `;
    
    const stack = detectTechStack(files, "/tmp/android");
    expect(stack.libraries).toContain("Dagger Hilt");
  });
});

describe("techStack - Cargo Libraries", () => {
  it("should detect Tokio and Serde from Cargo.toml", () => {
    const files = [
      { name: "Cargo.toml", relativePath: "Cargo.toml", extension: "toml" }
    ];
    const content = `
      [dependencies]
      tokio = { version = "1.0", features = ["full"] }
      serde = { version = "1.0", features = ["derive"] }
    `;
    
    const stack = detectTechStack(files, "/tmp/rust");
    expect(stack.libraries).toContain("Tokio");
    expect(stack.libraries).toContain("Serde");
  });
});

describe("techStack - Go Libraries", () => {
  it("should detect Gin from go.mod", () => {
    const files = [
      { name: "go.mod", relativePath: "go.mod", extension: "mod" }
    ];
    const content = `
      require github.com/gin-gonic/gin v1.9.0
    `;
    
    const stack = detectTechStack(files, "/tmp/go");
    expect(stack.libraries).toContain("Gin");
  });
});
```

---

### Módulo: semanticContexts.ts
**Status:** `in_progress`  
**Archivo:** `tests/semanticContexts.test.ts`

| Test | Status | Prioridad | Notas |
|------|--------|-----------|-------|
| Detecta features válidas | ✅ | Alta | Ya existe |
| Ignora folders técnicos | ✅ | Alta | Ya existe |
| Requiere ≥2 archivos fuente | ✅ | Alta | Ya existe |
| Requiere entrypoints | ✅ | Alta | Ya existe |
| Layer detection — controller | ❌ | **CRÍTICA** | Fix bug substring |
| Layer detection — service | ❌ | **CRÍTICA** | Fix bug substring |
| Layer detection — repository | ❌ | **CRÍTICA** | Fix bug substring |
| Flows tienen depth > 0 | ❌ | **CRÍTICA** | Depende de layer fix |
| Flows tienen layers no vacíos | ❌ | **CRÍTICA** | Depende de layer fix |

**Tests a implementar:**

```typescript
describe("Layer Detection - Substring Match (All Languages)", () => {
  const testCases = [
    // JavaScript/TypeScript
    { file: "src/auth/authController.ts", expected: "api" },
    { file: "src/userController.ts", expected: "api" },
    { file: "src/services/userService.ts", expected: "service" },
    { file: "src/UserRepository.ts", expected: "data" },
    
    // Python
    { file: "app/views.py", expected: "api" },
    { file: "blog/views.py", expected: "api" },
    { file: "app/services/user_service.py", expected: "service" },
    
    // Kotlin
    { file: "app/src/UserRepository.kt", expected: "data" },
    { file: "app/src/PluginManager.kt", expected: "service" },
    { file: "app/src/MainActivity.kt", expected: "api" },
    
    // Go
    { file: "handlers/auth_handler.go", expected: "api" },
    { file: "services/user_service.go", expected: "service" },
    
    // Rust
    { file: "src/handlers/auth.rs", expected: "api" },
    { file: "src/repositories/user_repo.rs", expected: "data" },
    
    // Ruby
    { file: "app/controllers/users_controller.rb", expected: "api" },
    { file: "app/services/auth_service.rb", expected: "service" },
    
    // PHP
    { file: "app/Http/Controllers/UserController.php", expected: "api" },
    { file: "app/Services/PaymentService.php", expected: "service" },
    
    // C#
    { file: "Controllers/UserController.cs", expected: "api" },
    { file: "Services/OrderService.cs", expected: "service" },
    
    // Swift
    { file: "Services/UserService.swift", expected: "service" },
    { file: "Controllers/AuthController.swift", expected: "api" },
    
    // Elixir
    { file: "lib/my_app_web/controllers/user_controller.ex", expected: "api" },
    { file: "lib/my_app/services/auth_service.ex", expected: "service" },
    
    // Apex
    { file: "classes/UserController.cls", expected: "api" },
    { file: "classes/AccountService.cls", expected: "service" },
  ];
  
  testCases.forEach(({ file, expected }) => {
    it(`should detect '${expected}' layer for ${file}`, () => {
      const layer = getLayer(file);
      expect(layer).toBe(expected);
    });
  });
});

describe("Flow Generation - Rich Flows", () => {
  it("should generate flows with depth > 0", () => {
    const modules = {
      "auth": {
        path: "src/auth",
        files: [
          "src/auth/authController.ts",
          "src/auth/authService.ts",
          "src/auth/authRepository.ts"
        ]
      }
    };
    
    const flows = generateFlows(
      "symbol-graph.json",
      "modules.json",
      "dependencies.json"
    );
    
    const authFlow = flows.find(f => f.name === "auth");
    expect(authFlow).toBeDefined();
    expect(authFlow.depth).toBeGreaterThan(0);
    expect(authFlow.layers).not.toHaveLength(0);
    expect(authFlow.layers).toContain("api");
    expect(authFlow.layers).toContain("service");
  });
  
  it("should include dependencies in flow output", () => {
    const flows = generateFlows(/* ... */);
    const flow = flows[0];
    
    expect(flow.dependencies).toBeDefined();
    expect(flow.dependencies.imports).toBeDefined();
    expect(flow.dependencies.classes_used).toBeDefined();
  });
  
  it("should include public API in flow output", () => {
    const flows = generateFlows(/* ... */);
    const flow = flows[0];
    
    expect(flow.public_api).toBeDefined();
    expect(flow.public_api[0].method).toBeDefined();
    expect(flow.public_api[0].signature).toBeDefined();
  });
});
```

---

### Módulo: entrypoints.ts (nuevo)
**Status:** `pending`  
**Archivo:** `tests/entrypoints.test.ts` (nuevo)

| Test | Status | Prioridad | Lenguaje |
|------|--------|-----------|----------|
| Detecta index.js | ❌ | Alta | JS/TS |
| Detecta Express app | ❌ | Alta | JS/TS |
| Detecta main.py | ❌ | Alta | Python |
| Detecta Flask app | ❌ | Alta | Python |
| Detecta @HiltAndroidApp | ❌ | **CRÍTICA** | Kotlin |
| Detecta fun main() | ❌ | Alta | Kotlin |
| Detecta func main() | ❌ | Alta | Go |
| Detecta fn main() | ❌ | Alta | Rust |
| Detecta Application class | ❌ | Alta | Ruby |
| Detecta @main | ❌ | MEDIA | Swift |

---

## Tests de Integración

### Suite: Feature Detection
**Status:** `pending`  
**Archivo:** `tests/integration/features.test.ts` (nuevo)

**Proyectos de prueba:**
- [ ] `test-projects/express-api/` (Node.js)
- [ ] `test-projects/django-app/` (Python)
- [ ] `test-projects/nestjs-backend/` (TypeScript)
- [ ] `test-projects/android-app/` (Kotlin) ← NUEVO
- [ ] `test-projects/rust-api/` (Rust) ← NUEVO
- [ ] `test-projects/go-service/` (Go) ← NUEVO

**Tests:**

```typescript
describe("Feature Detection Integration", () => {
  it("should detect auth feature in Express API", async () => {
    const projectPath = path.join(__dirname, "../test-projects/express-api");
    await afInit(projectPath);
    
    const features = await readFeatures(projectPath);
    expect(features).toContainEqual(expect.objectContaining({
      name: "auth",
      entrypoints: expect.arrayContaining([expect.stringContaining("Controller")])
    }));
  });
  
  it("should detect blog feature in Django app", async () => {
    const projectPath = path.join(__dirname, "../test-projects/django-app");
    await afInit(projectPath);
    
    const features = await readFeatures(projectPath);
    expect(features).toContainEqual(expect.objectContaining({
      name: "blog",
      path: expect.stringContaining("blog")
    }));
  });
  
  it("should detect features in Android app", async () => {
    const projectPath = path.join(__dirname, "../test-projects/android-app");
    await afInit(projectPath);
    
    const features = await readFeatures(projectPath);
    expect(features.length).toBeGreaterThan(0);
    expect(features[0].entrypoints.length).toBeGreaterThan(0);
  });
});
```

---

### Suite: Tech Stack Detection
**Status:** `pending`  
**Archivo:** `tests/integration/techStack.test.ts` (nuevo)

**Tests:**

```typescript
describe("Tech Stack Detection Integration", () => {
  it("should detect Media3 in Android project", async () => {
    const projectPath = path.join(__dirname, "../test-projects/android-app");
    await afInit(projectPath);
    
    const techStack = await readTechStack(projectPath);
    expect(techStack.libraries).toContain("Media3 (ExoPlayer)");
    expect(techStack.libraries).toContain("Android Leanback");
    expect(techStack.libraries).toContain("Dagger Hilt");
  });
  
  it("should detect Tokio in Rust project", async () => {
    const projectPath = path.join(__dirname, "../test-projects/rust-api");
    await afInit(projectPath);
    
    const techStack = await readTechStack(projectPath);
    expect(techStack.libraries).toContain("Tokio");
  });
  
  it("should detect Gin in Go project", async () => {
    const projectPath = path.join(__dirname, "../test-projects/go-service");
    await afInit(projectPath);
    
    const techStack = await readTechStack(projectPath);
    expect(techStack.libraries).toContain("Gin");
  });
});
```

---

## Tests E2E (End-to-End)

### Suite: Proyectos Reales
**Status:** `pending`  
**Directorio:** `tests/e2e/` (nuevo)

| Proyecto | Lenguaje | Status | Notas |
|----------|----------|--------|-------|
| ai-first-bridge | TypeScript | ❌ | Propio repositorio |
| council-planner | Python | ❌ | CLI tool |
| Koditv Player | Kotlin | ❌ | Android app |
| Rails Tutorial | Ruby | ❌ | Web app |
| RealWorld Django | Python | ❌ | API backend |

**Tests:**

```typescript
describe("E2E - Real Projects", () => {
  it("should analyze Koditv Android app", async () => {
    const projectPath = "/path/to/koditv";
    const result = await afInit(projectPath);
    
    expect(result.success).toBe(true);
    expect(result.features.length).toBeGreaterThan(0);
    expect(result.flows.length).toBeGreaterThan(0);
    
    const techStack = await readTechStack(projectPath);
    expect(techStack.libraries).not.toContain("None detected");
    expect(techStack.libraries.length).toBeGreaterThan(3);
    
    const features = await readFeatures(projectPath);
    const pluginFeature = features.find(f => f.name.includes("plugin"));
    expect(pluginFeature).toBeDefined();
    expect(pluginFeature.entrypoints.length).toBeGreaterThan(0);
  });
});
```

---

## Proyectos de Prueba Requeridos

### Crear nuevos proyectos de prueba:

- [ ] `test-projects/android-app/` - App Android con Media3, Hilt, Room
- [ ] `test-projects/rust-api/` - API con Tokio, Serde, Actix
- [ ] `test-projects/go-service/` - Microservicio con Gin, GORM
- [ ] `test-projects/swift-ios/` - App iOS con Alamofire

**Cada proyecto debe tener:**
- Estructura mínima pero realista
- ≥3 features detectables
- ≥2 entrypoints
- ≥3 librerías externas

---

## Métricas de Calidad

### Objetivos

| Métrica | Actual | Objetivo Fase 1 | Objetivo Fase 2 | Objetivo Final |
|---------|--------|-----------------|-----------------|----------------|
| Tests pasando | 93 | 120 | 150 | 200+ |
| Cobertura código | ~60% | 70% | 85% | 95% |
| Cobertura lenguajes | 11/11 | 11/11 | 11/11 | 11/11 |
| Proyectos de prueba | 6 | 9 | 10 | 12+ |
| Tests E2E | 0 | 3 | 5 | 8+ |

### Reportes

**Semanal:**
- Tests nuevos agregados
- Tests fallando
- Cobertura por módulo

**Por release:**
- Matrix de compatibilidad (lenguaje × feature)
- Benchmark de performance
- Reporte de regressions

---

## Checklist de Implementación

### Fase 1: Fixes Críticos
- [ ] Crear `tests/techStack.test.ts`
- [ ] Implementar tests Gradle
- [ ] Implementar tests Cargo
- [ ] Implementar tests Go
- [ ] Implementar tests Maven
- [ ] Agregar tests layer detection substring
- [ ] Verificar tests pasan en CI

### Fase 2: Enriquecimiento
- [ ] Crear `tests/entrypoints.test.ts`
- [ ] Implementar tests entrypoints por lenguaje
- [ ] Agregar tests flows con metadata
- [ ] Verificar tests E2E con proyectos reales

### Fase 3: Reestructuración
- [ ] Actualizar tests para nueva estructura de carpetas
- [ ] Agregar tests validación de estructura
- [ ] Tests de templates por lenguaje

---

## Infraestructura de Testing

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run test:integration
      - run: npm run test:e2e
```

### Herramientas

- **Framework:** Vitest (actual)
- **Cobertura:** c8 o v8
- **E2E:** Propio (node scripts)
- **Mocking:** vi.mock
- **Snapshots:** Vitest snapshots

---

## Notas

### 2026-03-20
- Plan creado con 93 tests existentes
- Se identifican tests críticos faltantes (Gradle, Cargo, layer detection)
- Se requieren 3+ proyectos de prueba nuevos

---

## Próximos Pasos

1. [ ] Aprobar plan de tests
2. [ ] Crear proyecto de prueba Android
3. [ ] Implementar tests Gradle
4. [ ] Crear proyecto de prueba Rust
5. [ ] Implementar tests Cargo
6. [ ] Agregar tests substring layer detection
7. [ ] Actualizar cobertura en CI

---

*Documento vivo — actualizar con cada test agregado*
