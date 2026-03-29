/**
 * Git Intelligence Analyzer
 * 
 * Analyzes recent git activity to provide AI agents with context about
 * recently changed files, features, and flows.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { ensureDir, writeFile, readJsonFile } from "../utils/fileUtils.js";

export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author: string;
  files: string[];
}

export interface RecentFile {
  path: string;
  commitCount: number;
  lastChanged: string;
}

export interface GitActivity {
  totalCommits: number;
  dateRange: {
    start: string;
    end: string;
  };
  files: Record<string, number>;
  features: Record<string, number>;
  flows: Record<string, number>;
}

export interface GitAnalyzerOptions {
  /** Number of commits to analyze (default: 50) */
  commitLimit?: number;
  /** Ignore commits older than N days (default: 30) */
  maxAgeDays?: number;
  /** Maximum number of files to track (default: 50) */
  maxFiles?: number;
}

const DEFAULT_OPTIONS: Required<GitAnalyzerOptions> = {
  commitLimit: 50,
  maxAgeDays: 30,
  maxFiles: 50
};

/**
 * Check if a directory is a git repository
 */
export function detectGitRepository(rootDir: string): boolean {
  const gitDir = path.join(rootDir, ".git");
  return fs.existsSync(gitDir);
}

/**
 * Execute git command and return output
 */
function gitExec(rootDir: string, command: string): string {
  try {
    return execSync(command, {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"]
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Get recent commits from git repository
 */
export function getRecentCommits(rootDir: string, limit: number = 50): GitCommit[] {
  if (!detectGitRepository(rootDir)) {
    return [];
  }

  const commits: GitCommit[] = [];
  
  // Get commit hashes
  const logFormat = "%H|%ai|%s|%an";
  const logOutput = gitExec(rootDir, `git log --format="${logFormat}" -n ${limit}`);
  
  if (!logOutput) {
    return [];
  }

  const lines = logOutput.split("\n");
  const maxAgeDate = new Date();
  maxAgeDate.setDate(maxAgeDate.getDate() - DEFAULT_OPTIONS.maxAgeDays);

  for (const line of lines) {
    if (!line.trim()) continue;
    
    const [hash, dateStr, message, author] = line.split("|");
    const commitDate = new Date(dateStr);
    
    // Skip commits older than maxAgeDays
    if (commitDate < maxAgeDate) {
      break;
    }

    // Get files changed in this commit
    const filesOutput = gitExec(rootDir, `git diff-tree --no-commit-id --name-only -r ${hash}`);
    const files = filesOutput ? filesOutput.split("\n").filter(f => f.trim()) : [];

    commits.push({
      hash,
      date: dateStr,
      message,
      author,
      files
    });
  }

  return commits;
}

/**
 * Extract changed files from commits
 */
export function extractChangedFiles(commits: GitCommit[]): RecentFile[] {
  const fileStats: Map<string, { count: number; lastChanged: string }> = new Map();

  for (const commit of commits) {
    for (const file of commit.files) {
      const existing = fileStats.get(file);
      if (existing) {
        existing.count++;
        if (commit.date > existing.lastChanged) {
          existing.lastChanged = commit.date;
        }
      } else {
        fileStats.set(file, {
          count: 1,
          lastChanged: commit.date
        });
      }
    }
  }

  // Convert to array and sort by commit count
  const result: RecentFile[] = Array.from(fileStats.entries())
    .map(([path, stats]) => ({
      path,
      commitCount: stats.count,
      lastChanged: stats.lastChanged
    }))
    .sort((a, b) => b.commitCount - a.commitCount);

  return result.slice(0, DEFAULT_OPTIONS.maxFiles);
}

/**
 * Get list of changed files
 */
export function getRecentFiles(rootDir: string): string[] {
  const commits = getRecentCommits(rootDir);
  const recentFiles = extractChangedFiles(commits);
  return recentFiles.map(f => f.path);
}

/**
 * Load features from ai/context/features/
 */
function loadFeatures(aiDir: string): Map<string, string[]> {
  const featuresMap = new Map<string, string[]>();
  const featuresDir = path.join(aiDir, "context", "features");
  
  if (!fs.existsSync(featuresDir)) {
    return featuresMap;
  }

  try {
    const files = fs.readdirSync(featuresDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      
      const featurePath = path.join(featuresDir, file);
      const featureData = readJsonFile(featurePath) as { name: string; files: string[] };
      
      if (featureData && featureData.name && featureData.files) {
        // Map each file in the feature to the feature name
        for (const filePath of featureData.files) {
          const existing = featuresMap.get(filePath) || [];
          existing.push(featureData.name);
          featuresMap.set(filePath, existing);
        }
      }
    }
  } catch {
    // Ignore errors reading features
  }

  return featuresMap;
}

/**
 * Load flows from ai/context/flows/
 */
function loadFlows(aiDir: string): Map<string, string[]> {
  const flowsMap = new Map<string, string[]>();
  const flowsDir = path.join(aiDir, "context", "flows");
  
  if (!fs.existsSync(flowsDir)) {
    return flowsMap;
  }

  try {
    const files = fs.readdirSync(flowsDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      
      const flowPath = path.join(flowsDir, file);
      const flowData = readJsonFile(flowPath) as { name: string; files: string[] };
      
      if (flowData && flowData.name && flowData.files) {
        // Map each file in the flow to the flow name
        for (const filePath of flowData.files) {
          const existing = flowsMap.get(filePath) || [];
          existing.push(flowData.name);
          flowsMap.set(filePath, existing);
        }
      }
    }
  } catch {
    // Ignore errors reading flows
  }

  return flowsMap;
}

/**
 * Map changed files to features
 */
export function mapFilesToFeatures(rootDir: string, files: string[]): string[] {
  const aiDir = path.join(rootDir, "ai-context");
  const featuresMap = loadFeatures(aiDir);
  
  const featureSet = new Set<string>();
  
  for (const file of files) {
    // Try exact match first
    const directMatch = featuresMap.get(file);
    if (directMatch) {
      directMatch.forEach(f => featureSet.add(f));
    }
    
    // Try partial match (file is inside feature directory)
    for (const [featureFile, featureNames] of featuresMap) {
      if (file.startsWith(featureFile) || featureFile.startsWith(file)) {
        featureNames.forEach(f => featureSet.add(f));
      }
    }
  }

  return Array.from(featureSet);
}

/**
 * Map changed files to flows
 */
export function mapFilesToFlows(rootDir: string, files: string[]): string[] {
  const aiDir = path.join(rootDir, "ai-context");
  const flowsMap = loadFlows(aiDir);
  
  const flowSet = new Set<string>();
  
  for (const file of files) {
    // Try exact match first
    const directMatch = flowsMap.get(file);
    if (directMatch) {
      directMatch.forEach(f => flowSet.add(f));
    }
    
    // Try partial match (file is inside flow)
    for (const [flowFile, flowNames] of flowsMap) {
      if (file.startsWith(flowFile) || flowFile.startsWith(file)) {
        flowNames.forEach(f => flowSet.add(f));
      }
    }
  }

  return Array.from(flowSet);
}

/**
 * Analyze git activity
 */
export function analyzeGitActivity(rootDir: string, options: GitAnalyzerOptions = {}): GitActivity | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!detectGitRepository(rootDir)) {
    return null;
  }

  const commits = getRecentCommits(rootDir, opts.commitLimit);
  
  if (commits.length === 0) {
    return null;
  }

  const recentFiles = extractChangedFiles(commits);
  const recentFilePaths = recentFiles.map(f => f.path);
  
  const features = mapFilesToFeatures(rootDir, recentFilePaths);
  const flows = mapFilesToFlows(rootDir, recentFilePaths);

  // Calculate feature/flow commit counts
  const featureCounts: Record<string, number> = {};
  const flowCounts: Record<string, number> = {};
  const fileCounts: Record<string, number> = {};

  for (const commit of commits) {
    const commitFeatures = mapFilesToFeatures(rootDir, commit.files);
    for (const feature of commitFeatures) {
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
    }
    
    const commitFlows = mapFilesToFlows(rootDir, commit.files);
    for (const flow of commitFlows) {
      flowCounts[flow] = (flowCounts[flow] || 0) + 1;
    }
    
    for (const file of commit.files) {
      fileCounts[file] = (fileCounts[file] || 0) + 1;
    }
  }

  return {
    totalCommits: commits.length,
    dateRange: {
      start: commits[commits.length - 1]?.date || "",
      end: commits[0]?.date || ""
    },
    files: fileCounts,
    features: featureCounts,
    flows: flowCounts
  };
}

/**
 * Generate git context files
 */
export function generateGitContext(rootDir: string, aiDir?: string): {
  recentFiles: string[];
  recentFeatures: string[];
  recentFlows: string[];
  activity: GitActivity | null;
} {
  const targetAiDir = aiDir || path.join(rootDir, "ai-context");
  const gitDir = path.join(targetAiDir, "git");
  
  ensureDir(gitDir);

  const commits = getRecentCommits(rootDir);
  const recentFiles = extractChangedFiles(commits);
  const recentFilePaths = recentFiles.map(f => f.path);
  
  const recentFeatures = mapFilesToFeatures(rootDir, recentFilePaths);
  const recentFlows = mapFilesToFlows(rootDir, recentFilePaths);
  const activity = analyzeGitActivity(rootDir);

  // Write output files
  const recentFilesJson = JSON.stringify(recentFilePaths, null, 2);
  writeFile(path.join(gitDir, "recent-files.json"), recentFilesJson);
  
  const recentFeaturesJson = JSON.stringify(recentFeatures, null, 2);
  writeFile(path.join(gitDir, "recent-features.json"), recentFeaturesJson);
  
  const recentFlowsJson = JSON.stringify(recentFlows, null, 2);
  writeFile(path.join(gitDir, "recent-flows.json"), recentFlowsJson);
  
  if (activity) {
    const activityJson = JSON.stringify(activity, null, 2);
    writeFile(path.join(gitDir, "commit-activity.json"), activityJson);
  }

  return {
    recentFiles: recentFilePaths,
    recentFeatures,
    recentFlows,
    activity
  };
}

export interface GitBlameLine {
  line: number;
  content: string;
  author: string;
  date: string;
  hash: string;
}

export interface GitBlameResult {
  filePath: string;
  lines: GitBlameLine[];
  authors: Map<string, number>;
}

export function getGitBlame(rootDir: string, filePath: string): GitBlameResult {
  const fullPath = path.join(rootDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    return {
      filePath,
      lines: [],
      authors: new Map()
    };
  }

  if (!detectGitRepository(rootDir)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    return {
      filePath,
      lines: lines.map((content, idx) => ({
        line: idx + 1,
        content,
        author: 'unknown',
        date: '',
        hash: ''
      })),
      authors: new Map([['unknown', lines.length]])
    };
  }

  const blameOutput = gitExec(rootDir, `git blame --line-porcelain "${filePath}"`);
  
  if (!blameOutput) {
    return {
      filePath,
      lines: [],
      authors: new Map()
    };
  }

  const lines: GitBlameLine[] = [];
  const authors = new Map<string, number>();
  const lineData: { hash?: string; author?: string; date?: string; content?: string } = {};
  let lineNumber = 0;

  const blameLines = blameOutput.split('\n');
  
  for (const blameLine of blameLines) {
    if (blameLine.startsWith('\t')) {
      lineData.content = blameLine.slice(1);
      lineNumber++;
      
      const author = lineData.author || 'unknown';
      const date = lineData.date || '';
      const hash = lineData.hash || '';
      
      lines.push({
        line: lineNumber,
        content: lineData.content,
        author,
        date,
        hash
      });
      
      authors.set(author, (authors.get(author) || 0) + 1);
      
      lineData.hash = undefined;
      lineData.author = undefined;
      lineData.date = undefined;
      lineData.content = undefined;
    } else if (blameLine.startsWith('author ')) {
      lineData.author = blameLine.slice(7);
    } else if (blameLine.startsWith('author-time ')) {
      const timestamp = parseInt(blameLine.slice(12), 10);
      lineData.date = new Date(timestamp * 1000).toISOString().split('T')[0];
    } else if (!blameLine.startsWith(' ') && blameLine.length >= 40) {
      lineData.hash = blameLine.split(' ')[0];
    }
  }

  return {
    filePath,
    lines,
    authors
  };
}

export function formatGitBlame(
  blameResult: GitBlameResult,
  format: 'inline' | 'block' = 'inline'
): string {
  if (format === 'block') {
    const sections: string[] = [];
    let currentAuthor = '';
    let currentSection: string[] = [];
    
    for (const line of blameResult.lines) {
      if (line.author !== currentAuthor) {
        if (currentSection.length > 0) {
          sections.push(`// ${currentAuthor}\n${currentSection.join('\n')}`);
        }
        currentAuthor = line.author;
        currentSection = [];
      }
      currentSection.push(line.content);
    }
    
    if (currentSection.length > 0) {
      sections.push(`// ${currentAuthor}\n${currentSection.join('\n')}`);
    }
    
    return sections.join('\n\n');
  }
  
  return blameResult.lines
    .map(line => `[${line.author} ${line.date}] ${line.content}`)
    .join('\n');
}
