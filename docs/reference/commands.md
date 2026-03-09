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

Generate repository architecture map.

```bash
ai-first map [options]
```

### Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--root <path>` | `-r` | Root directory |
| `--output <path>` | `-o` | Output path |

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

## context

Generate unified context file.

```bash
ai-first context [options]
```

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
