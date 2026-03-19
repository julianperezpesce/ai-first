import fs from "fs";
import path from "path";
import { scanRepo } from "../core/repoScanner.js";
import { generateModuleGraph } from "../core/moduleGraph.js";

export interface ExploreResult { success: boolean; modules?: string[]; dependencies?: string[]; error?: string; }

export async function runExplore(rootDir: string, moduleName: string | undefined): Promise<ExploreResult> {
  const aiDir = path.join(rootDir, "ai-context");
  const graphFile = path.join(aiDir, "graph", "module-graph.json");

  if (!moduleName || moduleName === 'all') {
    console.log("\n📦 Repository Modules\n");
    if (!fs.existsSync(graphFile)) { console.log("Generating module graph..."); await generateModuleGraph(rootDir, aiDir); }
    if (fs.existsSync(graphFile)) {
      const data = JSON.parse(fs.readFileSync(graphFile, 'utf-8'));
      for (const mod of data.modules || []) console.log(`  ${mod.name}`);
      console.log(`\nTotal: ${data.modules?.length || 0} modules`);
      return { success: true, modules: data.modules?.map((m: any) => m.name) };
    }
    const scan = scanRepo(rootDir);
    const modules = new Set<string>();
    for (const f of scan.files) { const p = f.relativePath.split('/'); if (p.length > 1 && p[0] !== 'ai' && p[0] !== 'node_modules') modules.add(p[0]); }
    for (const m of [...modules].sort()) console.log(`  ${m}`);
    return { success: true, modules: [...modules].sort() };
  }

  console.log(`\n🔍 Module: ${moduleName}\n`);
  if (!fs.existsSync(graphFile)) { await generateModuleGraph(rootDir, aiDir); }
  if (fs.existsSync(graphFile)) {
    const data = JSON.parse(fs.readFileSync(graphFile, 'utf-8'));
    const mod = data.modules?.find((m: any) => m.name === moduleName);
    if (mod) {
      console.log("Files:");
      for (const p of mod.paths || []) console.log(`  ${p}`);
      const deps = data.dependencies?.filter((d: any) => d.from === moduleName || d.to === moduleName) || [];
      if (deps.length > 0) { console.log("\nDependencies:"); for (const d of deps) console.log(`  ${d.from} → ${d.to}`); }
      return { success: true, dependencies: deps.map((d: any) => d.to === moduleName ? d.from : d.to) };
    }
    return { success: false, error: `Module '${moduleName}' not found` };
  }
  return { success: false, error: 'Run: ai-first explore all' };
}

export function exploreMain(args: string[]): void {
  let rootDir = process.cwd();
  const moduleName = args.shift();
  for (let i = 0; i < args.length; i++) { const arg = args[i]; if (arg === "--root" || arg === "-r") rootDir = args[++i]; else if (arg === "--help" || arg === "-h") { console.log("\nai-first explore - Explore module dependencies\nUsage: ai-first explore <module>\n"); process.exit(0); } }
  runExplore(rootDir, moduleName).then(r => process.exit(r.success ? 0 : 1));
}
