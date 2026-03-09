import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { scanRepo } from "../core/repoScanner.js";
import { generateRepoMap, generateCompactRepoMap, generateSummary } from "../core/repoMapper.js";
import { generateIndex, IncrementalIndexer } from "../core/indexer.js";
import { generateAIContext } from "../core/aiContextGenerator.js";
import { generateHierarchy } from "../core/hierarchyGenerator.js";
import { ensureDir, writeFile } from "../utils/fileUtils.js";
import { analyzeArchitecture, generateArchitectureFile } from "../analyzers/architecture.js";
import { detectTechStack, generateTechStackFile } from "../analyzers/techStack.js";
import { discoverEntrypoints, generateEntrypointsFile } from "../analyzers/entrypoints.js";
import { detectConventions, generateConventionsFile } from "../analyzers/conventions.js";
import { extractSymbols, generateSymbolsJson } from "../analyzers/symbols.js";
import { analyzeDependencies, generateDependenciesJson } from "../analyzers/dependencies.js";
import { generateAIRules, generateAIRulesFile } from "../analyzers/aiRules.js";
import { loadIndexState, computeFileHash, getFilesToIndex } from "../core/indexState.js";
import { chunkFiles } from "../core/chunker.js";
import { generateEmbeddings, saveEmbeddings } from "../core/embeddings.js";
import { doctorMain } from "./doctor.js";
import { exploreMain } from "./explore.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Main function to run ai-first command
 */
export async function runAIFirst(options = {}) {
    const { rootDir = process.cwd(), outputDir = path.join(rootDir, "ai"), } = options;
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
    process.argv[1] === undefined;
if (isMain) {
    const args = process.argv.slice(2);
    const options = {};
    // Handle commands
    const command = args[0];
    if (command === 'index') {
        // Index command - generate SQLite database
        args.shift();
        let rootDir = process.cwd();
        let outputPath = path.join(rootDir, "ai", "index.db");
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
  -o, --output <path>  Output path for index.db (default: ./ai/index.db)
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
        const aiDir = path.join(rootDir, "ai");
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
            if (parts.length > 1 && parts[0] !== 'ai') {
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
                        saveEmbeddings(embeddings, aiDir, model, 384);
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
        let outputPath = path.join(rootDir, "ai", "index.db");
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
    }
    else if (command === 'context') {
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
            }
            else {
                console.error(`❌ Error: ${result.error}`);
                process.exit(1);
            }
        });
    }
    else if (command === 'summarize') {
        // Summarize command - generate hierarchical repository summaries
        args.shift();
        let rootDir = process.cwd();
        let outputPath = path.join(rootDir, "ai", "hierarchy.json");
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
  -o, --output <path>   Output path (default: ./ai/hierarchy.json)
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
        let dbPath = path.join(rootDir, "ai", "index.db");
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            switch (arg) {
                case "--root":
                case "-r":
                    rootDir = args[++i];
                    dbPath = path.join(rootDir, "ai", "index.db");
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
  -d, --db <path>    Database path (default: ./ai/index.db)
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
  context              Generate LLM-optimized context
  summarize            Generate hierarchical repository summaries
  query                Query the index (symbol, dependents, imports, exports, stats)
  doctor               Check repository health and AI readiness
  explore <module>     Explore module dependencies
  map                  Generate repository map (files, modules, graph)

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
        const aiDir = path.join(rootDir, "ai");
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
        fs.writeFileSync(path.join(aiDir, "repo-map.json"), JSON.stringify(repoMapData, null, 2));
        console.log("   ✅ repo-map.json");
        // module-graph.json
        const { generateModuleGraph } = await import("../core/moduleGraph.js");
        await generateModuleGraph(rootDir, aiDir);
        console.log("   ✅ module-graph.json");
        console.log("\n✅ Repository map generated!");
        process.exit(0);
    }
    else if (command === 'doctor') {
        doctorMain(args.slice(1));
    }
    else if (command === 'explore') {
        exploreMain(args.slice(1));
    }
    else {
        console.log(`Unknown command: ${command}`);
        console.log(`Use 'ai-first --help' for usage information`);
        process.exit(1);
    }
}
//# sourceMappingURL=ai-first.js.map