import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import http, { type IncomingHttpHeaders } from 'node:http';
import { randomUUID } from 'node:crypto';
import { generateIndex, EXAMPLE_QUERIES } from '../core/indexer.js';
import { scanRepo } from '../core/repoScanner.js';
import { analyzeArchitecture } from '../analyzers/architecture.js';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { mapTestFiles } from '../utils/testFileMapper.js';
import { detectSecurityIssues } from '../utils/securityAuditor.js';
import { analyzeChanges } from '../core/services/gitService.js';
import { generateContext, getProjectBrief } from '../core/services/contextService.js';
import { isContextFresh, runContextDoctor, verifyAIContext } from '../core/services/doctorService.js';
import { getContextForTask } from '../core/services/taskContextService.js';
import { evaluateQualityGates } from '../core/services/qualityGateService.js';
import { evaluateMcpHttpSafety, getMcpCompatibilityProfiles, getMcpDoctor } from '../core/services/mcpCompatibilityService.js';
import { understandTopic } from '../core/services/understandService.js';

interface MCPServerOptions {
  rootDir?: string;
  aiDir?: string;
}

export interface MCPHttpServerOptions extends MCPServerOptions {
  host?: string;
  port?: number;
  path?: string;
  enableJsonResponse?: boolean;
  authToken?: string;
  allowUnsafe?: boolean;
}

export function createMCPServer(options: MCPServerOptions = {}): Server {
  const rootDir = options.rootDir || process.cwd();
  const aiDir = options.aiDir || `${rootDir}/ai-context`;

  const server = new Server(
    {
      name: 'ai-first-cli',
      version: '1.3.8',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'generate_context',
          description: 'Generate AI context for the repository or a specific module',
          inputSchema: {
            type: 'object',
            properties: {
              module: {
                type: 'string',
                description: 'Optional module path to generate context for (e.g., "src/auth")',
              },
              preset: {
                type: 'string',
                enum: ['full', 'quick', 'api', 'docs'],
                description: 'Preset to use for context generation',
              },
            },
          },
        },
        {
          name: 'query_symbols',
          description: 'Query symbols (functions, classes, interfaces) in the indexed repository',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for symbols',
              },
              type: {
                type: 'string',
                enum: ['function', 'class', 'interface', 'variable', 'all'],
                description: 'Type of symbol to search for',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_architecture',
          description: 'Get the architecture analysis of the project',
          inputSchema: {
            type: 'object',
            properties: {
              format: {
                type: 'string',
                enum: ['summary', 'detailed'],
                description: 'Level of detail for the architecture report',
              },
            },
          },
        },
        {
          name: 'get_context_for_file',
          description: 'Get AI context for a specific file',
          inputSchema: { type: 'object', properties: { file: { type: 'string' } }, required: ['file'] },
        },
        {
          name: 'get_context_for_task',
          description: 'Get task-specific context with relevant files, tests, commands, risks and evidence',
          inputSchema: { type: 'object', properties: { task: { type: 'string' } }, required: ['task'] },
        },
        {
          name: 'understand_topic',
          description: 'Understand a repository topic using hybrid source, task, architecture, tests, freshness and git evidence',
          inputSchema: { type: 'object', properties: { topic: { type: 'string' } }, required: ['topic'] },
        },
        {
          name: 'get_project_brief',
          description: 'Get the short agent-facing project brief, using generated context when available',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'is_context_fresh',
          description: 'Check whether ai-context is fresh against the current repository state',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'run_doctor',
          description: 'Run AI context trust checks and return a structured doctor result',
          inputSchema: {
            type: 'object',
            properties: {
              strict: {
                type: 'boolean',
                description: 'Include Context Truth Score verification checks',
              },
            },
          },
        },
        {
          name: 'get_quality_gates',
          description: 'Evaluate repository quality gates for CI and agent trust',
          inputSchema: {
            type: 'object',
            properties: {
              runCommands: {
                type: 'boolean',
                description: 'Run npm build/test/docs scripts instead of static checks only',
              },
            },
          },
        },
        {
          name: 'get_mcp_compatibility',
          description: 'Return MCP compatibility profiles and local setup checks for agent clients',
          inputSchema: {
            type: 'object',
            properties: {
              includeDoctor: {
                type: 'boolean',
                description: 'Include project-local MCP setup checks',
              },
              transport: {
                type: 'string',
                enum: ['stdio', 'streamable-http'],
                description: 'Transport to evaluate in doctor checks',
              },
              host: {
                type: 'string',
                description: 'HTTP host to evaluate for Streamable HTTP safety',
              },
              port: {
                type: 'number',
                description: 'HTTP port to evaluate for Streamable HTTP safety',
              },
              authConfigured: {
                type: 'boolean',
                description: 'Whether an HTTP auth token is configured outside the MCP request',
              },
            },
          },
        },
        {
          name: 'verify_ai_context',
          description: 'Return Context Truth Score and trust checks for generated ai-context',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'analyze_changes',
          description: 'Analyze recent git changes',
          inputSchema: { type: 'object', properties: { since: { type: 'string' } } },
        },
        {
          name: 'suggest_tests',
          description: 'Suggest test files for a source file',
          inputSchema: { type: 'object', properties: { file: { type: 'string' } }, required: ['file'] },
        },
        {
          name: 'run_security_audit',
          description: 'Run security analysis',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'generate_context': {
          const result = await generateContext({
            rootDir,
            outputDir: aiDir,
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: result.success,
                  filesCreated: result.filesCreated,
                  message: result.success 
                    ? `Generated context in ${aiDir}` 
                    : `Error: ${result.error}`,
                }, null, 2),
              },
            ],
          };
        }

        case 'query_symbols': {
          const query = args?.query as string;
          const symbolType = (args?.type as string) || 'all';
          
          // Ensure index exists
          const dbPath = path.join(aiDir, 'index.db');
          if (!fs.existsSync(dbPath)) {
            // Generate index if it doesn't exist
            await generateIndex(rootDir, dbPath);
          }
          
          // Query symbols from SQLite
          const SQL = await initSqlJs();
          const fileBuffer = fs.readFileSync(dbPath);
          const db = new SQL.Database(fileBuffer);
          
          // Build query based on type filter
          let sqlQuery = EXAMPLE_QUERIES.searchSymbols;
          if (symbolType !== 'all') {
            sqlQuery = `SELECT s.name, s.type, f.path, s.line FROM symbols s JOIN files f ON s.file_id = f.id WHERE s.name LIKE ? AND s.type = ? LIMIT 50`;
          }
          
          const searchPattern = `%${query}%`;
          const results = symbolType !== 'all'
            ? db.exec(sqlQuery, [searchPattern, symbolType])
            : db.exec(sqlQuery, [searchPattern]);
          
          db.close();
          
          // Format results
          let formattedResults: Array<{name: string; type: string; file: string; line: number}> = [];
          if (results.length > 0 && results[0].values.length > 0) {
            formattedResults = results[0].values.map((row: unknown[]) => ({
              name: row[0] as string,
              type: row[1] as string,
              file: row[2] as string,
              line: row[3] as number,
            }));
          }
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  query,
                  type: symbolType,
                  results: formattedResults,
                  count: formattedResults.length,
                  message: `Found ${formattedResults.length} symbols matching "${query}"`,
                }, null, 2),
              },
            ],
          };
        }

        case 'get_architecture': {
          const format = (args?.format as string) || 'summary';
          const { files } = scanRepo(rootDir);
          const analysis = analyzeArchitecture(files, rootDir);
          return { content: [{ type: 'text', text: JSON.stringify({ pattern: analysis.pattern, layers: analysis.layers, moduleCount: analysis.modules.length }, null, 2) }] };
        }

        case 'get_context_for_file': {
          const file = args?.file as string;
          const mapping = mapTestFiles(rootDir);
          const fileMapping = mapping.find(m => m.sourceFile === file);
          return { content: [{ type: 'text', text: JSON.stringify({ file, hasTests: !!fileMapping?.testFiles?.length, tests: fileMapping?.testFiles || [], confidence: fileMapping?.confidence || 0, reason: fileMapping?.reason || null, evidence: fileMapping?.evidence || [] }, null, 2) }] };
        }

        case 'get_context_for_task': {
          const task = args?.task as string;
          const taskContext = getContextForTask(rootDir, task);
          return { content: [{ type: 'text', text: JSON.stringify(taskContext, null, 2) }] };
        }

        case 'understand_topic': {
          const topic = args?.topic as string;
          const result = understandTopic(rootDir, topic);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'get_project_brief': {
          const brief = getProjectBrief(rootDir, aiDir);
          return { content: [{ type: 'text', text: JSON.stringify(brief, null, 2) }] };
        }

        case 'is_context_fresh': {
          const freshness = isContextFresh(rootDir, aiDir);
          return { content: [{ type: 'text', text: JSON.stringify(freshness, null, 2) }] };
        }

        case 'run_doctor': {
          const strict = Boolean(args?.strict);
          const doctor = runContextDoctor({ rootDir, outputDir: aiDir, strict });
          return { content: [{ type: 'text', text: JSON.stringify(doctor, null, 2) }] };
        }

        case 'get_quality_gates': {
          const runCommands = Boolean(args?.runCommands);
          const gates = evaluateQualityGates({ rootDir, outputDir: aiDir, runCommands });
          return { content: [{ type: 'text', text: JSON.stringify(gates, null, 2) }] };
        }

        case 'get_mcp_compatibility': {
          const includeDoctor = Boolean(args?.includeDoctor);
          const transport = args?.transport === 'streamable-http' ? 'streamable-http' : 'stdio';
          const result = {
            transport: 'stdio',
            profiles: getMcpCompatibilityProfiles(),
            doctor: includeDoctor ? getMcpDoctor({
              rootDir,
              transport,
              host: typeof args?.host === 'string' ? args.host : undefined,
              port: typeof args?.port === 'number' ? args.port : undefined,
              authToken: args?.authConfigured ? 'configured' : undefined,
            }) : undefined,
          };
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'verify_ai_context': {
          const verification = verifyAIContext(rootDir, aiDir);
          return { content: [{ type: 'text', text: JSON.stringify(verification, null, 2) }] };
        }

        case 'analyze_changes': {
          const since = (args?.since as string) || 'HEAD~5';
          const changes = analyzeChanges(rootDir, since);
          return { content: [{ type: 'text', text: JSON.stringify({ ...changes, files: changes.files.slice(0, 15) }, null, 2) }] };
        }

        case 'suggest_tests': {
          const file = args?.file as string;
          const mapping = mapTestFiles(rootDir);
          const fileMapping = mapping.find(m => m.sourceFile === file);
          return { content: [{ type: 'text', text: JSON.stringify({ file, existingTests: fileMapping?.testFiles || [], suggestion: fileMapping?.testFiles?.length ? 'Tests exist' : 'Create a test file' }, null, 2) }] };
        }

        case 'run_security_audit': {
          const issues = detectSecurityIssues(rootDir);
          const criticals = issues.filter(i => i.severity === 'critical');
          return { content: [{ type: 'text', text: JSON.stringify({ total: issues.length, critical: criticals.length, top: issues.slice(0, 5) }, null, 2) }] };
        }

        default:
          return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export function startMCPServer(options: MCPServerOptions = {}): void {
  const server = createMCPServer(options);
  const transport = new StdioServerTransport();
  void server.connect(transport);
  
  console.error('AI-First MCP Server running on stdio');
}

export async function startMCPHttpServer(options: MCPHttpServerOptions = {}): Promise<http.Server> {
  const host = options.host || '127.0.0.1';
  const port = options.port ?? 3847;
  const endpointPath = options.path || '/mcp';
  const authToken = options.authToken;
  const safety = evaluateMcpHttpSafety({
    host,
    port,
    authToken,
    allowUnsafe: options.allowUnsafe,
  });
  if (!safety.ok) {
    throw new Error(`${safety.message}. Set AI_FIRST_MCP_TOKEN or pass --token for non-local HTTP MCP.`);
  }

  const server = createMCPServer(options);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: options.enableJsonResponse ?? true,
    allowedHosts: port > 0 ? [`${host}:${port}`, host, `localhost:${port}`, 'localhost'] : undefined,
  });

  await server.connect(transport);

  const httpServer = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`);

      if (requestUrl.pathname === '/health') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          transport: 'streamable-http',
          endpoint: endpointPath,
          auth: authToken ? 'enabled' : 'disabled',
          localOnly: safety.localOnly,
        }));
        return;
      }

      if (requestUrl.pathname !== endpointPath) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'not_found', endpoint: endpointPath }));
        return;
      }

      if (!isMcpHttpRequestAuthorized(req.headers, authToken)) {
        res.writeHead(401, { 'content-type': 'application/json', 'www-authenticate': 'Bearer' });
        res.end(JSON.stringify({ error: 'unauthorized', message: 'Missing or invalid bearer token' }));
        return;
      }

      await transport.handleRequest(req, res);
    } catch (error) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, host, () => {
      httpServer.off('error', reject);
      resolve();
    });
  });

  return httpServer;
}

export function isMcpHttpRequestAuthorized(headers: IncomingHttpHeaders, authToken?: string): boolean {
  if (!authToken) return true;
  const header = headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  return value === `Bearer ${authToken}`;
}

export { startMCPServer as startMCP };
