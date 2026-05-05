import fs from "fs";
import path from "path";
import { analyzeArchitecture } from "../../analyzers/architecture.js";
import { scanRepo } from "../repoScanner.js";
import { mapTestFiles } from "../../utils/testFileMapper.js";
import { generateTaskContext, type CodeExample } from "../../utils/taskContextGenerator.js";
import { confidence } from "../../utils/findingMetadata.js";

export type TaskKind =
  | "cli-command"
  | "mcp-tool"
  | "analyzer"
  | "tests"
  | "api-endpoint"
  | "auth"
  | "bug-fix"
  | "refactor"
  | "general";

export interface TaskRelevantFile {
  path: string;
  reason: string;
  confidence: number;
  evidence: string[];
}

export interface TaskCommand {
  command: string;
  reason: string;
}

export interface TaskContextV2 {
  task: string;
  kind: TaskKind;
  summary: string;
  relevantFiles: TaskRelevantFile[];
  patterns: CodeExample[];
  relatedTests: TaskRelevantFile[];
  commands: TaskCommand[];
  risks: string[];
  contracts: string[];
  docs: string[];
  evidence: string[];
}

export function getContextForTask(rootDir: string, task: string): TaskContextV2 {
  const kind = classifyTask(task);
  const legacy = generateTaskContext(rootDir, task);
  const scan = scanRepo(rootDir);
  const architecture = analyzeArchitecture(scan.files, rootDir);
  const testMappings = mapTestFiles(rootDir);
  const packageScripts = readPackageScripts(rootDir);

  const candidates = new Map<string, TaskRelevantFile>();
  const addFile = (filePath: string, reason: string, score: number, evidence: string[]) => {
    if (!filePath || filePath.startsWith("dist/") || filePath.startsWith("build/")) return;
    const existing = candidates.get(filePath);
    const entry = {
      path: filePath,
      reason,
      confidence: confidence(score),
      evidence,
    };
    if (!existing || entry.confidence > existing.confidence) {
      candidates.set(filePath, entry);
    }
  };

  for (const file of legacy.relevantFiles) {
    addFile(file, "matched existing task-context heuristic", 0.62, [`legacy task context matched ${file}`]);
  }

  for (const rule of rulesForKind(kind)) {
    for (const file of scan.files) {
      const relative = file.relativePath;
      const lower = relative.toLowerCase();
      if (rule.matches.some(match => lower.includes(match))) {
        addFile(relative, rule.reason, rule.confidence, [`path contains ${rule.matches.find(match => lower.includes(match))}`]);
      }
    }
  }

  const relevantFiles = Array.from(candidates.values())
    .sort((a, b) => b.confidence - a.confidence || a.path.localeCompare(b.path))
    .slice(0, 15);

  const relatedTests = collectRelatedTests(relevantFiles, testMappings);

  return {
    task,
    kind,
    summary: summarizeTask(kind),
    relevantFiles,
    patterns: legacy.relevantPatterns.slice(0, 5),
    relatedTests,
    commands: commandsForTask(kind, packageScripts),
    risks: risksForTask(kind),
    contracts: contractsForTask(kind, architecture.modules.map(module => module.path)),
    docs: legacy.relevantDocs.slice(0, 8),
    evidence: [
      `classified task as ${kind}`,
      `${scan.totalFiles} files scanned`,
      `${testMappings.length} source-to-test mappings available`,
    ],
  };
}

function classifyTask(task: string): TaskKind {
  const lower = task.toLowerCase();
  if (lower.includes("cli") || lower.includes("command")) return "cli-command";
  if (lower.includes("mcp") || lower.includes("tool")) return "mcp-tool";
  if (lower.includes("analyzer") || lower.includes("detector") || lower.includes("detect")) return "analyzer";
  if (lower.includes("test") || lower.includes("spec")) return "tests";
  if (lower.includes("endpoint") || lower.includes("api") || lower.includes("route")) return "api-endpoint";
  if (lower.includes("auth") || lower.includes("login") || lower.includes("jwt")) return "auth";
  if (lower.includes("bug") || lower.includes("fix") || lower.includes("error")) return "bug-fix";
  if (lower.includes("refactor") || lower.includes("clean") || lower.includes("improve")) return "refactor";
  return "general";
}

function rulesForKind(kind: TaskKind): Array<{ matches: string[]; reason: string; confidence: number }> {
  const common = [
    { matches: ["src/core/services"], reason: "shared services are the preferred home for reusable CLI/MCP logic", confidence: 0.72 },
  ];
  const rules: Record<TaskKind, Array<{ matches: string[]; reason: string; confidence: number }>> = {
    "cli-command": [
      { matches: ["src/commands/ai-first.ts", "src/commands/"], reason: "CLI routing, argument parsing and human output live here", confidence: 0.94 },
      { matches: ["tests/cli-"], reason: "CLI behavior should be covered by command tests", confidence: 0.86 },
    ],
    "mcp-tool": [
      { matches: ["src/mcp/server.ts", "src/mcp/"], reason: "MCP schemas and tool handlers live here", confidence: 0.94 },
      { matches: ["src/core/services"], reason: "MCP tools should call shared core services", confidence: 0.9 },
      { matches: ["tests/cli-mcp.test.ts"], reason: "MCP install and integration behavior is tested here", confidence: 0.82 },
    ],
    analyzer: [
      { matches: ["src/analyzers/", "src/utils/"], reason: "repository detectors and generated context analyzers live here", confidence: 0.88 },
      { matches: ["tests/contextaccuracy", "tests/framework-detection", "tests/utils-"], reason: "analyzer behavior is covered by focused detector tests", confidence: 0.82 },
    ],
    tests: [
      { matches: ["tests/", ".test.ts", ".spec.ts"], reason: "existing test style and fixtures live here", confidence: 0.9 },
      { matches: ["fixtures/"], reason: "integration fixtures show realistic repository shapes", confidence: 0.7 },
    ],
    "api-endpoint": [
      { matches: ["controller", "route", "handler", "api"], reason: "endpoint work usually follows controller/route/handler patterns", confidence: 0.82 },
    ],
    auth: [
      { matches: ["auth", "login", "jwt", "token"], reason: "auth work should follow existing auth/token patterns", confidence: 0.84 },
    ],
    "bug-fix": [
      { matches: ["error", "handler", "test", "spec"], reason: "bug fixes need error context and regression tests", confidence: 0.7 },
    ],
    refactor: [
      { matches: ["src/core", "src/utils", "src/analyzers"], reason: "refactors usually touch shared implementation modules", confidence: 0.68 },
    ],
    general: [],
  };

  return [...(rules[kind] || []), ...common];
}

function collectRelatedTests(relevantFiles: TaskRelevantFile[], mappings: ReturnType<typeof mapTestFiles>): TaskRelevantFile[] {
  const tests = new Map<string, TaskRelevantFile>();
  for (const file of relevantFiles) {
    const mapping = mappings.find(item => item.sourceFile === file.path);
    for (const testFile of mapping?.testFiles || []) {
      tests.set(testFile, {
        path: testFile,
        reason: mapping?.reason || `related to ${file.path}`,
        confidence: confidence(mapping?.confidence || 0.6),
        evidence: mapping?.evidence || [`${file.path} -> ${testFile}`],
      });
    }
  }
  return Array.from(tests.values()).sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

function commandsForTask(kind: TaskKind, scripts: Record<string, string>): TaskCommand[] {
  const commands: TaskCommand[] = [];
  if (scripts.build) commands.push({ command: "npm run build", reason: "validate TypeScript output" });
  if (scripts.test) commands.push({ command: "npm test", reason: "run regression suite" });
  if (kind === "cli-command" || kind === "mcp-tool") {
    commands.push({ command: "npm test -- tests/cli-mcp.test.ts tests/cli-init.test.ts", reason: "check CLI/MCP integration paths" });
  }
  if (kind === "analyzer") {
    commands.push({ command: "npm test -- tests/contextAccuracy.test.ts tests/utils-extractors.test.ts", reason: "check analyzer accuracy contracts" });
  }
  return commands;
}

function risksForTask(kind: TaskKind): string[] {
  const base = [
    "Do not edit generated dist output by hand; rebuild with npm run build.",
    "Keep CLI human formatting separate from reusable core service results.",
  ];
  const byKind: Partial<Record<TaskKind, string[]>> = {
    "cli-command": ["Avoid process.exit or console output inside shared core logic."],
    "mcp-tool": ["MCP handlers should return structured JSON and avoid shell interpolation."],
    analyzer: ["Calibrate confidence and evidence to avoid false positives."],
    tests: ["Prefer focused fixtures over mutating shared fixture directories."],
  };
  return [...(byKind[kind] || []), ...base];
}

function contractsForTask(kind: TaskKind, modulePaths: string[]): string[] {
  const contracts = [
    "Source is TypeScript under src; runtime output is dist.",
    "ESM imports in TypeScript should use .js specifiers.",
    "ai-context is generated output; regenerate instead of editing manually.",
  ];
  if (modulePaths.includes("src/mcp")) contracts.push("MCP tools should call src/core/services where possible.");
  if (kind === "cli-command") contracts.push("CLI owns args, formatting and exit codes.");
  if (kind === "mcp-tool") contracts.push("MCP owns schemas and agent-facing tool handlers.");
  return contracts;
}

function summarizeTask(kind: TaskKind): string {
  const summaries: Record<TaskKind, string> = {
    "cli-command": "Implement or change a CLI command while keeping reusable behavior in core services.",
    "mcp-tool": "Implement or change an agent-facing MCP tool backed by core services.",
    analyzer: "Improve repository analysis with explicit confidence and evidence.",
    tests: "Add or improve tests using existing Vitest patterns and fixtures.",
    "api-endpoint": "Add or change an endpoint following existing route/controller patterns.",
    auth: "Work on authentication flows and security-sensitive token/password behavior.",
    "bug-fix": "Fix a behavior with a focused regression test.",
    refactor: "Improve structure while preserving external behavior.",
    general: "Use repository evidence to identify the safest files and checks for the task.",
  };
  return summaries[kind];
}

function readPackageScripts(rootDir: string): Record<string, string> {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8")) as { scripts?: Record<string, string> };
    return pkg.scripts || {};
  } catch {
    return {};
  }
}
