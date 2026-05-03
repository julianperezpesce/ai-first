import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export interface RecentChanges {
  isGitRepo: boolean;
  lastCommit: CommitInfo | null;
  recentCommits: CommitInfo[];
  activeFiles: string[];
  activeAuthors: AuthorStats[];
}

export interface CommitInfo {
  hash: string;
  date: string;
  author: string;
  message: string;
}

export interface AuthorStats {
  name: string;
  commits: number;
  lastActive: string;
}

export function extractRecentChanges(rootDir: string): RecentChanges {
  const result: RecentChanges = {
    isGitRepo: false,
    lastCommit: null,
    recentCommits: [],
    activeFiles: [],
    activeAuthors: [],
  };

  try {
    execSync("git rev-parse --is-inside-work-tree", { cwd: rootDir, stdio: "ignore" });
    result.isGitRepo = true;
  } catch {
    return result;
  }

  try {
    const lastCommitRaw = execSync("git log -1 --format='%H|%aI|%an|%s'", { cwd: rootDir, encoding: "utf-8" }).trim();
    const [hash, date, author, message] = lastCommitRaw.split("|");
    result.lastCommit = { hash, date, author, message };
  } catch {}

  try {
    const recentRaw = execSync("git log --oneline -10 --format='%H|%aI|%an|%s'", { cwd: rootDir, encoding: "utf-8" }).trim();
    result.recentCommits = recentRaw.split("\n").map(line => {
      const [hash, date, author, message] = line.split("|");
      return { hash, date, author, message };
    });
  } catch {}

  try {
    const activeFilesRaw = execSync("git diff --name-only HEAD~5..HEAD 2>/dev/null || git diff --name-only HEAD~3..HEAD 2>/dev/null || echo ''", { cwd: rootDir, encoding: "utf-8" }).trim();
    if (activeFilesRaw) {
      result.activeFiles = activeFilesRaw.split("\n").slice(0, 10);
    }
  } catch {}

  try {
    const authorStatsRaw = execSync("git shortlog -sn --no-merges HEAD~20..HEAD 2>/dev/null || git shortlog -sn --no-merges HEAD~10..HEAD 2>/dev/null || echo ''", { cwd: rootDir, encoding: "utf-8" }).trim();
    if (authorStatsRaw) {
      result.activeAuthors = authorStatsRaw.split("\n").slice(0, 5).map(line => {
        const match = line.trim().match(/(\d+)\s+(.+)/);
        if (match) {
          return { name: match[2], commits: parseInt(match[1]), lastActive: "" };
        }
        return null;
      }).filter(Boolean) as AuthorStats[];
    }
  } catch {}

  return result;
}
