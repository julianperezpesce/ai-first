# FastAPI Blog

A modern, fast blog API built with FastAPI, SQLAlchemy, and Pydantic.

## Features

- **High Performance**: Built on FastAPI (one of the fastest Python frameworks)
- **Automatic API Documentation**: Interactive docs at `/docs` (Swagger UI) and `/redoc` (ReDoc)
- **Type Safety**: Full type hints with Pydantic models
- **Authentication**: JWT token-based authentication
- **Database**: SQLAlchemy ORM with SQLite (easily switchable to PostgreSQL)
- **Modern Python**: Python 3.9+ with async support

## Project Structure

```
fastapi-app/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── dependencies.py      # Authentication & dependencies
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Authentication endpoints
│       └── posts.py         # Blog post endpoints
├── tests/
└── requirements.txt
```

## Models

### User
- Authentication with JWT tokens
- Profile information (bio, full_name)
- Relationships: posts, comments

### Post
- Blog posts with title, content, slug
- Publishing workflow (draft → published)
- Categories and tags
- View counter

### Comment
- Nested comments (replies)
- Approval system

### Category
- Post categorization
- URL-friendly slugs

### Tag
- Post tagging system
- Many-to-many relationship with posts

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/token` - Login and get token
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/me` - Update profile
- `POST /api/v1/auth/change-password` - Change password

### Posts
- `GET /api/v1/posts/` - List posts (with filters)
- `POST /api/v1/posts/` - Create post
- `GET /api/v1/posts/{slug}` - Get single post
- `PUT /api/v1/posts/{post_id}` - Update post
- `DELETE /api/v1/posts/{post_id}` - Delete post
- `POST /api/v1/posts/{post_id}/publish` - Publish post
- `GET /api/v1/posts/my/posts` - Get my posts

### Filters Available
- `category_slug` - Filter by category
- `tag_slug` - Filter by tag
- `search` - Search in title/content
- `published_only` - Show only published (default: true)

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python -m app.main

# Or using uvicorn directly
uvicorn app.main:app --reload

# Access API documentation
# OpenAPI (Swagger UI): http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

## Testing with ai-first

```bash
# Generate AI context
ai-first init --root fastapi-app

# Generate repository map
ai-first map --root fastapi-app

# Generate SQLite index
ai-first index --root fastapi-app
```

## Key Features

- **Pydantic v2**: Latest version with better performance
- **SQLAlchemy 2.0**: Modern ORM syntax
- **Dependency Injection**: FastAPI's powerful DI system
- **Automatic Validation**: Request/response validation out of the box
- **Type Hints**: Full IDE support with autocomplete
