import { readJsonFile, readFile } from "../utils/fileUtils.js";
import path from "path";
export function discoverEntrypoints(files, rootDir) {
    const entrypoints = [];
    try {
        const pkgPath = path.join(rootDir, "package.json");
        const pkg = readJsonFile(pkgPath);
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
    }
    catch { }
    // From file names
    const patterns = {
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
        }
        catch { }
    }
    return entrypoints;
}
/**
 * Parse AndroidManifest.xml to extract entrypoints
 */
function parseAndroidManifest(content, manifestPath) {
    const entrypoints = [];
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
    const permissions = [];
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
function getScriptType(name) {
    const l = name.toLowerCase();
    if (l.includes("start") || l.includes("dev") || l.includes("serve"))
        return "server";
    if (l.includes("build") || l.includes("compile"))
        return "build";
    if (l.includes("test"))
        return "test";
    if (l.includes("lint"))
        return "lint";
    if (l.includes("format"))
        return "formatter";
    return null;
}
export function generateEntrypointsFile(entrypoints) {
    const grouped = new Map();
    for (const ep of entrypoints) {
        if (!grouped.has(ep.type))
            grouped.set(ep.type, []);
        grouped.get(ep.type)?.push(ep);
    }
    let content = "# Entrypoints\n\n";
    const labels = { cli: "CLI", api: "API", worker: "Workers", server: "Server", client: "Client", library: "Library", test: "Tests", build: "Build", lint: "Lint", formatter: "Formatter", other: "Other" };
    for (const [type, eps] of grouped) {
        content += `## ${labels[type] || type}\n\n| Name | Path | Command |\n|------|------|--------|\n`;
        for (const ep of eps)
            content += `| ${ep.name} | \`${ep.path}\` | ${ep.command || "-"} |\n`;
        content += "\n";
    }
    return content + "---\n*Generated by ai-first*\n";
}
//# sourceMappingURL=entrypoints.js.map