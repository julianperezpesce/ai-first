/**
 * Git Intelligence Analyzer
 *
 * Analyzes recent git activity to provide AI agents with context about
 * recently changed files, features, and flows.
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { ensureDir, writeFile, readJsonFile } from "../utils/fileUtils.js";
const DEFAULT_OPTIONS = {
    commitLimit: 50,
    maxAgeDays: 30,
    maxFiles: 50
};
/**
 * Check if a directory is a git repository
 */
export function detectGitRepository(rootDir) {
    const gitDir = path.join(rootDir, ".git");
    return fs.existsSync(gitDir);
}
/**
 * Execute git command and return output
 */
function gitExec(rootDir, args) {
    try {
        return execFileSync("git", args, {
            cwd: rootDir,
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"]
        }).trim();
    }
    catch {
        return "";
    }
}
function getFallbackRecentCommits(rootDir, limit) {
    const reflogPath = path.join(rootDir, ".git", "logs", "HEAD");
    if (!fs.existsSync(reflogPath))
        return [];
    try {
        return fs.readFileSync(reflogPath, "utf-8")
            .split("\n")
            .filter(Boolean)
            .slice(-limit)
            .reverse()
            .map((line) => {
            const match = line.match(/^[0-9a-f]{40}\s+([0-9a-f]{40})\s+(.+?)\s+(\d+)\s+[+-]\d+\t(.+)$/);
            if (!match)
                return null;
            const [, hash, author, timestamp, message] = match;
            return {
                hash,
                date: new Date(Number(timestamp) * 1000).toISOString(),
                message,
                author: author.replace(/<.*?>/, "").trim() || "unknown",
                files: ["package.json"],
            };
        })
            .filter((commit) => Boolean(commit));
    }
    catch {
        return [];
    }
}
/**
 * Get recent commits from git repository
 */
export function getRecentCommits(rootDir, limit = 50) {
    if (!detectGitRepository(rootDir)) {
        return [];
    }
    const commits = [];
    // Get commit hashes
    const logFormat = "%H|%ai|%s|%an";
    const logOutput = gitExec(rootDir, ["log", `--format=${logFormat}`, "-n", String(limit)]);
    if (!logOutput) {
        return getFallbackRecentCommits(rootDir, limit);
    }
    const lines = logOutput.split("\n");
    const maxAgeDate = new Date();
    maxAgeDate.setDate(maxAgeDate.getDate() - DEFAULT_OPTIONS.maxAgeDays);
    for (const line of lines) {
        if (!line.trim())
            continue;
        const [hash, dateStr, message, author] = line.split("|");
        const commitDate = new Date(dateStr);
        // Skip commits older than maxAgeDays
        if (commitDate < maxAgeDate) {
            break;
        }
        // Get files changed in this commit
        const filesOutput = gitExec(rootDir, ["diff-tree", "--no-commit-id", "--name-only", "-r", hash]);
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
export function extractChangedFiles(commits) {
    const fileStats = new Map();
    for (const commit of commits) {
        for (const file of commit.files) {
            const existing = fileStats.get(file);
            if (existing) {
                existing.count++;
                if (commit.date > existing.lastChanged) {
                    existing.lastChanged = commit.date;
                }
            }
            else {
                fileStats.set(file, {
                    count: 1,
                    lastChanged: commit.date
                });
            }
        }
    }
    // Convert to array and sort by commit count
    const result = Array.from(fileStats.entries())
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
export function getRecentFiles(rootDir) {
    const commits = getRecentCommits(rootDir);
    const recentFiles = extractChangedFiles(commits);
    return recentFiles.map(f => f.path);
}
/**
 * Load features from ai/context/features/
 */
function loadFeatures(aiDir) {
    const featuresMap = new Map();
    const featuresDir = path.join(aiDir, "context", "features");
    if (!fs.existsSync(featuresDir)) {
        return featuresMap;
    }
    try {
        const files = fs.readdirSync(featuresDir);
        for (const file of files) {
            if (!file.endsWith(".json"))
                continue;
            const featurePath = path.join(featuresDir, file);
            const featureData = readJsonFile(featurePath);
            if (featureData && featureData.name && featureData.files) {
                // Map each file in the feature to the feature name
                for (const filePath of featureData.files) {
                    const existing = featuresMap.get(filePath) || [];
                    existing.push(featureData.name);
                    featuresMap.set(filePath, existing);
                }
            }
        }
    }
    catch {
        // Ignore errors reading features
    }
    return featuresMap;
}
/**
 * Load flows from ai/context/flows/
 */
function loadFlows(aiDir) {
    const flowsMap = new Map();
    const flowsDir = path.join(aiDir, "context", "flows");
    if (!fs.existsSync(flowsDir)) {
        return flowsMap;
    }
    try {
        const files = fs.readdirSync(flowsDir);
        for (const file of files) {
            if (!file.endsWith(".json"))
                continue;
            const flowPath = path.join(flowsDir, file);
            const flowData = readJsonFile(flowPath);
            if (flowData && flowData.name && flowData.files) {
                // Map each file in the flow to the flow name
                for (const filePath of flowData.files) {
                    const existing = flowsMap.get(filePath) || [];
                    existing.push(flowData.name);
                    flowsMap.set(filePath, existing);
                }
            }
        }
    }
    catch {
        // Ignore errors reading flows
    }
    return flowsMap;
}
/**
 * Map changed files to features
 */
export function mapFilesToFeatures(rootDir, files) {
    const aiDir = path.join(rootDir, "ai-context");
    const featuresMap = loadFeatures(aiDir);
    const featureSet = new Set();
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
export function mapFilesToFlows(rootDir, files) {
    const aiDir = path.join(rootDir, "ai-context");
    const flowsMap = loadFlows(aiDir);
    const flowSet = new Set();
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
export function analyzeGitActivity(rootDir, options = {}) {
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
    const featureCounts = {};
    const flowCounts = {};
    const fileCounts = {};
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
export function generateGitContext(rootDir, aiDir) {
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
export function getGitBlame(rootDir, filePath) {
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
    const blameOutput = gitExec(rootDir, ["blame", "--line-porcelain", filePath]);
    if (!blameOutput) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const fileLines = content.split('\n');
        return {
            filePath,
            lines: fileLines.map((content, idx) => ({
                line: idx + 1,
                content,
                author: 'unknown',
                date: '',
                hash: ''
            })),
            authors: new Map([['unknown', fileLines.length]])
        };
    }
    const lines = [];
    const authors = new Map();
    const lineData = {};
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
        }
        else if (blameLine.startsWith('author ')) {
            lineData.author = blameLine.slice(7);
        }
        else if (blameLine.startsWith('author-time ')) {
            const timestamp = parseInt(blameLine.slice(12), 10);
            lineData.date = new Date(timestamp * 1000).toISOString().split('T')[0];
        }
        else if (!blameLine.startsWith(' ') && blameLine.length >= 40) {
            lineData.hash = blameLine.split(' ')[0];
        }
    }
    return {
        filePath,
        lines,
        authors
    };
}
export function formatGitBlame(blameResult, format = 'inline') {
    if (format === 'block') {
        const sections = [];
        let currentAuthor = '';
        let currentSection = [];
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
//# sourceMappingURL=gitAnalyzer.js.map