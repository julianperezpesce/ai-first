import { describe, it, expect } from "vitest";
import { pythonParser } from "../src/core/parsers/pythonParser";

describe("Python Parser", () => {
  it("should parse a simple class", () => {
    const source = `
class UserService:
    def __init__(self):
        self.users = []
    
    def find_by_id(self, id: str) -> dict:
        return next((u for u in self.users if u["id"] == id), None)
`;

    const result = pythonParser.parseFile("test.py", source);
    
    expect(result.symbols).toHaveLength(1);
    expect(result.symbols[0].name).toBe("UserService");
    expect(result.symbols[0].type).toBe("class");
    expect(result.symbols[0].isExported).toBe(true);
  });

  it("should parse class with inheritance", () => {
    const source = `
class BaseService:
    pass

class UserService(BaseService):
    def get_users(self):
        return []
`;

    const result = pythonParser.parseFile("test.py", source);
    
    const userService = result.symbols.find(s => s.name === "UserService");
    expect(userService).toBeDefined();
    expect(userService?.inheritance).toContain("BaseService");
  });

  it("should parse functions", () => {
    const source = `
def calculate_total(items: list) -> float:
    return sum(item["price"] for item in items)

async def fetch_user(user_id: str):
    return {"id": user_id}

async def process_payment(amount: float, currency: str = "USD"):
    return {"status": "success"}
`;

    const result = pythonParser.parseFile("test.py", source);
    
    expect(result.symbols).toHaveLength(3);
    
    const calculateTotal = result.symbols.find(s => s.name === "calculate_total");
    expect(calculateTotal).toBeDefined();
    expect(calculateTotal?.type).toBe("function");
    expect(calculateTotal?.parameters).toHaveLength(1);
    expect(calculateTotal?.parameters?.[0].name).toBe("items");
    expect(calculateTotal?.parameters?.[0].type).toBe("list");
    
    const fetchUser = result.symbols.find(s => s.name === "fetch_user");
    expect(fetchUser?.isAsync).toBe(true);
    
    const processPayment = result.symbols.find(s => s.name === "process_payment");
    expect(processPayment?.parameters).toHaveLength(2);
    expect(processPayment?.parameters?.[1].name).toBe("currency");
    expect(processPayment?.parameters?.[1].default).toBe("\"USD\"");
  });

  it("should parse imports", () => {
    const source = `
import os
import sys
from typing import List, Optional
from datetime import datetime as dt
from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100)
`;

    const result = pythonParser.parseFile("test.py", source);
    
    expect(result.imports).toHaveLength(5);
    
    const typingImport = result.imports.find(i => i.module === "typing");
    expect(typingImport).toBeDefined();
    expect(typingImport?.names).toContain("List");
    expect(typingImport?.names).toContain("Optional");
    
    const datetimeImport = result.imports.find(i => i.module === "datetime");
    expect(datetimeImport?.names).toContain("datetime");
    
    const djangoImport = result.imports.find(i => i.module === "django.db");
    expect(djangoImport?.names).toContain("models");
  });

  it("should parse decorators", () => {
    const source = `
@app.route("/users")
@login_required
def get_users():
    return []

@dataclass
class UserDTO:
    name: str
    email: str

@property
def full_name(self):
    return f"{self.first_name} {self.last_name}"
`;

    const result = pythonParser.parseFile("test.py", source);
    
    const getUsers = result.symbols.find(s => s.name === "get_users");
    expect(getUsers?.decorators).toContain("app.route");
    expect(getUsers?.decorators).toContain("login_required");
    
    const userDto = result.symbols.find(s => s.name === "UserDTO");
    expect(userDto?.decorators).toContain("dataclass");
  });

  it("should parse docstrings", () => {
    const source = `
class AuthService:
    """Service for managing user authentication."""
    
    def login(self, email: str, password: str) -> str:
        """Authenticate a user and return JWT token."""
        return "token"
`;

    const result = pythonParser.parseFile("test.py", source);
    
    const authService = result.symbols.find(s => s.name === "AuthService");
    expect(authService?.docstring).toContain("Service for managing user authentication");
  });

  it("should handle complex Django model", () => {
    const source = `
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """Custom user model with additional fields."""
    
    phone = models.CharField(max_length=20, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    
    class Meta:
        db_table = "users"
    
    def get_full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    @property
    def display_name(self) -> str:
        return self.username or self.email
`;

    const result = pythonParser.parseFile("test.py", source);
    
    const user = result.symbols.find(s => s.name === "User");
    expect(user).toBeDefined();
    expect(user?.type).toBe("class");
    expect(user?.inheritance).toContain("AbstractUser");
    expect(user?.docstring).toContain("Custom user model");
    
    expect(result.imports).toHaveLength(2);
    expect(result.imports.map(i => i.module)).toContain("django.db");
    expect(result.imports.map(i => i.module)).toContain("django.contrib.auth.models");
  });

  it("should parse Flask routes", () => {
    const source = `
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/api/users", methods=["GET"])
def list_users():
    return jsonify([])

@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.get_json()
    return jsonify({"id": 1}), 201

@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id: int):
    return jsonify({"id": user_id})
`;

    const result = pythonParser.parseFile("test.py", source);
    
    const listUsers = result.symbols.find(s => s.name === "list_users");
    expect(listUsers?.decorators).toContain("app.route");
    
    const createUser = result.symbols.find(s => s.name === "create_user");
    expect(createUser).toBeDefined();
    
    const getUser = result.symbols.find(s => s.name === "get_user");
    expect(getUser?.parameters?.[0].name).toBe("user_id");
    expect(getUser?.parameters?.[0].type).toBe("int");
  });
});
