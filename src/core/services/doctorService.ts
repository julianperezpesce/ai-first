import path from "path";
import { checkContextFreshness, type FreshnessResult } from "../contextManifest.js";
import { verifyContext, type ContextVerificationResult } from "../contextVerifier.js";

export interface ContextDoctorOptions {
  rootDir: string;
  outputDir?: string;
  strict?: boolean;
}

export interface ContextDoctorResult {
  rootDir: string;
  outputDir: string;
  freshness: FreshnessResult;
  verification?: ContextVerificationResult;
  ok: boolean;
}

export function runContextDoctor(options: ContextDoctorOptions): ContextDoctorResult {
  const outputDir = options.outputDir || path.join(options.rootDir, "ai-context");
  const freshness = checkContextFreshness(options.rootDir, outputDir);
  const verification = options.strict ? verifyContext(options.rootDir, outputDir) : undefined;

  return {
    rootDir: options.rootDir,
    outputDir,
    freshness,
    verification,
    ok: verification ? verification.status === "trusted" : freshness.fresh,
  };
}

export function isContextFresh(rootDir: string, outputDir = path.join(rootDir, "ai-context")): FreshnessResult {
  return checkContextFreshness(rootDir, outputDir);
}

export function verifyAIContext(rootDir: string, outputDir = path.join(rootDir, "ai-context")): ContextVerificationResult {
  return verifyContext(rootDir, outputDir);
}
