# Configuration System

AI-First supports a powerful configuration system that lets you customize context generation with presets or your own configuration file.

## Configuration File

Create `ai-first.config.json` in your project root:

```json
{
  "preset": "full",
  "compression": {
    "enabled": true,
    "level": "moderate"
  },
  "indexing": {
    "semantic": true,
    "batchSize": 50
  }
}
```

## Built-in Presets

AI-First includes 4 built-in presets optimized for different use cases:

### `full` - Complete Context

Generates maximum context for deep understanding:

```json
{
  "preset": "full"
}
```

**Use case:** Full codebase analysis, onboarding new developers

### `quick` - Fast Overview

Minimal context for quick tasks:

```json
{
  "preset": "quick"
}
```

**Use case:** Small changes, readme updates, one-liners

### `api` - API-Focused

Optimized for API development:

```json
{
  "preset": "api"
}
```

**Use case:** REST APIs, GraphQL, microservice backends

### `docs` - Documentation

Context focused on documentation:

```json
{
  "preset": "docs"
}
```

**Use case:** Writing docs, code comments, README updates

## Configuration Options

### Compression

Reduce token usage by compressing content:

```json
{
  "compression": {
    "enabled": true,
    "level": "aggressive",
    "preserve": ["exports", "imports", "types"]
  }
}
```

**Levels:**
- `none` - No compression
- `moderate` - Balanced (recommended)
- `aggressive` - Maximum compression

### Inclusion Levels

Control what files are included:

```json
{
  "content": {
    "inclusionLevel": "compress",
    "detailLevel": "signatures"
  }
}
```

**Inclusion levels:**
- `full` - Include all file contents
- `compress` - Include with compression
- `directory` - Directory names only
- `exclude` - Skip entirely

**Detail levels:**
- `full` - Complete content
- `signatures` - Only function signatures
- `skeleton` - Just structure

### Indexing Options

Configure symbol indexing:

```json
{
  "indexing": {
    "semantic": true,
    "batchSize": 100,
    "cache": true
  }
}
```

## Using Presets with CLI

Override preset on command line:

```bash
ai-first init --preset quick
ai-first init --preset api
ai-first init --preset docs
```

## Custom Configuration

### Example: API Project

```json
{
  "preset": "api",
  "compression": {
    "enabled": true,
    "level": "moderate"
  },
  "content": {
    "includePatterns": ["**/*.ts", "**/*.js"],
    "excludePatterns": ["**/*.test.ts", "**/*.spec.ts"]
  }
}
```

### Example: Documentation Focus

```json
{
  "preset": "docs",
  "compression": {
    "enabled": true,
    "level": "aggressive"
  },
  "content": {
    "detailLevel": "skeleton",
    "includePatterns": ["**/*.md", "**/*.txt", "**/*.json"]
  }
}
```

## Configuration Precedence

Settings are applied in this order (later overrides earlier):

1. Built-in defaults
2. `ai-first.config.json` in project
3. `~/.ai-first/config.json` in home directory
4. Command line flags

## Validate Configuration

Check if your configuration is valid:

```bash
ai-first config --validate
```

List available presets:

```bash
ai-first config --presets
```

Show current effective configuration:

```bash
ai-first config --show
```

## Next Steps

- [MCP Server](/guide/mcp) - Use AI-First as a tool in AI agents
- [RAG Vector Search](/guide/rag) - Semantic code search
- [Quick Start](/guide/quick-start) - Get started with AI-First
