# Example: React + TypeScript Application

This example demonstrates how ai-first analyzes a React frontend project.

## Input: Project Structure

```
my-react-app/
├── src/
│   ├── index.tsx          # React DOM entry
│   ├── App.tsx            # Main component
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Profile.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useFetch.ts
│   ├── services/
│   │   ├── api.ts         # Axios instance
│   │   └── auth.ts        # Auth API calls
│   ├── store/
│   │   └── index.ts       # Zustand store
│   └── types/
│       └── index.ts
├── package.json
└── tsconfig.json
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

- **Pattern**: SPA (Single Page Application)
- **Languages**: TypeScript
- **Frameworks**: React
- **Total Files**: 18

---

## Tech Stack

**Languages**: TypeScript

**Frameworks**: React

**Package Managers**: npm

---

## Architecture

### Primary: SPA (Single Page Application)

### Key Modules

| Module | Responsibility |
|--------|----------------|
| `src/components` | Reusable UI components |
| `src/pages` | Route pages |
| `src/hooks` | Custom React hooks |
| `src/services` | API calls |
| `src/store` | State management |

---

## Key Entrypoints

### Client
- `src/index.tsx` - React DOM entry
- `src/App.tsx` - Main component

---

## Notes for AI Assistants

1. Use functional components with hooks
2. Follow component naming: PascalCase
3. State management: Zustand
4. API calls: Axios in src/services/
5. CSS: Use existing styling approach
```

### ai/tech_stack.md

```markdown
# Technology Stack

**Languages**: TypeScript

**Frameworks**: React

**Package Managers**: npm

## Key Libraries
- axios (HTTP client)
- zustand (state management)

## Development Tools
- Vite (build tool)
- TypeScript
```

## AI Prompt Example

**Without ai-first:**
```
You: "Add a dark mode toggle"
AI: *reads 500 files, doesn't know state management setup*
Result: Wrong approach, conflicts with existing code
```

**With ai-first:**
```
You: "Read ai/ai_context.md. Add a dark mode toggle using Zustand store following existing patterns."
AI: *reads context, uses Zustand, follows component patterns*
✅ Working toggle, integrated with store
```
