import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const SALESFORCE_ENTERPRISE_PATH = path.join(process.cwd(), "fixtures/salesforce-enterprise");

describe("Salesforce Aura Components Detection", () => {
  
  describe("Integration: Real Salesforce Enterprise Project", () => {
    it("should detect aura directory", () => {
      const auraDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/aura");
      expect(fs.existsSync(auraDir)).toBe(true);
    });

    it("should detect accountList component directory", () => {
      const componentDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/aura/accountList");
      expect(fs.existsSync(componentDir)).toBe(true);
    });

    it("should detect accountList.cmp file", () => {
      const cmpPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/aura/accountList/accountList.cmp");
      expect(fs.existsSync(cmpPath)).toBe(true);
    });

    it("should detect accountListController.js file", () => {
      const controllerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/aura/accountList/accountListController.js");
      expect(fs.existsSync(controllerPath)).toBe(true);
    });

    it("should detect accountListHelper.js file", () => {
      const helperPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/aura/accountList/accountListHelper.js");
      expect(fs.existsSync(helperPath)).toBe(true);
    });
  });

  describe("accountList.cmp Component Definition", () => {
    let cmpContent: string;

    beforeAll(() => {
      const cmpPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/aura/accountList/accountList.cmp");
      cmpContent = fs.readFileSync(cmpPath, "utf-8");
    });

    it("should have aura:component root element", () => {
      expect(cmpContent).toContain("<aura:component");
    });

    it("should have controller attribute", () => {
      expect(cmpContent).toContain('controller="AccountController"');
    });

    it("should implement flexipage:availableForAllPageTypes", () => {
      expect(cmpContent).toContain("flexipage:availableForAllPageTypes");
    });

    it("should implement force:hasRecordId", () => {
      expect(cmpContent).toContain("force:hasRecordId");
    });

    it("should have access='global'", () => {
      expect(cmpContent).toContain('access="global"');
    });

    it("should have description attribute", () => {
      expect(cmpContent).toContain("description=");
    });
  });

  describe("accountList.cmp Attributes", () => {
    let cmpContent: string;

    beforeAll(() => {
      const cmpPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/aura/accountList/accountList.cmp");
      cmpContent = fs.readFileSync(cmpPath, "utf-8");
    });

    it("should have accounts attribute", () => {
      expect(cmpContent).toContain('name="accounts"');
    });

    it("should have searchTerm attribute", () => {
      expect(cmpContent).toContain('name="searchTerm"');
    });

    it("should have industryFilter attribute", () => {
      expect(cmpContent).toContain('name="industryFilter"');
    });

    it("should have selectedAccount attribute", () => {
      expect(cmpContent).toContain('name="selectedAccount"');
    });

    it("should have isLoading attribute", () => {
      expect(cmpContent).toContain('name="isLoading"');
    });

    it("should have columns attribute", () => {
      expect(cmpContent).toContain('name="columns"');
    });
  });

  describe("accountList.cmp Handlers and Methods", () => {
    let cmpContent: string;

    beforeAll(() => {
      const cmpPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/aura/accountList/accountList.cmp");
      cmpContent = fs.readFileSync(cmpPath, "utf-8");
    });

    it("should have aura:handler for init", () => {
      expect(cmpContent).toContain('<aura:handler name="init"');
    });

    it("should have init action", () => {
      expect(cmpContent).toContain('action="{!c.doInit}"');
    });

    it("should have aura:method refreshAccounts", () => {
      expect(cmpContent).toContain('<aura:method name="refreshAccounts"');
    });

    it("should have force:recordData component", () => {
      expect(cmpContent).toContain("<force:recordData");
    });

    it("should have recordUpdated handler", () => {
      expect(cmpContent).toContain('recordUpdated="{!c.handleRecordUpdated}"');
    });
  });

  describe("accountListController.js Functions", () => {
    let controllerContent: string;

    beforeAll(() => {
      const controllerPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/aura/accountList/accountListController.js");
      controllerContent = fs.readFileSync(controllerPath, "utf-8");
    });

    it("should have doInit function", () => {
      expect(controllerContent).toContain("doInit:");
    });

    it("should have handleSearchChange function", () => {
      expect(controllerContent).toContain("handleSearchChange:");
    });

    it("should have handleIndustryChange function", () => {
      expect(controllerContent).toContain("handleIndustryChange:");
    });

    it("should have handleAccountSelect function", () => {
      expect(controllerContent).toContain("handleAccountSelect:");
    });

    it("should have handleRecordUpdated function", () => {
      expect(controllerContent).toContain("handleRecordUpdated:");
    });

    it("should have refreshAccounts function", () => {
      expect(controllerContent).toContain("refreshAccounts:");
    });
  });

  describe("accountListHelper.js Functions", () => {
    let helperContent: string;

    beforeAll(() => {
      const helperPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/aura/accountList/accountListHelper.js");
      helperContent = fs.readFileSync(helperPath, "utf-8");
    });

    it("should have loadAccounts function", () => {
      expect(helperContent).toContain("loadAccounts:");
    });

    it("should have debouncedSearch function", () => {
      expect(helperContent).toContain("debouncedSearch:");
    });

    it("should call server action", () => {
      expect(helperContent).toContain("component.get('c.getAccounts')");
    });

    it("should enqueue action", () => {
      expect(helperContent).toContain("$A.enqueueAction(action)");
    });

    it("should handle callback states", () => {
      expect(helperContent).toContain("response.getState()");
    });
  });
});
