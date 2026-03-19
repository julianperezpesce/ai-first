# Spring Boot REST API Blog Application

A simple blog application built with Spring Boot that demonstrates a RESTful API with users, posts, and comments.

## Features

- **User Management**: Create, read, update, and delete users
- **Post Management**: Create posts, publish them, and manage content
- **Comment System**: Users can comment on posts

## Technology Stack

- **Java 17+**
- **Spring Boot 3.2.x**
- **Spring Data JPA**
- **H2 Database** (in-memory)
- **Lombok**

## Project Structure

```
src/main/java/com/example/demo/
├── DemoApplication.java          # Main application entry point
├── models/                       # JPA Entities
│   ├── User.java                 # User entity with posts and comments
│   ├── Post.java                 # Post entity with comments
│   └── Comment.java              # Comment entity
├── controllers/                  # REST Controllers
│   ├── UserController.java       # User CRUD endpoints
│   ├── PostController.java       # Post CRUD endpoints
│   └── CommentController.java    # Comment CRUD endpoints
├── services/                     # Business Logic
│   ├── UserService.java          # User operations
│   └── PostService.java          # Post operations
├── repositories/                 # Data Access
│   ├── UserRepository.java
│   ├── PostRepository.java
│   └── CommentRepository.java
└── DTOs/                         # Data Transfer Objects
```

## API Endpoints

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/users` | Get all users |
| GET    | `/api/users/{id}` | Get user by ID |
| GET    | `/api/users/email/{email}` | Get user by email |
| POST   | `/api/users` | Create a new user |
| PUT    | `/api/users/{id}` | Update a user |
| DELETE | `/api/users/{id}` | Delete a user |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/posts` | Get all posts |
| GET    | `/api/posts/{id}` | Get post by ID |
| GET    | `/api/posts/user/{userId}` | Get posts by user |
| GET    | `/api/posts/published` | Get published posts |
| POST   | `/api/posts` | Create a new post |
| PUT    | `/api/posts/{id}` | Update a post |
| POST   | `/api/posts/{id}/publish` | Publish a post |
| DELETE | `/api/posts/{id}` | Delete a post |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/comments` | Get all comments |
| GET    | `/api/comments/{id}` | Get comment by ID |
| GET    | `/api/comments/post/{postId}` | Get comments by post |
| GET    | `/api/comments/user/{userId}` | Get comments by user |
| POST   | `/api/comments` | Create a new comment |
| PUT    | `/api/comments/{id}` | Update a comment |
| DELETE | `/api/comments/{id}` | Delete a comment |

## Running the Application

```bash
./mvnw spring-boot:run
```

The application will start on `http://localhost:8080`.

## H2 Console

Access the H2 database console at: `http://localhost:8080/h2-console`

- JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`
- Password: (empty)

## Example Requests

### Create a User

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### Create a Post

```bash
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Post", "content": "Hello World!", "userId": 1}'
```

### Publish a Post

```bash
curl -X POST http://localhost:8080/api/posts/1/publish
```

## License

This project is for educational purposes.