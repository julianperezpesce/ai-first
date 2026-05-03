import fs from "fs";
import path from "path";

export interface SecurityIssue {
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

        if (line.match(/(?:query|execute|raw)\s*\(\s*['"`].*\$\{/)) {
          issues.push({
            type: "sql-injection",
            severity: "critical",
            file: relativePath,
            line: lineNum,
            description: "Potential SQL injection via string interpolation",
            recommendation: "Use parameterized queries or prepared statements",
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
          });
        }

        if (line.match(/(?:eval|Function)\s*\(/) && !line.includes("//")) {
          issues.push({
            type: "code-injection",
            severity: "critical",
            file: relativePath,
            line: lineNum,
            description: "Using eval() or Function() constructor",
            recommendation: "Avoid eval() - use safer alternatives",
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
          });
        }

        if (line.match(/(?:password|secret|key|token|api_key)\s*[:=]\s*['"][^'"]{8,}['"]/i) && !line.includes("process.env") && !line.includes("os.environ")) {
          issues.push({
            type: "hardcoded-credentials",
            severity: "critical",
            file: relativePath,
            line: lineNum,
            description: "Hardcoded credentials detected",
            recommendation: "Move credentials to environment variables",
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
          });
        }

        if (line.match(/exec\s*\(\s*['"]/) || line.match(/system\s*\(\s*['"]/)) {
          issues.push({
            type: "command-injection",
            severity: "critical",
            file: relativePath,
            line: lineNum,
            description: "Potential command injection",
            recommendation: "Use parameterized commands or avoid shell execution",
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
    });
  }

  return issues;
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
