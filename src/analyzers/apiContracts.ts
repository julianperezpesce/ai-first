import { FileInfo } from "../core/repoScanner.js";
import { readFile } from "../utils/fileUtils.js";
import path from "path";

export interface ApiEndpoint {
  method: string;
  path: string;
  handler: string;
  description: string;
  requestSchema?: string;
  responseSchema?: string;
}

export interface ApiContractResult {
  endpoints: ApiEndpoint[];
  basePath?: string;
}

export function generateApiContracts(files: FileInfo[], rootDir: string): string {
  const result = detectApiEndpoints(files, rootDir);
  
  if (result.endpoints.length === 0) {
    return "";
  }
  
  return formatApiContracts(result);
}

function detectApiEndpoints(files: FileInfo[], rootDir: string): ApiContractResult {
  const endpoints: ApiEndpoint[] = [];
  
  const jsTsFiles = files.filter(f => f.extension === "js" || f.extension === "ts");
  for (const file of jsTsFiles) {
    try {
      const content = readFile(path.join(rootDir, file.relativePath));
      const expressEndpoints = detectExpressEndpoints(content, file.relativePath);
      endpoints.push(...expressEndpoints);
      const nestEndpoints = detectNestJSEndpoints(content, file.relativePath);
      endpoints.push(...nestEndpoints);
    } catch {}
  }
  
  const javaKtFiles = files.filter(f => f.extension === "java" || f.extension === "kt");
  for (const file of javaKtFiles) {
    try {
      const content = readFile(path.join(rootDir, file.relativePath));
      const springEndpoints = detectSpringEndpoints(content, file.relativePath);
      endpoints.push(...springEndpoints);
    } catch {}
  }
  
  const pyFiles = files.filter(f => f.extension === "py");
  for (const file of pyFiles) {
    try {
      const content = readFile(path.join(rootDir, file.relativePath));
      const fastApiEndpoints = detectFastAPIEndpoints(content, file.relativePath);
      endpoints.push(...fastApiEndpoints);
      const djangoEndpoints = detectDjangoEndpoints(content, file.relativePath);
      endpoints.push(...djangoEndpoints);
    } catch {}
  }
  
  return { endpoints };
}

function detectExpressEndpoints(content: string, filePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  const expressPattern = /(?:app|router)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  let match;
  
  while ((match = expressPattern.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    
    endpoints.push({
      method,
      path: routePath,
      handler: filePath,
      description: `Express ${method} endpoint`,
    });
  }
  
  return endpoints;
}

function detectNestJSEndpoints(content: string, filePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  const nestPattern = /@(Get|Post|Put|Delete|Patch|All)\s*\(\s*['"`]?([^'"`)\s]*)['"`]?\s*\)/gi;
  let match;
  
  while ((match = nestPattern.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2] || "/";
    const controllerPath = extractControllerPath(content);
    const fullPath = controllerPath ? `${controllerPath}${routePath}` : routePath;
    
    endpoints.push({
      method,
      path: fullPath,
      handler: filePath,
      description: `NestJS ${method} endpoint`,
    });
  }
  
  return endpoints;
}

function detectSpringEndpoints(content: string, filePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  const springPattern = /@(Get|Post|Put|Delete|Patch|Request)Mapping\s*\(\s*(?:value\s*=\s*)?['"`]([^'"`]+)['"`]/gi;
  let match;
  
  while ((match = springPattern.exec(content)) !== null) {
    const methodType = match[1];
    const method = methodType === "Request" ? "GET" : methodType.toUpperCase();
    const routePath = match[2];
    
    endpoints.push({
      method,
      path: routePath,
      handler: filePath,
      description: `Spring ${method} endpoint`,
    });
  }
  
  return endpoints;
}

function detectFastAPIEndpoints(content: string, filePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  const fastApiPattern = /@(?:app|router)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  let match;
  
  while ((match = fastApiPattern.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    
    endpoints.push({
      method,
      path: routePath,
      handler: filePath,
      description: `FastAPI ${method} endpoint`,
    });
  }
  
  return endpoints;
}

function detectDjangoEndpoints(content: string, filePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  
  const apiViewPattern = /@api_view\s*\(\s*\[\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`]\s*\]\s*\)/gi;
  let match;
  
  while ((match = apiViewPattern.exec(content)) !== null) {
    const method = match[1];
    
    endpoints.push({
      method,
      path: "/",
      handler: filePath,
      description: `Django ${method} endpoint`,
    });
  }
  
  return endpoints;
}

function extractControllerPath(content: string): string | undefined {
  const controllerMatch = content.match(/@Controller\s*\(\s*['"`]([^'"`]+)['"`]/);
  return controllerMatch?.[1];
}

function formatApiContracts(result: ApiContractResult): string {
  let content = "## API Contracts\n\n";
  
  const grouped = new Map<string, ApiEndpoint[]>();
  for (const endpoint of result.endpoints) {
    const key = endpoint.path;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(endpoint);
  }
  
  const sortedPaths = Array.from(grouped.keys()).sort();
  
  for (const pathKey of sortedPaths) {
    const eps = grouped.get(pathKey) || [];
    
    for (const ep of eps) {
      content += `### ${ep.method} ${ep.path}\n\n`;
      content += `- **Handler**: \`${ep.handler}\`\n`;
      content += `- **Description**: ${ep.description}\n`;
      content += "\n";
    }
  }
  
  content += "---\n*Generated by ai-first*\n";
  
  return content;
}