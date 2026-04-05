#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { scanRepo } from "../core/repoScanner.js";
import { generateRepoMap, generateCompactRepoMap, generateSummary } from "../core/repoMapper.js";
import { generateIndex, IncrementalIndexer } from "../core/indexer.js";
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
import { loadIndexState, computeFileHash, getFilesToIndex } from "../core/indexState.js";
import { chunkFiles } from "../core/chunker.js";
import { generateEmbeddings, saveEmbeddings, createEmbeddingsTable } from "../core/embeddings.js";
import { generateSemanticContexts } from "../core/semanticContexts.js";
import { doctorMain } from "./doctor.js";
import { exploreMain } from "./explore.js";
import { listAdapters } from "../core/adapters/index.js";
import { detectGitRepository, generateGitContext } from "../core/gitAnalyzer.js";
import { buildKnowledgeGraph } from "../core/knowledgeGraphBuilder.js";
import { runIncrementalUpdate } from "../core/incrementalAnalyzer.js";
import { generateAllSchema } from "../core/schema.js";
import { startMCP } from "../mcp/index.js";
import process from "process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Main function to run ai-first command
 */
export async function runAIFirst(options = {}) {
    const { rootDir = process.cwd(), outputDir = path.join(rootDir, "ai-context"), } = options;
    const filesCreated = [];
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
        // Generate semantic contexts (features and flows)
        // First generate modules.json which is required for feature/flow detection
        console.log("📦 Generating modules...");
        const modules = {};
        for (const file of scanResult.files) {
            const parts = file.relativePath.split('/');
            if (parts.length > 1 && parts[0] !== 'ai') {
                if (!modules[parts[0]])
                    modules[parts[0]] = { path: parts[0], files: [] };
                modules[parts[0]].files.push(file.relativePath);
            }
        }
        const modulesPath = path.join(outputDir, "modules.json");
        fs.writeFileSync(modulesPath, JSON.stringify({ modules }, null, 2));
        console.log("   ✅ modules.json");
        try {
            const { features, flows } = generateSemanticContexts(outputDir);
            console.log(`   ✅ Created ${features.length} features, ${flows.length} flows`);
        }
        catch (e) {
            console.log("   ⚠️  Semantic contexts: " + (e.message || e));
        }
        // Generate AI Repository Schema (schema.json, project.json, tools.json)
        try {
            generateAllSchema(rootDir, outputDir);
            console.log("   ✅ Created schema.json, project.json, tools.json");
        }
        catch (e) {
            console.log("   ⚠️  Schema generation: " + (e.message || e));
        }
        console.log("\n✨ Done! Created the following files:");
        console.log("\n✨ Done! Created the following files:");
        console.log("\n✨ Done! Created the following files:");
        for (const file of filesCreated) {
            console.log(`   - ${path.relative(rootDir, file)}`);
        }
        return {
            success: true,
            filesCreated,
        };
    }
    catch (error) {
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
function generateRepoMapJson(files) {
    const tree = {};
    for (const file of files) {
        const parts = file.relativePath.split("/");
        let current = tree;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1;
            if (isFile) {
                current[part] = { type: "file", extension: file.extension };
            }
            else {
                if (!current[part]) {
                    current[part] = { type: "directory", children: {} };
                }
                current = current[part].children;
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
function generateUnifiedContext(repoMap, summary, architecture, techStack, entrypoints, conventions, aiRules) {
    const lines = [];
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
    const byType = new Map();
    for (const ep of entrypoints) {
        if (!byType.has(ep.type))
            byType.set(ep.type, []);
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
    process.argv[1]?.includes('af') ||
    process.argv[1] === undefined;
if (isMain) {
    const args = process.argv.slice(2);
    const options = {};
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
        let outputPath = null;
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
        const { toIndex, unchanged, new: newFiles, deleted } = getFilesToIndex(allFiles, rootDir, existingState);
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
        if (existingState && newFiles > 0)
            console.log(`   New: ${newFiles}`);
        if (existingState && deleted > 0)
            console.log(`   Deleted: ${deleted}`);
        console.log("");
        if (useSemantic) {
            console.log("🔎 Semantic mode enabled.\n");
        }
        // Generate files.json
        const filesJson = { files: scanResult.files.map(f => ({ path: f.relativePath, name: f.name, ext: f.extension })) };
        fs.writeFileSync(path.join(aiDir, "files.json"), JSON.stringify(filesJson, null, 2));
        console.log("   ✅ Created files.json");
        // Generate modules.json
        const modules = {};
        for (const file of scanResult.files) {
            const parts = file.relativePath.split('/');
            if (parts.length > 1 && parts[0] !== AI_CONTEXT_DIR && parts[0] !== 'ai') {
                if (!modules[parts[0]])
                    modules[parts[0]] = { path: parts[0], files: [] };
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
                const fileStates = {};
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
                        let db;
                        if (fs.existsSync(dbPath)) {
                            const fileBuffer = fs.readFileSync(dbPath);
                            db = new SQL.Database(fileBuffer);
                        }
                        else {
                            db = new SQL.Database();
                        }
                        createEmbeddingsTable(db);
                        saveEmbeddings(db, embeddings, model, 384);
                        const data = db.export();
                        const buffer = Buffer.from(data);
                        fs.writeFileSync(dbPath, buffer);
                        db.close();
                        console.log("   ✅ Semantic indexing complete");
                    }
                    catch (error) {
                        console.log("   ⚠️  Semantic indexing failed:", error);
                    }
                }
                console.log(`\n📊 Example queries agents can run:`);
                console.log(`   - Find all functions in a file`);
                console.log(`   - Find where a symbol is defined`);
                console.log(`   - Find all files importing a module`);
                console.log(`   - Search symbols by name pattern`);
                process.exit(0);
            }
            else {
                console.error(`❌ Error: ${result.error}`);
                process.exit(1);
            }
        });
    }
    else if (command === 'watch') {
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
    }
    else if (command === 'context') {
        // Context command - generate AI context files OR symbol-specific context packet
        args.shift();
        let rootDir = process.cwd();
        let outputDir = path.join(rootDir, "ai-context");
        let symbolArg;
        let depth = 1;
        let maxSymbols = 50;
        let format = "json";
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
                            format = fmt;
                        }
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
  -s, --save              Save context packet to file
  -h, --help              Show help message

Examples:
  ai-first context loginUser
  ai-first context loginUser --depth 2
  ai-first context loginUser --format markdown
  ai-first context loginUser -d 2 -m 100 -f markdown
`);
                        process.exit(0);
                    case "--save":
                    case "-s":
                        save = true;
                        break;
                }
            }
            else {
                symbolArg = arg;
            }
        }
        if (symbolArg) {
            console.log(`\n🎯 Generating context for symbol: ${symbolArg}`);
            console.log(`   Depth: ${depth}, Max: ${maxSymbols}, Format: ${format}\n`);
            import("../core/contextPacket.js").then(({ generateContextPacket, saveContextPacket }) => {
                const packet = generateContextPacket(symbolArg, outputDir, rootDir, { depth, format, maxSymbols });
                if (packet) {
                    if (format === "markdown" || format === "text") {
                        console.log(packet);
                    }
                    else {
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
                }
                else {
                    process.exit(1);
                }
            }).catch((error) => {
                console.error("Error:", error.message);
                process.exit(1);
            });
        }
        else {
            console.log(`\n🤖 Generating AI context for: ${rootDir}\n`);
            generateAIContext(rootDir, outputDir).then((result) => {
                if (result.success) {
                    console.log("✅ AI Context generated!");
                    process.exit(0);
                }
                else {
                    console.error(`❌ Error: ${result.error}`);
                    process.exit(1);
                }
            });
        }
    }
    else if (command === 'summarize') {
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
            }
            else {
                console.error(`❌ Error: ${result.error}`);
                process.exit(1);
            }
        });
    }
    else if (command === 'query') {
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
                }
                else {
                    console.log("Found symbols:\n");
                    console.log("Name                | Type       | File                    | Line");
                    console.log("-------------------|------------|-------------------------|------");
                    for (const row of results[0].values) {
                        console.log(`${String(row[0]).padEnd(19)}| ${String(row[1]).padEnd(10)}| ${String(row[3]).padEnd(24)}| ${row[2]}`);
                    }
                    console.log(`\nTotal: ${results[0].values.length} symbols`);
                }
            }
            else if (queryType === 'dependents') {
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
                }
                else {
                    console.log("Dependent files:\n");
                    console.log("File                    | Type    | Imports");
                    console.log("------------------------|---------|-------------------");
                    for (const row of results[0].values) {
                        console.log(`${String(row[0]).padEnd(24)}| ${String(row[1]).padEnd(7)}| ${row[2]}`);
                    }
                    console.log(`\nTotal: ${results[0].values.length} dependent files`);
                }
            }
            else if (queryType === 'imports') {
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
                }
                else {
                    console.log("Imports:\n");
                    console.log("Target                     | Type");
                    console.log("---------------------------|------");
                    for (const row of results[0].values) {
                        console.log(`${String(row[0]).padEnd(27)}| ${row[1]}`);
                    }
                    console.log(`\nTotal: ${results[0].values.length} imports`);
                }
            }
            else if (queryType === 'exports') {
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
                }
                else {
                    console.log("Exports:\n");
                    console.log("Name                | Type       | Line");
                    console.log("-------------------|------------|------");
                    for (const row of results[0].values) {
                        console.log(`${String(row[0]).padEnd(19)}| ${String(row[1]).padEnd(10)}| ${row[2]}`);
                    }
                    console.log(`\nTotal: ${results[0].values.length} exports`);
                }
            }
            else if (queryType === 'files') {
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
            }
            else if (queryType === 'stats') {
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
            }
            else {
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
    }
    else if (command === 'init' || !command) {
        // Init command - generate all context files
        if (command === 'init')
            args.shift();
        let preset;
        let installMcp = false;
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
            }
            catch { }
        }
        if (preset) {
            console.log(`\n🎛️  Using preset: ${preset}\n`);
        }
        runAIFirst(options).then((result) => {
            if (result.success && installMcp) {
                const rootDir = options.rootDir || process.cwd();
                const opencodeDir = path.join(rootDir, '.opencode');
                const mcpConfigPath = path.join(opencodeDir, 'mcp.json');
                const mcpConfig = {
                    mcpServers: {
                        "ai-first": {
                            command: "af",
                            args: ["mcp"],
                            autoConnect: true
                        }
                    }
                };
                try {
                    fs.mkdirSync(opencodeDir, { recursive: true });
                    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
                    console.log(`\n✅ MCP server configured at ${mcpConfigPath}`);
                    console.log(`   Restart OpenCode to use the MCP server`);
                }
                catch (err) {
                    console.error(`\n⚠️  Failed to write MCP config:`, err);
                }
            }
            process.exit(result.success ? 0 : 1);
        });
    }
    else if (command === 'map') {
        // Map command - generate all mapping files
        args.shift();
        let rootDir = process.cwd();
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === "--root" || arg === "-r")
                rootDir = args[++i];
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
        const modules = {};
        for (const file of scan.files) {
            const parts = file.relativePath.split('/');
            if (parts.length > 1 && parts[0] !== 'ai') {
                if (!modules[parts[0]])
                    modules[parts[0]] = { path: parts[0], files: [] };
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
    }
    else if (command === 'doctor') {
        doctorMain(args.slice(1));
    }
    else if (command === 'explore') {
        exploreMain(args.slice(1));
    }
    else if (command === 'adapters') {
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
        }
        else {
            console.log("\n📦 Available adapters:\n");
            console.log("Name                | Display Name");
            console.log("--------------------|-------------------");
            for (const adapter of adapters) {
                console.log(`${adapter.name.padEnd(18)}| ${adapter.displayName}`);
            }
            console.log(`\nTotal: ${adapters.length} adapters`);
        }
        process.exit(0);
    }
    else if (command === 'git') {
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
        }
        else {
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
    }
    else if (command === 'graph') {
        // Knowledge Graph command
        args.shift();
        let rootDir = process.cwd();
        let aiDir = path.join(rootDir, "ai-context");
        let showJson = false;
        let showStats = false;
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
                case "--stats":
                case "-s":
                    showStats = true;
                    break;
                case "--no-git":
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
        }
        else {
            console.log("📊 Graph Statistics:");
            console.log(`   Nodes: ${graph.nodes.length}`);
            console.log(`   Edges: ${graph.edges.length}`);
            console.log(`   Sources: ${graph.metadata.sources.join(", ") || "none"}`);
            const nodeTypes = graph.nodes.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {});
            const edgeTypes = graph.edges.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {});
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
        process.exit(0);
    }
    else if (command === 'update') {
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
        }
        else {
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
    }
    else if (command === 'mcp') {
        // MCP command - start Model Context Protocol server
        args.shift();
        if (args.includes('--help') || args.includes('-h')) {
            console.log(`
ai-first mcp - Start Model Context Protocol server

Usage: ai-first mcp [options]

Options:
  -r, --root <dir>    Root directory to scan (default: current directory)
  -h, --help          Show help message

Description:
  Starts an MCP server that allows AI agents (Claude Desktop, etc.) to
  query repository context using the Model Context Protocol.

The server provides these tools:
  - generate_context: Generate AI context for the repository
  - index_repo: Create SQLite index for fast queries
  - query_symbol: Look up symbols by name
  - get_architecture: Get architecture analysis
  - get_tech_stack: Get technology stack information

Examples:
  ai-first mcp                    # Start MCP server in current directory
  ai-first mcp --root ./my-project # Start with specific root directory
`);
            process.exit(0);
        }
        let rootDir = process.cwd();
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === "--root" || arg === "-r")
                rootDir = args[++i];
        }
        console.log("\n🚀 Starting MCP server...\n");
        console.log(`   Root directory: ${rootDir}`);
        console.log("   Protocol: stdio");
        console.log("\n   The server is now running and ready to accept MCP requests.");
        console.log("   Use Ctrl+C to stop.\n");
        startMCP({ rootDir });
    }
    else {
        console.log(`Unknown command: ${command}`);
        console.log(`Use 'ai-first --help' for usage information`);
        process.exit(1);
    }
}
//# sourceMappingURL=ai-first.js.map