import path from "path";
import { fileURLToPath } from "url";
import { scanRepo } from "../core/repoScanner.js";
import { generateRepoMap, generateCompactRepoMap, generateSummary } from "../core/repoMapper.js";
import { generateIndex, IncrementalIndexer, EXAMPLE_QUERIES } from "../core/indexer.js";
import { generateAIContext } from "../core/aiContextGenerator.js";
import { ensureDir, writeFile } from "../utils/fileUtils.js";
import { analyzeArchitecture, generateArchitectureFile } from "../analyzers/architecture.js";
import { detectTechStack, generateTechStackFile } from "../analyzers/techStack.js";
import { discoverEntrypoints, generateEntrypointsFile } from "../analyzers/entrypoints.js";
import { detectConventions, generateConventionsFile } from "../analyzers/conventions.js";
import { extractSymbols, generateSymbolsJson } from "../analyzers/symbols.js";
import { analyzeDependencies, generateDependenciesJson } from "../analyzers/dependencies.js";
import { generateAIRules, generateAIRulesFile } from "../analyzers/aiRules.js";

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

/**
 * Main function to run ai-first command
 */
export async function runAIFirst(options: AIFirstOptions = {}): Promise<AIFirstResult> {
  const {
    rootDir = process.cwd(),
    outputDir = path.join(rootDir, "ai"),
  } = options;

  const filesCreated: string[] = [];

  try {
    console.log(`\n🔍 Scanning repository: ${rootDir}\n`);

    // Step 1: Scan repository
    const scanResult = scanRepo(rootDir);
    console.log(`   Found ${scanResult.totalFiles} files\n`);

    // Step 2: Create output directory
    console.log(`📁 Creating output directory: ${outputDir}`);
    ensureDir(outputDir);

    // Step 3: Generate repo_map.md
    console.log("📊 Generating repository map...");
    const repoMap = generateRepoMap(scanResult.files, { sortBy: "directory" });
    const compactMap = generateCompactRepoMap(scanResult.files);
    const repoMapPath = path.join(outputDir, "repo_map.md");
    writeFile(repoMapPath, repoMap + "\n\n" + compactMap);
    filesCreated.push(repoMapPath);
    console.log("   ✅ Created repo_map.md");

    // Step 4: Generate repo_map.json
    console.log("📊 Generating machine-readable repo map...");
    const repoMapJson = generateRepoMapJson(scanResult.files);
    const repoMapJsonPath = path.join(outputDir, "repo_map.json");
    writeFile(repoMapJsonPath, repoMapJson);
    filesCreated.push(repoMapJsonPath);
    console.log("   ✅ Created repo_map.json");

    // Step 5: Generate summary
    const summary = generateSummary(scanResult.files);
    const summaryPath = path.join(outputDir, "summary.md");
    writeFile(summaryPath, summary);
    filesCreated.push(summaryPath);
    console.log("   ✅ Created summary.md");

    // Step 6: Analyze architecture
    console.log("🏗️  Analyzing architecture...");
    const architecture = analyzeArchitecture(scanResult.files, rootDir);
    const architecturePath = path.join(outputDir, "architecture.md");
    writeFile(architecturePath, generateArchitectureFile(architecture));
    filesCreated.push(architecturePath);
    console.log("   ✅ Created architecture.md");

    // Step 7: Detect tech stack
    console.log("🛠️  Detecting tech stack...");
    const techStack = detectTechStack(scanResult.files, rootDir);
    const techStackPath = path.join(outputDir, "tech_stack.md");
    writeFile(techStackPath, generateTechStackFile(techStack));
    filesCreated.push(techStackPath);
    console.log("   ✅ Created tech_stack.md");

    // Step 8: Discover entrypoints
    console.log("🚪 Discovering entrypoints...");
    const entrypoints = discoverEntrypoints(scanResult.files, rootDir);
    const entrypointsPath = path.join(outputDir, "entrypoints.md");
    writeFile(entrypointsPath, generateEntrypointsFile(entrypoints));
    filesCreated.push(entrypointsPath);
    console.log("   ✅ Created entrypoints.md");

    // Step 9: Detect conventions
    console.log("📝 Detecting conventions...");
    const conventions = detectConventions(scanResult.files, rootDir);
    const conventionsPath = path.join(outputDir, "conventions.md");
    writeFile(conventionsPath, generateConventionsFile(conventions));
    filesCreated.push(conventionsPath);
    console.log("   ✅ Created conventions.md");

    // Step 10: Extract symbols
    console.log("🔎 Extracting symbols...");
    const symbols = extractSymbols(scanResult.files);
    const symbolsPath = path.join(outputDir, "symbols.json");
    writeFile(symbolsPath, generateSymbolsJson(symbols));
    filesCreated.push(symbolsPath);
    console.log("   ✅ Created symbols.json");

    // Step 11: Analyze dependencies
    console.log("🔗 Analyzing dependencies...");
    const dependencies = analyzeDependencies(scanResult.files);
    const depsPath = path.join(outputDir, "dependencies.json");
    writeFile(depsPath, generateDependenciesJson(dependencies));
    filesCreated.push(depsPath);
    console.log("   ✅ Created dependencies.json");

    // Step 12: Generate AI rules
    console.log("🤖 Generating AI rules...");
    const aiRules = generateAIRules(scanResult.files, rootDir);
    const aiRulesPath = path.join(outputDir, "ai_rules.md");
    writeFile(aiRulesPath, generateAIRulesFile(aiRules, scanResult.files, rootDir));
    filesCreated.push(aiRulesPath);
    console.log("   ✅ Created ai_rules.md");

    // Step 13: Generate unified ai_context.md
    console.log("📋 Generating unified AI context...");
    const aiContextPath = path.join(outputDir, "ai_context.md");
    const aiContext = generateUnifiedContext(repoMap, summary, architecture, techStack, entrypoints, conventions, aiRules);
    writeFile(aiContextPath, aiContext);
    filesCreated.push(aiContextPath);
    console.log("   ✅ Created ai_context.md");

    console.log("\n✨ Done! Created the following files:");
    for (const file of filesCreated) {
      console.log(`   - ${path.relative(rootDir, file)}`);
    }

    return {
      success: true,
      filesCreated,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n❌ Error:", errorMessage);
    return {
      success: false,
      filesCreated,
      error: errorMessage,
    };
  }
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

/**
 * Generate unified AI context file
 */
function generateUnifiedContext(
  repoMap: string,
  summary: string,
  architecture: ReturnType<typeof analyzeArchitecture>,
  techStack: ReturnType<typeof detectTechStack>,
  entrypoints: ReturnType<typeof discoverEntrypoints>,
  conventions: ReturnType<typeof detectConventions>,
  aiRules: ReturnType<typeof generateAIRules>
): string {
  const lines: string[] = [];

  lines.push("# AI Context");
  lines.push("");
  lines.push("> This file provides a comprehensive overview of the repository for AI coding assistants.");
  lines.push("");
  lines.push("---\n");

  lines.push("## Quick Overview");
  lines.push("");
  lines.push(`- **Pattern**: ${architecture.pattern}`);
  lines.push(`- **Languages**: ${techStack.languages.join(", ") || "Unknown"}`);
  lines.push(`- **Frameworks**: ${techStack.frameworks.join(", ") || "None"}`);
  lines.push(`- **Total Files**: ${summary.match(/\*\*Total files\*\*: (\d+)/)?.[1] || "Unknown"}`);
  lines.push("");

  lines.push("---\n");
  lines.push("## Table of Contents");
  lines.push("");
  lines.push("1. [Tech Stack](#tech-stack)");
  lines.push("2. [Architecture](#architecture)");
  lines.push("3. [Key Entrypoints](#key-entrypoints)");
  lines.push("4. [Code Conventions](#code-conventions)");
  lines.push("5. [AI Rules](#ai-rules)");
  lines.push("6. [Repository Map](#repository-map)");
  lines.push("");

  lines.push("---\n");
  lines.push("## Tech Stack");
  lines.push("");
  lines.push(techStack.description || "See tech_stack.md for details.");
  lines.push("");

  lines.push("---\n");
  lines.push("## Architecture");
  lines.push("");
  lines.push(architecture.description || "See architecture.md for details.");
  lines.push("");

  lines.push("---\n");
  lines.push("## Key Entrypoints");
  lines.push("");
  
  const byType = new Map<string, typeof entrypoints>();
  for (const ep of entrypoints) {
    if (!byType.has(ep.type)) byType.set(ep.type, []);
    byType.get(ep.type)?.push(ep);
  }
  
  for (const [type, eps] of byType) {
    lines.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    for (const ep of eps.slice(0, 3)) {
      lines.push(`- \`${ep.path}\` - ${ep.description}`);
    }
    lines.push("");
  }

  lines.push("---\n");
  lines.push("## Code Conventions");
  lines.push("");
  lines.push(conventions.description || "See conventions.md for details.");
  lines.push("");

  lines.push("---\n");
  lines.push("## AI Rules");
  lines.push("");
  for (const guideline of aiRules.guidelines.slice(0, 5)) {
    lines.push(`- ${guideline}`);
  }
  lines.push("");

  lines.push("---\n");
  lines.push("## Repository Map");
  lines.push("");
  lines.push("See repo_map.md for the full structure.");
  lines.push("");

  lines.push("---\n");
  lines.push("## Notes for AI Assistants");
  lines.push("");
  lines.push("1. Follow the established naming conventions (see conventions.md)");
  lines.push("2. Use the detected frameworks and libraries");
  lines.push("3. Target the correct entrypoints for modifications");
  lines.push("4. Maintain the detected architecture patterns");
  lines.push("5. Follow AI rules in ai_rules.md");
  lines.push("");

  lines.push("---\n");
  lines.push("*Generated by ai-first*");

  return lines.join("\n");
}

// CLI entry point
// Check if run directly (not imported as module)
const isMain = !import.meta.url || 
  process.argv[1]?.includes('ai-first') || 
  process.argv[1] === undefined;

if (isMain) {
  const args = process.argv.slice(2);
  const options: AIFirstOptions = {};

  // Handle commands
  const command = args[0];
  
  if (command === 'index') {
    // Index command - generate SQLite database
    args.shift();
    let rootDir = process.cwd();
    let outputPath = path.join(rootDir, "ai", "index.db");

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
ai-first index - Generate SQLite index for the repository

Usage: ai-first index [options]

Options:
  -r, --root <dir>      Root directory to scan (default: current directory)
  -o, --output <path>  Output path for index.db (default: ./ai/index.db)
  -h, --help           Show help message

Example queries (for AI agents):
  Find functions:    SELECT s.name, s.line FROM symbols s JOIN files f ON s.file_id = f.id WHERE f.path = 'src/index.ts' AND s.type = 'function'
  Find symbol:       SELECT f.path, s.line FROM symbols s JOIN files f ON s.file_id = f.id WHERE s.name = 'MyClass'
  Find imports:       SELECT f.path, i.target_file FROM imports i JOIN files f ON i.source_file_id = f.id WHERE f.path = 'src/utils.ts'
`);
          process.exit(0);
      }
    }

    console.log(`\n🗄️  Generating index for: ${rootDir}\n`);
    
    generateIndex(rootDir, outputPath).then((result) => {
      if (result.success) {
        console.log(`✅ Index created: ${result.dbPath}`);
        console.log(`   Files: ${result.stats.files}`);
        console.log(`   Symbols: ${result.stats.symbols}`);
        console.log(`   Imports: ${result.stats.imports}`);
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
    let outputPath = path.join(rootDir, "ai", "index.db");
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
  -o, --output <path>   Output path for index.db (default: ./ai/index.db)
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
    // Context command - generate AI context files (repo_map.json, symbols.json, dependencies.json, ai_context.md)
    args.shift();
    let rootDir = process.cwd();
    let outputDir = path.join(rootDir, "ai");

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case "--root":
        case "-r":
          rootDir = args[++i];
          break;
        case "--output":
        case "-o":
          outputDir = args[++i];
          break;
        case "--help":
        case "-h":
          console.log(`
ai-first context - Generate AI context optimized for LLMs

Usage: ai-first context [options]

Options:
  -r, --root <dir>      Root directory (default: current directory)
  -o, --output <dir>   Output directory (default: ./ai)
  -h, --help           Show help message

Output files:
  - repo_map.json       Folder structure
  - symbols.json        Exported symbols
  - dependencies.json   Import graph
  - ai_context.md       LLM-optimized summary
`);
          process.exit(0);
      }
    }

    console.log(`\n🤖 Generating AI context for: ${rootDir}`);
    console.log(`   Output: ${outputDir}\n`);

    generateAIContext(rootDir, outputDir).then((result) => {
      if (result.success) {
        console.log("✅ AI Context generated successfully!");
        console.log("\n📁 Files created:");
        for (const file of result.filesCreated) {
          console.log(`   - ${path.relative(rootDir, file)}`);
        }
        console.log("\n📊 Statistics:");
        console.log(`   Files: ${result.stats.files}`);
        console.log(`   Folders: ${result.stats.folders}`);
        console.log(`   Symbols: ${result.stats.symbols}`);
        console.log(`   Dependencies: ${result.stats.dependencies}`);
        process.exit(0);
      } else {
        console.error(`❌ Error: ${result.error}`);
        process.exit(1);
      }
    });
  } else if (command === 'init' || !command) {
    // Init command - generate all context files
    if (command === 'init') args.shift();

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
        case "--help":
        case "-h":
          console.log(`
iai-first - Generate AI context for your repository

Usage: ai-first [command] [options]

Commands:
  init                 Generate AI context files (default)
  index                Generate SQLite index database
  watch                Watch for file changes (incremental indexing)
  context              Generate LLM-optimized context (repo_map.json, symbols.json, dependencies.json, ai_context.md)

Options:
  -r, --root <dir>      Root directory to scan (default: current directory)
  -o, --output <dir>   Output directory (default: ./ai)
  -h, --help           Show help message
`);
          process.exit(0);
      }
    }

    runAIFirst(options).then((result) => {
      process.exit(result.success ? 0 : 1);
    });
  } else {
    console.log(`Unknown command: ${command}`);
    console.log(`Use 'ai-first --help' for usage information`);
    process.exit(1);
  }
}
