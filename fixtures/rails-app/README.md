# Rails Blog API

A RESTful Rails API for a blog application with users, posts, and comments.

## Overview

This is a Rails 7.1 API-only application that provides endpoints for managing:
- **Users** - Blog authors and commenters
- **Posts** - Blog articles with title, content, and body
- **Comments** - User comments on posts

## Project Structure

```
rails-app/
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   └── api/
│   │       ├── users_controller.rb
│   │       ├── posts_controller.rb
│   │       └── comments_controller.rb
│   ├── models/
│   │   ├── user.rb
│   │   ├── post.rb
│   │   └── comment.rb
│   └── services/
│       ├── user_service.rb
│       └── post_service.rb
├── config/
│   ├── application.rb
│   ├── environment.rb
│   └── routes.rb
├── Gemfile
├── Rakefile
└── README.md
```

## Models

### User
- `name` - User's name
- `email` - Unique email address
- `active` - Active status flag
- Has many `posts` and `comments`

### Post
- `title` - Post title
- `content` - Short content/summary
- `body` - Full post body
- `published` - Publication status
- `published_at` - Publication timestamp
- Belongs to `user`, has many `comments`

### Comment
- `content` - Comment text
- `approved` - Moderation status
- `approved_at` - Approval timestamp
- Belongs to `post` and `user`

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all active users |
| GET | `/api/users/:id` | Get a specific user |
| POST | `/api/users` | Create a new user |
| PUT | `/api/users/:id` | Update a user |
| DELETE | `/api/users/:id` | Delete a user |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List all posts |
| GET | `/api/posts/:id` | Get a specific post |
| POST | `/api/posts` | Create a new post |
| PUT | `/api/posts/:id` | Update a post |
| DELETE | `/api/posts/:id` | Delete a post |
| POST | `/api/posts/:id/publish` | Publish a post |
| POST | `/api/posts/:id/unpublish` | Unpublish a post |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/:post_id/comments` | List comments for a post |
| GET | `/api/posts/:post_id/comments/:id` | Get a specific comment |
| POST | `/api/posts/:post_id/comments` | Create a comment |
| PUT | `/api/posts/:post_id/comments/:id` | Update a comment |
| DELETE | `/api/posts/:post_id/comments/:id` | Delete a comment |
| POST | `/api/posts/:post_id/comments/:id/approve` | Approve a comment |
| POST | `/api/posts/:post_id/comments/:id/reject` | Reject a comment |

## Services

### UserService
- `create_user(attributes)` - Create a new user
- `find_by_email(email)` - Find user by email
- `find_user(id)` - Find user by ID
- `update_user(id, attributes)` - Update user
- `delete_user(id)` - Delete user
- `active_users` - Get all active users
- `deactivate_user(id)` - Deactivate a user
- `activate_user(id)` - Activate a user

### PostService
- `create_post(attributes)` - Create a new post
- `find_post(id)` - Find post by ID
- `update_post(id, attributes)` - Update post
- `delete_post(id)` - Delete post
- `publish(id)` - Publish a post
- `unpublish(id)` - Unpublish a post
- `published_posts` - Get all published posts
- `draft_posts` - Get all draft posts
- `posts_by_user(user_id)` - Get posts by user
- `search(query)` - Search posts by title/content

## Setup

```bash
# Install dependencies
bundle install

# Setup database
rails db:create db:migrate

# Start server
rails server
```

## Testing

```bash
# Run tests
bundle exec rspec
```

## License

MIT License