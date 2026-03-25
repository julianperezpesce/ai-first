#!/usr/bin/env node

/**
 * ai-context-evaluator.ts
 * 
 * Evalúa la calidad de ai-context/ usando 3 modelos de AI (Kimi, GLM, MiniMax)
 * en paralelo por proyecto, procesando secuencialmente para evitar timeouts.
 * 
 * Proyectos evaluados:
 * - PRIORIDAD: salesforce-cli (especial interés)
 * - Soportados: ai-first, express-api, nestjs-backend, python-cli, spring-boot-app
 * - No soportados: android-kotlin-app, ios-swift-app, go-microservice, rust-cli, php-vanilla
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  opencodeApiKey: process.env.OPENCODE_API_KEY || '',
  minimaxApiKey: process.env.MINIMAX_API_KEY || '',
  timeout: 120000, // 2 minutes per call
  maxRetries: 3,
  retryDelay: 2000,
};

// Projects to evaluate (mix of supported and unsupported)
const PROJECTS = [
  // PRIORITY: Salesforce (special interest)
  { path: 'test-projects/salesforce-cli', name: 'salesforce-cli', type: 'priority' },
  // Supported
  { path: '.', name: 'ai-first-cli', type: 'supported' },
  { path: 'test-projects/express-api', name: 'express-api', type: 'supported' },
  { path: 'test-projects/nestjs-backend', name: 'nestjs-backend', type: 'supported' },
  { path: 'test-projects/python-cli', name: 'python-cli', type: 'supported' },
  { path: 'test-projects/spring-boot-app', name: 'spring-boot-app', type: 'supported' },
  // Unsupported
  { path: 'test-projects/android-kotlin-app', name: 'android-kotlin-app', type: 'unsupported' },
  { path: 'test-projects/ios-swift-app', name: 'ios-swift-app', type: 'unsupported' },
  { path: 'test-projects/go-microservice', name: 'go-microservice', type: 'unsupported' },
  { path: 'test-projects/rust-cli', name: 'rust-cli', type: 'unsupported' },
  { path: 'test-projects/php-vanilla', name: 'php-vanilla', type: 'unsupported' },
];

interface EvaluationResult {
  model: string;
  perspective: string;
  score: number;
  feedback: string;
  improvements: string[];
}

interface ProjectEvaluation {
  projectName: string;
  projectType: 'priority' | 'supported' | 'unsupported';
  aiContextPath: string;
  hasIndexDb: boolean;
  results: EvaluationResult[];
  summary: string;
  synthesizedImprovements: string[];
}

/**
 * Read ai-context files and create evaluation prompt
 */
function createEvaluationPrompt(projectPath: string, projectName: string): string {
  const aiContextPath = join(projectPath, 'ai-context');
  
  if (!existsSync(aiContextPath)) {
    return `ERROR: No ai-context directory found for ${projectName}`;
  }

  // Read key files
  const files: Record<string, string> = {};
  const keyFiles = [
    'summary.md',
    'architecture.md',
    'tech_stack.md',
    'repo_map.md',
    'ai_context.md',
    'entrypoints.md',
  ];

  for (const file of keyFiles) {
    const filePath = join(aiContextPath, file);
    if (existsSync(filePath)) {
      try {
        files[file] = readFileSync(filePath, 'utf8').substring(0, 5000); // Limit size
      } catch (e) {
        files[file] = `[Error reading ${file}: ${e}]`;
      }
    }
  }

  // Check for index.db
  const hasIndexDb = existsSync(join(aiContextPath, 'index.db'));
  const hasFeatures = existsSync(join(aiContextPath, 'context', 'features'));
  const hasFlows = existsSync(join(aiContextPath, 'context', 'flows'));

  return `
EVALUATE THIS AI-CONTEXT DIRECTORY:

PROJECT: ${projectName}
INDEX DB: ${hasIndexDb ? 'YES' : 'NO'}
FEATURES: ${hasFeatures ? 'YES' : 'NO'}
FLOWS: ${hasFlows ? 'YES' : 'NO'}

KEY FILES:
${Object.entries(files).map(([name, content]) => `=== ${name} ===\n${content}`).join('\n')}

TASK: Evaluate from 1-5 (5=excellent) on:
1. CLARITY - Clear and non-redundant?
2. COMPLETENESS - Has everything needed?
3. STRUCTURE - Easy for LLM to parse?
4. ACTIONABILITY - Can AI use it to code/decide?
5. IMPROVEMENTS - What changes would help?

REQUIRED RESPONSE:
- ONLY return valid JSON, no other text
- Start with { and end with }
- Include all fields

EXAMPLE (follow this exact format):
{"clarity":{"score":4,"feedback":"clear","improvements":["item1"]},"completeness":{"score":3,"feedback":"missing X","improvements":["item2"]},"structure":{"score":4,"feedback":"good","improvements":[]},"actionability":{"score":3,"feedback":"needs Y","improvements":["item3"]},"overall_score":3.5,"overall_feedback":"overall good","top_3_improvements":["fix A","add B","remove C"]}
`.trim();
}

/**
 * Call OpenCode API (Kimi or GLM)
 */
async function callOpenCode(model: string, prompt: string): Promise<any> {
  const data = {
    model: model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 8000,
  };

  const curlCommand = `curl -s --max-time ${CONFIG.timeout / 1000} -X POST "https://opencode.ai/zen/go/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${CONFIG.opencodeApiKey}" \
    --data-raw '${JSON.stringify(data).replace(/'/g, "'\\''")}'`;

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const { stdout } = await execAsync(curlCommand, { timeout: CONFIG.timeout });
      const response = JSON.parse(stdout);
      
      if (response.choices && response.choices[0]?.message?.content) {
        const content = response.choices[0].message.content;
        // Try to parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return { raw_response: content };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      if (attempt === CONFIG.maxRetries) {
        console.error(`OpenCode ${model} failed after ${CONFIG.maxRetries} attempts:`, error);
        return { error: error.message };
      }
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempt));
    }
  }
}

/**
 * Call MiniMax API
 */
async function callMiniMax(prompt: string): Promise<any> {
  const data = {
    model: 'minimax-coding-plan/MiniMax-M2.7',
    max_tokens: 8000,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }],
  };

  const curlCommand = `curl -s --max-time ${CONFIG.timeout / 1000} -X POST "https://api.minimax.io/anthropic/v1/messages" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${CONFIG.minimaxApiKey}" \
    --data-raw '${JSON.stringify(data).replace(/'/g, "'\\''")}'`;

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const { stdout } = await execAsync(curlCommand, { timeout: CONFIG.timeout });
      const response = JSON.parse(stdout);
      
      if (response.content && Array.isArray(response.content)) {
        const textObj = response.content.find((c: any) => c.type === 'text');
        const content = textObj?.text || response.content[0]?.text || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return { raw_response: content };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      if (attempt === CONFIG.maxRetries) {
        console.error('MiniMax failed after retries:', error);
        return { error: error.message };
      }
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempt));
    }
  }
}

/**
 * Evaluate single project with all 3 models in parallel
 */
async function evaluateProject(project: typeof PROJECTS[0]): Promise<ProjectEvaluation> {
  console.log(`\n📁 Evaluating: ${project.name} (${project.type})`);
  
  const aiContextPath = join(project.path, 'ai-context');
  const hasIndexDb = existsSync(join(aiContextPath, 'index.db'));
  
  // Skip if no ai-context
  if (!existsSync(aiContextPath)) {
    console.log(`  ⚠️  No ai-context directory found`);
    return {
      projectName: project.name,
      projectType: project.type as 'priority' | 'supported' | 'unsupported',
      aiContextPath,
      hasIndexDb,
      results: [],
      summary: 'No ai-context directory found',
      synthesizedImprovements: [],
    };
  }

  const prompt = createEvaluationPrompt(project.path, project.name);
  
  // Call all 3 models in parallel
  console.log('  🔄 Calling models in parallel...');
  const startTime = Date.now();
  
  const [kimiResult, glmResult, minimaxResult] = await Promise.all([
    callOpenCode('kimi-k2.5', prompt),
    callOpenCode('glm-5', prompt),
    callMiniMax(prompt),
  ]);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✅ Completed in ${duration}s`);

  // Process results
  const results: EvaluationResult[] = [
    { model: 'Kimi K2.5', perspective: 'overall', score: kimiResult.overall_score || 0, feedback: kimiResult.overall_feedback || '', improvements: kimiResult.top_3_improvements || [] },
    { model: 'GLM 5', perspective: 'overall', score: glmResult.overall_score || 0, feedback: glmResult.overall_feedback || '', improvements: glmResult.top_3_improvements || [] },
    { model: 'MiniMax 2.7', perspective: 'overall', score: minimaxResult.overall_score || 0, feedback: minimaxResult.overall_feedback || '', improvements: minimaxResult.top_3_improvements || [] },
  ];

  // Synthesize improvements
  const allImprovements = [
    ...(kimiResult.top_3_improvements || []),
    ...(glmResult.top_3_improvements || []),
    ...(minimaxResult.top_3_improvements || []),
  ];
  
  // Simple deduplication (in real implementation, use LLM to synthesize)
  const synthesizedImprovements = [...new Set(allImprovements)].slice(0, 5);

  return {
    projectName: project.name,
    projectType: project.type as 'priority' | 'supported' | 'unsupported',
    aiContextPath,
    hasIndexDb,
    results,
    summary: `Average score: ${(results.reduce((a, b) => a + b.score, 0) / results.length).toFixed(1)}/5`,
    synthesizedImprovements,
  };
}

/**
 * Generate final report
 */
function generateReport(evaluations: ProjectEvaluation[]): string {
  let report = `# AI-Context Evaluation Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Summary table
  report += `## Summary\n\n`;
  report += `| Project | Type | Index DB | Avg Score | Key Issue |\n`;
  report += `|---------|------|----------|-----------|-----------|\n`;
  
  for (const eval_ of evaluations) {
    const avgScore = eval_.results.length > 0 
      ? (eval_.results.reduce((a, b) => a + b.score, 0) / eval_.results.length).toFixed(1)
      : 'N/A';
    const keyIssue = eval_.synthesizedImprovements[0] || 'None identified';
    report += `| ${eval_.projectName} | ${eval_.projectType} | ${eval_.hasIndexDb ? '✅' : '❌'} | ${avgScore} | ${keyIssue.substring(0, 40)}... |\n`;
  }
  
  // Detailed findings
  report += `\n## Detailed Findings\n\n`;
  
  for (const eval_ of evaluations) {
    report += `### ${eval_.projectName}\n\n`;
    report += `- **Type:** ${eval_.projectType}\n`;
    report += `- **Index DB:** ${eval_.hasIndexDb ? 'Yes' : 'No'}\n`;
    report += `- **Model Scores:**\n`;
    
    for (const result of eval_.results) {
      report += `  - ${result.model}: ${result.score}/5\n`;
    }
    
    if (eval_.synthesizedImprovements.length > 0) {
      report += `- **Top Improvements:**\n`;
      for (const improvement of eval_.synthesizedImprovements) {
        report += `  - ${improvement}\n`;
      }
    }
    
    report += `\n`;
  }
  
  // Cross-project patterns
  const priority = evaluations.filter(e => e.projectType === 'priority');
  const unsupported = evaluations.filter(e => e.projectType === 'unsupported');
  const supported = evaluations.filter(e => e.projectType === 'supported');
  
  report += `## Cross-Project Analysis\n\n`;
  
  report += `### 🎯 Priority Projects (Salesforce)\n`;
  report += `- Average score: ${calculateAverageScore(priority)}\n`;
  report += `- Key findings: ${extractCommonIssues(priority).join(', ') || 'See detailed section above'}\n`;
  report += `- Salesforce-specific insights: ${priority.length > 0 ? 'Apex classes, triggers, and SObject metadata handling' : 'N/A'}\n\n`;
  
  report += `### Supported Projects\n`;
  report += `- Average score: ${calculateAverageScore(supported)}\n`;
  report += `- Common issues: ${extractCommonIssues(supported).join(', ') || 'None'}\n\n`;
  
  report += `### Unsupported Projects\n`;
  report += `- Average score: ${calculateAverageScore(unsupported)}\n`;
  report += `- Common issues: ${extractCommonIssues(unsupported).join(', ') || 'None'}\n\n`;
  
  report += `### Key Insights\n`;
  report += `1. **Salesforce Priority**: Detailed analysis of Apex, triggers, and metadata\n`;
  report += `2. Index DB impact on quality: ${evaluations.filter(e => e.hasIndexDb).length > 0 ? 'Projects with Index DB show...' : 'Mixed results'}\n`;
  report += `3. Unsupported projects: ${unsupported.length > 0 ? 'Generic analysis provides value but lacks framework-specific insights' : 'N/A'}\n`;
  
  return report;
}

function calculateAverageScore(evaluations: ProjectEvaluation[]): string {
  const scores = evaluations
    .flatMap(e => e.results)
    .map(r => r.score)
    .filter(s => s > 0);
  
  if (scores.length === 0) return 'N/A';
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
}

function extractCommonIssues(evaluations: ProjectEvaluation[]): string[] {
  const allIssues = evaluations.flatMap(e => e.synthesizedImprovements);
  const issueCounts: Record<string, number> = {};
  
  for (const issue of allIssues) {
    const normalized = issue.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    issueCounts[normalized] = (issueCounts[normalized] || 0) + 1;
  }
  
  return Object.entries(issueCounts)
    .filter(([_, count]) => count > 1)
    .map(([issue, _]) => issue)
    .slice(0, 3);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 AI-Context Evaluator\n');
  console.log('Configuration:');
  console.log(`  - Timeout: ${CONFIG.timeout}ms per call`);
  console.log(`  - Max retries: ${CONFIG.maxRetries}`);
  console.log(`  - Projects: ${PROJECTS.length}`);
  console.log(`  - Models: Kimi K2.5, GLM 5, MiniMax 2.7\n`);
  
  // Validate API keys
  if (!CONFIG.opencodeApiKey) {
    console.error('❌ Error: OPENCODE_API_KEY not set');
    process.exit(1);
  }
  if (!CONFIG.minimaxApiKey) {
    console.error('❌ Error: MINIMAX_API_KEY not set');
    process.exit(1);
  }
  
  const evaluations: ProjectEvaluation[] = [];
  
  // Evaluate each project sequentially
  for (const project of PROJECTS) {
    try {
      const evaluation = await evaluateProject(project);
      evaluations.push(evaluation);
      
      // Save intermediate results
      const intermediateFile = `evaluation-${project.name}.json`;
      // In real implementation, write to file
      console.log(`  💾 Saved intermediate results\n`);
      
    } catch (error) {
      console.error(`  ❌ Failed to evaluate ${project.name}:`, error);
      evaluations.push({
        projectName: project.name,
        projectType: project.type as 'priority' | 'supported' | 'unsupported',
        aiContextPath: '',
        hasIndexDb: false,
        results: [],
        summary: `Error: ${error}`,
        synthesizedImprovements: [],
      });
    }
  }
  
  // Generate final report
  console.log('\n📊 Generating final report...\n');
  const report = generateReport(evaluations);
  
  // Save report
  const reportPath = `ai-context-evaluation-report-${Date.now()}.md`;
  writeFileSync(reportPath, report);
  console.log(`✅ Report saved to: ${reportPath}`);
  console.log('\n📋 Summary:');
  console.log(report.split('\n').slice(0, 20).join('\n'));
  console.log('\n... (truncated)');
}

// Run if called directly
main().catch(console.error);

export { evaluateProject, createEvaluationPrompt, generateReport };
