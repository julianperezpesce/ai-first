# Installation

AI-First can be installed in several ways depending on your needs.

## Global Installation (Recommended)

```bash
npm install -g ai-first
```

Then run:

```bash
ai-first --help
```

## Without Installation (npx)

```bash
# Initialize
npx ai-first init

# Index
npx ai-first index

# Doctor check
npx ai-first doctor
```

## Development Mode

```bash
# Clone the repository
git clone https://github.com/julianperezpesce/ai-first.git
cd ai-first

# Install dependencies
npm install

# Build
npm run build

# Link for local testing
npm link

# Run
ai-first --help
```

## Requirements

- **Node.js** 18+ 
- **npm** 8+ (comes with Node.js)

### Optional Dependencies

For semantic search with embeddings:

```bash
npm install @xenova/transformers
```

For running AI-powered evaluation tests (contributors only — requires GitHub access to the private evaluator repo):

```bash
# Clone and install the evaluator
git clone git@github.com:julianperezpesce/ai-first-evaluator.git
cd ai-first-evaluator
npm install && npm run build
```

## Update AI-First

```bash
# If installed globally
npm update -g ai-first

# Check version
ai-first --version
```

## Uninstall

```bash
npm uninstall -g ai-first
```

## Troubleshooting

### Permission Errors

If you get permission errors on macOS/Linux:

```bash
sudo npm install -g ai-first
```

Or use a version manager like [nvm](https://github.com/nvm-sh/nvm).

### Path Issues

Make sure npm global bin is in your PATH:

```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$(npm root -g)/bin:$PATH"
```
