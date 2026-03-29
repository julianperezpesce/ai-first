import path from 'path';
import fs from 'fs';
import { scanRepo, FileInfo } from '../repoScanner.js';

export interface Repository {
  name: string;
  path: string;
  files: FileInfo[];
}

export interface MultiRepoContext {
  repositories: Repository[];
  totalFiles: number;
  crossRepoDependencies: Map<string, string[]>;
}

export interface MultiRepoOptions {
  repositories: string[];
  includeSubmodules?: boolean;
}

export function scanMultiRepo(options: MultiRepoOptions): MultiRepoContext {
  const repositories: Repository[] = [];
  const crossRepoDependencies = new Map<string, string[]>();
  let totalFiles = 0;

  for (const repoPath of options.repositories) {
    const resolvedPath = path.resolve(repoPath);
    
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`Repository path does not exist: ${resolvedPath}`);
      continue;
    }

    const repoName = path.basename(resolvedPath);
    const scanResult = scanRepo(resolvedPath);
    
    repositories.push({
      name: repoName,
      path: resolvedPath,
      files: scanResult.files
    });
    
    totalFiles += scanResult.totalFiles;
  }

  if (options.includeSubmodules) {
    for (const repo of repositories) {
      const submodules = detectSubmodules(repo.path);
      for (const submodule of submodules) {
        const submoduleName = path.basename(submodule);
        const scanResult = scanRepo(submodule);
        
        repositories.push({
          name: `${repo.name}/${submoduleName}`,
          path: submodule,
          files: scanResult.files
        });
        
        totalFiles += scanResult.totalFiles;
      }
    }
  }

  detectCrossRepoDependencies(repositories, crossRepoDependencies);

  return {
    repositories,
    totalFiles,
    crossRepoDependencies
  };
}

function detectSubmodules(repoPath: string): string[] {
  const submodules: string[] = [];
  const gitmodulesPath = path.join(repoPath, '.gitmodules');
  
  if (!fs.existsSync(gitmodulesPath)) {
    return submodules;
  }

  try {
    const content = fs.readFileSync(gitmodulesPath, 'utf-8');
    const matches = content.match(/path\s*=\s*(.+)/g);
    
    if (matches) {
      for (const match of matches) {
        const submodulePath = match.split('=')[1].trim();
        const fullPath = path.join(repoPath, submodulePath);
        if (fs.existsSync(fullPath)) {
          submodules.push(fullPath);
        }
      }
    }
  } catch {
    // Ignore errors reading .gitmodules
  }

  return submodules;
}

function detectCrossRepoDependencies(
  repositories: Repository[],
  dependencies: Map<string, string[]>
): void {
  for (const repo of repositories) {
    const deps: string[] = [];
    
    for (const otherRepo of repositories) {
      if (repo.name === otherRepo.name) continue;
      
      const hasDependency = checkDependency(repo, otherRepo);
      if (hasDependency) {
        deps.push(otherRepo.name);
      }
    }
    
    if (deps.length > 0) {
      dependencies.set(repo.name, deps);
    }
  }
}

function checkDependency(repoA: Repository, repoB: Repository): boolean {
  const packageJsonA = path.join(repoA.path, 'package.json');
  
  if (fs.existsSync(packageJsonA)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonA, 'utf-8'));
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
        ...pkg.peerDependencies
      };
      
      for (const dep of Object.keys(deps)) {
        if (dep.includes(repoB.name.toLowerCase())) {
          return true;
        }
      }
    } catch {
      // Ignore errors reading package.json
    }
  }
  
  return false;
}

export function generateMultiRepoReport(context: MultiRepoContext): string {
  const lines: string[] = [];
  
  lines.push('# Multi-Repository Context\n');
  lines.push(`## Summary`);
  lines.push(`- **Total Repositories:** ${context.repositories.length}`);
  lines.push(`- **Total Files:** ${context.totalFiles}\n`);
  
  lines.push(`## Repositories`);
  for (const repo of context.repositories) {
    lines.push(`\n### ${repo.name}`);
    lines.push(`- **Path:** ${repo.path}`);
    lines.push(`- **Files:** ${repo.files.length}`);
    
    const deps = context.crossRepoDependencies.get(repo.name);
    if (deps && deps.length > 0) {
      lines.push(`- **Dependencies:** ${deps.join(', ')}`);
    }
  }
  
  if (context.crossRepoDependencies.size > 0) {
    lines.push(`\n## Cross-Repository Dependencies`);
    for (const [repo, deps] of context.crossRepoDependencies) {
      lines.push(`- **${repo}** depends on: ${deps.join(', ')}`);
    }
  }
  
  return lines.join('\n');
}
