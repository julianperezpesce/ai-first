export interface Feature {
    name: string;
    path: string;
    files: string[];
    entrypoints: string[];
    dependencies: string[];
}
export interface Flow {
    name: string;
    entrypoint: string;
    files: string[];
    depth: number;
    layers: string[];
}
export interface SemanticContexts {
    features: Feature[];
    flows: Flow[];
}
/**
 * Generate features from modules.json
 *
 * Output format:
 * {
 *   "name": "auth",
 *   "path": "src/auth",
 *   "files": [],
 *   "entrypoints": [],
 *   "dependencies": []
 * }
 */
export declare function generateFeatures(modulesJsonPath: string, _symbolsJsonPath: string): Feature[];
/**
 * Generate flows using multiple fallback methods
 */
export declare function generateFlows(graphPath: string, modulesPath: string, dependenciesPath?: string): Flow[];
/**
 * Generate all semantic contexts (features and flows)
 */
export declare function generateSemanticContexts(aiDir: string): SemanticContexts;
//# sourceMappingURL=semanticContexts.d.ts.map