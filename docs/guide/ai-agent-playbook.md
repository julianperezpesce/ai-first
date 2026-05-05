# AI Agent Playbook

This guide is written for AI coding agents using AI-First through generated files, CLI commands, or MCP tools.

## Operating Rule

Do not treat generated context as automatically true. First verify freshness, then choose the smallest task-specific context that can answer the current task.

## When To Use AI-First

Use AI-First at the start of a repository session, before broad edits, and whenever the task depends on project conventions, architecture, tests, entrypoints, or generated context.

Good fits:

- Understanding an unfamiliar repository.
- Planning a code change across multiple files.
- Finding the right command, handler, analyzer, service, or test file.
- Checking whether generated context is fresh before using it.
- Explaining repo structure to a human or another agent.
- Preparing CI, release, or documentation changes.

Poor fits:

- Replacing direct source inspection.
- Making final security claims without manual review.
- Trusting low-confidence findings without evidence.
- Regenerating full context for a one-file edit when current context is already fresh.

## First Tool Calls

When connected through MCP, start every new repository session with:

```json
{ "name": "is_context_fresh", "input": {} }
```

If the result is stale or missing:

```json
{ "name": "generate_context", "input": {} }
```

Then verify:

```json
{ "name": "verify_ai_context", "input": {} }
```

For CLI-only workflows:

```bash
af doctor context
af verify ai-context
```

## Context Selection

Use the smallest context that matches the job:

| Task | Prefer |
|------|--------|
| Understand the repo | `get_project_brief` or `ai-context/agent_brief.md` |
| Understand a topic or flow | `understand_topic` or `af understand` |
| Add or change a feature | `get_context_for_task` |
| Edit one known file | `get_context_for_file` |
| Find a function/class | `query_symbols` |
| Verify generated context | `verify_ai_context` or `af verify ai-context` |
| Check CI readiness | `get_quality_gates` or `af doctor --ci` |
| Explain MCP setup | `get_mcp_compatibility` or `af mcp doctor` |
| Regenerate stale context | `generate_context` or `af init` |

## Task Workflow

Before editing:

```json
{
  "name": "get_context_for_task",
  "input": {
    "task": "add CLI command"
  }
}
```

Use the response fields as follows:

- `kind`: decide which workflow applies.
- `relevantFiles`: inspect these first; confidence and evidence explain why each file was selected.
- `relatedTests`: update or add tests near these files.
- `commands`: run these after editing.
- `risks`: avoid these failure modes.
- `contracts`: treat these as repository invariants.
- `docs`: update public docs when user-facing behavior changes.

## Trust Levels

`verify_ai_context` returns:

- `trusted`: safe to use as primary context.
- `degraded`: usable, but verify important claims against source.
- `untrusted`: regenerate or inspect source directly.

Warnings are not always blockers, but they should change how much you trust generated context.

## Generated Files To Prefer

Start with:

- `ai-context/agent_brief.md`
- `ai-context/context_manifest.json`
- `ai-context/ai_context.md`
- `ai-context/tech_stack.md`
- `ai-context/architecture.md`
- `ai-context/entrypoints.md`
- `ai-context/test-mapping.json`

Use JSON outputs when making automated decisions. Use Markdown outputs for human-readable summaries.

## Evidence and Confidence

When a generated artifact includes `confidence`, `reason`, or `evidence`, prefer higher-confidence items first. Low confidence does not mean wrong; it means the agent should verify before acting.

Good agent behavior:

1. Prefer confirmed package/config evidence over filename-only guesses.
2. Check source files before editing.
3. Run the commands recommended by task context.
4. Update documentation when commands, MCP tools, generated files, or public behavior change.

## CLI Examples

```bash
# Verify generated context before using it
af verify ai-context

# Understand a topic with source, tests, architecture and freshness evidence
af understand "auth login" --format json

# Get task-specific guidance
af context --task "fix MCP tool" --format markdown

# Save task context for later
af context --task "add analyzer" --format json --save
```

## MCP Examples

```json
{ "name": "get_project_brief", "input": {} }
```

```json
{
  "name": "understand_topic",
  "input": {
    "topic": "auth login"
  }
}
```

```json
{
  "name": "get_context_for_task",
  "input": {
    "task": "write tests for analyzer"
  }
}
```

```json
{
  "name": "get_context_for_file",
  "input": {
    "file": "src/analyzers/techStack.ts"
  }
}
```

## When To Regenerate

Regenerate context when:

- `is_context_fresh` reports stale.
- source files changed since context generation.
- package/config files changed.
- the task depends on newly added files.
- `verify_ai_context` returns `untrusted`.

Do not regenerate just because a task is narrow. Prefer `get_context_for_task` or `get_context_for_file` when context is fresh.

## Agent Checklist

Before editing:

- [ ] Check freshness.
- [ ] Read `agent_brief.md` or call `get_project_brief`.
- [ ] Get task-specific context.
- [ ] Inspect relevant source files.

After editing:

- [ ] Run recommended commands.
- [ ] Run quality gates for merge-sensitive changes.
- [ ] Update docs for user-facing behavior.
- [ ] Regenerate context if generated outputs are part of the workflow.
- [ ] Re-run `verify_ai_context` when context quality matters.

## Quality Gates

Use quality gates before handing work back for review, especially after changing CLI behavior, MCP tools, generated context, docs, package metadata, or CI workflows.

CLI:

```bash
af doctor --ci --json
```

MCP:

```json
{
  "name": "get_quality_gates",
  "input": {
    "runCommands": false
  }
}
```

Use `runCommands: true` only when the agent is allowed to run build/test/docs scripts.

Quality gates also check release readiness: evaluator config/scripts, semantic-release config, publish workflow, README/package version alignment, and context trust. When `runCommands: true` is enabled, AI-First also runs `npm run evaluate:quick` if the script exists.

## MCP Client Setup

AI-First currently runs as a local stdio MCP server. Use compatibility profiles instead of guessing config formats:

```bash
af install --list
af install --platform opencode
af install --platform codex
af install --platform claude-code
af mcp doctor --json
```

MCP tool:

```json
{
  "name": "get_mcp_compatibility",
  "input": {
    "includeDoctor": true
  }
}
```

If a client supports Streamable HTTP MCP, connect it to:

```text
http://127.0.0.1:3847/mcp
```

Start that endpoint with:

```bash
af mcp --transport http --port 3847
```

For non-local binds, require a token:

```bash
AI_FIRST_MCP_TOKEN="..." af mcp --transport http --host 0.0.0.0 --port 3847
```

Agents should call `af mcp doctor --transport http --host <host> --json` before recommending remote setup. Do not expose the HTTP transport outside localhost or a trusted network without bearer auth, TLS/proxy controls, and explicit operator approval.
