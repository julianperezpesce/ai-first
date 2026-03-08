# Contributing to ai-first

Thank you for your interest in contributing!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/julianperezpesce/ai-first.git
cd ai-first

# Install dependencies
npm install

# Build
npm run build

# Run
npm run run
# or
node dist/commands/ai-first.js
```

## Project Structure

```
ai-first/
├── src/
│   ├── analyzers/        # Analysis modules
│   │   ├── architecture.ts
│   │   ├── conventions.ts
│   │   ├── entrypoints.ts
│   │   └── techStack.ts
│   ├── commands/        # CLI commands
│   │   └── ai-first.ts
│   ├── core/            # Core functionality
│   │   ├── repoMapper.ts
│   │   └── repoScanner.ts
│   └── utils/           # Utilities
│       └── fileUtils.ts
├── dist/                # Compiled JavaScript
├── package.json
└── tsconfig.json
```

## Adding New Analyzers

To add a new analyzer:

1. Create a new file in `src/analyzers/`
2. Export functions for detection and file generation
3. Import and use in `src/commands/ai-first.ts`

Example:
```typescript
// src/analyzers/myAnalyzer.ts
import { FileInfo } from "../core/repoScanner.js";

export interface MyAnalysis {
  // Define your output type
}

export function analyzeMyFeature(files: FileInfo[]): MyAnalysis {
  // Your analysis logic
  return { /* ... */ };
}

export function generateMyFeatureFile(analysis: MyAnalysis): string {
  return "# My Analysis\n" + /* ... */;
}
```

## Running Tests

Currently there are no tests. Contributions with tests are welcome!

## Publishing to npm

```bash
# Update version in package.json
npm version patch

# Publish
npm publish
```

## License

MIT
