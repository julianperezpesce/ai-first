import fs from "fs";
import path from "path";
import { ensureDir, writeFile, readJsonFile } from "../utils/fileUtils.js";

export interface Feature { feature: string; files: string[]; entrypoints: string[]; }
export interface Flow { name: string; entrypoint: string; files: string[]; depth: number; layers: string[]; }
export interface SemanticContexts { features: Feature[]; flows: Flow[]; }

const FEATURE_ROOTS = ["src", "app", "packages", "features", "lib", "modules", "core"];
const LAYER_ROOTS = ["api", "services", "controllers", "handlers", "data", "repository", "repositories"];
const EXCLUDED = new Set(["utils", "helpers", "types", "interfaces", "constants", "config", "dto", "models", "common", "node_modules", ".git", "dist", "build", "coverage", "__tests__", "test", "tests", ".next", ".nuxt"]);
const CONTAINER = new Set(["modules", "lib", "core", "shared", "layouts", "pages", "components"]);
const ENTRY_PATS = ["controller", "route", "handler", "command", "service", "router", "api", "endpoint"];
const FLOW_ENTRY_PATS = ["controller", "route", "handler", "command"];
const FLOW_EXCLUDE = ["repository", "repo", "utils", "helper", "model", "entity", "dto", "type", "interface", "constant", "config"];
const MAX_DEPTH = 5, MAX_FILES = 30;
const LAYER_PRIORITY: Record<string, number> = {
  api: 1, controller: 1, handler: 1, route: 1, router: 1, service: 2, usecase: 2, interactor: 2,
  data: 3, repository: 3, repo: 3, dal: 3, dao: 3, persistence: 3, model: 4, entity: 4, domain: 4,
};

function isSrc(f: string): boolean { const e = path.extname(f).toLowerCase(); return [".ts",".tsx",".js",".jsx",".py",".java",".kt",".go",".rs",".rb",".php",".cs",".vue",".svelte"].includes(e); }
function isEntry(f: string): boolean { return ENTRY_PATS.some(p => path.basename(f).toLowerCase().includes(p)); }
function isFlowEntry(f: string): boolean { return FLOW_ENTRY_PATS.some(p => path.basename(f).toLowerCase().includes(p)); }
function isExcl(f: string): boolean { return EXCLUDED.has(f.toLowerCase()); }
function isExclFlow(f: string): boolean { const l = f.toLowerCase(); return FLOW_EXCLUDE.some(p => l.includes("/"+p) || l.includes("\\"+p)); }

function getLayer(f: string): string {
  const p = f.split(/[/\\]/).map(s => s.toLowerCase().replace(/\.(ts|js|tsx|jsx)$/, ""));
  if (p.some(s => ["controller","handler","route","router","api","endpoint"].includes(s))) return "api";
  if (p.some(s => ["service","services","usecase","interactor"].includes(s))) return "service";
  if (p.some(s => ["repository","repo","dal","dao","data","persistence"].includes(s))) return "data";
  if (p.some(s => ["model","entity","schema","domain"].includes(s))) return "domain";
  if (p.some(s => ["util","helper","lib","common"].includes(s))) return "util";
  return "unknown";
}

function getPrio(f: string): number {
  for (const p of [...f.split(/[/\\]/)].reverse()) {
    const l = p.replace(/\.(ts|js|tsx|jsx)$/, "").toLowerCase();
    if (LAYER_PRIORITY[l] !== undefined) return LAYER_PRIORITY[l];
  }
  return 99;
}

function getCandidates(files: string[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const f of files) {
    const p = f.split("/");
    const ridx = p.findIndex(x => FEATURE_ROOTS.includes(x.toLowerCase()));
    if (ridx !== -1) {
      for (let d = 1; d <= 2; d++) {
        const fidx = ridx + d;
        if (fidx >= p.length - 1) continue;
        const fn = p[fidx];
        if (isExcl(fn)) continue;
        if (d === 1 && CONTAINER.has(fn.toLowerCase())) continue;
        const k = p.slice(0, fidx + 1).join("/");
        if (!m.has(k)) m.set(k, []);
        m.get(k)!.push(f);
      }
    }
    if (p.length >= 2 && LAYER_ROOTS.includes(p[0].toLowerCase())) {
      if (!m.has(p[0])) m.set(p[0], []);
      m.get(p[0])!.push(f);
    }
  }
  return m;
}

export function generateFeatures(modulesJson: string, _symbolsJson: string): Feature[] {
  const feats: Feature[] = [];
  let mods: Record<string, {path: string; files: string[]}> = {};
  try { if (fs.existsSync(modulesJson)) mods = (readJsonFile(modulesJson) as any).modules || {}; } catch {}
  
  const allFiles = Object.values(mods).flatMap(m => m.files || []);
  const cands = getCandidates(allFiles);
  
  for (const [fp, files] of cands) {
    const srcs = files.filter(isSrc);
    if (srcs.length < 3) continue;
    const ents = srcs.filter(isEntry);
    if (ents.length === 0) continue;
    feats.push({ feature: fp.split("/").pop() || fp, files: srcs.slice(0, 50), entrypoints: ents.slice(0, 10) });
  }
  return feats;
}

function flowsFromGraph(g: any): Flow[] {
  const fl: Flow[] = [];
  const bySym: Record<string, any[]> = {};
  for (const r of g.relationships || []) { if (!bySym[r.symbolId]) bySym[r.symbolId] = []; bySym[r.symbolId].push(r); }
  const ents = (g.symbols || []).filter((s: any) => s.file && isFlowEntry(s.file));
  
  for (const ep of ents) {
    const vis = new Set<string>(), fset = new Set<string>(), lset = new Set<string>();
    const tr = (sid: string, d: number) => {
      if (d > MAX_DEPTH || vis.has(sid) || fset.size >= MAX_FILES) return;
      vis.add(sid);
      const sym = (g.symbols || []).find((s: any) => s.id === sid);
      if (!sym?.file || isExclFlow(sym.file)) return;
      fset.add(sym.file); lset.add(getLayer(sym.file));
      for (const r of bySym[sid] || []) if (["calls","imports","references"].includes(r.type)) tr(r.targetId, d + 1);
    };
    
    if (ep.file) { fset.add(ep.file); lset.add(getLayer(ep.file)); for (const r of bySym[ep.id] || []) if (["calls","imports","references"].includes(r.type)) tr(r.targetId, 1); }
    if (fset.size >= 3 && lset.size >= 2) fl.push({ name: path.basename(ep.file||""), entrypoint: ep.file||"", files: Array.from(fset).slice(0,MAX_FILES), depth: Math.min(MAX_DEPTH, [...vis].length), layers: Array.from(lset) });
  }
  return fl;
}

function flowsFromFolders(files: string[]): Flow[] {
  const fl: Flow[] = [];
  // Group by feature prefix (e.g., auth*, user*, product*)
  const byFeature = new Map<string, string[]>();
  for (const f of files) if (isSrc(f)) {
    const base = path.basename(f).replace(/\.(ts|js|tsx|jsx)$/, "");
    // Extract feature name: authController -> auth, userService -> user
    const feat = base.replace(/(Controller|Service|Repository|Handler|Route|Model|Entity)$/i, "");
    const key = feat.toLowerCase();
    if (!byFeature.has(key)) byFeature.set(key, []);
    byFeature.get(key)!.push(f);
  }
  
  for (const [feat, fs] of byFeature) {
    if (fs.length < 3) continue;
    const lays = new Set(fs.map(getLayer).filter(l => l !== "unknown"));
    if (lays.size < 2) continue;
    const sorted = [...fs].sort((a, b) => getPrio(a) - getPrio(b));
    // Find best entrypoint (controller/handler first)
    const entry = sorted.find(isFlowEntry) || sorted[0];
    fl.push({ name: feat, entrypoint: entry, files: sorted.slice(0, MAX_FILES), depth: lays.size, layers: Array.from(lays) });
  }
  return fl;
}

function flowsFromImports(depsPath: string, files: string[]): Flow[] {
  const fl: Flow[] = [];
  let deps: any = { byFile: {} };
  try { if (fs.existsSync(depsPath)) deps = readJsonFile(depsPath); } catch { return fl; }
  const impTo = new Map<string, Set<string>>();
  for (const [f, imps] of Object.entries(deps.byFile || {})) { if (!impTo.has(f)) impTo.set(f, new Set()); for (const i of (imps as string[])) impTo.get(f)!.add(i); }
  
  const ents = files.filter(isFlowEntry);
  for (const ep of ents) {
    const vis = new Set<string>([ep]), fset = new Set<string>([ep]), lset = new Set<string>();
    const tr = (f: string, d: number) => {
      if (d > MAX_DEPTH || fset.size >= MAX_FILES) return;
      for (const i of (impTo.get(f) || [])) {
        if (vis.has(i) || isExclFlow(i)) continue;
        vis.add(i); fset.add(i); lset.add(getLayer(i)); tr(i, d + 1);
      }
    };
    tr(ep, 1);
    if (fset.size >= 3 && lset.size >= 2) fl.push({ name: path.basename(ep, path.extname(ep)), entrypoint: ep, files: Array.from(fset), depth: Math.min(MAX_DEPTH, [...vis].length), layers: Array.from(lset) });
  }
  return fl;
}

export function generateFlows(graphPath: string, modsPath: string, depsPath?: string): Flow[] {
  let g: any = { symbols: [], relationships: [] }, mods: Record<string, {path: string; files: string[]}> = {};
  try { if (fs.existsSync(graphPath)) g = readJsonFile(graphPath); } catch {}
  try { if (fs.existsSync(modsPath)) mods = (readJsonFile(modsPath) as any).modules || {}; } catch {}
  const allFiles = Object.values(mods).flatMap(m => m.files || []);
  const density = (g.relationships?.length || 0) / ((g.symbols?.length || 1) || 1);
  const weak = density < 0.5 || (g.relationships?.length || 0) < 10;
  
  const fl: Flow[] = [];
  if (!weak && g.relationships?.length) fl.push(...flowsFromGraph(g));
  if (fl.length === 0 || weak) fl.push(...flowsFromFolders(allFiles));
  if (fl.length === 0 || weak) fl.push(...flowsFromImports(depsPath || "", allFiles));
  
  const seen = new Set<string>();
  return fl.filter(f => { if (seen.has(f.name)) return false; seen.add(f.name); return true; }).slice(0, 20);
}

export function generateSemanticContexts(aiDir: string): SemanticContexts {
  const fDir = path.join(aiDir, "context", "features");
  const flDir = path.join(aiDir, "context", "flows");
  const modsP = path.join(aiDir, "modules.json");
  const symP = path.join(aiDir, "symbols.json");
  const grP = path.join(aiDir, "graph", "symbol-graph.json");
  const depP = path.join(aiDir, "dependencies.json");
  
  const feats = generateFeatures(modsP, symP);
  const flows = generateFlows(grP, modsP, depP);
  
  ensureDir(fDir);
  for (const f of feats) writeFile(path.join(fDir, `${f.feature}.json`), JSON.stringify(f, null, 2));
  ensureDir(flDir);
  for (const f of flows) writeFile(path.join(flDir, `${f.name}.json`), JSON.stringify(f, null, 2));
  
  return { features: feats, flows };
}
