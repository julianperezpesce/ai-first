export interface Feature {
    feature: string;
    files: string[];
    entrypoints: string[];
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
export declare function generateFeatures(modulesJson: string, _symbolsJson: string): Feature[];
export declare function generateFlows(graphPath: string, modsPath: string, depsPath?: string): Flow[];
export declare function generateSemanticContexts(aiDir: string): SemanticContexts;
//# sourceMappingURL=semanticContexts.d.ts.map