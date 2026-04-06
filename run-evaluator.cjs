const { HierarchicalEvaluator } = require('./node_modules/ai-first-evaluator/dist/core/evaluation/hierarchical-evaluator.js');

const projects = [
  { name: 'android-kotlin-app', path: './test-projects/android-kotlin-app' },
  { name: 'django-app', path: './test-projects/django-app' },
  { name: 'express-api', path: './test-projects/express-api' },
  { name: 'fastapi-app', path: './test-projects/fastapi-app' },
  { name: 'flask-app', path: './test-projects/flask-app' },
  { name: 'go-microservice', path: './test-projects/go-microservice' },
  { name: 'ios-swift-app', path: './test-projects/ios-swift-app' },
  { name: 'laravel-app', path: './test-projects/laravel-app' },
  { name: 'nestjs-backend', path: './test-projects/nestjs-backend' },
  { name: 'php-vanilla', path: './test-projects/php-vanilla' },
  { name: 'python-cli', path: './test-projects/python-cli' },
  { name: 'rails-app', path: './test-projects/rails-app' },
  { name: 'react-app', path: './test-projects/react-app' },
  { name: 'rust-cli', path: './test-projects/rust-cli' },
  { name: 'salesforce-cli', path: './test-projects/salesforce-cli' },
  { name: 'salesforce-enterprise', path: './test-projects/salesforce-enterprise' },
  { name: 'spring-boot-app', path: './test-projects/spring-boot-app' },
];

const evaluator = new HierarchicalEvaluator(3.5);

async function evaluateAll() {
  const results = [];
  
  for (const project of projects) {
    console.log(`\n=== Evaluando: ${project.name} ===`);
    try {
      const result = await evaluator.evaluateWithAI(project.path, project.name);
      console.log(`✅ ${project.name}: Local=${result.normalizedScore}`);
      results.push({ name: project.name, ...result });
    } catch (e) {
      console.log(`❌ Error en ${project.name}: ${e.message}`);
    }
  }
  
  console.log('\n=== RESUMEN ===');
  results.forEach(r => console.log(`${r.name}: ${r.normalizedScore}`));
}

evaluateAll();
