import fs from "fs";
import path from "path";
import { writeFile, ensureDir } from "../utils/fileUtils.js";
import { scanRepo } from "./repoScanner.js";
import { generateRepoMap } from "./repoMapper.js";
import { detectTechStack } from "../analyzers/techStack.js";
import { discoverEntrypoints } from "../analyzers/entrypoints.js";
import { extractSymbols } from "../analyzers/symbols.js";
import { analyzeDependencies } from "../analyzers/dependencies.js";
import { generateSemanticContexts } from "./semanticContexts.js";
import { buildKnowledgeGraph } from "./knowledgeGraphBuilder.js";
/**
 * Build minimal index (Stage 1) - fast startup
 * Generates only essential metadata needed for basic context
 */
export function buildMinimalIndex(rootDir, aiDir) {
    const scanResult = scanRepo(rootDir);
    const techStack = detectTechStack(scanResult.files, rootDir);
    const entrypoints = discoverEntrypoints(scanResult.files, rootDir);
    // Generate minimal repo map
    const repoMap = generateRepoMap(scanResult.files, { sortBy: "directory" });
    // Write minimal index files
    const minimalIndex = {
        repoMap,
        languages: techStack.languages,
        frameworks: techStack.frameworks,
        entrypoints: entrypoints.map(e => e.path),
        generatedAt: new Date().toISOString()
    };
    // Save minimal index state
    const state = {
        stage1Complete: true,
        stage2Complete: false,
        featuresExpanded: [],
        flowsExpanded: [],
        lastUpdated: new Date().toISOString()
    };
    const statePath = path.join(aiDir, "lazy-index-state.json");
    writeFile(statePath, JSON.stringify(state, null, 2));
    // Save minimal data
    writeFile(path.join(aiDir, "minimal-index.json"), JSON.stringify(minimalIndex, null, 2));
    return minimalIndex;
}
/**
 * Expand context for a specific feature (Stage 2 - on demand)
 */
export function expandFeatureContext(rootDir, aiDir, featureName) {
    try {
        const scanResult = scanRepo(rootDir);
        const symbols = extractSymbols(scanResult.files);
        // Filter symbols related to this feature
        const featureSymbols = symbols.symbols.filter((s) => s.file.includes(featureName) || s.name.toLowerCase().includes(featureName.toLowerCase()));
        // Load existing state
        const statePath = path.join(aiDir, "lazy-index-state.json");
        let state = {
            stage1Complete: true,
            stage2Complete: false,
            featuresExpanded: [],
            flowsExpanded: [],
            lastUpdated: new Date().toISOString()
        };
        if (fs.existsSync(statePath)) {
            state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
        }
        // Mark feature as expanded
        if (!state.featuresExpanded.includes(featureName)) {
            state.featuresExpanded.push(featureName);
            state.lastUpdated = new Date().toISOString();
            writeFile(statePath, JSON.stringify(state, null, 2));
        }
        // Generate feature context file
        const featureContextPath = path.join(aiDir, "context", "features", `${featureName}.json`);
        const featureContext = {
            feature: featureName,
            symbols: featureSymbols,
            generatedAt: new Date().toISOString()
        };
        ensureDir(path.dirname(featureContextPath));
        writeFile(featureContextPath, JSON.stringify(featureContext, null, 2));
        return { success: true, files: featureSymbols.map((s) => s.file) };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
/**
 * Expand context for a specific flow (Stage 2 - on demand)
 */
export function expandFlowContext(rootDir, aiDir, flowName) {
    try {
        const scanResult = scanRepo(rootDir);
        const dependencies = analyzeDependencies(scanResult.files);
        // Find files related to this flow
        const flowFiles = dependencies.dependencies
            .filter((d) => d.source.includes(flowName) || d.target.includes(flowName))
            .flatMap((d) => [d.source, d.target]);
        // Load existing state
        const statePath = path.join(aiDir, "lazy-index-state.json");
        let state = {
            stage1Complete: true,
            stage2Complete: false,
            featuresExpanded: [],
            flowsExpanded: [],
            lastUpdated: new Date().toISOString()
        };
        if (fs.existsSync(statePath)) {
            state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
        }
        // Mark flow as expanded
        if (!state.flowsExpanded.includes(flowName)) {
            state.flowsExpanded.push(flowName);
            state.lastUpdated = new Date().toISOString();
            writeFile(statePath, JSON.stringify(state, null, 2));
        }
        // Generate flow context file
        const flowContextPath = path.join(aiDir, "context", "flows", `${flowName}.json`);
        const flowContext = {
            name: flowName,
            files: [...new Set(flowFiles)],
            generatedAt: new Date().toISOString()
        };
        ensureDir(path.dirname(flowContextPath));
        writeFile(flowContextPath, JSON.stringify(flowContext, null, 2));
        return { success: true, files: [...new Set(flowFiles)] };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
/**
 * Expand full context (Stage 2) - when needed
 */
export function expandFullContext(rootDir, aiDir) {
    const scanResult = scanRepo(rootDir);
    // Extract symbols
    const symbols = extractSymbols(scanResult.files);
    const symbolsPath = path.join(aiDir, "symbols.json");
    writeFile(symbolsPath, JSON.stringify(symbols, null, 2));
    // Analyze dependencies
    const dependencies = analyzeDependencies(scanResult.files);
    const depsPath = path.join(aiDir, "dependencies.json");
    writeFile(depsPath, JSON.stringify(dependencies, null, 2));
    // Generate semantic contexts
    const { features, flows } = generateSemanticContexts(aiDir);
    // Build knowledge graph
    buildKnowledgeGraph(rootDir, aiDir);
    // Update state
    const statePath = path.join(aiDir, "lazy-index-state.json");
    const state = {
        stage1Complete: true,
        stage2Complete: true,
        featuresExpanded: Array.isArray(features) ? features.map((f) => f.name || f.feature || String(f)) : [],
        flowsExpanded: Array.isArray(flows) ? flows.map((f) => f.name || f.flow || String(f)) : [],
        lastUpdated: new Date().toISOString()
    };
    writeFile(statePath, JSON.stringify(state, null, 2));
    return {
        symbols: symbols.symbols?.length || 0,
        dependencies: dependencies.dependencies?.length || 0,
        features: features.length,
        flows: flows.length
    };
}
/**
 * Get lazy index state
 */
export function getLazyIndexState(aiDir) {
    const statePath = path.join(aiDir, "lazy-index-state.json");
    if (!fs.existsSync(statePath))
        return null;
    try {
        return JSON.parse(fs.readFileSync(statePath, "utf-8"));
    }
    catch {
        return null;
    }
}
/**
 * Check if minimal index exists
 */
export function hasMinimalIndex(aiDir) {
    return fs.existsSync(path.join(aiDir, "minimal-index.json"));
}
/**
 * Load minimal index
 */
export function loadMinimalIndex(aiDir) {
    const indexPath = path.join(aiDir, "minimal-index.json");
    if (!fs.existsSync(indexPath))
        return null;
    try {
        return JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=lazyAnalyzer.js.map