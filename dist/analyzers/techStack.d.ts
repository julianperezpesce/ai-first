import { FileInfo } from "../core/repoScanner.js";
export interface TechStackEvidence {
    category: "language" | "framework" | "library" | "tool" | "packageManager" | "testing" | "linter" | "formatter";
    name: string;
    confidence: number;
    evidence: string[];
}
export interface TechStack {
    languages: string[];
    frameworks: string[];
    libraries: string[];
    tools: string[];
    packageManagers: string[];
    testing: string[];
    linters: string[];
    formatters: string[];
    description: string;
    evidence?: TechStackEvidence[];
    android?: {
        minSdk?: string;
        targetSdk?: string;
        compileSdk?: string;
        gradleVersion?: string;
        kotlinVersion?: string;
    };
    salesforce?: {
        apiVersion?: string;
        packageDirectories?: string[];
        namespace?: string;
        sObjects?: string[];
        apexClasses?: number;
        triggers?: number;
    };
}
/**
 * Detect technology stack from repository
 */
export declare function detectTechStack(files: FileInfo[], rootDir: string): TechStack;
/**
 * Generate tech_stack.md content
 */
export declare function generateTechStackFile(stack: TechStack): string;
//# sourceMappingURL=techStack.d.ts.map