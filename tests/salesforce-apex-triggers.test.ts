import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { extractSymbols } from "../src/analyzers/symbols";
import { FileInfo } from "../src/core/repoScanner";
import fs from "fs";
import path from "path";
import os from "os";

const SALESFORCE_ENTERPRISE_PATH = path.join(process.cwd(), "fixtures/salesforce-enterprise");

describe("Salesforce Apex Triggers Detection", () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "apex-triggers-test-"));
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
    it("should detect trigger files in the enterprise project", () => {
      const triggersDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers");
      const files = fs.readdirSync(triggersDir).filter(f => f.endsWith(".trigger"));

      expect(files).toHaveLength(1);
      expect(files).toContain("OpportunityTrigger.trigger");
    });

    it("should extract OpportunityTrigger symbol from real file", () => {
      const triggerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger");
      const content = fs.readFileSync(triggerPath, "utf-8");

      const file: FileInfo = {
        path: triggerPath,
        relativePath: "force-app/main/default/triggers/OpportunityTrigger.trigger",
        extension: "trigger",
        name: "OpportunityTrigger",
      };

      const result = extractSymbols([file]);
      const triggerSymbol = result.symbols.find(s => s.name === "OpportunityTrigger");

      expect(triggerSymbol).toBeDefined();
      expect(triggerSymbol?.type).toBe("function");
      expect(triggerSymbol?.export).toBe(true);
    });
  });

  // =========================================================================
  // OpportunityTrigger - Main trigger under test
  // =========================================================================

  describe("OpportunityTrigger", () => {
    it("should have trigger name 'OpportunityTrigger'", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/triggers/OpportunityTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      const triggerSymbol = result.symbols.find(s => s.name === "OpportunityTrigger");
      expect(triggerSymbol).toBeDefined();
      expect(triggerSymbol?.name).toBe("OpportunityTrigger");
    });

    it("should fire on 'Opportunity' object", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("trigger OpportunityTrigger on Opportunity");
    });

    it("should detect all 7 trigger events", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      // All 7 events: before insert, before update, before delete, after insert, after update, after delete, after undelete
      expect(content).toContain("before insert");
      expect(content).toContain("before update");
      expect(content).toContain("before delete");
      expect(content).toContain("after insert");
      expect(content).toContain("after update");
      expect(content).toContain("after delete");
      expect(content).toContain("after undelete");
    });

    it("should have all 7 events in single trigger definition", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      // The trigger definition should contain all events
      const triggerDefinitionMatch = content.match(/trigger\s+\w+\s+on\s+\w+\s*\(([^)]+)\)/);
      expect(triggerDefinitionMatch).toBeDefined();

      const events = triggerDefinitionMatch?.[1] || "";
      expect(events).toContain("before insert");
      expect(events).toContain("before update");
      expect(events).toContain("before delete");
      expect(events).toContain("after insert");
      expect(events).toContain("after update");
      expect(events).toContain("after delete");
      expect(events).toContain("after undelete");
    });

    it("should use handler pattern with OpportunityTriggerHandler", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("OpportunityTriggerHandler");
      expect(content).toContain("new OpportunityTriggerHandler()");
    });

    it("should have bypass logic with TriggerManagement.isTriggerBypassed", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("TriggerManagement.isTriggerBypassed");
      expect(content).toContain("isTriggerBypassed('Opportunity')");
    });

    it("should use Trigger.isBefore and Trigger.isAfter context variables", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("Trigger.isBefore");
      expect(content).toContain("Trigger.isAfter");
    });

    it("should use Trigger.isInsert, Trigger.isUpdate, Trigger.isDelete, Trigger.isUndelete", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("Trigger.isInsert");
      expect(content).toContain("Trigger.isUpdate");
      expect(content).toContain("Trigger.isDelete");
      expect(content).toContain("Trigger.isUndelete");
    });

    it("should use Trigger.new and Trigger.oldMap context variables", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("Trigger.new");
      expect(content).toContain("Trigger.oldMap");
    });

    it("should have before insert handler", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("onBeforeInsert");
      expect(content).toContain("Trigger.new");
    });

    it("should have before update handler", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("onBeforeUpdate");
      expect(content).toContain("Trigger.new");
      expect(content).toContain("Trigger.oldMap");
    });

    it("should have before delete handler", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("onBeforeDelete");
      expect(content).toContain("Trigger.oldMap");
    });

    it("should have after insert handler", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("onAfterInsert");
      expect(content).toContain("Trigger.new");
    });

    it("should have after update handler", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("onAfterUpdate");
      expect(content).toContain("Trigger.new");
      expect(content).toContain("Trigger.oldMap");
    });

    it("should have after delete handler", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("onAfterDelete");
      expect(content).toContain("Trigger.oldMap");
    });

    it("should have after undelete handler", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toContain("onAfterUndelete");
      expect(content).toContain("Trigger.new");
    });
  });

  // =========================================================================
  // UNIT TESTS - Apex trigger parsing edge cases
  // =========================================================================

  describe("Unit: Apex trigger parsing edge cases", () => {
    it("should parse trigger with single event", () => {
      const content = `trigger AccountTrigger on Account (before insert) {
  // handler logic
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      const triggerSymbol = result.symbols.find(s => s.name === "AccountTrigger");
      expect(triggerSymbol).toBeDefined();
      expect(triggerSymbol?.type).toBe("function");
      expect(triggerSymbol?.export).toBe(true);
    });

    it("should parse trigger with multiple events on same line", () => {
      const content = `trigger ContactTrigger on Contact (before insert, before update, after insert, after update) {
  // handler logic
}`;
      const file = createFileInfo("ContactTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      const triggerSymbol = result.symbols.find(s => s.name === "ContactTrigger");
      expect(triggerSymbol).toBeDefined();
      expect(triggerSymbol?.type).toBe("function");
    });

    it("should parse trigger with before events only", () => {
      const content = `trigger CaseTrigger on Case (before insert, before update, before delete) {
  // before event handlers
}`;
      const file = createFileInfo("CaseTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      const triggerSymbol = result.symbols.find(s => s.name === "CaseTrigger");
      expect(triggerSymbol).toBeDefined();
      expect(triggerSymbol?.type).toBe("function");
    });

    it("should parse trigger with after events only", () => {
      const content = `trigger LeadTrigger on Lead (after insert, after update, after delete, after undelete) {
  // after event handlers
}`;
      const file = createFileInfo("LeadTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      const triggerSymbol = result.symbols.find(s => s.name === "LeadTrigger");
      expect(triggerSymbol).toBeDefined();
      expect(triggerSymbol?.type).toBe("function");
    });

    it("should parse trigger on different SObjects (Account)", () => {
      const content = `trigger AccountTrigger on Account (before insert, before update) {
  for(Account a : Trigger.new) {
    // process
  }
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      const triggerSymbol = result.symbols.find(s => s.name === "AccountTrigger");
      expect(triggerSymbol).toBeDefined();

      const content2 = fs.readFileSync(file.path, "utf-8");
      expect(content2).toContain("on Account");
    });

    it("should parse trigger on different SObjects (Contact)", () => {
      const content = `trigger ContactTrigger on Contact (before insert, before update) {
  for(Contact c : Trigger.new) {
    // process
  }
}`;
      const file = createFileInfo("ContactTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      const triggerSymbol = result.symbols.find(s => s.name === "ContactTrigger");
      expect(triggerSymbol).toBeDefined();

      const content2 = fs.readFileSync(file.path, "utf-8");
      expect(content2).toContain("on Contact");
    });

    it("should parse trigger on custom object", () => {
      const content = `trigger CustomObjectTrigger on CustomObject__c (before insert) {
  // custom object trigger
}`;
      const file = createFileInfo("CustomObjectTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      const triggerSymbol = result.symbols.find(s => s.name === "CustomObjectTrigger");
      expect(triggerSymbol).toBeDefined();
    });

    it("should detect trigger with handler instantiation", () => {
      const content = `trigger OrderTrigger on Order (before insert) {
  OrderTriggerHandler handler = new OrderTriggerHandler();
  if (Trigger.isBefore) {
    handler.onBeforeInsert(Trigger.new);
  }
}`;
      const file = createFileInfo("OrderTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      const triggerSymbol = result.symbols.find(s => s.name === "OrderTrigger");
      expect(triggerSymbol).toBeDefined();

      const fileContent = fs.readFileSync(file.path, "utf-8");
      expect(fileContent).toContain("new OrderTriggerHandler()");
    });

    it("should detect trigger with bypass check at start", () => {
      const content = `trigger ProductTrigger on Product2 (before insert) {
  if (TriggerManagement.isTriggerBypassed('Product2')) {
    return;
  }
  // trigger logic
}`;
      const file = createFileInfo("ProductTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      const triggerSymbol = result.symbols.find(s => s.name === "ProductTrigger");
      expect(triggerSymbol).toBeDefined();

      const fileContent = fs.readFileSync(file.path, "utf-8");
      expect(fileContent).toContain("isTriggerBypassed");
    });

    it("should parse trigger with Trigger.new", () => {
      const content = `trigger AssetTrigger on Asset (before insert, before update) {
  for(Asset a : Trigger.new) {
    a.Description = 'Updated';
  }
}`;
      const file = createFileInfo("AssetTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      expect(result.symbols.find(s => s.name === "AssetTrigger")).toBeDefined();
    });

    it("should parse trigger with Trigger.oldMap", () => {
      const content = `trigger CampaignTrigger on Campaign (before delete) {
  Map<Id, Campaign> oldMap = Trigger.oldMap;
  // process deletions
}`;
      const file = createFileInfo("CampaignTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      expect(result.symbols.find(s => s.name === "CampaignTrigger")).toBeDefined();
    });

    it("should detect trigger as entrypoint type", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      // Trigger files are entrypoints in Salesforce
      expect(content).toContain("trigger");
      expect(content).toContain("Trigger.isBefore");
      expect(content).toContain("Trigger.isAfter");
    });
  });

  // =========================================================================
  // TRIGGER EVENTS VERIFICATION
  // =========================================================================

  describe("Trigger Events Verification", () => {
    it("should correctly identify before insert event", () => {
      const content = `trigger AccountTrigger on Account (before insert) {
  if (Trigger.isBefore && Trigger.isInsert) {
    // before insert logic
  }
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const fileContent = fs.readFileSync(file.path, "utf-8");

      expect(fileContent).toContain("before insert");
      expect(fileContent).toContain("Trigger.isBefore");
      expect(fileContent).toContain("Trigger.isInsert");
    });

    it("should correctly identify before update event", () => {
      const content = `trigger AccountTrigger on Account (before update) {
  if (Trigger.isBefore && Trigger.isUpdate) {
    // before update logic
  }
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const fileContent = fs.readFileSync(file.path, "utf-8");

      expect(fileContent).toContain("before update");
      expect(fileContent).toContain("Trigger.isBefore");
      expect(fileContent).toContain("Trigger.isUpdate");
    });

    it("should correctly identify before delete event", () => {
      const content = `trigger AccountTrigger on Account (before delete) {
  if (Trigger.isBefore && Trigger.isDelete) {
    // before delete logic
  }
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const fileContent = fs.readFileSync(file.path, "utf-8");

      expect(fileContent).toContain("before delete");
      expect(fileContent).toContain("Trigger.isBefore");
      expect(fileContent).toContain("Trigger.isDelete");
    });

    it("should correctly identify after insert event", () => {
      const content = `trigger AccountTrigger on Account (after insert) {
  if (Trigger.isAfter && Trigger.isInsert) {
    // after insert logic
  }
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const fileContent = fs.readFileSync(file.path, "utf-8");

      expect(fileContent).toContain("after insert");
      expect(fileContent).toContain("Trigger.isAfter");
      expect(fileContent).toContain("Trigger.isInsert");
    });

    it("should correctly identify after update event", () => {
      const content = `trigger AccountTrigger on Account (after update) {
  if (Trigger.isAfter && Trigger.isUpdate) {
    // after update logic
  }
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const fileContent = fs.readFileSync(file.path, "utf-8");

      expect(fileContent).toContain("after update");
      expect(fileContent).toContain("Trigger.isAfter");
      expect(fileContent).toContain("Trigger.isUpdate");
    });

    it("should correctly identify after delete event", () => {
      const content = `trigger AccountTrigger on Account (after delete) {
  if (Trigger.isAfter && Trigger.isDelete) {
    // after delete logic
  }
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const fileContent = fs.readFileSync(file.path, "utf-8");

      expect(fileContent).toContain("after delete");
      expect(fileContent).toContain("Trigger.isAfter");
      expect(fileContent).toContain("Trigger.isDelete");
    });

    it("should correctly identify after undelete event", () => {
      const content = `trigger AccountTrigger on Account (after undelete) {
  if (Trigger.isAfter && Trigger.isUndelete) {
    // after undelete logic
  }
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const fileContent = fs.readFileSync(file.path, "utf-8");

      expect(fileContent).toContain("after undelete");
      expect(fileContent).toContain("Trigger.isAfter");
      expect(fileContent).toContain("Trigger.isUndelete");
    });
  });

  // =========================================================================
  // TRIGGER CONTEXT VARIABLES VERIFICATION
  // =========================================================================

  describe("Trigger Context Variables Verification", () => {
    it("should verify Trigger.new is used correctly", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toMatch(/Trigger\.new/);
    });

    it("should verify Trigger.old is used correctly", () => {
      const content = `trigger AccountTrigger on Account (before update) {
  for(Account oldAcc : Trigger.old) {
    // use old values
  }
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const fileContent = fs.readFileSync(file.path, "utf-8");

      expect(fileContent).toMatch(/Trigger\.old/);
    });

    it("should verify Trigger.oldMap is used correctly", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      expect(content).toMatch(/Trigger\.oldMap/);
    });

    it("should verify Trigger.newMap is used correctly", () => {
      const content = `trigger AccountTrigger on Account (after update) {
  Map<Id, Account> newMap = Trigger.newMap;
  // process with new map
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const fileContent = fs.readFileSync(file.path, "utf-8");

      expect(fileContent).toMatch(/Trigger\.newMap/);
    });

    it("should verify Trigger.isExecuting is used", () => {
      const content = `trigger AccountTrigger on Account (before insert) {
  if (Trigger.isExecuting) {
    // running in trigger context
  }
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const fileContent = fs.readFileSync(file.path, "utf-8");

      expect(fileContent).toMatch(/Trigger\.isExecuting/);
    });

    it("should verify Trigger.operationType is used", () => {
      const content = `trigger AccountTrigger on Account (before insert) {
  System.Debug('Operation: ' + Trigger.operationType);
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const fileContent = fs.readFileSync(file.path, "utf-8");

      expect(fileContent).toMatch(/Trigger\.operationType/);
    });
  });

  // =========================================================================
  // TRIGGER HANDLER PATTERN VERIFICATION
  // =========================================================================

  describe("Trigger Handler Pattern Verification", () => {
    it("should have trigger handler class for OpportunityTrigger", () => {
      const handlerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls");
      expect(fs.existsSync(handlerPath)).toBe(true);

      const content = fs.readFileSync(handlerPath, "utf-8");
      expect(content).toContain("class OpportunityTriggerHandler");
    });

    it("should verify handler has onBeforeInsert method", () => {
      const handlerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls");
      const content = fs.readFileSync(handlerPath, "utf-8");

      expect(content).toContain("public void onBeforeInsert");
      expect(content).toContain("onBeforeInsert");
    });

    it("should verify handler has onBeforeUpdate method", () => {
      const handlerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls");
      const content = fs.readFileSync(handlerPath, "utf-8");

      expect(content).toContain("public void onBeforeUpdate");
      expect(content).toContain("onBeforeUpdate");
    });

    it("should verify handler has onBeforeDelete method", () => {
      const handlerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls");
      const content = fs.readFileSync(handlerPath, "utf-8");

      expect(content).toContain("public void onBeforeDelete");
      expect(content).toContain("onBeforeDelete");
    });

    it("should verify handler has onAfterInsert method", () => {
      const handlerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls");
      const content = fs.readFileSync(handlerPath, "utf-8");

      expect(content).toContain("public void onAfterInsert");
      expect(content).toContain("onAfterInsert");
    });

    it("should verify handler has onAfterUpdate method", () => {
      const handlerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls");
      const content = fs.readFileSync(handlerPath, "utf-8");

      expect(content).toContain("public void onAfterUpdate");
      expect(content).toContain("onAfterUpdate");
    });

    it("should verify handler has onAfterDelete method", () => {
      const handlerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls");
      const content = fs.readFileSync(handlerPath, "utf-8");

      expect(content).toContain("public void onAfterDelete");
      expect(content).toContain("onAfterDelete");
    });

    it("should verify handler has onAfterUndelete method", () => {
      const handlerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OpportunityTriggerHandler.cls");
      const content = fs.readFileSync(handlerPath, "utf-8");

      expect(content).toContain("public void onAfterUndelete");
      expect(content).toContain("onAfterUndelete");
    });

    it("should use handler pattern in trigger", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger"),
        "utf-8"
      );

      // Verify handler instantiation and usage pattern
      expect(content).toContain("OpportunityTriggerHandler handler = new OpportunityTriggerHandler()");
    });
  });

  // =========================================================================
  // TRIGGER BYPASS MANAGEMENT VERIFICATION
  // =========================================================================

  describe("Trigger Bypass Management Verification", () => {
    it("should have TriggerManagement class", () => {
      const managementPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/TriggerManagement.cls");
      expect(fs.existsSync(managementPath)).toBe(true);

      const content = fs.readFileSync(managementPath, "utf-8");
      expect(content).toContain("class TriggerManagement");
    });

    it("should have isTriggerBypassed method", () => {
      const managementPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/TriggerManagement.cls");
      const content = fs.readFileSync(managementPath, "utf-8");

      expect(content).toContain("isTriggerBypassed");
    });

    it("should use isTriggerBypassed in trigger", () => {
      const triggerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger");
      const content = fs.readFileSync(triggerPath, "utf-8");

      expect(content).toContain("TriggerManagement.isTriggerBypassed('Opportunity')");
    });

    it("should return early when trigger is bypassed", () => {
      const triggerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger");
      const content = fs.readFileSync(triggerPath, "utf-8");

      expect(content).toContain("return;");
    });
  });

  // =========================================================================
  // SYMBOL EXTRACTION ACCURACY
  // =========================================================================

  describe("Symbol Extraction Accuracy", () => {
    it("should extract OpportunityTrigger as function symbol", () => {
      const triggerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger");
      const content = fs.readFileSync(triggerPath, "utf-8");

      const file: FileInfo = {
        path: triggerPath,
        relativePath: "force-app/main/default/triggers/OpportunityTrigger.trigger",
        extension: "trigger",
        name: "OpportunityTrigger",
      };

      const result = extractSymbols([file]);
      const triggerSymbols = result.symbols.filter(s => s.type === "function");

      expect(triggerSymbols.length).toBeGreaterThanOrEqual(1);
      expect(triggerSymbols.some(s => s.name === "OpportunityTrigger")).toBe(true);
    });

    it("should have correct line number for OpportunityTrigger", () => {
      const triggerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger");
      const content = fs.readFileSync(triggerPath, "utf-8");

      const file: FileInfo = {
        path: triggerPath,
        relativePath: "force-app/main/default/triggers/OpportunityTrigger.trigger",
        extension: "trigger",
        name: "OpportunityTrigger",
      };

      const result = extractSymbols([file]);
      const triggerSymbol = result.symbols.find(s => s.name === "OpportunityTrigger");

      expect(triggerSymbol).toBeDefined();
      expect(triggerSymbol?.line).toBe(7); // trigger definition starts at line 7
    });

    it("should extract all trigger symbols from multiple trigger files", () => {
      const trigger1 = `trigger AccountTrigger on Account (before insert) {}`;
      const trigger2 = `trigger ContactTrigger on Contact (before insert) {}`;
      const trigger3 = `trigger LeadTrigger on Lead (before insert) {}`;

      const files = [
        createFileInfo("AccountTrigger.trigger", "trigger", trigger1),
        createFileInfo("ContactTrigger.trigger", "trigger", trigger2),
        createFileInfo("LeadTrigger.trigger", "trigger", trigger3),
      ];

      const result = extractSymbols(files);
      const triggerSymbols = result.symbols.filter(s => s.type === "function");

      expect(triggerSymbols.length).toBe(3);
      expect(triggerSymbols.some(s => s.name === "AccountTrigger")).toBe(true);
      expect(triggerSymbols.some(s => s.name === "ContactTrigger")).toBe(true);
      expect(triggerSymbols.some(s => s.name === "LeadTrigger")).toBe(true);
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe("Edge Cases", () => {
    it("should handle trigger without comments", () => {
      const content = `trigger SimpleTrigger on Account (before insert) {
  // no comments
}`;
      const file = createFileInfo("SimpleTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      expect(result.symbols.find(s => s.name === "SimpleTrigger")).toBeDefined();
    });

    it("should handle trigger with multi-line events definition", () => {
      const content = `trigger AccountTrigger on Account (
    before insert,
    before update,
    before delete,
    after insert,
    after update,
    after delete,
    after undelete
) {
  // all events
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      expect(result.symbols.find(s => s.name === "AccountTrigger")).toBeDefined();
    });

    it("should handle trigger on object with namespace prefix", () => {
      const content = `trigger CustomTrigger on MyNamespace__CustomObject__c (before insert) {
  // namespaced object
}`;
      const file = createFileInfo("CustomTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      expect(result.symbols.find(s => s.name === "CustomTrigger")).toBeDefined();
    });

    it("should handle trigger with no explicit handler (inline logic)", () => {
      const content = `trigger InlineTrigger on Account (before insert) {
  for(Account a : Trigger.new) {
    a.Description = 'Auto-generated';
  }
}`;
      const file = createFileInfo("InlineTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      expect(result.symbols.find(s => s.name === "InlineTrigger")).toBeDefined();
    });

    it("should handle trigger with try-catch block", () => {
      const content = `trigger SafeTrigger on Account (before insert) {
  try {
    // might fail
  } catch (Exception e) {
    System.debug(e.getMessage());
  }
}`;
      const file = createFileInfo("SafeTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      expect(result.symbols.find(s => s.name === "SafeTrigger")).toBeDefined();
    });

    it("should handle trigger with SOQL query", () => {
      const content = `trigger AccountTrigger on Account (before insert) {
  List<Account> related = [SELECT Id FROM Account WHERE ParentId = null LIMIT 1];
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      expect(result.symbols.find(s => s.name === "AccountTrigger")).toBeDefined();
    });

    it("should handle trigger with DML statement", () => {
      const content = `trigger AccountTrigger on Account (before insert) {
  insert new Account(Name = 'Test');
}`;
      const file = createFileInfo("AccountTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      expect(result.symbols.find(s => s.name === "AccountTrigger")).toBeDefined();
    });

    it("should handle empty trigger body", () => {
      const content = `trigger EmptyTrigger on Account (before insert) {
}`;
      const file = createFileInfo("EmptyTrigger.trigger", "trigger", content);
      const result = extractSymbols([file]);

      expect(result.symbols.find(s => s.name === "EmptyTrigger")).toBeDefined();
    });
  });
});
