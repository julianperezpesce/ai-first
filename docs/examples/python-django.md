# Example: Python Django

This example demonstrates how ai-first analyzes a Django web application.

## Input: Project Structure

```
my-django-app/
├── myproject/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── myapp/
│   ├── __init__.py
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── admin.py
├── manage.py
└── requirements.txt
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

- **Pattern**: Django MVC
- **Languages**: Python
- **Frameworks**: Django, Django REST Framework
- **Total Files**: 12

---

## Tech Stack

**Languages**: Python

**Frameworks**: Django 4.x, Django REST Framework

**Package Managers**: pip

---

## Architecture

### Primary: Django MVC

### Key Modules

| Module | Responsibility |
|--------|----------------|
| `myproject/` | Django project settings |
| `myapp/models.py` | Database models |
| `myapp/views.py` | Business logic |
| `myapp/serializers.py` | DRF serializers |

---

## Key Entrypoints

### Server
- `manage.py` - Django management command
- `myproject/wsgi.py` - WSGI entry point

---

## Notes for AI Assistants

1. Follow Django best practices
2. Use Django ORM for database queries
3. REST APIs use Django REST Framework
4. Environment variables in settings
```

## AI Prompt Example

**Without ai-first:**
```
You: "Add a user profile endpoint"
AI: *reads 200 files, doesn't know Django patterns*
```

**With ai-first:**
```
You: "Read ai/ai_context.md first. Then add a user profile endpoint following Django REST Framework patterns."
AI: *understands Django structure, creates proper endpoint*
✅ Working code, follows conventions
```
