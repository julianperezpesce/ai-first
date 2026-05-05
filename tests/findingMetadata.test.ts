import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { detectSecurityIssues } from "../src/utils/securityAuditor.js";
import { detectPerformanceIssues } from "../src/utils/performanceAnalyzer.js";
import { detectDeadCode } from "../src/utils/deadCodeDetector.js";

const tempDirs: string[] = [];

function createTempProject(files: Record<string, string>): string {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-first-findings-test-"));
  tempDirs.push(rootDir);
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }
  return rootDir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("finding metadata", () => {
  it("adds confidence and evidence to security issues", () => {
    const rootDir = createTempProject({
      "src/db.ts": "db.query(`SELECT * FROM users WHERE id = ${userId}`);\n",
      "package.json": JSON.stringify({ dependencies: { express: "^4.0.0" } }),
    });

    const issues = detectSecurityIssues(rootDir);
    const sqlIssue = issues.find(issue => issue.type === "sql-injection");

    expect(sqlIssue?.confidence).toBeGreaterThan(0);
    expect(sqlIssue?.evidence.length).toBeGreaterThan(0);
    expect(sqlIssue?.whyFlagged).toContain("interpolation");
  });

  it("calibrates command injection to interpolated shell commands", () => {
    const rootDir = createTempProject({
      "src/commands.ts": [
        "exec('git status');",
        "exec(`git checkout ${branch}`);",
      ].join("\n"),
    });

    const issues = detectSecurityIssues(rootDir).filter(issue => issue.type === "command-injection");

    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("warning");
    expect(issues[0].confidence).toBeLessThan(0.9);
  });

  it("adds confidence and evidence to performance issues", () => {
    const rootDir = createTempProject({
      "src/query.ts": "async function list(db) {\n  return db.query('SELECT * FROM users');\n}\n",
    });

    const issues = detectPerformanceIssues(rootDir);
    const queryIssue = issues.find(issue => issue.type === "unbounded-query");

    expect(queryIssue?.confidence).toBeGreaterThan(0);
    expect(queryIssue?.evidence.length).toBeGreaterThan(0);
    expect(queryIssue?.whyFlagged).toContain("unbounded");
  });

  it("adds low-confidence evidence to dead-code findings", () => {
    const rootDir = createTempProject({
      "src/unused.ts": "export function unusedHelper() { return 1; }\n",
    });

    const result = detectDeadCode(rootDir);
    const item = result.unusedFunctions[0] || result.unusedFiles[0];

    expect(item?.confidence).toBeGreaterThan(0);
    expect(item?.confidence).toBeLessThan(0.7);
    expect(item?.evidence.length).toBeGreaterThan(0);
    expect(item?.whyFlagged).toMatch(/Dynamic|dynamic/);
  });
});
