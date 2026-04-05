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

/**
 * Generate API contracts documentation from source files
 */
export function generateApiContracts(files: FileInfo[], rootDir: string): string {
  const result = detectApiEndpoints(files, rootDir);
  
  if (result.endpoints.length === 0) {
    return "";
  }
  
  return formatApiContracts(result);
}

/**
 * Detect API endpoints from various frameworks
 */
function detectApiEndpoints(files: FileInfo[], rootDir: string): ApiContractResult {
  const endpoints: ApiEndpoint[] = [];
  let basePath: string | undefined;
  
  // Detect Express/NestJS endpoints
  const jsTsFiles = files.filter(f => f.extension === "js" || f.extension === "ts");
  for (const file of jsTsFiles) {
    try {
      const content = readFile(path.join(rootDir, file.relativePath));
      
      // Express patterns: app.get(), router.get(), etc.
      const expressEndpoints = detectExpressEndpoints(content, file.relativePath);
      endpoints.push(...expressEndpoints);
      
      // NestJS patterns: @Get(), @Post(), etc.
      const nestEndpoints = detectNestJSEndpoints(content, file.relativePath);
      endpoints.push(...nestEndpoints);
    } catch {}
  }
  
  // Detect Spring Boot endpoints
  const javaKtFiles = files.filter(f => f.extension === "java" || f.extension === "kt");
  for (const file of javaKtFiles) {
    try {
      const content = readFile(path.join(rootDir, file.relativePath));
      const springEndpoints = detectSpringEndpoints(content, file.relativePath);
      endpoints.push(...springEndpoints);
    } catch {}
  }
  
  // Detect FastAPI/Django endpoints
  const pyFiles = files.filter(f => f.extension === "py");
  for (const file of pyFiles) {
    try {
      const content = readFile(path.join(rootDir, file.relativePath));
      
      // FastAPI patterns: @app.get(), @router.get()
      const fastApiEndpoints = detectFastAPIEndpoints(content, file.relativePath);
      endpoints.push(...fastApiEndpoints);
      
      // Django REST patterns: @api_view, ViewSets
      const djangoEndpoints = detectDjangoEndpoints(content, file.relativePath);
      endpoints.push(...djangoEndpoints);
    } catch {}
  }
  
  // Detect base path from common patterns
  basePath = detectBasePath(files, rootDir);
  
  return { endpoints, basePath };
}

/**
 * Detect Express.js endpoints
 */
function detectExpressEndpoints(content: string, filePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  
  // Pattern: app.get('/path', ...), router.get('/path', ...)
  const expressPattern = /(?:app|router)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  let match;
  
  while ((match = expressPattern.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const handler = extractHandlerName(content, match.index);
    const description = extractDescription(content, match.index);
    
    endpoints.push({
      method,
      path: routePath,
      handler: handler ? `${filePath}#${handler}` : filePath,
      description: description || `Express ${method} endpoint`,
      requestSchema: extractRequestSchema(content, match.index),
      responseSchema: extractResponseSchema(content, match.index),
    });
  }
  
  return endpoints;
}

/**
 * Detect NestJS endpoints
 */
function detectNestJSEndpoints(content: string, filePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  
  // Pattern: @Get('path'), @Post('path'), etc.
  const nestPattern = /@(Get|Post|Put|Delete|Patch|All)\s*\(\s*['"`]?([^'"`)\s]*)['"`]?\s*\)/gi;
  let match;
  
  while ((match = nestPattern.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2] || "/";
    const handler = extractNestHandlerName(content, match.index);
    const description = extractDescription(content, match.index);
    
    // Get class-level @Controller path
    const controllerPath = extractControllerPath(content);
    const fullPath = controllerPath ? `${controllerPath}${routePath}` : routePath;
    
    endpoints.push({
      method,
      path: fullPath,
      handler: handler ? `${filePath}#${handler}` : filePath,
      description: description || `NestJS ${method} endpoint`,
      requestSchema: extractNestRequestSchema(content, match.index),
      responseSchema: extractNestResponseSchema(content, match.index),
    });
  }
  
  return endpoints;
}

/**
 * Detect Spring Boot endpoints
 */
function detectSpringEndpoints(content: string, filePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  
  // Pattern: @GetMapping, @PostMapping, @RequestMapping, etc.
  const springPattern = /@(Get|Post|Put|Delete|Patch|Request)Mapping\s*\(\s*(?:value\s*=\s*)?['"`]([^'"`]+)['"`]/gi;
  let match;
  
  while ((match = springPattern.exec(content)) !== null) {
    const methodType = match[1];
    const method = methodType === "Request" ? "GET" : methodType.toUpperCase();
    const routePath = match[2];
    const handler = extractSpringHandlerName(content, match.index);
    const description = extractDescription(content, match.index);
    
    // Get class-level @RequestMapping path
    const classPath = extractSpringClassPath(content);
    const fullPath = classPath ? `${classPath}${routePath}` : routePath;
    
    endpoints.push({
      method,
      path: fullPath,
      handler: handler ? `${filePath}#${handler}` : filePath,
      description: description || `Spring ${method} endpoint`,
      requestSchema: extractSpringRequestSchema(content, match.index),
      responseSchema: extractSpringResponseSchema(content, match.index),
    });
  }
  
  return endpoints;
}

/**
 * Detect FastAPI endpoints
 */
function detectFastAPIEndpoints(content: string, filePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  
  // Pattern: @app.get("/path"), @router.get("/path")
  const fastApiPattern = /@(?:app|router)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  let match;
  
  while ((match = fastApiPattern.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const handler = extractPythonHandlerName(content, match.index);
    const description = extractDescription(content, match.index);
    
    endpoints.push({
      method,
      path: routePath,
      handler: handler ? `${filePath}#${handler}` : filePath,
      description: description || `FastAPI ${method} endpoint`,
      requestSchema: extractPythonRequestSchema(content, match.index),
      responseSchema: extractPythonResponseSchema(content, match.index),
    });
  }
  
  return endpoints;
}

/**
 * Detect Django REST Framework endpoints
 */
function detectDjangoEndpoints(content: string, filePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  
  // Pattern: @api_view(["GET"])
  const apiViewPattern = /@api_view\s*\(\s*\[\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`]\s*\]\s*\)/gi;
  let match;
  
  while ((match = apiViewPattern.exec(content)) !== null) {
    const method = match[1];
    const handler = extractPythonHandlerName(content, match.index);
    const description = extractDescription(content, match.index);
    
    // Try to extract path from url() or path() patterns nearby
    const pathPattern = /(?:path|url)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    const pathMatch = pathPattern.exec(content);
    const routePath = pathMatch ? pathMatch[1] : "/";
    
    endpoints.push({
      method,
      path: routePath,
      handler: handler ? `${filePath}#${handler}` : filePath,
      description: description || `Django ${method} endpoint`,
      requestSchema: extractPythonRequestSchema(content, match.index),
      responseSchema: extractPythonResponseSchema(content, match.index),
    });
  }
  
  // Pattern: class ViewSet or ModelViewSet
  const viewsetPattern = /class\s+(\w+ViewSet)\s*\([^)]*\):/g;
  while ((match = viewsetPattern.exec(content)) !== null) {
    const className = match[1];
    const methods = extractViewSetMethods(content, match.index);
    
    for (const method of methods) {
      endpoints.push({
        method: method.method,
        path: `/${className.toLowerCase().replace("viewset", "")}`,
        handler: `${filePath}#${className}.${method.action}`,
        description: method.description || `Django ViewSet ${method.method} endpoint`,
      });
    }
  }
  
  return endpoints;
}

/**
 * Extract handler function name from Express code
 */
function extractHandlerName(content: string, matchIndex: number): string | undefined {
  // Look for function name after the route definition
  const afterMatch = content.slice(matchIndex);
  const handlerMatch = afterMatch.match(/(?:async\s+)?(?:function\s+)?(\w+)\s*(?:\(|\s*=)/);
  return handlerMatch?.[1];
}

/**
 * Extract handler method name from NestJS code
 */
function extractNestHandlerName(content: string, matchIndex: number): string | undefined {
  // Look for method name after decorator
  const afterMatch = content.slice(matchIndex);
  const methodMatch = afterMatch.match(/(?:async\s+)?(\w+)\s*\(/);
  return methodMatch?.[1];
}

/**
 * Extract handler method name from Spring code
 */
function extractSpringHandlerName(content: string, matchIndex: number): string | undefined {
  // Look for method name after annotation
  const afterMatch = content.slice(matchIndex);
  const methodMatch = afterMatch.match(/(?:public|private|protected)\s+(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(/);
  return methodMatch?.[1];
}

/**
 * Extract handler function name from Python code
 */
function extractPythonHandlerName(content: string, matchIndex: number): string | undefined {
  // Look for def function after decorator
  const afterMatch = content.slice(matchIndex);
  const funcMatch = afterMatch.match(/def\s+(\w+)\s*\(/);
  return funcMatch?.[1];
}

/**
 * Extract description from JSDoc/JavaDoc/Python docstring
 */
function extractDescription(content: string, matchIndex: number): string | undefined {
  // Look backwards for comment
  const beforeMatch = content.slice(0, matchIndex);
  
  // JSDoc/JavaDoc: /** ... */
  const jsdocMatch = beforeMatch.match(/\/\*\*[\s\S]*?\*\/\s*$/);
  if (jsdocMatch) {
    const doc = jsdocMatch[0]
      .replace(/\/\*\*|\*\//g, "")
      .replace(/\s*\*\s*/g, " ")
      .trim();
    return doc.slice(0, 100);
  }
  
  // Python docstring: """ ... """ or ''' ... '''
  const pydocMatch = beforeMatch.match(/(?:'''[\s\S]*?'''|"""[\s\S]*?""")\s*$/);
  if (pydocMatch) {
    const doc = pydocMatch[0]
      .replace(/'''|"""/g, "")
      .trim();
    return doc.slice(0, 100);
  }
  
  // Single-line comment: // or #
  const lineMatch = beforeMatch.match(/(?:\/\/|#)\s*(.+?)\s*$/);
  if (lineMatch) {
    return lineMatch[1].trim().slice(0, 100);
  }
  
  return undefined;
}

/**
 * Extract request schema from handler code (Express)
 */
function extractRequestSchema(content: string, matchIndex: number): string | undefined {
  const afterMatch = content.slice(matchIndex, matchIndex + 500);
  
  // Look for req.body patterns
  const bodyMatch = afterMatch.match(/req\.body\.(\w+)/);
  if (bodyMatch) {
    return `{ ${bodyMatch[1]}: <type> }`;
  }
  
  // Look for validation schemas (Joi, Zod, etc.)
  const schemaMatch = afterMatch.match(/(?:Joi|z)\.(?:object|object\(\))/i);
  if (schemaMatch) {
    return "Validated by schema";
  }
  
  return undefined;
}

/**
 * Extract response schema from handler code (Express)
 */
function extractResponseSchema(content: string, matchIndex: number): string | undefined {
  const afterMatch = content.slice(matchIndex, matchIndex + 500);
  
  // Look for res.json() patterns
  const jsonMatch = afterMatch.match(/res\.json\s*\(\s*(?:{|\[)/);
  if (jsonMatch) {
    // Try to extract the structure
    const startIdx = afterMatch.indexOf("{");
    const endIdx = afterMatch.indexOf("}", startIdx);
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const structure = afterMatch.slice(startIdx, endIdx + 1);
      // Simplify the structure
      return structure.replace(/\s+/g, " ").slice(0, 100);
    }
  }
  
  // Look for return statements
  const returnMatch = afterMatch.match(/return\s+(?:{|\[)/);
  if (returnMatch) {
    return "Object or Array response";
  }
  
  return undefined;
}

/**
 * Extract request schema from NestJS code
 */
function extractNestRequestSchema(content: string, matchIndex: number): string | undefined {
  const afterMatch = content.slice(matchIndex, matchIndex + 500);
  
  // Look for @Body() decorator
  const bodyMatch = afterMatch.match(/@Body\(\)\s+(\w+):\s+(\w+)/);
  if (bodyMatch) {
    return `{ ${bodyMatch[1]}: ${bodyMatch[2]} }`;
  }
  
  // Look for DTO classes
  const dtoMatch = afterMatch.match(/:\s+(\w+Dto)/i);
  if (dtoMatch) {
    return dtoMatch[1];
  }
  
  return undefined;
}

/**
 * Extract response schema from NestJS code
 */
function extractNestResponseSchema(content: string, matchIndex: number): string | undefined {
  const afterMatch = content.slice(matchIndex, matchIndex + 500);
  
  // Look for return type annotation
  const returnMatch = afterMatch.match(/:\s+Promise<(\w+)>/);
  if (returnMatch) {
    return returnMatch[1];
  }
  
  // Look for @ApiResponse decorator
  const apiResponseMatch = afterMatch.match(/@ApiResponse\([^)]*type:\s*(\w+)/);
  if (apiResponseMatch) {
    return apiResponseMatch[1];
  }
  
  return undefined;
}

/**
 * Extract request schema from Spring code
 */
function extractSpringRequestSchema(content: string, matchIndex: number): string | undefined {
  const afterMatch = content.slice(matchIndex, matchIndex + 500);
  
  // Look for @RequestBody
  const bodyMatch = afterMatch.match(/@RequestBody\s+(\w+)/);
  if (bodyMatch) {
    return bodyMatch[1];
  }
  
  // Look for @RequestParam
  const paramMatch = afterMatch.match(/@RequestParam[^)]*\)\s+(\w+)\s+(\w+)/);
  if (paramMatch) {
    return `{ ${paramMatch[2]}: ${paramMatch[1]} }`;
  }
  
  return undefined;
}

/**
 * Extract response schema from Spring code
 */
function extractSpringResponseSchema(content: string, matchIndex: number): string | undefined {
  const afterMatch = content.slice(matchIndex, matchIndex + 500);
  
  // Look for ResponseEntity<...>
  const responseMatch = afterMatch.match(/ResponseEntity<(\w+)>/);
  if (responseMatch) {
    return responseMatch[1];
  }
  
  // Look for return type
  const returnMatch = afterMatch.match(/public\s+(\w+(?:<[^>]+>)?)\s+\w+\s*\(/);
  if (returnMatch && returnMatch[1] !== "void") {
    return returnMatch[1];
  }
  
  return undefined;
}

/**
 * Extract request schema from Python/FastAPI code
 */
function extractPythonRequestSchema(content: string, matchIndex: number): string | undefined {
  const afterMatch = content.slice(matchIndex, matchIndex + 500);
  
  // Look for Pydantic models
  const pydanticMatch = afterMatch.match(/:\s+(\w+)(?:\s*=|,|\))/);
  if (pydanticMatch) {
    const typeName = pydanticMatch[1];
    if (typeName[0] === typeName[0].toUpperCase()) {
      return typeName;
    }
  }
  
  // Look for Body(...) parameters
  const bodyMatch = afterMatch.match(/Body\([^)]*\)/);
  if (bodyMatch) {
    return "Request body (validated)";
  }
  
  return undefined;
}

/**
 * Extract response schema from Python/FastAPI code
 */
function extractPythonResponseSchema(content: string, matchIndex: number): string | undefined {
  const afterMatch = content.slice(matchIndex, matchIndex + 500);
  
  // Look for -> response type annotation
  const returnMatch = afterMatch.match(/->\s+(\w+)/);
  if (returnMatch) {
    return returnMatch[1];
  }
  
  // Look for response_model parameter
  const modelMatch = afterMatch.match(/response_model\s*=\s*(\w+)/);
  if (modelMatch) {
    return modelMatch[1];
  }
  
  return undefined;
}

/**
 * Extract ViewSet methods from Django code
 */
function extractViewSetMethods(content: string, matchIndex: number): Array<{ method: string; action: string; description?: string }> {
  const methods: Array<{ method: string; action: string; description?: string }> = [];
  const classContent = content.slice(matchIndex, matchIndex + 2000);
  
  // Standard ViewSet actions
  const actionMap: Record<string, string> = {
    "list": "GET",
    "create": "POST",
    "retrieve": "GET",
    "update": "PUT",
    "partial_update": "PATCH",
    "destroy": "DELETE",
  };
  
  for (const [action, method] of Object.entries(actionMap)) {
    if (classContent.includes(`def ${action}`)) {
      methods.push({ method, action, description: `ViewSet ${action} action` });
    }
  }
  
  // Custom @action decorators
  const actionPattern = /@action\s*\([^)]*(?:methods\s*=\s*\[(['"`](\w+)['"`]))/g;
  let match;
  while ((match = actionPattern.exec(classContent)) !== null) {
    const method = match[2].toUpperCase();
    const actionMatch = classContent.slice(match.index).match(/def\s+(\w+)/);
    if (actionMatch) {
      methods.push({ method, action: actionMatch[1], description: `Custom ${method} action` });
    }
  }
  
  return methods;
}

/**
 * Extract controller path from NestJS @Controller decorator
 */
function extractControllerPath(content: string): string | undefined {
  const controllerMatch = content.match(/@Controller\s*\(\s*['"`]([^'"`]+)['"`]/);
  return controllerMatch?.[1];
}

/**
 * Extract class-level path from Spring @RequestMapping
 */
function extractSpringClassPath(content: string): string | undefined {
  const classMatch = content.match(/@RequestMapping\s*\(\s*(?:value\s*=\s*)?['"`]([^'"`]+)['"`]/);
  return classMatch?.[1];
}

/**
 * Detect base path from common patterns
 */
function detectBasePath(files: FileInfo[], rootDir: string): string | undefined {
  // Check for common base path patterns
  
  // Express: app.use('/api', router)
  for (const file of files) {
    if (file.extension === "js" || file.extension === "ts") {
      try {
        const content = readFile(path.join(rootDir, file.relativePath));
        const basePathMatch = content.match(/app\.use\s*\(\s*['"`]([^'"`]+)['"`]/);
        if (basePathMatch) {
          return basePathMatch[1];
        }
      } catch {}
    }
  }
  
  // NestJS: app.setGlobalPrefix('api')
  for (const file of files) {
    if (file.extension === "ts" && file.name === "main") {
      try {
        const content = readFile(path.join(rootDir, file.relativePath));
        const prefixMatch = content.match(/setGlobalPrefix\s*\(\s*['"`]([^'"`]+)['"`]/);
        if (prefixMatch) {
          return prefixMatch[1];
        }
      } catch {}
    }
  }
  
  // Spring Boot: server.servlet.context-path in application.properties
  for (const file of files) {
    if (file.name === "application.properties" || file.name === "application.yml") {
      try {
        const content = readFile(path.join(rootDir, file.relativePath));
        const contextMatch = content.match(/(?:context-path|contextPath)\s*[=:]\s*([^\s\n]+)/);
        if (contextMatch) {
          return contextMatch[1];
        }
      } catch {}
    }
  }
  
  // FastAPI: app = FastAPI(prefix='/api')
  for (const file of files) {
    if (file.extension === "py") {
      try {
        const content = readFile(path.join(rootDir, file.relativePath));
        const prefixMatch = content.match(/FastAPI\s*\([^)]*prefix\s*=\s*['"`]([^'"`]+)['"`]/);
        if (prefixMatch) {
          return prefixMatch[1];
        }
      } catch {}
    }
  }
  
  return undefined;
}

/**
 * Format API contracts as markdown
 */
function formatApiContracts(result: ApiContractResult): string {
  let content = "## API Contracts\n\n";
  
  if (result.basePath) {
    content += `**Base Path**: \`${result.basePath}\`\n\n`;
  }
  
  // Group endpoints by path
  const grouped = new Map<string, ApiEndpoint[]>();
  for (const endpoint of result.endpoints) {
    const key = endpoint.path;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(endpoint);
  }
  
  // Sort endpoints by path
  const sortedPaths = Array.from(grouped.keys()).sort();
  
  for (const path of sortedPaths) {
    const endpoints = grouped.get(path) || [];
    
    for (const endpoint of endpoints) {
      content += `### ${endpoint.method} ${endpoint.path}\n\n`;
      content += `- **Handler**: \`${endpoint.handler}\`\n`;
      
      if (endpoint.description) {
        content += `- **Description**: ${endpoint.description}\n`;
      }
      
      if (endpoint.requestSchema) {
        content += `- **Request**: \`${endpoint.requestSchema}\`\n`;
      }
      
      if (endpoint.responseSchema) {
        content += `- **Response**: \`${endpoint.responseSchema}\`\n`;
      }
      
      content += "\n";
    }
  }
  
  content += "---\n*Generated by ai-first*\n";
  
  return content;
}