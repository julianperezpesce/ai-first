# MCP Server

AI-First includes a native **Model Context Protocol (MCP)** server that enables seamless integration with AI coding agents like Cursor, Claude Code, and other MCP-compatible tools.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open standard that enables AI agents to interact with external tools and data sources. AI-First's MCP server exposes your repository context as AI-usable tools.

Compatibility profile references:

- OpenCode MCP servers: <https://opencode.ai/docs/mcp-servers>
- Codex Docs MCP setup: <https://developers.openai.com/learn/docs-mcp>
- Claude Code MCP setup: <https://code.claude.com/docs/en/mcp>

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

AI-First supports two MCP transports:

- **stdio**: default local mode. The agent client spawns `af mcp`.
- **Streamable HTTP**: remote/local HTTP mode. The agent client connects to a URL such as `http://127.0.0.1:3847/mcp`.

Compatibility depends on the agent client supporting one of those transports and reading the expected config file.

You can install a project-local profile:

```bash
ai-first install --platform opencode
ai-first install --platform codex
ai-first install --platform claude-code
ai-first install --platform cursor
```

List supported profiles:

```bash
ai-first install --list
```

Check the local setup without starting the stdio server:

```bash
ai-first mcp doctor
ai-first mcp doctor --json
```

Start the HTTP transport:

```bash
ai-first mcp --transport http --host 127.0.0.1 --port 3847
```

Require a bearer token:

```bash
AI_FIRST_MCP_TOKEN="$(openssl rand -hex 24)" ai-first mcp --transport http --port 3847
```

or:

```bash
ai-first mcp --transport http --port 3847 --token "$AI_FIRST_MCP_TOKEN"
```

Health endpoint:

```bash
curl http://127.0.0.1:3847/health
```

Compatibility profiles:

| Client | Status | Config written | Notes |
|--------|--------|----------------|-------|
| OpenCode | Supported | `opencode.jsonc` and legacy `.opencode/mcp.json` | Uses OpenCode local MCP config with `command: ["af", "mcp", "--root", "."]`. |
| Codex | Supported | `.codex/config.toml` | AI-First writes a project-local snippet. Some Codex installs may require copying it into `~/.codex/config.toml`. |
| Claude Code | Supported | `.mcp.json` | Project-scoped MCP config; Claude Code may ask for approval before using it. |
| Cursor | Partial | `.cursor/mcp.json` | Cursor MCP support and config location can vary by version; verify from Cursor settings. |
| Generic stdio | Supported | Manual | Use command `af mcp --root <repo>` in any client that supports local stdio MCP. |
| Remote HTTP | Supported | Manual URL | Use `af mcp --transport http`; non-local binds require a token unless `--allow-unsafe` is explicitly used. |

MCP is a protocol, not a guarantee that every agent tool can use every server. If a tool supports local stdio MCP, it can run AI-First locally. If it supports Streamable HTTP MCP, it can connect to AI-First through the HTTP endpoint.

#### Cursor

Add to your Cursor settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "ai-first": {
      "command": "ai-first",
      "args": ["mcp", "--root", "."]
    }
  }
}
```

#### Claude Code

The Claude Code CLI supports MCP natively:

```bash
ai-first install --platform claude-code
```

This writes `.mcp.json` in the project root.

#### Codex

Install a project-local Codex profile:

```bash
ai-first install --platform codex
```

Generated `.codex/config.toml`:

```toml
[mcp_servers.ai-first]
command = "af"
args = ["mcp", "--root", "."]
```

If your Codex installation only reads the user config, copy this entry into `~/.codex/config.toml` and verify with:

```bash
codex mcp list
```

#### OpenCode

Install the current OpenCode profile:

```bash
ai-first install --platform opencode
```

This writes `opencode.jsonc` and also keeps the historical `.opencode/mcp.json` compatibility file.

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

Get context for a specific file including related tests and mapping evidence.

```json
{
  "name": "get_context_for_file",
  "description": "Get context for a specific file",
  "input": {
    "file": "src/services/user.ts"
  }
}
```

### `get_project_brief`

Return the short `agent_brief.md` when generated, or create a live brief from current repository analysis.

```json
{
  "name": "get_project_brief",
  "input": {}
}
```

### `get_context_for_task`

Return task-specific context for an agent workflow: classified task kind, relevant files, related tests, commands to run, risks, repo contracts, confidence, and evidence.

```json
{
  "name": "get_context_for_task",
  "input": {
    "task": "add CLI command"
  }
}
```

Use this before editing when the agent needs to know where to work and how to verify the change.

### `is_context_fresh`

Check whether generated `ai-context/` still matches the current repository state.

```json
{
  "name": "is_context_fresh",
  "input": {}
}
```

**Returns:** freshness status, reason, manifest path, git commit comparison, dirty state, and changed/missing/added files.

### `run_doctor`

Run structured context health checks. Use `strict: true` to include Context Truth Score checks.

```json
{
  "name": "run_doctor",
  "input": {
    "strict": true
  }
}
```

### `get_quality_gates`

Evaluate repository quality gates for CI and agent trust. By default this performs static checks only. Set `runCommands: true` to execute npm build/test/docs scripts.

```json
{
  "name": "get_quality_gates",
  "input": {
    "runCommands": false
  }
}
```

**Returns:** overall status, pass/warn/fail summary, and gates such as package bin validity, build/test scripts, TypeScript config, CI workflow coverage, MCP shell safety, docs build script, and context trust.

### `get_mcp_compatibility`

Return supported MCP client profiles and, optionally, local setup checks.

```json
{
  "name": "get_mcp_compatibility",
  "input": {
    "includeDoctor": true
  }
}
```

**Returns:** supported platforms, expected config paths, transport, install notes, and doctor checks for source/bin/profile presence.

## Streamable HTTP

Use HTTP mode when an agent cannot spawn a local process or when you want one AI-First server to serve a controlled local/network environment.

```bash
ai-first mcp --transport http --port 3847
```

Endpoint:

```text
http://127.0.0.1:3847/mcp
```

Security notes:

- Bind to `127.0.0.1` by default.
- Use `AI_FIRST_MCP_TOKEN` or `--token` to require `Authorization: Bearer <token>`.
- Binding to `0.0.0.0` without a token is refused by default.
- `--allow-unsafe` exists only for controlled experiments and should not be used for shared networks.
- Do not expose the built-in server directly to the public internet.
- Put it behind authentication, TLS, and network access controls before remote/team use.
- Treat repository context as sensitive source-code metadata.

Doctor checks:

```bash
ai-first mcp doctor --transport http --host 0.0.0.0 --json
ai-first mcp doctor --transport http --host 0.0.0.0 --token "$AI_FIRST_MCP_TOKEN" --json
```

### `verify_ai_context`

Return the Context Truth Score for generated context.

```json
{
  "name": "verify_ai_context",
  "input": {}
}
```

**Returns:** score, trust status (`trusted`, `degraded`, `untrusted`), checks, messages, and evidence.

### `analyze_changes`

Analyze recent git changes using safe git argument arrays.

```json
{
  "name": "analyze_changes",
  "input": {
    "since": "HEAD~5"
  }
}
```

### `suggest_tests`

Suggest existing or missing tests for a source file.

```json
{
  "name": "suggest_tests",
  "input": {
    "file": "src/services/user.ts"
  }
}
```

### `run_security_audit`

Run security analysis and return findings with calibrated severity, confidence, and evidence.

```json
{
  "name": "run_security_audit",
  "input": {}
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

1. Agent calls `is_context_fresh` or `run_doctor` before trusting generated context
2. Agent calls `get_project_brief` for the short operational brief
3. Agent calls `get_context_for_task` to identify files, tests, commands, risks, and contracts
4. Agent calls `query_symbols` to find specific functions
5. Agent calls `get_context_for_file` or `suggest_tests` before editing
6. Agent calls `generate_context` only when context is missing or stale
7. Agent calls `get_mcp_compatibility` when it needs to explain or debug MCP setup for another client

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
| Context freshness | Guess | `is_context_fresh` |
| Trust score | Manual review | `verify_ai_context` |
| Task planning | Read many files | `get_context_for_task` |
| CI readiness | Manual checks | `get_quality_gates` |
| Integration | Paste content | Native |

## Next Steps

- [Configuration System](/guide/config) - Customize AI-First behavior
- [RAG Vector Search](/guide/rag) - Semantic code search
- [Git Blame](/guide/git-blame) - Track code authorship
