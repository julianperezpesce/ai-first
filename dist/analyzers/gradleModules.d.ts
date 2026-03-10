import { FileInfo } from "../core/repoScanner.js";
export interface GradleModule {
    name: string;
    path: string;
    isIncluded: boolean;
}
export interface GradleModulesAnalysis {
    isGradle: boolean;
    isMultiModule: boolean;
    modules: GradleModule[];
    rootProjectName?: string;
    settingsFile?: string;
}
/**
 * Analyze Gradle settings to detect modules
 */
export declare function analyzeGradleModules(files: FileInfo[], rootDir: string): GradleModulesAnalysis;
/**
 * Generate gradle-modules.json content
 */
export declare function generateGradleModulesJson(analysis: GradleModulesAnalysis): string;
//# sourceMappingURL=gradleModules.d.ts.map