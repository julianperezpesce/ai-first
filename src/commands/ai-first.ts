#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { scanRepo } from "../core/repoScanner.js";
import { generateRepoMap, generateCompactRepoMap, generateSummary } from "../core/repoMapper.js";
import { generateIndex, IncrementalIndexer, EXAMPLE_QUERIES } from "../core/indexer.js";
import { generateAIContext } from "../core/aiContextGenerator.js";
import { generateHierarchy } from "../core/hierarchyGenerator.js";
import { ensureDir, writeFile } from "../utils/fileUtils.js";
import { AI_CONTEXT_DIR, getIndexDbPath, getHierarchyPath } from "../utils/constants.js";
import { analyzeArchitecture, generateArchitectureFile } from "../analyzers/architecture.js";
import { detectTechStack, generateTechStackFile } from "../analyzers/techStack.js";
import { discoverEntrypoints, generateEntrypointsFile } from "../analyzers/entrypoints.js";
import { detectConventions, generateConventionsFile } from "../analyzers/conventions.js";
import { extractSymbols, generateSymbolsJson } from "../analyzers/symbols.js";
import { analyzeDependencies, generateDependenciesJson } from "../analyzers/dependencies.js";
import { generateAIRules, generateAIRulesFile } from "../analyzers/aiRules.js";
import { generateModuleGraph } from "../core/moduleGraph.js";
import { loadIndexState, computeFileHash, getFilesToIndex, getChangedFilesGit } from "../core/indexState.js";
import { chunkFiles } from "../core/chunker.js";
import { generateEmbeddings, saveEmbeddings, createEmbeddingsTable } from "../core/embeddings.js";
import { generateContextModules, createCCP, listCCPs, getCCP } from "../core/ccp.js";
import { generateSemanticContexts } from "../core/semanticContexts.js";
import { doctorMain } from "./doctor.js";
import { exploreMain } from "./explore.js";
import { listAdapters } from "../core/adapters/index.js";
import { detectGitRepository, generateGitContext, analyzeGitActivity, getRecentFiles, getRecentCommits } from "../core/gitAnalyzer.js";
import { buildKnowledgeGraph, loadKnowledgeGraph } from "../core/knowledgeGraphBuilder.js";
import { runIncrementalUpdate, detectChangedFiles } from "../core/incrementalAnalyzer.js";
import { generateAllSchema } from "../core/schema.js";
import { extractProjectSetup } from "../utils/projectSetupExtractor.js";
import { extractDependencyVersions } from "../utils/dependencyVersionExtractor.js";
import { mapTestFiles } from "../utils/testFileMapper.js";
import { extractDataModels } from "../utils/dataModelExtractor.js";
import { extractRecentChanges } from "../utils/recentChangesExtractor.js";
import { extractCrossCuttingConcerns } from "../utils/crossCuttingExtractor.js";
import { extractConfigAnalysis } from "../utils/configAnalyzer.js";
import { extractCodeGotchas } from "../utils/gotchaExtractor.js";
import { analyzeDependencyImpact } from "../utils/impactAnalyzer.js";
import { extractCodePatterns } from "../utils/patternExtractor.js";
import { detectAntiPatterns } from "../utils/antiPatternDetector.js";
import { detectSecurityIssues } from "../utils/securityAuditor.js";
import { detectPerformanceIssues } from "../utils/performanceAnalyzer.js";
import { generateContextDiff } from "../utils/contextDiff.js";
import { detectDeadCode } from "../utils/deadCodeDetector.js";
import { analyzeDocCoverage } from "../utils/docCoverageAnalyzer.js";
import { detectCICD } from "../utils/cicdDetector.js";
import { detectMigrations } from "../utils/migrationDetector.js";
import { isContextFresh, verifyAIContext } from "../core/services/doctorService.js";
import { generateContext } from "../core/services/contextService.js";
import { getContextForTask } from "../core/services/taskContextService.js";
import { getMcpCompatibilityProfiles, getMcpDoctor, installMcpProfile, normalizeMcpPlatform } from "../core/services/mcpCompatibilityService.js";
import { understandTopic } from "../core/services/understandService.js";
import { Database } from "sql.js";
import ora from "ora";
import { startMCP, startMCPHttpServer } from "../mcp/index.js";
import { cloneAndInit, isLargeRepo } from "../utils/remoteUtils.js";
import process from "process";
import util from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AIFirstOptions {
  rootDir?: string;
  outputDir?: string;
  excludePatterns?: string[];
  includeExtensions?: string[];
}

export interface AIFirstResult {
  success: boolean;
  filesCreated: string[];
  error?: string;
}

function getAIFirstVersion(): string {
  try {
    const packagePath = path.resolve(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8")) as { version?: string };
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

function installSynchronousConsoleForPipedOutput(): void {
  if (process.stdout.isTTY && process.stderr.isTTY) return;

  console.log = (...args: unknown[]) => {
    fs.writeSync(1, util.format(...args) + "\n");
  };
  console.error = (...args: unknown[]) => {
    fs.writeSync(2, util.format(...args) + "\n");
  };
}

/**
 * Main function to run ai-first command
 */
export async function runAIFirst(options: AIFirstOptions = {}): Promise<AIFirstResult> {
  return generateContext({
    ...options,
    onProgress: (message) => console.log(message),
    onError: (message) => console.error(message),
  });
}

/**
 * Generate machine-readable repo_map.json
 */
function generateRepoMapJson(files: { relativePath: string; name: string; extension: string }[]): string {
  const tree: Record<string, unknown> = {};
  
  for (const file of files) {
    const parts = file.relativePath.split("/");
    let current = tree;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      
      if (isFile) {
        current[part] = { type: "file", extension: file.extension };
      } else {
        if (!current[part]) {
          current[part] = { type: "directory", children: {} };
        }
        current = (current[part] as { children: Record<string, unknown> }).children;
      }
    }
  }

  return JSON.stringify({
    generated: new Date().toISOString(),
    totalFiles: files.length,
    structure: tree,
    files: files.map(f => ({
      path: f.relativePath,
      name: f.name,
      extension: f.extension,
    })),
  }, null, 2);
}

function printFreshnessReport(rootDir: string, outputDir: string, jsonMode: boolean): void {
  const freshness = isContextFresh(rootDir, outputDir);
  if (jsonMode) {
    console.log(JSON.stringify(freshness, null, 2));
    return;
  }

  console.log("\n🧾 AI Context Freshness\n");
  console.log(`Status: ${freshness.fresh ? "fresh" : "stale"}`);
  console.log(`Reason: ${freshness.reason}`);
  console.log(`Manifest: ${freshness.manifestPath}`);
  if (freshness.generatedAt) console.log(`Generated: ${freshness.generatedAt}`);
  console.log(`Commit: ${freshness.manifestCommit || "unknown"} → ${freshness.currentCommit || "unknown"}`);
  console.log(`Dirty worktree: ${freshness.dirty ? "yes" : "no"}`);

  const changed = [...freshness.changedFiles, ...freshness.missingFiles, ...freshness.addedFiles].slice(0, 15);
  if (changed.length > 0) {
    console.log("\nChanged files:");
    for (const file of changed) console.log(`  - ${file}`);
  }
}

function printVerificationReport(rootDir: string, outputDir: string, jsonMode: boolean): number {
  const result = verifyAIContext(rootDir, outputDir);
  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
    return result.status === "trusted" ? 0 : 1;
  }

  console.log("\n🧪 AI Context Verification\n");
  console.log(`Truth Score: ${result.score}/100 (${result.status})`);
  console.log(`Context: ${result.outputDir}\n`);

  for (const check of result.checks) {
    const icon = check.status === "pass" ? "✔" : check.status === "warn" ? "⚠" : "✖";
    console.log(`${icon} ${check.id}: ${check.message}`);
  }

  return result.status === "trusted" ? 0 : 1;
}

// CLI entry point
// Check if run directly (not imported as module)
const isMain = !import.meta.url || 
  process.argv[1]?.includes('ai-first') ||
  process.argv[1]?.includes('af') ||
  process.argv[1] === undefined;

if (isMain) {
  installSynchronousConsoleForPipedOutput();

  const args = process.argv.slice(2);
  const options: AIFirstOptions = {};

  if (args.includes('--completions') || args.includes('-c')) {
    const script = `#!/bin/bash
_af_completions() {
  local cur prev
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  commands="init index watch context summarize query doctor explore map adapters git graph update"
  if [ $COMP_CWORD -eq 1 ]; then
    COMPREPLY=( $(compgen -W "$commands" -- "$cur") )
  fi
}
complete -F _af_completions af`;
    console.log(script);
    process.exit(0);
  }

  // Handle commands
  const command = args[0];
  
  if (command === 'index') {
    // Index command - generate SQLite database
    args.shift();
    let rootDir = process.cwd();
    let outputPath: string | null = null;
    let semanticMode = false;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case "--root":
        case "-r":
          rootDir = args[++i];
          break;
        case "--output":
        case "-o":
          outputPath = args[++i];
          break;
        case "--semantic":
        case "-s":
          semanticMode = true;
          break;
        case "--help":
        case "-h":
          console.log(`
ai-first index - Generate SQLite index with adaptive processing

Usage: ai-first index [options]

Options:
  -r, --root <dir>      Root directory to scan (default: current directory)
  -o, --output <path>  Output path for index.db (default: ./ai-context/index.db)
  -s, --semantic       Force semantic indexing
  -h, --help           Show help message

Adaptive thresholds:
  <200 files    → structural index only
  200-2000     → structural + module graph  
  >2000        → enable semantic indexing

Example queries (for AI agents):
  Find functions:    SELECT s.name, s.line FROM symbols s JOIN files f ON s.file_id = f.id WHERE f.path = 'src/index.ts' AND s.type = 'function'
  Find symbol:       SELECT f.path, s.line FROM symbols s JOIN files f ON s.file_id = f.id WHERE s.name = 'MyClass'
  Find imports:       SELECT f.path, i.target_file FROM imports i JOIN files f ON i.source_file_id = f.id WHERE f.path = 'src/utils.ts'
`);
          process.exit(0);
      }
    }

    if (!outputPath) {
      outputPath = getIndexDbPath(rootDir);
    }

    const aiDir = path.join(rootDir, "ai-context");
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(aiDir)) {
      fs.mkdirSync(aiDir, { recursive: true });
    }

    // Load existing index state for incremental indexing
    const existingState = loadIndexState(aiDir);
    
    // Scan repository
    const scanResult = scanRepo(rootDir);
    const fileCount = scanResult.totalFiles;
    
    // Get list of files that need indexing
    const allFiles = scanResult.files.map(f => f.path);
    const { toIndex, unchanged, new: newFiles, deleted } = getFilesToIndex(
      allFiles, 
      rootDir, 
      existingState
    );
    
    // Adaptive indexing based on repo size
    let useSemantic = semanticMode;
    if (!useSemantic && fileCount > 2000) {
      console.log(`⚠️  Large repository detected (${fileCount} files)`);
      console.log("Enabling semantic indexing...\n");
      useSemantic = true;
    }
    
    console.log(`\n🗄️  Generating index for: ${rootDir}\n`);
    console.log(`   Total files: ${fileCount}`);
    console.log(`   To index: ${toIndex.length}`);
    console.log(`   Unchanged: ${unchanged}`);
    if (existingState && newFiles > 0) console.log(`   New: ${newFiles}`);
    if (existingState && deleted > 0) console.log(`   Deleted: ${deleted}`);
    console.log("");
    
    if (useSemantic) {
      console.log("🔎 Semantic mode enabled.\n");
    }
    
    // Generate files.json
    const filesJson = { files: scanResult.files.map(f => ({ path: f.relativePath, name: f.name, ext: f.extension })) };
    fs.writeFileSync(path.join(aiDir, "files.json"), JSON.stringify(filesJson, null, 2));
    console.log("   ✅ Created files.json");
    
    // Generate modules.json
    const modules: Record<string, { path: string; files: string[] }> = {};
    for (const file of scanResult.files) {
      const parts = file.relativePath.split('/');
      if (parts.length > 1 && parts[0] !== AI_CONTEXT_DIR && parts[0] !== 'ai') {
        if (!modules[parts[0]]) modules[parts[0]] = { path: parts[0], files: [] };
        modules[parts[0]].files.push(file.relativePath);
      }
    }
    fs.writeFileSync(path.join(aiDir, "modules.json"), JSON.stringify({ modules }, null, 2));
    console.log("   ✅ Created modules.json");
    
    // Generate SQL index (only for changed files in incremental mode)
    generateIndex(rootDir, outputPath).then(async (result) => {
      if (result.success) {
        console.log(`✅ Index created: ${result.dbPath}`);
        console.log(`   Files: ${result.stats.files}`);
        console.log(`   Symbols: ${result.stats.symbols}`);
        console.log(`   Imports: ${result.stats.imports}`);
        
        // Save index state for incremental indexing
        const fileStates: Record<string, { path: string; hash: string; mtime: number; size: number; indexedAt: string }> = {};
        for (const file of scanResult.files) {
          const hashData = computeFileHash(file.path);
          if (hashData) {
            fileStates[file.relativePath] = {
              path: file.relativePath,
              hash: hashData.hash,
              mtime: hashData.mtime,
              size: hashData.size,
              indexedAt: new Date().toISOString()
            };
          }
        }
        fs.writeFileSync(path.join(aiDir, "index-state.json"), JSON.stringify({
          version: "1.0.0",
          lastIndexed: new Date().toISOString(),
          totalFiles: scanResult.totalFiles,
          files: fileStates
        }, null, 2));
        console.log("   ✅ Updated index-state.json");
        
        // Generate semantic embeddings if requested
        if (useSemantic) {
          console.log("\n🔎 Generating semantic embeddings...");
          try {
            const filePaths = scanResult.files
              .filter(f => f.extension && ['ts', 'js', 'py', 'go', 'rs', 'java'].includes(f.extension))
              .map(f => f.path);
            
            console.log(`   Processing ${filePaths.length} code files...`);
            const chunks = chunkFiles(filePaths);
            console.log(`   Created ${chunks.length} chunks`);
            
            const { embeddings, model } = await generateEmbeddings(chunks);
            
            const initSqlJs = (await import("sql.js")).default;
            const SQL = await initSqlJs();
            const dbPath = outputPath || getIndexDbPath(rootDir);
            let db: Database;
            if (fs.existsSync(dbPath)) {
              const fileBuffer = fs.readFileSync(dbPath);
              db = new SQL.Database(fileBuffer);
            } else {
              db = new SQL.Database();
            }
            createEmbeddingsTable(db);
            saveEmbeddings(db, embeddings, model, 384);
            const data = db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(dbPath, buffer);
            db.close();
            console.log("   ✅ Semantic indexing complete");
          } catch (error) {
            console.log("   ⚠️  Semantic indexing failed:", error);
          }
        }
        console.log(`\n📊 Example queries agents can run:`);
        console.log(`   - Find all functions in a file`);
        console.log(`   - Find where a symbol is defined`);
        console.log(`   - Find all files importing a module`);
        console.log(`   - Search symbols by name pattern`);
        process.exit(0);
      } else {
        console.error(`❌ Error: ${result.error}`);
        process.exit(1);
}
    });
  } else if (command === 'watch') {
    // Watch command - incremental indexing
    args.shift();
    let rootDir = process.cwd();
    let outputPath = getIndexDbPath(rootDir);
    let semanticMode = false;
    let debounceMs = 300;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case "--root":
        case "-r":
          rootDir = args[++i];
          break;
        case "--output":
        case "-o":
          outputPath = args[++i];
          break;
        case "--debounce":
        case "-d":
          debounceMs = parseInt(args[++i], 10);
          break;
        case "--help":
        case "-h":
          console.log(`
ai-first watch - Watch for file changes and update index incrementally

Usage: ai-first watch [options]

Options:
  -r, --root <dir>       Root directory to watch (default: current directory)
  -o, --output <path>   Output path for index.db (default: ./ai-context/index.db)
  -d, --debounce <ms>   Debounce delay in ms (default: 300)
  -h, --help            Show help message

Features:
  - Incremental updates (only changed files are re-indexed)
  - File hash tracking for change detection
  - Debounced updates to handle rapid file changes
  - Press Ctrl+C to stop watching
`);
          process.exit(0);
      }
    }

    console.log(`\n🚀 Starting incremental indexer in watch mode...`);
    
    const indexer = new IncrementalIndexer(rootDir, outputPath, debounceMs);
    
    indexer.initialize().then(async () => {
      // Build initial index if not exists
      if (!require('fs').existsSync(outputPath)) {
        console.log("Building initial index...");
        await generateIndex(rootDir, outputPath);
        console.log("Initial index built.\n");
      }
      
      await indexer.watch();
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log("\nSaving changes...");
        indexer.save();
        indexer.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        indexer.save();
        indexer.stop();
        process.exit(0);
      });
    }).catch((error) => {
      console.error("Failed to initialize indexer:", error);
      process.exit(1);
});
  } else if (command === 'context') {
    args.shift();
    let rootDir = process.cwd();
    let outputDir = path.join(rootDir, "ai-context");
    let symbolArg: string | undefined;
    let taskArg: string | undefined;
    let depth = 1;
    let maxSymbols = 50;
    let format: "json" | "markdown" | "text" = "json";
    let save = false;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("-")) {
        switch (arg) {
          case "--root":
          case "-r":
            rootDir = args[++i];
            outputDir = path.join(rootDir, "ai-context");
            break;
          case "--output":
          case "-o":
            outputDir = args[++i];
            break;
          case "--depth":
          case "-d":
            depth = parseInt(args[++i], 10) || 1;
            break;
          case "--max-symbols":
          case "-m":
            maxSymbols = parseInt(args[++i], 10) || 50;
            break;
          case "--format":
          case "-f":
            const fmt = args[++i];
            if (["json", "markdown", "text"].includes(fmt)) {
              format = fmt as "json" | "markdown" | "text";
            }
            break;
          case "--task":
          case "-t":
            taskArg = args[++i];
            break;
          case "--help":
          case "-h":
            console.log(`
ai-first context - Generate AI context optimized for LLMs

Usage: ai-first context [symbol] [options]

Arguments:
  symbol              Symbol name or ID to generate context for (optional)

Options:
  -r, --root <dir>        Root directory (default: current directory)
  -o, --output <dir>     Output directory (default: ./ai-context)
  -d, --depth <n>        Graph traversal depth (default: 1)
  -m, --max-symbols <n>  Max related symbols (default: 50)
  -f, --format <fmt>      Output format: json, markdown, text (default: json)
  -t, --task <task>       Generate task-specific context (e.g., "add-endpoint", "fix-bug")
  -s, --save              Save context packet to file
  -h, --help              Show help message

Examples:
  ai-first context loginUser
  ai-first context loginUser --depth 2
  ai-first context loginUser --format markdown
  ai-first context --task "add-endpoint"
  ai-first context --task "fix-auth-bug" --format markdown
  ai-first context -t "add-model" -s
`);
            process.exit(0);
          case "--save":
          case "-s":
            save = true;
            break;
        }
      } else {
        symbolArg = arg;
      }
    }

    if (taskArg) {
      console.log(`\n🎯 Generating task-specific context: ${taskArg}`);
      const taskContext = getContextForTask(rootDir, taskArg);
        
      if (format === "json") {
        console.log(JSON.stringify(taskContext, null, 2));
      } else if (format === "markdown") {
        console.log(`# Task Context: ${taskArg}\n`);
        console.log(`**Kind**: ${taskContext.kind}`);
        console.log(`\n${taskContext.summary}\n`);
        console.log(`## Relevant Files\n`);
        for (const file of taskContext.relevantFiles) {
          console.log(`- \`${file.path}\` (${file.confidence}) - ${file.reason}`);
        }
        console.log(`\n## Related Tests\n`);
        for (const test of taskContext.relatedTests) {
          console.log(`- \`${test.path}\` (${test.confidence}) - ${test.reason}`);
        }
        console.log(`\n## Commands\n`);
        for (const command of taskContext.commands) {
          console.log(`- \`${command.command}\` - ${command.reason}`);
        }
        console.log(`\n## Risks\n`);
        for (const risk of taskContext.risks) {
          console.log(`- ${risk}`);
        }
        console.log(`\n## Contracts\n`);
        for (const contract of taskContext.contracts) {
          console.log(`- ${contract}`);
        }
      } else {
        console.log(`Task: ${taskContext.task}`);
        console.log(`Kind: ${taskContext.kind}`);
        console.log(`\nRelevant files:`);
        for (const file of taskContext.relevantFiles) {
          console.log(`  - ${file.path} (${file.confidence}) ${file.reason}`);
        }
        console.log(`\nCommands:`);
        for (const command of taskContext.commands) {
          console.log(`  - ${command.command} (${command.reason})`);
        }
      }

      if (save) {
        const savePath = path.join(outputDir, `task-${taskArg.replace(/\s+/g, "-")}.json`);
        ensureDir(outputDir);
        writeFile(savePath, JSON.stringify(taskContext, null, 2));
        console.log(`\n✅ Saved to: ${savePath}`);
      }
      process.exit(0);
    } else if (symbolArg) {
      console.log(`\n🎯 Generating context for symbol: ${symbolArg}`);
      console.log(`   Depth: ${depth}, Max: ${maxSymbols}, Format: ${format}\n`);

      import("../core/contextPacket.js").then(({ generateContextPacket, saveContextPacket }) => {
        const packet = generateContextPacket(symbolArg!, outputDir, rootDir, { depth, format, maxSymbols });
        
        if (packet) {
          if (format === "markdown" || format === "text") {
            console.log(packet);
          } else {
            console.log("\n📦 Symbol Context Packet:");
            console.log(`   ID: ${packet.symbol.id}`);
            console.log(`   Type: ${packet.symbol.type}`);
            console.log(`   Module: ${packet.module}`);
            console.log(`   File: ${packet.symbol.file}:${packet.symbol.line}`);
            console.log(`   Score: ${packet.relevanceScore || 0}`);
            console.log(`\n📊 Relationships:`);
            console.log(`   Calls: ${packet.relationships.calls.length}`);
            console.log(`   Called by: ${packet.callers.length}`);
            console.log(`   Imports: ${packet.relationships.imports.length}`);
            console.log(`   Exports: ${packet.relationships.exports?.length || 0}`);
            console.log(`   References: ${packet.relationships.references?.length || 0}`);
            console.log(`   Related symbols: ${packet.relatedSymbols.length}`);
            console.log(`\n📝 Summary: ${packet.summary}`);
          }
          
          if (save) {
            const savePath = saveContextPacket(packet, outputDir, format);
            console.log(`\n✅ Saved to: ${path.relative(rootDir, savePath)}`);
          }
          
          process.exit(0);
        } else {
          process.exit(1);
        }
      }).catch((error) => {
        console.error("Error:", error.message);
        process.exit(1);
      });
    } else {
      console.log(`\n🤖 Generating AI context for: ${rootDir}\n`);
      generateAIContext(rootDir, outputDir).then((result) => {
        if (result.success) {
          console.log("✅ AI Context generated!");
          process.exit(0);
        } else {
          console.error(`❌ Error: ${result.error}`);
          process.exit(1);
        }
      });
    }
  } else if (command === 'summarize') {
    // Summarize command - generate hierarchical repository summaries
    args.shift();
    let rootDir = process.cwd();
    let outputPath = getHierarchyPath(rootDir);

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case "--root":
        case "-r":
          rootDir = args[++i];
          break;
        case "--output":
        case "-o":
          outputPath = args[++i];
          break;
        case "--help":
        case "-h":
          console.log(`
ai-first summarize - Generate hierarchical repository summaries

Usage: ai-first summarize [options]

Options:
  -r, --root <dir>      Root directory (default: current directory)
  -o, --output <path>   Output path (default: ./ai-context/hierarchy.json)
  -h, --help            Show help message

Output:
  hierarchy.json with repo, folder, and file summaries optimized for AI navigation.
`);
          process.exit(0);
      }
    }

    console.log(`\n📊 Generating hierarchical summary for: ${rootDir}\n`);

    generateHierarchy(rootDir, outputPath).then((result) => {
      if (result.success) {
        console.log("✅ Hierarchy generated successfully!");
        console.log("\n📁 Summary:");
        console.log(`   Repository: ${result.summary.repo}`);
        console.log(`   Folders: ${Object.keys(result.summary.folders).length}`);
        console.log(`   Files: ${Object.keys(result.summary.files).length}`);
        console.log("\nOutput:", outputPath);
        process.exit(0);
      } else {
        console.error(`❌ Error: ${result.error}`);
        process.exit(1);
      }
    });
  } else if (command === 'query') {
    // Query command - query the SQLite index
    args.shift();
    const queryType = args.shift();
    let rootDir = process.cwd();
    let dbPath = getIndexDbPath(rootDir);

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case "--root":
        case "-r":
          rootDir = args[++i];
          dbPath = getIndexDbPath(rootDir);
          break;
        case "--db":
        case "-d":
          dbPath = args[++i];
          break;
      }
    }

    if (!queryType) {
      console.log(`
ai-first query - Query the SQLite index

Usage: ai-first query <subcommand> [options]

Subcommands:
  symbol <name>        Find symbol definitions
  dependents <file>   Find files that depend on a file
  imports <file>       Find files imported by a file
  exports <file>       Find exports in a file
  files                List all indexed files
  stats                Show index statistics

Options:
  -r, --root <dir>   Root directory (default: current directory)
  -d, --db <path>    Database path (default: ./ai-context/index.db)
  -h, --help         Show help message
`);
      process.exit(0);
    }

    // Run query
    import("sql.js").then(({ default: initSqlJs }) => {
      return initSqlJs();
    }).then((SQL) => {
      if (!fs.existsSync(dbPath)) {
        console.error(`❌ Index not found: ${dbPath}`);
        console.log(`Run 'ai-first index' first to create the index.`);
        process.exit(1);
      }

      const fileBuffer = fs.readFileSync(dbPath);
      const db = new SQL.Database(fileBuffer);

      if (queryType === 'symbol') {
        const symbolName = args[0];
        if (!symbolName) {
          console.error("Please provide a symbol name");
          process.exit(1);
        }

        console.log(`\n🔍 Searching for symbol: ${symbolName}\n`);

        const results = db.exec(`
          SELECT s.name, s.type, s.line, f.path
          FROM symbols s
          JOIN files f ON s.file_id = f.id
          WHERE s.name LIKE '%' || ? || '%'
          ORDER BY s.type, f.path, s.line
          LIMIT 50
        `, [symbolName]);

        if (results.length === 0 || results[0].values.length === 0) {
          console.log("No symbols found.");
        } else {
          console.log("Found symbols:\n");
          console.log("Name                | Type       | File                    | Line");
          console.log("-------------------|------------|-------------------------|------");
          for (const row of results[0].values) {
            console.log(`${String(row[0]).padEnd(19)}| ${String(row[1]).padEnd(10)}| ${String(row[3]).padEnd(24)}| ${row[2]}`);
          }
          console.log(`\nTotal: ${results[0].values.length} symbols`);
        }
      } else if (queryType === 'dependents') {
        const fileName = args[0];
        if (!fileName) {
          console.error("Please provide a file name");
          process.exit(1);
        }

        console.log(`\n🔍 Finding files that depend on: ${fileName}\n`);

        const fileResult = db.exec("SELECT id, path FROM files WHERE path LIKE '%' || ? || '%'", [fileName]);

        if (fileResult.length === 0 || fileResult[0].values.length === 0) {
          console.log("File not found in index.");
          db.close();
          process.exit(1);
        }

        const fileId = fileResult[0].values[0][0];
        const filePath = fileResult[0].values[0][1];

        console.log(`File: ${filePath}\n`);

        const baseName = fileName.replace(/\.[^.]+$/, '');
        const results = db.exec(`
          SELECT f.path, i.type, i.target_file
          FROM imports i
          JOIN files f ON i.source_file_id = f.id
          WHERE i.target_file LIKE '%' || ? || '%'
          ORDER BY f.path
        `, [baseName]);

        if (results.length === 0 || results[0].values.length === 0) {
          console.log("No dependent files found.");
        } else {
          console.log("Dependent files:\n");
          console.log("File                    | Type    | Imports");
          console.log("------------------------|---------|-------------------");
          for (const row of results[0].values) {
            console.log(`${String(row[0]).padEnd(24)}| ${String(row[1]).padEnd(7)}| ${row[2]}`);
          }
          console.log(`\nTotal: ${results[0].values.length} dependent files`);
        }
      } else if (queryType === 'imports') {
        const fileName = args[0];
        if (!fileName) {
          console.error("Please provide a file name");
          process.exit(1);
        }

        console.log(`\n🔍 Finding imports in: ${fileName}\n`);

        const results = db.exec(`
          SELECT i.target_file, i.type
          FROM imports i
          JOIN files f ON i.source_file_id = f.id
          WHERE f.path LIKE '%' || ? || '%'
          ORDER BY i.type, i.target_file
        `, [fileName]);

        if (results.length === 0 || results[0].values.length === 0) {
          console.log("No imports found.");
        } else {
          console.log("Imports:\n");
          console.log("Target                     | Type");
          console.log("---------------------------|------");
          for (const row of results[0].values) {
            console.log(`${String(row[0]).padEnd(27)}| ${row[1]}`);
          }
          console.log(`\nTotal: ${results[0].values.length} imports`);
        }
      } else if (queryType === 'exports') {
        const fileName = args[0];
        if (!fileName) {
          console.error("Please provide a file name");
          process.exit(1);
        }

        console.log(`\n🔍 Finding exports in: ${fileName}\n`);

        const results = db.exec(`
          SELECT s.name, s.type, s.line
          FROM symbols s
          JOIN files f ON s.file_id = f.id
          WHERE f.path LIKE '%' || ? || '%' AND s.exported = 1
          ORDER BY s.type, s.line
        `, [fileName]);

        if (results.length === 0 || results[0].values.length === 0) {
          console.log("No exports found.");
        } else {
          console.log("Exports:\n");
          console.log("Name                | Type       | Line");
          console.log("-------------------|------------|------");
          for (const row of results[0].values) {
            console.log(`${String(row[0]).padEnd(19)}| ${String(row[1]).padEnd(10)}| ${row[2]}`);
          }
          console.log(`\nTotal: ${results[0].values.length} exports`);
        }
      } else if (queryType === 'files') {
        console.log("\n📁 Indexed files:\n");

        const results = db.exec("SELECT path, language FROM files ORDER BY path LIMIT 100");

        if (results.length > 0 && results[0].values.length > 0) {
          console.log("File                              | Language");
          console.log("----------------------------------|-----------");
          for (const row of results[0].values) {
            console.log(`${String(row[0]).padEnd(34)}| ${row[1]}`);
          }

          const countResult = db.exec("SELECT COUNT(*) FROM files");
          const total = countResult[0]?.values[0]?.[0] || 0;
          console.log(`\nTotal files: ${total}`);
        }
      } else if (queryType === 'stats') {
        console.log("\n📊 Index Statistics:\n");

        const fileCount = db.exec("SELECT COUNT(*) FROM files");
        const symbolCount = db.exec("SELECT COUNT(*) FROM symbols");
        const importCount = db.exec("SELECT COUNT(*) FROM imports");
        const hashCount = db.exec("SELECT COUNT(*) FROM file_hashes");

        console.log(`Files:     ${fileCount[0]?.values[0]?.[0] || 0}`);
        console.log(`Symbols:   ${symbolCount[0]?.values[0]?.[0] || 0}`);
        console.log(`Imports:   ${importCount[0]?.values[0]?.[0] || 0}`);
        console.log(`Hashes:    ${hashCount[0]?.values[0]?.[0] || 0}`);

        console.log("\n📈 Languages:\n");
        const langResults = db.exec("SELECT language, COUNT(*) as count FROM files GROUP BY language ORDER BY count DESC");
        if (langResults.length > 0 && langResults[0].values.length > 0) {
          console.log("Language     | Count");
          console.log("-------------|-------");
          for (const row of langResults[0].values) {
            console.log(`${String(row[0]).padEnd(12)}| ${row[1]}`);
          }
        }

        console.log("\n🔤 Symbol Types:\n");
        const typeResults = db.exec("SELECT type, COUNT(*) as count FROM symbols GROUP BY type ORDER BY count DESC");
        if (typeResults.length > 0 && typeResults[0].values.length > 0) {
          console.log("Type      | Count");
          console.log("----------|-------");
          for (const row of typeResults[0].values) {
            console.log(`${String(row[0]).padEnd(10)}| ${row[1]}`);
          }
        }
      } else {
        console.log(`Unknown query type: ${queryType}`);
        console.log("Available: symbol, dependents, imports, exports, files, stats");
        process.exit(1);
      }

      db.close();
      process.exit(0);
    }).catch((error) => {
      console.error("Error:", error.message);
      process.exit(1);
    });
  } else if (command === 'init' || !command) {
    // Init command - generate all context files
    if (command === 'init') args.shift();
    
    let preset: string | undefined;

    let installMcp = false;
    let diffMode = false;
    let jsonMode = false; 
    let watchMode = false;
    let smartMode = false;
    let templateFile: string | undefined;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case "--root":
        case "-r":
          options.rootDir = args[++i];
          break;
        case "--output":
        case "-o":
          options.outputDir = args[++i];
          break;
        case "--preset":
        case "-p":
          preset = args[++i];
          break;
        case "--install-mcp":
        case "--mcp":
          installMcp = true;
          break;
        case "--diff":
        case "-d":
          diffMode = true;
          break;
        case "--json":
        case "-j":
          jsonMode = true;
          break;
        case "--smart": smartMode = true; break;
        case "--template": templateFile = args[++i]; break;
        case "--repo": options.rootDir = await cloneAndInit(args[++i]); break;
        case "--plugin": try { await import(path.resolve(args[++i])); console.log("✅ Plugin loaded"); } catch(_) { console.error("❌ Plugin error:", (_ as Error).message); } break;
        case "--watch":
        case "-w":
          watchMode = true;
          break;
        case "--help":
        case "-h":
          console.log(`
iai-first - Generate AI context for your repository

Usage: ai-first [command] [options]

Commands:
  init                 Generate AI context files (default)
  index                Generate SQLite index database
  watch                Watch for file changes (incremental indexing)
  context              Generate LLM-optimized context
  summarize            Generate hierarchical repository summaries
  query                Query the index (symbol, dependents, imports, exports, stats)
  doctor               Check repository health and AI readiness
  doctor --ci          Run quality gates for CI/agents
  doctor context       Check whether generated AI context is fresh
  verify ai-context    Audit generated AI context for agent trust
  explore <module>     Explore module dependencies
  map                  Generate repository map (files, modules, graph)
  adapters             List available adapters
  git                  Show git activity and recent changes
  graph                Build knowledge graph
  update               Update context incrementally
  mcp                  Start MCP server for AI agents

Options:
  -r, --root <dir>      Root directory to scan (default: current directory)
  -o, --output <dir>   Output directory (default: ./ai-context)
  -p, --preset <name>  Use preset (full, quick, api, docs)
  --install-mcp         Configure OpenCode MCP server automatically
  -h, --help           Show help message

Presets:
  full    Complete analysis with all features
  quick   Fast analysis for development iterations
  api     Focus on API endpoints and services
  docs    Documentation files only
`);
          process.exit(0);
      }
    }
    
    const rootDir = options.rootDir || process.cwd();
    if (smartMode) {
      const { isLargeRepo: checkRepo } = await import("../utils/remoteUtils.js");
      if (checkRepo(rootDir)) {
        console.log("\n🧠 Smart mode: optimizing for large repository...");
        options.excludePatterns = [...(options.excludePatterns || []), "*.generated.*", "*.min.*", "*.bundle.*"];
      }
    }
    const configPath = path.join(rootDir, 'ai-first.config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.output?.directory && !options.outputDir) {
          options.outputDir = path.join(rootDir, config.output.directory);
        }
        if (config.preset && !preset) {
          preset = config.preset;
        }
      } catch {}
    }
    
    if (preset) {
      console.log(`\n🎛️  Using preset: ${preset}\n`);
    }

    runAIFirst(options).then(async (result) => {
      if (result.success && installMcp) {
        const rootDir = options.rootDir || process.cwd();
        try {
          const mcpInstall = installMcpProfile({
            rootDir,
            platform: "opencode-legacy",
            command: "af",
          });
          const mcpConfigPath = mcpInstall.filesWritten[0] || path.join(rootDir, ".opencode", "mcp.json");
          console.log(`\n✅ MCP server configured at ${mcpConfigPath}`);
          console.log(`   Restart OpenCode to use the MCP server`);
        } catch (err) {
          console.error(`\n⚠️  Failed to write MCP config:`, err);
        }
      }

      if (result.success && diffMode) {
        const rootDir = options.rootDir || process.cwd();
        const outputDir = options.outputDir || path.join(rootDir, "ai-context");
        const { generateContextDiff } = await import("../utils/contextDiff.js");
        const diff = generateContextDiff(outputDir);
        console.log(`\n📊 Context Diff: ${diff.summary}`);
      }

      if (result.success && jsonMode) {
        const rootDir = options.rootDir || process.cwd();
        const summary = { success: true, filesCreated: result.filesCreated.map((f: string) => path.relative(rootDir, f)) };
        console.log(JSON.stringify(summary));
        process.exit(0);
      }

      if (watchMode) {
        const rootDir = options.rootDir || process.cwd();
        console.log(`\n👁️  Watching for changes. Press Ctrl+C to stop.\n`);
        const chokidar = await import("chokidar");
        const watcher = chokidar.watch(rootDir, {
          ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/ai-context/**"],
          ignoreInitial: true,
        });
        let debounce: ReturnType<typeof setTimeout> | null = null;
        watcher.on("change", (p: string) => {
          if (debounce) clearTimeout(debounce);
          debounce = setTimeout(() => {
            console.log(`\n🔄 File changed: ${path.relative(rootDir, p)}`);
            runAIFirst(options);
          }, 1000);
        });
        return; // don't exit in watch mode
      }

      process.exit(result.success ? 0 : 1);
    });
  } else if (command === 'map') {
    // Map command - generate all mapping files
    args.shift();
    let rootDir = process.cwd();
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === "--root" || arg === "-r") rootDir = args[++i];
      else if (arg === "--help" || arg === "-h") {
        console.log("\nai-first map - Generate repository map\nUsage: ai-first map [options]\nOptions: -r, --root <dir>\n");
        process.exit(0);
      }
    }
    
    
    console.log("\n🗺️  Generating repository map...\n");
    const scan = scanRepo(rootDir);
    const aiDir = path.join(rootDir, "ai-context");
    
    // files.json
    const filesJson = { files: scan.files.map(f => ({ path: f.relativePath, name: f.name, ext: f.extension })) };
    fs.writeFileSync(path.join(aiDir, "files.json"), JSON.stringify(filesJson, null, 2));
    console.log("   ✅ files.json");
    
    // modules.json
    const modules: Record<string, { path: string; files: string[] }> = {};
    for (const file of scan.files) {
      const parts = file.relativePath.split('/');
      if (parts.length > 1 && parts[0] !== 'ai') {
        if (!modules[parts[0]]) modules[parts[0]] = { path: parts[0], files: [] };
        modules[parts[0]].files.push(file.relativePath);
      }
    }
    fs.writeFileSync(path.join(aiDir, "modules.json"), JSON.stringify({ modules }, null, 2));
    console.log("   ✅ modules.json");
    
    // repo-map.json (use local generateRepoMapJson function)
    const repoMapData = JSON.parse(generateRepoMapJson(scan.files.map(f => ({ relativePath: f.relativePath, name: f.name, extension: f.extension }))));
    fs.writeFileSync(path.join(aiDir, "repo_map.json"), JSON.stringify(repoMapData, null, 2));
    console.log("   ✅ repo_map.json");
    
    // module-graph.json
    const { generateModuleGraph } = await import("../core/moduleGraph.js");
    await generateModuleGraph(rootDir, aiDir);
    console.log("   ✅ module-graph.json");
    
    // symbol-graph.json
    const { generateSymbolGraph } = await import("../core/symbolGraph.js");
    await generateSymbolGraph(rootDir, aiDir);
    console.log("   ✅ symbol-graph.json");
    
    // Generate semantic contexts (features and flows)
    const { features, flows } = generateSemanticContexts(aiDir);
    console.log(`   ✅ Created ${features.length} features, ${flows.length} flows`);
    
    process.exit(0);
  } else if (command === 'doctor') {
    if (args[1] === "context") {
      const doctorArgs = args.slice(2);
      let rootDir = process.cwd();
      let outputDir = path.join(rootDir, "ai-context");
      let jsonMode = false;
      let strictMode = false;

      for (let i = 0; i < doctorArgs.length; i++) {
        const arg = doctorArgs[i];
        if (arg === "--root" || arg === "-r") {
          rootDir = doctorArgs[++i];
          outputDir = path.join(rootDir, "ai-context");
        } else if (arg === "--output" || arg === "-o") {
          outputDir = doctorArgs[++i];
        } else if (arg === "--json" || arg === "-j") {
          jsonMode = true;
        } else if (arg === "--strict") {
          strictMode = true;
        } else if (arg === "--help" || arg === "-h") {
          console.log(`
ai-first doctor context - Check whether generated AI context is fresh

Usage: ai-first doctor context [options]

Options:
  -r, --root <dir>      Root directory (default: current directory)
  -o, --output <dir>   Context directory (default: ./ai-context)
  --strict             Include Context Truth Score checks
  -j, --json           Output JSON
  -h, --help           Show help message
`);
          process.exit(0);
        }
      }

      if (strictMode) {
        process.exit(printVerificationReport(rootDir, outputDir, jsonMode));
      }
      printFreshnessReport(rootDir, outputDir, jsonMode);
      process.exit(isContextFresh(rootDir, outputDir).fresh ? 0 : 1);
    }

    doctorMain(args.slice(1));
  } else if (command === 'verify') {
    args.shift();
    const target = args.shift();
    if (target !== "ai-context") {
      console.log("Usage: ai-first verify ai-context [--root dir] [--output dir] [--json]");
      process.exit(1);
    }

    let rootDir = process.cwd();
    let outputDir = path.join(rootDir, "ai-context");
    let jsonMode = false;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === "--root" || arg === "-r") {
        rootDir = args[++i];
        outputDir = path.join(rootDir, "ai-context");
      } else if (arg === "--output" || arg === "-o") {
        outputDir = args[++i];
      } else if (arg === "--json" || arg === "-j") {
        jsonMode = true;
      } else if (arg === "--help" || arg === "-h") {
        console.log(`
ai-first verify ai-context - Audit generated AI context for agent trust

Usage: ai-first verify ai-context [options]

Options:
  -r, --root <dir>      Root directory (default: current directory)
  -o, --output <dir>   Context directory (default: ./ai-context)
  -j, --json           Output JSON
  -h, --help           Show help message
`);
        process.exit(0);
      }
    }

    process.exit(printVerificationReport(rootDir, outputDir, jsonMode));
  } else if (command === 'explore') {
    exploreMain(args.slice(1));
  } else if (command === 'adapters') {
    // Adapters command - list available adapters
    args.shift();
    
    const showJson = args.includes('--json');
    
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
adapters - List available adapters

Usage: ai-first adapters [options]

Options:
  --json        Output as JSON
  -h, --help    Show help message

Examples:
  ai-first adapters
  ai-first adapters --json
`);
      process.exit(0);
    }
    
    const adapters = listAdapters();
    
    if (showJson) {
      console.log(JSON.stringify(adapters, null, 2));
    } else {
      console.log("\n📦 Available adapters:\n");
      console.log("Name                | Display Name");
      console.log("--------------------|-------------------");
      for (const adapter of adapters) {
        console.log(`${adapter.name.padEnd(18)}| ${adapter.displayName}`);
      }
      console.log(`\nTotal: ${adapters.length} adapters`);
    }
    process.exit(0);
  } else if (command === 'git') {
    // Git intelligence command
    args.shift();
    
    let rootDir = process.cwd();
    let aiDir = path.join(rootDir, "ai-context");
    let limit = 50;
    let showActivity = false;
    let showJson = false;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case "--root":
        case "-r":
          rootDir = args[++i];
          aiDir = path.join(rootDir, "ai-context");
          break;
        case "--limit":
        case "-n":
          limit = parseInt(args[++i], 10) || 50;
          break;
        case "--activity":
        case "-a":
          showActivity = true;
          break;
        case "--json":
          showJson = true;
          break;
        case "--help":
        case "-h":
          console.log(`
git - Analyze recent git activity

Usage: ai-first git [options]

Options:
  -r, --root <dir>     Root directory (default: current directory)
  -n, --limit <n>      Number of commits to analyze (default: 50)
  -a, --activity       Show commit activity details
  --json               Output as JSON
  -h, --help           Show help message

Examples:
  ai-first git
  ai-first git --limit 100
  ai-first git --activity
`);
          process.exit(0);
      }
    }
    
    if (!detectGitRepository(rootDir)) {
      console.log("❌ Not a git repository");
      process.exit(1);
    }
    
    console.log(`\n📊 Analyzing git activity in: ${rootDir}\n`);
    
    const result = generateGitContext(rootDir, aiDir);
    
    if (showJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("📁 Recent files:");
      for (const file of result.recentFiles.slice(0, 10)) {
        console.log(`   - ${file}`);
      }
      if (result.recentFiles.length > 10) {
        console.log(`   ... and ${result.recentFiles.length - 10} more`);
      }
      
      if (result.recentFeatures.length > 0) {
        console.log("\n🎯 Recent features:");
        console.log(`   ${result.recentFeatures.join(", ")}`);
      }
      
      if (result.recentFlows.length > 0) {
        console.log("\n🔄 Recent flows:");
        console.log(`   ${result.recentFlows.join(", ")}`);
      }
      
      if (showActivity && result.activity) {
        console.log("\n📈 Commit activity:");
        console.log(`   Total commits: ${result.activity.totalCommits}`);
        console.log(`   Date range: ${result.activity.dateRange.start.slice(0, 10)} - ${result.activity.dateRange.end.slice(0, 10)}`);
        
        const topFiles = Object.entries(result.activity.files)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        if (topFiles.length > 0) {
          console.log("\n   Most changed files:");
          for (const [file, count] of topFiles) {
            console.log(`   - ${file}: ${count} commits`);
          }
        }
      }
      
      console.log("\n✅ Generated:");
      console.log("   - ai/git/recent-files.json");
      console.log("   - ai/git/recent-features.json");
      console.log("   - ai/git/recent-flows.json");
      if (result.activity) {
        console.log("   - ai/git/commit-activity.json");
      }
    }
    process.exit(0);
  } else if (command === 'graph') {
    // Knowledge Graph command
    args.shift();
    
    let rootDir = process.cwd();
    let aiDir = path.join(rootDir, "ai-context");
    let showJson = false;
    let showStats = false;
    let showHtml = false;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case "--root":
        case "-r":
          rootDir = args[++i];
          aiDir = path.join(rootDir, "ai-context");
          break;
        case "--json":
          showJson = true;
          break;
        case "--stats": case "-s": showStats = true; break;
        case "--html": showHtml = true; break;
        case "--no-git": break;
          break;
        case "--help":
        case "-h":
          console.log(`
graph - Generate repository knowledge graph

Usage: ai-first graph [options]

Options:
  -r, --root <dir>   Root directory (default: current directory)
  -s, --stats        Show graph statistics
  --no-git           Skip git history analysis
  --json             Output as JSON
  -h, --help         Show help message

Examples:
  ai-first graph
  ai-first graph --stats
  ai-first graph --no-git
`);
          process.exit(0);
      }
    }

    const hasGit = detectGitRepository(rootDir);
    if (!hasGit) {
      console.log("⚠️  Not a git repository - generating graph from static analysis only");
    }
    
    console.log(`\n🕸️  Building knowledge graph in: ${rootDir}\n`);
    
    const graph = buildKnowledgeGraph(rootDir, aiDir);
    
    if (showJson) {
      console.log(JSON.stringify(graph, null, 2));
    } else {
      console.log("📊 Graph Statistics:");
      console.log(`   Nodes: ${graph.nodes.length}`);
      console.log(`   Edges: ${graph.edges.length}`);
      console.log(`   Sources: ${graph.metadata.sources.join(", ") || "none"}`);
      
      const nodeTypes = graph.nodes.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {} as Record<string, number>);
      const edgeTypes = graph.edges.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {} as Record<string, number>);
      
      console.log("\n📍 Node Types:");
      for (const [type, count] of Object.entries(nodeTypes)) {
        console.log(`   ${type}: ${count}`);
      }
      
      console.log("\n🔗 Edge Types:");
      for (const [type, count] of Object.entries(edgeTypes)) {
        console.log(`   ${type}: ${count}`);
      }
      
      console.log("\n✅ Generated:");
      console.log("   - ai/graph/knowledge-graph.json");
    }
    if (showHtml) {
      const htmlPath = path.join(aiDir, "graph.html");
      const templatePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "web", "graph.html");
      let html = "";
      if (fs.existsSync(templatePath)) {
        html = fs.readFileSync(templatePath, "utf-8");
      } else {
        html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AI Graph</title></head><body><h1>Dependency Graph</h1><p>Open in browser to see D3 visualization</p><script>fetch('module-graph.json').then(r=>r.json()).then(d=>document.body.innerHTML+='<pre>'+JSON.stringify(d,null,2)+'</pre>')</script></body></html>`;
      }
      fs.writeFileSync(htmlPath, html);
      console.log(`   ✅ graph.html (open in browser for interactive D3 view)`);
    }
    process.exit(0);
  } else if (command === 'update') {
    // Incremental update command
    args.shift();
    
    let rootDir = process.cwd();
    let aiDir = path.join(rootDir, "ai-context");
    let useGit = true;
    let showJson = false;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case "--root":
        case "-r":
          rootDir = args[++i];
          aiDir = path.join(rootDir, "ai-context");
          break;
        case "--no-git":
          useGit = false;
          break;
        case "--json":
          showJson = true;
          break;
        case "--help":
        case "-h":
          console.log(`
update - Incrementally update repository context

Usage: ai-first update [options]

Options:
  -r, --root <dir>   Root directory (default: current directory)
  --no-git            Use filesystem timestamps instead of git
  --json             Output as JSON
  -h, --help         Show help message

Examples:
  ai-first update
  ai-first update --no-git
`);
          process.exit(0);
      }
    }
    
    if (!fs.existsSync(aiDir)) {
      console.log("❌ AI context not found. Run 'ai-first init' first.");
      process.exit(1);
    }
    
    console.log(`\n🔄 Running incremental update in: ${rootDir}\n`);
    
    const result = runIncrementalUpdate(rootDir, aiDir);
    
    if (result.errors.length > 0) {
      console.log("⚠️  Errors:");
      for (const error of result.errors) {
        console.log(`   - ${error}`);
      }
    }
    
    if (showJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`📁 Changed files: ${result.changedFiles.length}`);
      if (result.changedFiles.length > 0) {
        for (const file of result.changedFiles.slice(0, 5)) {
          console.log(`   ${file.status}: ${file.path}`);
        }
        if (result.changedFiles.length > 5) {
          console.log(`   ... and ${result.changedFiles.length - 5} more`);
        }
      }
      
      console.log(`\n🔧 Updated:`);
      console.log(`   Symbols: ${result.updatedSymbols}`);
      console.log(`   Dependencies: ${result.updatedDependencies}`);
      console.log(`   Features: ${result.updatedFeatures.join(", ") || "none"}`);
      console.log(`   Flows: ${result.updatedFlows.join(", ") || "none"}`);
      console.log(`   Knowledge Graph: ${result.graphUpdated ? "✅" : "❌"}`);
    }
    
    process.exit(0);
  } else if (command === 'mcp') {
    // MCP command - start Model Context Protocol server
    args.shift();
    
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
ai-first mcp - Start Model Context Protocol server

Usage: ai-first mcp [options]
       ai-first mcp doctor [options]

Options:
  -r, --root <dir>    Root directory to scan (default: current directory)
  --transport <name>  stdio or http (default: stdio)
  --host <host>       HTTP host (default: 127.0.0.1)
  --port <port>       HTTP port (default: 3847)
  --path <path>       HTTP MCP endpoint path (default: /mcp)
  --token <token>     Require Authorization: Bearer token for HTTP MCP
  --allow-unsafe      Allow non-local HTTP bind without token
  --json              Print machine-readable output for doctor
  -h, --help          Show help message

Description:
  Starts an MCP server that allows AI agents (Claude Desktop, etc.) to
  query repository context using the Model Context Protocol.

The server provides these tools:
  - generate_context: Generate AI context for the repository
  - query_symbols: Look up symbols by name/type
  - get_architecture: Get architecture analysis
  - get_context_for_file: Get tests and evidence for a source file
  - understand_topic: Hybrid understanding for a repo topic
  - get_project_brief: Get the short agent-facing project brief
  - is_context_fresh: Check whether ai-context is fresh
  - run_doctor: Run freshness and trust checks
  - get_quality_gates: Evaluate CI/agent quality gates
  - get_mcp_compatibility: Explain supported MCP client profiles
  - verify_ai_context: Return Context Truth Score
  - analyze_changes: Analyze recent git changes
  - suggest_tests: Suggest tests for a source file
  - run_security_audit: Run security analysis

Examples:
  ai-first mcp                    # Start MCP server in current directory
  ai-first mcp --root ./my-project # Start with specific root directory
  ai-first mcp --transport http --port 3847
  AI_FIRST_MCP_TOKEN=secret ai-first mcp --transport http --host 0.0.0.0
  ai-first mcp doctor --json       # Check MCP compatibility setup
`);
      process.exit(0);
    }
    
    let rootDir = process.cwd();
    let showJson = false;
    let transportMode = "stdio";
    let host = "127.0.0.1";
    let port = 3847;
    let endpointPath = "/mcp";
    let authToken = process.env.AI_FIRST_MCP_TOKEN;
    let allowUnsafe = false;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === "--root" || arg === "-r") rootDir = args[++i];
      else if (arg === "--json" || arg === "-j") showJson = true;
      else if (arg === "--transport") transportMode = args[++i];
      else if (arg === "--host") host = args[++i];
      else if (arg === "--port") port = parseInt(args[++i], 10) || 3847;
      else if (arg === "--path") endpointPath = args[++i];
      else if (arg === "--token") authToken = args[++i];
      else if (arg === "--allow-unsafe") allowUnsafe = true;
    }

    if (args[0] === "doctor") {
      const result = getMcpDoctor({
        rootDir,
        transport: transportMode === "http" || transportMode === "streamable-http" ? "streamable-http" : "stdio",
        host,
        port,
        authToken,
        allowUnsafe,
      });
      if (showJson) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`\n🩺 MCP Doctor: ${result.ok ? "pass" : "needs attention"}\n`);
        console.log(`Root: ${result.rootDir}`);
        console.log(`Transport: ${result.transport}\n`);
        for (const check of result.checks) {
          const icon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
          console.log(`${icon} ${check.id}: ${check.message}`);
        }
      }
      process.exit(result.ok ? 0 : 1);
    }

    if (transportMode === "http" || transportMode === "streamable-http") {
      try {
        await startMCPHttpServer({
          rootDir,
          host,
          port,
          path: endpointPath,
          authToken,
          allowUnsafe,
        });
        console.log("\n🚀 Starting MCP server...\n");
        console.log(`   Root directory: ${rootDir}`);
        console.log("   Protocol: streamable-http");
        console.log(`   Endpoint: http://${host}:${port}${endpointPath}`);
        console.log(`   Health: http://${host}:${port}/health`);
        console.log(`   Auth: ${authToken ? "enabled" : "disabled"}`);
        console.log("\n   The server is now running and ready to accept MCP requests.");
        console.log("   Use Ctrl+C to stop.\n");
      } catch (error) {
        console.error("Error starting MCP HTTP server:", error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    } else if (transportMode !== "stdio") {
      console.error(`Unknown MCP transport "${transportMode}". Use: stdio, http`);
      process.exit(1);
    } else {
      console.log("\n🚀 Starting MCP server...\n");
      console.log(`   Root directory: ${rootDir}`);
      console.log("   Protocol: stdio");
      console.log("\n   The server is now running and ready to accept MCP requests.");
      console.log("   Use Ctrl+C to stop.\n");

      startMCP({ rootDir });
    }
  } else if (command === 'pr-description') {
    args.shift();
    let rootDir = process.cwd();
    let fromBranch = "HEAD~5";
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === "--root" || arg === "-r") rootDir = args[++i];
      else if (arg === "--from" || arg === "-f") fromBranch = args[++i];
      else if (arg === "--help" || arg === "-h") {
        console.log(`ai-first pr-description - Generate PR description from git changes\nUsage: ai-first pr-description [options]\nOptions:\n  -r, --root <dir>\n  -f, --from <ref>\n`);
        process.exit(0);
      }
    }
    console.log(`\n📝 Generating PR description since ${fromBranch}...\n`);
    try {
      const { execFileSync } = await import("child_process");
      const range = `${fromBranch}..HEAD`;
      const filesChanged = execFileSync("git", ["diff", "--name-only", range], { cwd: rootDir, encoding: "utf-8" }).trim().split("\n").filter(Boolean);
      const commits = execFileSync("git", ["log", "--oneline", range], { cwd: rootDir, encoding: "utf-8" }).trim().split("\n").filter(Boolean);
      console.log("# Commits");
      for (const c of commits.slice(0, 10)) console.log(`- ${c}`);
      console.log(`\n# Files Changed (${filesChanged.length} files)`);
      for (const f of filesChanged.slice(0, 15)) console.log(`- ${f}`);
    } catch (e) {
      const commits = getRecentCommits(rootDir, 3);
      const filesChanged = [...new Set(commits.flatMap(commit => commit.files))];
      console.log("# Commits");
      for (const c of commits.slice(0, 10)) console.log(`- ${c.hash.slice(0, 7)} ${c.message}`);
      console.log(`\n# Files Changed (${filesChanged.length} files)`);
      for (const f of filesChanged.slice(0, 15)) console.log(`- ${f}`);
    }
    process.exit(0);
  } else if (command === 'install-hook') {
    args.shift();
    let rootDir = process.cwd();
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--root" || args[i] === "-r") rootDir = args[++i];
    }
    const hooksDir = path.join(rootDir, ".git", "hooks");
    const hookPath = path.join(hooksDir, "pre-commit");
    ensureDir(hooksDir);
    fs.writeFileSync(hookPath, `#!/bin/bash
# AI context auto-update
af init --root "$(git rev-parse --show-toplevel)" --json 2>/dev/null
`);
    fs.chmodSync(hookPath, 0o755);
    console.log(`\n✅ Pre-commit hook installed: ${hookPath}`);
    process.exit(0);
  } else if (command === 'history') {
    args.shift();
    let rootDir = process.cwd();
    let limit = 5;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--root" || args[i] === "-r") rootDir = args[++i];
      else if (args[i] === "--limit" || args[i] === "-n") limit = parseInt(args[++i]) || 5;
    }
    console.log(`\n📜 Context history (last ${limit} commits):`);
    try {
      const { execSync } = await import("child_process");
      const commits = execSync(`git log --oneline -${limit}`, { cwd: rootDir, encoding: "utf-8" }).trim().split("\n");
      for (const c of commits) console.log(`  ${c}`);
    } catch (e) { console.error("Error:", (e as Error).message); }
    process.exit(0);
  } else if (command === 'serve') {
    const rootDir = process.cwd();
    const ctxPath = path.join(rootDir, "ai-context", "ai_context.md");
    if (!fs.existsSync(ctxPath)) { console.log("❌ No context. Run af init first."); process.exit(1); }
    console.log(`\n🌐 Dashboard: open ai-context/ai_context.md`);
    console.log(`   Or serve: python3 -m http.server 8341 -d ai-context/\n`);
    process.exit(0);
  } else if (command === 'send-context') {
    const rootDir = process.cwd();
    const ctxPath = path.join(rootDir, "ai-context", "ai_context.md");
    if (!fs.existsSync(ctxPath)) { console.log("❌ No context. Run af init first."); process.exit(1); }
    const content = fs.readFileSync(ctxPath, "utf-8");
    console.log(`\n📤 Context ready (${content.length} chars)`);
    console.log(`   Copy/paste into your AI tool\n`);
    process.exit(0);
  } else if (command === 'install') {
    args.shift();
    let platform = "opencode";
    let rootDir = process.cwd();
    let showJson = false;
    let commandName = "af";
    let listProfiles = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--platform" || args[i] === "-p") platform = args[++i];
      else if (args[i] === "--root" || args[i] === "-r") rootDir = args[++i];
      else if (args[i] === "--json" || args[i] === "-j") showJson = true;
      else if (args[i] === "--command") commandName = args[++i];
      else if (args[i] === "--list") listProfiles = true;
      else if (args[i] === "--help" || args[i] === "-h") {
        console.log(`
ai-first install - Install AI-First agent integrations

Usage: ai-first install [options]

Options:
  -p, --platform <name>  opencode, codex, claude-code, cursor, remote-http, generic-stdio
  -r, --root <dir>      Project root (default: current directory)
  --command <command>   MCP server command (default: af)
  --list                List compatibility profiles
  --json                Print machine-readable output
  -h, --help            Show help

Examples:
  ai-first install --platform opencode
  ai-first install --platform codex --json
  ai-first install --list
`);
        process.exit(0);
      }
    }

    if (listProfiles) {
      const profiles = getMcpCompatibilityProfiles();
      if (showJson) {
        console.log(JSON.stringify({ profiles }, null, 2));
      } else {
        console.log("\n🔌 MCP compatibility profiles\n");
        for (const profile of profiles) {
          console.log(`- ${profile.platform}: ${profile.label} (${profile.status}, ${profile.transport})`);
          console.log(`  config: ${profile.configPath || "manual"}`);
        }
      }
      process.exit(0);
    }

    const normalizedPlatform = normalizeMcpPlatform(platform);
    if (!normalizedPlatform) {
      console.error(`Platform "${platform}" not supported. Try: opencode, codex, claude-code, cursor, generic-stdio`);
      process.exit(1);
    }

    const result = installMcpProfile({
      rootDir,
      platform: normalizedPlatform,
      command: commandName,
    });

    if (showJson) {
      console.log(JSON.stringify(result, null, 2));
    } else if (result.success) {
      console.log(`\n✅ AI-First MCP profile installed for ${normalizedPlatform}`);
      for (const file of result.filesWritten) {
        console.log(`   wrote: ${file}`);
      }
      if (result.warnings.length > 0) {
        console.log("\n⚠️  Warnings:");
        for (const warning of result.warnings) console.log(`   - ${warning}`);
      }
      console.log("\nNext steps:");
      for (const step of result.nextSteps) console.log(`   - ${step}`);
    } else {
      console.error(`\n⚠️  Could not install profile for ${normalizedPlatform}`);
      for (const warning of result.warnings) console.error(`   - ${warning}`);
      process.exit(1);
    }
    process.exit(0);
  } else if (command === 'search') {
    args.shift();
    let rootDir = process.cwd();
    let query = "";
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--root" || args[i] === "-r") rootDir = args[++i];
      else query += args[i] + " ";
    }
    query = query.trim();
    if (!query) { console.log("Usage: af search <query> [--root dir]"); process.exit(1); }
    const { semanticSearch } = await import("../utils/semanticSearch.js");
    const results = semanticSearch(rootDir, query);
    console.log(`\n🔍 "${query}" → ${results.results.length} results in ${results.totalFiles} files\n`);
    for (const r of results.results) {
      console.log(`  📄 ${r.file}:${r.line} (${r.function || 'top'})`);
      console.log(`     ${r.code.split('\n').slice(0, 2).join('\n     ')}`);
      console.log();
    }
    process.exit(0);
  } else if (command === 'ask') {
    args.shift();
    let rootDir = process.cwd();
    let question = "";
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--root" || args[i] === "-r") rootDir = args[++i];
      else question += args[i] + " ";
    }
    question = question.trim();
    if (!question) { console.log("Usage: af ask <question> [--root dir]"); process.exit(1); }
    console.log(`\n🧠 "${question}"\n`);
    const { semanticSearch } = await import("../utils/semanticSearch.js");
    const results = semanticSearch(rootDir, question, 5);
    const ctxPath = path.join(rootDir, "ai-context", "ai_context.md");
    if (fs.existsSync(ctxPath)) {
      const ctx = fs.readFileSync(ctxPath, "utf-8").match(/## Quick Overview\s*\n([\s\S]*?)\n---/)?.[1] || "";
      console.log("--- Context ---");
      console.log(ctx.trim());
    }
    console.log("\n--- Relevant Code ---");
    for (const r of results.results) {
      console.log(`\n📄 ${r.file}:${r.line} (${r.function || 'top-level'})`);
      console.log(`\`\`\`\n${r.code.slice(0, 400)}\n\`\`\``);
    }
    console.log("\n💡 Tip: Run 'af chat' for interactive mode");
    process.exit(0);
  } else if (command === 'understand') {
    args.shift();
    let rootDir = process.cwd();
    let topic = "";
    let format = "markdown";
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--root" || args[i] === "-r") rootDir = args[++i];
      else if (args[i] === "--format" || args[i] === "-f") format = args[++i];
      else if (args[i] === "--json") format = "json";
      else topic += args[i] + " ";
    }
    topic = topic.trim();
    if (!topic) { console.log("Usage: af understand <topic> [--root dir] [--format json|markdown]"); process.exit(1); }
    const result = understandTopic(rootDir, topic);

    if (format === "json") {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    }

    console.log(`# Understanding: ${topic}\n`);
    console.log(`${result.summary}\n`);
    console.log(`**Context freshness**: ${result.contextFresh.fresh ? "fresh" : "not fresh"} - ${result.contextFresh.reason}`);
    console.log(`**Architecture**: ${result.architecture.pattern}\n`);

    if (result.architecture.modules.length > 0) {
      console.log("## Relevant Modules");
      for (const module of result.architecture.modules) {
        console.log(`- ${module.path}: ${module.responsibility}`);
      }
      console.log();
    }

    console.log("## Relevant Files");
    for (const file of result.files) {
      console.log(`- ${file.path} (${file.confidence}) - ${file.reason}`);
      for (const evidence of file.evidence.slice(0, 2)) {
        console.log(`  evidence: ${evidence}`);
      }
    }

    if (result.tests.length > 0) {
      console.log("\n## Related Tests");
      for (const test of result.tests) {
        console.log(`- ${test.path} (${test.confidence}) - ${test.reason}`);
      }
    }

    console.log("\n## Code Evidence");
    for (const snippet of result.snippets.slice(0, 5)) {
      console.log(`\n### ${snippet.file}:${snippet.line} - ${snippet.symbol}`);
      console.log(`\`\`\`\n${snippet.code.slice(0, 600)}\n\`\`\``);
    }

    if (result.commands.length > 0) {
      console.log("\n## Verification Commands");
      for (const command of result.commands) {
        console.log(`- \`${command.command}\` - ${command.reason}`);
      }
    }

    console.log("\n## Risks");
    for (const risk of result.risks.slice(0, 8)) {
      console.log(`- ${risk}`);
    }

    console.log("\n## Evidence");
    for (const evidence of result.evidence) {
      console.log(`- ${evidence}`);
    }
    process.exit(0);
  } else if (command === 'chat') {
    console.log(`\n💬 AI-First Chat Mode (type /exit to quit, /help for commands)\n`);
    const rootDir = process.cwd();
    const readline = (await import("readline")).default;
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const { semanticSearch } = await import("../utils/semanticSearch.js");
    const ask = (q: string) => {
      const results = semanticSearch(rootDir, q, 3);
      for (const r of results.results) {
        console.log(`\n  📄 ${r.file}:${r.line} (${r.function})`);
      }
      console.log(`  ${results.results.length} results\n`);
    };
    const prompt = () => { rl.question("af> ", (input: string) => {
      if (input === "/exit") { console.log("👋 Bye!"); rl.close(); process.exit(0); }
      if (input === "/help") { console.log("/exit quit | /help | /context show context\nAsk any question about your codebase"); prompt(); return; }
      if (input === "/context") { const cp = path.join(rootDir, "ai-context", "ai_context.md"); if (fs.existsSync(cp)) console.log(fs.readFileSync(cp, "utf-8").split("\n").slice(0, 20).join("\n")); else console.log("Run af init first"); prompt(); return; }
    if (input.startsWith("/")) { console.log("Unknown command"); prompt(); return; }
    ask(input); prompt();
  });};
  prompt();
} else {
    console.log(`Unknown command: ${command}`);
    console.log(`Use 'ai-first --help' for usage information`);
    process.exit(1);
  }
}
