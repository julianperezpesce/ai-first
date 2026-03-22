import { describe, it, expect } from "vitest";
import { parserRegistry, createSymbolFromParsed } from "../src/core/parsers/index.js";

describe("Parser Registry", () => {
  it("should return TypeScript parser for .ts files", () => {
    const parser = parserRegistry.getParser(".ts");
    expect(parser).toBeDefined();
  });

  it("should return TypeScript parser for .tsx files", () => {
    const parser = parserRegistry.getParser(".tsx");
    expect(parser).toBeDefined();
  });

  it("should return TypeScript parser for .js files", () => {
    const parser = parserRegistry.getParser(".js");
    expect(parser).toBeDefined();
  });

  it("should return Python parser for .py files", () => {
    const parser = parserRegistry.getParser(".py");
    expect(parser).toBeDefined();
  });

  it("should return undefined for unsupported extensions", () => {
    const parser = parserRegistry.getParser(".unknown");
    expect(parser).toBeUndefined();
  });

  it("should be case insensitive", () => {
    const parserLower = parserRegistry.getParser(".ts");
    const parserUpper = parserRegistry.getParser(".TS");
    expect(parserLower).toBe(parserUpper);
  });

  it("should check if parser exists", () => {
    expect(parserRegistry.hasParser(".ts")).toBe(true);
    expect(parserRegistry.hasParser(".py")).toBe(true);
    expect(parserRegistry.hasParser(".unknown")).toBe(false);
  });

  it("should return list of supported extensions", () => {
    const extensions = parserRegistry.getSupportedExtensions();
    expect(extensions).toContain(".ts");
    expect(extensions).toContain(".tsx");
    expect(extensions).toContain(".js");
    expect(extensions).toContain(".py");
  });

  it("should parse TypeScript file", () => {
    const source = `
      export class UserService {
        async findById(id: string) {
          return null;
        }
      }
    `;

    const result = parserRegistry.parse("test.ts", source);
    expect(result).toBeDefined();
    expect(result?.symbols).toHaveLength(1);
    expect(result?.symbols[0].name).toBe("UserService");
  });

  it("should parse Python file", () => {
    const source = `
class UserService:
    def find_by_id(self, id):
        return None
`;

    const result = parserRegistry.parse("test.py", source);
    expect(result).toBeDefined();
    expect(result?.symbols).toHaveLength(1);
    expect(result?.symbols[0].name).toBe("UserService");
  });

  it("should return null for unsupported files", () => {
    const result = parserRegistry.parse("test.unknown", "content");
    expect(result).toBeNull();
  });

  it("should create symbols from parsed TypeScript", () => {
    const source = `
      export class UserService {
        async findById(id: string): Promise<User | null> {
          return null;
        }
      }
      
      export interface User {
        id: string;
        name: string;
      }
    `;

    const parsed = parserRegistry.parse("test.ts", source);
    expect(parsed).toBeDefined();

    const symbols = createSymbolFromParsed(parsed!, "test.ts");
    
    expect(symbols.length).toBeGreaterThanOrEqual(2);
    
    const userService = symbols.find(s => s.name === "UserService");
    expect(userService).toBeDefined();
    expect(userService?.type).toBe("class");
    expect(userService?.export).toBe(true);
    
    const userInterface = symbols.find(s => s.name === "User");
    expect(userInterface).toBeDefined();
    expect(userInterface?.type).toBe("interface");
  });

  it("should create symbols from parsed Python", () => {
    const source = `
class UserService:
    def find_by_id(self, id: str):
        return None

def helper_function():
    pass
`;

    const parsed = parserRegistry.parse("test.py", source);
    expect(parsed).toBeDefined();

    const symbols = createSymbolFromParsed(parsed!, "test.py");
    
    expect(symbols.length).toBeGreaterThanOrEqual(2);
    
    const userService = symbols.find(s => s.name === "UserService");
    expect(userService).toBeDefined();
    expect(userService?.type).toBe("class");
    
    const helperFunc = symbols.find(s => s.name === "helper_function");
    expect(helperFunc).toBeDefined();
    expect(helperFunc?.type).toBe("function");
  });
});
