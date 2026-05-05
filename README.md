# ai-first

<p align="center">
  <a href="https://github.com/julianperezpesce/ai-first/stargazers">
    <img src="https://img.shields.io/github/stars/julianperezpesce/ai-first?style=flat&color=ffd700" alt="Stars">
  </a>
  <a href="https://www.npmjs.com/package/ai-first-cli">
    <img src="https://img.shields.io/npm/dt/ai-first-cli?color=blue" alt="NPM Downloads">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  </a>
  <a href="https://github.com/julianperezpesce/ai-first/issues">
    <img src="https://img.shields.io/github/issues/julianperezpesce/ai-first" alt="Issues">
  </a>
</p>

[Español](./README.es.md)

AI-First is a CLI and MCP server that gives AI coding agents a compact, verifiable understanding of a repository before they edit it.

It generates `ai-context/` with architecture, symbols, entrypoints, tests, dependencies, rules, risks, freshness metadata, and an agent brief. It also exposes the same context through MCP tools for agents that support the Model Context Protocol.

Current release train: `v1.5`.

The goal is not to create more documentation files. The goal is to help an agent answer: **what is this repo, where should I work, what evidence supports that, and how do I verify my change?**

## Why It Exists

AI agents are much better when they start with trusted context instead of reading a random subset of files. AI-First focuses on:

- Freshness: generated context records when and from which git/file state it was created.
- Evidence: important claims include source paths, package/config references, reasons, and confidence.
- Task focus: agents can request context for a specific task instead of loading the whole repository.
- Shared interfaces: humans use the CLI; agents use MCP; both rely on the same core services.
- Quality gates: CI and agents can check whether the repo and generated context are safe to trust.

## Install

```bash
npm install -g ai-first-cli
```

Requirements:

- Node.js 18+
- Git is recommended for freshness and change analysis

The CLI command is `af`. The legacy command name `ai-first` is also supported.

## 30-Second Start

```bash
af init
af verify ai-context
```

Then give your agent one of these:

- `ai-context/agent_brief.md` for a short operational brief.
- `ai-context/ai_context.md` for the unified repository context.
- `af context --task "add CLI command" --format markdown` for task-specific guidance.

Recommended agent prompt:

```text
Read ai-context/agent_brief.md first. Verify whether ai-context is fresh before relying on it. Then inspect the relevant source files before editing.
```

## Core Workflows

### For Humans

```bash
# Generate repository context
af init

# Check whether context is still fresh
af doctor context

# Audit generated context quality
af verify ai-context --json

# Get focused guidance for a change
af context --task "fix MCP tool" --format markdown

# Understand a topic or flow
af understand "auth login" --format json

# Run AI/CI quality gates
af doctor --ci --json
```

### For AI Agents

Use the smallest tool that answers the task:

| Need | Prefer |
|------|--------|
| Start a repository session | `get_project_brief` |
| Check whether generated context can be trusted | `is_context_fresh`, `verify_ai_context` |
| Understand a feature, flow, or topic | `understand_topic` |
| Add or change behavior | `get_context_for_task` |
| Work on one known file | `get_context_for_file` |
| Find symbols | `query_symbols` |
| Suggest tests | `suggest_tests` |
| Check merge/release readiness | `get_quality_gates` |

See the [AI Agent Playbook](./docs/guide/ai-agent-playbook.md) for the recommended call order and trust rules.

### For MCP Clients

Install a local MCP profile:

```bash
af install --list
af install --platform opencode
af install --platform codex
af install --platform claude-code
af install --platform cursor
af mcp doctor --json
```

Start the stdio server manually:

```bash
af mcp --root .
```

Start the Streamable HTTP server:

```bash
af mcp --transport http --host 127.0.0.1 --port 3847
```

HTTP mode supports bearer tokens:

```bash
AI_FIRST_MCP_TOKEN=secret af mcp --transport http --port 3847
```

MCP compatibility depends on the client. A tool works with AI-First when it supports local stdio MCP or Streamable HTTP MCP and can load the corresponding config. See the [MCP guide](./docs/guide/mcp.md).

## What Gets Generated

`af init` creates `ai-context/`, a repository context folder designed for humans, CI, and agents:

```text
ai-context/
├── agent_brief.md          # Short operational brief for AI agents
├── ai_context.md           # Unified readable context
├── context_manifest.json   # Freshness metadata, git state, hashes
├── project.json            # Machine-readable project summary
├── tech_stack.md           # Languages, frameworks, tools, evidence
├── architecture.md         # Repository structure and module roles
├── entrypoints.md          # CLI/API/app/test entrypoints
├── symbols.json            # Functions, classes, interfaces
├── dependencies.json       # Imports and dependency relationships
├── test-mapping.json       # Source-to-test links with reasons
├── security-audit.json     # Findings with severity/confidence/evidence
├── performance-analysis.json
└── dead-code.json
```

Generated context is useful, but it is not automatically authoritative. Use `af verify ai-context` or MCP `verify_ai_context` before relying on it.

## Commands

| Command | Purpose |
|---------|---------|
| `af init` | Generate `ai-context/` |
| `af verify ai-context` | Score generated context trust from 0 to 100 |
| `af doctor context` | Check context freshness |
| `af doctor --ci` | Run quality gates for CI and agents |
| `af context --task <task>` | Generate task-specific context |
| `af understand <topic>` | Combine source, tests, architecture, git, risks, and commands for a topic |
| `af index` | Build the SQLite symbol index |
| `af query` | Query indexed symbols/imports/exports |
| `af map` | Build repository graphs and semantic context |
| `af explore` | Explore module dependencies |
| `af git` | Analyze recent git activity |
| `af install --platform <client>` | Write MCP client config |
| `af mcp` | Start the MCP server |
| `af mcp doctor` | Diagnose MCP setup |

Most commands support `--root`, `--output`, and `--json` where relevant.

## Trust and Quality Gates

AI-First treats context as a generated artifact that can become stale. The trust workflow is:

```bash
af init
af verify ai-context --json
af doctor --ci --json
```

`af verify ai-context` checks:

- manifest presence
- context freshness
- required files
- package/config evidence for detected stack
- architecture specificity
- suspicious setup/env-var claims

`af doctor --ci` checks repository readiness:

- package bin validity
- build and test scripts
- TypeScript config
- CI workflow coverage
- docs build script
- evaluator setup
- semantic-release config
- npm publish workflow
- README/package version alignment
- MCP shell safety
- context trust

Use `af doctor --ci --run` when the environment is allowed to execute build/test/docs/evaluator commands.

## Supported Repositories

AI-First is optimized for multi-language application repositories. It currently includes detectors and parsers for common patterns across:

- TypeScript, JavaScript, Python, Go, Rust, Java, PHP, Ruby, C#, Kotlin, Swift, Apex
- Node CLI/API projects, React/Vue/Svelte frontends, Python web apps, Spring Boot, Laravel, Rails, Android/Kotlin, Salesforce DX
- Jest, Vitest, pytest, Mocha, RSpec and source-to-test mapping heuristics

Support varies by language. High-confidence findings include evidence; low-confidence findings should be verified against source before editing.

## What AI-First Is Not

- It is not a replacement for reading source files.
- It is not a security scanner with vulnerability guarantees.
- It is not a hosted code search product.
- It is not tied to one AI vendor or one agent UI.

It is a local context layer that makes repository understanding cheaper, faster, and easier to verify.

## Documentation

- [AI Agent Playbook](./docs/guide/ai-agent-playbook.md)
- [MCP Guide](./docs/guide/mcp.md)
- [Configuration Guide](./docs/guide/config.md)
- [RAG and Search Guide](./docs/guide/rag.md)
- [Git Blame Guide](./docs/guide/git-blame.md)
- [Specification](./docs/spec.md)
- [Changelog](./CHANGELOG.md)

## Development

```bash
git clone https://github.com/julianperezpesce/ai-first.git
cd ai-first
npm install
npm run build
npm test
```

Useful checks before handing off work:

```bash
npx tsc --noEmit
npm run docs:build
npm run build
npm test
af verify ai-context --json
af doctor --ci --json
```

## License

MIT © [Julian Perez Pesce](https://github.com/julianperezpesce)
