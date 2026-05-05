import fs from "fs";
import path from "path";
import { confidence } from "./findingMetadata.js";

export interface TestMapping {
  sourceFile: string;
  testFiles: string[];
  confidence?: number;
  reason?: string;
  evidence?: string[];
}

export function mapTestFiles(rootDir: string): TestMapping[] {
  const mappings: TestMapping[] = [];
  const sourceFiles = findSourceFiles(rootDir);
  const testFiles = findTestFiles(rootDir);

  for (const sourceFile of sourceFiles) {
    const relativeSource = path.relative(rootDir, sourceFile);
    const relatedTests = findRelatedTests(relativeSource, testFiles, rootDir);

    if (relatedTests.length > 0) {
      mappings.push({
        sourceFile: relativeSource,
        testFiles: relatedTests.map(test => test.testFile),
        confidence: confidence(Math.max(...relatedTests.map(test => test.confidence))),
        reason: Array.from(new Set(relatedTests.map(test => test.reason))).join("; "),
        evidence: relatedTests.map(test => `${relativeSource} -> ${test.testFile}: ${test.reason}`),
      });
    }
  }

  return mappings;
}

function findSourceFiles(rootDir: string): string[] {
  const files: string[] = [];
  const extensions = [".ts", ".js", ".py", ".go", ".rs", ".java", ".rb", ".php"];
  const excludeDirs = ["node_modules", ".git", "dist", "build", "__pycache__", "vendor", "test", "tests", "__tests__", "spec"];

  function walk(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
          walk(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext)) && !isTestFile(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch {}
  }

  walk(rootDir);
  return files;
}

function findTestFiles(rootDir: string): string[] {
  const files: string[] = [];
  const testPatterns = [
    ".test.ts", ".test.js", ".spec.ts", ".spec.js",
    "_test.go", "_test.py", "_test.rb",
    "test_", "Test.java", "Spec.java",
  ];
  const testDirs = ["test", "tests", "__tests__", "spec"];

  function walk(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (testDirs.includes(entry.name) || dir.split(path.sep).some(p => testDirs.includes(p))) {
            walk(fullPath);
          } else if (!["node_modules", ".git", "dist", "build", "__pycache__", "vendor"].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && isTestFile(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch {}
  }

  walk(rootDir);
  return files;
}

function isTestFile(filename: string): boolean {
  const testPatterns = [
    ".test.ts", ".test.js", ".spec.ts", ".spec.js",
    "_test.go", "_test.py", "_test.rb",
    "test_", "Test.java", "Spec.java",
  ];
  return testPatterns.some(pattern => filename.includes(pattern));
}

interface RelatedTest {
  testFile: string;
  confidence: number;
  reason: string;
}

function findRelatedTests(sourceFile: string, testFiles: string[], rootDir: string): RelatedTest[] {
  const related: RelatedTest[] = [];
  const sourceBase = path.basename(sourceFile).replace(/\.(ts|js|py|go|rs|java|rb|php)$/, "");
  const sourceDir = path.dirname(sourceFile);

  for (const testFile of testFiles) {
    const relativeTest = path.relative(rootDir, testFile);
    const testBase = path.basename(testFile).replace(/\.(test|spec)\.(ts|js)$/, "").replace(/_test\.(go|py|rb)$/, "").replace(/Test\.java$/, "").replace(/Spec\.java$/, "");

    if (testBase === sourceBase) {
      related.push({
        testFile: relativeTest,
        confidence: 0.92,
        reason: "test basename matches source basename",
      });
      continue;
    }

    const testDir = path.dirname(relativeTest);
    if (testDir.includes(sourceDir) || sourceDir.includes(testDir)) {
      if (testBase.includes(sourceBase) || sourceBase.includes(testBase)) {
        related.push({
          testFile: relativeTest,
          confidence: 0.68,
          reason: "test path and basename are similar to source path",
        });
      }
    }
  }

  return related;
}
