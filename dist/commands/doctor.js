import fs from "fs";
import path from "path";
import { scanRepo } from "../core/repoScanner.js";
import { mapTestFiles } from "../utils/testFileMapper.js";
import { extractDependencyVersions } from "../utils/dependencyVersionExtractor.js";
export async function runDoctor(rootDir, fixMode) {
    const checks = [];
    const issues = [];
    const warnings = [];
    console.log(`\n🔍 Running AI-First Doctor on: ${rootDir}\n`);
    const scanResult = scanRepo(rootDir);
    checks.push({ name: 'Repository scanned', status: scanResult.totalFiles > 0 ? 'pass' : 'fail', message: `Found ${scanResult.totalFiles} files` });
    const languageCount = new Map();
    for (const file of scanResult.files) {
        const ext = file.extension || 'unknown';
        languageCount.set(ext, (languageCount.get(ext) || 0) + 1);
    }
    const topLanguages = [...languageCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    checks.push({ name: 'Languages detected', status: 'pass', message: topLanguages.map(([l, c]) => `${l} (${c})`).join(', ') });
    const largeFiles = scanResult.files.filter(f => { try {
        return fs.statSync(f.path).size > 1024 * 1024;
    }
    catch {
        return false;
    } });
    checks.push({ name: 'Large files', status: largeFiles.length === 0 ? 'pass' : 'warn', message: largeFiles.length === 0 ? 'No large files' : `${largeFiles.length} large files` });
    const aiDir = path.join(rootDir, "ai-context");
    checks.push({ name: 'AI directory', status: fs.existsSync(aiDir) ? 'pass' : 'warn', message: fs.existsSync(aiDir) ? 'Found' : 'Not found' });
    checks.push({ name: 'Semantic index', status: fs.existsSync(path.join(aiDir, "index")) ? 'pass' : 'warn', message: fs.existsSync(path.join(aiDir, "index")) ? 'Found' : 'Not found' });
    checks.push({ name: 'Module graph', status: fs.existsSync(path.join(aiDir, "graph", "module-graph.json")) ? 'pass' : 'warn', message: 'Run ai-first explore all' });
    checks.push({ name: 'SQLite index', status: fs.existsSync(path.join(aiDir, "index.db")) ? 'pass' : 'warn', message: fs.existsSync(path.join(aiDir, "index.db")) ? 'Found' : 'Not found' });
    const gitignorePath = path.join(rootDir, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, "utf-8");
        const missing = [];
        if (!gitignore.includes("ai-context") && !gitignore.includes("ai-context/"))
            missing.push("ai-context/");
        if (!gitignore.includes("node_modules"))
            missing.push("node_modules/");
        checks.push({ name: '.gitignore', status: missing.length ? 'warn' : 'pass', message: missing.length ? `Missing: ${missing.join(', ')}` : 'OK' });
    }
    const testMapping = mapTestFiles(rootDir);
    const sourcesWithoutTests = scanResult.files
        .filter(f => ['.ts', '.js', '.py'].includes('.' + f.extension))
        .filter(f => !f.relativePath.includes('test') && !f.relativePath.includes('spec'))
        .filter(f => !testMapping.some(m => m.sourceFile === f.relativePath))
        .slice(0, 10);
    checks.push({ name: 'Test coverage', status: sourcesWithoutTests.length > 3 ? 'warn' : 'pass', message: sourcesWithoutTests.length > 3 ? `${sourcesWithoutTests.length}+ files need tests` : 'Good coverage' });
    const deps = extractDependencyVersions(rootDir);
    checks.push({ name: 'Dependencies', status: 'pass', message: `${deps.filter(d => d.type === 'runtime').length} runtime, ${deps.filter(d => d.type === 'dev').length} dev` });
    const readmeExists = fs.existsSync(path.join(rootDir, "README.md"));
    checks.push({ name: 'README', status: readmeExists ? 'pass' : 'warn', message: readmeExists ? 'Found' : 'Not found' });
    console.log("\n" + "=".repeat(50));
    console.log("AI-First Doctor Report");
    console.log("=".repeat(50));
    for (const check of checks) {
        const icon = check.status === 'pass' ? '✔' : check.status === 'warn' ? '⚠' : '✖';
        console.log(`${icon} ${check.name}: ${check.message}`);
    }
    const passCount = checks.filter(c => c.status === 'pass').length;
    const warnCount = checks.filter(c => c.status === 'warn').length;
    const failCount = checks.filter(c => c.status === 'fail').length;
    console.log(`\nSummary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`);
    console.log(failCount > 0 ? "\n✖ Status: NOT READY" : warnCount > 0 ? "\n⚠ Status: PARTIALLY READY" : "\n✔ Status: READY FOR AI AGENTS");
    return { success: failCount === 0, issues, warnings, checks };
}
export function doctorMain(args) {
    let rootDir = process.cwd();
    let fixMode = false;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--root" || arg === "-r")
            rootDir = args[++i];
        else if (arg === "--fix" || arg === "-f")
            fixMode = true;
        else if (arg === "--help" || arg === "-h") {
            console.log("\nai-first doctor - Check repository health\nUsage: ai-first doctor [options]\nOptions: -r, --root <dir> -f, --fix\n");
            process.exit(0);
        }
    }
    runDoctor(rootDir, fixMode).then(r => process.exit(r.success ? 0 : 1));
}
//# sourceMappingURL=doctor.js.map