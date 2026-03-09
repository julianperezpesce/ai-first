# Example: React Application

This example demonstrates how ai-first analyzes a React single-page application.

## Input: Project Structure

```
my-react-app/
├── src/
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   └── Contact.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useFetch.ts
│   ├── services/
│   │   └── api.ts
│   └── types/
│       └── index.ts
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Run ai-first

```bash
npx ai-first init
```

## Output: Generated Files

### ai/ai_context.md

```markdown
# AI Context

> Repository context for AI assistants. Generated automatically.

---

## Quick Overview

- **Pattern**: Single Page Application (SPA)
- **Languages**: TypeScript
- **Frameworks**: React + Vite
- **Total Files**: 18

---

## Tech Stack

**Languages**: TypeScript, CSS

**Frameworks**: React 18, Vite

**Package Managers**: npm

---

## Architecture

### Primary: Component-Based SPA

### Key Modules

| Module | Responsibility |
|--------|----------------|
| `src/components` | Reusable UI components |
| `src/pages` | Route pages |
| `src/hooks` | Custom React hooks |
| `src/services` | API integration |

---

## Key Entrypoints

### Application
- `src/main.tsx` - React DOM render
- `src/App.tsx` - Root component

---

## Notes for AI Assistants

1. Use functional components with hooks
2. Follow React 18 patterns
3. CSS modules or Tailwind for styling
4. TypeScript strict mode
```

## AI Prompt Example

**Without ai-first:**
```
You: "Add a login form"
AI: *reads 200 files, doesn't know component patterns*
```

**With ai-first:**
```
You: "Read ai/ai_context.md first. Then add a login form following the existing component patterns."
AI: *understands component structure, creates consistent form*
✅ Working code, follows patterns
```
