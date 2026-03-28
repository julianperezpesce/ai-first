import { FileInfo } from "../core/repoScanner.js";
import { readJsonFile, readFile } from "../utils/fileUtils.js";
import path from "path";

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

export function generateEntrypointsFile(entrypoints: Entrypoint[]): string {
  const grouped = new Map<string, Entrypoint[]>();
  for (const ep of entrypoints) {
    if (!grouped.has(ep.type)) grouped.set(ep.type, []);
    grouped.get(ep.type)?.push(ep);
  }
  
  let content = "# Entrypoints\n\n";
  const labels: Record<string, string> = { cli: "CLI", api: "API", worker: "Workers", server: "Server", client: "Client", library: "Library", test: "Tests", build: "Build", lint: "Lint", formatter: "Formatter", other: "Other" };
  
  for (const [type, eps] of grouped) {
    content += `## ${labels[type] || type}\n\n| Name | Path | Command |\n|------|------|--------|\n`;
    for (const ep of eps) content += `| ${ep.name} | \`${ep.path}\` | ${ep.command || "-"} |\n`;
    content += "\n";
  }
  
  return content + "---\n*Generated by ai-first*\n";
}
