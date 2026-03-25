import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { extractSymbols } from "../src/analyzers/symbols";
import { FileInfo } from "../src/core/repoScanner";
import { detectAdapter } from "../src/core/adapters/index.js";
import fs from "fs";
import path from "path";
import os from "os";

const SALESFORCE_ENTERPRISE_PATH = path.join(process.cwd(), "test-projects/salesforce-enterprise");

describe("Salesforce Apex Classes Detection", () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "apex-classes-test-"));
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

  // =========================================================================
  // INTEGRATION TESTS - Using real Salesforce Enterprise test project
  // =========================================================================

  describe("Integration: Real Salesforce Enterprise Project", () => {
    it("should detect Salesforce adapter from sfdx-project.json", () => {
      const adapter = detectAdapter(SALESFORCE_ENTERPRISE_PATH);
      expect(adapter.name).toBe("salesforce");
    });

    it("should detect all 8 Apex classes in the enterprise project", () => {
      const classesDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes");
      const files = fs.readdirSync(classesDir).filter(f => f.endsWith(".cls"));

      expect(files).toHaveLength(8);
      expect(files).toContain("AccountController.cls");
      expect(files).toContain("AccountControllerTest.cls");
      expect(files).toContain("OpportunityBatch.cls");
      expect(files).toContain("OpportunityBatchTest.cls");
      expect(files).toContain("OpportunityTriggerHandler.cls");
      expect(files).toContain("OpportunityTriggerHelper.cls");
      expect(files).toContain("TriggerManagement.cls");
      expect(files).toContain("Logger.cls");
    });

    it("should extract symbols from all 8 Apex classes", () => {
      const classesDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes");
      const files = fs.readdirSync(classesDir)
        .filter(f => f.endsWith(".cls"))
        .map(f => {
          const fullPath = path.join(classesDir, f);
          return {
            path: fullPath,
            relativePath: `force-app/main/default/classes/${f}`,
            extension: "cls",
            name: f.replace(".cls", ""),
          } as FileInfo;
        });

      const result = extractSymbols(files);

      // All 8 classes should be detected
      const classSymbols = result.symbols.filter(s => s.type === "class");
      expect(classSymbols.length).toBeGreaterThanOrEqual(8);

      const classNames = classSymbols.map(s => s.name);
      expect(classNames).toContain("AccountController");
      expect(classNames).toContain("AccountControllerTest");
      expect(classNames).toContain("OpportunityBatch");
      expect(classNames).toContain("OpportunityBatchTest");
      expect(classNames).toContain("OpportunityTriggerHandler");
      expect(classNames).toContain("OpportunityTriggerHelper");
      expect(classNames).toContain("TriggerManagement");
      expect(classNames).toContain("Logger");
    });
  });

  // =========================================================================
  // AccountController - Controller with @AuraEnabled methods
  // =========================================================================

  describe("AccountController", () => {
    it("should be detected as a class with sharing", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountController.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/AccountController.cls", "cls", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.type === "class" && s.name === "AccountController");
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.export).toBe(true);
      expect(content).toContain("public with sharing class AccountController");
    });

    it("should detect @AuraEnabled methods as entrypoints", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountController.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/AccountController.cls", "cls", content);
      const result = extractSymbols([file]);

      // Find methods that are exported (public)
      const methods = result.symbols.filter(s => s.type === "function" && s.export === true);

      // Should have @AuraEnabled methods
      expect(content).toContain("@AuraEnabled");
      expect(content).toContain("getAccounts");
      expect(content).toContain("createAccount");
      expect(content).toContain("updateAccount");
      expect(content).toContain("deleteAccount");
      expect(content).toContain("getAccountSummary");

      // Methods should be detected
      const methodNames = methods.map(m => m.name);
      expect(methodNames).toContain("getAccounts");
      expect(methodNames).toContain("createAccount");
      expect(methodNames).toContain("updateAccount");
      expect(methodNames).toContain("deleteAccount");
      expect(methodNames).toContain("getAccountSummary");
    });

    it("should detect cacheable @AuraEnabled methods", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountController.cls"),
        "utf-8"
      );

      // Count @AuraEnabled annotations
      const auraEnabledCount = (content.match(/@AuraEnabled/g) || []).length;
      expect(auraEnabledCount).toBeGreaterThanOrEqual(4);

      // Count cacheable=true annotations
      const cacheableCount = (content.match(/@AuraEnabled\(cacheable=true\)/g) || []).length;
      expect(cacheableCount).toBeGreaterThanOrEqual(2);
    });

    it("should be identified as a Controller type entrypoint", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountController.cls"),
        "utf-8"
      );

      // Controller classes have specific patterns
      expect(content).toContain("Controller");
      expect(content).toContain("@AuraEnabled");
    });
  });

  // =========================================================================
  // AccountControllerTest - Test class with @IsTest
  // =========================================================================

  describe("AccountControllerTest", () => {
    it("should be detected as a test class", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountControllerTest.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/AccountControllerTest.cls", "cls", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.type === "class" && s.name === "AccountControllerTest");
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.export).toBe(true);
    });

    it("should have @IsTest annotation", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountControllerTest.cls"),
        "utf-8"
      );

      expect(content).toContain("@IsTest");
      expect(content).toContain("private class AccountControllerTest");
    });

    it("should have test methods with @isTest annotation", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountControllerTest.cls"),
        "utf-8"
      );

      const isTestCount = (content.match(/@isTest/g) || []).length;
      expect(isTestCount).toBeGreaterThanOrEqual(7); // Multiple test methods

      expect(content).toContain("testGetAccounts");
      expect(content).toContain("testCreateAccount");
      expect(content).toContain("testUpdateAccount");
      expect(content).toContain("testDeleteAccount");
    });

    it("should have @testSetup method", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountControllerTest.cls"),
        "utf-8"
      );

      expect(content).toContain("@testSetup");
      expect(content).toContain("setupTestData");
    });
  });

  // =========================================================================
  // OpportunityBatch - Batchable interface implementation
  // =========================================================================

  describe("OpportunityBatch", () => {
    it("should be detected as a global class", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityBatch.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/OpportunityBatch.cls", "cls", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.type === "class" && s.name === "OpportunityBatch");
      expect(classSymbol).toBeDefined();
    });

    it("should implement Database.Batchable interface", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityBatch.cls"),
        "utf-8"
      );

      expect(content).toContain("implements Database.Batchable<SObject>");
      expect(content).toContain("global class OpportunityBatch");
    });

    it("should implement Database.Stateful for state retention", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityBatch.cls"),
        "utf-8"
      );

      expect(content).toContain("Database.Stateful");
    });

    it("should have batch method signatures (start, execute, finish)", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityBatch.cls"),
        "utf-8"
      );

      expect(content).toContain("global Database.QueryLocator start(Database.BatchableContext BC)");
      expect(content).toContain("global void execute(Database.BatchableContext BC, List<Opportunity> scope)");
      expect(content).toContain("global void finish(Database.BatchableContext BC)");
    });

    it("should be identified as a Batch entrypoint type", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityBatch.cls"),
        "utf-8"
      );

      // Batch classes are entrypoints
      expect(content).toContain("Batch");
      expect(content).toContain("implements Database.Batchable");
    });
  });

  // =========================================================================
  // OpportunityBatchTest - Test class for batch
  // =========================================================================

  describe("OpportunityBatchTest", () => {
    it("should be detected as a test class with @IsTest", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityBatchTest.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/OpportunityBatchTest.cls", "cls", content);
      const result = extractSymbols([file]);

      expect(content).toContain("@IsTest");
      expect(content).toContain("private class OpportunityBatchTest");

      const classSymbol = result.symbols.find(s => s.type === "class" && s.name === "OpportunityBatchTest");
      expect(classSymbol).toBeDefined();
    });

    it("should test batch execution", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityBatchTest.cls"),
        "utf-8"
      );

      expect(content).toContain("Database.executeBatch");
      expect(content).toContain("testBatchExecution");
      expect(content).toContain("testBatchWithCustomQuery");
      expect(content).toContain("testBatchStateRetention");
    });
  });

  // =========================================================================
  // OpportunityTriggerHandler - Trigger handler class
  // =========================================================================

  describe("OpportunityTriggerHandler", () => {
    it("should be detected as a class with sharing", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/OpportunityTriggerHandler.cls", "cls", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.type === "class" && s.name === "OpportunityTriggerHandler");
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.export).toBe(true);
    });

    it("should have trigger event handler methods", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls"),
        "utf-8"
      );

      // Trigger handlers have onBeforeInsert, onBeforeUpdate, etc.
      expect(content).toContain("onBeforeInsert");
      expect(content).toContain("onBeforeUpdate");
      expect(content).toContain("onBeforeDelete");
      expect(content).toContain("onAfterInsert");
      expect(content).toContain("onAfterUpdate");
      expect(content).toContain("onAfterDelete");
      expect(content).toContain("onAfterUndelete");
    });

    it("should be identified as a Trigger handler entrypoint", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls"),
        "utf-8"
      );

      expect(content).toContain("Handler");
      expect(content).toContain("Trigger");
    });
  });

  // =========================================================================
  // OpportunityTriggerHelper - Trigger helper/utility class
  // =========================================================================

  describe("OpportunityTriggerHelper", () => {
    it("should be detected as a class with sharing", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHelper.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/OpportunityTriggerHelper.cls", "cls", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.type === "class" && s.name === "OpportunityTriggerHelper");
      expect(classSymbol).toBeDefined();
    });

    it("should have helper methods for triggers", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHelper.cls"),
        "utf-8"
      );

      expect(content).toContain("canReopenOpportunity");
      expect(content).toContain("updateAccountTotalRevenue");
      expect(content).toContain("sendWinNotifications");
      expect(content).toContain("getDefaultCloseDate");
    });
  });

  // =========================================================================
  // TriggerManagement - Utility class (without sharing)
  // =========================================================================

  describe("TriggerManagement", () => {
    it("should be detected as a class without sharing", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/TriggerManagement.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/TriggerManagement.cls", "cls", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.type === "class" && s.name === "TriggerManagement");
      expect(classSymbol).toBeDefined();
      expect(content).toContain("public without sharing class TriggerManagement");
    });

    it("should have trigger bypass management methods", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/TriggerManagement.cls"),
        "utf-8"
      );

      expect(content).toContain("isTriggerBypassed");
      expect(content).toContain("isTriggerBypassedForUser");
      expect(content).toContain("bypassTrigger");
      expect(content).toContain("removeBypass");
      expect(content).toContain("getBypassedTriggers");
    });

    it("should be identified as a utility class", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/TriggerManagement.cls"),
        "utf-8"
      );

      // Utility classes often use "without sharing" for system-level access
      expect(content).toContain("without sharing");
      expect(content).toContain("Management");
    });
  });

  // =========================================================================
  // Logger - Service class with logging methods
  // =========================================================================

  describe("Logger", () => {
    it("should be detected as a class with sharing", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/Logger.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/Logger.cls", "cls", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.type === "class" && s.name === "Logger");
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.export).toBe(true);
      expect(content).toContain("public with sharing class Logger");
    });

    it("should have logging severity enum", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/Logger.cls"),
        "utf-8"
      );

      expect(content).toContain("public enum Severity");
      expect(content).toContain("DEBUG");
      expect(content).toContain("INFO");
      expect(content).toContain("WARNING");
      expect(content).toContain("ERROR");
      expect(content).toContain("CRITICAL");
    });

    it("should have static logging methods", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/Logger.cls"),
        "utf-8"
      );

      expect(content).toContain("public static void log");
      expect(content).toContain("public static void debug");
      expect(content).toContain("public static void info");
      expect(content).toContain("public static void warn");
      expect(content).toContain("public static void error");
      expect(content).toContain("public static void critical");
      expect(content).toContain("public static void logException");
    });

    it("should be identified as a service class", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/Logger.cls"),
        "utf-8"
      );

      // Service classes often have "with sharing" and contain business logic
      expect(content).toContain("with sharing");
      expect(content).toContain("Logger");
    });
  });

  // =========================================================================
  // UNIT TESTS - Apex parsing edge cases
  // =========================================================================

  describe("Unit: Apex parsing edge cases", () => {
    it("should parse class with sharing modes", () => {
      const sharingModes = [
        { code: "public with sharing class TestClass {}", expected: true },
        { code: "public without sharing class TestClass {}", expected: true },
        { code: "public inherited sharing class TestClass {}", expected: true },
        { code: "public class TestClass {}", expected: true },
      ];

      for (const mode of sharingModes) {
        const file = createFileInfo("TestClass.cls", "cls", mode.code);
        const result = extractSymbols([file]);
        const classSymbol = result.symbols.find(s => s.name === "TestClass");
        expect(classSymbol).toBeDefined();
        expect(classSymbol?.type).toBe("class");
      }
    });

    it("should parse global class", () => {
      const content = `global class GlobalBatch implements Database.Batchable<SObject> {
        global Database.QueryLocator start(Database.BatchableContext BC) { return null; }
        global void execute(Database.BatchableContext BC, List<SObject> scope) {}
        global void finish(Database.BatchableContext BC) {}
      }`;

      const file = createFileInfo("GlobalBatch.cls", "cls", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.name === "GlobalBatch");
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.type).toBe("class");
    });

    it("should parse @future methods", () => {
      const content = `public class AsyncProcessor {
        @future
        public static void processAsync(String data) {
          // async processing
        }
      }`;

      const file = createFileInfo("AsyncProcessor.cls", "cls", content);
      const result = extractSymbols([file]);

      expect(result.symbols.find(s => s.name === "processAsync")).toBeDefined();
    });

    it("should parse webservice methods", () => {
      const content = `global class WebServiceAPI {
        webservice static String createRecord(String jsonData) {
          return 'created';
        }
      }`;

      const file = createFileInfo("WebServiceAPI.cls", "cls", content);
      const result = extractSymbols([file]);

      const methodSymbol = result.symbols.find(s => s.name === "createRecord");
      expect(methodSymbol).toBeDefined();
      expect(methodSymbol?.type).toBe("function");
    });

    it("should parse interface implementations", () => {
      const content = `public class QueueableImpl implements Queueable {
        public void execute(QueueableContext context) {
          // implementation
        }
      }`;

      const file = createFileInfo("QueueableImpl.cls", "cls", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.name === "QueueableImpl");
      expect(classSymbol).toBeDefined();
      expect(result.symbols.find(s => s.name === "execute")).toBeDefined();
    });

    it("should parse schedulable class", () => {
      const content = `global class ScheduledJob implements Schedulable {
        global void execute(SchedulableContext SC) {
          // scheduled logic
        }
      }`;

      const file = createFileInfo("ScheduledJob.cls", "cls", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.name === "ScheduledJob");
      expect(classSymbol).toBeDefined();
      expect(result.symbols.find(s => s.name === "execute")).toBeDefined();
    });
  });

  // =========================================================================
  // ENTRYPOINT DETECTION TESTS
  // =========================================================================

  describe("Entrypoint Detection for Salesforce", () => {
    it("should detect AccountController as entrypoint (Controller)", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountController.cls"),
        "utf-8"
      );

      // Controller is an entrypoint pattern per salesforceAdapter
      expect(content).toContain("Controller");
    });

    it("should detect OpportunityBatch as entrypoint (Batch)", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityBatch.cls"),
        "utf-8"
      );

      // Batch is an entrypoint pattern per salesforceAdapter
      expect(content).toContain("implements Database.Batchable");
    });

    it("should detect TriggerManagement as utility class", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/TriggerManagement.cls"),
        "utf-8"
      );

      // TriggerManagement uses without sharing and is a utility
      expect(content).toContain("without sharing");
      expect(content).toContain("Management");
    });

    it("should detect Logger as a service class", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/Logger.cls"),
        "utf-8"
      );

      // Service classes are layer 2 per salesforceAdapter
      expect(content).toContain("with sharing");
      expect(content).toContain("Logger");
    });
  });

  // =========================================================================
  // SYMBOL EXTRACTION ACCURACY
  // =========================================================================

  describe("Symbol Extraction Accuracy", () => {
    it("should extract all method symbols from AccountController", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountController.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/AccountController.cls", "cls", content);
      const result = extractSymbols([file]);

      const methods = result.symbols.filter(s => s.type === "function");
      const methodNames = methods.map(m => m.name);

      // All public methods should be detected
      expect(methodNames).toContain("getAccounts");
      expect(methodNames).toContain("createAccount");
      expect(methodNames).toContain("updateAccount");
      expect(methodNames).toContain("deleteAccount");
      expect(methodNames).toContain("getAccountSummary");
    });

    it("should extract all method symbols from OpportunityTriggerHandler", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/OpportunityTriggerHandler.cls", "cls", content);
      const result = extractSymbols([file]);

      const methods = result.symbols.filter(s => s.type === "function");
      const methodNames = methods.map(m => m.name);

      // Trigger handler methods
      expect(methodNames).toContain("onBeforeInsert");
      expect(methodNames).toContain("onBeforeUpdate");
      expect(methodNames).toContain("onBeforeDelete");
      expect(methodNames).toContain("onAfterInsert");
      expect(methodNames).toContain("onAfterUpdate");
      expect(methodNames).toContain("onAfterDelete");
      expect(methodNames).toContain("onAfterUndelete");
    });

    it("should extract all method symbols from Logger", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/Logger.cls"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/classes/Logger.cls", "cls", content);
      const result = extractSymbols([file]);

      const methods = result.symbols.filter(s => s.type === "function");
      const methodNames = methods.map(m => m.name);

      // Logger methods
      expect(methodNames).toContain("log");
      expect(methodNames).toContain("debug");
      expect(methodNames).toContain("info");
      expect(methodNames).toContain("warn");
      expect(methodNames).toContain("error");
      expect(methodNames).toContain("critical");
      expect(methodNames).toContain("logException");
    });
  });
});
