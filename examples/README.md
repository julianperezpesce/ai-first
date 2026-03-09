# Examples

This folder contains real-world usage examples showing how ai-first helps AI coding assistants understand different types of projects.

## Available Examples

| Example | Framework | Description |
|---------|-----------|-------------|
| [01-express-api](./01-express-api.md) | Express.js + TypeScript | REST API with MVC pattern |
| [02-react-app](./02-react-app.md) | React + TypeScript | Single Page Application |
| [03-python-django](./03-python-django.md) | Python + Django | Django REST Framework backend |

## How to Use These Examples

1. **Choose your stack** — Find the example closest to your project
2. **Run ai-first** — `npx ai-first init` on your project
3. **Compare outputs** — See what ai-first generates for your stack
4. **Prompt AI** — Use the example prompts to get better results

## Adding Your Own Example

Want to add an example for a different stack? PRs welcome!

```bash
# Create a new example file
touch examples/0X-your-framework.md

# Add your example following the template:
# 1. Project structure
# 2. Command run
# 3. Generated output (ai_context.md excerpt)
# 4. AI prompt example (before/after)
```

## Common Use Cases

### For Open-Source Contributors
```
# Understand a new codebase quickly
git clone <repo>
cd <repo>
npx ai-first init
# Read ai/ai_context.md
# Now you understand the project in 2 minutes
```

### For AI Coding Agent Users
```
# Before asking AI to help
npx ai-first init

# Then ask:
"Read ai/ai_context.md and help me add feature X"
```

### For Technical Leads
```
# Onboard new team members
npx ai-first init
# New hire reads ai/ai_context.md
# Instant project understanding
```
