# Repository Map
## README.md
  - README.md

## ai
  - ai_context.md
  - ai_rules.md
  - architecture.md
  - cache.json
  - comment.json
  - conventions.md
  - dependencies.json
  - entrypoints.md
  - files.json
  - index-state.json
  - knowledge-graph.json
  - module-graph.json
  - modules.json
  - post.json
  - PostController.json
  - project.json
  - repo_map.json
  - repo_map.md
  - repo-map.json
  - schema.json
  - src.json
  - summary.md
  - symbol-graph.json
  - symbol-references.json
  - symbols.json
  - tech_stack.md
  - tools.json
  - user.json
  - UserController.json

## src
  - Comment.java
  - CommentController.java
  - CommentRepository.java
  - DemoApplication.java
  - Post.java
  - PostController.java
  - PostRepository.java
  - PostService.java
  - User.java
  - UserController.java
  - UserRepository.java
  - UserService.java



# Repository Structure (Tree View)
├── ai/
│   ├── context/
│   │   ├── features/
│   │   │   └── src.json
│   │   └── flows/
│   │       ├── PostController.json
│   │       ├── UserController.json
│   │       ├── comment.json
│   │       ├── post.json
│   │       └── user.json
│   ├── graph/
│   │   ├── knowledge-graph.json
│   │   ├── module-graph.json
│   │   ├── symbol-graph.json
│   │   └── symbol-references.json
│   ├── ai_context.md
│   ├── ai_rules.md
│   ├── architecture.md
│   ├── cache.json
│   ├── conventions.md
│   ├── dependencies.json
│   ├── entrypoints.md
│   ├── files.json
│   ├── index-state.json
│   ├── modules.json
│   ├── project.json
│   ├── repo-map.json
│   ├── repo_map.json
│   ├── repo_map.md
│   ├── schema.json
│   ├── summary.md
│   ├── symbols.json
│   ├── tech_stack.md
│   └── tools.json
├── src/
│   └── main/
│       └── java/
│           └── com/
│               └── example/
│                   └── demo/
│                       ├── controllers/
│                       │   ├── CommentController.java
│                       │   ├── PostController.java
│                       │   └── UserController.java
│                       ├── models/
│                       │   ├── Comment.java
│                       │   ├── Post.java
│                       │   └── User.java
│                       ├── repositories/
│                       │   ├── CommentRepository.java
│                       │   ├── PostRepository.java
│                       │   └── UserRepository.java
│                       ├── services/
│                       │   ├── PostService.java
│                       │   └── UserService.java
│                       └── DemoApplication.java
└── README.md
