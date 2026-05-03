import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const SALESFORCE_ENTERPRISE_PATH = path.join(process.cwd(), "fixtures/salesforce-enterprise");

describe("Salesforce Custom Metadata Types Detection", () => {
  
  // =========================================================================
  // INTEGRATION TESTS - Using real Salesforce Enterprise test project
  // =========================================================================

  describe("Integration: Real Salesforce Enterprise Project", () => {
    it("should detect customMetadata directory", () => {
      const customMetadataDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/customMetadata");
      expect(fs.existsSync(customMetadataDir)).toBe(true);
    });

    it("should detect Integration_Setting.md-meta.xml file", () => {
      const metadataPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/customMetadata/Integration_Setting.md-meta.xml");
      expect(fs.existsSync(metadataPath)).toBe(true);
    });

    it("should read Integration_Setting metadata successfully", () => {
      const metadataPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/customMetadata/Integration_Setting.md-meta.xml");
      const content = fs.readFileSync(metadataPath, "utf-8");
      
      expect(content).toContain("<CustomMetadata xmlns=");
      expect(content).toContain("http://soap.sforce.com/2006/04/metadata");
    });
  });

  // =========================================================================
  // CUSTOM METADATA RECORD VERIFICATION
  // =========================================================================

  describe("Integration_Setting Metadata Record", () => {
    let metadataContent: string;

    beforeAll(() => {
      const metadataPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/customMetadata/Integration_Setting.md-meta.xml");
      metadataContent = fs.readFileSync(metadataPath, "utf-8");
    });

    it("should have correct XML declaration", () => {
      expect(metadataContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it("should have correct Salesforce namespace", () => {
      expect(metadataContent).toContain('xmlns="http://soap.sforce.com/2006/04/metadata"');
    });

    it("should have CustomMetadata as root element", () => {
      expect(metadataContent).toContain("<CustomMetadata xmlns=");
    });

    it("should have label 'Stripe Payment Gateway'", () => {
      expect(metadataContent).toContain("<label>Stripe Payment Gateway</label>");
    });

    it("should have protected set to false", () => {
      expect(metadataContent).toContain("<protected>false</protected>");
    });
  });

  // =========================================================================
  // CUSTOM METADATA FIELDS
  // =========================================================================

  describe("Integration_Setting Fields", () => {
    let metadataContent: string;

    beforeAll(() => {
      const metadataPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/customMetadata/Integration_Setting.md-meta.xml");
      metadataContent = fs.readFileSync(metadataPath, "utf-8");
    });

    it("should have API_Endpoint__c field", () => {
      expect(metadataContent).toContain("<field>API_Endpoint__c</field>");
    });

    it("should have API_Key__c field", () => {
      expect(metadataContent).toContain("<field>API_Key__c</field>");
    });

    it("should have Is_Active__c field", () => {
      expect(metadataContent).toContain("<field>Is_Active__c</field>");
    });

    it("should have Timeout__c field", () => {
      expect(metadataContent).toContain("<field>Timeout__c</field>");
    });

    it("should have Retry_Count__c field", () => {
      expect(metadataContent).toContain("<field>Retry_Count__c</field>");
    });

    it("should have API_Endpoint__c as string value", () => {
      const fieldIdx = metadataContent.indexOf("<field>API_Endpoint__c</field>");
      const fieldBlock = metadataContent.substring(fieldIdx, fieldIdx + 200);
      expect(fieldBlock).toContain('xsi:type="xsd:string"');
    });

    it("should have Is_Active__c as boolean value", () => {
      const fieldIdx = metadataContent.indexOf("<field>Is_Active__c</field>");
      const fieldBlock = metadataContent.substring(fieldIdx, fieldIdx + 200);
      expect(fieldBlock).toContain('xsi:type="xsd:boolean"');
    });

    it("should have Timeout__c as double value", () => {
      const fieldIdx = metadataContent.indexOf("<field>Timeout__c</field>");
      const fieldBlock = metadataContent.substring(fieldIdx, fieldIdx + 200);
      expect(fieldBlock).toContain('xsi:type="xsd:double"');
    });

    it("should have correct API endpoint value", () => {
      expect(metadataContent).toContain("https://api.stripe.com/v1");
    });

    it("should have correct timeout value", () => {
      expect(metadataContent).toContain("<value xsi:type=\"xsd:double\">30000</value>");
    });
  });
});
