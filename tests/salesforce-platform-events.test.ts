import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const SALESFORCE_ENTERPRISE_PATH = path.join(process.cwd(), "fixtures/salesforce-enterprise");

describe("Salesforce Platform Events Detection", () => {
  
  // =========================================================================
  // INTEGRATION TESTS - Using real Salesforce Enterprise test project
  // =========================================================================

  describe("Integration: Real Salesforce Enterprise Project", () => {
    it("should detect platformEvents directory", () => {
      const platformEventsDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/platformEvents");
      expect(fs.existsSync(platformEventsDir)).toBe(true);
    });

    it("should detect Order_Event__e.object-meta.xml file", () => {
      const eventPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/platformEvents/Order_Event__e.object-meta.xml");
      expect(fs.existsSync(eventPath)).toBe(true);
    });

    it("should read Order_Event__e metadata successfully", () => {
      const eventPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/platformEvents/Order_Event__e.object-meta.xml");
      const content = fs.readFileSync(eventPath, "utf-8");
      
      expect(content).toContain("<CustomObject xmlns=");
      expect(content).toContain("http://soap.sforce.com/2006/04/metadata");
    });

    it("should detect OrderEventPublisher.cls", () => {
      const classPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OrderEventPublisher.cls");
      expect(fs.existsSync(classPath)).toBe(true);
    });

    it("should detect OrderEventTriggerHandler.cls", () => {
      const classPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OrderEventTriggerHandler.cls");
      expect(fs.existsSync(classPath)).toBe(true);
    });

    it("should detect OrderEventTrigger.trigger", () => {
      const triggerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OrderEventTrigger.trigger");
      expect(fs.existsSync(triggerPath)).toBe(true);
    });
  });

  // =========================================================================
  // PLATFORM EVENT METADATA VERIFICATION
  // =========================================================================

  describe("Order_Event__e Metadata", () => {
    let eventContent: string;

    beforeAll(() => {
      const eventPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/platformEvents/Order_Event__e.object-meta.xml");
      eventContent = fs.readFileSync(eventPath, "utf-8");
    });

    it("should have correct XML declaration", () => {
      expect(eventContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it("should have correct Salesforce namespace", () => {
      expect(eventContent).toContain('xmlns="http://soap.sforce.com/2006/04/metadata"');
    });

    it("should have CustomObject as root element", () => {
      expect(eventContent).toContain("<CustomObject xmlns=");
    });

    it("should have label 'Order Event'", () => {
      expect(eventContent).toContain("<label>Order Event</label>");
    });

    it("should have pluralLabel 'Order Events'", () => {
      expect(eventContent).toContain("<pluralLabel>Order Events</pluralLabel>");
    });

    it("should have publishBehavior 'PublishAfterCommit'", () => {
      expect(eventContent).toContain("<publishBehavior>PublishAfterCommit</publishBehavior>");
    });

    it("should have deploymentStatus 'Deployed'", () => {
      expect(eventContent).toContain("<deploymentStatus>Deployed</deploymentStatus>");
    });

    it("should have eventType 'HighVolume'", () => {
      expect(eventContent).toContain("<eventType>HighVolume</eventType>");
    });

    it("should have description", () => {
      expect(eventContent).toContain("<description>Platform event for order processing notifications</description>");
    });
  });

  // =========================================================================
  // PLATFORM EVENT FIELDS
  // =========================================================================

  describe("Order_Event__e Fields", () => {
    let eventContent: string;

    beforeAll(() => {
      const eventPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/platformEvents/Order_Event__e.object-meta.xml");
      eventContent = fs.readFileSync(eventPath, "utf-8");
    });

    it("should have Order_Number__c field", () => {
      expect(eventContent).toContain("<fullName>Order_Number__c</fullName>");
    });

    it("should have Customer_Id__c field", () => {
      expect(eventContent).toContain("<fullName>Customer_Id__c</fullName>");
    });

    it("should have Total_Amount__c field", () => {
      expect(eventContent).toContain("<fullName>Total_Amount__c</fullName>");
    });

    it("should have Status__c field", () => {
      expect(eventContent).toContain("<fullName>Status__c</fullName>");
    });

    it("should have Order_Number__c as Text type", () => {
      const fieldIdx = eventContent.indexOf("<fullName>Order_Number__c</fullName>");
      const fieldBlock = eventContent.substring(fieldIdx - 100, fieldIdx + 200);
      expect(fieldBlock).toContain("<type>Text</type>");
    });

    it("should have Total_Amount__c as Currency type", () => {
      const fieldIdx = eventContent.indexOf("<fullName>Total_Amount__c</fullName>");
      const fieldBlock = eventContent.substring(fieldIdx - 100, fieldIdx + 200);
      expect(fieldBlock).toContain("<type>Currency</type>");
    });
  });

  // =========================================================================
  // EVENTBUS.publish PATTERNS
  // =========================================================================

  describe("EventBus.publish Patterns", () => {
    let publisherContent: string;

    beforeAll(() => {
      const classPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OrderEventPublisher.cls");
      publisherContent = fs.readFileSync(classPath, "utf-8");
    });

    it("should contain EventBus.publish call", () => {
      expect(publisherContent).toContain("EventBus.publish(event)");
    });

    it("should contain Database.SaveResult for publish result", () => {
      expect(publisherContent).toContain("Database.SaveResult result = EventBus.publish(event)");
    });

    it("should check result.isSuccess()", () => {
      expect(publisherContent).toContain("result.isSuccess()");
    });

    it("should handle publish errors", () => {
      expect(publisherContent).toContain("result.getErrors()");
    });

    it("should have publishOrderCreated method", () => {
      expect(publisherContent).toContain("publishOrderCreated(String orderNumber, Id customerId, Decimal totalAmount)");
    });

    it("should have publishOrderStatusUpdate method", () => {
      expect(publisherContent).toContain("publishOrderStatusUpdate(String orderNumber, String status)");
    });

    it("should have publishBulkEvents method", () => {
      expect(publisherContent).toContain("publishBulkEvents(List<Order_Event__e> events)");
    });
  });

  // =========================================================================
  // PLATFORM EVENT TRIGGER
  // =========================================================================

  describe("OrderEventTrigger", () => {
    let triggerContent: string;

    beforeAll(() => {
      const triggerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OrderEventTrigger.trigger");
      triggerContent = fs.readFileSync(triggerPath, "utf-8");
    });

    it("should have trigger on Order_Event__e", () => {
      expect(triggerContent).toContain("trigger OrderEventTrigger on Order_Event__e");
    });

    it("should handle after insert event", () => {
      expect(triggerContent).toContain("(after insert)");
    });

    it("should call handler class", () => {
      expect(triggerContent).toContain("OrderEventTriggerHandler.handleAfterInsert(Trigger.new)");
    });
  });

  // =========================================================================
  // EVENT TRIGGER HANDLER
  // =========================================================================

  describe("OrderEventTriggerHandler", () => {
    let handlerContent: string;

    beforeAll(() => {
      const classPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/OrderEventTriggerHandler.cls");
      handlerContent = fs.readFileSync(classPath, "utf-8");
    });

    it("should have handleAfterInsert method", () => {
      expect(handlerContent).toContain("handleAfterInsert(List<Order_Event__e> newEvents)");
    });

    it("should process Trigger.new", () => {
      expect(handlerContent).toContain("for (Order_Event__e event : newEvents)");
    });

    it("should check event Status__c", () => {
      expect(handlerContent).toContain("event.Status__c == 'Created'");
    });

    it("should create Task records", () => {
      expect(handlerContent).toContain("List<Task> tasksToCreate");
    });
  });
});
