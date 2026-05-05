import fs from "fs";
import path from "path";
import { confidence, createEvidence, type FindingMetadata } from "./findingMetadata.js";

export interface SecurityIssue extends FindingMetadata {
  type: string;
  severity: "critical" | "warning" | "info";
  file: string;
  line: number;
  description: string;
  recommendation: string;
}

export function detectSecurityIssues(rootDir: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const sourceFiles = findSourceFiles(rootDir, 200);

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        if (isRuleDefinitionLine(relativePath, line)) {
          continue;
        }

        if (line.match(/(?:query|execute|raw)\s*\(\s*['"`].*\$\{/)) {
          issues.push({
            type: "sql-injection",
            severity: "critical",
            file: relativePath,
            line: lineNum,
            description: "Potential SQL injection via string interpolation",
            recommendation: "Use parameterized queries or prepared statements",
            confidence: confidence(0.86),
            evidence: createEvidence(relativePath, lineNum, line),
            whyFlagged: "A SQL-like call contains template interpolation, which can include untrusted input if values are not parameterized.",
          });
        }

        if (line.match(/(?:query|execute|raw)\s*\(\s*['"`].*\+/)) {
          issues.push({
            type: "sql-injection",
            severity: "critical",
            file: relativePath,
            line: lineNum,
            description: "Potential SQL injection via string concatenation",
            recommendation: "Use parameterized queries or prepared statements",
            confidence: confidence(0.78),
            evidence: createEvidence(relativePath, lineNum, line),
            whyFlagged: "A SQL-like call appears to build a query with string concatenation.",
          });
        }

        if (line.includes("innerHTML") && !line.includes("textContent")) {
          issues.push({
            type: "xss",
            severity: "warning",
            file: relativePath,
            line: lineNum,
            description: "Using innerHTML may lead to XSS",
            recommendation: "Use textContent or sanitize the input",
            confidence: confidence(0.68),
            evidence: createEvidence(relativePath, lineNum, line),
            whyFlagged: "Direct innerHTML assignment can execute unsafe HTML unless input is sanitized.",
          });
        }

        if (line.match(/\beval\s*\(/) && !line.includes("//")) {
          issues.push({
            type: "code-injection",
            severity: "critical",
            file: relativePath,
            line: lineNum,
            description: "Using eval() or Function() constructor",
            recommendation: "Avoid eval() - use safer alternatives",
            confidence: confidence(0.9),
            evidence: createEvidence(relativePath, lineNum, line),
            whyFlagged: "eval() executes dynamic code and is usually unsafe with untrusted input.",
          });
        }

        if (line.match(/\bnew\s+Function\s*\(/) && !line.includes("//")) {
          issues.push({
            type: "code-injection",
            severity: "warning",
            file: relativePath,
            line: lineNum,
            description: "Using Function() constructor",
            recommendation: "Avoid dynamic code generation or isolate trusted inputs",
            confidence: confidence(0.72),
            evidence: createEvidence(relativePath, lineNum, line),
            whyFlagged: "The Function constructor executes generated code; risk depends on whether inputs are trusted.",
          });
        }

        if (line.match(/cors\s*\(\s*\)/i) || line.includes("origin: '*'") || line.includes("origin: true")) {
          issues.push({
            type: "cors-misconfiguration",
            severity: "warning",
            file: relativePath,
            line: lineNum,
            description: "CORS configured to allow all origins",
            recommendation: "Restrict CORS to specific trusted origins",
            confidence: confidence(0.82),
            evidence: createEvidence(relativePath, lineNum, line),
            whyFlagged: "CORS appears to allow every origin.",
          });
        }

        if (line.match(/http:\/\//i) && !line.includes("https://") && !line.includes("localhost") && !line.includes("127.0.0.1")) {
          issues.push({
            type: "insecure-transport",
            severity: "warning",
            file: relativePath,
            line: lineNum,
            description: "Using HTTP instead of HTTPS",
            recommendation: "Use HTTPS for all external communications",
            confidence: confidence(0.62),
            evidence: createEvidence(relativePath, lineNum, line),
            whyFlagged: "An external HTTP URL may expose traffic unless it is local-only or internal.",
          });
        }

        if (line.match(/(?:password|secret|api_key)\s*[:=]\s*['"][^'"]{8,}['"]/i) && !line.includes("process.env") && !line.includes("os.environ")) {
          issues.push({
            type: "hardcoded-credentials",
            severity: "critical",
            file: relativePath,
            line: lineNum,
            description: "Hardcoded credentials detected",
            recommendation: "Move credentials to environment variables",
            confidence: confidence(0.84),
            evidence: createEvidence(relativePath, lineNum, redactSecrets(line)),
            whyFlagged: "A credential-like variable appears to be assigned a literal value.",
          });
        }

        if (line.includes("createHash('md5')") || line.includes("hashlib.md5")) {
          issues.push({
            type: "weak-crypto",
            severity: "warning",
            file: relativePath,
            line: lineNum,
            description: "Using MD5 which is cryptographically broken",
            recommendation: "Use SHA-256 or bcrypt for hashing",
            confidence: confidence(0.76),
            evidence: createEvidence(relativePath, lineNum, line),
            whyFlagged: "MD5 is weak for security-sensitive hashing; this may be acceptable only for non-security fingerprints.",
          });
        }

        if (line.match(/\bexec\s*\(\s*['"`].*\$\{/) || line.match(/\bsystem\s*\(\s*['"`].*\$\{/)) {
          if (line.includes("execSync") || line.includes("execCommand") || line.includes("execFile")) continue;
          
          issues.push({
            type: "command-injection",
            severity: "warning",
            file: relativePath,
            line: lineNum,
            description: "Potential command injection",
            recommendation: "Use parameterized commands or avoid shell execution",
            confidence: confidence(0.74),
            evidence: createEvidence(relativePath, lineNum, line),
            whyFlagged: "A shell command appears to interpolate values into a command string.",
          });
        }

        if (line.includes("dangerouslySetInnerHTML")) {
          issues.push({
            type: "xss-react",
            severity: "warning",
            file: relativePath,
            line: lineNum,
            description: "Using dangerouslySetInnerHTML in React",
            recommendation: "Sanitize HTML content before rendering",
            confidence: confidence(0.7),
            evidence: createEvidence(relativePath, lineNum, line),
            whyFlagged: "React raw HTML rendering bypasses escaping unless the HTML is sanitized.",
          });
        }
      }
    } catch {}
  }

  const configIssues = checkSecurityConfig(rootDir);
  issues.push(...configIssues);

  return issues.slice(0, 30);
}

function checkSecurityConfig(rootDir: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  const envPath = path.join(rootDir, ".env");
  if (fs.existsSync(envPath)) {
    issues.push({
      type: "env-file",
      severity: "warning",
      file: ".env",
      line: 0,
      description: ".env file exists in project",
      recommendation: "Ensure .env is in .gitignore and never committed",
      confidence: confidence(0.65),
      evidence: [".env"],
      whyFlagged: ".env files often contain secrets; this is a warning to confirm it is ignored and not committed.",
    });
  }

  const gitignorePath = path.join(rootDir, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    if (!content.includes(".env")) {
      issues.push({
        type: "env-not-ignored",
        severity: "warning",
        file: ".gitignore",
        line: 0,
        description: ".env not in .gitignore",
        recommendation: "Add .env to .gitignore to prevent credential leaks",
        confidence: confidence(0.88),
        evidence: [".gitignore"],
        whyFlagged: ".gitignore exists but does not contain an .env pattern.",
      });
    }
  }

  const helmetCheck = checkForHelmet(rootDir);
  if (!helmetCheck) {
    issues.push({
      type: "missing-helmet",
      severity: "info",
      file: "",
      line: 0,
      description: "No security headers middleware detected",
      recommendation: "Consider using helmet.js for Express apps",
      confidence: confidence(0.45),
      evidence: ["package.json"],
      whyFlagged: "No helmet dependency was found; this is informational because the app may not be Express or may set headers elsewhere.",
    });
  }

  return issues;
}

function isRuleDefinitionLine(relativePath: string, line: string): boolean {
  if (!relativePath.endsWith("securityAuditor.ts") && !relativePath.endsWith("securityAuditor.js")) {
    return false;
  }

  const trimmed = line.trim();
  return trimmed.startsWith("description:") ||
    trimmed.startsWith("recommendation:") ||
    trimmed.startsWith("whyFlagged:") ||
    trimmed.startsWith("if (line.") ||
    trimmed.startsWith("if (line.match") ||
    trimmed.startsWith("if (line.includes");
}

function redactSecrets(line: string): string {
  return line.replace(/(['"])[^'"]{8,}\1/g, "$1[redacted]$1");
}

function checkForHelmet(rootDir: string): boolean {
  const packageJsonPath = path.join(rootDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const content = fs.readFileSync(packageJsonPath, "utf-8");
      return content.includes("helmet");
    } catch {}
  }
  return false;
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
