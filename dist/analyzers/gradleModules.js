import { readFile } from "../utils/fileUtils.js";
import path from "path";
/**
 * Analyze Gradle settings to detect modules
 */
export function analyzeGradleModules(files, rootDir) {
    const settingsFiles = files.filter(f => f.name === "settings.gradle" || f.name === "settings.gradle.kts");
    if (settingsFiles.length === 0) {
        return {
            isGradle: false,
            isMultiModule: false,
            modules: [],
        };
    }
    const modules = [];
    let rootProjectName = "app";
    let settingsContent = "";
    // Use root settings.gradle or settings.gradle.kts
    const settingsFile = settingsFiles.find(f => f.relativePath === "settings.gradle" || f.relativePath === "settings.gradle.kts");
    if (settingsFile) {
        try {
            settingsContent = readFile(path.join(rootDir, settingsFile.relativePath));
        }
        catch { }
    }
    // Parse include statements: include(":module")
    const includeMatches = settingsContent.matchAll(/include\s*\(\s*["']([^"']+)["']\s*\)/g);
    for (const match of includeMatches) {
        const modulePath = match[1];
        modules.push({
            name: modulePath.replace(/^:/, ""),
            path: modulePath,
            isIncluded: true,
        });
    }
    // Parse project statements: project(":module")
    const projectMatches = settingsContent.matchAll(/project\s*\(\s*["']([^"']+)["']\s*\)\s*\.+/g);
    for (const match of projectMatches) {
        const modulePath = match[1];
        const moduleName = modulePath.replace(/^:/, "");
        if (!modules.find(m => m.name === moduleName)) {
            modules.push({
                name: moduleName,
                path: modulePath,
                isIncluded: true,
            });
        }
    }
    // Extract root project name
    const rootNameMatch = settingsContent.match(/rootProject\s*\(\s*["']name["']\s*=\s*["']([^"']+)["']/);
    if (rootNameMatch) {
        rootProjectName = rootNameMatch[1];
    }
    return {
        isGradle: true,
        isMultiModule: modules.length > 0,
        modules,
        rootProjectName,
        settingsFile: settingsFile?.relativePath,
    };
}
/**
 * Generate gradle-modules.json content
 */
export function generateGradleModulesJson(analysis) {
    const output = {
        isGradle: analysis.isGradle,
        isMultiModule: analysis.isMultiModule,
        rootProjectName: analysis.rootProjectName,
        settingsFile: analysis.settingsFile,
        modules: analysis.modules,
    };
    return JSON.stringify(output, null, 2);
}
//# sourceMappingURL=gradleModules.js.map