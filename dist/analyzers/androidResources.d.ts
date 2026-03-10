import { FileInfo } from "../core/repoScanner.js";
export interface AndroidResource {
    type: "layout" | "drawable" | "values" | "menu" | "mipmap" | "anim" | "xml" | "other";
    name: string;
    path: string;
}
export interface AndroidResourcesAnalysis {
    isAndroid: boolean;
    resources: AndroidResource[];
    layouts: string[];
    drawables: string[];
    values: string[];
    totalResources: number;
}
/**
 * Analyze Android resources in res/ directory
 */
export declare function analyzeAndroidResources(files: FileInfo[]): AndroidResourcesAnalysis;
/**
 * Generate android-resources.json content
 */
export declare function generateAndroidResourcesJson(analysis: AndroidResourcesAnalysis): string;
//# sourceMappingURL=androidResources.d.ts.map