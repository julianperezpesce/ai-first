import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const SALESFORCE_ENTERPRISE_PATH = path.join(process.cwd(), "fixtures/salesforce-enterprise");

describe("Salesforce Visualforce Pages Detection", () => {
  
  describe("Integration: Real Salesforce Enterprise Project", () => {
    it("should detect pages directory", () => {
      const pagesDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/pages");
      expect(fs.existsSync(pagesDir)).toBe(true);
    });

    it("should detect AccountDashboard.page file", () => {
      const pagePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/pages/AccountDashboard.page");
      expect(fs.existsSync(pagePath)).toBe(true);
    });

    it("should read AccountDashboard.page successfully", () => {
      const pagePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/pages/AccountDashboard.page");
      const content = fs.readFileSync(pagePath, "utf-8");
      
      expect(content).toContain("<apex:page");
    });

    it("should detect AccountDashboardController.cls", () => {
      const classPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountDashboardController.cls");
      expect(fs.existsSync(classPath)).toBe(true);
    });
  });

  describe("AccountDashboard.page Properties", () => {
    let pageContent: string;

    beforeAll(() => {
      const pagePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/pages/AccountDashboard.page");
      pageContent = fs.readFileSync(pagePath, "utf-8");
    });

    it("should have apex:page root element", () => {
      expect(pageContent).toContain("<apex:page");
    });

    it("should have controller attribute", () => {
      expect(pageContent).toContain('controller="AccountDashboardController"');
    });

    it("should have sidebar='false'", () => {
      expect(pageContent).toContain("sidebar=\"false\"");
    });

    it("should have showHeader='true'", () => {
      expect(pageContent).toContain("showHeader=\"true\"");
    });

    it("should have lightningStylesheets='true'", () => {
      expect(pageContent).toContain("lightningStylesheets=\"true\"");
    });
  });

  describe("AccountDashboard.page Components", () => {
    let pageContent: string;

    beforeAll(() => {
      const pagePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/pages/AccountDashboard.page");
      pageContent = fs.readFileSync(pagePath, "utf-8");
    });

    it("should have apex:form component", () => {
      expect(pageContent).toContain("<apex:form>");
    });

    it("should have apex:pageBlock component", () => {
      expect(pageContent).toContain("<apex:pageBlock");
    });

    it("should have apex:pageBlockButtons component", () => {
      expect(pageContent).toContain("<apex:pageBlockButtons>");
    });

    it("should have apex:pageBlockSection component", () => {
      expect(pageContent).toContain("<apex:pageBlockSection");
    });

    it("should have apex:pageBlockTable component", () => {
      expect(pageContent).toContain("<apex:pageBlockTable");
    });

    it("should have apex:outputPanel component", () => {
      expect(pageContent).toContain("<apex:outputPanel");
    });

    it("should have apex:commandButton components", () => {
      expect(pageContent).toContain("<apex:commandButton");
    });

    it("should have apex:selectList component", () => {
      expect(pageContent).toContain("<apex:selectList");
    });

    it("should have apex:inputText component", () => {
      expect(pageContent).toContain("<apex:inputText");
    });

    it("should have apex:outputLink component", () => {
      expect(pageContent).toContain("<apex:outputLink");
    });

    it("should have apex:actionSupport component", () => {
      expect(pageContent).toContain("<apex:actionSupport");
    });
  });

  describe("AccountDashboardController.cls", () => {
    let controllerContent: string;

    beforeAll(() => {
      const classPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountDashboardController.cls");
      controllerContent = fs.readFileSync(classPath, "utf-8");
    });

    it("should have public class declaration", () => {
      expect(controllerContent).toContain("public class AccountDashboardController");
    });

    it("should have accounts property", () => {
      expect(controllerContent).toContain("List<Account> accounts");
    });

    it("should have selectedIndustry property", () => {
      expect(controllerContent).toContain("String selectedIndustry");
    });

    it("should have searchTerm property", () => {
      expect(controllerContent).toContain("String searchTerm");
    });

    it("should have totalAccounts property", () => {
      expect(controllerContent).toContain("Integer totalAccounts");
    });

    it("should have totalRevenue property", () => {
      expect(controllerContent).toContain("Decimal totalRevenue");
    });

    it("should have loadDashboardData method", () => {
      expect(controllerContent).toContain("loadDashboardData()");
    });

    it("should have getIndustryOptions method", () => {
      expect(controllerContent).toContain("getIndustryOptions()");
    });

    it("should have refreshData method", () => {
      expect(controllerContent).toContain("refreshData()");
    });

    it("should have searchAccounts method", () => {
      expect(controllerContent).toContain("searchAccounts()");
    });

    it("should have exportToCSV method", () => {
      expect(controllerContent).toContain("exportToCSV()");
    });

    it("should return List<SelectOption>", () => {
      expect(controllerContent).toContain("List<SelectOption>");
    });

    it("should return PageReference", () => {
      expect(controllerContent).toContain("PageReference");
    });
  });
});
