# Git Blame Integration

AI-First's Git Blame integration helps you understand **who wrote what and when**. Track code authorship directly in your AI context.

## Why Git Blame?

AI coding assistants often need to know:

- **Who wrote this code?** - For questions or reviews
- **When was it written?** - To understand context
- **What commit introduced it?** - To trace changes

Git Blame provides this information directly in your AI context.

## Usage

### CLI Command

```bash
ai-first git --blame src/auth/login.ts
```

**Output:**

```
src/auth/login.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 line  author          date         commit    code
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1    @julianperez   2026-03-15   a1b2c3d   import { Request, Response }
  15    @julianperez   2026-03-15   a1b2c3d   export async function login(
  23    @devteam       2026-03-18   e4f5g6h   } catch (error) {
  45    @devteam       2026-03-20   h7i8j9k   // TODO: add rate limiting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Format Options

#### Inline (per line)

```bash
ai-first git --blame --format inline src/auth/login.ts
```

```
1: @julianperez (2026-03-15) import { Request, Response }
15: @julianperez (2026-03-15) export async function login(req: Request) {
```

#### Block (grouped by author)

```bash
ai-first git --blame --format block src/auth/login.ts
```

```
@julianperez (2026-03-15)
  Lines 1-22
  Commit: a1b2c3d
  
@devteam (2026-03-18)
  Lines 23-44
  Commit: e4f5g6h
```

## Include in AI Context

Add blame information to your context:

```bash
ai-first init --include-git-blame
```

This adds authorship metadata to:

- `ai_context.md` - Brief attribution summary
- `ai_context.md` with blame section
- Individual file analysis

### Example Output

```markdown
## Auth Module

**Primary Author:** @julianperez (65%)
**Contributors:** @devteam (35%)

### Recent Changes

| File | Last Modified | Author |
|------|--------------|--------|
| login.ts | 2026-03-20 | @devteam |
| logout.ts | 2026-03-15 | @julianperez |
| register.ts | 2026-03-18 | @julianperez |
```

## Use Cases

### Code Review

When reviewing code, ask AI about authorship:

```
"Who wrote the password validation in src/auth/validators.ts and why might they have chosen bcrypt?"
```

AI-First provides the author context to help answer.

### Onboarding

```
"Who should I talk to about the payment integration?"
```

AI can trace the code and identify the author.

### Tracking Changes

```
"What was the rationale for this TODO comment on line 45?"
```

Git blame shows who wrote it and when.

## Configuration

```json
{
  "git": {
    "blame": {
      "enabled": true,
      "format": "inline",
      "includeEmail": false,
      "maxAge": "1 year"
    }
  }
}
```

## CLI Reference

| Flag | Description |
|------|-------------|
| `--blame` | Show git blame |
| `--format inline` | Per-line format |
| `--format block` | Grouped by author |
| `--include-email` | Show email addresses |
| `--since <date>` | Only blame since date |

## Example Commands

```bash
# Basic blame
ai-first git --blame src/auth/login.ts

# Block format
ai-first git --blame --format block src/auth/login.ts

# Recent changes only
ai-first git --blame --since 2026-01-01 src/

# JSON output for automation
ai-first git --blame --json src/auth/
```

## Integration with MCP

Use blame via MCP tool:

```json
{
  "name": "git_blame",
  "description": "Get git blame for a file",
  "input": {
    "path": "src/auth/login.ts",
    "format": "inline"
  }
}
```

## Benefits

| Feature | Without Blame | With Blame |
|---------|--------------|------------|
| Author info | Unknown | Always available |
| Change context | Guess | Know who/when |
| Code questions | Generic answers | Specific insights |
| Onboarding | Slow | Fast attribution |

## Next Steps

- [MCP Server](/guide/mcp) - Use blame as AI tool
- [Configuration](/guide/config) - Customize git settings
- [Quick Start](/guide/quick-start) - Get started
