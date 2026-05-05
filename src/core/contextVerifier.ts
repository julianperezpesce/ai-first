import fs from "fs";
import path from "path";
import { checkContextFreshness, loadContextManifest } from "./contextManifest.js";

export type VerificationStatus = "pass" | "warn" | "fail";

export interface VerificationCheck {
  id: string;
  status: VerificationStatus;
  scoreImpact: number;
  message: string;
  evidence: string[];
}

export interface ContextVerificationResult {
  score: number;
  status: "trusted" | "degraded" | "untrusted";
  rootDir: string;
  outputDir: string;
  checks: VerificationCheck[];
}

const REQUIRED_CONTEXT_FILES = [
  "ai_context.md",
  "project.json",
  "tech_stack.md",
  "architecture.md",
  "entrypoints.md",
  "agent_brief.md",
  "context_manifest.json",
];

export function verifyContext(rootDir: string, outputDir = path.join(rootDir, "ai-context")): ContextVerificationResult {
  const checks: VerificationCheck[] = [];
  const manifest = loadContextManifest(outputDir);
  const freshness = checkContextFreshness(rootDir, outputDir);

  checks.push({
    id: "manifest-present",
    status: manifest ? "pass" : "fail",
    scoreImpact: manifest ? 0 : 25,
    message: manifest ? "context manifest exists" : "context manifest is missing or unreadable",
    evidence: [path.join(outputDir, "context_manifest.json")],
  });

  checks.push({
    id: "context-freshness",
    status: freshness.fresh ? "pass" : "fail",
    scoreImpact: freshness.fresh ? 0 : 30,
    message: freshness.reason,
    evidence: [
      `generatedAt=${freshness.generatedAt || "unknown"}`,
      `manifestCommit=${freshness.manifestCommit || "unknown"}`,
      `currentCommit=${freshness.currentCommit || "unknown"}`,
    ],
  });

  const missingRequired = REQUIRED_CONTEXT_FILES.filter(file => !fs.existsSync(path.join(outputDir, file)));
  checks.push({
    id: "required-files",
    status: missingRequired.length === 0 ? "pass" : "fail",
    scoreImpact: missingRequired.length === 0 ? 0 : 20,
    message: missingRequired.length === 0 ? "required context files exist" : `missing required files: ${missingRequired.join(", ")}`,
    evidence: REQUIRED_CONTEXT_FILES.map(file => path.join(outputDir, file)),
  });

  checks.push(checkTechStack(rootDir, outputDir));
  checks.push(checkArchitectureSpecificity(outputDir));
  checks.push(checkSetupEnvVars(outputDir));

  const penalty = checks.reduce((sum, check) => sum + check.scoreImpact, 0);
  const score = Math.max(0, 100 - penalty);

  return {
    score,
    status: score >= 85 ? "trusted" : score >= 60 ? "degraded" : "untrusted",
    rootDir,
    outputDir,
    checks,
  };
}

function checkSetupEnvVars(outputDir: string): VerificationCheck {
  const setupPath = path.join(outputDir, "setup.json");
  if (!fs.existsSync(setupPath)) {
    return {
      id: "setup-env-vars",
      status: "warn",
      scoreImpact: 5,
      message: "setup.json is missing",
      evidence: [setupPath],
    };
  }

  try {
    const setup = JSON.parse(fs.readFileSync(setupPath, "utf-8")) as {
      envVars?: Array<{ name: string; required?: boolean }>;
    };
    const ambientVars = new Set(["HOME", "PATH", "PWD", "OLDPWD", "SHELL", "USER", "USERNAME", "TMP", "TEMP", "TMPDIR", "CI", "NODE_ENV"]);
    const suspicious = (setup.envVars || [])
      .filter(envVar => envVar.required && ambientVars.has(envVar.name))
      .map(envVar => envVar.name);

    return {
      id: "setup-env-vars",
      status: suspicious.length === 0 ? "pass" : "warn",
      scoreImpact: suspicious.length === 0 ? 0 : 10,
      message: suspicious.length === 0 ? "setup env vars do not mark ambient shell variables as required" : `setup marks ambient shell variables as required: ${suspicious.join(", ")}`,
      evidence: suspicious,
    };
  } catch {
    return {
      id: "setup-env-vars",
      status: "warn",
      scoreImpact: 5,
      message: "setup.json could not be parsed",
      evidence: [setupPath],
    };
  }
}

function checkTechStack(rootDir: string, outputDir: string): VerificationCheck {
  const packagePath = path.join(rootDir, "package.json");
  const techStackPath = path.join(outputDir, "tech_stack.md");

  if (!fs.existsSync(packagePath) || !fs.existsSync(techStackPath)) {
    return {
      id: "tech-stack-package-evidence",
      status: "warn",
      scoreImpact: 5,
      message: "package.json or tech_stack.md not available for tech stack cross-check",
      evidence: [packagePath, techStackPath],
    };
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8")) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const techStack = fs.readFileSync(techStackPath, "utf-8");
    const expected: string[] = [];

    if (deps.vitest || pkg.scripts?.test?.includes("vitest")) expected.push("Vitest");
    if (deps.vitepress || pkg.scripts?.["docs:dev"]?.includes("vitepress")) expected.push("VitePress");
    if (deps["@modelcontextprotocol/sdk"]) expected.push("Model Context Protocol");
    if (deps["sql.js"]) expected.push("sql.js");

    const missing = expected.filter(item => !techStack.toLowerCase().includes(item.toLowerCase()));

    return {
      id: "tech-stack-package-evidence",
      status: missing.length === 0 ? "pass" : "warn",
      scoreImpact: missing.length === 0 ? 0 : 15,
      message: missing.length === 0 ? "tech stack matches package evidence" : `tech stack misses package evidence: ${missing.join(", ")}`,
      evidence: expected.map(item => `package.json indicates ${item}`),
    };
  } catch {
    return {
      id: "tech-stack-package-evidence",
      status: "warn",
      scoreImpact: 5,
      message: "could not parse package.json for tech stack cross-check",
      evidence: [packagePath],
    };
  }
}

function checkArchitectureSpecificity(outputDir: string): VerificationCheck {
  const architecturePath = path.join(outputDir, "architecture.md");
  if (!fs.existsSync(architecturePath)) {
    return {
      id: "architecture-specificity",
      status: "fail",
      scoreImpact: 10,
      message: "architecture.md is missing",
      evidence: [architecturePath],
    };
  }

  const architecture = fs.readFileSync(architecturePath, "utf-8");
  const genericPhrases = [
    "JavaScript/TypeScript implementation",
    "Single file module",
    "Keep the architecture consistent as the project grows",
  ];
  const found = genericPhrases.filter(phrase => architecture.includes(phrase));

  return {
    id: "architecture-specificity",
    status: found.length === 0 ? "pass" : "warn",
    scoreImpact: found.length === 0 ? 0 : 10,
    message: found.length === 0 ? "architecture output is specific enough" : "architecture output still contains generic descriptions",
    evidence: found,
  };
}
