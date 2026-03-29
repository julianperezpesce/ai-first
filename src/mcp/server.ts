import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { runAIFirst } from '../commands/ai-first.js';
import { generateIndex, EXAMPLE_QUERIES } from '../core/indexer.js';
import { scanRepo } from '../core/repoScanner.js';
import { analyzeArchitecture } from '../analyzers/architecture.js';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

interface MCPServerOptions {
  rootDir?: string;
  aiDir?: string;
}

export function startMCPServer(options: MCPServerOptions = {}): void {
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
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'generate_context': {
          const result = await runAIFirst({
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
          
          const output = format === 'detailed'
            ? {
                pattern: analysis.pattern,
                layers: analysis.layers,
                modules: analysis.modules,
                description: analysis.description,
              }
            : {
                pattern: analysis.pattern,
                layers: analysis.layers,
                moduleCount: analysis.modules.length,
              };
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  format,
                  rootDir,
                  ...output,
                }, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
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

  const transport = new StdioServerTransport();
  server.connect(transport);
  
  console.error('AI-First MCP Server running on stdio');
}

export { startMCPServer as startMCP };
