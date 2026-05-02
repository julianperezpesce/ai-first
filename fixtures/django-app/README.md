# Django Blog API

A Django REST API for a blog application with user authentication, posts, comments, and categories.

## Features

- **User Management**: Registration, authentication, profiles, follow system
- **Blog Posts**: Create, read, update, delete posts with publishing
- **Comments**: Comment on posts
- **Categories**: Organize posts by categories
- **REST API**: Full REST API with Django REST Framework
- **Authentication**: Token and session authentication

## Project Structure

```
django-app/
├── django_app/          # Main project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── blog/                # Blog application
│   ├── models.py        # Post, Comment, Category
│   ├── views.py         # API ViewSets
│   ├── serializers.py   # DRF Serializers
│   └── urls.py
├── users/               # Users application
│   ├── models.py        # UserProfile, Follow
│   ├── views.py         # User API ViewSets
│   └── serializers.py
└── manage.py
```

## Models

### Blog App
- **Post**: Blog posts with title, content, author, published status
- **Comment**: Comments on posts
- **Category**: Categories for organizing posts

### Users App
- **UserProfile**: Extended user profile with bio, location, etc.
- **Follow**: Follow relationships between users

## API Endpoints

### Blog
- `GET/POST /api/blog/posts/` - List/Create posts
- `GET/PUT/DELETE /api/blog/posts/<id>/` - Retrieve/Update/Delete post
- `POST /api/blog/posts/<id>/publish/` - Publish a post
- `GET /api/blog/posts/published/` - List published posts
- `GET /api/blog/posts/my_posts/` - List current user's posts
- `GET/POST /api/blog/comments/` - List/Create comments
- `GET/POST /api/blog/categories/` - List/Create categories

### Users
- `POST /api/users/users/` - Register new user
- `GET /api/users/users/me/` - Get current user
- `PUT /api/users/users/update_profile/` - Update profile
- `POST /api/users/users/change_password/` - Change password
- `POST /api/users/users/<id>/follow/` - Follow user
- `POST /api/users/users/<id>/unfollow/` - Unfollow user

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

## Testing with ai-first

```bash
# Generate AI context
ai-first init --root django-app

# Generate repository map
ai-first map --root django-app

# Generate SQLite index
ai-first index --root django-app
```
