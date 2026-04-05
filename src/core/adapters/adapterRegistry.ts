import fs from "fs";
import path from "path";
import { AnalysisAdapter, DEFAULT_ADAPTER } from "./baseAdapter.js";
import { javascriptAdapter } from "./javascriptAdapter.js";
import { pythonAdapter, djangoAdapter, flaskAdapter } from "./pythonAdapter.js";
import { railsAdapter, rubyAdapter } from "./railsAdapter.js";
import { salesforceAdapter, sfdxAdapter } from "./salesforceAdapter.js";
import { dotnetAdapter, aspnetCoreAdapter, blazorAdapter } from "./dotnetAdapter.js";
import { laravelAdapter, nestjsAdapter, springBootAdapter, phoenixAdapter, fastapiAdapter } from "./community/index.js";

/**
 * Registry of all available adapters
 */
export const ADAPTERS: AnalysisAdapter[] = [
  // JavaScript/TypeScript
  javascriptAdapter,
  nestjsAdapter,
  
  // Ruby (must be before Python to detect Gemfile correctly)
  railsAdapter,
  rubyAdapter,
  
  // Python
  djangoAdapter,
  flaskAdapter,
  pythonAdapter,
  fastapiAdapter,
  
  // PHP
  laravelAdapter,
  
  // Elixir
  phoenixAdapter,
  
  // Java/Kotlin
  springBootAdapter,
  
  // Salesforce
  sfdxAdapter,
  salesforceAdapter,
  
  // .NET
  blazorAdapter,
  aspnetCoreAdapter,
  dotnetAdapter
];

/**
 * Adapter detection result
 */
export interface AdapterDetectionResult {
  adapter: AnalysisAdapter;
  confidence: number;
  matchedSignals: string[];
}

/**
 * Detect the appropriate adapter for a project
 * 
 * @param rootDir - Project root directory
 * @returns The best matching adapter
 */
export function detectAdapter(rootDir: string): AnalysisAdapter {
  const results = detectAllAdapters(rootDir);
  
  if (results.length === 0) {
    return DEFAULT_ADAPTER;
  }
  
  // Return the adapter with highest confidence
  return results[0].adapter;
}

/**
 * Detect all matching adapters with confidence scores
 * 
 * @param rootDir - Project root directory
 * @returns Array of matching adapters sorted by confidence
 */
export function detectAllAdapters(rootDir: string): AdapterDetectionResult[] {
  const results: AdapterDetectionResult[] = [];
  
  for (const adapter of ADAPTERS) {
    const matchedSignals: string[] = [];
    let score = 0;
    
    for (const signal of adapter.detectionSignals) {
      const matched = matchSignal(rootDir, signal);
      if (matched) {
        matchedSignals.push(signal.pattern);
        score += getSignalWeight(signal);
      }
    }
    
    if (score > 0) {
      results.push({
        adapter,
        confidence: score,
        matchedSignals
      });
    }
  }
  
  // Sort by confidence (highest first)
  results.sort((a, b) => b.confidence - a.confidence);
  
  return results;
}

/**
 * Match a detection signal against the project
 */
function matchSignal(rootDir: string, signal: { type: string; pattern: string; contentPattern?: string }): boolean {
  switch (signal.type) {
    case 'file':
      return matchFileSignal(rootDir, signal.pattern);
    
    case 'directory':
      return matchDirectorySignal(rootDir, signal.pattern);
    
    case 'content':
      return matchContentSignal(rootDir, signal.pattern, signal.contentPattern);
    
    default:
      return false;
  }
}

/**
 * Match a file signal
 */
function matchFileSignal(rootDir: string, pattern: string): boolean {
  // Simple glob support for *.csproj style patterns
  if (pattern.startsWith('*')) {
    const ext = pattern.slice(1);
    if (!fs.existsSync(rootDir)) return false;
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    return entries.some(e => e.isFile() && e.name.endsWith(ext));
  }
  
  return fs.existsSync(path.join(rootDir, pattern));
}

/**
 * Match a directory signal
 */
function matchDirectorySignal(rootDir: string, pattern: string): boolean {
  if (!fs.existsSync(rootDir)) return false;
  
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  return entries.some(e => e.isDirectory() && e.name === pattern);
}

function matchContentSignal(rootDir: string, filePattern: string, contentPattern: string | undefined): boolean {
  if (!fs.existsSync(rootDir)) return false;
  if (!contentPattern) return false;
  
  try {
    const files = findFilesByPattern(rootDir, filePattern, 100);
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes(contentPattern)) {
          return true;
        }
      } catch {
        continue;
      }
    }
  } catch {
    return false;
  }
  
  return false;
}

function findFilesByPattern(rootDir: string, pattern: string, maxFiles: number): string[] {
  const files: string[] = [];
  const ext = pattern.startsWith('*') ? pattern.slice(1) : null;
  const skipDirs = ['node_modules', '.git', 'venv', '.venv', '__pycache__', '.pytest_cache', 'dist', 'build', '.next', 'target'];
  
  function scanDirectory(dir: string, depth: number = 0) {
    if (depth > 3 || files.length >= maxFiles) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (files.length >= maxFiles) break;
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!skipDirs.includes(entry.name)) {
            scanDirectory(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          if (ext && entry.name.endsWith(ext)) {
            files.push(fullPath);
          } else if (!ext && entry.name === pattern) {
            files.push(fullPath);
          }
        }
      }
    } catch {
    }
  }
  
  scanDirectory(rootDir);
  return files;
}

/**
 * Get weight for a signal type
 */
function getSignalWeight(signal: { type: string; pattern: string }): number {
  // Higher weight for more specific signals
  switch (signal.type) {
    case 'content':
      return 3;
    case 'directory':
      return 2;
    case 'file':
    default:
      // Higher weight for more specific file patterns
      if (signal.pattern.startsWith('*')) return 1;
      if (signal.pattern.includes('.')) return 2;
      return 1;
  }
}

/**
 * Get adapter by name
 */
export function getAdapter(name: string): AnalysisAdapter | undefined {
  return ADAPTERS.find(a => a.name === name);
}

/**
 * List all available adapters
 */
export function listAdapters(): { name: string; displayName: string }[] {
  return ADAPTERS.map(a => ({ name: a.name, displayName: a.displayName }));
}
