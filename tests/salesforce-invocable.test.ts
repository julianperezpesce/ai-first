import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const SALESFORCE_ENTERPRISE_PATH = path.join(process.cwd(), "fixtures/salesforce-enterprise");

describe("Salesforce @InvocableMethod/@InvocableVariable Detection", () => {
  
  // =========================================================================
  // INTEGRATION TESTS - Using real Salesforce Enterprise test project
  // =========================================================================

  describe("Integration: Real Salesforce Enterprise Project", () => {
    it("should detect AccountMergeService.cls", () => {
      const classPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountMergeService.cls");
      expect(fs.existsSync(classPath)).toBe(true);
    });

    it("should read AccountMergeService.cls successfully", () => {
      const classPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountMergeService.cls");
      const content = fs.readFileSync(classPath, "utf-8");
      
      expect(content).toContain("public class AccountMergeService");
    });
  });

  // =========================================================================
  // @InvocableMethod DETECTION
  // =========================================================================

  describe("@InvocableMethod Detection", () => {
    let classContent: string;

    beforeAll(() => {
      const classPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountMergeService.cls");
      classContent = fs.readFileSync(classPath, "utf-8");
    });

    it("should contain @InvocableMethod annotation", () => {
      expect(classContent).toContain("@InvocableMethod");
    });

    it("should have label attribute", () => {
      expect(classContent).toContain("label='Merge Duplicate Accounts'");
    });

    it("should have description attribute", () => {
      expect(classContent).toContain("description='Merges duplicate accounts and reassigns related records'");
    });

    it("should have category attribute", () => {
      expect(classContent).toContain("category='Account Management'");
    });

    it("should have mergeAccounts method", () => {
      expect(classContent).toContain("mergeAccounts(List<MergeRequest> requests)");
    });

    it("should return List<MergeResult>", () => {
      expect(classContent).toContain("List<MergeResult> mergeAccounts");
    });
  });

  // =========================================================================
  // @InvocableVariable DETECTION
  // =========================================================================

  describe("@InvocableVariable Detection", () => {
    let classContent: string;

    beforeAll(() => {
      const classPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountMergeService.cls");
      classContent = fs.readFileSync(classPath, "utf-8");
    });

    it("should contain @InvocableVariable annotations", () => {
      const invocableVarCount = (classContent.match(/@InvocableVariable/g) || []).length;
      expect(invocableVarCount).toBeGreaterThanOrEqual(4);
    });

    it("should have masterAccountId with @InvocableVariable", () => {
      const requestIdx = classContent.indexOf("public class MergeRequest");
      const requestBlock = classContent.substring(requestIdx, requestIdx + 1000);
      expect(requestBlock).toContain("@InvocableVariable");
      expect(requestBlock).toContain("masterAccountId");
    });

    it("should have duplicateAccountId with @InvocableVariable", () => {
      const requestIdx = classContent.indexOf("public class MergeRequest");
      const requestBlock = classContent.substring(requestIdx, requestIdx + 1000);
      expect(requestBlock).toContain("@InvocableVariable");
      expect(requestBlock).toContain("duplicateAccountId");
    });

    it("should have reassignContacts with @InvocableVariable", () => {
      const requestIdx = classContent.indexOf("public class MergeRequest");
      const requestBlock = classContent.substring(requestIdx, requestIdx + 1000);
      expect(requestBlock).toContain("@InvocableVariable");
      expect(requestBlock).toContain("reassignContacts");
    });

    it("should have reassignOpportunities with @InvocableVariable", () => {
      const requestIdx = classContent.indexOf("public class MergeRequest");
      const requestBlock = classContent.substring(requestIdx, requestIdx + 1000);
      expect(requestBlock).toContain("@InvocableVariable");
      expect(requestBlock).toContain("reassignOpportunities");
    });
  });

  // =========================================================================
  // INNER CLASSES
  // =========================================================================

  describe("Inner Classes", () => {
    let classContent: string;

    beforeAll(() => {
      const classPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/classes/AccountMergeService.cls");
      classContent = fs.readFileSync(classPath, "utf-8");
    });

    it("should have MergeRequest inner class", () => {
      expect(classContent).toContain("public class MergeRequest");
    });

    it("should have MergeResult inner class", () => {
      expect(classContent).toContain("public class MergeResult");
    });

    it("should have isSuccess field in MergeResult", () => {
      const resultIdx = classContent.indexOf("public class MergeResult");
      const resultBlock = classContent.substring(resultIdx, resultIdx + 500);
      expect(resultBlock).toContain("isSuccess");
    });

    it("should have message field in MergeResult", () => {
      const resultIdx = classContent.indexOf("public class MergeResult");
      const resultBlock = classContent.substring(resultIdx, resultIdx + 500);
      expect(resultBlock).toContain("message");
    });

    it("should have masterAccountId field in MergeRequest", () => {
      const requestIdx = classContent.indexOf("public class MergeRequest");
      const requestBlock = classContent.substring(requestIdx, requestIdx + 500);
      expect(requestBlock).toContain("masterAccountId");
    });

    it("should have duplicateAccountId field in MergeRequest", () => {
      const requestIdx = classContent.indexOf("public class MergeRequest");
      const requestBlock = classContent.substring(requestIdx, requestIdx + 500);
      expect(requestBlock).toContain("duplicateAccountId");
    });
  });
});
