import fs from "fs";
import path from "path";
import { analyzeArchitecture, generateArchitectureFile } from "../../analyzers/architecture.js";
import { generateAIRules, generateAIRulesFile } from "../../analyzers/aiRules.js";
import { detectConventions, generateConventionsFile } from "../../analyzers/conventions.js";
import { analyzeDependencies, generateDependenciesJson } from "../../analyzers/dependencies.js";
import { discoverEntrypoints, generateEntrypointsFile } from "../../analyzers/entrypoints.js";
import { extractSymbols, generateSymbolsJson } from "../../analyzers/symbols.js";
import { detectTechStack, generateTechStackFile } from "../../analyzers/techStack.js";
import { generateAgentBrief } from "../agentBrief.js";
import { checkContextFreshness, createContextManifest, writeContextManifest } from "../contextManifest.js";
import { generateCompactRepoMap, generateRepoMap, generateSummary } from "../repoMapper.js";
import { scanRepo } from "../repoScanner.js";
import { generateAllSchema } from "../schema.js";
import { generateSemanticContexts } from "../semanticContexts.js";
import { detectAntiPatterns } from "../../utils/antiPatternDetector.js";
import { detectCICD } from "../../utils/cicdDetector.js";
import { extractCodeGotchas } from "../../utils/gotchaExtractor.js";
import { extractCodePatterns } from "../../utils/patternExtractor.js";
import { extractConfigAnalysis } from "../../utils/configAnalyzer.js";
import { generateContextDiff } from "../../utils/contextDiff.js";
import { extractCrossCuttingConcerns } from "../../utils/crossCuttingExtractor.js";
import { extractDataModels } from "../../utils/dataModelExtractor.js";
import { detectDeadCode } from "../../utils/deadCodeDetector.js";
import { extractDependencyVersions } from "../../utils/dependencyVersionExtractor.js";
import { analyzeDependencyImpact } from "../../utils/impactAnalyzer.js";
import { analyzeDocCoverage } from "../../utils/docCoverageAnalyzer.js";
import { ensureDir, writeFile } from "../../utils/fileUtils.js";
import { detectMigrations } from "../../utils/migrationDetector.js";
import { detectPerformanceIssues } from "../../utils/performanceAnalyzer.js";
import { extractProjectSetup } from "../../utils/projectSetupExtractor.js";
import { extractRecentChanges } from "../../utils/recentChangesExtractor.js";
import { detectSecurityIssues } from "../../utils/securityAuditor.js";
import { mapTestFiles } from "../../utils/testFileMapper.js";
import { generateUnifiedContext } from "./unifiedContextGenerator.js";

export interface GenerateContextOptions {
  rootDir?: string;
  outputDir?: string;
  excludePatterns?: string[];
  includeExtensions?: string[];
  onProgress?: (message: string) => void;
  onError?: (message: string) => void;
}

export interface GenerateContextResult {
  success: boolean;
  filesCreated: string[];
  error?: string;
}

export interface ProjectBriefResult {
  rootDir: string;
  outputDir: string;
  source: "generated-file" | "live-analysis";
  fresh: boolean;
  brief: string;
}

export async function generateContext(options: GenerateContextOptions = {}): Promise<GenerateContextResult> {
  const rootDir = options.rootDir || process.cwd();
  const outputDir = options.outputDir || path.join(rootDir, "ai-context");
  const filesCreated: string[] = [];
  const progress = options.onProgress || (() => {});
  const errorLog = options.onError || (() => {});

  const writeJson = (fileName: string, value: unknown): string => {
    const filePath = path.join(outputDir, fileName);
    writeFile(filePath, JSON.stringify(value, null, 2));
    filesCreated.push(filePath);
    return filePath;
  };

  try {
    progress(`\n🔍 Scanning repository: ${rootDir}\n`);
    const scanResult = scanRepo(rootDir);
    progress(`   Found ${scanResult.totalFiles} files\n`);

    progress(`📁 Creating output directory: ${outputDir}`);
    ensureDir(outputDir);

    progress("📊 Generating repository map...");
    const repoMap = generateRepoMap(scanResult.files, { sortBy: "directory" });
    const compactMap = generateCompactRepoMap(scanResult.files);
    const repoMapPath = path.join(outputDir, "repo_map.md");
    writeFile(repoMapPath, repoMap + "\n\n" + compactMap);
    filesCreated.push(repoMapPath);
    progress("   ✅ Created repo_map.md");

    progress("📊 Generating machine-readable repo map...");
    writeJson("repo_map.json", generateRepoMapObject(scanResult.files));
    progress("   ✅ Created repo_map.json");

    const summary = generateSummary(scanResult.files);
    const summaryPath = path.join(outputDir, "summary.md");
    writeFile(summaryPath, summary);
    filesCreated.push(summaryPath);
    progress("   ✅ Created summary.md");

    progress("🏗️  Analyzing architecture...");
    const architecture = analyzeArchitecture(scanResult.files, rootDir);
    const architecturePath = path.join(outputDir, "architecture.md");
    writeFile(architecturePath, generateArchitectureFile(architecture));
    filesCreated.push(architecturePath);
    progress("   ✅ Created architecture.md");

    progress("🛠️  Detecting tech stack...");
    const techStack = detectTechStack(scanResult.files, rootDir);
    const techStackPath = path.join(outputDir, "tech_stack.md");
    writeFile(techStackPath, generateTechStackFile(techStack));
    filesCreated.push(techStackPath);
    progress("   ✅ Created tech_stack.md");

    progress("🚪 Discovering entrypoints...");
    const entrypoints = discoverEntrypoints(scanResult.files, rootDir);
    const entrypointsPath = path.join(outputDir, "entrypoints.md");
    writeFile(entrypointsPath, generateEntrypointsFile(entrypoints));
    filesCreated.push(entrypointsPath);
    progress("   ✅ Created entrypoints.md");

    progress("📝 Detecting conventions...");
    const conventions = detectConventions(scanResult.files, rootDir);
    const conventionsPath = path.join(outputDir, "conventions.md");
    writeFile(conventionsPath, generateConventionsFile(conventions));
    filesCreated.push(conventionsPath);
    progress("   ✅ Created conventions.md");

    progress("🔎 Extracting symbols...");
    const symbols = extractSymbols(scanResult.files);
    const symbolsPath = path.join(outputDir, "symbols.json");
    writeFile(symbolsPath, generateSymbolsJson(symbols));
    filesCreated.push(symbolsPath);
    progress("   ✅ Created symbols.json");

    progress("🔗 Analyzing dependencies...");
    const dependencies = analyzeDependencies(scanResult.files);
    const depsPath = path.join(outputDir, "dependencies.json");
    writeFile(depsPath, generateDependenciesJson(dependencies));
    filesCreated.push(depsPath);
    progress("   ✅ Created dependencies.json");

    progress("🤖 Generating AI rules...");
    const aiRules = generateAIRules(scanResult.files, rootDir);
    const aiRulesPath = path.join(outputDir, "ai_rules.md");
    writeFile(aiRulesPath, generateAIRulesFile(aiRules, scanResult.files, rootDir));
    filesCreated.push(aiRulesPath);
    progress("   ✅ Created ai_rules.md");

    progress("🚀 Extracting project setup...");
    const projectSetup = extractProjectSetup(rootDir);
    writeJson("setup.json", projectSetup);
    progress("   ✅ Created setup.json");

    progress("📦 Extracting dependency versions...");
    const depVersions = extractDependencyVersions(rootDir);
    writeJson("dependency-versions.json", depVersions);
    progress("   ✅ Created dependency-versions.json");

    progress("🧪 Mapping test files...");
    const testMapping = mapTestFiles(rootDir);
    writeJson("test-mapping.json", testMapping);
    progress("   ✅ Created test-mapping.json");

    progress("📊 Extracting data models...");
    const dataModels = extractDataModels(rootDir);
    writeJson("data-models.json", dataModels);
    progress("   ✅ Created data-models.json");

    progress("📅 Extracting recent changes...");
    const recentChanges = extractRecentChanges(rootDir);
    writeJson("recent-changes.json", recentChanges);
    progress("   ✅ Created recent-changes.json");

    progress("🔍 Extracting cross-cutting concerns...");
    const crossCutting = extractCrossCuttingConcerns(rootDir);
    writeJson("cross-cutting.json", crossCutting);
    progress("   ✅ Created cross-cutting.json");

    progress("⚙️  Analyzing configuration files...");
    const configAnalysis = extractConfigAnalysis(rootDir);
    writeJson("config-analysis.json", configAnalysis);
    progress("   ✅ Created config-analysis.json");

    progress("⚠️  Extracting code gotchas...");
    const gotchas = extractCodeGotchas(rootDir);
    writeJson("gotchas.json", gotchas);
    progress("   ✅ Created gotchas.json");

    progress("🔗 Analyzing dependency impact...");
    const impactAnalysis = analyzeDependencyImpact(rootDir);
    writeJson("impact-analysis.json", impactAnalysis);
    progress("   ✅ Created impact-analysis.json");

    progress("📝 Extracting code patterns...");
    const codePatterns = extractCodePatterns(rootDir);
    writeJson("code-patterns.json", codePatterns);
    progress("   ✅ Created code-patterns.json");

    progress("🚫 Detecting anti-patterns...");
    const antiPatterns = detectAntiPatterns(rootDir);
    writeJson("anti-patterns.json", antiPatterns);
    progress("   ✅ Created anti-patterns.json");

    progress("🔒 Running security audit...");
    const securityIssues = detectSecurityIssues(rootDir);
    writeJson("security-audit.json", securityIssues);
    progress("   ✅ Created security-audit.json");

    progress("⚡ Analyzing performance...");
    const performanceIssues = detectPerformanceIssues(rootDir);
    writeJson("performance.json", performanceIssues);
    progress("   ✅ Created performance.json");

    progress("📊 Generating context diff...");
    const contextDiff = generateContextDiff(outputDir);
    writeJson("context-diff.json", contextDiff);
    progress("   ✅ Created context-diff.json");

    progress("💀 Detecting dead code...");
    const deadCode = detectDeadCode(rootDir);
    writeJson("dead-code.json", deadCode);
    progress("   ✅ Created dead-code.json");

    progress("📚 Analyzing documentation coverage...");
    const docCoverage = analyzeDocCoverage(rootDir);
    writeJson("doc-coverage.json", docCoverage);
    progress("   ✅ Created doc-coverage.json");

    progress("🔄 Detecting CI/CD pipeline...");
    const cicdConfig = detectCICD(rootDir);
    writeJson("cicd.json", cicdConfig);
    progress("   ✅ Created cicd.json");

    progress("🗄️  Detecting database migrations...");
    const migrations = detectMigrations(rootDir);
    writeJson("migrations.json", migrations);
    progress("   ✅ Created migrations.json");

    progress("📋 Generating unified AI context...");
    const aiContextPath = path.join(outputDir, "ai_context.md");
    writeFile(aiContextPath, generateUnifiedContext({
      repoMap, summary, architecture, techStack, entrypoints, conventions, aiRules,
      projectSetup, depVersions, testMapping, dataModels, recentChanges, crossCutting,
      configAnalysis, gotchas, impactAnalysis, codePatterns, antiPatterns, securityIssues,
      performanceIssues, contextDiff, deadCode, docCoverage, cicdConfig, migrations,
      projectDescription: readProjectDescription(rootDir),
    }));
    filesCreated.push(aiContextPath);
    progress("   ✅ Created ai_context.md");

    progress("📦 Generating modules...");
    const modules = buildModules(scanResult.files);
    fs.writeFileSync(path.join(outputDir, "modules.json"), JSON.stringify({ modules }, null, 2));
    progress("   ✅ modules.json");

    try {
      const { features, flows } = generateSemanticContexts(outputDir);
      progress(`   ✅ Created ${features.length} features, ${flows.length} flows`);
    } catch (error) {
      progress("   ⚠️  Semantic contexts: " + formatError(error));
    }

    try {
      generateAllSchema(rootDir, outputDir);
      progress("   ✅ Created schema.json, project.json, tools.json");
    } catch (error) {
      progress("   ⚠️  Schema generation: " + formatError(error));
    }

    progress("🧾 Generating context manifest...");
    const manifestPath = writeContextManifest(createContextManifest({
      rootDir,
      outputDir,
      files: scanResult.files,
      aiFirstVersion: getAIFirstVersion(),
      preset: null,
    }));
    filesCreated.push(manifestPath);
    progress("   ✅ Created context_manifest.json");

    progress("🧭 Generating agent brief...");
    const agentBriefPath = path.join(outputDir, "agent_brief.md");
    writeFile(agentBriefPath, generateAgentBrief({
      rootDir,
      setup: projectSetup,
      techStack,
      architecture,
      freshness: checkContextFreshness(rootDir, outputDir),
    }));
    filesCreated.push(agentBriefPath);
    progress("   ✅ Created agent_brief.md");

    return { success: true, filesCreated };
  } catch (error) {
    const message = formatError(error);
    errorLog(`\n❌ Error: ${message}`);
    return { success: false, filesCreated, error: message };
  }
}

export function getProjectBrief(rootDir: string, outputDir = path.join(rootDir, "ai-context")): ProjectBriefResult {
  const briefPath = path.join(outputDir, "agent_brief.md");
  const freshness = checkContextFreshness(rootDir, outputDir);

  if (fs.existsSync(briefPath)) {
    return {
      rootDir,
      outputDir,
      source: "generated-file",
      fresh: freshness.fresh,
      brief: fs.readFileSync(briefPath, "utf-8"),
    };
  }

  const scanResult = scanRepo(rootDir);
  const setup = extractProjectSetup(rootDir);
  const techStack = detectTechStack(scanResult.files, rootDir);
  const architecture = analyzeArchitecture(scanResult.files, rootDir);

  return {
    rootDir,
    outputDir,
    source: "live-analysis",
    fresh: freshness.fresh,
    brief: generateAgentBrief({
      rootDir,
      setup,
      techStack,
      architecture,
      freshness,
    }),
  };
}

function generateRepoMapObject(files: { relativePath: string; name: string; extension: string }[]): unknown {
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

  return {
    generated: new Date().toISOString(),
    totalFiles: files.length,
    structure: tree,
    files: files.map(file => ({
      path: file.relativePath,
      name: file.name,
      extension: file.extension,
    })),
  };
}

function buildModules(files: Array<{ relativePath: string }>): Record<string, { path: string; files: string[] }> {
  const modules: Record<string, { path: string; files: string[] }> = {};

  for (const file of files) {
    const parts = file.relativePath.split("/");
    if (parts.length > 1 && parts[0] !== "ai") {
      if (!modules[parts[0]]) modules[parts[0]] = { path: parts[0], files: [] };
      modules[parts[0]].files.push(file.relativePath);
    }
  }

  return modules;
}

function readProjectDescription(rootDir: string): string | undefined {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8")) as { description?: string };
    return pkg.description;
  } catch {
    return undefined;
  }
}

function getAIFirstVersion(): string {
  try {
    const packagePath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8")) as { version?: string };
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
