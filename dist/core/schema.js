/**
 * AI Repository Schema System
 *
 * Defines the standard schema for AI-First repository metadata.
 */
import fs from "fs";
import path from "path";
import { writeFile, readJsonFile } from "../utils/fileUtils.js";
export const SCHEMA_VERSION = "1.0";
export const GENERATED_BY = "ai-first";
export function generateSchema(aiDir) {
    const schema = {
        schemaVersion: SCHEMA_VERSION,
        generatedBy: GENERATED_BY,
        generatedAt: new Date().toISOString()
    };
    writeFile(path.join(aiDir, "schema.json"), JSON.stringify(schema, null, 2));
    return schema;
}
export function generateProject(rootDir, aiDir, options = {}) {
    const name = options.name || path.basename(rootDir);
    let features = options.features || [];
    const featuresDir = path.join(aiDir, "context", "features");
    if (fs.existsSync(featuresDir) && features.length === 0) {
        try {
            features = fs.readdirSync(featuresDir).filter(f => f.endsWith(".json")).map(f => f.replace(".json", ""));
        }
        catch { /* ignore */ }
    }
    let flows = options.flows || [];
    const flowsDir = path.join(aiDir, "context", "flows");
    if (fs.existsSync(flowsDir) && flows.length === 0) {
        try {
            flows = fs.readdirSync(flowsDir).filter(f => f.endsWith(".json")).map(f => f.replace(".json", ""));
        }
        catch { /* ignore */ }
    }
    let languages = options.languages || [];
    let frameworks = options.frameworks || [];
    const techStackPath = path.join(aiDir, "tech_stack.md");
    if (fs.existsSync(techStackPath)) {
        try {
            const content = fs.readFileSync(techStackPath, "utf-8");
            const langMatch = content.match(/Languages?:\s*([^\n]+)/i);
            if (langMatch)
                languages = langMatch[1].split(",").map(s => s.trim()).filter(Boolean);
            const fwMatch = content.match(/Frameworks?:\s*([^\n]+)/i);
            if (fwMatch)
                frameworks = fwMatch[1].split(",").map(s => s.trim()).filter(Boolean);
        }
        catch { /* ignore */ }
    }
    const project = { name, rootDir, features, flows, languages, frameworks, generatedAt: new Date().toISOString() };
    writeFile(path.join(aiDir, "project.json"), JSON.stringify(project, null, 2));
    return project;
}
export function generateTools(aiDir) {
    const tools = {
        compatibleAgents: ["ai-first-bridge", "opencode", "cursor", "windsurf", "cline"],
        schemaVersion: SCHEMA_VERSION
    };
    writeFile(path.join(aiDir, "tools.json"), JSON.stringify(tools, null, 2));
    return tools;
}
export function generateAllSchema(rootDir, aiDir, options = {}) {
    return {
        schema: generateSchema(aiDir),
        project: generateProject(rootDir, aiDir, options),
        tools: generateTools(aiDir)
    };
}
export function loadSchema(aiDir) {
    const p = path.join(aiDir, "schema.json");
    if (!fs.existsSync(p))
        return null;
    try {
        return readJsonFile(p);
    }
    catch {
        return null;
    }
}
export function loadProject(aiDir) {
    const p = path.join(aiDir, "project.json");
    if (!fs.existsSync(p))
        return null;
    try {
        return readJsonFile(p);
    }
    catch {
        return null;
    }
}
export function loadTools(aiDir) {
    const p = path.join(aiDir, "tools.json");
    if (!fs.existsSync(p))
        return null;
    try {
        return readJsonFile(p);
    }
    catch {
        return null;
    }
}
export function loadFullSchema(aiDir) {
    const schema = loadSchema(aiDir);
    const project = loadProject(aiDir);
    const tools = loadTools(aiDir);
    if (!schema || !project || !tools)
        return null;
    return { schema, project, tools };
}
export function isCompatible(targetVersion) {
    const [targetMajor] = targetVersion.split(".").map(Number);
    const [schemaMajor] = SCHEMA_VERSION.split(".").map(Number);
    return targetMajor === schemaMajor;
}
export function validateSchema(aiDir) {
    const errors = [];
    const schema = loadSchema(aiDir);
    if (!schema)
        errors.push("schema.json not found");
    else if (!isCompatible(schema.schemaVersion))
        errors.push(`Incompatible schema version: ${schema.schemaVersion}`);
    if (!loadProject(aiDir))
        errors.push("project.json not found");
    if (!loadTools(aiDir))
        errors.push("tools.json not found");
    return { valid: errors.length === 0, version: schema?.schemaVersion, errors };
}
//# sourceMappingURL=schema.js.map