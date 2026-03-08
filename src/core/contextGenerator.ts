import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get API key from OpenCode config file
 */
function getApiKeyFromConfig(): { apiKey: string; apiHost: string } | null {
  try {
    const configPath = path.join(process.env.HOME || "", ".config/opencode/opencode.json");
    if (!fs.existsSync(configPath)) {
      return null;
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const apiKey = config?.provider?.minimax?.options?.apiKey;
    const apiHost = config?.provider?.minimax?.options?.baseURL?.replace("/anthropic", "");
    
    if (apiKey) {
      return { apiKey, apiHost: apiHost || "https://api.minimax.io" };
    }
    return null;
  } catch (error) {
    console.warn("Could not read OpenCode config:", error);
    return null;
  }
}

/**
 * System prompt for context generation
 */
const SYSTEM_PROMPT = `You are an expert software architect AI assistant. Your task is to analyze a repository and generate a comprehensive AI_CONTEXT.md file that will help other AI coding assistants understand and work effectively with this codebase.

Provide analysis in the following areas:
1. Technology Stack - languages, frameworks, libraries
2. Architecture Pattern - MVC, hexagonal, microservices, monorepo, etc.
3. Project Structure - key directories and their purposes
4. Naming Conventions - file naming, function naming, variable naming
5. Code Organization - layers, modules, boundaries
6. Dependencies - key dependencies and their purposes
7. Testing Approach - test framework, test organization
8. Configuration - how the project is configured
9. Build/Deployment - build tools, deployment approach
10. Common Patterns - recurring patterns in the codebase

Format your response as a comprehensive markdown document that an AI can use to understand this project.`;

export interface ContextGenerationOptions {
  model?: string;
  variant?: "low" | "medium" | "high";
  temperature?: number;
}

/**
 * Generate AI context using the configured model
 */
export async function generateAIContext(
  repoMap: string,
  summary: string,
  options: ContextGenerationOptions = {}
): Promise<string> {
  const { model = "minimax-coding-plan/MiniMax-M2.5", variant = "high" } = options;

  const userPrompt = `# Repository Analysis Request

## Repository Map
${repoMap}

## Summary
${summary}

## Task

Analyze this repository structure and generate a comprehensive AI_CONTEXT.md file. 

Your output should include:

## Technology Stack
- Programming languages used
- Frameworks and libraries
- Key dependencies

## Architecture
- Architectural pattern (MVC, hexagonal, layered, etc.)
- How the application is organized
- Key modules and their responsibilities

## Project Structure
- Important directories and their purposes
- Entry points
- Configuration locations

## Conventions
- Naming conventions (files, functions, variables)
- Code style patterns
- Common patterns used

## Dependencies
- Main dependencies and why they're used
- Important internal modules

## Testing
- Test framework used
- Test organization

## Additional Context
- Build/development commands
- Any other relevant information for an AI to work on this codebase

Please generate the complete AI_CONTEXT.md content.`;

  console.log("Generating context with model:", model, "variant:", variant);
  return await callModel(model, variant, SYSTEM_PROMPT, userPrompt, repoMap, summary);
}

/**
 * Call the AI model via API
 */
async function callModel(
  model: string,
  variant: string,
  systemPrompt: string,
  userPrompt: string,
  repoMapData: string,
  summaryData: string
): Promise<string> {
  try {
    // First try environment variable, then try OpenCode config file
    let apiKey = process.env.MINIMAX_API_KEY;
    let apiHost = process.env.MINIMAX_API_HOST || "https://api.minimax.io";
    
    if (!apiKey) {
      const config = getApiKeyFromConfig();
      if (config) {
        apiKey = config.apiKey;
        apiHost = config.apiHost;
        console.log("Loaded API key from OpenCode config");
      }
    }

    console.log("API Key available:", apiKey ? "yes" : "no");

    if (!apiKey) {
      return generateBasicAnalysis(repoMapData, summaryData);
    }

    const response = await fetch(`${apiHost}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 16000,
        thinking: {
          type: "enabled",
          budget: variant === "high" ? 16384 : variant === "medium" ? 8192 : 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || generateBasicAnalysis(repoMapData, summaryData);
  } catch (error) {
    console.warn("Model API not available, using template:", error);
    return generateBasicAnalysis(repoMapData, summaryData);
  }
}

/**
 * Generate a basic analysis without API call
 */
function generateBasicAnalysis(map: string, sum: string): string {
  const lines = sum.split("\n");
  let totalFiles = 0;
  const extensions = new Map<string, number>();
  const directories = new Map<string, number>();

  for (const line of lines) {
    const fileMatch = line.match(/- \*\*Total files\*\*: (\d+)/);
    if (fileMatch) {
      totalFiles = parseInt(fileMatch[1]);
    }

    const extMatch = line.match(/- \.(\w+): (\d+)/);
    if (extMatch) {
      extensions.set(extMatch[1], parseInt(extMatch[2]));
    }

    const dirMatch = line.match(/- (.+?): (\d+)/);
    if (dirMatch && !line.includes("Total files")) {
      directories.set(dirMatch[1], parseInt(dirMatch[2]));
    }
  }

  const techStack: string[] = [];
  const extMap: Record<string, string> = {
    ts: "TypeScript", tsx: "TypeScript (React)", js: "JavaScript", jsx: "JavaScript (React)",
    py: "Python", java: "Java", cs: "C#", go: "Go", rs: "Rust", rb: "Ruby",
    php: "PHP", swift: "Swift", kt: "Kotlin", scala: "Scala", vue: "Vue.js",
    svelte: "Svelte", html: "HTML", css: "CSS", scss: "SCSS", json: "JSON",
    yaml: "YAML", yml: "YAML", md: "Markdown",
  };

  for (const [ext] of extensions) {
    techStack.push(extMap[ext] || ext.toUpperCase());
  }

  let architecture = "Monolithic / Flat";
  const dirs = Array.from(directories.keys());
  if (dirs.includes("src") && dirs.includes("test")) architecture = "Standard project structure";
  if (dirs.some(d => d.includes("src/"))) architecture = "Nested module structure";

  return `# AI Context

> Generated by /ai-first command - Basic analysis (no API call)

## Technology Stack
${techStack.length > 0 ? techStack.map(t => `- ${t}`).join("\n") : "- Unknown"}

## Architecture
- **Pattern**: ${architecture}
- **Total Files**: ${totalFiles}

## Project Structure
${dirs.length > 0 ? dirs.map(d => `### ${d === "root" ? "(root)" : d}\n- ${directories.get(d)} files`).join("\n\n") : "### (root)\n- No subdirectories"}

## Files by Type
${Array.from(extensions.entries()).sort((a, b) => b[1] - a[1]).map(([ext, count]) => `- .${ext}: ${count} files`).join("\n")}

## Conventions
- Use consistent naming (camelCase for variables, PascalCase for classes/components)
- Keep functions small and focused
- Separate concerns (UI / Business Logic / Data)

## Next Steps
1. Review the REPO_MAP.md for full file listing
2. Update this file with detailed technology analysis

---
*Generated by /ai-first*
`;
}

export function generateTaskTemplate(): string {
  return `# Task Template

## Context
- [AI_CONTEXT.md](./AI_CONTEXT.md)
- [REPO_MAP.md](./REPO_MAP.md)

## Task Description
[Describe task]

## Requirements
- [ ] Requirement 1

## Notes
[Any notes]

---
*Generated by /ai-first*
`;
}

export function generateCurrentFocus(): string {
  return `# Current Focus

## Current Module
[Working on...]

## Recent Changes
- [ ]

## Notes
[Context]

---
*Generated by /ai-first*
`;
}
