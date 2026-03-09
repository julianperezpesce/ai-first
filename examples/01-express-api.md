# Example: Express.js REST API

This example demonstrates how ai-first analyzes an Express.js API project.

## Input: Project Structure

```
my-express-api/
├── src/
│   ├── index.ts          # Main entry point
│   ├── app.ts            # Express app setup
│   ├── config/
│   │   └── database.ts   # Database configuration
│   ├── controllers/
│   │   ├── userController.ts
│   │   └── orderController.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── Order.ts
│   ├── middleware/
│   │   ├── auth.ts       # JWT authentication
│   │   └── validate.ts   # Request validation
│   └── routes/
│       ├── userRoutes.ts
│       └── orderRoutes.ts
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

- **Pattern**: MVC (Model-View-Controller)
- **Languages**: TypeScript
- **Frameworks**: Express.js
- **Total Files**: 15

---

## Tech Stack

**Languages**: TypeScript

**Frameworks**: Express.js

**Package Managers**: npm

---

## Architecture

### Primary: MVC (Model-View-Controller)

### Key Modules

| Module | Responsibility |
|--------|----------------|
| `src/controllers` | Request handling |
| `src/models` | Data models |
| `src/middleware` | Auth & validation |
| `src/routes` | API routes |

---

## Key Entrypoints

### Server
- `src/index.ts` - Main entry point
- `src/app.ts` - Express app setup

---

## Notes for AI Assistants

1. Follow TypeScript strict mode
2. Use async/await for async operations
3. JWT auth in src/middleware/auth.ts
4. Request validation in src/middleware/validate.ts
```

### ai/symbols.json (excerpt)

```json
{
  "symbols": [
    {
      "name": "createUser",
      "type": "function",
      "file": "src/controllers/userController.ts",
      "line": 10,
      "exportType": "export"
    },
    {
      "name": "authenticate",
      "type": "function",
      "file": "src/middleware/auth.ts",
      "line": 5,
      "exportType": "export"
    }
  ]
}
```

## AI Prompt Example

**Without ai-first:**
```
You: "Add a password reset endpoint"
AI: *reads 200 files, guesses wrong, breaks auth flow*
```

**With ai-first:**
```
You: "Read ai/ai_context.md first. Then add a password reset endpoint to the Express API following the existing patterns."
AI: *reads 1 file, understands auth middleware, adds correct endpoint*
✅ Working code, follows conventions
```
