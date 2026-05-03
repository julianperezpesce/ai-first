import fs from "fs";
import path from "path";

export interface CrossCuttingConcerns {
  auth: PatternInfo | null;
  logging: PatternInfo | null;
  errorHandling: PatternInfo | null;
  validation: PatternInfo | null;
  caching: PatternInfo | null;
}

export interface PatternInfo {
  pattern: string;
  files: string[];
  description: string;
}

export function extractCrossCuttingConcerns(rootDir: string): CrossCuttingConcerns {
  const concerns: CrossCuttingConcerns = {
    auth: null,
    logging: null,
    errorHandling: null,
    validation: null,
    caching: null,
  };

  const sourceFiles = findSourceFiles(rootDir, 100);

  concerns.auth = detectAuthPattern(sourceFiles, rootDir);
  concerns.logging = detectLoggingPattern(sourceFiles, rootDir);
  concerns.errorHandling = detectErrorHandlingPattern(sourceFiles, rootDir);
  concerns.validation = detectValidationPattern(sourceFiles, rootDir);
  concerns.caching = detectCachingPattern(sourceFiles, rootDir);

  return concerns;
}

function detectAuthPattern(files: string[], rootDir: string): PatternInfo | null {
  const authFiles: string[] = [];
  let pattern = "";

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);

      if (content.includes("passport") || content.includes("jwt") || content.includes("jsonwebtoken")) {
        authFiles.push(relativePath);
        if (!pattern) pattern = "JWT/Passport";
      }
      if (content.includes("@nestjs/passport") || content.includes("AuthGuard")) {
        authFiles.push(relativePath);
        if (!pattern) pattern = "NestJS Passport";
      }
      if (content.includes("django.contrib.auth") || content.includes("authentication_classes")) {
        authFiles.push(relativePath);
        if (!pattern) pattern = "Django Auth";
      }
      if (content.includes("bcrypt") || content.includes("argon2") || content.includes("scrypt")) {
        authFiles.push(relativePath);
      }
    } catch {}
  }

  if (authFiles.length === 0) return null;

  return {
    pattern,
    files: [...new Set(authFiles)].slice(0, 5),
    description: `Authentication using ${pattern}`,
  };
}

function detectLoggingPattern(files: string[], rootDir: string): PatternInfo | null {
  const loggingFiles: string[] = [];
  let pattern = "";

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);

      if (content.includes("winston") || content.includes("pino") || content.includes("bunyan")) {
        loggingFiles.push(relativePath);
        if (!pattern) pattern = content.includes("winston") ? "Winston" : content.includes("pino") ? "Pino" : "Bunyan";
      }
      if (content.includes("logging.getLogger") || content.includes("import logging")) {
        loggingFiles.push(relativePath);
        if (!pattern) pattern = "Python logging";
      }
      if (content.includes("console.log") || content.includes("console.error")) {
        loggingFiles.push(relativePath);
        if (!pattern) pattern = "Console";
      }
      if (content.includes("@nestjs/common") && content.includes("Logger")) {
        loggingFiles.push(relativePath);
        if (!pattern) pattern = "NestJS Logger";
      }
    } catch {}
  }

  if (loggingFiles.length === 0) return null;

  return {
    pattern,
    files: [...new Set(loggingFiles)].slice(0, 5),
    description: `Logging using ${pattern}`,
  };
}

function detectErrorHandlingPattern(files: string[], rootDir: string): PatternInfo | null {
  const errorFiles: string[] = [];
  let pattern = "";

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);

      if (content.includes("AppError") || content.includes("HttpException") || content.includes("CustomException")) {
        errorFiles.push(relativePath);
        if (!pattern) pattern = content.includes("AppError") ? "Custom AppError" : content.includes("HttpException") ? "HttpException" : "Custom Exception";
      }
      if (content.includes("err, req, res, next") || content.includes("error-handler") || content.includes("errorHandler")) {
        errorFiles.push(relativePath);
        if (!pattern) pattern = "Express Error Handler";
      }
      if (content.includes("@ControllerAdvice") || content.includes("@ExceptionHandler")) {
        errorFiles.push(relativePath);
        if (!pattern) pattern = "Spring ControllerAdvice";
      }
      if (content.includes("try:") && content.includes("except:")) {
        errorFiles.push(relativePath);
        if (!pattern) pattern = "Python try/except";
      }
    } catch {}
  }

  if (errorFiles.length === 0) return null;

  return {
    pattern,
    files: [...new Set(errorFiles)].slice(0, 5),
    description: `Error handling using ${pattern}`,
  };
}

function detectValidationPattern(files: string[], rootDir: string): PatternInfo | null {
  const validationFiles: string[] = [];
  let pattern = "";

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);

      if (content.includes("joi") || content.includes("@hapi/joi")) {
        validationFiles.push(relativePath);
        if (!pattern) pattern = "Joi";
      }
      if (content.includes("zod")) {
        validationFiles.push(relativePath);
        if (!pattern) pattern = "Zod";
      }
      if (content.includes("class-validator") || content.includes("@IsString") || content.includes("@IsNotEmpty")) {
        validationFiles.push(relativePath);
        if (!pattern) pattern = "class-validator";
      }
      if (content.includes("pydantic") || content.includes("BaseModel")) {
        validationFiles.push(relativePath);
        if (!pattern) pattern = "Pydantic";
      }
      if (content.includes("yup")) {
        validationFiles.push(relativePath);
        if (!pattern) pattern = "Yup";
      }
    } catch {}
  }

  if (validationFiles.length === 0) return null;

  return {
    pattern,
    files: [...new Set(validationFiles)].slice(0, 5),
    description: `Validation using ${pattern}`,
  };
}

function detectCachingPattern(files: string[], rootDir: string): PatternInfo | null {
  const cachingFiles: string[] = [];
  let pattern = "";

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);

      if (content.includes("redis") || content.includes("ioredis") || content.includes("Redis")) {
        cachingFiles.push(relativePath);
        if (!pattern) pattern = "Redis";
      }
      if (content.includes("memcached") || content.includes("Memcached")) {
        cachingFiles.push(relativePath);
        if (!pattern) pattern = "Memcached";
      }
      if (content.includes("@Cacheable") || content.includes("@CacheEvict")) {
        cachingFiles.push(relativePath);
        if (!pattern) pattern = "Spring Cache";
      }
      if (content.includes("caches.") || content.includes("from django.core.cache")) {
        cachingFiles.push(relativePath);
        if (!pattern) pattern = "Django Cache";
      }
      if (content.includes("node-cache") || content.includes("new Map()")) {
        cachingFiles.push(relativePath);
        if (!pattern) pattern = "In-Memory";
      }
    } catch {}
  }

  if (cachingFiles.length === 0) return null;

  return {
    pattern,
    files: [...new Set(cachingFiles)].slice(0, 5),
    description: `Caching using ${pattern}`,
  };
}

function findSourceFiles(rootDir: string, maxFiles: number): string[] {
  const files: string[] = [];
  const extensions = [".ts", ".js", ".py", ".go", ".rs", ".java", ".rb", ".php"];
  const excludeDirs = ["node_modules", ".git", "dist", "build", "__pycache__", "vendor", ".venv", "venv", "test", "tests"];

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
