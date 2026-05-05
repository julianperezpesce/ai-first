import { execFileSync } from "child_process";

export interface ChangeAnalysis {
  since: string;
  range: string;
  filesChanged: number;
  files: string[];
  commits: string[];
}

export function analyzeChanges(rootDir: string, since = "HEAD~5"): ChangeAnalysis {
  const range = `${since}..HEAD`;
  const files = runGit(rootDir, ["diff", "--name-only", range])
    .split("\n")
    .map(file => file.trim())
    .filter(Boolean);
  const commits = runGit(rootDir, ["log", "--oneline", range])
    .split("\n")
    .map(commit => commit.trim())
    .filter(Boolean);

  return {
    since,
    range,
    filesChanged: files.length,
    files,
    commits,
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
