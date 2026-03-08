import { FileInfo } from "../core/repoScanner.js";
export interface AIRules {
    guidelines: string[];
    patterns: string[];
    constraints: string[];
}
/**
 * Generate AI rules based on project analysis
 */
export declare function generateAIRules(files: FileInfo[], rootDir: string): AIRules;
/**
 * Generate ai_rules.md content
 */
export declare function generateAIRulesFile(rules: AIRules, files: FileInfo[], rootDir: string): string;
//# sourceMappingURL=aiRules.d.ts.map