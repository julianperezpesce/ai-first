import crypto from "crypto";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import type { FileInfo } from "./repoScanner.js";

export interface ContextManifestFile {
  path: string;
  hash: string;
  size: number;
}

export interface ContextManifest {
  schemaVersion: "1.0";
  generatedAt: string;
  aiFirstVersion: string;
  rootDir: string;
  outputDir: string;
  preset: string | null;
  git: {
    commit: string | null;
    branch: string | null;
    dirty: boolean;
  };
  scannedFiles: number;
  outputFiles: string[];
  rootHash: string;
  files: ContextManifestFile[];
}

export interface FreshnessResult {
  fresh: boolean;
  reason: string;
  generatedAt?: string;
  manifestPath: string;
  currentCommit: string | null;
  manifestCommit: string | null;
  dirty: boolean;
  changedFiles: string[];
  missingFiles: string[];
  addedFiles: string[];
}

export const CONTEXT_MANIFEST_FILE = "context_manifest.json";

export function createContextManifest(params: {
  rootDir: string;
  outputDir: string;
  files: FileInfo[];
  aiFirstVersion: string;
  preset?: string | null;
}): ContextManifest {
  const trackedFiles = params.files
    .map(file => toManifestFile(file.path, file.relativePath))
    .filter((file): file is ContextManifestFile => Boolean(file))
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    schemaVersion: "1.0",
    generatedAt: new Date().toISOString(),
    aiFirstVersion: params.aiFirstVersion,
    rootDir: params.rootDir,
    outputDir: params.outputDir,
    preset: params.preset || null,
    git: readGitState(params.rootDir),
    scannedFiles: trackedFiles.length,
    outputFiles: ensureManifestListed(listOutputFiles(params.outputDir)),
    rootHash: computeRootHash(trackedFiles),
    files: trackedFiles,
  };
}

export function writeContextManifest(manifest: ContextManifest): string {
  const manifestPath = path.join(manifest.outputDir, CONTEXT_MANIFEST_FILE);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  return manifestPath;
}

export function loadContextManifest(outputDir: string): ContextManifest | null {
  const manifestPath = path.join(outputDir, CONTEXT_MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as ContextManifest;
  } catch {
    return null;
  }
}

export function checkContextFreshness(rootDir: string, outputDir = path.join(rootDir, "ai-context")): FreshnessResult {
  const manifestPath = path.join(outputDir, CONTEXT_MANIFEST_FILE);
  const manifest = loadContextManifest(outputDir);
  const currentGit = readGitState(rootDir);

  if (!manifest) {
    return {
      fresh: false,
      reason: "context_manifest.json is missing or unreadable",
      manifestPath,
      currentCommit: currentGit.commit,
      manifestCommit: null,
      dirty: currentGit.dirty,
      changedFiles: [],
      missingFiles: [],
      addedFiles: [],
    };
  }

  const manifestFiles = Array.isArray(manifest.files) ? manifest.files : [];
  const manifestGit = manifest.git || { commit: null, branch: null, dirty: false };
  const currentFiles = collectCurrentFiles(rootDir, manifestFiles.map(file => file.path));
  const changedFiles: string[] = [];
  const missingFiles: string[] = [];

  for (const manifestFile of manifestFiles) {
    const current = currentFiles.get(manifestFile.path);
    if (!current) {
      missingFiles.push(manifestFile.path);
    } else if (current.hash !== manifestFile.hash) {
      changedFiles.push(manifestFile.path);
    }
  }

  const addedFiles = getAddedFiles(rootDir, { ...manifest, files: manifestFiles });
  const staleReasons: string[] = [];

  if (manifestGit.commit && currentGit.commit && manifestGit.commit !== currentGit.commit) {
    staleReasons.push("git commit changed since context was generated");
  }
  if (currentGit.dirty && !manifestGit.dirty) {
    staleReasons.push("worktree has uncommitted changes");
  }
  if (changedFiles.length > 0) {
    staleReasons.push(`${changedFiles.length} tracked files changed`);
  }
  if (missingFiles.length > 0) {
    staleReasons.push(`${missingFiles.length} tracked files are missing`);
  }
  if (addedFiles.length > 0) {
    staleReasons.push(`${addedFiles.length} files were added since context generation`);
  }

  return {
    fresh: staleReasons.length === 0,
    reason: staleReasons.length === 0 ? "context is fresh" : staleReasons.join("; "),
    generatedAt: manifest.generatedAt,
    manifestPath,
    currentCommit: currentGit.commit,
    manifestCommit: manifestGit.commit,
    dirty: currentGit.dirty,
    changedFiles,
    missingFiles,
    addedFiles,
  };
}

function toManifestFile(filePath: string, relativePath: string): ContextManifestFile | null {
  try {
    const content = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    return {
      path: normalizePath(relativePath),
      hash: crypto.createHash("sha256").update(content).digest("hex"),
      size: stats.size,
    };
  } catch {
    return null;
  }
}

function collectCurrentFiles(rootDir: string, relativePaths: string[]): Map<string, ContextManifestFile> {
  const current = new Map<string, ContextManifestFile>();
  for (const relativePath of relativePaths) {
    const fullPath = path.join(rootDir, relativePath);
    const file = toManifestFile(fullPath, relativePath);
    if (file) current.set(file.path, file);
  }
  return current;
}

function getAddedFiles(rootDir: string, manifest: ContextManifest): string[] {
  const known = new Set(manifest.files.map(file => file.path));
  const added = runGit(rootDir, ["ls-files", "--others", "--exclude-standard"]);
  if (!added) return [];

  return added
    .split("\n")
    .map(file => normalizePath(file.trim()))
    .filter(file => file && !known.has(file) && !file.startsWith("ai-context/"));
}

function computeRootHash(files: ContextManifestFile[]): string {
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    hash.update(file.path);
    hash.update(file.hash);
  }
  return hash.digest("hex");
}

function listOutputFiles(outputDir: string): string[] {
  if (!fs.existsSync(outputDir)) return [];
  const outputFiles: string[] = [];

  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        outputFiles.push(normalizePath(path.relative(outputDir, fullPath)));
      }
    }
  }

  walk(outputDir);
  return outputFiles.sort();
}

function ensureManifestListed(outputFiles: string[]): string[] {
  return [...new Set([...outputFiles, CONTEXT_MANIFEST_FILE])].sort();
}

function readGitState(rootDir: string): ContextManifest["git"] {
  const commit = runGit(rootDir, ["rev-parse", "HEAD"]) || null;
  const branch = runGit(rootDir, ["rev-parse", "--abbrev-ref", "HEAD"]) || null;
  const status = runGit(rootDir, ["status", "--porcelain"]);

  return {
    commit,
    branch,
    dirty: Boolean(status),
  };
}

function runGit(rootDir: string, args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
