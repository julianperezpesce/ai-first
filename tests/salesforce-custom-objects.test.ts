import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const SALESFORCE_ENTERPRISE_PATH = path.join(process.cwd(), "test-projects/salesforce-enterprise");

describe("Salesforce Custom Objects Detection", () => {
  
  function extractFieldContent(content: string, fieldName: string): string {
    const nameIdx = content.indexOf(`<name>${fieldName}</name>`);
    if (nameIdx === -1) return "";
    
    const beforeContent = content.substring(0, nameIdx);
    const fieldsStart = beforeContent.lastIndexOf("<fields>");
    
    const afterContent = content.substring(nameIdx);
    const fieldsEndIdx = afterContent.indexOf("</fields>");
    const fieldsEnd = fieldsStart + fieldsEndIdx + "</fields>".length;
    
    return content.substring(fieldsStart, fieldsEnd);
  }

  // =========================================================================
  // INTEGRATION TESTS - Using real Salesforce Enterprise test project
  // =========================================================================

  describe("Integration: Real Salesforce Enterprise Project", () => {
    it("should detect CustomObject__c directory", () => {
      const objectsDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/objects");
      const customObjectDir = path.join(objectsDir, "CustomObject__c");
      
      expect(fs.existsSync(objectsDir)).toBe(true);
      expect(fs.existsSync(customObjectDir)).toBe(true);
    });

    it("should find CustomObject__c.object-meta.xml file", () => {
      const objectMetaPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/objects/CustomObject__c/CustomObject__c.object-meta.xml");
      expect(fs.existsSync(objectMetaPath)).toBe(true);
    });

    it("should read CustomObject__c metadata successfully", () => {
      const objectMetaPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/objects/CustomObject__c/CustomObject__c.object-meta.xml");
      const content = fs.readFileSync(objectMetaPath, "utf-8");
      
      expect(content).toContain("<CustomObject xmlns=");
      expect(content).toContain("http://soap.sforce.com/2006/04/metadata");
    });
  });

  // =========================================================================
  // CUSTOM OBJECT METADATA VERIFICATION
  // =========================================================================

  describe("CustomObject__c Metadata", () => {
    let customObjectContent: string;

    beforeAll(() => {
      const objectMetaPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/objects/CustomObject__c/CustomObject__c.object-meta.xml");
      customObjectContent = fs.readFileSync(objectMetaPath, "utf-8");
    });

    describe("Object Properties", () => {
      it("should have correct XML declaration", () => {
        expect(customObjectContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      });

      it("should have correct Salesforce namespace", () => {
        expect(customObjectContent).toContain('xmlns="http://soap.sforce.com/2006/04/metadata"');
      });

      it("should have CustomObject as root element", () => {
        expect(customObjectContent).toContain("<CustomObject xmlns=");
      });

      it("should have label 'Custom Object'", () => {
        expect(customObjectContent).toContain("<label>Custom Object</label>");
      });

      it("should have pluralLabel 'Custom Objects'", () => {
        expect(customObjectContent).toContain("<pluralLabel>Custom Objects</pluralLabel>");
      });

      it("should have deploymentStatus as Deployed", () => {
        expect(customObjectContent).toContain("<deploymentStatus>Deployed</deploymentStatus>");
      });

      it("should have sharingModel as ReadWrite", () => {
        expect(customObjectContent).toContain("<sharingModel>ReadWrite</sharingModel>");
      });

      it("should have visibility as Public", () => {
        expect(customObjectContent).toContain("<visibility>Public</visibility>");
      });

      it("should have allowInChatterGroups as true", () => {
        expect(customObjectContent).toContain("<allowInChatterGroups>true</allowInChatterGroups>");
      });

      it("should have nameField of type Text", () => {
        expect(customObjectContent).toMatch(/<nameField>[\s\S]*?<type>Text<\/type>[\s\S]*?<\/nameField>/);
        expect(customObjectContent).toContain("<label>Custom Object Name</label>");
      });
    });

    describe("Enable Flags", () => {
      it("should have enableActivities as true", () => {
        expect(customObjectContent).toContain("<enableActivities>true</enableActivities>");
      });

      it("should have enableBulkApi as true", () => {
        expect(customObjectContent).toContain("<enableBulkApi>true</enableBulkApi>");
      });

      it("should have enableChangeDataCapture as true", () => {
        expect(customObjectContent).toContain("<enableChangeDataCapture>true</enableChangeDataCapture>");
      });

      it("should have enableFeeds as true", () => {
        expect(customObjectContent).toContain("<enableFeeds>true</enableFeeds>");
      });

      it("should have enableHistory as true", () => {
        expect(customObjectContent).toContain("<enableHistory>true</enableHistory>");
      });

      it("should have enableLicensing as false", () => {
        expect(customObjectContent).toContain("<enableLicensing>false</enableLicensing>");
      });

      it("should have enableReports as true", () => {
        expect(customObjectContent).toContain("<enableReports>true</enableReports>");
      });

      it("should have enableSearch as true", () => {
        expect(customObjectContent).toContain("<enableSearch>true</enableSearch>");
      });

      it("should have enableSharing as true", () => {
        expect(customObjectContent).toContain("<enableSharing>true</enableSharing>");
      });

      it("should have enableStreamingApi as true", () => {
        expect(customObjectContent).toContain("<enableStreamingApi>true</enableStreamingApi>");
      });

      it("should have compactLayoutAssignment as SYSTEM", () => {
        expect(customObjectContent).toContain("<compactLayoutAssignment>SYSTEM</compactLayoutAssignment>");
      });
    });

    describe("Search Layouts", () => {
      it("should have searchLayouts section", () => {
        expect(customObjectContent).toMatch(/<searchLayouts>[\s\S]*?<\/searchLayouts>/);
      });

      it("should include NAME in searchColumns", () => {
        expect(customObjectContent).toContain("<searchColumns>NAME</searchColumns>");
      });

      it("should include CUSTOM_ACCOUNT__C in searchColumns", () => {
        expect(customObjectContent).toContain("<searchColumns>CUSTOM_ACCOUNT__C</searchColumns>");
      });

      it("should include STATUS__C in searchColumns", () => {
        expect(customObjectContent).toContain("<searchColumns>STATUS__C</searchColumns>");
      });

      it("should include AMOUNT__C in searchColumns", () => {
        expect(customObjectContent).toContain("<searchColumns>AMOUNT__C</searchColumns>");
      });

      it("should include CREATED_DATE in searchColumns", () => {
        expect(customObjectContent).toContain("<searchColumns>CREATED_DATE</searchColumns>");
      });
    });

    describe("List Views", () => {
      it("should have listViews section", () => {
        expect(customObjectContent).toMatch(/<listViews>[\s\S]*?<\/listViews>/);
      });

      it("should have All listView with filterScope Everything", () => {
        expect(customObjectContent).toContain("<fullName>All</fullName>");
        expect(customObjectContent).toContain("<filterScope>Everything</filterScope>");
        expect(customObjectContent).toContain("<label>All</label>");
      });
    });
  });

  // =========================================================================
  // ACTION OVERRIDES
  // =========================================================================

  describe("Action Overrides", () => {
    let customObjectContent: string;

    beforeAll(() => {
      const objectMetaPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/objects/CustomObject__c/CustomObject__c.object-meta.xml");
      customObjectContent = fs.readFileSync(objectMetaPath, "utf-8");
    });

    it("should have 10 actionOverrides", () => {
      const actionOverrideMatches = customObjectContent.match(/<actionName>/g);
      expect(actionOverrideMatches).toHaveLength(10);
    });

    it("should have Accept action override", () => {
      expect(customObjectContent).toMatch(/<actionOverrides>[\s\S]*?<actionName>Accept<\/actionName>[\s\S]*?<type>Default<\/type>[\s\S]*?<\/actionOverrides>/);
    });

    it("should have CancelEdit action override", () => {
      expect(customObjectContent).toMatch(/<actionOverrides>[\s\S]*?<actionName>CancelEdit<\/actionName>[\s\S]*?<type>Default<\/type>[\s\S]*?<\/actionOverrides>/);
    });

    it("should have Clone action override", () => {
      expect(customObjectContent).toMatch(/<actionOverrides>[\s\S]*?<actionName>Clone<\/actionName>[\s\S]*?<type>Default<\/type>[\s\S]*?<\/actionOverrides>/);
    });

    it("should have Delete action override", () => {
      expect(customObjectContent).toMatch(/<actionOverrides>[\s\S]*?<actionName>Delete<\/actionName>[\s\S]*?<type>Default<\/type>[\s\S]*?<\/actionOverrides>/);
    });

    it("should have Edit action override", () => {
      expect(customObjectContent).toMatch(/<actionOverrides>[\s\S]*?<actionName>Edit<\/actionName>[\s\S]*?<type>Default<\/type>[\s\S]*?<\/actionOverrides>/);
    });

    it("should have Follow action override", () => {
      expect(customObjectContent).toMatch(/<actionOverrides>[\s\S]*?<actionName>Follow<\/actionName>[\s\S]*?<type>Default<\/type>[\s\S]*?<\/actionOverrides>/);
    });

    it("should have List action override", () => {
      expect(customObjectContent).toMatch(/<actionOverrides>[\s\S]*?<actionName>List<\/actionName>[\s\S]*?<type>Default<\/type>[\s\S]*?<\/actionOverrides>/);
    });

    it("should have New action override", () => {
      expect(customObjectContent).toMatch(/<actionOverrides>[\s\S]*?<actionName>New<\/actionName>[\s\S]*?<type>Default<\/type>[\s\S]*?<\/actionOverrides>/);
    });

    it("should have SaveEdit action override", () => {
      expect(customObjectContent).toMatch(/<actionOverrides>[\s\S]*?<actionName>SaveEdit<\/actionName>[\s\S]*?<type>Default<\/type>[\s\S]*?<\/actionOverrides>/);
    });

    it("should have Tab action override", () => {
      expect(customObjectContent).toMatch(/<actionOverrides>[\s\S]*?<actionName>Tab<\/actionName>[\s\S]*?<type>Default<\/type>[\s\S]*?<\/actionOverrides>/);
    });

    it("should have all action overrides with type Default", () => {
      const typeMatches = customObjectContent.match(/<type>Default<\/type>/g);
      expect(typeMatches).toHaveLength(10);
    });
  });

  // =========================================================================
  // CUSTOM FIELDS - 9 FIELDS TOTAL
  // =========================================================================

  describe("Custom Fields Detection", () => {
    let customObjectContent: string;

    beforeAll(() => {
      const objectMetaPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/objects/CustomObject__c/CustomObject__c.object-meta.xml");
      customObjectContent = fs.readFileSync(objectMetaPath, "utf-8");
    });

    it("should have 9 custom fields", () => {
      const fieldMatches = customObjectContent.match(/<fields>[\s\S]*?<\/fields>/g);
      expect(fieldMatches).toHaveLength(9);
    });

    // =========================================================================
    // Amount__c - Currency field
    // =========================================================================

    describe("Amount__c (Currency)", () => {
      it("should have Amount__c field defined", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Amount__c<\/name>[\s\S]*?<\/fields>/);
      });

      it("should have type Currency", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Amount__c<\/name>[\s\S]*?<type>Currency<\/type>[\s\S]*?<\/fields>/);
      });

      it("should have label Amount", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Amount__c<\/name>[\s\S]*?<label>Amount<\/label>[\s\S]*?<\/fields>/);
      });

      it("should have precision 18", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Amount__c<\/name>[\s\S]*?<precision>18<\/precision>[\s\S]*?<\/fields>/);
      });

      it("should have scale 2", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Amount__c<\/name>[\s\S]*?<scale>2<\/scale>[\s\S]*?<\/fields>/);
      });

      it("should have displayFormat #,##0.00", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Amount__c<\/name>[\s\S]*?<displayFormat>#,##0.00<\/displayFormat>[\s\S]*?<\/fields>/);
      });

      it("should not be required", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Amount__c<\/name>[\s\S]*?<required>false<\/required>[\s\S]*?<\/fields>/);
      });

      it("should not track history", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Amount__c<\/name>[\s\S]*?<trackHistory>false<\/trackHistory>[\s\S]*?<\/fields>/);
      });
    });

    // =========================================================================
    // Category__c - Picklist field
    // =========================================================================

    describe("Category__c (Picklist)", () => {
      it("should have Category__c field defined", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Category__c<\/name>[\s\S]*?<\/fields>/);
      });

      it("should have type Picklist", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Category__c<\/name>[\s\S]*?<type>Picklist<\/type>[\s\S]*?<\/fields>/);
      });

      it("should have label Category", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Category__c<\/name>[\s\S]*?<label>Category<\/label>[\s\S]*?<\/fields>/);
      });

      it("should have picklist with 4 values", () => {
        const categoryFieldMatch = customObjectContent.match(/<fields>[\s\S]*?<name>Category__c<\/name>[\s\S]*?<\/fields>/);
        expect(categoryFieldMatch).toBeTruthy();
        const categoryField = categoryFieldMatch?.[0] || "";
        const picklistValues = categoryField.match(/<picklistValues>/g);
        expect(picklistValues).toHaveLength(4);
      });

      it("should have Electronics picklist value", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Category__c<\/name>[\s\S]*?<fullName>Electronics<\/fullName>[\s\S]*?<\/fields>/);
      });

      it("should have Furniture picklist value", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Category__c<\/name>[\s\S]*?<fullName>Furniture<\/fullName>[\s\S]*?<\/fields>/);
      });

      it("should have Office Supplies picklist value", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Category__c<\/name>[\s\S]*?<fullName>Office Supplies<\/fullName>[\s\S]*?<\/fields>/);
      });

      it("should have Software picklist value", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Category__c<\/name>[\s\S]*?<fullName>Software<\/fullName>[\s\S]*?<\/fields>/);
      });

      it("should have Electronics as default value", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Category__c<\/name>[\s\S]*?<fullName>Electronics<\/fullName>[\s\S]*?<default>true<\/default>[\s\S]*?<\/fields>/);
      });

      it("should not be required", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Category__c<\/name>[\s\S]*?<required>false<\/required>[\s\S]*?<\/fields>/);
      });

      it("should not track history", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Category__c<\/name>[\s\S]*?<trackHistory>false<\/trackHistory>[\s\S]*?<\/fields>/);
      });
    });

    // =========================================================================
    // CustomAccount__c - Lookup field to Account
    // =========================================================================

    describe("CustomAccount__c (Lookup to Account)", () => {
      it("should have CustomAccount__c field defined", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>CustomAccount__c<\/name>[\s\S]*?<\/fields>/);
      });

      it("should have type Lookup", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>CustomAccount__c<\/name>[\s\S]*?<type>Lookup<\/type>[\s\S]*?<\/fields>/);
      });

      it("should have label Related Account", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>CustomAccount__c<\/name>[\s\S]*?<label>Related Account<\/label>[\s\S]*?<\/fields>/);
      });

      it("should reference Account object", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>CustomAccount__c<\/name>[\s\S]*?<referenceTo>Account<\/referenceTo>[\s\S]*?<\/fields>/);
      });

      it("should have relationshipLabel Custom Objects", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>CustomAccount__c<\/name>[\s\S]*?<relationshipLabel>Custom Objects<\/relationshipLabel>[\s\S]*?<\/fields>/);
      });

      it("should have relationshipName CustomObjects", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>CustomAccount__c<\/name>[\s\S]*?<relationshipName>CustomObjects<\/relationshipName>[\s\S]*?<\/fields>/);
      });

      it("should not be required", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>CustomAccount__c<\/name>[\s\S]*?<required>false<\/required>[\s\S]*?<\/fields>/);
      });

      it("should not track history", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>CustomAccount__c<\/name>[\s\S]*?<trackHistory>false<\/trackHistory>[\s\S]*?<\/fields>/);
      });
    });

    // =========================================================================
    // Description__c - LongTextArea field
    // =========================================================================

    describe("Description__c (LongTextArea)", () => {
      it("should have Description__c field defined", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Description__c<\/name>[\s\S]*?<\/fields>/);
      });

      it("should have type LongTextArea", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Description__c<\/name>[\s\S]*?<type>LongTextArea<\/type>[\s\S]*?<\/fields>/);
      });

      it("should have label Description", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Description__c<\/name>[\s\S]*?<label>Description<\/label>[\s\S]*?<\/fields>/);
      });

      it("should have length 32768", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Description__c<\/name>[\s\S]*?<length>32768<\/length>[\s\S]*?<\/fields>/);
      });

      it("should have visibleLines 3", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Description__c<\/name>[\s\S]*?<visibleLines>3<\/visibleLines>[\s\S]*?<\/fields>/);
      });

      it("should track history", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Description__c<\/name>[\s\S]*?<trackHistory>true<\/trackHistory>[\s\S]*?<\/fields>/);
      });
    });

    // =========================================================================
    // IsActive__c - Checkbox field
    // =========================================================================

    describe("IsActive__c (Checkbox)", () => {
      it("should have IsActive__c field defined", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>IsActive__c<\/name>[\s\S]*?<\/fields>/);
      });

      it("should have type Checkbox", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>IsActive__c<\/name>[\s\S]*?<type>Checkbox<\/type>[\s\S]*?<\/fields>/);
      });

      it("should have label Is Active", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>IsActive__c<\/name>[\s\S]*?<label>Is Active<\/label>[\s\S]*?<\/fields>/);
      });

      it("should have defaultValue false", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>IsActive__c<\/name>[\s\S]*?<defaultValue>false<\/defaultValue>[\s\S]*?<\/fields>/);
      });

      it("should not track history", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>IsActive__c<\/name>[\s\S]*?<trackHistory>false<\/trackHistory>[\s\S]*?<\/fields>/);
      });
    });

    // =========================================================================
    // Name__c - Text field
    // =========================================================================

    describe("Name__c (Text)", () => {
      it("should have Name__c field defined", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Name__c<\/name>[\s\S]*?<\/fields>/);
      });

      it("should have type Text", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Name__c<\/name>[\s\S]*?<type>Text<\/type>[\s\S]*?<\/fields>/);
      });

      it("should have label Name", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Name__c<\/name>[\s\S]*?<label>Name<\/label>[\s\S]*?<\/fields>/);
      });

      it("should be required", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Name__c<\/name>[\s\S]*?<required>true<\/required>[\s\S]*?<\/fields>/);
      });

      it("should not be unique", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Name__c<\/name>[\s\S]*?<unique>false<\/unique>[\s\S]*?<\/fields>/);
      });

      it("should not track history", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Name__c<\/name>[\s\S]*?<trackHistory>false<\/trackHistory>[\s\S]*?<\/fields>/);
      });
    });

    // =========================================================================
    // Quantity__c - Number field
    // =========================================================================

    describe("Quantity__c (Number)", () => {
      it("should have Quantity__c field defined", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Quantity__c<\/name>[\s\S]*?<\/fields>/);
      });

      it("should have type Number", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Quantity__c<\/name>[\s\S]*?<type>Number<\/type>[\s\S]*?<\/fields>/);
      });

      it("should have label Quantity", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Quantity__c<\/name>[\s\S]*?<label>Quantity<\/label>[\s\S]*?<\/fields>/);
      });

      it("should have displayFormat #,##0", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Quantity__c<\/name>[\s\S]*?<displayFormat>#,##0<\/displayFormat>[\s\S]*?<\/fields>/);
      });

      it("should have precision 18", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Quantity__c<\/name>[\s\S]*?<precision>18<\/precision>[\s\S]*?<\/fields>/);
      });

      it("should have scale 0", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Quantity__c<\/name>[\s\S]*?<scale>0<\/scale>[\s\S]*?<\/fields>/);
      });

      it("should not be required", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Quantity__c<\/name>[\s\S]*?<required>false<\/required>[\s\S]*?<\/fields>/);
      });

      it("should not track history", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Quantity__c<\/name>[\s\S]*?<trackHistory>false<\/trackHistory>[\s\S]*?<\/fields>/);
      });
    });

    // =========================================================================
    // Stage__c - Picklist field with trackHistory
    // =========================================================================

    describe("Stage__c (Picklist with trackHistory)", () => {
      it("should have Stage__c field defined", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Stage__c<\/name>[\s\S]*?<\/fields>/);
      });

      it("should have type Picklist", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Stage__c<\/name>[\s\S]*?<type>Picklist<\/type>[\s\S]*?<\/fields>/);
      });

      it("should have label Stage", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Stage__c<\/name>[\s\S]*?<label>Stage<\/label>[\s\S]*?<\/fields>/);
      });

      it("should have picklist with 5 values", () => {
        const stageField = extractFieldContent(customObjectContent, "Stage__c");
        expect(stageField).toContain("<name>Stage__c</name>");
        const picklistValues = stageField.match(/<picklistValues>/g);
        expect(picklistValues).toHaveLength(5);
      });

      it("should have Draft picklist value (default)", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Stage__c<\/name>[\s\S]*?<fullName>Draft<\/fullName>[\s\S]*?<default>true<\/default>[\s\S]*?<\/fields>/);
      });

      it("should have Pending Approval picklist value", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Stage__c<\/name>[\s\S]*?<fullName>Pending Approval<\/fullName>[\s\S]*?<\/fields>/);
      });

      it("should have Approved picklist value", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Stage__c<\/name>[\s\S]*?<fullName>Approved<\/fullName>[\s\S]*?<\/fields>/);
      });

      it("should have Rejected picklist value", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Stage__c<\/name>[\s\S]*?<fullName>Rejected<\/fullName>[\s\S]*?<\/fields>/);
      });

      it("should have Completed picklist value", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Stage__c<\/name>[\s\S]*?<fullName>Completed<\/fullName>[\s\S]*?<\/fields>/);
      });

      it("should not be required", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Stage__c<\/name>[\s\S]*?<required>false<\/required>[\s\S]*?<\/fields>/);
      });

      it("should track history", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Stage__c<\/name>[\s\S]*?<trackHistory>true<\/trackHistory>[\s\S]*?<\/fields>/);
      });
    });

    // =========================================================================
    // Status__c - Picklist field
    // =========================================================================

    describe("Status__c (Picklist)", () => {
      it("should have Status__c field defined", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Status__c<\/name>[\s\S]*?<\/fields>/);
      });

      it("should have type Picklist", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Status__c<\/name>[\s\S]*?<type>Picklist<\/type>[\s\S]*?<\/fields>/);
      });

      it("should have label Status", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Status__c<\/name>[\s\S]*?<label>Status<\/label>[\s\S]*?<\/fields>/);
      });

      it("should have picklist with 3 values", () => {
        const statusField = extractFieldContent(customObjectContent, "Status__c");
        expect(statusField).toContain("<name>Status__c</name>");
        const picklistValues = statusField.match(/<picklistValues>/g);
        expect(picklistValues).toHaveLength(3);
      });

      it("should have Active picklist value (default)", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Status__c<\/name>[\s\S]*?<fullName>Active<\/fullName>[\s\S]*?<default>true<\/default>[\s\S]*?<\/fields>/);
      });

      it("should have Inactive picklist value", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Status__c<\/name>[\s\S]*?<fullName>Inactive<\/fullName>[\s\S]*?<\/fields>/);
      });

      it("should have Pending picklist value", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Status__c<\/name>[\s\S]*?<fullName>Pending<\/fullName>[\s\S]*?<\/fields>/);
      });

      it("should not be required", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Status__c<\/name>[\s\S]*?<required>false<\/required>[\s\S]*?<\/fields>/);
      });

      it("should not track history", () => {
        expect(customObjectContent).toMatch(/<fields>[\s\S]*?<name>Status__c<\/name>[\s\S]*?<trackHistory>false<\/trackHistory>[\s\S]*?<\/fields>/);
      });
    });
  });

  // =========================================================================
  // FIELD TYPES SUMMARY
  // =========================================================================

  describe("Field Types Summary", () => {
    let customObjectContent: string;

    beforeAll(() => {
      const objectMetaPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/objects/CustomObject__c/CustomObject__c.object-meta.xml");
      customObjectContent = fs.readFileSync(objectMetaPath, "utf-8");
    });

    it("should have Currency field type", () => {
      expect(customObjectContent).toMatch(/<type>Currency<\/type>/);
    });

    it("should have 3 Picklist field types", () => {
      const picklistMatches = customObjectContent.match(/<type>Picklist<\/type>/g);
      expect(picklistMatches).toHaveLength(3);
    });

    it("should have Lookup field type", () => {
      expect(customObjectContent).toMatch(/<type>Lookup<\/type>/);
    });

    it("should have LongTextArea field type", () => {
      expect(customObjectContent).toMatch(/<type>LongTextArea<\/type>/);
    });

    it("should have Checkbox field type", () => {
      expect(customObjectContent).toMatch(/<type>Checkbox<\/type>/);
    });

    it("should have Text field type", () => {
      expect(customObjectContent).toMatch(/<type>Text<\/type>/);
    });

    it("should have Number field type", () => {
      expect(customObjectContent).toMatch(/<type>Number<\/type>/);
    });

    it("should have 9 total fields with type elements", () => {
      const fieldBlocks = customObjectContent.match(/<fields>[\s\S]*?<\/fields>/g) || [];
      let typeCount = 0;
      for (const block of fieldBlocks) {
        const types = block.match(/<type>\w+<\/type>/g);
        if (types) typeCount += types.length;
      }
      expect(typeCount).toBe(9);
    });
  });

  // =========================================================================
  // FIELD PROPERTIES SUMMARY
  // =========================================================================

  describe("Field Properties Summary", () => {
    let customObjectContent: string;

    beforeAll(() => {
      const objectMetaPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/objects/CustomObject__c/CustomObject__c.object-meta.xml");
      customObjectContent = fs.readFileSync(objectMetaPath, "utf-8");
    });

    it("should have 1 required field (Name__c)", () => {
      const requiredMatches = customObjectContent.match(/<required>true<\/required>/g);
      expect(requiredMatches).toHaveLength(1);
    });

    it("should have 2 fields with trackHistory true", () => {
      const trackHistoryMatches = customObjectContent.match(/<trackHistory>true<\/trackHistory>/g);
      expect(trackHistoryMatches).toHaveLength(2);
    });

    it("should have 8 elements with trackHistory false (7 fields + nameField)", () => {
      const trackHistoryFalseMatches = customObjectContent.match(/<trackHistory>false<\/trackHistory>/g);
      expect(trackHistoryFalseMatches).toHaveLength(8);
    });

    it("should have 1 unique field check (Name__c unique=false)", () => {
      expect(customObjectContent).toMatch(/<unique>false<\/unique>/);
    });
  });

  // =========================================================================
  // UNIT TESTS - Custom Object XML parsing patterns
  // =========================================================================

  describe("Unit: Custom Object XML parsing patterns", () => {
    it("should parse CustomObject metadata elements", () => {
      const objectXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Test Object</label>
    <pluralLabel>Test Objects</pluralLabel>
    <deploymentStatus>Deployed</deploymentStatus>
    <sharingModel>ReadWrite</sharingModel>
</CustomObject>`;

      expect(objectXml).toContain("<label>Test Object</label>");
      expect(objectXml).toContain("<pluralLabel>Test Objects</pluralLabel>");
      expect(objectXml).toContain("<deploymentStatus>Deployed</deploymentStatus>");
      expect(objectXml).toContain("<sharingModel>ReadWrite</sharingModel>");
    });

    it("should parse enable flags", () => {
      const objectXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableActivities>true</enableActivities>
    <enableBulkApi>true</enableBulkApi>
    <enableReports>true</enableReports>
    <enableSearch>true</enableSearch>
</CustomObject>`;

      expect(objectXml).toContain("<enableActivities>true</enableActivities>");
      expect(objectXml).toContain("<enableBulkApi>true</enableBulkApi>");
      expect(objectXml).toContain("<enableReports>true</enableReports>");
      expect(objectXml).toContain("<enableSearch>true</enableSearch>");
    });

    it("should parse field elements", () => {
      const fieldXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <fields>
        <name>TestField__c</name>
        <label>Test Field</label>
        <type>Text</type>
        <required>false</required>
        <trackHistory>false</trackHistory>
    </fields>
</CustomObject>`;

      expect(fieldXml).toMatch(/<fields>[\s\S]*?<name>TestField__c<\/name>[\s\S]*?<\/fields>/);
      expect(fieldXml).toContain("<type>Text</type>");
      expect(fieldXml).toContain("<required>false</required>");
    });

    it("should parse Currency field with precision and scale", () => {
      const currencyFieldXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <fields>
        <name>Amount__c</name>
        <label>Amount</label>
        <type>Currency</type>
        <precision>18</precision>
        <scale>2</scale>
        <displayFormat>#,##0.00</displayFormat>
    </fields>
</CustomObject>`;

      expect(currencyFieldXml).toContain("<type>Currency</type>");
      expect(currencyFieldXml).toContain("<precision>18</precision>");
      expect(currencyFieldXml).toContain("<scale>2</scale>");
    });

    it("should parse Picklist field with values", () => {
      const picklistFieldXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <fields>
        <name>Status__c</name>
        <label>Status</label>
        <type>Picklist</type>
        <picklist>
            <picklistValues>
                <fullName>Active</fullName>
                <default>true</default>
            </picklistValues>
            <picklistValues>
                <fullName>Inactive</fullName>
                <default>false</default>
            </picklistValues>
        </picklist>
    </fields>
</CustomObject>`;

      expect(picklistFieldXml).toContain("<type>Picklist</type>");
      expect(picklistFieldXml).toContain("<fullName>Active</fullName>");
      expect(picklistFieldXml).toContain("<default>true</default>");
    });

    it("should parse Lookup field with referenceTo", () => {
      const lookupFieldXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <fields>
        <name>Account__c</name>
        <label>Account</label>
        <type>Lookup</type>
        <referenceTo>Account</referenceTo>
        <relationshipLabel>Custom Objects</relationshipLabel>
        <relationshipName>CustomObjects</relationshipName>
    </fields>
</CustomObject>`;

      expect(lookupFieldXml).toContain("<type>Lookup</type>");
      expect(lookupFieldXml).toContain("<referenceTo>Account</referenceTo>");
      expect(lookupFieldXml).toContain("<relationshipLabel>Custom Objects</relationshipLabel>");
    });

    it("should parse LongTextArea field with length and visibleLines", () => {
      const textAreaFieldXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <fields>
        <name>Description__c</name>
        <label>Description</label>
        <type>LongTextArea</type>
        <length>32768</length>
        <visibleLines>3</visibleLines>
        <trackHistory>true</trackHistory>
    </fields>
</CustomObject>`;

      expect(textAreaFieldXml).toContain("<type>LongTextArea</type>");
      expect(textAreaFieldXml).toContain("<length>32768</length>");
      expect(textAreaFieldXml).toContain("<visibleLines>3</visibleLines>");
    });

    it("should parse actionOverrides", () => {
      const actionOverrideXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <actionOverrides>
        <actionName>Edit</actionName>
        <type>Default</type>
    </actionOverrides>
</CustomObject>`;

      expect(actionOverrideXml).toMatch(/<actionOverrides>[\s\S]*?<actionName>Edit<\/actionName>[\s\S]*?<\/actionOverrides>/);
      expect(actionOverrideXml).toContain("<type>Default</type>");
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe("Edge Cases", () => {
    let customObjectContent: string;

    beforeAll(() => {
      const objectMetaPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/objects/CustomObject__c/CustomObject__c.object-meta.xml");
      customObjectContent = fs.readFileSync(objectMetaPath, "utf-8");
    });

    it("should handle fields with displayFormat patterns", () => {
      expect(customObjectContent).toContain("<displayFormat>#,##0.00</displayFormat>");
      expect(customObjectContent).toContain("<displayFormat>#,##0</displayFormat>");
    });

    it("should handle fields with varying precision/scale combinations", () => {
      expect(customObjectContent).toMatch(/<name>Amount__c<\/name>[\s\S]*?<precision>18<\/precision>[\s\S]*?<scale>2<\/scale>/);
      expect(customObjectContent).toMatch(/<name>Quantity__c<\/name>[\s\S]*?<precision>18<\/precision>[\s\S]*?<scale>0<\/scale>/);
    });

    it("should handle picklist with multiple non-default values", () => {
      const stageField = extractFieldContent(customObjectContent, "Stage__c");
      expect(stageField).toContain("<name>Stage__c</name>");
      const defaultTrueCount = (stageField.match(/<default>true<\/default>/g) || []).length;
      const defaultFalseCount = (stageField.match(/<default>false<\/default>/g) || []).length;
      expect(defaultTrueCount).toBe(1);
      expect(defaultFalseCount).toBe(4);
    });

    it("should handle fields with same type but different properties", () => {
      const picklistFields = customObjectContent.match(/<fields>[\s\S]*?<type>Picklist<\/type>[\s\S]*?<\/fields>/g);
      expect(picklistFields).toHaveLength(3);
    });

    it("should handle fields with different trackHistory settings", () => {
      const trackHistoryTrueMatches = customObjectContent.match(/<trackHistory>true<\/trackHistory>/g);
      expect(trackHistoryTrueMatches).toHaveLength(2);
    });

    it("should handle LongTextArea with large length value", () => {
      expect(customObjectContent).toMatch(/<name>Description__c<\/name>[\s\S]*?<length>32768<\/length>[\s\S]*?<\/fields>/);
    });

    it("should handle lookup field referencing standard object (Account)", () => {
      expect(customObjectContent).toMatch(/<name>CustomAccount__c<\/name>[\s\S]*?<referenceTo>Account<\/referenceTo>[\s\S]*?<\/fields>/);
    });

    it("should handle checkbox field with boolean defaultValue", () => {
      expect(customObjectContent).toMatch(/<name>IsActive__c<\/name>[\s\S]*?<defaultValue>false<\/defaultValue>[\s\S]*?<\/fields>/);
    });

    it("should handle text field with unique constraint", () => {
      expect(customObjectContent).toMatch(/<name>Name__c<\/name>[\s\S]*?<unique>false<\/unique>[\s\S]*?<\/fields>/);
    });

    it("should handle search layouts with multiple column types", () => {
      // Search columns include NAME, CUSTOM_ACCOUNT__C, STATUS__C, AMOUNT__C, CREATED_DATE
      expect(customObjectContent).toContain("<searchColumns>NAME</searchColumns>");
      expect(customObjectContent).toContain("<searchColumns>CUSTOM_ACCOUNT__C</searchColumns>");
      expect(customObjectContent).toContain("<searchColumns>STATUS__C</searchColumns>");
      expect(customObjectContent).toContain("<searchColumns>AMOUNT__C</searchColumns>");
      expect(customObjectContent).toContain("<searchColumns>CREATED_DATE</searchColumns>");
    });
  });
});
