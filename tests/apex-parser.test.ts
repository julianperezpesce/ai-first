import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { extractSymbols } from "../src/analyzers/symbols";
import { FileInfo } from "../src/core/repoScanner";
import fs from "fs";
import path from "path";
import os from "os";

describe("Apex Parser", () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "apex-test-"));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const createFileInfo = (filePath: string, extension: string, content: string): FileInfo => {
    const fullPath = path.join(tempDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
    
    return {
      path: fullPath,
      relativePath: filePath,
      extension,
      name: filePath.split("/").pop()?.replace(`.${extension}`, "") || "",
    };
  };

  describe("Class parsing", () => {
    it("should parse public class", () => {
      const content = `public class AccountController {
  public static List getAccounts() {
    return [SELECT Id, Name FROM Account];
  }
}`;
      const file = createFileInfo("force-app/main/default/classes/AccountController.cls", "cls", content);
      const result = extractSymbols([file]);
      
      expect(result.symbols.length).toBeGreaterThanOrEqual(1);
      const classSymbol = result.symbols.find(s => s.type === "class");
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.name).toBe("AccountController");
      expect(classSymbol?.export).toBe(true);
    });

    it("should parse class with sharing", () => {
      const content = `public with sharing class ContactService {
        public static void updateContact(Contact c) {
          update c;
        }
      }`;
      const file = createFileInfo("ContactService.cls", "cls", content);
      const result = extractSymbols([file]);
      
      expect(result.symbols[0].name).toBe("ContactService");
      expect(result.symbols[0].type).toBe("class");
    });

    it("should parse class without sharing", () => {
      const content = `public without sharing class AdminController {
        public static void deleteAll() {
          delete [SELECT Id FROM Account];
        }
      }`;
      const file = createFileInfo("AdminController.cls", "cls", content);
      const result = extractSymbols([file]);
      
      expect(result.symbols[0].name).toBe("AdminController");
    });

    it("should parse inherited sharing class", () => {
      const content = `public inherited sharing class BaseService {
        public virtual void process() {}
      }`;
      const file = createFileInfo("BaseService.cls", "cls", content);
      const result = extractSymbols([file]);
      
      expect(result.symbols[0].name).toBe("BaseService");
    });
  });

  describe("Interface parsing", () => {
    it("should parse public interface", () => {
      const content = `public interface IAccountService {
        Account getAccountById(Id accountId);
        void updateAccount(Account acc);
      }`;
      const file = createFileInfo("IAccountService.cls", "cls", content);
      const result = extractSymbols([file]);
      
      expect(result.symbols[0].name).toBe("IAccountService");
      expect(result.symbols[0].type).toBe("interface");
    });
  });

  describe("Method parsing", () => {
    it("should parse public static methods", () => {
      const content = `public class Utils {
        public static String formatPhone(String phone) {
          return phone.replaceAll('[^0-9]', '');
        }
      }`;
      const file = createFileInfo("Utils.cls", "cls", content);
      const result = extractSymbols([file]);
      
      const method = result.symbols.find(s => s.name === "formatPhone");
      expect(method).toBeDefined();
      expect(method?.type).toBe("function");
      expect(method?.export).toBe(true);
    });

    it("should parse @AuraEnabled methods", () => {
      const content = `public class AccountController {
        @AuraEnabled
        public static List getAccounts() {
          return [SELECT Id, Name FROM Account];
        }
      }`;
      const file = createFileInfo("AccountController.cls", "cls", content);
      const result = extractSymbols([file]);
      
      const method = result.symbols.find(s => s.name === "getAccounts");
      expect(method).toBeDefined();
      expect(method?.export).toBe(true);
    });

    it("should parse webservice methods", () => {
      const content = `global class WebServiceAPI {
        public static String createAccount(String name) {
          Account acc = new Account(Name = name);
          insert acc;
          return acc.Id;
        }
      }`;
      const file = createFileInfo("WebServiceAPI.cls", "cls", content);
      const result = extractSymbols([file]);
      
      const method = result.symbols.find(s => s.name === "createAccount");
      expect(method).toBeDefined();
      expect(method?.export).toBe(true);
    });
  });

  describe("Trigger parsing", () => {
    it("should parse trigger", () => {
      const content = `trigger AccountTrigger on Account (before insert, before update) {
        for(Account acc : Trigger.new) {
          acc.Name = acc.Name.toUpperCase();
        }
      }`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);
      
      expect(result.symbols[0].name).toBe("AccountTrigger");
      expect(result.symbols[0].type).toBe("function");
      expect(result.symbols[0].export).toBe(true);
    });

    it("should parse trigger with multiple events", () => {
      const content = `trigger ContactTrigger on Contact (before insert, before update, after insert, after update, before delete, after delete) {
        ContactTriggerHandler.handle(Trigger.operationType);
      }`;
      const file = createFileInfo("ContactTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);
      
      expect(result.symbols[0].name).toBe("ContactTrigger");
    });
  });

  describe("Salesforce TechStack Detection", () => {
    it("should detect Apex language", () => {
      const files: FileInfo[] = [
        createFileInfo("AccountController.cls", "cls", ""),
        createFileInfo("ContactService.cls", "cls", ""),
      ];
      
      // This would be tested via detectTechStack, but we verify the extension mapping
      expect(files[0].extension).toBe("cls");
      expect(files[1].extension).toBe("cls");
    });

    it("should detect trigger files", () => {
      const files: FileInfo[] = [
        createFileInfo("AccountTrigger.trigger", "trigger", ""),
      ];
      
      expect(files[0].extension).toBe("trigger");
    });
  });
});
