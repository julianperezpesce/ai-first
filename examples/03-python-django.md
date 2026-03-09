# Example: Python Django Backend

This example demonstrates how ai-first analyzes a Django Python project.

## Input: Project Structure

```
my-django-app/
├── myproject/
│   ├── __init__.py
│   ├── settings.py       # Django settings
│   ├── urls.py           # URL routing
│   └── wsgi.py
├── apps/
│   ├── users/
│   │   ├── models.py     # User models
│   │   ├── views.py      # API views
│   │   ├── serializers.py # DRF serializers
│   │   └── urls.py       # App URLs
│   ├── products/
│   │   ├── models.py     # Product models
│   │   ├── views.py
│   │   └── serializers.py
│   └── orders/
│       ├── models.py
│       └── views.py
├── core/
│   ├── middleware.py
│   └── permissions.py
├── requirements.txt
└── manage.py
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

- **Pattern**: Django MTV (Model-Template-View)
- **Languages**: Python
- **Frameworks**: Django, Django REST Framework
- **Total Files**: 22

---

## Tech Stack

**Languages**: Python

**Frameworks**: Django, Django REST Framework

**Package Managers**: pip

---

## Architecture

### Primary: Django MTV (Model-Template-View)

### Key Modules

| Module | Responsibility |
|--------|----------------|
| `apps/users` | User management |
| `apps/products` | Product catalog |
| `apps/orders` | Order processing |
| `core` | Middleware & permissions |

---

## Key Entrypoints

### Server
- `manage.py` - Django management
- `myproject/settings.py` - Settings

---

## Notes for AI Assistants

1. Use Django ORM for database operations
2. Follow Django REST Framework patterns
3. Custom permissions in core/permissions.py
4. Use Django's built-in auth
```

### ai/conventions.md

```markdown
# Coding Conventions

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Models | PascalCase | `class User(models.Model):` |
| Views | PascalCase | `class UserViewSet(...):` |
| URLs | snake_case | `user_detail` |
| Functions | snake_case | `get_user_by_id()` |

## Structure Conventions
- Models in apps/<name>/models.py
- Views in apps/<name>/views.py
- Serializers in apps/<name>/serializers.py
- URL configs in apps/<name>/urls.py
```

## AI Prompt Example

**Without ai-first:**
```
You: "Add a product search API endpoint"
AI: *doesn't know DRF patterns, wrong file structure*
Result: Broken code, wrong patterns
```

**With ai-first:**
```
You: "Read ai/ai_context.md. Add a product search endpoint using Django REST Framework following existing patterns."
AI: *understands DRF, uses correct serializers, proper URLs*
✅ Working endpoint, follows Django conventions
```
