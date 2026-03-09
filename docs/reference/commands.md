# Commands

Complete reference for all AI-First CLI commands.

## init

Initialize AI-First and generate context files.

```bash
ai-first init [options]
```

### Options

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--root <path>` | `-r` | Root directory | `process.cwd()` |
| `--output <path>` | `-o` | Output directory | `./ai` |

### Example

```bash
ai-first init --root ./my-project --output ./docs/ai
```

## index

Create SQLite index for fast symbol queries.

```bash
ai-first index [options]
```

### Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--root <path>` | `-r` | Root directory |
| `--output <path>` | `-o` | Output directory |
| `--semantic` | `-s` | Enable semantic indexing with embeddings |

### Example

```bash
# Basic indexing
ai-first index

# Semantic indexing (for large repos)
ai-first index --semantic
```

## doctor

Check repository health and AI readiness.

```bash
ai-first doctor [options]
```

### Options

| Flag | Description |
|------|-------------|
| `--fix` | Auto-fix issues when possible |

### Example

```bash
ai-first doctor
ai-first doctor --fix
```

## explore

Navigate module dependencies.

```bash
ai-first explore <module>
```

### Example

```bash
# List all modules
ai-first explore all

# Explore specific module
ai-first explore src
ai-first explore lib
```

## map

Generate repository architecture map including symbol graph.

```bash
ai-first map [options]
```

### Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--root <path>` | `-r` | Root directory |
| `--output <path>` | `-o` | Output path |

### Output Files

- `ai/files.json` - File index with symbol mappings
- `ai/graph/module-graph.json` - Module-level dependencies
- `ai/graph/symbol-graph.json` - Symbol relationships
- `ai/graph/symbol-references.json` - Reverse references (who calls what)
- `ai/cache.json` - Incremental indexing state

## context

Generate context for a specific symbol or general AI context.

### Generate Symbol Context (Code Context Packet)

```bash
ai-first context <symbol> [options]
```

#### Options

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--depth <n>` | `-d` | Graph traversal depth | 1 |
| `--max-symbols <n>` | `-m` | Max related symbols | 50 |
| `--format <fmt>` | `-f` | Output format (json, markdown, text) | json |
| `--save` | `-s` | Save to file | false |
| `--root <path>` | `-r` | Root directory | process.cwd() |
| `--output <path>` | `-o` | Output directory | ./ai |

#### Examples

```bash
# Basic usage
ai-first context loginUser

# With depth traversal
ai-first context loginUser --depth 2

# Markdown output
ai-first context loginUser --format markdown

# Save to file
ai-first context loginUser --save

# Full options
ai-first context loginUser -d 2 -m 100 -f markdown --save
```

### Generate General Context

```bash
ai-first context [options]
```

Without a symbol argument, generates general AI context files.

### Output

Code Context Packet (CCP) includes:
- Symbol definition and metadata
- Source code snippet
- Relationships (calls, imports, extends, implements, etc.)
- Callers (reverse references)
- Related symbols with graph distance
- File neighbors
- Relevance score

## summarize

Create hierarchical summary for AI navigation.

```bash
ai-first summarize [options]
```

### Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--root <path>` | `-r` | Root directory |
| `--output <path>` | `-o` | Output path |

## Global Options

These options work with all commands:

| Flag | Description |
|------|-------------|
| `--help` | Show help |
| `--version` | Show version number |

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error |
