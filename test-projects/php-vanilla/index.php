<?php

class UserController {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function index(): array {
        $stmt = $this->db->prepare("SELECT * FROM users");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function show(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
    
    public function store(array $data): int {
        $stmt = $this->db->prepare("INSERT INTO users (name, email) VALUES (?, ?)");
        $stmt->execute([$data['name'], $data['email']]);
        return (int)$this->db->lastInsertId();
    }
}

class Router {
    private $routes = [];
    
    public function add(string $method, string $path, callable $handler): void {
        $this->routes[] = ['method' => $method, 'path' => $path, 'handler' => $handler];
    }
    
    public function dispatch(string $method, string $uri): void {
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && $route['path'] === $uri) {
                ($route['handler'])();
                return;
            }
        }
        http_response_code(404);
    }
}

$router = new Router();
$router->add('GET', '/users', function() {
    echo json_encode(['users' => []]);
});

$router->dispatch('GET', '/users');
