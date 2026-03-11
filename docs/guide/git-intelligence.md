# Git Intelligence

AI-First can analyze your git repository to provide AI agents with context about recent activity, helping them prioritize relevant files and understand what's been recently changed.

## Why Git Intelligence?

When working with AI coding assistants, knowing which files have been recently modified helps the AI:

- **Prioritize review** - Focus on recently changed files when suggesting modifications
- **Understand context** - Know which features/flows are actively being developed
- **Avoid conflicts** - Identify files that were recently modified to prevent overwrite
- **Trace changes** - See commit patterns and activity frequency

## How It Works

Git Intelligence analyzes your git history to generate metadata about recent repository activity:

1. **Detects git repository** - Checks if the project is a git repository
2. **Analyzes recent commits** - Extracts commit data (default: last 50 commits, last 30 days)
3. **Maps to features/flows** - Correlates changed files with detected features and flows
4. **Generates metadata** - Outputs JSON files for AI consumption

## Generated Files

When you run `ai-first git`, the following files are created in `ai/git/`:

### recent-files.json

List of recently changed files:

```json
[
  "src/auth/loginController.ts",
  "src/auth/sessionService.ts",
  "src/payments/checkoutFlow.ts"
]
```

### recent-features.json

Features that have been recently modified:

```json
["auth", "payments"]
```

### recent-flows.json

Flows that have been recently modified:

```json
["login", "checkout"]
```

### commit-activity.json

Detailed commit frequency data:

```json
{
  "totalCommits": 50,
  "dateRange": {
    "start": "2026-02-01",
    "end": "2026-03-10"
  },
  "files": {
    "src/auth/loginController.ts": 5,
    "src/auth/sessionService.ts": 3
  },
  "features": {
    "auth": 8,
    "payments": 12
  },
  "flows": {
    "login": 4,
    "checkout": 7
  }
}
```

## Usage

### CLI Command

```bash
# Analyze git activity
ai-first git

# Analyze with more commits
ai-first git --limit 100

# Show detailed activity
ai-first git --activity

# Output as JSON
ai-first git --json
```

### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--root` | `-r` | Root directory (default: current) |
| `--limit` | `-n` | Number of commits (default: 50) |
| `--activity` | `-a` | Show detailed activity |
| `--json` | | Output as JSON |
| `--help` | `-h` | Show help |

### Programmatic Usage

```typescript
import { 
  detectGitRepository,
  getRecentCommits,
  analyzeGitActivity,
  generateGitContext 
} from 'ai-first';

// Check if git repo
if (detectGitRepository('/path/to/project')) {
  // Get recent commits
  const commits = getRecentCommits('/path/to/project');
  
  // Analyze activity
  const activity = analyzeGitActivity('/path/to/project');
  
  // Generate context files
  const context = generateGitContext('/path/to/project');
}
```

## API Reference

### detectGitRepository(rootDir: string): boolean

Checks if a directory is a git repository.

### getRecentCommits(rootDir: string, limit?: number): GitCommit[]

Returns recent commits with file changes.

### extractChangedFiles(commits: GitCommit[]): RecentFile[]

Extracts and counts changed files from commits.

### mapFilesToFeatures(rootDir: string, files: string[]): string[]

Maps changed files to detected features.

### mapFilesToFlows(rootDir: string, files: string[]): string[]

Maps changed files to detected flows.

### analyzeGitActivity(rootDir: string): GitActivity | null

Analyzes git activity and returns aggregated data.

### generateGitContext(rootDir: string, aiDir?: string): GitContext

Generates all git context files in `ai/git/`.

## Integration with AI Context

Git intelligence integrates with the AI context system:

1. Run `ai-first init` to generate features and flows
2. Run `ai-first git` to analyze git activity
3. AI agents can read `ai/git/` files to understand recent changes

This provides a complete picture of both your codebase structure and its development activity.
