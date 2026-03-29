# RAG Vector Search

AI-First includes **Retrieval-Augmented Generation (RAG)** capabilities for semantic code search. Find code by meaning, not just keywords.

## What is RAG?

Traditional search finds text matches. RAG finds semantically related code - even when you use different words than the code itself.

**Example:**
- Query: "how to authenticate users"
- Traditional search: Finds files with "authenticate" or "users"
- RAG search: Finds login, JWT, session, OAuth, and authentication code

## Setup

### 1. Create Semantic Index

```bash
ai-first index --semantic
```

This creates a vector index in `ai-context/index.db`:

```
✅ Indexed 500 files
✅ Generated 2500 vectors
✅ Semantic search ready
```

### 2. Search Your Codebase

```bash
ai-first search "how to handle errors"
```

**Returns:**

```
✓ Found 5 semantically related code sections:

1. src/utils/error-handler.ts (92% match)
   "Centralized error handling with retry logic"
   
2. src/middleware/error.ts (87% match)
   "Express error middleware"
   
3. src/core/validation.ts (85% match)
   "Input validation and sanitization"
```

## How It Works

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Query     │───▶│   Embed    │───▶│   Search    │
│ "auth user" │    │   (API)    │    │  (Vectors)  │
└─────────────┘    └─────────────┘    └─────────────┘
                                           │
                    ┌──────────────────────┘
                    ▼
              ┌─────────────┐
              │  Results    │
              │ Top-k close │
              └─────────────┘
```

AI-First uses local embeddings - no cloud required.

## Use Cases

### Onboarding

```
$ ai-first search "project structure organization"

✓ Found related code:

1. docs/architecture.md (95% match)
2. src/index.ts (88% match)
3. README.md (85% match)
```

### Finding Similar Code

```
$ ai-first search "email notification pattern"

✓ Found 3 related functions:

1. src/services/notification/email.ts
2. src/services/notification/sms.ts  
3. src/services/notification/push.ts
```

### Understanding Code

```
$ ai-first search "database connection pooling"

✓ Found related code:

1. src/db/connection.ts
   "Manages connection pool with auto-reconnect"
   
2. src/db/query-builder.ts
   "Builds SQL queries with parameter binding"
```

## Configuration

### Embedding Model

AI-First uses a lightweight embedding model optimized for code:

```json
{
  "rag": {
    "embeddingModel": "code-optimized",
    "dimension": 384,
    "similarity": "cosine"
  }
}
```

### Index Options

```json
{
  "indexing": {
    "semantic": true,
    "batchSize": 100,
    "excludePatterns": ["**/*.test.ts", "**/*.spec.ts"]
  }
}
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `ai-first index --semantic` | Create semantic index |
| `ai-first search <query>` | Search by meaning |
| `ai-first search --limit 10 <query>` | Limit results |
| `ai-first search --json <query>` | JSON output |

## RAG + MCP

Combine RAG with MCP for AI agent superpowers:

```json
{
  "name": "semantic_search",
  "description": "Search code semantically",
  "input": {
    "query": "user authentication flow"
  }
}
```

## Benefits

| Feature | Without RAG | With RAG |
|---------|-----------|----------|
| Search type | Keyword only | Semantic |
| Query flexibility | Exact matches | Natural language |
| Context | None | Related code |
| Onboarding | Manual exploration | Intelligent discovery |

## Next Steps

- [MCP Server](/guide/mcp) - Use semantic search as AI tool
- [Configuration](/guide/config) - Customize indexing
- [Quick Start](/guide/quick-start) - Get started
