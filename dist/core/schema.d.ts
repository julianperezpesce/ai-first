/**
 * AI Repository Schema System
 *
 * Defines the standard schema for AI-First repository metadata.
 */
export declare const SCHEMA_VERSION = "1.0";
export declare const GENERATED_BY = "ai-first";
export interface SchemaInfo {
    schemaVersion: string;
    generatedBy: string;
    generatedAt: string;
}
export interface ProjectInfo {
    name: string;
    rootDir: string;
    features: string[];
    flows: string[];
    languages: string[];
    frameworks: string[];
    generatedAt: string;
}
export interface ToolsInfo {
    compatibleAgents: string[];
    schemaVersion: string;
}
export interface AISchema {
    schema: SchemaInfo;
    project: ProjectInfo;
    tools: ToolsInfo;
}
export declare function generateSchema(aiDir: string): SchemaInfo;
export declare function generateProject(rootDir: string, aiDir: string, options?: {
    name?: string;
    features?: string[];
    flows?: string[];
    languages?: string[];
    frameworks?: string[];
}): ProjectInfo;
export declare function generateTools(aiDir: string): ToolsInfo;
export declare function generateAllSchema(rootDir: string, aiDir: string, options?: {
    projectName?: string;
    features?: string[];
    flows?: string[];
    languages?: string[];
    frameworks?: string[];
}): AISchema;
export declare function loadSchema(aiDir: string): SchemaInfo | null;
export declare function loadProject(aiDir: string): ProjectInfo | null;
export declare function loadTools(aiDir: string): ToolsInfo | null;
export declare function loadFullSchema(aiDir: string): AISchema | null;
export declare function isCompatible(targetVersion: string): boolean;
export declare function validateSchema(aiDir: string): {
    valid: boolean;
    version?: string;
    errors: string[];
};
//# sourceMappingURL=schema.d.ts.map