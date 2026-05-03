import fs from "fs";
import path from "path";

export interface TaskContext {
  task: string;
  relevantFiles: string[];
  relevantPatterns: CodeExample[];
  relevantTests: string[];
  relevantDocs: string[];
  suggestions: string[];
}

export interface CodeExample {
  file: string;
  code: string;
  description: string;
}

export function generateTaskContext(rootDir: string, task: string): TaskContext {
  const context: TaskContext = {
    task,
    relevantFiles: [],
    relevantPatterns: [],
    relevantTests: [],
    relevantDocs: [],
    suggestions: [],
  };

  const taskLower = task.toLowerCase();
  const sourceFiles = findSourceFiles(rootDir, 200);

  if (taskLower.includes("endpoint") || taskLower.includes("api") || taskLower.includes("route")) {
    context.relevantFiles = findEndpointFiles(sourceFiles, rootDir);
    context.relevantPatterns = extractEndpointPatterns(sourceFiles, rootDir);
    context.relevantTests = findEndpointTests(rootDir);
    context.suggestions = [
      "Follow existing controller pattern",
      "Add input validation",
      "Add error handling",
      "Write tests for the new endpoint",
    ];
  }

  else if (taskLower.includes("model") || taskLower.includes("schema") || taskLower.includes("entity")) {
    context.relevantFiles = findModelFiles(sourceFiles, rootDir);
    context.relevantPatterns = extractModelPatterns(sourceFiles, rootDir);
    context.relevantTests = findModelTests(rootDir);
    context.suggestions = [
      "Follow existing model pattern",
      "Add validation rules",
      "Consider relationships",
      "Create migration if needed",
    ];
  }

  else if (taskLower.includes("auth") || taskLower.includes("login") || taskLower.includes("jwt")) {
    context.relevantFiles = findAuthFiles(sourceFiles, rootDir);
    context.relevantPatterns = extractAuthPatterns(sourceFiles, rootDir);
    context.relevantTests = findAuthTests(rootDir);
    context.suggestions = [
      "Follow existing auth pattern",
      "Use bcrypt for password hashing",
      "Implement proper token refresh",
      "Add rate limiting",
    ];
  }

  else if (taskLower.includes("test") || taskLower.includes("spec")) {
    context.relevantFiles = findTestFiles(rootDir);
    context.relevantPatterns = extractTestPatterns(rootDir);
    context.suggestions = [
      "Follow existing test pattern",
      "Use describe/it structure",
      "Mock external dependencies",
      "Test edge cases",
    ];
  }

  else if (taskLower.includes("bug") || taskLower.includes("fix") || taskLower.includes("error")) {
    context.relevantFiles = findErrorFiles(sourceFiles, rootDir);
    context.relevantPatterns = extractErrorPatterns(sourceFiles, rootDir);
    context.suggestions = [
      "Check error handling patterns",
      "Look for similar issues in codebase",
      "Add logging for debugging",
      "Write regression test",
    ];
  }

  else if (taskLower.includes("refactor") || taskLower.includes("clean") || taskLower.includes("improve")) {
    context.relevantFiles = findComplexFiles(sourceFiles, rootDir);
    context.suggestions = [
      "Identify code smells",
      "Extract reusable functions",
      "Improve naming",
      "Add documentation",
    ];
  }

  else {
    context.relevantFiles = findRelevantFiles(sourceFiles, task, rootDir);
    context.suggestions = [
      "Review existing patterns in the codebase",
      "Follow established conventions",
      "Add tests for new functionality",
    ];
  }

  const readmePath = path.join(rootDir, "README.md");
  if (fs.existsSync(readmePath)) {
    context.relevantDocs.push("README.md");
  }

  const docsDir = path.join(rootDir, "docs");
  if (fs.existsSync(docsDir)) {
    const docFiles = findFiles(docsDir, [".md"], 10);
    context.relevantDocs.push(...docFiles.map(f => path.relative(rootDir, f)));
  }

  context.relevantFiles = context.relevantFiles.slice(0, 15);
  context.relevantPatterns = context.relevantPatterns.slice(0, 5);
  context.relevantTests = context.relevantTests.slice(0, 5);

  return context;
}

function findEndpointFiles(files: string[], rootDir: string): string[] {
  return files
    .filter(f => {
      const basename = path.basename(f).toLowerCase();
      const dirname = path.dirname(f).toLowerCase();
      return basename.includes("controller") || basename.includes("handler") ||
             basename.includes("route") || dirname.includes("controllers") ||
             dirname.includes("handlers") || dirname.includes("routes");
    })
    .map(f => path.relative(rootDir, f));
}

function extractEndpointPatterns(files: string[], rootDir: string): CodeExample[] {
  const patterns: CodeExample[] = [];
  
  for (const file of files) {
    const basename = path.basename(file).toLowerCase();
    if (basename.includes("controller") || basename.includes("handler")) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        const relativePath = path.relative(rootDir, file);
        patterns.push({
          file: relativePath,
          code: extractRelevantCode(content, 30),
          description: `Endpoint pattern from ${path.basename(file)}`,
        });
        if (patterns.length >= 2) break;
      } catch {}
    }
  }
  
  return patterns;
}

function findEndpointTests(rootDir: string): string[] {
  const testDirs = ["tests", "test", "__tests__"];
  const tests: string[] = [];
  
  for (const testDir of testDirs) {
    const testPath = path.join(rootDir, testDir);
    if (fs.existsSync(testPath)) {
      const files = findFiles(testPath, [".test.ts", ".test.js", ".spec.ts", ".spec.js"], 10);
      for (const file of files) {
        const basename = path.basename(file).toLowerCase();
        if (basename.includes("controller") || basename.includes("handler") || basename.includes("route") || basename.includes("api")) {
          tests.push(path.relative(rootDir, file));
        }
      }
    }
  }
  
  return tests;
}

function findModelFiles(files: string[], rootDir: string): string[] {
  return files
    .filter(f => {
      const basename = path.basename(f).toLowerCase();
      const dirname = path.dirname(f).toLowerCase();
      return basename.includes("model") || basename.includes("entity") ||
             basename.includes("schema") || dirname.includes("models") ||
             dirname.includes("entities");
    })
    .map(f => path.relative(rootDir, f));
}

function extractModelPatterns(files: string[], rootDir: string): CodeExample[] {
  const patterns: CodeExample[] = [];
  
  for (const file of files) {
    const basename = path.basename(file).toLowerCase();
    if (basename.includes("model") || basename.includes("entity")) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        const relativePath = path.relative(rootDir, file);
        patterns.push({
          file: relativePath,
          code: extractRelevantCode(content, 30),
          description: `Model pattern from ${path.basename(file)}`,
        });
        if (patterns.length >= 2) break;
      } catch {}
    }
  }
  
  return patterns;
}

function findModelTests(rootDir: string): string[] {
  const testDirs = ["tests", "test", "__tests__"];
  const tests: string[] = [];
  
  for (const testDir of testDirs) {
    const testPath = path.join(rootDir, testDir);
    if (fs.existsSync(testPath)) {
      const files = findFiles(testPath, [".test.ts", ".test.js", ".spec.ts", ".spec.js"], 10);
      for (const file of files) {
        const basename = path.basename(file).toLowerCase();
        if (basename.includes("model") || basename.includes("entity")) {
          tests.push(path.relative(rootDir, file));
        }
      }
    }
  }
  
  return tests;
}

function findAuthFiles(files: string[], rootDir: string): string[] {
  return files
    .filter(f => {
      const basename = path.basename(f).toLowerCase();
      const dirname = path.dirname(f).toLowerCase();
      return basename.includes("auth") || basename.includes("login") ||
             basename.includes("jwt") || basename.includes("token") ||
             dirname.includes("auth");
    })
    .map(f => path.relative(rootDir, f));
}

function extractAuthPatterns(files: string[], rootDir: string): CodeExample[] {
  const patterns: CodeExample[] = [];
  
  for (const file of files) {
    const basename = path.basename(file).toLowerCase();
    if (basename.includes("auth") || basename.includes("middleware")) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        const relativePath = path.relative(rootDir, file);
        patterns.push({
          file: relativePath,
          code: extractRelevantCode(content, 30),
          description: `Auth pattern from ${path.basename(file)}`,
        });
        if (patterns.length >= 2) break;
      } catch {}
    }
  }
  
  return patterns;
}

function findAuthTests(rootDir: string): string[] {
  const testDirs = ["tests", "test", "__tests__"];
  const tests: string[] = [];
  
  for (const testDir of testDirs) {
    const testPath = path.join(rootDir, testDir);
    if (fs.existsSync(testPath)) {
      const files = findFiles(testPath, [".test.ts", ".test.js", ".spec.ts", ".spec.js"], 10);
      for (const file of files) {
        const basename = path.basename(file).toLowerCase();
        if (basename.includes("auth") || basename.includes("login")) {
          tests.push(path.relative(rootDir, file));
        }
      }
    }
  }
  
  return tests;
}

function findTestFiles(rootDir: string): string[] {
  const testDirs = ["tests", "test", "__tests__"];
  const tests: string[] = [];
  
  for (const testDir of testDirs) {
    const testPath = path.join(rootDir, testDir);
    if (fs.existsSync(testPath)) {
      const files = findFiles(testPath, [".test.ts", ".test.js", ".spec.ts", ".spec.js"], 20);
      tests.push(...files.map(f => path.relative(rootDir, f)));
    }
  }
  
  return tests;
}

function extractTestPatterns(rootDir: string): CodeExample[] {
  const patterns: CodeExample[] = [];
  const testFiles = findTestFiles(rootDir);
  
  for (const file of testFiles.slice(0, 2)) {
    try {
      const content = fs.readFileSync(path.join(rootDir, file), "utf-8");
      patterns.push({
        file,
        code: extractRelevantCode(content, 30),
        description: `Test pattern from ${path.basename(file)}`,
      });
    } catch {}
  }
  
  return patterns;
}

function findErrorFiles(files: string[], rootDir: string): string[] {
  return files
    .filter(f => {
      const basename = path.basename(f).toLowerCase();
      return basename.includes("error") || basename.includes("exception") ||
             basename.includes("handler");
    })
    .map(f => path.relative(rootDir, f));
}

function extractErrorPatterns(files: string[], rootDir: string): CodeExample[] {
  const patterns: CodeExample[] = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      if (content.includes("try") && content.includes("catch")) {
        const relativePath = path.relative(rootDir, file);
        patterns.push({
          file: relativePath,
          code: extractErrorHandlingCode(content),
          description: `Error handling from ${path.basename(file)}`,
        });
        if (patterns.length >= 2) break;
      }
    } catch {}
  }
  
  return patterns;
}

function findComplexFiles(files: string[], rootDir: string): string[] {
  const complexFiles: { file: string; lines: number }[] = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n").length;
      if (lines > 100) {
        complexFiles.push({ file: path.relative(rootDir, file), lines });
      }
    } catch {}
  }
  
  return complexFiles
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 10)
    .map(f => f.file);
}

function findRelevantFiles(files: string[], task: string, rootDir: string): string[] {
  const taskWords = task.toLowerCase().split(/\s+/);
  const relevantFiles: { file: string; score: number }[] = [];
  
  for (const file of files) {
    const relativePath = path.relative(rootDir, file).toLowerCase();
    const basename = path.basename(file).toLowerCase();
    
    let score = 0;
    for (const word of taskWords) {
      if (relativePath.includes(word)) score += 2;
      if (basename.includes(word)) score += 3;
    }
    
    if (score > 0) {
      relevantFiles.push({ file: path.relative(rootDir, file), score });
    }
  }
  
  return relevantFiles
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(f => f.file);
}

function extractRelevantCode(content: string, maxLines: number): string {
  const lines = content.split("\n");
  const relevantLines: string[] = [];
  let inFunction = false;
  let braceCount = 0;

  for (let i = 0; i < lines.length && relevantLines.length < maxLines; i++) {
    const line = lines[i];
    
    if (line.includes("function ") || line.includes("def ") || line.includes("const ") && line.includes("=>") ||
        line.includes("async ") || line.includes("public ") || line.includes("private ")) {
      inFunction = true;
    }

    if (inFunction) {
      relevantLines.push(line);
      braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      if (braceCount <= 0 && relevantLines.length > 3) {
        break;
      }
    }
  }

  return relevantLines.join("\n").slice(0, 1000);
}

function extractErrorHandlingCode(content: string): string {
  const lines = content.split("\n");
  const errorLines: string[] = [];
  let capturing = false;

  for (const line of lines) {
    if (line.includes("try {") || line.includes("try:")) {
      capturing = true;
    }
    if (capturing) {
      errorLines.push(line);
      if (errorLines.length >= 20) break;
      if (line.includes("}") && !line.includes("{")) {
        break;
      }
    }
  }

  return errorLines.join("\n").slice(0, 800);
}

function findSourceFiles(rootDir: string, maxFiles: number): string[] {
  const files: string[] = [];
  const extensions = [".ts", ".js", ".py", ".go", ".rs", ".java", ".rb", ".php"];
  const excludeDirs = ["node_modules", ".git", "dist", "build", "__pycache__", "vendor", ".venv", "venv", "fixtures"];

  function walk(dir: string) {
    if (files.length >= maxFiles) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= maxFiles) return;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
          walk(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch {}
  }

  walk(rootDir);
  return files;
}

function findFiles(dir: string, extensions: string[], maxFiles: number): string[] {
  const files: string[] = [];
  
  function walk(currentDir: string) {
    if (files.length >= maxFiles) return;
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= maxFiles) return;
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory() && !["node_modules", ".git", "dist", "build"].includes(entry.name)) {
          walk(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch {}
  }

  walk(dir);
  return files;
}
