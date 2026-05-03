import fs from "fs";
import path from "path";

export interface CodePatterns {
  controllerPattern: CodeExample | null;
  servicePattern: CodeExample | null;
  modelPattern: CodeExample | null;
  testPattern: CodeExample | null;
  middlewarePattern: CodeExample | null;
  errorHandlingPattern: CodeExample | null;
}

export interface CodeExample {
  file: string;
  code: string;
  description: string;
  language: string;
}

export function extractCodePatterns(rootDir: string): CodePatterns {
  const patterns: CodePatterns = {
    controllerPattern: null,
    servicePattern: null,
    modelPattern: null,
    testPattern: null,
    middlewarePattern: null,
    errorHandlingPattern: null,
  };

  const sourceFiles = findSourceFiles(rootDir, 100);

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);
      const ext = path.extname(file);
      const language = getLanguageFromExt(ext);

      if (!patterns.controllerPattern && isController(file, content)) {
        patterns.controllerPattern = {
          file: relativePath,
          code: extractRelevantCode(content, 30),
          description: `Controller pattern from ${path.basename(file)}`,
          language,
        };
      }

      if (!patterns.servicePattern && isService(file, content)) {
        patterns.servicePattern = {
          file: relativePath,
          code: extractRelevantCode(content, 30),
          description: `Service pattern from ${path.basename(file)}`,
          language,
        };
      }

      if (!patterns.modelPattern && isModel(file, content)) {
        patterns.modelPattern = {
          file: relativePath,
          code: extractRelevantCode(content, 30),
          description: `Model pattern from ${path.basename(file)}`,
          language,
        };
      }

      if (!patterns.middlewarePattern && isMiddleware(file, content)) {
        patterns.middlewarePattern = {
          file: relativePath,
          code: extractRelevantCode(content, 25),
          description: `Middleware pattern from ${path.basename(file)}`,
          language,
        };
      }

      if (!patterns.errorHandlingPattern && hasErrorHandling(content)) {
        patterns.errorHandlingPattern = {
          file: relativePath,
          code: extractErrorHandlingCode(content),
          description: `Error handling pattern from ${path.basename(file)}`,
          language,
        };
      }
    } catch {}
  }

  const testFiles = findTestFiles(rootDir, 20);
  for (const file of testFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);
      const ext = path.extname(file);
      const language = getLanguageFromExt(ext);

      if (!patterns.testPattern && content.includes("describe") && content.includes("it(")) {
        patterns.testPattern = {
          file: relativePath,
          code: extractRelevantCode(content, 30),
          description: `Test pattern from ${path.basename(file)}`,
          language,
        };
      }
    } catch {}
  }

  return patterns;
}

function isController(file: string, content: string): boolean {
  const filename = path.basename(file).toLowerCase();
  if (filename.includes("controller") || filename.includes("handler") || filename.includes("route")) return true;
  if (content.includes("@Controller") || content.includes("@RestController")) return true;
  if (content.includes("router.get") || content.includes("router.post") || content.includes("app.get")) return true;
  return false;
}

function isService(file: string, content: string): boolean {
  const filename = path.basename(file).toLowerCase();
  if (filename.includes("service") || filename.includes("repository")) return true;
  if (content.includes("@Injectable") || content.includes("@Service")) return true;
  return false;
}

function isModel(file: string, content: string): boolean {
  const filename = path.basename(file).toLowerCase();
  if (filename.includes("model") || filename.includes("entity") || filename.includes("schema")) return true;
  if (content.includes("@Entity") || content.includes("models.Model") || content.includes("@Schema")) return true;
  return false;
}

function isMiddleware(file: string, content: string): boolean {
  const filename = path.basename(file).toLowerCase();
  if (filename.includes("middleware") || filename.includes("interceptor") || filename.includes("guard")) return true;
  if (content.includes("@Middleware") || content.includes("@Interceptor") || content.includes("@Guard")) return true;
  if (content.includes("req, res, next") && content.includes("next()")) return true;
  return false;
}

function hasErrorHandling(content: string): boolean {
  return content.includes("try {") && content.includes("catch") ||
         content.includes("try:") && content.includes("except:") ||
         content.includes("AppError") || content.includes("HttpException");
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

function getLanguageFromExt(ext: string): string {
  const map: Record<string, string> = {
    ".ts": "typescript", ".tsx": "typescript", ".js": "javascript", ".jsx": "javascript",
    ".py": "python", ".go": "go", ".rs": "rust", ".java": "java", ".rb": "ruby", ".php": "php",
  };
  return map[ext] || "unknown";
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

function findTestFiles(rootDir: string, maxFiles: number): string[] {
  const files: string[] = [];
  const testPatterns = [".test.ts", ".test.js", ".spec.ts", ".spec.js", "test_", "_test.py", "_test.go", "Test.java"];
  const testDirs = ["tests", "test", "__tests__", "spec"];

  function walk(dir: string) {
    if (files.length >= maxFiles) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= maxFiles) return;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (testDirs.includes(entry.name) || !["node_modules", ".git", "dist", "build", "fixtures"].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && testPatterns.some(p => entry.name.includes(p))) {
          files.push(fullPath);
        }
      }
    } catch {}
  }

  walk(rootDir);
  return files;
}
