# Laravel Blog API

A Laravel REST API for a blog application with user authentication, posts, comments, and categories.

## Features

- **User Management**: Authentication with Laravel Sanctum, user profiles
- **Blog Posts**: CRUD operations with publishing workflow
- **Comments**: Nested comments on posts
- **Categories**: Organize posts by categories
- **REST API**: Full REST API with Laravel
- **Authentication**: Token-based authentication

## Project Structure

```
laravel-app/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/         # API Controllers
│   └── Models/              # Eloquent Models
│       ├── Post.php
│       ├── Comment.php
│       ├── Category.php
│       └── User.php
├── routes/
│   └── api.php              # API Routes
├── config/                  # Configuration
└── composer.json
```

## Models

### Post
- title, content, slug, published status
- Relationships: user, comments, categories
- Scopes: published(), drafts()
- Methods: publish(), unpublish()

### Comment
- content, post_id, user_id, parent_id (for nested)
- Relationships: post, user, parent

### Category
- name, slug, description
- Relationships: posts

### User
- name, email, bio, avatar, social links
- Relationships: posts, comments
- Methods: isAdmin(), publishedPostsCount()

## API Endpoints

### Posts
- `GET /api/posts` - List posts (filter by published, category, search)
- `POST /api/posts` - Create post
- `GET /api/posts/{post}` - Get single post
- `PUT /api/posts/{post}` - Update post
- `DELETE /api/posts/{post}` - Delete post
- `POST /api/posts/{post}/publish` - Publish post
- `POST /api/posts/{post}/unpublish` - Unpublish post
- `GET /api/my-posts` - Get current user's posts

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/{category}` - Get category
- `GET /api/categories/{category}/posts` - Get posts in category

### Comments
- `GET /api/posts/{post}/comments` - Get post comments
- `POST /api/comments` - Create comment
- `DELETE /api/comments/{comment}` - Delete comment

## Setup

```bash
# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Run server
php artisan serve
```

## Testing with ai-first

```bash
# Generate AI context
ai-first init --root laravel-app

# Generate repository map
ai-first map --root laravel-app

# Generate SQLite index
ai-first index --root laravel-app
```
