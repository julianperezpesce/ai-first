# Flask Blog

A simple but complete blog application built with Flask.

## Features

- **User Authentication**: Registration, login, logout with Flask-Login
- **Blog Posts**: Create, edit, delete posts with publishing workflow
- **Categories & Tags**: Organize posts
- **Comments**: Add comments to posts
- **Search**: Full-text search
- **Responsive Design**: Bootstrap 5
- **REST API**: JSON API endpoints

## Project Structure

```
flask-app/
├── app/
│   ├── __init__.py          # Application factory
│   ├── models.py            # Database models
│   ├── config.py            # Configuration
│   ├── main/                # Main blueprint
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── auth/                # Auth blueprint
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   └── forms.py
│   ├── blog/                # Blog blueprint
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   └── forms.py
│   └── api/                 # API blueprint
│       ├── __init__.py
│       └── routes.py
├── migrations/              # Database migrations
└── requirements.txt
```

## Models

### User
- Authentication with Flask-Login
- Profile information
- One-to-many: posts, comments

### Post
- Title, content, slug, summary
- Publishing workflow (draft → published)
- Categories and tags
- View counter
- One-to-many: comments

### Comment
- Content
- Approval system
- Replies (self-referential)

### Category
- Name, slug, description
- One-to-many: posts

### Tag
- Name, slug
- Many-to-many: posts

## Routes

### Main
- `/` - Home page with posts
- `/about` - About page
- `/post/<slug>` - Single post
- `/category/<slug>` - Posts by category
- `/tag/<slug>` - Posts by tag
- `/search?q=query` - Search posts

### Auth
- `/auth/login` - Login
- `/auth/register` - Registration
- `/auth/logout` - Logout
- `/auth/profile` - User profile

### Blog
- `/blog/create` - Create post
- `/blog/<slug>/edit` - Edit post
- `/blog/<slug>/delete` - Delete post
- `/blog/<slug>/comment` - Add comment

### API
- `/api/v1/posts` - List posts (JSON)
- `/api/v1/posts/<slug>` - Single post (JSON)
- `/api/v1/categories` - List categories (JSON)
- `/api/v1/tags` - List tags (JSON)

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export FLASK_APP=run.py
export FLASK_ENV=development

# Initialize database
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Run the application
flask run

# Or
python run.py
```

## Testing with ai-first

```bash
# Generate AI context
ai-first init --root flask-app

# Generate repository map
ai-first map --root flask-app

# Generate SQLite index
ai-first index --root flask-app
```
