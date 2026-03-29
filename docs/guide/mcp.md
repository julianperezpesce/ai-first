# MCP Server

AI-First includes a native **Model Context Protocol (MCP)** server that enables seamless integration with AI coding agents like Cursor, Claude Code, and other MCP-compatible tools.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open standard that enables AI agents to interact with external tools and data sources. AI-First's MCP server exposes your repository context as AI-usable tools.

## Setup

### 1. Install AI-First

```bash
npm install -g ai-first-cli
```

### 2. Start the MCP Server

```bash
ai-first mcp
```

The server starts on `stdio` by default, ready to accept MCP connections.

### 3. Configure Your AI Agent

#### Cursor

Add to your Cursor settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "ai-first": {
      "command": "ai-first",
      "args": ["mcp"]
    }
  }
}
```

#### Claude Code

The Claude Code CLI supports MCP natively:

```bash
claude --mcp ai-first mcp
```

## Available Tools

Once connected, AI-First provides these tools:

### `generate_context`

Generate complete AI context for the repository.

```json
{
  "name": "generate_context",
  "description": "Generate AI context for the repository",
  "input": {}
}
```

**Returns:** Full `ai_context.md` content including:
- Project overview
- Architecture
- Tech stack
- Symbols
- Dependencies

### `query_symbols`

Search for symbols (functions, classes, interfaces) by name pattern.

```json
{
  "name": "query_symbols",
  "description": "Search symbols in indexed repository",
  "input": {
    "pattern": "getUser"
  }
}
```

**Returns:** List of matching symbols with file paths and line numbers.

### `get_architecture`

Get architecture analysis for the repository.

```json
{
  "name": "get_architecture",
  "description": "Get architecture analysis",
  "input": {}
}
```

**Returns:** Architecture pattern, modules, and dependencies.

### `get_file_context`

Get context for a specific file including its imports and exports.

```json
{
  "name": "get_file_context",
  "description": "Get context for a specific file",
  "input": {
    "path": "src/services/user.ts"
  }
}
```

## Example Usage

### Interactive Query

```bash
$ ai-first mcp
> Query symbols: getUser
✓ Found 3 symbols:
  - src/services/user.ts:147:getUser(id: string)
  - src/services/user.ts:203:getUserByEmail(email: string)
  - tests/user.test.ts:45:getUser()
```

### AI Agent Workflow

When your AI agent needs to understand code:

1. Agent calls `generate_context` tool
2. AI-First returns full repository context
3. Agent uses context to understand project structure
4. Agent calls `query_symbols` to find specific functions
5. Agent calls `get_file_context` for detailed file understanding

## Configuration

Create `ai-first.config.json` to customize MCP behavior:

```json
{
  "mcp": {
    "enabled": true,
    "tools": ["generate_context", "query_symbols", "get_architecture"]
  }
}
```

## Benefits

| Feature | Without MCP | With MCP |
|---------|-----------|----------|
| Context generation | Manual | Automatic |
| Symbol search | Grep/manual | Natural language |
| Architecture queries | Read files | Tool call |
| Integration | Paste content | Native |

## Next Steps

- [Configuration System](/guide/config) - Customize AI-First behavior
- [RAG Vector Search](/guide/rag) - Semantic code search
- [Git Blame](/guide/git-blame) - Track code authorship
