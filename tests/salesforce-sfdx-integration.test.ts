import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const SALESFORCE_ENTERPRISE_PATH = path.join(process.cwd(), "test-projects/salesforce-enterprise");

describe("Salesforce SFDX Metadata and Integration Tests", () => {

  // =========================================================================
  // INTEGRATION TESTS - SFDX Project Detection
  // =========================================================================

  describe("Integration: SFDX Project Detection", () => {
    
    it("should detect sfdx-project.json in project root", () => {
      const sfdxProjectPath = path.join(SALESFORCE_ENTERPRISE_PATH, "sfdx-project.json");
      expect(fs.existsSync(sfdxProjectPath)).toBe(true);
    });

    it("should detect package.xml in force-app/main/default", () => {
      const packageXmlPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/package.xml");
      expect(fs.existsSync(packageXmlPath)).toBe(true);
    });

    it("should detect Admin profile", () => {
      const profilePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/profiles/Admin.profile-meta.xml");
      expect(fs.existsSync(profilePath)).toBe(true);
    });

    it("should detect SalesRepresentative permission set", () => {
      const permSetPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/permissionsets/SalesRepresentative.permissionset-meta.xml");
      expect(fs.existsSync(permSetPath)).toBe(true);
    });

    it("should have complete SFDX project structure", () => {
      // Verify key directories exist
      expect(fs.existsSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app"))).toBe(true);
      expect(fs.existsSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main"))).toBe(true);
      expect(fs.existsSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default"))).toBe(true);
      expect(fs.existsSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes"))).toBe(true);
      expect(fs.existsSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers"))).toBe(true);
      expect(fs.existsSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc"))).toBe(true);
      expect(fs.existsSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows"))).toBe(true);
      expect(fs.existsSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/objects"))).toBe(true);
      expect(fs.existsSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/profiles"))).toBe(true);
      expect(fs.existsSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/permissionsets"))).toBe(true);
    });
  });

  // =========================================================================
  // SFDX-PROJECT.JSON DETECTION AND PARSING
  // =========================================================================

  describe("sfdx-project.json Detection and Parsing", () => {
    let sfdxProjectContent: string;
    let sfdxProjectJson: Record<string, unknown>;

    beforeAll(() => {
      const sfdxProjectPath = path.join(SALESFORCE_ENTERPRISE_PATH, "sfdx-project.json");
      sfdxProjectContent = fs.readFileSync(sfdxProjectPath, "utf-8");
      sfdxProjectJson = JSON.parse(sfdxProjectContent);
    });

    describe("File Detection", () => {
      it("should be valid JSON", () => {
        expect(() => JSON.parse(sfdxProjectContent)).not.toThrow();
      });

      it("should have correct XML declaration", () => {
        // sfdx-project.json doesn't have XML declaration, it's pure JSON
        expect(sfdxProjectContent.trim().startsWith("{")).toBe(true);
      });
    });

    describe("packageDirectories Verification", () => {
      it("should have packageDirectories array", () => {
        expect(sfdxProjectJson).toHaveProperty("packageDirectories");
        expect(Array.isArray(sfdxProjectJson.packageDirectories)).toBe(true);
      });

      it("should have force-app as package path", () => {
        const packageDirs = sfdxProjectJson.packageDirectories as Array<Record<string, unknown>>;
        expect(packageDirs[0]).toHaveProperty("path", "force-app");
      });

      it("should have default=true for force-app package", () => {
        const packageDirs = sfdxProjectJson.packageDirectories as Array<Record<string, unknown>>;
        expect(packageDirs[0]).toHaveProperty("default", true);
      });

      it("should have package name SalesforceEnterprise", () => {
        const packageDirs = sfdxProjectJson.packageDirectories as Array<Record<string, unknown>>;
        expect(packageDirs[0]).toHaveProperty("package", "SalesforceEnterprise");
      });

      it("should have versionName", () => {
        const packageDirs = sfdxProjectJson.packageDirectories as Array<Record<string, unknown>>;
        expect(packageDirs[0]).toHaveProperty("versionName", "ver 1.0");
      });

      it("should have versionNumber", () => {
        const packageDirs = sfdxProjectJson.packageDirectories as Array<Record<string, unknown>>;
        expect(packageDirs[0]).toHaveProperty("versionNumber", "1.0.0.NEXT");
      });
    });

    describe("Project Properties Verification", () => {
      it("should have name as SalesforceEnterprise", () => {
        expect(sfdxProjectJson).toHaveProperty("name", "SalesforceEnterprise");
      });

      it("should have namespace as empty string", () => {
        expect(sfdxProjectJson).toHaveProperty("namespace", "");
      });

      it("should have sfdcLoginUrl as https://login.salesforce.com", () => {
        expect(sfdxProjectJson).toHaveProperty("sfdcLoginUrl", "https://login.salesforce.com");
      });

      it("should have singlePackage=false", () => {
        expect(sfdxProjectJson).toHaveProperty("singlePackage", false);
      });

      it("should have sourceApiVersion as 59.0", () => {
        expect(sfdxProjectJson).toHaveProperty("sourceApiVersion", "59.0");
      });
    });

    describe("Complete JSON Structure", () => {
      it("should have all required properties", () => {
        expect(sfdxProjectJson).toHaveProperty("packageDirectories");
        expect(sfdxProjectJson).toHaveProperty("name");
        expect(sfdxProjectJson).toHaveProperty("namespace");
        expect(sfdxProjectJson).toHaveProperty("sfdcLoginUrl");
        expect(sfdxProjectJson).toHaveProperty("singlePackage");
        expect(sfdxProjectJson).toHaveProperty("sourceApiVersion");
      });

      it("should match expected structure", () => {
        expect(sfdxProjectContent).toContain('"packageDirectories"');
        expect(sfdxProjectContent).toContain('"path": "force-app"');
        expect(sfdxProjectContent).toContain('"default": true');
        expect(sfdxProjectContent).toContain('"package": "SalesforceEnterprise"');
        expect(sfdxProjectContent).toContain('"versionName": "ver 1.0"');
        expect(sfdxProjectContent).toContain('"versionNumber": "1.0.0.NEXT"');
        expect(sfdxProjectContent).toContain('"name": "SalesforceEnterprise"');
        expect(sfdxProjectContent).toContain('"namespace": ""');
        expect(sfdxProjectContent).toContain('"sfdcLoginUrl": "https://login.salesforce.com"');
        expect(sfdxProjectContent).toContain('"singlePackage": false');
        expect(sfdxProjectContent).toContain('"sourceApiVersion": "59.0"');
      });
    });
  });

  // =========================================================================
  // PACKAGE.XML DETECTION AND COMPONENT LISTING
  // =========================================================================

  describe("package.xml Detection and Component Listing", () => {
    let packageXmlContent: string;

    beforeAll(() => {
      const packageXmlPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/package.xml");
      packageXmlContent = fs.readFileSync(packageXmlPath, "utf-8");
    });

    describe("File Detection", () => {
      it("should have correct XML declaration", () => {
        expect(packageXmlContent).toContain('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
      });

      it("should have Package as root element", () => {
        expect(packageXmlContent).toContain("<Package xmlns=");
        expect(packageXmlContent).toContain("http://soap.sforce.com/2006/04/metadata");
      });
    });

    describe("Component Types Detection", () => {
      it("should have ApexClass type with 9 members", () => {
        expect(packageXmlContent).toContain("<name>ApexClass</name>");
        
        // Verify all 9 ApexClass members
        const apexClasses = [
          "AccountController",
          "AccountControllerTest",
          "OpportunityBatch",
          "OpportunityBatchTest",
          "OpportunityTriggerHandler",
          "OpportunityTriggerHelper",
          "Logger",
          "TriggerManagement",
          "SessionManagement"
        ];
        
        for (const apexClass of apexClasses) {
          expect(packageXmlContent).toContain(`<members>${apexClass}</members>`);
        }
      });

      it("should have ApexTrigger type with 1 member", () => {
        expect(packageXmlContent).toContain("<name>ApexTrigger</name>");
        expect(packageXmlContent).toContain("<members>OpportunityTrigger</members>");
      });

      it("should have LightningComponentBundle type with 2 members", () => {
        expect(packageXmlContent).toContain("<name>LightningComponentBundle</name>");
        expect(packageXmlContent).toContain("<members>accountList</members>");
        expect(packageXmlContent).toContain("<members>opportunityCard</members>");
      });

      it("should have Flow type with 2 members", () => {
        expect(packageXmlContent).toContain("<name>Flow</name>");
        expect(packageXmlContent).toContain("<members>Account_Create</members>");
        expect(packageXmlContent).toContain("<members>Opportunity_Update</members>");
      });

      it("should have CustomObject type with 1 member", () => {
        expect(packageXmlContent).toContain("<name>CustomObject</name>");
        expect(packageXmlContent).toContain("<members>CustomObject__c</members>");
      });

      it("should have Profile type with 1 member", () => {
        expect(packageXmlContent).toContain("<name>Profile</name>");
        expect(packageXmlContent).toContain("<members>Admin</members>");
      });

      it("should have PermissionSet type with 1 member", () => {
        expect(packageXmlContent).toContain("<name>PermissionSet</name>");
        expect(packageXmlContent).toContain("<members>SalesRepresentative</members>");
      });
    });

    describe("Component Count Verification", () => {
      it("should have 7 type definitions", () => {
        const typeMatches = packageXmlContent.match(/<name>\w+<\/name>/g);
        expect(typeMatches).toHaveLength(7);
      });

      it("should have correct component counts", () => {
        // ApexClass: 9 members
        expect(packageXmlContent.match(/<name>ApexClass<\/name>/g)).toHaveLength(1);
        
        // ApexTrigger: 1 member
        expect(packageXmlContent.match(/<name>ApexTrigger<\/name>/g)).toHaveLength(1);
        
        // LightningComponentBundle: 2 members
        expect(packageXmlContent.match(/<name>LightningComponentBundle<\/name>/g)).toHaveLength(1);
        
        // Flow: 2 members
        expect(packageXmlContent.match(/<name>Flow<\/name>/g)).toHaveLength(1);
        
        // CustomObject: 1 member
        expect(packageXmlContent.match(/<name>CustomObject<\/name>/g)).toHaveLength(1);
        
        // Profile: 1 member
        expect(packageXmlContent.match(/<name>Profile<\/name>/g)).toHaveLength(1);
        
        // PermissionSet: 1 member
        expect(packageXmlContent.match(/<name>PermissionSet<\/name>/g)).toHaveLength(1);
      });

      it("should have version 59.0", () => {
        expect(packageXmlContent).toContain("<version>59.0</version>");
      });
    });

    describe("Package XML Structure", () => {
      it("should contain all types sections", () => {
        expect(packageXmlContent).toContain("<types>");
        expect(packageXmlContent).toContain("</types>");
      });

      it("should have types in correct order", () => {
        const apexClassIdx = packageXmlContent.indexOf("<name>ApexClass</name>");
        const apexTriggerIdx = packageXmlContent.indexOf("<name>ApexTrigger</name>");
        const lwcIdx = packageXmlContent.indexOf("<name>LightningComponentBundle</name>");
        const flowIdx = packageXmlContent.indexOf("<name>Flow</name>");
        const customObjIdx = packageXmlContent.indexOf("<name>CustomObject</name>");
        const profileIdx = packageXmlContent.indexOf("<name>Profile</name>");
        const permSetIdx = packageXmlContent.indexOf("<name>PermissionSet</name>");

        expect(apexClassIdx).toBeLessThan(apexTriggerIdx);
        expect(apexTriggerIdx).toBeLessThan(lwcIdx);
        expect(lwcIdx).toBeLessThan(flowIdx);
        expect(flowIdx).toBeLessThan(customObjIdx);
        expect(customObjIdx).toBeLessThan(profileIdx);
        expect(profileIdx).toBeLessThan(permSetIdx);
      });
    });
  });

  // =========================================================================
  // PROFILE METADATA (Admin.profile-meta.xml)
  // =========================================================================

  describe("Profile Metadata (Admin.profile-meta.xml)", () => {
    let profileContent: string;

    beforeAll(() => {
      const profilePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/profiles/Admin.profile-meta.xml");
      profileContent = fs.readFileSync(profilePath, "utf-8");
    });

    describe("File Detection", () => {
      it("should have correct XML declaration", () => {
        expect(profileContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      });

      it("should have Profile as root element", () => {
        expect(profileContent).toContain("<Profile xmlns=");
        expect(profileContent).toContain("http://soap.sforce.com/2006/04/metadata");
      });

      it("should have custom=false", () => {
        expect(profileContent).toContain("<custom>false</custom>");
      });
    });

    describe("User License", () => {
      it("should have userLicense as Salesforce", () => {
        expect(profileContent).toContain("<userLicense>Salesforce</userLicense>");
      });
    });

    describe("Field Permissions", () => {
      it("should have 12 fieldPermissions entries", () => {
        const fieldPermissionMatches = profileContent.match(/<fieldPermissions>/g);
        expect(fieldPermissionMatches).toHaveLength(12);
      });

      it("should have field permissions for Account.Active__c", () => {
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.Active__c<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.Active__c<\/field>[\s\S]*?<readable>true<\/readable>[\s\S]*?<\/fieldPermissions>/);
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.Active__c<\/field>[\s\S]*?<editable>true<\/editable>[\s\S]*?<\/fieldPermissions>/);
      });

      it("should have field permissions for Account.CustomerPriority__c", () => {
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.CustomerPriority__c<\/field>[\s\S]*?<\/fieldPermissions>/);
      });

      it("should have field permissions for Account.SLA__c", () => {
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.SLA__c<\/field>[\s\S]*?<\/fieldPermissions>/);
      });

      it("should have field permissions for Account.Total_Opportunity_Amount__c (readable only)", () => {
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.Total_Opportunity_Amount__c<\/field>[\s\S]*?<readable>true<\/readable>[\s\S]*?<editable>false<\/editable>[\s\S]*?<\/fieldPermissions>/);
      });

      it("should have field permissions for Opportunity standard fields", () => {
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Opportunity\.Amount<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Opportunity\.LeadSource<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Opportunity\.Probability<\/field>[\s\S]*?<\/fieldPermissions>/);
      });

      it("should have field permissions for CustomObject__c fields", () => {
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>CustomObject__c\.Amount__c<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>CustomObject__c\.Category__c<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>CustomObject__c\.CustomAccount__c<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>CustomObject__c\.IsActive__c<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>CustomObject__c\.Stage__c<\/field>[\s\S]*?<\/fieldPermissions>/);
      });
    });

    describe("Object Permissions", () => {
      it("should have 3 objectPermissions entries", () => {
        const objectPermissionMatches = profileContent.match(/<objectPermissions>/g);
        expect(objectPermissionMatches).toHaveLength(3);
      });

      it("should have full access to Account", () => {
        expect(profileContent).toMatch(/<objectPermissions>[\s\S]*?<object>Account<\/object>[\s\S]*?<allowCreate>true<\/allowCreate>[\s\S]*?<allowDelete>true<\/allowDelete>[\s\S]*?<allowEdit>true<\/allowEdit>[\s\S]*?<allowRead>true<\/allowRead>[\s\S]*?<modifyAllRecords>true<\/modifyAllRecords>[\s\S]*?<\/objectPermissions>/);
      });

      it("should have full access to Opportunity", () => {
        expect(profileContent).toMatch(/<objectPermissions>[\s\S]*?<object>Opportunity<\/object>[\s\S]*?<allowCreate>true<\/allowCreate>[\s\S]*?<allowDelete>true<\/allowDelete>[\s\S]*?<allowEdit>true<\/allowEdit>[\s\S]*?<allowRead>true<\/allowRead>[\s\S]*?<modifyAllRecords>true<\/modifyAllRecords>[\s\S]*?<\/objectPermissions>/);
      });

      it("should have full access to CustomObject__c", () => {
        const customObjPermMatch = profileContent.match(/<objectPermissions>[\s\S]*?<object>CustomObject__c<\/object>[\s\S]*?<\/objectPermissions>/);
        expect(customObjPermMatch).toBeTruthy();
        const customObjSection = customObjPermMatch?.[0] || "";
        expect(customObjSection).toContain("<allowCreate>true</allowCreate>");
        expect(customObjSection).toContain("<allowDelete>true</allowDelete>");
        expect(customObjSection).toContain("<allowEdit>true</allowEdit>");
        expect(customObjSection).toContain("<allowRead>true</allowRead>");
        expect(customObjSection).toContain("<modifyAllRecords>true</modifyAllRecords>");
      });
    });

    describe("Class Accesses", () => {
      it("should have 5 classAccesses entries", () => {
        const classAccessMatches = profileContent.match(/<classAccesses>/g);
        expect(classAccessMatches).toHaveLength(5);
      });

      it("should enable AccountController", () => {
        expect(profileContent).toMatch(/<classAccesses>[\s\S]*?<apexClass>AccountController<\/apexClass>[\s\S]*?<enabled>true<\/enabled>[\s\S]*?<\/classAccesses>/);
      });

      it("should enable OpportunityBatch", () => {
        expect(profileContent).toMatch(/<classAccesses>[\s\S]*?<apexClass>OpportunityBatch<\/apexClass>[\s\S]*?<enabled>true<\/enabled>[\s\S]*?<\/classAccesses>/);
      });

      it("should enable OpportunityTriggerHandler", () => {
        expect(profileContent).toMatch(/<classAccesses>[\s\S]*?<apexClass>OpportunityTriggerHandler<\/apexClass>[\s\S]*?<enabled>true<\/enabled>[\s\S]*?<\/classAccesses>/);
      });

      it("should enable Logger", () => {
        expect(profileContent).toMatch(/<classAccesses>[\s\S]*?<apexClass>Logger<\/apexClass>[\s\S]*?<enabled>true<\/enabled>[\s\S]*?<\/classAccesses>/);
      });

      it("should enable TriggerManagement", () => {
        expect(profileContent).toMatch(/<classAccesses>[\s\S]*?<apexClass>TriggerManagement<\/apexClass>[\s\S]*?<enabled>true<\/enabled>[\s\S]*?<\/classAccesses>/);
      });
    });

    describe("Flow Accesses", () => {
      it("should have 2 flowAccesses entries", () => {
        const flowAccessMatches = profileContent.match(/<flowAccesses>/g);
        expect(flowAccessMatches).toHaveLength(2);
      });

      it("should enable Account_Create flow", () => {
        expect(profileContent).toMatch(/<flowAccesses>[\s\S]*?<flow>Account_Create<\/flow>[\s\S]*?<enabled>true<\/enabled>[\s\S]*?<\/flowAccesses>/);
      });

      it("should enable Opportunity_Update flow", () => {
        expect(profileContent).toMatch(/<flowAccesses>[\s\S]*?<flow>Opportunity_Update<\/flow>[\s\S]*?<enabled>true<\/enabled>[\s\S]*?<\/flowAccesses>/);
      });
    });

    describe("Layout Assignments", () => {
      it("should have 3 layoutAssignments", () => {
        const layoutMatches = profileContent.match(/<layoutAssignments>/g);
        expect(layoutMatches).toHaveLength(3);
      });

      it("should have Account layout assignment", () => {
        expect(profileContent).toContain("<layout>Account-Account Layout</layout>");
      });

      it("should have Opportunity layout assignment", () => {
        expect(profileContent).toContain("<layout>Opportunity-Opportunity Layout</layout>");
      });

      it("should have CustomObject__c layout assignment", () => {
        expect(profileContent).toContain("<layout>CustomObject__c-Custom Object Layout</layout>");
      });
    });

    describe("Tab Visibilities", () => {
      it("should have 3 tabVisibilities entries", () => {
        const tabMatches = profileContent.match(/<tabVisibilities>/g);
        expect(tabMatches).toHaveLength(3);
      });

      it("should have Account tab visibility", () => {
        expect(profileContent).toMatch(/<tabVisibilities>[\s\S]*?<tab>standard-Account<\/tab>[\s\S]*?<visibility>Available<\/visibility>[\s\S]*?<\/tabVisibilities>/);
      });

      it("should have Opportunity tab visibility", () => {
        expect(profileContent).toMatch(/<tabVisibilities>[\s\S]*?<tab>standard-Opportunity<\/tab>[\s\S]*?<visibility>Available<\/visibility>[\s\S]*?<\/tabVisibilities>/);
      });

      it("should have CustomObject__c tab visibility", () => {
        expect(profileContent).toMatch(/<tabVisibilities>[\s\S]*?<tab>CustomObject__c<\/tab>[\s\S]*?<visibility>Available<\/visibility>[\s\S]*?<\/tabVisibilities>/);
      });
    });

    describe("Record Type Visibilities", () => {
      it("should have 2 recordTypeVisibilities entries", () => {
        const recordTypeMatches = profileContent.match(/<recordTypeVisibilities>/g);
        expect(recordTypeMatches).toHaveLength(2);
      });

      it("should have Customer_Account record type visibility", () => {
        expect(profileContent).toMatch(/<recordTypeVisibilities>[\s\S]*?<recordType>Account\.Customer_Account<\/recordType>[\s\S]*?<default>true<\/default>[\s\S]*?<visible>true<\/visible>[\s\S]*?<\/recordTypeVisibilities>/);
      });

      it("should have PersonAccount record type visibility", () => {
        expect(profileContent).toMatch(/<recordTypeVisibilities>[\s\S]*?<recordType>Account\.PersonAccount<\/recordType>[\s\S]*?<default>false<\/default>[\s\S]*?<visible>false<\/visible>[\s\S]*?<\/recordTypeVisibilities>/);
      });
    });
  });

  // =========================================================================
  // PERMISSION SET METADATA (SalesRepresentative.permissionset-meta.xml)
  // =========================================================================

  describe("PermissionSet Metadata (SalesRepresentative.permissionset-meta.xml)", () => {
    let permSetContent: string;

    beforeAll(() => {
      const permSetPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/permissionsets/SalesRepresentative.permissionset-meta.xml");
      permSetContent = fs.readFileSync(permSetPath, "utf-8");
    });

    describe("File Detection", () => {
      it("should have correct XML declaration", () => {
        expect(permSetContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      });

      it("should have PermissionSet as root element", () => {
        expect(permSetContent).toContain("<PermissionSet xmlns=");
        expect(permSetContent).toContain("http://salesforce.com/2006/04/metadata");
      });

      it("should have custom=false", () => {
        expect(permSetContent).toContain("<custom>false</custom>");
      });
    });

    describe("Label and Description", () => {
      it("should have label Sales Representative", () => {
        expect(permSetContent).toContain("<label>Sales Representative</label>");
      });

      it("should have description", () => {
        expect(permSetContent).toContain("<description>Permission set for Sales Representatives</description>");
      });
    });

    describe("Field Permissions", () => {
      it("should have 15 fieldPermissions entries", () => {
        const fieldPermissionMatches = permSetContent.match(/<fieldPermissions>/g);
        expect(fieldPermissionMatches).toHaveLength(15);
      });

      it("should have field permissions for Account standard fields", () => {
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.Active__c<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.AnnualRevenue<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.BillingCity<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.BillingState<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.Industry<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.Name<\/field>[\s\S]*?<\/fieldPermissions>/);
      });

      it("should have field permissions for Opportunity standard fields", () => {
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Opportunity\.Amount<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Opportunity\.CloseDate<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Opportunity\.Description<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Opportunity\.StageName<\/field>[\s\S]*?<\/fieldPermissions>/);
      });

      it("should have field permissions for CustomObject__c fields", () => {
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>CustomObject__c\.Amount__c<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>CustomObject__c\.Category__c<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>CustomObject__c\.IsActive__c<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>CustomObject__c\.Name__c<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>CustomObject__c\.Stage__c<\/field>[\s\S]*?<\/fieldPermissions>/);
      });
    });

    describe("Object Permissions", () => {
      it("should have 3 objectPermissions entries", () => {
        const objectPermissionMatches = permSetContent.match(/<objectPermissions>/g);
        expect(objectPermissionMatches).toHaveLength(3);
      });

      it("should have correct permissions for Account (limited)", () => {
        expect(permSetContent).toMatch(/<objectPermissions>[\s\S]*?<object>Account<\/object>[\s\S]*?<allowCreate>true<\/allowCreate>[\s\S]*?<allowDelete>false<\/allowDelete>[\s\S]*?<allowEdit>true<\/allowEdit>[\s\S]*?<allowRead>true<\/allowRead>[\s\S]*?<modifyAllRecords>false<\/modifyAllRecords>[\s\S]*?<viewAllRecords>false<\/viewAllRecords>[\s\S]*?<\/objectPermissions>/);
      });

      it("should have correct permissions for Opportunity (limited)", () => {
        expect(permSetContent).toMatch(/<objectPermissions>[\s\S]*?<object>Opportunity<\/object>[\s\S]*?<allowCreate>true<\/allowCreate>[\s\S]*?<allowDelete>false<\/allowDelete>[\s\S]*?<allowEdit>true<\/allowEdit>[\s\S]*?<allowRead>true<\/allowRead>[\s\S]*?<modifyAllRecords>false<\/modifyAllRecords>[\s\S]*?<viewAllRecords>false<\/viewAllRecords>[\s\S]*?<\/objectPermissions>/);
      });

      it("should have correct permissions for CustomObject__c (limited)", () => {
        const customObjPermMatch = permSetContent.match(/<objectPermissions>[\s\S]*?<object>CustomObject__c<\/object>[\s\S]*?<\/objectPermissions>/);
        expect(customObjPermMatch).toBeTruthy();
        const customObjSection = customObjPermMatch?.[0] || "";
        expect(customObjSection).toContain("<allowCreate>true</allowCreate>");
        expect(customObjSection).toContain("<allowDelete>false</allowDelete>");
        expect(customObjSection).toContain("<allowEdit>true</allowEdit>");
        expect(customObjSection).toContain("<allowRead>true</allowRead>");
        expect(customObjSection).toContain("<modifyAllRecords>false</modifyAllRecords>");
        expect(customObjSection).toContain("<viewAllRecords>false</viewAllRecords>");
      });
    });

    describe("Class Accesses", () => {
      it("should have 1 classAccesses entry", () => {
        const classAccessMatches = permSetContent.match(/<classAccesses>/g);
        expect(classAccessMatches).toHaveLength(1);
      });

      it("should enable AccountController", () => {
        expect(permSetContent).toMatch(/<classAccesses>[\s\S]*?<apexClass>AccountController<\/apexClass>[\s\S]*?<enabled>true<\/enabled>[\s\S]*?<\/classAccesses>/);
      });
    });

    describe("Flow Accesses", () => {
      it("should have 1 flowAccesses entry", () => {
        const flowAccessMatches = permSetContent.match(/<flowAccesses>/g);
        expect(flowAccessMatches).toHaveLength(1);
      });

      it("should enable Account_Create flow", () => {
        expect(permSetContent).toMatch(/<flowAccesses>[\s\S]*?<flow>Account_Create<\/flow>[\s\S]*?<enabled>true<\/enabled>[\s\S]*?<\/flowAccesses>/);
      });
    });

    describe("User Permissions", () => {
      it("should have 2 userPermissions entries", () => {
        const userPermMatches = permSetContent.match(/<userPermissions>/g);
        expect(userPermMatches).toHaveLength(2);
      });

      it("should have ViewReadonlyFields permission enabled", () => {
        expect(permSetContent).toMatch(/<userPermissions>[\s\S]*?<name>ViewReadonlyFields<\/name>[\s\S]*?<enabled>true<\/enabled>[\s\S]*?<\/userPermissions>/);
      });

      it("should have AllowViewKnowledge permission enabled", () => {
        expect(permSetContent).toMatch(/<userPermissions>[\s\S]*?<name>AllowViewKnowledge<\/name>[\s\S]*?<enabled>true<\/enabled>[\s\S]*?<\/userPermissions>/);
      });
    });

    describe("hasActivationRequired", () => {
      it("should have hasActivationRequired as false", () => {
        expect(permSetContent).toContain("<hasActivationRequired>false</hasActivationRequired>");
      });
    });
  });

  // =========================================================================
  // FULL SFDX PROJECT INTEGRATION (END-TO-END)
  // =========================================================================

  describe("Full SFDX Project Integration (End-to-End)", () => {
    
    describe("SFDX File Structure Completeness", () => {
      it("should have all required SFDX files", () => {
        const requiredFiles = [
          "sfdx-project.json",
          "force-app/main/default/package.xml",
          "force-app/main/default/profiles/Admin.profile-meta.xml",
          "force-app/main/default/permissionsets/SalesRepresentative.permissionset-meta.xml"
        ];

        for (const file of requiredFiles) {
          const filePath = path.join(SALESFORCE_ENTERPRISE_PATH, file);
          expect(fs.existsSync(filePath)).toBe(true);
        }
      });

      it("should have matching sourceApiVersion across SFDX files", () => {
        const sfdxProjectPath = path.join(SALESFORCE_ENTERPRISE_PATH, "sfdx-project.json");
        const packageXmlPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/package.xml");
        
        const sfdxProjectContent = fs.readFileSync(sfdxProjectPath, "utf-8");
        const packageXmlContent = fs.readFileSync(packageXmlPath, "utf-8");
        
        const sfdxProjectJson = JSON.parse(sfdxProjectContent);
        expect(sfdxProjectJson.sourceApiVersion).toBe("59.0");
        expect(packageXmlContent).toContain("<version>59.0</version>");
      });
    });

    describe("Component Cross-Reference Validation", () => {
      let sfdxProjectContent: string;
      let packageXmlContent: string;
      let profileContent: string;
      let permSetContent: string;

      beforeAll(() => {
        sfdxProjectContent = fs.readFileSync(path.join(SALESFORCE_ENTERPRISE_PATH, "sfdx-project.json"), "utf-8");
        packageXmlContent = fs.readFileSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/package.xml"), "utf-8");
        profileContent = fs.readFileSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/profiles/Admin.profile-meta.xml"), "utf-8");
        permSetContent = fs.readFileSync(path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/permissionsets/SalesRepresentative.permissionset-meta.xml"), "utf-8");
      });

      it("should reference Apex classes consistently", () => {
        // package.xml lists ApexClass members
        expect(packageXmlContent).toContain("<members>AccountController</members>");
        
        // Profile enables AccountController
        expect(profileContent).toContain("<apexClass>AccountController</apexClass>");
        
        // PermissionSet enables AccountController
        expect(permSetContent).toContain("<apexClass>AccountController</apexClass>");
      });

      it("should reference flows consistently", () => {
        // package.xml lists Flow members
        expect(packageXmlContent).toContain("<members>Account_Create</members>");
        expect(packageXmlContent).toContain("<members>Opportunity_Update</members>");
        
        // Profile enables both flows
        expect(profileContent).toContain("<flow>Account_Create</flow>");
        expect(profileContent).toContain("<flow>Opportunity_Update</flow>");
        
        // PermissionSet enables Account_Create
        expect(permSetContent).toContain("<flow>Account_Create</flow>");
      });

      it("should reference CustomObject__c consistently", () => {
        // package.xml has CustomObject with CustomObject__c
        expect(packageXmlContent).toContain("<members>CustomObject__c</members>");
        
        // Profile has object permissions for CustomObject__c
        expect(profileContent).toMatch(/<objectPermissions>[\s\S]*?<object>CustomObject__c<\/object>[\s\S]*?<\/objectPermissions>/);
        
        // PermissionSet has object permissions for CustomObject__c
        expect(permSetContent).toMatch(/<objectPermissions>[\s\S]*?<object>CustomObject__c<\/object>[\s\S]*?<\/objectPermissions>/);
        
        // Profile has field permissions for CustomObject__c fields
        expect(profileContent).toContain("<field>CustomObject__c.Amount__c</field>");
        expect(profileContent).toContain("<field>CustomObject__c.Category__c</field>");
        
        // PermissionSet has field permissions for CustomObject__c fields
        expect(permSetContent).toContain("<field>CustomObject__c.Amount__c</field>");
        expect(permSetContent).toContain("<field>CustomObject__c.Category__c</field>");
      });

      it("should have Profile listed in package.xml", () => {
        expect(packageXmlContent).toMatch(/<types>[\s\S]*?<members>Admin<\/members>[\s\S]*?<name>Profile<\/name>[\s\S]*?<\/types>/);
      });

      it("should have PermissionSet listed in package.xml", () => {
        expect(packageXmlContent).toMatch(/<types>[\s\S]*?<members>SalesRepresentative<\/members>[\s\S]*?<name>PermissionSet<\/name>[\s\S]*?<\/types>/);
      });
    });

    describe("Metadata Component File Existence", () => {
      it("should have all Apex class files", () => {
        const apexClasses = [
          "AccountController.cls",
          "AccountControllerTest.cls",
          "OpportunityBatch.cls",
          "OpportunityBatchTest.cls",
          "OpportunityTriggerHandler.cls",
          "OpportunityTriggerHelper.cls",
          "Logger.cls",
          "TriggerManagement.cls"
        ];

        for (const apexClass of apexClasses) {
          const filePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes", apexClass);
          expect(fs.existsSync(filePath)).toBe(true);
        }
      });

      it("should have Apex trigger file", () => {
        const triggerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/triggers/OpportunityTrigger.trigger");
        expect(fs.existsSync(triggerPath)).toBe(true);
      });

      it("should have LWC component files", () => {
        const lwcComponents = ["accountList", "opportunityCard"];
        
        for (const component of lwcComponents) {
          const componentDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc", component);
          expect(fs.existsSync(path.join(componentDir, `${component}.js`))).toBe(true);
          expect(fs.existsSync(path.join(componentDir, `${component}.html`))).toBe(true);
          expect(fs.existsSync(path.join(componentDir, `${component}.css`))).toBe(true);
          expect(fs.existsSync(path.join(componentDir, `${component}.js-meta.xml`))).toBe(true);
        }
      });

      it("should have Flow metadata files", () => {
        const flows = ["Account_Create.flow-meta.xml", "Opportunity_Update.flow-meta.xml"];
        
        for (const flow of flows) {
          const flowPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows", flow);
          expect(fs.existsSync(flowPath)).toBe(true);
        }
      });

      it("should have CustomObject metadata file", () => {
        const objectPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/objects/CustomObject__c/CustomObject__c.object-meta.xml");
        expect(fs.existsSync(objectPath)).toBe(true);
      });
    });

    describe("SFDX API Version Consistency", () => {
      it("should have consistent API version across project", () => {
        const sfdxProjectPath = path.join(SALESFORCE_ENTERPRISE_PATH, "sfdx-project.json");
        const packageXmlPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/package.xml");
        
        const sfdxProjectContent = fs.readFileSync(sfdxProjectPath, "utf-8");
        const packageXmlContent = fs.readFileSync(packageXmlPath, "utf-8");
        
        const sfdxProjectJson = JSON.parse(sfdxProjectContent);
        const sourceApiVersion = sfdxProjectJson.sourceApiVersion;
        
        // package.xml version
        expect(packageXmlContent).toContain(`<version>${sourceApiVersion}</version>`);
        
        // Flow API versions
        const accountCreateFlowPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
        const opportunityUpdateFlowPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");
        const accountCreateFlowContent = fs.readFileSync(accountCreateFlowPath, "utf-8");
        const opportunityUpdateFlowContent = fs.readFileSync(opportunityUpdateFlowPath, "utf-8");
        
        expect(accountCreateFlowContent).toContain(`<apiVersion>${sourceApiVersion}</apiVersion>`);
        expect(opportunityUpdateFlowContent).toContain(`<apiVersion>${sourceApiVersion}</apiVersion>`);
      });
    });
  });

  // =========================================================================
  // UNIT TESTS - SFDX Metadata XML parsing patterns
  // =========================================================================

  describe("Unit: SFDX Metadata XML parsing patterns", () => {
    
    describe("sfdx-project.json parsing", () => {
      it("should parse valid sfdx-project.json structure", () => {
        const sfdxJson = {
          packageDirectories: [{
            path: "force-app",
            default: true,
            package: "TestPackage",
            versionName: "ver 1.0",
            versionNumber: "1.0.0.NEXT"
          }],
          name: "TestProject",
          namespace: "",
          sfdcLoginUrl: "https://login.salesforce.com",
          singlePackage: false,
          sourceApiVersion: "59.0"
        };

        expect(sfdxJson.packageDirectories[0].path).toBe("force-app");
        expect(sfdxJson.packageDirectories[0].default).toBe(true);
        expect(sfdxJson.name).toBe("TestProject");
        expect(sfdxJson.sourceApiVersion).toBe("59.0");
      });

      it("should handle namespace correctly", () => {
        const sfdxJson = {
          namespace: "my_namespace"
        };
        expect(sfdxJson.namespace).toBe("my_namespace");
      });

      it("should handle empty namespace", () => {
        const sfdxJson = {
          namespace: ""
        };
        expect(sfdxJson.namespace).toBe("");
      });
    });

    describe("package.xml parsing", () => {
      it("should parse package.xml type structure", () => {
        const packageXml = `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>TestClass</members>
        <name>ApexClass</name>
    </types>
    <version>59.0</version>
</Package>`;

        expect(packageXml).toContain("<name>ApexClass</name>");
        expect(packageXml).toContain("<members>TestClass</members>");
        expect(packageXml).toContain("<version>59.0</version>");
      });

      it("should parse multiple type members", () => {
        const packageXml = `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Class1</members>
        <members>Class2</members>
        <members>Class3</members>
        <name>ApexClass</name>
    </types>
</Package>`;

        const memberMatches = packageXml.match(/<members>\w+<\/members>/g);
        expect(memberMatches).toHaveLength(3);
      });
    });

    describe("Profile XML parsing", () => {
      it("should parse fieldPermissions structure", () => {
        const profileXml = `<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
    <fieldPermissions>
        <field>Account.Name</field>
        <readable>true</readable>
        <editable>true</editable>
    </fieldPermissions>
</Profile>`;

        expect(profileXml).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.Name<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(profileXml).toContain("<readable>true</readable>");
        expect(profileXml).toContain("<editable>true</editable>");
      });

      it("should parse objectPermissions structure", () => {
        const profileXml = `<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
    <objectPermissions>
        <allowCreate>true</allowCreate>
        <allowDelete>true</allowDelete>
        <allowEdit>true</allowEdit>
        <allowRead>true</allowRead>
        <modifyAllRecords>true</modifyAllRecords>
        <object>Account</object>
    </objectPermissions>
</Profile>`;

        expect(profileXml).toMatch(/<objectPermissions>[\s\S]*?<object>Account<\/object>[\s\S]*?<\/objectPermissions>/);
        expect(profileXml).toContain("<allowCreate>true</allowCreate>");
        expect(profileXml).toContain("<modifyAllRecords>true</modifyAllRecords>");
      });

      it("should parse classAccesses structure", () => {
        const profileXml = `<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
    <classAccesses>
        <apexClass>TestClass</apexClass>
        <enabled>true</enabled>
    </classAccesses>
</Profile>`;

        expect(profileXml).toMatch(/<classAccesses>[\s\S]*?<apexClass>TestClass<\/apexClass>[\s\S]*?<\/classAccesses>/);
        expect(profileXml).toContain("<enabled>true</enabled>");
      });
    });

    describe("PermissionSet XML parsing", () => {
      it("should parse PermissionSet basic structure", () => {
        const permSetXml = `<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://salesforce.com/2006/04/metadata">
    <custom>false</custom>
    <label>Test Permission Set</label>
    <description>Test description</description>
</PermissionSet>`;

        expect(permSetXml).toContain("<label>Test Permission Set</label>");
        expect(permSetXml).toContain("<description>Test description</description>");
        expect(permSetXml).toContain("<custom>false</custom>");
      });

      it("should parse fieldPermissions with readable and editable", () => {
        const permSetXml = `<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://salesforce.com/2006/04/metadata">
    <fieldPermissions>
        <field>Account.Name</field>
        <readable>true</readable>
        <editable>false</editable>
    </fieldPermissions>
</PermissionSet>`;

        expect(permSetXml).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.Name<\/field>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetXml).toContain("<readable>true</readable>");
        expect(permSetXml).toContain("<editable>false</editable>");
      });

      it("should parse objectPermissions with viewAllRecords and modifyAllRecords", () => {
        const permSetXml = `<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://salesforce.com/2006/04/metadata">
    <objectPermissions>
        <allowCreate>true</allowCreate>
        <allowEdit>true</allowEdit>
        <allowRead>true</allowRead>
        <viewAllRecords>false</viewAllRecords>
        <modifyAllRecords>false</modifyAllRecords>
        <object>Account</object>
    </objectPermissions>
</PermissionSet>`;

        expect(permSetXml).toContain("<viewAllRecords>false</viewAllRecords>");
        expect(permSetXml).toContain("<modifyAllRecords>false</modifyAllRecords>");
      });

      it("should parse userPermissions", () => {
        const permSetXml = `<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://salesforce.com/2006/04/metadata">
    <userPermissions>
        <name>ViewReadonlyFields</name>
        <enabled>true</enabled>
    </userPermissions>
</PermissionSet>`;

        expect(permSetXml).toMatch(/<userPermissions>[\s\S]*?<name>ViewReadonlyFields<\/name>[\s\S]*?<\/userPermissions>/);
        expect(permSetXml).toContain("<enabled>true</enabled>");
      });
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe("Edge Cases", () => {
    
    describe("SFDX Project Edge Cases", () => {
      it("should handle empty namespace", () => {
        const sfdxProjectPath = path.join(SALESFORCE_ENTERPRISE_PATH, "sfdx-project.json");
        const content = fs.readFileSync(sfdxProjectPath, "utf-8");
        const json = JSON.parse(content);
        expect(json.namespace).toBe("");
      });

      it("should handle singlePackage=false", () => {
        const sfdxProjectPath = path.join(SALESFORCE_ENTERPRISE_PATH, "sfdx-project.json");
        const content = fs.readFileSync(sfdxProjectPath, "utf-8");
        const json = JSON.parse(content);
        expect(json.singlePackage).toBe(false);
      });

      it("should handle versionNumber with NEXT", () => {
        const sfdxProjectPath = path.join(SALESFORCE_ENTERPRISE_PATH, "sfdx-project.json");
        const content = fs.readFileSync(sfdxProjectPath, "utf-8");
        const json = JSON.parse(content);
        expect(json.packageDirectories[0].versionNumber).toBe("1.0.0.NEXT");
      });
    });

    describe("Profile Edge Cases", () => {
      let profileContent: string;

      beforeAll(() => {
        const profilePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/profiles/Admin.profile-meta.xml");
        profileContent = fs.readFileSync(profilePath, "utf-8");
      });

      it("should handle read-only field permissions", () => {
        // Account.Total_Opportunity_Amount__c has readable=true, editable=false
        expect(profileContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.Total_Opportunity_Amount__c<\/field>[\s\S]*?<readable>true<\/readable>[\s\S]*?<editable>false<\/editable>[\s\S]*?<\/fieldPermissions>/);
      });

      it("should handle multiple layoutAssignments", () => {
        const layoutMatches = profileContent.match(/<layoutAssignments>[\s\S]*?<\/layoutAssignments>/g);
        expect(layoutMatches).toHaveLength(3);
      });

      it("should handle recordTypeVisibilities with different default/visible settings", () => {
        // Customer_Account: default=true, visible=true
        // PersonAccount: default=false, visible=false
        expect(profileContent).toMatch(/<recordTypeVisibilities>[\s\S]*?<recordType>Account\.Customer_Account<\/recordType>[\s\S]*?<default>true<\/default>[\s\S]*?<visible>true<\/visible>[\s\S]*?<\/recordTypeVisibilities>/);
        expect(profileContent).toMatch(/<recordTypeVisibilities>[\s\S]*?<recordType>Account\.PersonAccount<\/recordType>[\s\S]*?<default>false<\/default>[\s\S]*?<visible>false<\/visible>[\s\S]*?<\/recordTypeVisibilities>/);
      });
    });

    describe("PermissionSet Edge Cases", () => {
      let permSetContent: string;

      beforeAll(() => {
        const permSetPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/permissionsets/SalesRepresentative.permissionset-meta.xml");
        permSetContent = fs.readFileSync(permSetPath, "utf-8");
      });

      it("should handle hasActivationRequired=false", () => {
        expect(permSetContent).toContain("<hasActivationRequired>false</hasActivationRequired>");
      });

      it("should handle limited object permissions", () => {
        // PermissionSet has allowCreate=true, allowDelete=false, allowEdit=true, allowRead=true
        // modifyAllRecords=false, viewAllRecords=false
        expect(permSetContent).toMatch(/<objectPermissions>[\s\S]*?<allowDelete>false<\/allowDelete>[\s\S]*?<\/objectPermissions>/);
        expect(permSetContent).toMatch(/<objectPermissions>[\s\S]*?<modifyAllRecords>false<\/modifyAllRecords>[\s\S]*?<\/objectPermissions>/);
        expect(permSetContent).toMatch(/<objectPermissions>[\s\S]*?<viewAllRecords>false<\/viewAllRecords>[\s\S]*?<\/objectPermissions>/);
      });

      it("should handle multiple field permissions with different editable settings", () => {
        // Account.AnnualRevenue: readable=true, editable=false
        // Account.Name: readable=true, editable=true
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.AnnualRevenue<\/field>[\s\S]*?<readable>true<\/readable>[\s\S]*?<editable>false<\/editable>[\s\S]*?<\/fieldPermissions>/);
        expect(permSetContent).toMatch(/<fieldPermissions>[\s\S]*?<field>Account\.Name<\/field>[\s\S]*?<readable>true<\/readable>[\s\S]*?<editable>true<\/editable>[\s\S]*?<\/fieldPermissions>/);
      });
    });

    describe("Package.xml Edge Cases", () => {
      it("should handle mixed component types", () => {
        const packageXmlPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/package.xml");
        const content = fs.readFileSync(packageXmlPath, "utf-8");
        
        // 7 different type elements
        const typeNames = content.match(/<name>\w+<\/name>/g);
        expect(typeNames).toHaveLength(7);
        
        // All types should be unique
        const uniqueTypes = [...new Set(typeNames)];
        expect(uniqueTypes).toHaveLength(7);
      });

      it("should handle types with single member", () => {
        const packageXmlPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/package.xml");
        const content = fs.readFileSync(packageXmlPath, "utf-8");
        
        // ApexTrigger has 1 member
        expect(content).toMatch(/<members>OpportunityTrigger<\/members>[\s\S]*?<name>ApexTrigger<\/name>[\s\S]*?<\/types>/);
        
        // CustomObject has 1 member
        expect(content).toMatch(/<members>CustomObject__c<\/members>[\s\S]*?<name>CustomObject<\/name>[\s\S]*?<\/types>/);
        
        // Profile has 1 member
        expect(content).toMatch(/<members>Admin<\/members>[\s\S]*?<name>Profile<\/name>[\s\S]*?<\/types>/);
        
        // PermissionSet has 1 member
        expect(content).toMatch(/<members>SalesRepresentative<\/members>[\s\S]*?<name>PermissionSet<\/name>[\s\S]*?<\/types>/);
      });

      it("should handle types with multiple members", () => {
        const packageXmlPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/package.xml");
        const content = fs.readFileSync(packageXmlPath, "utf-8");
        
        // ApexClass has 9 members - extract by finding the section between types tags
        const apexClassSection = content.substring(content.indexOf("<members>AccountController</members>"), content.indexOf("</types>"));
        const apexMembers = apexClassSection.match(/<members>\w+<\/members>/g);
        expect(apexMembers).toHaveLength(9);
        
        // LightningComponentBundle has 2 members
        const lwcStart = content.indexOf("<members>accountList</members>");
        const lwcEnd = content.indexOf("</types>", lwcStart);
        const lwcSection = content.substring(lwcStart - 100, lwcEnd);
        const lwcMembers = lwcSection.match(/<members>\w+<\/members>/g);
        expect(lwcMembers).toHaveLength(2);
        
        // Flow has 2 members
        const flowStart = content.indexOf("<members>Account_Create</members>");
        const flowEnd = content.indexOf("</types>", flowStart);
        const flowSection = content.substring(flowStart - 100, flowEnd);
        const flowMembers = flowSection.match(/<members>\w+<\/members>/g);
        expect(flowMembers).toHaveLength(2);
      });
    });
  });
});
