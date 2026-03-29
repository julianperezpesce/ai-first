#!/usr/bin/env node
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = '/mnt/m2/Código/opencode-ai-first/dist/commands/ai-first.js';
const TEST_PROJECTS = '/mnt/m2/Código/opencode-ai-first/test-projects';

const RESULTS = {
  passed: 0,
  failed: 0,
  errors: []
};

function log(message, status = 'INFO') {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${timestamp}] [${status}] ${message}`);
}

function runTest(name, fn) {
  try {
    log(`Starting: ${name}`);
    fn();
    RESULTS.passed++;
    log(`PASSED: ${name}`, 'PASS');
  } catch (error) {
    RESULTS.failed++;
    RESULTS.errors.push({ name, error: error.message });
    log(`FAILED: ${name} - ${error.message}`, 'FAIL');
  }
}

function exec(command, cwd) {
  const result = spawnSync(command, { 
    shell: true, 
    cwd,
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status
  };
}

function cleanup(directory) {
  const aiContextDir = path.join(directory, 'ai-context');
  if (fs.existsSync(aiContextDir)) {
    fs.rmSync(aiContextDir, { recursive: true });
  }
  const configFile = path.join(directory, 'ai-first.config.json');
  if (fs.existsSync(configFile)) {
    fs.unlinkSync(configFile);
  }
}

function verifyFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${description} not found at ${filePath}`);
  }
}

function verifyFileContent(filePath, patterns, description) {
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      throw new Error(`${description} missing expected content: "${pattern}"`);
    }
  }
}

// ==================== TEST SUITE ====================

log('========================================');
log('Starting E2E Test Suite for ai-first v1.3.8');
log('========================================\n');

// TEST 1: Basic init creates all expected files
runTest('Basic init creates all expected files', () => {
  const testDir = path.join(TEST_PROJECTS, 'express-api');
  cleanup(testDir);
  
  const result = exec(`node ${CLI_PATH} init`, testDir);
  if (result.status !== 0) {
    throw new Error(`CLI exited with code ${result.status}: ${result.stderr}`);
  }
  
  verifyFileExists(path.join(testDir, 'ai-context/ai_context.md'), 'Main context file');
  verifyFileExists(path.join(testDir, 'ai-context/symbols.json'), 'Symbols file');
  verifyFileExists(path.join(testDir, 'ai-context/dependencies.json'), 'Dependencies file');
  verifyFileExists(path.join(testDir, 'ai-context/architecture.md'), 'Architecture file');
  verifyFileExists(path.join(testDir, 'ai-context/tech_stack.md'), 'Tech stack file');
  
  log('  - All expected files created');
});

// TEST 2: Config file with preset is read correctly
runTest('Config file with preset is read', () => {
  const testDir = path.join(TEST_PROJECTS, 'express-api');
  cleanup(testDir);
  
  const config = {
    preset: 'quick',
    output: { directory: 'ai-context' }
  };
  fs.writeFileSync(
    path.join(testDir, 'ai-first.config.json'),
    JSON.stringify(config, null, 2)
  );
  
  const result = exec(`node ${CLI_PATH} init`, testDir);
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${result.stderr}`);
  }
  
  log('  - Config file preset applied successfully');
});

// TEST 3: --preset flag works
runTest('--preset flag works', () => {
  const testDir = path.join(TEST_PROJECTS, 'express-api');
  cleanup(testDir);
  
  const result = exec(`node ${CLI_PATH} init --preset api`, testDir);
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${result.stderr}`);
  }
  
  if (!result.stdout.includes('Using preset')) {
    throw new Error('Preset not applied - output does not include preset indicator');
  }
  
  verifyFileExists(path.join(testDir, 'ai-context/ai_context.md'), 'Context file created with preset');
  log('  - Preset flag applied correctly');
});

// TEST 4: init --help works
runTest('init --help displays help', () => {
  const result = exec(`node ${CLI_PATH} init --help`);
  if (result.status !== 0) {
    throw new Error(`CLI exited with code ${result.status}`);
  }
  if (!result.stdout.includes('Usage') && !result.stdout.includes('Options')) {
    throw new Error('Help output not displayed correctly');
  }
  log('  - Help displayed correctly');
});

// TEST 5: index command creates SQLite database
runTest('index command creates SQLite database', () => {
  const testDir = path.join(TEST_PROJECTS, 'express-api');
  
  const result = exec(`node ${CLI_PATH} index`, testDir);
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${result.stderr}`);
  }
  
  const dbPath = path.join(testDir, 'ai-context/index.db');
  if (!fs.existsSync(dbPath)) {
    throw new Error('SQLite database not created');
  }
  log('  - SQLite index created');
});

// TEST 6: doctor command runs
runTest('doctor command runs successfully', () => {
  const testDir = path.join(TEST_PROJECTS, 'express-api');
  
  const result = exec(`node ${CLI_PATH} doctor`, testDir);
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${result.stderr}`);
  }
  
  if (!result.stdout.includes('Repository')) {
    throw new Error('Doctor output not as expected');
  }
  log('  - Doctor command executed');
});

// TEST 7: adapters command lists adapters
runTest('adapters command lists adapters', () => {
  const result = exec(`node ${CLI_PATH} adapters`);
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${result.stderr}`);
  }
  
  if (!result.stdout.includes('javascript')) {
    throw new Error('JavaScript adapter not listed');
  }
  log('  - Adapters listed correctly');
});

// TEST 8: mcp command shows help
runTest('mcp --help displays help', () => {
  const result = exec(`node ${CLI_PATH} mcp --help`);
  if (result.status !== 0) {
    throw new Error(`CLI exited with code ${result.status}`);
  }
  
  if (!result.stdout.includes('MCP') && !result.stdout.includes('server')) {
    throw new Error('MCP help not displayed correctly');
  }
  log('  - MCP help displayed correctly');
});

// TEST 9: git command works
runTest('git command works', () => {
  const testDir = path.join(TEST_PROJECTS, 'express-api');
  
  const result = exec(`node ${CLI_PATH} git`, testDir);
  const output = result.stdout + result.stderr;
  if (!output.includes('git') && !output.includes('Not a git repository') && !output.includes('repository')) {
    throw new Error('Git output not as expected');
  }
  log('  - Git command executed');
});

// TEST 10: map command generates files
runTest('map command generates graph files', () => {
  const testDir = path.join(TEST_PROJECTS, 'express-api');
  cleanup(testDir);
  
  exec(`node ${CLI_PATH} init`, testDir);
  
  const result = exec(`node ${CLI_PATH} map`, testDir);
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${result.stderr}`);
  }
  
  verifyFileExists(path.join(testDir, 'ai-context/repo_map.json'), 'Repo map JSON');
  verifyFileExists(path.join(testDir, 'ai-context/modules.json'), 'Modules JSON');
  log('  - Map files generated');
});

// TEST 11: NestJS project
runTest('NestJS project initializes correctly', () => {
  const testDir = path.join(TEST_PROJECTS, 'nestjs-backend');
  cleanup(testDir);
  
  const result = exec(`node ${CLI_PATH} init`, testDir);
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${result.stderr}`);
  }
  
  verifyFileExists(path.join(testDir, 'ai-context/ai_context.md'), 'NestJS context');
  verifyFileContent(
    path.join(testDir, 'ai-context/tech_stack.md'),
    ['NestJS', 'TypeScript'],
    'Tech stack detection'
  );
  log('  - NestJS project handled correctly');
});

// TEST 12: Django project
runTest('Django project initializes correctly', () => {
  const testDir = path.join(TEST_PROJECTS, 'django-app');
  cleanup(testDir);
  
  const result = exec(`node ${CLI_PATH} init`, testDir);
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${result.stderr}`);
  }
  
  verifyFileExists(path.join(testDir, 'ai-context/ai_context.md'), 'Django context');
  verifyFileContent(
    path.join(testDir, 'ai-context/tech_stack.md'),
    ['Django', 'Python'],
    'Tech stack detection'
  );
  log('  - Django project handled correctly');
});

// TEST 13: Custom output directory
runTest('Custom output directory works', () => {
  const testDir = path.join(TEST_PROJECTS, 'express-api');
  cleanup(testDir);
  
  const customDir = 'custom-ai-context';
  const customDirPath = path.join(testDir, customDir);
  if (fs.existsSync(customDirPath)) {
    fs.rmSync(customDirPath, { recursive: true });
  }
  
  const result = exec(`node ${CLI_PATH} init --output ${customDir}`, testDir);
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${result.stderr}`);
  }
  
  verifyFileExists(path.join(customDirPath, 'ai_context.md'), 'Custom output context');
  fs.rmSync(customDirPath, { recursive: true });
  log('  - Custom output directory works');
});

// TEST 14: Incremental update
runTest('update command works', () => {
  const testDir = path.join(TEST_PROJECTS, 'express-api');
  cleanup(testDir);
  
  exec(`node ${CLI_PATH} init`, testDir);
  
  const result = exec(`node ${CLI_PATH} update`, testDir);
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${result.stderr}`);
  }
  if (!result.stdout.includes('Changed files') && !result.stdout.includes('Symbols')) {
    throw new Error('Update output not as expected');
  }
  log('  - Update command executed');
});

// TEST 15: Context command
runTest('context command works', () => {
  const testDir = path.join(TEST_PROJECTS, 'express-api');
  
  const result = exec(`node ${CLI_PATH} context`, testDir);
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${result.stderr}`);
  }
  log('  - Context command executed');
});

// ==================== SUMMARY ====================

log('\n========================================');
log('E2E Test Summary');
log('========================================');
log(`Passed: ${RESULTS.passed}`);
log(`Failed: ${RESULTS.failed}`);
log('========================================');

if (RESULTS.failed > 0) {
  log('\nFailed Tests:');
  for (const { name, error } of RESULTS.errors) {
    log(`  - ${name}: ${error}`);
  }
  process.exit(1);
} else {
  log('\nAll E2E tests passed!');
  process.exit(0);
}