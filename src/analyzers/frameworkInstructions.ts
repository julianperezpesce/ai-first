import { FileInfo } from "../core/repoScanner.js";
import { detectTechStack } from "./techStack.js";

export interface FrameworkInstructionsResult {
  instructions: string;
  frameworks: string[];
}

export function detectFrameworkFromFiles(files: FileInfo[], rootDir: string): string[] {
  const techStack = detectTechStack(files, rootDir);
  const frameworks: string[] = [];

  const supportedFrameworks = [
    "Django",
    "Ruby on Rails",
    "Laravel",
    "Express.js",
    "NestJS",
    "Spring Boot",
    "FastAPI",
    "Flask",
  ];

  for (const framework of techStack.frameworks) {
    if (framework === "Rails" || framework === "Ruby on Rails") {
      if (!frameworks.includes("Rails")) {
        frameworks.push("Rails");
      }
    } else if (supportedFrameworks.includes(framework)) {
      if (!frameworks.includes(framework)) {
        frameworks.push(framework);
      }
    }
  }

  return frameworks;
}

function generateDjangoInstructions(): string {
  return `### Django

- **Management Commands**: Use \`python manage.py <command>\` for all Django operations
- **Migrations**: Always create and apply migrations in sequence:
  \`\`\`bash
  python manage.py makemigrations
  python manage.py migrate
  \`\`\`
- **Models**: Define models in \`models.py\`, inherit from \`django.db.models.Model\`
- **Views**: Use class-based views (CBV) for better reusability:
  - \`ListView\`, \`DetailView\`, \`CreateView\`, \`UpdateView\`, \`DeleteView\`
- **URLs**: Define URL patterns in \`urls.py\` using \`path()\` or \`re_path()\`
- **Templates**: Store templates in \`templates/\` directory, use Django template language (DTL)
- **Admin**: Register models in \`admin.py\` for automatic admin interface
- **Forms**: Use Django forms or ModelForms for validation
- **API**: Use Django REST Framework (DRF) for APIs:
  - ViewSets for CRUD operations
  - Serializers for data validation and transformation
  - Routers for URL configuration
- **Testing**: Use \`django.test.TestCase\` for unit tests`;
}

function generateRailsInstructions(): string {
  return `### Rails

- **Rake Tasks**: Use \`rails <command>\` or \`rake <command>\` for Rails operations
- **Database**: Use \`rails db:migrate\` for migrations, \`rails db:seed\` for seeding
- **Models**: Inherit from \`ApplicationRecord\`, use ActiveRecord ORM
- **Controllers**: Follow RESTful conventions with standard actions:
  - \`index\`, \`show\`, \`new\`, \`create\`, \`edit\`, \`update\`, \`destroy\`
- **Routes**: Define routes in \`config/routes.rb\` using \`resources\` or \`resource\`
- **Views**: Use ERB templates or alternative templating (Haml, Slim)
- **Testing**: Use RSpec or Minitest for testing
- **Console**: Use \`rails console\` for interactive debugging
- **Generators**: Use \`rails generate\` to create models, controllers, migrations`;
}

function generateLaravelInstructions(): string {
  return `### Laravel

- **Artisan Commands**: Use \`php artisan <command>\` for all Laravel operations
- **Migrations**: Create and run migrations:
  \`\`\`bash
  php artisan make:migration create_table_name
  php artisan migrate
  \`\`\`
- **Models**: Use Eloquent ORM, models in \`app/Models/\` directory
- **Controllers**: Create controllers with \`php artisan make:controller\`
- **Routes**: Define routes in \`routes/web.php\` (web) or \`routes/api.php\` (API)
- **Views**: Use Blade templating engine (\`.blade.php\` files)
- **Eloquent**: Use Eloquent ORM for database operations:
  - \`Model::all()\`, \`Model::find($id)\`, \`Model::where()\`
  - Relationships: \`hasMany\`, \`belongsTo\`, \`belongsToMany\`
- **Testing**: Use PHPUnit with Laravel's testing helpers
- **Queues**: Use queues for background jobs with \`php artisan queue:work\``;
}

function generateExpressInstructions(): string {
  return `### Express.js

- **Middleware Order**: Middleware order matters - place error handlers last
- **Routing**: Use \`express.Router()\` for modular route definitions
- **Error Handling**: Use error-handling middleware with 4 parameters:
  \`\`\`javascript
  app.use((err, req, res, next) => { /* handle error */ });
  \`\`\`
- **Body Parsing**: Use \`express.json()\` and \`express.urlencoded()\` for parsing
- **Static Files**: Use \`express.static('public')\` for serving static files
- **Async Handlers**: Wrap async route handlers in try-catch or use middleware
- **Security**: Use helmet middleware for security headers
- **Environment**: Use \`dotenv\` for environment variables`;
}

function generateNestJSInstructions(): string {
  return `### NestJS

- **Modules**: Organize code into feature modules with \`@Module()\` decorator
- **Controllers**: Handle HTTP requests with \`@Controller()\` decorator
- **Providers**: Use \`@Injectable()\` for services and providers
- **Dependency Injection**: NestJS has built-in DI container
- **DTOs**: Define Data Transfer Objects with class-validator decorators
- **Database**: Use TypeORM, Prisma, or Mongoose for database operations
- **Testing**: Use Jest with NestJS testing utilities
- **CLI**: Use NestJS CLI for generating modules, controllers, services:
  \`\`\`bash
  nest g module users
  nest g controller users
  nest g service users
  \`\`\``;
}

function generateSpringInstructions(): string {
  return `### Spring Boot

- **Annotations**: Use Spring annotations for configuration:
  - \`@SpringBootApplication\` for main application class
  - \`@RestController\` for REST controllers
  - \`@Service\` for service layer
  - \`@Repository\` for data access layer
- **Dependency Injection**: Use \`@Autowired\` or constructor injection
- **JPA**: Use Spring Data JPA for database operations:
  - Extend \`JpaRepository\` interface
  - Use method naming conventions for queries
- **Testing**: Use \`@SpringBootTest\` for integration tests
- **Configuration**: Use \`application.properties\` or \`application.yml\``;
}

function generateFastAPIInstructions(): string {
  return `### FastAPI

- **Dependency Injection**: Use \`Depends()\` for injecting dependencies
- **Pydantic Models**: Define request/response schemas with Pydantic
- **Route Handlers**: Use path operation decorators:
  - \`@app.get()\`, \`@app.post()\`, \`@app.put()\`, \`@app.delete()\`
- **Query Parameters**: Define as function parameters with defaults
- **Request Body**: Use Pydantic models for request body
- **Response Models**: Use \`response_model\` parameter for response validation
- **Status Codes**: Use \`status_code\` parameter or \`HTTPException\`
- **Testing**: Use \`TestClient\` from \`fastapi.testclient\`
- **Documentation**: Automatic OpenAPI docs at \`/docs\` and \`/redoc\``;
}

function generateFlaskInstructions(): string {
  return `### Flask

- **Blueprints**: Organize routes into blueprints for modular applications
- **Route Decorators**: Use \`@app.route()\` or \`@blueprint.route()\`
- **HTTP Methods**: Specify methods in route decorator
- **Request Object**: Use \`from flask import request\` for request data:
  - \`request.json\` for JSON body
  - \`request.form\` for form data
  - \`request.args\` for query parameters
- **Response**: Return strings or use \`jsonify()\` for JSON responses
- **Templates**: Use Jinja2 templates with \`render_template()\`
- **Testing**: Use Flask's test client for testing`;
}

export function generateFrameworkInstructions(files: FileInfo[], rootDir: string): string {
  const frameworks = detectFrameworkFromFiles(files, rootDir);

  if (frameworks.length === 0) {
    return "";
  }

  const sections: string[] = [];
  sections.push("## Framework Instructions\n");

  for (const framework of frameworks) {
    switch (framework) {
      case "Django":
        sections.push(generateDjangoInstructions());
        break;
      case "Rails":
        sections.push(generateRailsInstructions());
        break;
      case "Laravel":
        sections.push(generateLaravelInstructions());
        break;
      case "Express.js":
        sections.push(generateExpressInstructions());
        break;
      case "NestJS":
        sections.push(generateNestJSInstructions());
        break;
      case "Spring Boot":
        sections.push(generateSpringInstructions());
        break;
      case "FastAPI":
        sections.push(generateFastAPIInstructions());
        break;
      case "Flask":
        sections.push(generateFlaskInstructions());
        break;
    }
    sections.push("");
  }

  return sections.join("\n");
}