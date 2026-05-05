import fs from "fs";
import path from "path";
import { analyzeArchitecture } from "../../analyzers/architecture.js";
import { semanticSearch, type CodeSnippet } from "../../utils/semanticSearch.js";
import { mapTestFiles } from "../../utils/testFileMapper.js";
import { confidence } from "../../utils/findingMetadata.js";
import { scanRepo } from "../repoScanner.js";
import { analyzeChanges } from "./gitService.js";
import { isContextFresh } from "./doctorService.js";
import { getContextForTask, type TaskRelevantFile } from "./taskContextService.js";

export interface UnderstandFile {
  path: string;
  reason: string;
  confidence: number;
  evidence: string[];
  relatedTests: string[];
}

export interface UnderstandSnippet {
  file: string;
  line: number;
  symbol: string;
  score: number;
  code: string;
}

export interface UnderstandResult {
  topic: string;
  summary: string;
  contextFresh: {
    fresh: boolean;
    reason: string;
  };
  architecture: {
    pattern: string;
    modules: Array<{
      path: string;
      responsibility: string;
    }>;
  };
  files: UnderstandFile[];
  snippets: UnderstandSnippet[];
  tests: UnderstandFile[];
  commands: Array<{
    command: string;
    reason: string;
  }>;
  risks: string[];
  evidence: string[];
}

export function understandTopic(rootDir: string, topic: string): UnderstandResult {
  const search = semanticSearch(rootDir, topic, 10);
  const taskContext = getContextForTask(rootDir, topic);
  const scan = scanRepo(rootDir);
  const architecture = analyzeArchitecture(scan.files, rootDir);
  const testMappings = mapTestFiles(rootDir);
  const freshness = isContextFresh(rootDir);
  const changes = analyzeChanges(rootDir, "HEAD~5");

  const fileMap = new Map<string, UnderstandFile>();
  const addFile = (filePath: string, reason: string, score: number, evidence: string[]) => {
    if (!filePath || filePath.startsWith("dist/") || filePath.startsWith("build/")) return;
    const tests = relatedTestsFor(filePath, testMappings);
    const entry: UnderstandFile = {
      path: filePath,
      reason,
      confidence: confidence(score),
      evidence,
      relatedTests: tests,
    };
    const existing = fileMap.get(filePath);
    if (!existing || entry.confidence > existing.confidence) {
      fileMap.set(filePath, entry);
    } else if (existing) {
      existing.evidence = [...new Set([...existing.evidence, ...evidence])].slice(0, 6);
      existing.relatedTests = [...new Set([...existing.relatedTests, ...tests])].slice(0, 6);
    }
  };

  for (const result of search.results) {
    addFile(result.file, "matched topic in code search", normalizeSearchScore(result.score), [
      `semanticSearch score ${result.score}`,
      `match near ${result.file}:${result.line}`,
    ]);
  }

  for (const file of taskContext.relevantFiles) {
    addFile(file.path, file.reason, file.confidence, file.evidence);
  }

  for (const filePath of changes.files.slice(0, 8)) {
    addFile(filePath, "recently changed file may affect current understanding", 0.5, [
      `git ${changes.range}`,
      `changed ${filePath}`,
    ]);
  }

  const files = Array.from(fileMap.values())
    .sort((a, b) => b.confidence - a.confidence || a.path.localeCompare(b.path))
    .slice(0, 12);

  const tests = collectTests(files, taskContext.relatedTests);
  const snippets = search.results.slice(0, 6).map(toUnderstandSnippet);
  const modules = architecture.modules
    .filter(module => files.some(file => file.path === module.path || file.path.startsWith(`${module.path}/`)))
    .slice(0, 8)
    .map(module => ({
      path: module.path,
      responsibility: module.responsibility || "Repository module",
    }));

  return {
    topic,
    summary: summarize(topic, files, snippets, freshness.fresh),
    contextFresh: {
      fresh: freshness.fresh,
      reason: freshness.reason,
    },
    architecture: {
      pattern: architecture.pattern,
      modules,
    },
    files,
    snippets,
    tests,
    commands: taskContext.commands,
    risks: [
      ...taskContext.risks,
      ...(freshness.fresh ? [] : ["Generated ai-context is stale or missing; verify important claims against source."]),
    ],
    evidence: [
      `semantic search returned ${search.results.length} snippets from ${search.totalFiles} files`,
      `task context classified topic as ${taskContext.kind}`,
      `${testMappings.length} source-to-test mappings available`,
      `context freshness: ${freshness.fresh ? "fresh" : "not fresh"}`,
      `git range inspected: ${changes.range}`,
    ],
  };
}

function toUnderstandSnippet(snippet: CodeSnippet): UnderstandSnippet {
  return {
    file: snippet.file,
    line: snippet.line,
    symbol: snippet.function || path.basename(snippet.file),
    score: snippet.score,
    code: snippet.code.slice(0, 900),
  };
}

function normalizeSearchScore(score: number): number {
  return Math.min(0.95, 0.45 + score / 20);
}

function relatedTestsFor(filePath: string, mappings: ReturnType<typeof mapTestFiles>): string[] {
  return mappings.find(mapping => mapping.sourceFile === filePath)?.testFiles?.slice(0, 6) || [];
}

function collectTests(files: UnderstandFile[], taskTests: TaskRelevantFile[]): UnderstandFile[] {
  const tests = new Map<string, UnderstandFile>();

  for (const file of files) {
    for (const testPath of file.relatedTests) {
      tests.set(testPath, {
        path: testPath,
        reason: `tests or validates ${file.path}`,
        confidence: Math.min(file.confidence, 0.86),
        evidence: [`${file.path} -> ${testPath}`, ...file.evidence].slice(0, 5),
        relatedTests: [],
      });
    }
  }

  for (const test of taskTests) {
    tests.set(test.path, {
      path: test.path,
      reason: test.reason,
      confidence: test.confidence,
      evidence: test.evidence,
      relatedTests: [],
    });
  }

  return Array.from(tests.values())
    .sort((a, b) => b.confidence - a.confidence || a.path.localeCompare(b.path))
    .slice(0, 10);
}

function summarize(topic: string, files: UnderstandFile[], snippets: UnderstandSnippet[], fresh: boolean): string {
  const strongest = files[0]?.path || snippets[0]?.file || "the repository";
  const freshness = fresh ? "Generated context is fresh." : "Generated context is stale or missing.";
  return `Understanding "${topic}" starts with ${strongest}. ${files.length} files and ${snippets.length} snippets were selected from source evidence. ${freshness}`;
}
