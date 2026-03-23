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

function getScriptType(name: string): Entrypoint["type"] | null {
  const l = name.toLowerCase();
  if (l.includes("start") || l.includes("dev") || l.includes("serve")) return "server";
  if (l.includes("build") || l.includes("compile")) return "build";
  if (l.includes("test")) return "test";
  if (l.includes("lint")) return "lint";
  if (l.includes("format")) return "formatter";
  return null;
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
