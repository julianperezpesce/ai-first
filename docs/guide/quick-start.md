# Quick Start

This guide walks you through using AI-First with your project.

## Step 1: Navigate to Your Project

```bash
cd /path/to/your/project
```

## Step 2: Initialize AI-First

```bash
ai-first init
```

You'll see output like:

```
✅ Generated ai/ai_context.md (0.3s)
✅ Generated ai/symbols.json (0.1s)  
✅ Generated ai/dependencies.json (0.1s)
✅ Generated 11 context files

🎉 Ready! Give ai/ai_context.md to your AI assistant.
```

## Step 3: Index for Fast Queries (Optional but Recommended)

```bash
ai-first index
```

This creates a SQLite database for fast symbol queries:

```
✅ Created ai/index.db
✅ Indexed 150 symbols from 45 files
```

## Step 4: Use with Your AI Agent

### OpenCode

Create `~/.config/opencode/commands/ai-first.md`:

```markdown
# AI-First Context

Read the file at {project_path}/ai/ai_context.md before helping with this codebase.
```

### Cursor

When starting a new session, paste the contents of `ai/ai_context.md` at the start.

### Claude Code

Include in your system prompt:

```
Before helping with code, read {project_path}/ai/ai_context.md
```

## Health Check

Run the doctor command to check repository readiness:

```bash
ai-first doctor
```

This reports:
- Files scanned
- Languages detected
- Large files (>1MB)
- AI directory status
- Index status
- Module graph status

## Commands Reference

| Command | Description |
|---------|-------------|
| `ai-first init` | Generate context files |
| `ai-first index` | Create SQLite index |
| `ai-first index --semantic` | Semantic indexing |
| `ai-first doctor` | Health check |
| `ai-first explore <module>` | Explore dependencies |
| `ai-first map` | Generate repo map |
| `ai-first summarize` | Create summary |
