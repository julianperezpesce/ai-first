import { FileInfo } from "../core/repoScanner.js";
import { readJsonFile, readFile } from "../utils/fileUtils.js";
import path from "path";

export interface Conventions {
  naming: NamingConventions;
  structure: StructureConventions;
  testing: TestingConventions;
  git: GitConventions;
  codeStyle: CodeStyleConventions;
  description: string;
}

export interface NamingConventions {
  files: string;
  functions: string;
  classes: string;
  variables: string;
  constants: string;
  components: string;
  tests: string;
  directories: string;
}

export interface StructureConventions {
  srcDirectory: string;
  testDirectory: string;
  configDirectory: string;
  sharedDirectory: string;
}

export interface TestingConventions {
  framework: string;
  testFilePattern: string;
  mockPattern: string;
  setupPattern: string;
}

export interface GitConventions {
  branchStrategy: string;
  commitMessageFormat: string;
  prTitleFormat: string;
}

export interface CodeStyleConventions {
  indentation: string;
  quoteStyle: string;
  semicolons: boolean;
  trailingComma: string;
  maxLineLength: number | null;
}

export function detectConventions(files: FileInfo[], rootDir: string): Conventions {
  const fileNames = files.map(f => f.name);
  const naming = detectNamingConventions(files);
  const structure = detectStructureConventions(files);
  const testing = detectTestingConventions(files, new Set(fileNames));
  const git = detectGitConventions(rootDir);
  const codeStyle = detectCodeStyle(files, rootDir);
  const description = generateConventionsDescription(naming, structure, testing, git, codeStyle);
  return { naming, structure, testing, git, codeStyle, description };
}

function detectNamingConventions(files: FileInfo[]): NamingConventions {
  const conv: NamingConventions = { files: "unknown", functions: "unknown", classes: "unknown", variables: "unknown", constants: "unknown", components: "unknown", tests: "unknown", directories: "unknown" };
  const names = files.map(f => f.name);
  if (names.some(n => /^[a-z][a-z0-9]*(\.[a-z]+)?$/.test(n) && !n.includes("-"))) conv.files = "camelCase";
  if (names.some(n => n.includes("-") || n.includes("_"))) conv.files = "kebab-case or snake_case";
  if (names.some(n => /^[A-Z][a-zA-Z0-9]*(\.[a-z]+)?$/.test(n))) conv.files = "PascalCase";
  if (names.some(n => n.endsWith(".test.ts") || n.endsWith(".test.js"))) conv.tests = "*.test.{ts,js}";
  else if (names.some(n => n.endsWith(".spec.ts") || n.endsWith(".spec.js"))) conv.tests = "*.spec.{ts,js}";
  const dirs = new Set(files.map(f => f.relativePath.split("/")[0]).filter(Boolean));
  if (dirs.has("src")) conv.directories = "src/";
  return conv;
}

function detectStructureConventions(files: FileInfo[]): StructureConventions {
  const str: StructureConventions = { srcDirectory: "unknown", testDirectory: "unknown", configDirectory: "unknown", sharedDirectory: "unknown" };
  const dirs = new Set(files.map(f => f.relativePath.split("/")[0]).filter(Boolean));
  if (dirs.has("src")) str.srcDirectory = "src/";
  else if (dirs.has("lib")) str.srcDirectory = "lib/";
  if (dirs.has("test") || dirs.has("tests")) str.testDirectory = "test/";
  if (dirs.has("config") || dirs.has(".config")) str.configDirectory = "config/";
  if (dirs.has("shared") || dirs.has("utils") || dirs.has("lib")) str.sharedDirectory = "shared/";
  return str;
}

function detectTestingConventions(files: FileInfo[], fileNames: Set<string>): TestingConventions {
  const test: TestingConventions = { framework: "unknown", testFilePattern: "unknown", mockPattern: "unknown", setupPattern: "unknown" };
  const patterns: Record<string, { framework: string; test: string; mock: string; setup: string }> = {
    "jest.config": { framework: "Jest", test: "*.test.ts", mock: "__mocks__", setup: "setup.ts" },
    "vitest.config": { framework: "Vitest", test: "*.test.ts", mock: "__mocks__", setup: "setup.ts" },
    "pytest.ini": { framework: "pytest", test: "test_*.py", mock: "conftest.py", setup: "conftest.py" },
  };
  for (const [file, config] of Object.entries(patterns)) {
    if (fileNames.has(file)) { Object.assign(test, config); break; }
  }
  return test;
}

function detectGitConventions(rootDir: string): GitConventions {
  const git: GitConventions = { branchStrategy: "Trunk-based (main/master)", commitMessageFormat: "unknown", prTitleFormat: "unknown" };
  try {
    const pkg = readJsonFile(path.join(rootDir, "package.json")) as { devDependencies?: Record<string, string>; dependencies?: Record<string, string> };
    const deps = { ...(pkg.devDependencies || {}), ...(pkg.dependencies || {}) };
    if (deps["@commitlint/cli"]) git.commitMessageFormat = "Conventional Commits";
    if (deps["commitizen"]) git.commitMessageFormat = "Commitizen";
  } catch {}
  return git;
}

function detectCodeStyle(files: FileInfo[], rootDir: string): CodeStyleConventions {
  const style: CodeStyleConventions = { indentation: "unknown", quoteStyle: "unknown", semicolons: true, trailingComma: "unknown", maxLineLength: null };
  const names = files.map(f => f.name);
  if (names.includes(".eslintrc") || names.includes("eslint.config")) { style.indentation = "2 spaces"; style.semicolons = true; }
  if (names.includes(".prettierrc") || names.includes("prettier.config")) { style.indentation = "2 spaces"; style.quoteStyle = "single"; style.trailingComma = "es5"; style.maxLineLength = 80; }
  if (names.includes(".editorconfig")) {
    try { const content = readFile(path.join(rootDir, ".editorconfig")); const m = content.match(/indent_style\s*=\s*(\w+)/); if (m) style.indentation = m[1] === "space" ? "spaces" : "tabs"; } catch {}
  }
  return style;
}

function generateConventionsDescription(naming: NamingConventions, structure: StructureConventions, testing: TestingConventions, git: GitConventions, codeStyle: CodeStyleConventions): string {
  let d = "## Naming Conventions\n";
  d += `- **Files**: ${naming.files}\n`;
  d += "\n## Project Structure\n";
  if (structure.srcDirectory !== "unknown") d += `- **Source**: ${structure.srcDirectory}\n`;
  if (structure.testDirectory !== "unknown") d += `- **Tests**: ${structure.testDirectory}\n`;
  d += "\n## Code Style\n";
  if (codeStyle.indentation !== "unknown") d += `- **Indentation**: ${codeStyle.indentation}\n`;
  d += `- **Semicolons**: ${codeStyle.semicolons ? "Required" : "Optional"}\n`;
  return d;
}

export function generateConventionsFile(c: Conventions): string {
  return `# Code Conventions

${c.description}

## Naming Conventions

| Element | Convention |
|---------|------------|
| Files | ${c.naming.files} |
| Components | ${c.naming.components} |
| Test Files | ${c.naming.tests} |
| Directories | ${c.naming.directories} |

## Project Structure

| Directory | Location |
|-----------|----------|
| Source | ${c.structure.srcDirectory} |
| Tests | ${c.structure.testDirectory} |
| Config | ${c.structure.configDirectory} |

## Code Style

| Style Element | Value |
|---------------|-------|
| Indentation | ${c.codeStyle.indentation} |
| Semicolons | ${c.codeStyle.semicolons ? "Required" : "Optional"} |

## Testing

| Aspect | Value |
|--------|-------|
| Framework | ${c.testing.framework} |
| Test Pattern | ${c.testing.testFilePattern} |

## Git

| Aspect | Value |
|--------|-------|
| Branch Strategy | ${c.git.branchStrategy} |
| Commit Format | ${c.git.commitMessageFormat} |

---
*Generated by ai-first*
`;
}
