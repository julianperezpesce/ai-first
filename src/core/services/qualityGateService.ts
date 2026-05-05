import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { verifyAIContext } from "./doctorService.js";

export type QualityGateStatus = "pass" | "warn" | "fail";

export interface QualityGate {
  id: string;
  status: QualityGateStatus;
  message: string;
  evidence: string[];
  command?: string;
}

export interface QualityGateResult {
  rootDir: string;
  outputDir: string;
  status: "pass" | "warn" | "fail";
  gates: QualityGate[];
  summary: {
    pass: number;
    warn: number;
    fail: number;
  };
}

export interface QualityGateOptions {
  rootDir: string;
  outputDir?: string;
  runCommands?: boolean;
}

export function evaluateQualityGates(options: QualityGateOptions): QualityGateResult {
  const rootDir = options.rootDir;
  const outputDir = options.outputDir || path.join(rootDir, "ai-context");
  const gates: QualityGate[] = [];
  const packageJson = readPackageJson(rootDir);
  const scripts = packageJson?.scripts || {};

  gates.push(checkPackageBin(rootDir, packageJson));
  gates.push(checkRequiredScript(scripts, "build"));
  gates.push(checkRequiredScript(scripts, "test"));
  gates.push(checkTypeScriptConfig(rootDir));
  gates.push(checkCiWorkflow(rootDir));
  gates.push(checkDocsBuildScript(scripts));
  gates.push(checkReadme(rootDir));
  gates.push(checkMcpServer(rootDir));
  gates.push(checkNoMcpShellInterpolation(rootDir));
  gates.push(checkContextTrust(rootDir, outputDir));

  if (options.runCommands) {
    if (scripts.build) gates.push(runNpmScript(rootDir, "build"));
    if (scripts.test) gates.push(runNpmScript(rootDir, "test"));
    if (scripts["docs:build"]) gates.push(runNpmScript(rootDir, "docs:build"));
  }

  const summary = {
    pass: gates.filter(gate => gate.status === "pass").length,
    warn: gates.filter(gate => gate.status === "warn").length,
    fail: gates.filter(gate => gate.status === "fail").length,
  };

  return {
    rootDir,
    outputDir,
    status: summary.fail > 0 ? "fail" : summary.warn > 0 ? "warn" : "pass",
    gates,
    summary,
  };
}

function checkPackageBin(rootDir: string, packageJson: PackageJson | null): QualityGate {
  if (!packageJson) {
    return fail("package-json", "package.json is missing", [path.join(rootDir, "package.json")]);
  }

  const bins = packageJson.bin || {};
  const entries = typeof bins === "string" ? [["main", bins]] : Object.entries(bins);
  if (entries.length === 0) {
    return warn("package-bin", "package.json does not declare CLI bin entries", ["package.json"]);
  }

  const missing = entries
    .map(([name, binPath]) => ({ name, binPath }))
    .filter(entry => !fs.existsSync(path.join(rootDir, entry.binPath)));

  return {
    id: "package-bin",
    status: missing.length === 0 ? "pass" : "fail",
    message: missing.length === 0 ? "package.json bin entries point to existing files" : `missing bin targets: ${missing.map(entry => `${entry.name}:${entry.binPath}`).join(", ")}`,
    evidence: entries.map(([name, binPath]) => `bin.${name}=${binPath}`),
  };
}

function checkRequiredScript(scripts: Record<string, string>, scriptName: string): QualityGate {
  return {
    id: `script-${scriptName}`,
    status: scripts[scriptName] ? "pass" : "fail",
    message: scripts[scriptName] ? `npm script "${scriptName}" exists` : `npm script "${scriptName}" is missing`,
    evidence: scripts[scriptName] ? [`package.json scripts.${scriptName} = ${scripts[scriptName]}`] : ["package.json"],
  };
}

function checkTypeScriptConfig(rootDir: string): QualityGate {
  const tsconfigPath = path.join(rootDir, "tsconfig.json");
  return {
    id: "typescript-config",
    status: fs.existsSync(tsconfigPath) ? "pass" : "warn",
    message: fs.existsSync(tsconfigPath) ? "tsconfig.json exists" : "tsconfig.json is missing",
    evidence: [tsconfigPath],
  };
}

function checkCiWorkflow(rootDir: string): QualityGate {
  const workflowsDir = path.join(rootDir, ".github", "workflows");
  if (!fs.existsSync(workflowsDir)) {
    return warn("ci-workflow", "No GitHub Actions workflow found", [workflowsDir]);
  }

  const workflows = fs.readdirSync(workflowsDir).filter(file => file.endsWith(".yml") || file.endsWith(".yaml"));
  const content = workflows.map(file => fs.readFileSync(path.join(workflowsDir, file), "utf-8")).join("\n");
  const hasBuild = content.includes("npm run build") || content.includes("npm ci");
  const hasTest = content.includes("npm test") || content.includes("vitest");

  return {
    id: "ci-workflow",
    status: hasBuild && hasTest ? "pass" : "warn",
    message: hasBuild && hasTest ? "CI workflow appears to cover build/test" : "CI workflow exists but build/test coverage is unclear",
    evidence: workflows.map(file => path.join(".github/workflows", file)),
  };
}

function checkDocsBuildScript(scripts: Record<string, string>): QualityGate {
  return {
    id: "docs-build-script",
    status: scripts["docs:build"] ? "pass" : "warn",
    message: scripts["docs:build"] ? "docs build script exists" : "docs build script is missing",
    evidence: scripts["docs:build"] ? [`package.json scripts.docs:build = ${scripts["docs:build"]}`] : ["package.json"],
  };
}

function checkReadme(rootDir: string): QualityGate {
  const readmePath = path.join(rootDir, "README.md");
  return {
    id: "readme",
    status: fs.existsSync(readmePath) ? "pass" : "warn",
    message: fs.existsSync(readmePath) ? "README.md exists" : "README.md is missing",
    evidence: [readmePath],
  };
}

function checkMcpServer(rootDir: string): QualityGate {
  const serverPath = path.join(rootDir, "src", "mcp", "server.ts");
  return {
    id: "mcp-server",
    status: fs.existsSync(serverPath) ? "pass" : "warn",
    message: fs.existsSync(serverPath) ? "MCP server source exists" : "MCP server source is missing",
    evidence: [serverPath],
  };
}

function checkNoMcpShellInterpolation(rootDir: string): QualityGate {
  const serverPath = path.join(rootDir, "src", "mcp", "server.ts");
  if (!fs.existsSync(serverPath)) {
    return warn("mcp-shell-interpolation", "MCP server source is missing", [serverPath]);
  }

  const content = fs.readFileSync(serverPath, "utf-8");
  const risky = /execSync\s*\(\s*`|exec\s*\(\s*`/.test(content);
  return {
    id: "mcp-shell-interpolation",
    status: risky ? "fail" : "pass",
    message: risky ? "MCP server contains interpolated shell execution" : "MCP server avoids interpolated shell execution",
    evidence: [serverPath],
  };
}

function checkContextTrust(rootDir: string, outputDir: string): QualityGate {
  const verification = verifyAIContext(rootDir, outputDir);
  return {
    id: "context-trust",
    status: verification.status === "trusted" ? "pass" : verification.status === "degraded" ? "warn" : "fail",
    message: `Context Truth Score ${verification.score}/100 (${verification.status})`,
    evidence: verification.checks.map(check => `${check.id}: ${check.status}`),
  };
}

function runNpmScript(rootDir: string, scriptName: string): QualityGate {
  try {
    execFileSync("npm", ["run", scriptName], {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return {
      id: `run-${scriptName}`,
      status: "pass",
      message: `npm run ${scriptName} passed`,
      evidence: [`npm run ${scriptName}`],
      command: `npm run ${scriptName}`,
    };
  } catch (error) {
    return {
      id: `run-${scriptName}`,
      status: "fail",
      message: `npm run ${scriptName} failed`,
      evidence: [error instanceof Error ? error.message : String(error)],
      command: `npm run ${scriptName}`,
    };
  }
}

function readPackageJson(rootDir: string): PackageJson | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8")) as PackageJson;
  } catch {
    return null;
  }
}

function fail(id: string, message: string, evidence: string[]): QualityGate {
  return { id, status: "fail", message, evidence };
}

function warn(id: string, message: string, evidence: string[]): QualityGate {
  return { id, status: "warn", message, evidence };
}

interface PackageJson {
  bin?: string | Record<string, string>;
  scripts?: Record<string, string>;
}
