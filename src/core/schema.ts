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

export function generateSchema(aiDir: string): SchemaInfo {
  const schema: SchemaInfo = {
    schemaVersion: SCHEMA_VERSION,
    generatedBy: GENERATED_BY,
    generatedAt: new Date().toISOString()
  };
  writeFile(path.join(aiDir, "schema.json"), JSON.stringify(schema, null, 2));
  return schema;
}

export function generateProject(rootDir: string, aiDir: string, options: {
  name?: string;
  features?: string[];
  flows?: string[];
  languages?: string[];
  frameworks?: string[];
} = {}): ProjectInfo {
  const name = options.name || path.basename(rootDir);
  
  let features = options.features || [];
  const featuresDir = path.join(aiDir, "context", "features");
  if (fs.existsSync(featuresDir) && features.length === 0) {
    try {
      features = fs.readdirSync(featuresDir).filter(f => f.endsWith(".json")).map(f => f.replace(".json", ""));
    } catch { /* ignore */ }
  }
  
  let flows = options.flows || [];
  const flowsDir = path.join(aiDir, "context", "flows");
  if (fs.existsSync(flowsDir) && flows.length === 0) {
    try {
      flows = fs.readdirSync(flowsDir).filter(f => f.endsWith(".json")).map(f => f.replace(".json", ""));
    } catch { /* ignore */ }
  }
  
  let languages = options.languages || [];
  let frameworks = options.frameworks || [];
  const techStackPath = path.join(aiDir, "tech_stack.md");
  if (fs.existsSync(techStackPath)) {
    try {
      const content = fs.readFileSync(techStackPath, "utf-8");
      const langMatch = content.match(/^\*\*Languages\*\*:\s*([^\n]+)/im) || content.match(/^Languages?:\s*([^\n]+)/im);
      if (langMatch) languages = parseMarkdownListValue(langMatch[1]);
      const fwMatch = content.match(/^\*\*Frameworks\*\*:\s*([^\n]+)/im) || content.match(/^Frameworks?:\s*([^\n]+)/im);
      if (fwMatch) frameworks = parseMarkdownListValue(fwMatch[1]);
    } catch { /* ignore */ }
  }
  
  const project: ProjectInfo = { name, rootDir, features, flows, languages, frameworks, generatedAt: new Date().toISOString() };
  writeFile(path.join(aiDir, "project.json"), JSON.stringify(project, null, 2));
  return project;
}

function parseMarkdownListValue(value: string): string[] {
  const normalized = value.replace(/\*\*/g, "").trim();
  if (!normalized || /^(none detected|unknown|n\/a)$/i.test(normalized)) return [];
  return normalized.split(",").map(s => s.trim()).filter(Boolean);
}

export function generateTools(aiDir: string): ToolsInfo {
  const tools: ToolsInfo = {
    compatibleAgents: ["ai-first-bridge", "opencode", "cursor", "windsurf", "cline"],
    schemaVersion: SCHEMA_VERSION
  };
  writeFile(path.join(aiDir, "tools.json"), JSON.stringify(tools, null, 2));
  return tools;
}

export function generateAllSchema(rootDir: string, aiDir: string, options: {
  projectName?: string;
  features?: string[];
  flows?: string[];
  languages?: string[];
  frameworks?: string[];
} = {}): AISchema {
  return {
    schema: generateSchema(aiDir),
    project: generateProject(rootDir, aiDir, options),
    tools: generateTools(aiDir)
  };
}

export function loadSchema(aiDir: string): SchemaInfo | null {
  const p = path.join(aiDir, "schema.json");
  if (!fs.existsSync(p)) return null;
  try { return readJsonFile(p) as unknown as SchemaInfo; } catch { return null; }
}

export function loadProject(aiDir: string): ProjectInfo | null {
  const p = path.join(aiDir, "project.json");
  if (!fs.existsSync(p)) return null;
  try { return readJsonFile(p) as unknown as ProjectInfo; } catch { return null; }
}

export function loadTools(aiDir: string): ToolsInfo | null {
  const p = path.join(aiDir, "tools.json");
  if (!fs.existsSync(p)) return null;
  try { return readJsonFile(p) as unknown as ToolsInfo; } catch { return null; }
}

export function loadFullSchema(aiDir: string): AISchema | null {
  const schema = loadSchema(aiDir);
  const project = loadProject(aiDir);
  const tools = loadTools(aiDir);
  if (!schema || !project || !tools) return null;
  return { schema, project, tools };
}

export function isCompatible(targetVersion: string): boolean {
  const [targetMajor] = targetVersion.split(".").map(Number);
  const [schemaMajor] = SCHEMA_VERSION.split(".").map(Number);
  return targetMajor === schemaMajor;
}

export function validateSchema(aiDir: string): { valid: boolean; version?: string; errors: string[] } {
  const errors: string[] = [];
  const schema = loadSchema(aiDir);
  if (!schema) errors.push("schema.json not found");
  else if (!isCompatible(schema.schemaVersion)) errors.push(`Incompatible schema version: ${schema.schemaVersion}`);
  if (!loadProject(aiDir)) errors.push("project.json not found");
  if (!loadTools(aiDir)) errors.push("tools.json not found");
  return { valid: errors.length === 0, version: schema?.schemaVersion, errors };
}
