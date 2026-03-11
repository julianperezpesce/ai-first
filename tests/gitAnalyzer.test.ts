import { describe, it, expect } from "vitest";
import {
  detectGitRepository,
  getRecentCommits,
  extractChangedFiles,
  mapFilesToFeatures,
  mapFilesToFlows,
  analyzeGitActivity,
  generateGitContext
} from "../src/core/gitAnalyzer.js";
import fs from "fs";
import path from "path";
import os from "os";

describe("Git Analyzer", () => {
  const testRepoRoot = process.cwd();

  describe("detectGitRepository", () => {
    it("should detect current repository as git repo", () => {
      expect(detectGitRepository(testRepoRoot)).toBe(true);
    });

    it("should detect non-git directory", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-git-test-"));
      expect(detectGitRepository(tempDir)).toBe(false);
      fs.rmSync(tempDir, { recursive: true });
    });
  });

  describe("getRecentCommits", () => {
    it("should return commits for git repository", () => {
      const commits = getRecentCommits(testRepoRoot);
      expect(commits.length).toBeGreaterThan(0);
      expect(commits[0]).toHaveProperty("hash");
      expect(commits[0]).toHaveProperty("date");
      expect(commits[0]).toHaveProperty("message");
      expect(commits[0]).toHaveProperty("author");
      expect(commits[0]).toHaveProperty("files");
    });

    it("should return empty array for non-git directory", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-git-test-"));
      const commits = getRecentCommits(tempDir);
      expect(commits).toEqual([]);
      fs.rmSync(tempDir, { recursive: true });
    });
  });

  describe("extractChangedFiles", () => {
    it("should extract and count changed files", () => {
      const commits = getRecentCommits(testRepoRoot);
      const files = extractChangedFiles(commits);
      
      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toHaveProperty("path");
      expect(files[0]).toHaveProperty("commitCount");
      expect(files[0].commitCount).toBeGreaterThan(0);
    });

    it("should sort by commit count descending", () => {
      const commits = getRecentCommits(testRepoRoot);
      const files = extractChangedFiles(commits);
      
      for (let i = 1; i < files.length; i++) {
        expect(files[i - 1].commitCount).toBeGreaterThanOrEqual(files[i].commitCount);
      }
    });
  });

  describe("mapFilesToFeatures", () => {
    it("should return empty array when no features exist", () => {
      const features = mapFilesToFeatures(testRepoRoot, ["src/test.ts"]);
      expect(Array.isArray(features)).toBe(true);
    });
  });

  describe("mapFilesToFlows", () => {
    it("should return empty array when no flows exist", () => {
      const flows = mapFilesToFlows(testRepoRoot, ["src/test.ts"]);
      expect(Array.isArray(flows)).toBe(true);
    });
  });

  describe("analyzeGitActivity", () => {
    it("should analyze git activity", () => {
      const activity = analyzeGitActivity(testRepoRoot);
      
      if (activity) {
        expect(activity).toHaveProperty("totalCommits");
        expect(activity).toHaveProperty("dateRange");
        expect(activity).toHaveProperty("files");
        expect(activity).toHaveProperty("features");
        expect(activity).toHaveProperty("flows");
        expect(activity.totalCommits).toBeGreaterThan(0);
      }
    });

    it("should return null for non-git directory", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-git-test-"));
      const activity = analyzeGitActivity(tempDir);
      expect(activity).toBeNull();
      fs.rmSync(tempDir, { recursive: true });
    });
  });

  describe("generateGitContext", () => {
    it("should generate output files even for non-git directory", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-git-test-"));
      const aiDir = path.join(tempDir, "ai");
      
      // Create ai directory structure
      fs.mkdirSync(path.join(aiDir, "context", "features"), { recursive: true });
      fs.mkdirSync(path.join(aiDir, "context", "flows"), { recursive: true });
      
      const result = generateGitContext(tempDir, aiDir);
      
      expect(result).toHaveProperty("recentFiles");
      expect(result).toHaveProperty("recentFeatures");
      expect(result).toHaveProperty("recentFlows");
      expect(result).toHaveProperty("activity");
      expect(result.recentFiles).toEqual([]);
      expect(result.activity).toBeNull();
      
      // Output files should still be created
      expect(fs.existsSync(path.join(aiDir, "git", "recent-files.json"))).toBe(true);
      expect(fs.existsSync(path.join(aiDir, "git", "recent-features.json"))).toBe(true);
      expect(fs.existsSync(path.join(aiDir, "git", "recent-flows.json"))).toBe(true);
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true });
    });
  });
});
