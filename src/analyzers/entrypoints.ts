import { FileInfo } from "../core/repoScanner.js";
import { readJsonFile, readFile } from "../utils/fileUtils.js";
import path from "path";
import fs from "fs";

export interface Entrypoint {
  name: string;
  path: string;
  type: "cli" | "api" | "worker" | "server" | "client" | "library" | "config" | "test" | "build" | "lint" | "formatter" | "other";
  description: string;
  command?: string;
}

export function discoverEntrypoints(files: FileInfo[], rootDir: string): Entrypoint[] {
  const entrypoints: Entrypoint[] = [];
  
  try {
    const pkgPath = path.join(rootDir, "package.json");
    const pkg = readJsonFile(pkgPath) as { 
      main?: string; 
      bin?: string | Record<string, string>; 
      module?: string; 
      types?: string; 
      typings?: string; 
      scripts?: Record<string, string> 
    };
    
    if (pkg.main) {
      entrypoints.push({ name: "Main", path: pkg.main, type: "library", description: "Main entry point" });
    }
    
    if (pkg.bin) {
      const bins = typeof pkg.bin === 'string' ? { main: pkg.bin } : pkg.bin;
      for (const [name, binPath] of Object.entries(bins)) {
        entrypoints.push({
          name: name === 'main' ? 'CLI' : name,
          path: String(binPath),
          type: "cli",
          description: `CLI: ${name}`,
          command: name === 'main' ? 'npx pkg' : `npx ${name}`,
        });
      }
    }
    
    if (pkg.types || pkg.typings) {
      entrypoints.push({ name: "Types", path: String(pkg.types || pkg.typings), type: "library", description: "TypeScript definitions" });
    }
    
    if (pkg.scripts) {
      for (const [scriptName, scriptCmd] of Object.entries(pkg.scripts)) {
        const type = getScriptType(scriptName);
        if (type) {
          entrypoints.push({ name: scriptName, path: `package.json#scripts.${scriptName}`, type, description: `${scriptName}: ${scriptCmd}`, command: `npm run ${scriptName}` });
        }
      }
    }
  } catch {}
  
  // From file names
  const patterns: Record<string, { type: Entrypoint["type"]; desc: string }> = {
    "index.ts": { type: "library", desc: "Entry point" }, "main.ts": { type: "server", desc: "Main" },
    "server.ts": { type: "server", desc: "Server" }, "api.ts": { type: "api", desc: "API" },
    "cli.ts": { type: "cli", desc: "CLI" }, "worker.ts": { type: "worker", desc: "Worker" },
  };
  
  for (const file of files) {
    const p = patterns[file.name];
    if (p && !entrypoints.some(e => e.path === file.relativePath)) {
      entrypoints.push({ name: file.name, path: file.relativePath, type: p.type, description: p.desc });
    }
  }
  
  // Detect Android entrypoints from AndroidManifest.xml
  const androidManifests = files.filter(f => f.name === "AndroidManifest.xml");
  for (const manifest of androidManifests) {
    try {
      const manifestContent = readFile(path.join(rootDir, manifest.relativePath));
      const androidEntrypoints = parseAndroidManifest(manifestContent, manifest.relativePath);
      entrypoints.push(...androidEntrypoints);
    } catch {}
  }
  
  const sfdxFiles = files.filter(f => f.name === "sfdx-project.json");
  if (sfdxFiles.length > 0) {
    try {
      const salesforceEntrypoints = discoverSalesforceEntrypoints(files, rootDir);
      entrypoints.push(...salesforceEntrypoints);
    } catch {}
  }
  
  // Detect iOS/SwiftUI entrypoints from Swift files
  const swiftFiles = files.filter(f => f.extension === "swift");
  if (swiftFiles.length > 0) {
    try {
      const swiftEntrypoints = discoverSwiftUIEntrypoints(swiftFiles, rootDir);
      entrypoints.push(...swiftEntrypoints);
    } catch {}
  }
  
  // Detect Go entrypoints
  const goFiles = files.filter(f => f.extension === "go");
  if (goFiles.length > 0) {
    try {
      const goEntrypoints = discoverGoEntrypoints(goFiles, rootDir);
      entrypoints.push(...goEntrypoints);
    } catch {}
  }
  
  // Detect Rust entrypoints
  const rustFiles = files.filter(f => f.extension === "rs");
  if (rustFiles.length > 0) {
    try {
      const rustEntrypoints = discoverRustEntrypoints(rustFiles, rootDir);
      entrypoints.push(...rustEntrypoints);
    } catch {}
  }
  
  // Detect PHP entrypoints
  const phpFiles = files.filter(f => f.extension === "php");
  if (phpFiles.length > 0) {
    try {
      const phpEntrypoints = discoverPHPEntrypoints(phpFiles, rootDir);
      entrypoints.push(...phpEntrypoints);
    } catch {}
  }

  const pyFiles = files.filter(f => f.extension === "py");
  if (pyFiles.length > 0) {
    try {
      const pythonEntrypoints = discoverPythonEntrypoints(pyFiles, rootDir);
      entrypoints.push(...pythonEntrypoints);
    } catch {}
  }

  const javaFiles = files.filter(f => f.extension === "java" || f.extension === "kt");
  const pomPath = path.join(rootDir, "pom.xml");
  const gradlePath = path.join(rootDir, "build.gradle");
  const gradleKtsPath = path.join(rootDir, "build.gradle.kts");
  const hasPomOrGradle = fs.existsSync(pomPath) || fs.existsSync(gradlePath) || fs.existsSync(gradleKtsPath);

  if (javaFiles.length > 0 && hasPomOrGradle) {
    try {
      const springEntrypoints = discoverSpringBootEntrypoints(javaFiles, rootDir);
      entrypoints.push(...springEntrypoints);
    } catch {}
  }

  return entrypoints;
}

/**
 * Parse AndroidManifest.xml to extract entrypoints
 */
function parseAndroidManifest(content: string, manifestPath: string): Entrypoint[] {
  const entrypoints: Entrypoint[] = [];
  
  // Extract package name
  const packageMatch = content.match(/package="([^"]+)"/);
  const packageName = packageMatch ? packageMatch[1] : "unknown";
  
  // Extract activities
  const activityRegex = /<activity[^>]+android:name="([^"]+)"[^>]*>/g;
  let match;
  while ((match = activityRegex.exec(content)) !== null) {
    const activityName = match[1];
    const isMain = content.includes(`android:name="${activityName}"`) && 
                   content.includes("android.intent.action.MAIN") &&
                   content.includes("android.intent.category.LAUNCHER");
    
    entrypoints.push({
      name: activityName.split('.').pop() || activityName,
      path: `${manifestPath}#${activityName}`,
      type: isMain ? "client" : "other",
      description: isMain ? `Main Activity (${packageName})` : `Activity: ${activityName}`,
      command: isMain ? `adb shell am start -n ${packageName}/${activityName}` : undefined,
    });
  }
  
  // Extract services
  const serviceRegex = /<service[^>]+android:name="([^"]+)"[^>]*>/g;
  while ((match = serviceRegex.exec(content)) !== null) {
    entrypoints.push({
      name: match[1].split('.').pop() || match[1],
      path: `${manifestPath}#service.${match[1]}`,
      type: "other",
      description: `Service: ${match[1]}`,
    });
  }
  
  // Extract receivers
  const receiverRegex = /<receiver[^>]+android:name="([^"]+)"[^>]*>/g;
  while ((match = receiverRegex.exec(content)) !== null) {
    entrypoints.push({
      name: match[1].split('.').pop() || match[1],
      path: `${manifestPath}#receiver.${match[1]}`,
      type: "other",
      description: `BroadcastReceiver: ${match[1]}`,
    });
  }
  
  // Extract permissions
  const permissionRegex = /<uses-permission[^>]+android:name="([^"]+)"[^>]*>/g;
  const permissions: string[] = [];
  while ((match = permissionRegex.exec(content)) !== null) {
    permissions.push(match[1]);
  }
  
  if (permissions.length > 0) {
    entrypoints.push({
      name: "Permissions",
      path: `${manifestPath}#permissions`,
      type: "config",
      description: `${permissions.length} permissions declared`,
    });
  }
  
  return entrypoints;
}

function discoverSalesforceEntrypoints(files: FileInfo[], rootDir: string): Entrypoint[] {
  const entrypoints: Entrypoint[] = [];
  
  const apexFiles = files.filter(f => f.extension === "cls" || f.extension === "trigger");
  
  for (const apexFile of apexFiles) {
    try {
      const content = readFile(path.join(rootDir, apexFile.relativePath));
      
      if (apexFile.extension === "trigger") {
        const triggerMatch = content.match(/^trigger\s+(\w+)\s+on\s+(\w+)/i);
        if (triggerMatch) {
          entrypoints.push({
            name: triggerMatch[1],
            path: apexFile.relativePath,
            type: "api",
            description: `Trigger on ${triggerMatch[2]} SObject`,
          });
        }
      } else {
        const classMatch = content.match(/^(?:\s*(?:public|private|global)(?:\s+(?:with|without|inherited)\s+sharing)?\s+)?class\s+(\w+)/i);
        if (classMatch) {
          const className = classMatch[1];
          const methods = extractApexMethods(content);
          
          const auraEnabled = methods.filter(m => m.includes("@AuraEnabled"));
          const restResource = methods.some(m => m.includes("@RestResource"));
          const webservice = methods.some(m => m.includes("@webservice"));
          
          let description = "Apex Class";
          if (restResource) description += " (REST Resource)";
          else if (auraEnabled.length > 0) description += ` (${auraEnabled.length} @AuraEnabled methods)`;
          else if (webservice) description += " (WebService)";
          
          entrypoints.push({
            name: className,
            path: apexFile.relativePath,
            type: "api",
            description,
          });
        }
      }
    } catch {}
  }
  
  return entrypoints;
}

function extractApexMethods(content: string): string[] {
  const methods: string[] = [];
  const methodRegex = /@(?:AuraEnabled|RestResource|webservice|InvocableMethod)\s*(?:public|private|protected|global)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/g;
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[0]);
  }
  return methods;
}

function discoverSwiftUIEntrypoints(swiftFiles: FileInfo[], rootDir: string): Entrypoint[] {
  const entrypoints: Entrypoint[] = [];
  
  for (const swiftFile of swiftFiles) {
    try {
      const content = readFile(path.join(rootDir, swiftFile.relativePath));
      
      if (!content.includes("import SwiftUI")) {
        continue;
      }
      
      const structRegex = /struct\s+(\w+)\s*:\s*View/g;
      let match;
      while ((match = structRegex.exec(content)) !== null) {
        const viewName = match[1];
        const isContentView = viewName === "ContentView";
        
        entrypoints.push({
          name: viewName,
          path: swiftFile.relativePath,
          type: "client",
          description: isContentView ? "Main SwiftUI View" : `SwiftUI View: ${viewName}`,
        });
      }
      
      const appRegex = /@main\s*\n\s*struct\s+(\w+)/g;
      while ((match = appRegex.exec(content)) !== null) {
        entrypoints.push({
          name: match[1],
          path: swiftFile.relativePath,
          type: "client",
          description: `SwiftUI App Entry Point: ${match[1]}`,
        });
      }
    } catch {}
  }
  
  return entrypoints;
}

function getScriptType(name: string): Entrypoint["type"] | null {
  const l = name.toLowerCase();
  if (l.includes("start") || l.includes("dev") || l.includes("serve")) return "server";
  if (l.includes("build") || l.includes("compile")) return "build";
  if (l.includes("test")) return "test";
  if (l.includes("lint")) return "lint";
  if (l.includes("format")) return "formatter";
  return null;
}

function discoverGoEntrypoints(goFiles: FileInfo[], rootDir: string): Entrypoint[] {
  const entrypoints: Entrypoint[] = [];
  
  for (const file of goFiles) {
    try {
      const content = readFile(path.join(rootDir, file.relativePath));
      const fileName = file.name;
      
      if (fileName === "main.go") {
        const hasMain = content.match(/func\s+main\s*\(\s*\)/);
        const packageMatch = content.match(/package\s+(\w+)/);
        const packageName = packageMatch ? packageMatch[1] : "main";
        
        const handlers: string[] = [];
        const handlerMatches = content.matchAll(/http\.HandleFunc\s*\(\s*["']([^"']+)["']/g);
        for (const match of handlerMatches) {
          handlers.push(match[1]);
        }
        
        const portMatches = content.matchAll(/:\s*(\d{2,5})/g);
        const ports: string[] = [];
        for (const match of portMatches) {
          ports.push(match[1]);
        }
        
        let description = `Go main package (${packageName})`;
        if (handlers.length > 0) {
          description += ` with HTTP handlers: ${handlers.join(", ")}`;
        }
        if (ports.length > 0) {
          description += ` on port${ports.length > 1 ? "s" : ""} :${ports.join(", :")}`;
        }
        
        entrypoints.push({
          name: "main.go",
          path: file.relativePath,
          type: hasMain ? "server" : "library",
          description,
        });
      } else {
        const structMatches = content.matchAll(/type\s+(\w+)\s+struct/g);
        const structs: string[] = [];
        for (const match of structMatches) {
          structs.push(match[1]);
        }
        
        const methodMatches = content.matchAll(/func\s*\(?\s*\*?\s*(\w+)\s*\)?\s*(\w+)\s*\(/g);
        const methods: string[] = [];
        for (const match of methodMatches) {
          methods.push(match[2]);
        }
        
        if (structs.length > 0 || methods.length > 0) {
          let description = "Go module";
          if (structs.length > 0) {
            description += ` with structs: ${structs.slice(0, 3).join(", ")}`;
          }
          if (methods.length > 0) {
            description += `, methods: ${methods.slice(0, 3).join(", ")}`;
          }
          
          entrypoints.push({
            name: fileName,
            path: file.relativePath,
            type: "library",
            description,
          });
        }
      }
    } catch {}
  }
  
  const goModPath = path.join(rootDir, "go.mod");
  try {
    const goMod = readFile(goModPath);
    const moduleMatch = goMod.match(/module\s+(\S+)/);
    if (moduleMatch) {
      entrypoints.push({
        name: "go.mod",
        path: "go.mod",
        type: "config",
        description: `Go module: ${moduleMatch[1]}`,
      });
    }
  } catch {}
  
  return entrypoints;
}

function discoverRustEntrypoints(rustFiles: FileInfo[], rootDir: string): Entrypoint[] {
  const entrypoints: Entrypoint[] = [];
  
  for (const file of rustFiles) {
    try {
      const content = readFile(path.join(rootDir, file.relativePath));
      const fileName = file.name;
      
      if (fileName === "main.rs") {
        const hasMain = content.match(/fn\s+main\s*\(\s*\)/);
        
        const structMatches = content.matchAll(/struct\s+(\w+)/g);
        const structs: string[] = [];
        for (const match of structMatches) {
          structs.push(match[1]);
        }
        
        const implMatches = content.matchAll(/impl\s+(?:\w+\s+for\s+)?(\w+)/g);
        const implementations: string[] = [];
        for (const match of implMatches) {
          implementations.push(match[1]);
        }
        
        let description = "Rust main";
        if (structs.length > 0) {
          description += ` with structs: ${structs.slice(0, 3).join(", ")}`;
        }
        if (implementations.length > 0) {
          description += `, implementations: ${implementations.slice(0, 3).join(", ")}`;
        }
        
        entrypoints.push({
          name: "main.rs",
          path: file.relativePath,
          type: hasMain ? "cli" : "library",
          description,
        });
      } else if (fileName === "lib.rs") {
        const pubFnMatches = content.matchAll(/pub\s+fn\s+(\w+)/g);
        const publicFns: string[] = [];
        for (const match of pubFnMatches) {
          publicFns.push(match[1]);
        }
        
        let description = "Rust library";
        if (publicFns.length > 0) {
          description += ` with public functions: ${publicFns.slice(0, 3).join(", ")}`;
        }
        
        entrypoints.push({
          name: "lib.rs",
          path: file.relativePath,
          type: "library",
          description,
        });
      }
    } catch {}
  }
  
  const cargoPath = path.join(rootDir, "Cargo.toml");
  try {
    const cargoContent = readFile(cargoPath);
    const nameMatch = cargoContent.match(/name\s*=\s*"([^"]+)"/);
    const versionMatch = cargoContent.match(/version\s*=\s*"([^"]+)"/);
    
    let description = "Rust project";
    if (nameMatch) {
      description += `: ${nameMatch[1]}`;
    }
    if (versionMatch) {
      description += ` v${versionMatch[1]}`;
    }
    
    const binMatch = cargoContent.match(/\[\[bin\]\]/);
    if (binMatch) {
      description += " (has binaries)";
    }
    
    entrypoints.push({
      name: "Cargo.toml",
      path: "Cargo.toml",
      type: "config",
      description,
    });
  } catch {}
  
  return entrypoints;
}

function discoverPHPEntrypoints(phpFiles: FileInfo[], rootDir: string): Entrypoint[] {
  const entrypoints: Entrypoint[] = [];
  
  const hasIndexPhp = phpFiles.some(f => f.name === "index.php");
  const hasPublicIndex = phpFiles.some(f => f.relativePath.includes("public/index.php"));
  
  if (hasIndexPhp) {
    const indexFile = phpFiles.find(f => f.name === "index.php")!;
    try {
      const content = readFile(path.join(rootDir, indexFile.relativePath));
      
      const classMatches = content.matchAll(/class\s+(\w+)/g);
      const classes: string[] = [];
      for (const match of classMatches) {
        classes.push(match[1]);
      }
      
      const routes: string[] = [];
      
      // Match $router->get('/path') or $app->post('/path') patterns
      const httpMethodMatches = content.matchAll(/->\s*(?:get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g);
      for (const match of httpMethodMatches) {
        routes.push(match[1]);
      }
      
      // Match $router->add('METHOD', '/path') patterns (second argument is the path)
      const addMethodMatches = content.matchAll(/->\s*add\s*\(\s*["'][^"']+["']\s*,\s*["']([^"']+)["']/g);
      for (const match of addMethodMatches) {
        routes.push(match[1]);
      }
      
      let description = "PHP entry point";
      if (classes.length > 0) {
        description += ` with classes: ${classes.slice(0, 3).join(", ")}`;
      }
      if (routes.length > 0) {
        description += `, routes: ${routes.slice(0, 3).join(", ")}`;
      }
      
      entrypoints.push({
        name: "index.php",
        path: indexFile.relativePath,
        type: hasPublicIndex ? "server" : "api",
        description,
      });
    } catch {}
  }
  
  const composerPath = path.join(rootDir, "composer.json");
  try {
    const composer = readJsonFile(composerPath) as { name?: string; description?: string; require?: Record<string, string> };
    
    let description = "PHP project";
    if (composer.name) {
      description += `: ${composer.name}`;
    }
    if (composer.description) {
      description += ` - ${composer.description}`;
    }
    
    const hasLaravel = composer.require && (composer.require["laravel/framework"] || composer.require["illuminate/support"]);
    const hasSymfony = composer.require && (composer.require["symfony/framework-bundle"] || composer.require["symfony/symfony"]);
    
    if (hasLaravel) {
      description += " (Laravel)";
    } else if (hasSymfony) {
      description += " (Symfony)";
    }
    
    entrypoints.push({
      name: "composer.json",
      path: "composer.json",
      type: "config",
      description,
    });
  } catch {}
  
  return entrypoints;
}

function discoverPythonEntrypoints(pyFiles: FileInfo[], rootDir: string): Entrypoint[] {
  const entrypoints: Entrypoint[] = [];

  const managePy = pyFiles.find(f => f.name === "manage.py");
  if (managePy) {
    entrypoints.push({
      name: "manage.py",
      path: managePy.relativePath,
      type: "cli",
      description: "Django management commands",
      command: "python manage.py"
    });
  }

  const appPy = pyFiles.find(f => f.name === "app.py");
  if (appPy) {
    entrypoints.push({
      name: "app.py",
      path: appPy.relativePath,
      type: "server",
      description: "Flask/FastAPI application entrypoint"
    });
  }

  const mainPy = pyFiles.find(f => f.name === "main.py");
  if (mainPy && !managePy) {
    entrypoints.push({
      name: "main.py",
      path: mainPy.relativePath,
      type: "server",
      description: "Python application entrypoint"
    });
  }

  const initFiles = pyFiles.filter(f => f.name === "__init__.py");
  for (const initFile of initFiles) {
    try {
      const content = readFile(path.join(rootDir, initFile.relativePath));
      const exports = extractPythonExports(content);
      if (exports.length > 0) {
        const packageName = initFile.relativePath.replace(/\/__init__\.py$/, '').split('/').pop() || "package";
        entrypoints.push({
          name: `${packageName} package`,
          path: initFile.relativePath,
          type: "library",
          description: `Package exports: ${exports.slice(0, 3).join(", ")}${exports.length > 3 ? '...' : ''}`
        });
      }
    } catch {}
  }

  const pyprojectPath = path.join(rootDir, "pyproject.toml");
  try {
    const pyprojectContent = readFile(pyprojectPath);
    const scriptsMatch = pyprojectContent.match(/\[project\.scripts\]([^[]*)/);
    if (scriptsMatch) {
      const scriptsSection = scriptsMatch[1];
      const scriptMatches = scriptsSection.matchAll(/^(\w+)\s*=/gm);
      for (const match of scriptMatches) {
        entrypoints.push({
          name: match[1],
          path: "pyproject.toml",
          type: "cli",
          description: `CLI command: ${match[1]}`,
          command: match[1]
        });
      }
    }
  } catch {}

  const setupPyPath = path.join(rootDir, "setup.py");
  try {
    const setupContent = readFile(setupPyPath);
    const entryPointsMatch = setupContent.match(/entry_points\s*=\s*\{[^}]*['"]console_scripts['"]\s*:\s*\[([^\]]*)\]/s);
    if (entryPointsMatch) {
      const scriptsSection = entryPointsMatch[1];
      const scriptMatches = scriptsSection.matchAll(/['"](\w+)\s*=/g);
      for (const match of scriptMatches) {
        if (!entrypoints.some(e => e.name === match[1])) {
          entrypoints.push({
            name: match[1],
            path: "setup.py",
            type: "cli",
            description: `CLI command: ${match[1]}`,
            command: match[1]
          });
        }
      }
    }
  } catch {}

  return entrypoints;
}

function extractPythonExports(content: string): string[] {
  const exports: string[] = [];
  const patterns = [
    /from\s+\.[\w.]*\s+import\s+([^\n]+)/g,
    /__all__\s*=\s*\[([^\]]*)\]/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (pattern === patterns[1]) {
        const items = match[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(s => s);
        exports.push(...items);
      } else {
        const items = match[1].split(',').map(s => s.trim()).filter(s => s);
        exports.push(...items);
      }
    }
  }

  return [...new Set(exports)].filter(e => !e.startsWith('_'));
}

function discoverSpringBootEntrypoints(javaFiles: FileInfo[], rootDir: string): Entrypoint[] {
  const entrypoints: Entrypoint[] = [];

  for (const file of javaFiles) {
    try {
      const content = readFile(path.join(rootDir, file.relativePath));

      const springBootAppMatch = content.match(/@SpringBootApplication/);
      if (springBootAppMatch) {
        const classMatch = content.match(/public\s+class\s+(\w+)/);
        if (classMatch) {
          entrypoints.push({
            name: classMatch[1],
            path: file.relativePath,
            type: "server",
            description: `Spring Boot Application: ${classMatch[1]}`
          });
        }
      }

      const restControllerMatch = content.match(/@RestController|@Controller/);
      if (restControllerMatch) {
        const classMatch = content.match(/public\s+class\s+(\w+)/);
        const requestMappingMatches = content.matchAll(/@(?:Get|Post|Put|Delete|Patch|Request)Mapping\s*\(\s*["']([^"']+)["']/g);
        const endpoints: string[] = [];
        for (const match of requestMappingMatches) {
          endpoints.push(match[1]);
        }

        if (classMatch) {
          const type = content.includes("@RestController") ? "api" : "server";
          const description = endpoints.length > 0
            ? `Controller with endpoints: ${endpoints.slice(0, 3).join(", ")}${endpoints.length > 3 ? '...' : ''}`
            : `Spring ${content.includes("@RestController") ? 'REST ' : ''}Controller`;

          entrypoints.push({
            name: classMatch[1],
            path: file.relativePath,
            type,
            description
          });
        }
      }
    } catch {}
  }

  const pomPath = path.join(rootDir, "pom.xml");
  try {
    const pomContent = readFile(pomPath);
    const artifactMatch = pomContent.match(/<artifactId>([^<]+)<\/artifactId>/);
    const versionMatch = pomContent.match(/<version>([^<$]+)<\/version>/);

    if (artifactMatch) {
      entrypoints.push({
        name: "pom.xml",
        path: "pom.xml",
        type: "config",
        description: `Maven project: ${artifactMatch[1]}${versionMatch ? ` v${versionMatch[1]}` : ''}`
      });
    }
  } catch {}

  const gradlePath = path.join(rootDir, "build.gradle");
  const gradleKtsPath = path.join(rootDir, "build.gradle.kts");
  try {
    const gradleContent = readFile(fs.existsSync(gradlePath) ? gradlePath : gradleKtsPath);
    const appMatch = gradleContent.match(/id\s*['"]org\.springframework\.boot['"]|org\.springframework\.boot/);

    if (appMatch) {
      entrypoints.push({
        name: fs.existsSync(gradlePath) ? "build.gradle" : "build.gradle.kts",
        path: fs.existsSync(gradlePath) ? "build.gradle" : "build.gradle.kts",
        type: "config",
        description: "Gradle project with Spring Boot"
      });
    }
  } catch {}

  return entrypoints;
}

export function generateEntrypointsFile(entrypoints: Entrypoint[]): string {
  const grouped = new Map<string, Entrypoint[]>();
  for (const ep of entrypoints) {
    if (!grouped.has(ep.type)) grouped.set(ep.type, []);
    grouped.get(ep.type)?.push(ep);
  }
  
  let content = "# Entrypoints\n\n";
  const labels: Record<string, string> = { cli: "CLI Commands", api: "API Endpoints", worker: "Background Workers", server: "Server Entry Points", client: "Client Apps", library: "Libraries", test: "Test Commands", build: "Build Scripts", lint: "Linting", formatter: "Formatters", other: "Other Entry Points" };
  
  for (const [type, eps] of grouped) {
    content += `### ${labels[type] || type}\n\n`;
    for (const ep of eps) {
      content += `#### ${ep.name}\n\n`;
      content += `- **Path**: \`${ep.path}\`\n`;
      if (ep.description) {
        content += `- **Description**: ${ep.description}\n`;
      }
      if (ep.command) {
        content += `- **Command**: \`${ep.command}\`\n`;
      }
      content += "\n";
    }
  }
  
  return content + "---\n*Generated by ai-first*\n";
}
