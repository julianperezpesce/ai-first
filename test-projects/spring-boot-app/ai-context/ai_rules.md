# AI Rules

> Guidelines for AI assistants working on this project

---

## Guidelines

- Language: Use Markdown, Java
- Frameworks: Spring Boot
- Architecture: Follow API Server pattern
- File naming: PascalCase
- Source directory: src/
- Main entry: src/main/java/com/example/demo/DemoApplication.java

## Patterns

- Layer structure: 

## Constraints

- Always use semicolons

---

## Quick Reference

| Category | Value |
|----------|-------|
| Language | Markdown, Java |
| Framework | Spring Boot |
| Architecture | API Server |
| Naming | PascalCase |
| Indentation | unknown |

---

## Best Practices

1. Follow the established naming conventions
2. Keep functions small and focused
3. Write tests for new features
4. Use descriptive variable names
5. Keep the architecture consistent
6. Document complex logic
7. Review code before committing


---

## Framework Instructions

### Spring Boot

- **Annotations**: Use Spring annotations for configuration:
  - `@SpringBootApplication` for main application class
  - `@RestController` for REST controllers
  - `@Service` for service layer
  - `@Repository` for data access layer
  - `@Component` for generic Spring beans
- **Dependency Injection**: Use `@Autowired` or constructor injection
- **Configuration**: Use `application.properties` or `application.yml`
- **Profiles**: Use profiles for environment-specific configuration
- **JPA**: Use Spring Data JPA for database operations:
  - Extend `JpaRepository` interface
  - Use method naming conventions for queries
- **Security**: Use Spring Security with `@EnableWebSecurity`
- **Testing**: Use `@SpringBootTest` for integration tests
- **Actuator**: Use Spring Boot Actuator for monitoring and management
- **Validation**: Use `@Valid` and Bean Validation annotations
- **Exception Handling**: Use `@ControllerAdvice` for global exception handling
- **Properties**: Use `@Value` or `@ConfigurationProperties` for external configuration
- **Build**: Use Maven (`mvn spring-boot:run`) or Gradle (`./gradlew bootRun`)


---

## API Contracts

### GET /api/comments/api/comments

- **Handler**: `src/main/java/com/example/demo/controllers/CommentController.java#getCommentById`
- **Description**: Spring GET endpoint
- **Response**: `Comment`

### GET /api/comments/post/{postId}

- **Handler**: `src/main/java/com/example/demo/controllers/CommentController.java#createComment`
- **Description**: Spring GET endpoint
- **Request**: `CommentCreat`
- **Response**: `Comment`

### GET /api/comments/user/{userId}

- **Handler**: `src/main/java/com/example/demo/controllers/CommentController.java#createComment`
- **Description**: Spring GET endpoint
- **Request**: `CommentCreateRequest`
- **Response**: `Comment`

### GET /api/comments/{id}

- **Handler**: `src/main/java/com/example/demo/controllers/CommentController.java#getCommentById`
- **Description**: Spring GET endpoint
- **Response**: `Comment`

### PUT /api/comments/{id}

- **Handler**: `src/main/java/com/example/demo/controllers/CommentController.java#updateComment`
- **Description**: Spring PUT endpoint
- **Request**: `CommentUpdateRequest`
- **Response**: `Comment`

### DELETE /api/comments/{id}

- **Handler**: `src/main/java/com/example/demo/controllers/CommentController.java#deleteComment`
- **Description**: Spring DELETE endpoint
- **Response**: `Void`

### GET /api/posts/api/posts

- **Handler**: `src/main/java/com/example/demo/controllers/PostController.java#getPostById`
- **Description**: Spring GET endpoint
- **Response**: `Post`

### GET /api/posts/published

- **Handler**: `src/main/java/com/example/demo/controllers/PostController.java#createPost`
- **Description**: Spring GET endpoint
- **Request**: `PostCreateRequest`
- **Response**: `Post`

### GET /api/posts/user/{userId}

- **Handler**: `src/main/java/com/example/demo/controllers/PostController.java#createPost`
- **Description**: Spring GET endpoint
- **Request**: `PostCreateRequest`
- **Response**: `Post`

### GET /api/posts/{id}

- **Handler**: `src/main/java/com/example/demo/controllers/PostController.java#getPostById`
- **Description**: Spring GET endpoint
- **Response**: `Post`

### PUT /api/posts/{id}

- **Handler**: `src/main/java/com/example/demo/controllers/PostController.java#updatePost`
- **Description**: Spring PUT endpoint
- **Request**: `PostUpdateRequest`
- **Response**: `Post`

### DELETE /api/posts/{id}

- **Handler**: `src/main/java/com/example/demo/controllers/PostController.java#deletePost`
- **Description**: Spring DELETE endpoint
- **Response**: `Void`

### POST /api/posts/{id}/publish

- **Handler**: `src/main/java/com/example/demo/controllers/PostController.java#publishPost`
- **Description**: Spring POST endpoint
- **Response**: `Post`

### GET /api/users/api/users

- **Handler**: `src/main/java/com/example/demo/controllers/UserController.java#getUserById`
- **Description**: Spring GET endpoint
- **Response**: `User`

### GET /api/users/email/{email}

- **Handler**: `src/main/java/com/example/demo/controllers/UserController.java#getUserByEmail`
- **Description**: Spring GET endpoint
- **Request**: `UserCreateRequest`
- **Response**: `User`

### GET /api/users/{id}

- **Handler**: `src/main/java/com/example/demo/controllers/UserController.java#getUserById`
- **Description**: Spring GET endpoint
- **Response**: `User`

### PUT /api/users/{id}

- **Handler**: `src/main/java/com/example/demo/controllers/UserController.java#updateUser`
- **Description**: Spring PUT endpoint
- **Request**: `UserUpdateRequest`
- **Response**: `User`

### DELETE /api/users/{id}

- **Handler**: `src/main/java/com/example/demo/controllers/UserController.java#deleteUser`
- **Description**: Spring DELETE endpoint
- **Response**: `Void`

---
*Generated by ai-first*

---

*Generated by ai-first*
