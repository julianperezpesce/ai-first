import path from "path";
import { fileURLToPath } from "url";
import { scanRepo } from "../core/repoScanner.js";
import { generateRepoMap, generateCompactRepoMap, generateSummary } from "../core/repoMapper.js";
import { ensureDir, writeFile } from "../utils/fileUtils.js";
import { analyzeArchitecture, generateArchitectureFile } from "../analyzers/architecture.js";
import { detectTechStack, generateTechStackFile } from "../analyzers/techStack.js";
import { discoverEntrypoints, generateEntrypointsFile } from "../analyzers/entrypoints.js";
import { detectConventions, generateConventionsFile } from "../analyzers/conventions.js";
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
        // Step 3: Generate REPO_MAP.md
        console.log("📊 Generating repository map...");
        const repoMap = generateRepoMap(scanResult.files, { sortBy: "directory" });
        const compactMap = generateCompactRepoMap(scanResult.files);
        const repoMapPath = path.join(outputDir, "repo_map.md");
        writeFile(repoMapPath, repoMap + "\n\n" + compactMap);
        filesCreated.push(repoMapPath);
        console.log("   ✅ Created repo_map.md");
        // Step 4: Generate SUMMARY.md
        const summary = generateSummary(scanResult.files);
        const summaryPath = path.join(outputDir, "summary.md");
        writeFile(summaryPath, summary);
        filesCreated.push(summaryPath);
        console.log("   ✅ Created summary.md");
        // Step 5: Analyze and generate architecture.md
        console.log("🏗️  Analyzing architecture...");
        const architecture = analyzeArchitecture(scanResult.files, rootDir);
        const architecturePath = path.join(outputDir, "architecture.md");
        writeFile(architecturePath, generateArchitectureFile(architecture));
        filesCreated.push(architecturePath);
        console.log("   ✅ Created architecture.md");
        // Step 6: Detect and generate tech_stack.md
        console.log("🛠️  Detecting tech stack...");
        const techStack = detectTechStack(scanResult.files, rootDir);
        const techStackPath = path.join(outputDir, "tech_stack.md");
        writeFile(techStackPath, generateTechStackFile(techStack));
        filesCreated.push(techStackPath);
        console.log("   ✅ Created tech_stack.md");
        // Step 7: Discover and generate entrypoints.md
        console.log("🚪 Discovering entrypoints...");
        const entrypoints = discoverEntrypoints(scanResult.files, rootDir);
        const entrypointsPath = path.join(outputDir, "entrypoints.md");
        writeFile(entrypointsPath, generateEntrypointsFile(entrypoints));
        filesCreated.push(entrypointsPath);
        console.log("   ✅ Created entrypoints.md");
        // Step 8: Detect and generate conventions.md
        console.log("📝 Detecting conventions...");
        const conventions = detectConventions(scanResult.files, rootDir);
        const conventionsPath = path.join(outputDir, "conventions.md");
        writeFile(conventionsPath, generateConventionsFile(conventions));
        filesCreated.push(conventionsPath);
        console.log("   ✅ Created conventions.md");
        // Step 9: Generate unified ai_context.md
        console.log("📋 Generating unified AI context...");
        const aiContextPath = path.join(outputDir, "ai_context.md");
        const aiContext = generateUnifiedContext(repoMap, summary, architecture, techStack, entrypoints, conventions);
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
 * Generate unified AI context file
 */
function generateUnifiedContext(repoMap, summary, architecture, techStack, entrypoints, conventions) {
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
    lines.push("5. [Repository Map](#repository-map)");
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
    // Group entrypoints by type
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
    lines.push("");
    lines.push("---\n");
    lines.push("*Generated by ai-first*");
    return lines.join("\n");
}
// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const options = {};
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
            case "--skip-context":
                options.skipContextGeneration = true;
                break;
            case "--help":
            case "-h":
                console.log(`
ai-first - Generate AI context for your repository

Usage: ai-first [options]

Options:
  -r, --root <dir>      Root directory to scan (default: current directory)
  -o, --output <dir>    Output directory (default: ./ai)
  -h, --help            Show this help message
`);
                process.exit(0);
        }
    }
    runAIFirst(options).then((result) => {
        process.exit(result.success ? 0 : 1);
    });
}
//# sourceMappingURL=ai-first.js.map