import { loadConfig, getPreset, listPresets } from './dist/config/configLoader.js';
import { processContent, classifyFile } from './dist/core/content/contentProcessor.js';
import { createVectorIndex, semanticSearch } from './dist/core/rag/vectorIndex.js';
import { scanMultiRepo, generateMultiRepoReport } from './dist/core/multiRepo/multiRepoScanner.js';

console.log('🧪 VALIDACIÓN REAL - ai-first v1.4.0\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

console.log('\n📦 1. CONFIG SYSTEM\n');

test('loadConfig retorna configuración por defecto', () => {
  const result = loadConfig({ configPath: '/tmp/non-existent.json' });
  if (!result.config) throw new Error('No retornó config');
  if (result.source !== 'default') throw new Error('Source incorrecto');
});

test('getPreset(full) retorna preset', () => {
  const preset = getPreset('full');
  if (!preset) throw new Error('Preset no encontrado');
});

test('listPresets retorna 4+ presets', () => {
  const presets = listPresets();
  if (!Array.isArray(presets)) throw new Error('No retornó array');
  if (presets.length < 4) throw new Error('Menos de 4 presets');
});

console.log('\n📄 2. CONTENT PROCESSING\n');

test('processContent reduce con signatures', () => {
  const code = 'function test(x) { return x * 2; }';
  const result = processContent(code, { detailLevel: 'signatures' });
  if (result.compressionRatio <= 0) throw new Error('No comprimió');
});

test('classifyFile funciona', () => {
  const level = classifyFile('src/app.js', ['src/**/*'], [], [], []);
  if (!level) throw new Error('No retornó nivel');
});

console.log('\n🧠 3. RAG VECTOR SEARCH\n');

test('createVectorIndex crea índice', () => {
  const index = createVectorIndex('/tmp/test-ai-first.json');
  if (!index) throw new Error('No creó índice');
});

test('semanticSearch retorna array', () => {
  const index = createVectorIndex('/tmp/test-ai-first-2.json');
  index.addDocument({
    id: '1',
    content: 'function test() {}',
    embedding: Array(100).fill(0).map((_, i) => Math.sin(i)),
    metadata: { filePath: 'test.js' }
  });
  const results = semanticSearch(index, 'test', 1);
  if (!Array.isArray(results)) throw new Error('No retornó array');
});

console.log('\n🌐 4. MULTI-REPOSITORY\n');

test('scanMultiRepo escanea directorio', () => {
  const context = scanMultiRepo({ repositories: ['.'] });
  if (!context.repositories) throw new Error('No retornó repositories');
  if (context.totalFiles <= 0) throw new Error('No hay archivos');
});

test('generateMultiRepoReport genera markdown', () => {
  const context = scanMultiRepo({ repositories: ['.'] });
  const report = generateMultiRepoReport(context);
  if (!report || report.length === 0) throw new Error('Reporte vacío');
});

console.log('\n💻 5. API PÚBLICA\n');

test('Exports de config disponibles', () => {
  if (typeof loadConfig !== 'function') throw new Error('loadConfig no funciona');
  if (typeof getPreset !== 'function') throw new Error('getPreset no funciona');
  if (typeof listPresets !== 'function') throw new Error('listPresets no funciona');
});

test('Exports de content disponibles', () => {
  if (typeof processContent !== 'function') throw new Error('processContent no funciona');
  if (typeof classifyFile !== 'function') throw new Error('classifyFile no funciona');
});

test('Exports de rag disponibles', () => {
  if (typeof createVectorIndex !== 'function') throw new Error('createVectorIndex no funciona');
  if (typeof semanticSearch !== 'function') throw new Error('semanticSearch no funciona');
});

test('Exports de multiRepo disponibles', () => {
  if (typeof scanMultiRepo !== 'function') throw new Error('scanMultiRepo no funciona');
  if (typeof generateMultiRepoReport !== 'function') throw new Error('generateMultiRepoReport no funciona');
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTADOS: ${passed} ✅ | ${failed} ❌ | ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed > 0) process.exit(1);
