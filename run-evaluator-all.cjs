const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projects = [
  { name: 'android-kotlin-app', priority: 'medium' },
  { name: 'django-app', priority: 'high' },
  { name: 'express-api', priority: 'high' },
  { name: 'fastapi-app', priority: 'high' },
  { name: 'flask-app', priority: 'medium' },
  { name: 'go-microservice', priority: 'medium' },
  { name: 'ios-swift-app', priority: 'low' },
  { name: 'laravel-app', priority: 'high' },
  { name: 'nestjs-backend', priority: 'high' },
  { name: 'php-vanilla', priority: 'low' },
  { name: 'python-cli', priority: 'low' },
  { name: 'rails-app', priority: 'high' },
  { name: 'react-app', priority: 'medium' },
  { name: 'rust-cli', priority: 'low' },
  { name: 'salesforce-cli', priority: 'medium' },
  { name: 'salesforce-enterprise', priority: 'medium' },
  { name: 'spring-boot-app', priority: 'high' },
];

const basePath = '/mnt/m2/Código/opencode-ai-first';

const config = {
  projects: projects.map(p => ({
    name: p.name,
    path: `${basePath}/test-projects/${p.name}`,
    priority: p.priority,
    description: p.name
  })),
  evaluation: {
    useAI: true,
    aiModels: ['kimi-k2.5', 'glm-5', 'mimo-v2-pro', 'MiniMax-M2.7'],
    aiThreshold: 3.5,
    useRubric: false,
    useHierarchical: true,
    cacheEnabled: true,
    cacheTTL: 86400000,
    maxRetries: 3,
    timeout: 300000
  },
  thresholds: {
    minimumScore: 3.5,
    failOnRegression: false,
    regressionDelta: 0.5,
    criticalRegressionDelta: 1.0
  },
  baseline: {
    enabled: false,
    directory: '.sisyphus/baselines',
    autoSave: false,
    compareOnRun: false
  },
  reporting: {
    format: 'markdown',
    includeDetails: true,
    includeTrends: false,
    maxImprovements: 10,
    outputDirectory: '.'
  },
  synthesis: {
    useLLM: false,
    maxRecommendations: 10,
    groupByCategory: true
  }
};

async function runProject(project) {
  const projectConfig = {
    ...config,
    projects: [project]
  };
  
  const configPath = `${basePath}/temp-eval-config.json`;
  fs.writeFileSync(configPath, JSON.stringify(projectConfig, null, 2));
  
  try {
    const result = execSync(
      `cd ${basePath} && OPENCODE_API_KEY="${process.env.OPENCODE_API_KEY}" MINIMAX_API_KEY="${process.env.MINIMAX_API_KEY}" node node_modules/ai-first-evaluator/dist/cli.js --config temp-eval-config.json`,
      { encoding: 'utf8', timeout: 300000 }
    );
    return { name: project.name, success: true, output: result };
  } catch (e) {
    return { name: project.name, success: false, error: e.message, output: e.stdout };
  } finally {
    fs.unlinkSync(configPath);
  }
}

async function main() {
  console.log('Iniciando evaluación de 17 proyectos con 4 modelos IA...\n');
  
  for (const project of config.projects) {
    console.log(`\n=== Evaluando: ${project.name} ===`);
    const result = await runProject(project);
    if (result.success) {
      // Extraer score del output
      const scoreMatch = result.output.match(/Score:\s*[\d.]+\/5\.0\s*\(AI avg:\s*([\d.]+)\)/);
      const localMatch = result.output.match(/✅\s*Score:\s*([\d.]+)/);
      if (scoreMatch) {
        console.log(`✅ ${project.name}: Local=4.x, AI avg=${scoreMatch[1]}`);
      } else if (localMatch) {
        console.log(`✅ ${project.name}: ${localMatch[1]}`);
      } else {
        console.log(`✅ ${project.name}: completado`);
      }
    } else {
      console.log(`❌ ${project.name}: ${result.error}`);
    }
  }
  
  console.log('\n=== EVALUACIÓN COMPLETA ===');
}

main().catch(console.error);
