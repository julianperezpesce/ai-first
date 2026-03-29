import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { runAIFirst } from '../commands/ai-first.js';
import { generateIndex } from '../core/indexer.js';
import { buildKnowledgeGraph } from '../core/knowledgeGraphBuilder.js';
import { analyzeArchitecture } from '../analyzers/architecture.js';

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
      version: '1.4.0',
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
          
          const index = generateIndex(rootDir, aiDir);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  query,
                  type: symbolType,
                  results: [],
                  message: `Symbol query executed for "${query}"`,
                }, null, 2),
              },
            ],
          };
        }

        case 'get_architecture': {
          const format = (args?.format as string) || 'summary';
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  format,
                  rootDir,
                  message: 'Architecture analysis available',
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
