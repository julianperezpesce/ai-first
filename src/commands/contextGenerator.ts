import { analyzeArchitecture } from "../analyzers/architecture.js";
import { detectTechStack } from "../analyzers/techStack.js";
import { discoverEntrypoints } from "../analyzers/entrypoints.js";
import { detectConventions } from "../analyzers/conventions.js";
import { generateAIRules } from "../analyzers/aiRules.js";
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

export interface UnifiedContextParams {
  repoMap: string;
  summary: string;
  architecture: ReturnType<typeof analyzeArchitecture>;
  techStack: ReturnType<typeof detectTechStack>;
  entrypoints: ReturnType<typeof discoverEntrypoints>;
  conventions: ReturnType<typeof detectConventions>;
  aiRules: ReturnType<typeof generateAIRules>;
  projectSetup?: ReturnType<typeof extractProjectSetup>;
  depVersions?: ReturnType<typeof extractDependencyVersions>;
  testMapping?: ReturnType<typeof mapTestFiles>;
  dataModels?: ReturnType<typeof extractDataModels>;
  recentChanges?: ReturnType<typeof extractRecentChanges>;
  crossCutting?: ReturnType<typeof extractCrossCuttingConcerns>;
  configAnalysis?: ReturnType<typeof extractConfigAnalysis>;
  gotchas?: ReturnType<typeof extractCodeGotchas>;
  impactAnalysis?: ReturnType<typeof analyzeDependencyImpact>;
  codePatterns?: ReturnType<typeof extractCodePatterns>;
  antiPatterns?: ReturnType<typeof detectAntiPatterns>;
  securityIssues?: ReturnType<typeof detectSecurityIssues>;
  performanceIssues?: ReturnType<typeof detectPerformanceIssues>;
  contextDiff?: ReturnType<typeof generateContextDiff>;
  deadCode?: ReturnType<typeof detectDeadCode>;
  docCoverage?: ReturnType<typeof analyzeDocCoverage>;
  cicdConfig?: ReturnType<typeof detectCICD>;
  migrations?: ReturnType<typeof detectMigrations>;
  projectDescription?: string;
}

export function generateUnifiedContext(params: UnifiedContextParams): string {
  const {
    repoMap, summary, architecture, techStack, entrypoints, conventions, aiRules,
    projectSetup, depVersions, testMapping, dataModels, recentChanges, crossCutting,
    configAnalysis, gotchas, impactAnalysis, codePatterns, antiPatterns, securityIssues,
    performanceIssues, contextDiff, deadCode, docCoverage, cicdConfig, migrations
  } = params;

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

  if (params.projectDescription) {
    lines.push(`**What it does**: ${params.projectDescription}`);
    lines.push("");
  }

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

  if (projectSetup && (projectSetup.installCommand || projectSetup.devCommand || projectSetup.testCommand)) {
    lines.push("---\n");
    lines.push("## Quick Start");
    lines.push("");
    lines.push("| Command | Value |");
    lines.push("|---------|-------|");
    if (projectSetup.installCommand) lines.push(`| Install | \`${projectSetup.installCommand}\` |`);
    if (projectSetup.devCommand) lines.push(`| Dev | \`${projectSetup.devCommand}\` |`);
    if (projectSetup.buildCommand) lines.push(`| Build | \`${projectSetup.buildCommand}\` |`);
    if (projectSetup.testCommand) lines.push(`| Test | \`${projectSetup.testCommand}\` |`);
    if (projectSetup.startCommand) lines.push(`| Start | \`${projectSetup.startCommand}\` |`);
    lines.push("");

    if (projectSetup.requirements.length > 0) {
      lines.push("**Requirements**: " + projectSetup.requirements.join(", "));
      lines.push("");
    }

    if (projectSetup.envVars.length > 0) {
      lines.push("**Environment Variables**:");
      lines.push("");
      lines.push("| Variable | Required | Default |");
      lines.push("|----------|----------|---------|");
      for (const envVar of projectSetup.envVars.slice(0, 10)) {
        lines.push(`| ${envVar.name} | ${envVar.required ? "Yes" : "No"} | ${envVar.defaultValue || "-"} |`);
      }
      lines.push("");
    }
  }

  if (depVersions && depVersions.length > 0) {
    lines.push("---\n");
    lines.push("## Key Dependencies");
    lines.push("");
    const runtimeDeps = depVersions.filter(d => d.type === "runtime").slice(0, 15);
    if (runtimeDeps.length > 0) {
      lines.push("| Package | Version | Source |");
      lines.push("|---------|---------|--------|");
      for (const dep of runtimeDeps) {
        lines.push(`| ${dep.name} | ${dep.version} | ${dep.source} |`);
      }
      lines.push("");
    }
  }

  if (dataModels && dataModels.length > 0) {
    lines.push("---\n");
    lines.push("## Data Models");
    lines.push("");
    for (const model of dataModels.slice(0, 5)) {
      lines.push(`### ${model.name} (${model.framework})`);
      lines.push("");
      if (model.fields.length > 0) {
        lines.push("| Field | Type | Required | Unique |");
        lines.push("|-------|------|----------|--------|");
        for (const field of model.fields.slice(0, 10)) {
          lines.push(`| ${field.name} | ${field.type} | ${field.required ? "Yes" : "No"} | ${field.unique ? "Yes" : "No"} |`);
        }
        lines.push("");
      }
      if (model.relationships.length > 0) {
        lines.push("**Relationships**: " + model.relationships.map(r => `${r.type} ${r.target}`).join(", "));
        lines.push("");
      }
    }
  }

  if (testMapping && testMapping.length > 0) {
    lines.push("---\n");
    lines.push("## Test Coverage Map");
    lines.push("");
    const topMappings = testMapping.slice(0, 10);
    for (const mapping of topMappings) {
      lines.push(`- \`${mapping.sourceFile}\` → ${mapping.testFiles.map(t => `\`${t}\``).join(", ")}`);
    }
    lines.push("");
  }

  if (crossCutting) {
    const concerns = [crossCutting.auth, crossCutting.logging, crossCutting.errorHandling, crossCutting.validation, crossCutting.caching].filter(Boolean);
    if (concerns.length > 0) {
      lines.push("---\n");
      lines.push("## Cross-Cutting Concerns");
      lines.push("");
      for (const concern of concerns) {
        if (concern) {
          lines.push(`- **${concern.pattern}**: ${concern.description} (${concern.files.slice(0, 3).map(f => `\`${f}\``).join(", ")})`);
        }
      }
      lines.push("");
    }
  }

  if (configAnalysis) {
    const configs = [];
    if (configAnalysis.typescript) configs.push(`TypeScript: strict=${configAnalysis.typescript.strict}, target=${configAnalysis.typescript.target}`);
    if (configAnalysis.eslint) configs.push(`ESLint: ${configAnalysis.eslint.extends.join(", ") || "custom"}`);
    if (configAnalysis.prettier) configs.push(`Prettier: semi=${configAnalysis.prettier.semi}, singleQuote=${configAnalysis.prettier.singleQuote}`);
    if (configAnalysis.testing) configs.push(`Testing: ${configAnalysis.testing.framework}`);
    if (configAnalysis.docker?.hasDockerfile) configs.push(`Docker: ${configAnalysis.docker.baseImage || "Dockerfile"}`);

    if (configs.length > 0) {
      lines.push("---\n");
      lines.push("## Configuration");
      lines.push("");
      for (const config of configs) {
        lines.push(`- ${config}`);
      }
      lines.push("");
    }
  }

  if (recentChanges && recentChanges.isGitRepo) {
    lines.push("---\n");
    lines.push("## Recent Activity");
    lines.push("");
    if (recentChanges.lastCommit) {
      lines.push(`**Last commit**: ${recentChanges.lastCommit.message} (${recentChanges.lastCommit.author}, ${recentChanges.lastCommit.date.split("T")[0]})`);
      lines.push("");
    }
    if (recentChanges.activeAuthors.length > 0) {
      lines.push("**Active contributors**: " + recentChanges.activeAuthors.map(a => `${a.name} (${a.commits} commits)`).join(", "));
      lines.push("");
    }
    if (recentChanges.activeFiles.length > 0) {
      lines.push("**Recently modified**: " + recentChanges.activeFiles.slice(0, 5).map(f => `\`${f}\``).join(", "));
      lines.push("");
    }
  }

  if (gotchas && (gotchas.todos.length > 0 || gotchas.fixmes.length > 0 || gotchas.hacks.length > 0)) {
    lines.push("---\n");
    lines.push("## Code Notes");
    lines.push("");
    if (gotchas.todos.length > 0) {
      lines.push("**TODOs**:");
      for (const todo of gotchas.todos.slice(0, 5)) {
        lines.push(`- \`${todo.file}:${todo.line}\`: ${todo.text}`);
      }
      lines.push("");
    }
    if (gotchas.fixmes.length > 0) {
      lines.push("**FIXMEs**:");
      for (const fixme of gotchas.fixmes.slice(0, 3)) {
        lines.push(`- \`${fixme.file}:${fixme.line}\`: ${fixme.text}`);
      }
      lines.push("");
    }
  }

  if (codePatterns) {
    const patterns = [codePatterns.controllerPattern, codePatterns.servicePattern, codePatterns.testPattern].filter(Boolean);
    if (patterns.length > 0) {
      lines.push("---\n");
      lines.push("## Code Patterns");
      lines.push("");
      for (const pattern of patterns) {
        if (pattern) {
          lines.push(`### ${pattern.description}`);
          lines.push("```" + pattern.language);
          lines.push(pattern.code.slice(0, 500));
          lines.push("```");
          lines.push("");
        }
      }
    }
  }

  if (securityIssues && securityIssues.length > 0) {
    lines.push("---\n");
    lines.push("## Security Notes");
    lines.push("");
    const criticals = securityIssues.filter(i => i.severity === "critical");
    const warnings = securityIssues.filter(i => i.severity === "warning");
    
    if (criticals.length > 0) {
      lines.push("**Critical**:");
      for (const issue of criticals.slice(0, 3)) {
        lines.push(`- \`${issue.file}:${issue.line}\`: ${issue.description}`);
      }
      lines.push("");
    }
    if (warnings.length > 0) {
      lines.push("**Warnings**:");
      for (const issue of warnings.slice(0, 3)) {
        lines.push(`- \`${issue.file}:${issue.line}\`: ${issue.description}`);
      }
      lines.push("");
    }
  }

  if (performanceIssues && performanceIssues.length > 0) {
    lines.push("---\n");
    lines.push("## Performance Notes");
    lines.push("");
    for (const issue of performanceIssues.slice(0, 5)) {
      lines.push(`- \`${issue.file}:${issue.line}\`: ${issue.description}`);
    }
    lines.push("");
  }

  if (cicdConfig && cicdConfig.workflows.length > 0) {
    lines.push("---\n");
    lines.push("## CI/CD Pipeline");
    lines.push("");
    lines.push(`**Platform**: ${cicdConfig.platform}`);
    lines.push("");
    for (const workflow of cicdConfig.workflows) {
      lines.push(`- **${workflow.name}**: ${workflow.triggers.join(", ")} → ${workflow.jobs.join(", ")}`);
    }
    lines.push("");
  }

  if (migrations && migrations.hasMigrations) {
    lines.push("---\n");
    lines.push("## Database Migrations");
    lines.push("");
    lines.push(`**Framework**: ${migrations.framework}`);
    lines.push(`**Migrations**: ${migrations.migrations.length}`);
    lines.push(`**Tables**: ${migrations.tables.join(", ") || "N/A"}`);
    lines.push("");
  }

  if (docCoverage && docCoverage.totalFunctions > 0) {
    lines.push("---\n");
    lines.push("## Documentation Coverage");
    lines.push("");
    lines.push(`${docCoverage.summary}`);
    lines.push("");
  }

  if (deadCode && (deadCode.unusedFunctions.length > 0 || deadCode.unusedClasses.length > 0)) {
    lines.push("---\n");
    lines.push("## Potentially Unused Code");
    lines.push("");
    if (deadCode.unusedFunctions.length > 0) {
      lines.push("**Functions**: " + deadCode.unusedFunctions.slice(0, 5).map(f => `\`${f.name}\``).join(", "));
    }
    if (deadCode.unusedClasses.length > 0) {
      lines.push("**Classes**: " + deadCode.unusedClasses.slice(0, 3).map(c => `\`${c.name}\``).join(", "));
    }
    lines.push("");
  }

  if (contextDiff && contextDiff.hasPreviousContext) {
    lines.push("---\n");
    lines.push("## Context Changes");
    lines.push("");
    lines.push(contextDiff.summary);
    lines.push("");
  }

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
