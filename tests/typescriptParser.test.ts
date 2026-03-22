import { describe, it, expect } from "vitest";
import { typescriptParser } from "../src/core/parsers/typescriptParser";

describe("TypeScript Parser", () => {
  it("should parse a simple class", () => {
    const source = `
      export class UserService {
        private users: User[] = [];
        
        async findById(id: string): Promise<User | null> {
          return this.users.find(u => u.id === id) || null;
        }
      }
    `;

    const result = typescriptParser.parseFile("test.ts", source);
    
    expect(result.symbols).toHaveLength(1);
    expect(result.symbols[0].name).toBe("UserService");
    expect(result.symbols[0].type).toBe("class");
    expect(result.symbols[0].isExported).toBe(true);
    expect(result.symbols[0].members).toHaveLength(2);
  });

  it("should parse interfaces", () => {
    const source = `
      export interface User {
        id: string;
        name: string;
        email: string;
      }
    `;

    const result = typescriptParser.parseFile("test.ts", source);
    
    expect(result.symbols).toHaveLength(1);
    expect(result.symbols[0].name).toBe("User");
    expect(result.symbols[0].type).toBe("interface");
    expect(result.symbols[0].members).toHaveLength(3);
  });

  it("should parse functions", () => {
    const source = `
      export async function fetchUser(id: string): Promise<User> {
        return { id, name: "Test" };
      }
      
      function internalHelper(): void {
        console.log("helper");
      }
    `;

    const result = typescriptParser.parseFile("test.ts", source);
    
    expect(result.symbols).toHaveLength(2);
    expect(result.symbols[0].name).toBe("fetchUser");
    expect(result.symbols[0].type).toBe("function");
    expect(result.symbols[0].isExported).toBe(true);
    expect(result.symbols[1].name).toBe("internalHelper");
    expect(result.symbols[1].isExported).toBe(false);
  });

  it("should parse class with inheritance", () => {
    const source = `
      class BaseController {}
      interface IController {}
      
      export class UserController extends BaseController implements IController {
        async getUsers() {
          return [];
        }
      }
    `;

    const result = typescriptParser.parseFile("test.ts", source);
    
    const userController = result.symbols.find(s => s.name === "UserController");
    expect(userController).toBeDefined();
    expect(userController?.heritage?.extends).toContain("BaseController");
    expect(userController?.heritage?.implements).toContain("IController");
  });

  it("should parse imports", () => {
    const source = `
      import express from "express";
      import { Request, Response } from "express";
      import * as path from "path";
      
      export class Server {
        app = express();
      }
    `;

    const result = typescriptParser.parseFile("test.ts", source);
    
    expect(result.imports).toHaveLength(4);
    expect(result.imports[0]).toEqual({ name: "express", module: "express", isDefault: true });
    expect(result.imports[1]).toEqual({ name: "Request", module: "express", isDefault: false });
    expect(result.imports[2]).toEqual({ name: "Response", module: "express", isDefault: false });
    expect(result.imports[3]).toEqual({ name: "path", module: "path", isNamespace: true });
  });

  it("should parse enums", () => {
    const source = `
      export enum UserRole {
        ADMIN = "admin",
        USER = "user",
        GUEST = "guest"
      }
    `;

    const result = typescriptParser.parseFile("test.ts", source);
    
    expect(result.symbols).toHaveLength(1);
    expect(result.symbols[0].name).toBe("UserRole");
    expect(result.symbols[0].type).toBe("enum");
    expect(result.symbols[0].isExported).toBe(true);
  });

  it("should parse type aliases", () => {
    const source = `
      export type UserId = string;
      export type Maybe<T> = T | null;
    `;

    const result = typescriptParser.parseFile("test.ts", source);
    
    expect(result.symbols).toHaveLength(2);
    expect(result.symbols[0].type).toBe("type");
    expect(result.symbols[1].type).toBe("type");
  });

  it("should extract JSDoc comments", () => {
    const source = `
      /**
       * Service for managing user authentication
       */
      export class AuthService {
        async login(email: string, password: string): Promise<string> {
          return "token";
        }
      }
    `;

    const result = typescriptParser.parseFile("test.ts", source);
    
    expect(result.symbols[0].jsDoc).toBeDefined();
    expect(result.symbols[0].jsDoc).toContain("Service for managing user authentication");
  });

  it("should handle complex real-world TypeScript", () => {
    const source = `
      import { Injectable } from "@nestjs/common";
      import { Repository } from "typeorm";
      import { User } from "./user.entity";

      @Injectable()
      export class UserService {
        constructor(private readonly userRepo: Repository<User>) {}

        async findByEmail(email: string): Promise<User | null> {
          return this.userRepo.findOne({ where: { email } });
        }

        async create(userData: CreateUserDto): Promise<User> {
          const user = this.userRepo.create(userData);
          return this.userRepo.save(user);
        }
      }

      export interface CreateUserDto {
        email: string;
        password: string;
        name: string;
      }
    `;

    const result = typescriptParser.parseFile("test.ts", source);
    
    expect(result.symbols.length).toBeGreaterThanOrEqual(2);
    
    const userService = result.symbols.find(s => s.name === "UserService");
    expect(userService).toBeDefined();
    expect(userService?.type).toBe("class");
    expect(userService?.modifiers).toContain("export");
    expect(userService?.members?.length).toBeGreaterThanOrEqual(2);
    
    const createUserDto = result.symbols.find(s => s.name === "CreateUserDto");
    expect(createUserDto).toBeDefined();
    expect(createUserDto?.type).toBe("interface");
    
    expect(result.imports).toHaveLength(3);
    expect(result.imports.map(i => i.name)).toContain("Injectable");
    expect(result.imports.map(i => i.name)).toContain("Repository");
    expect(result.imports.map(i => i.name)).toContain("User");
  });
});
