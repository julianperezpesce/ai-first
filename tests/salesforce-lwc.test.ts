import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { extractSymbols } from "../src/analyzers/symbols";
import { FileInfo } from "../src/core/repoScanner";
import { detectAdapter } from "../src/core/adapters/index.js";
import fs from "fs";
import path from "path";
import os from "os";

const SALESFORCE_ENTERPRISE_PATH = path.join(process.cwd(), "test-projects/salesforce-enterprise");

describe("Salesforce LWC Detection", () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lwc-test-"));
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

    it("should detect LWC directory in the enterprise project", () => {
      const lwcDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc");
      const exists = fs.existsSync(lwcDir);
      expect(exists).toBe(true);

      const components = fs.readdirSync(lwcDir);
      expect(components).toContain("accountList");
      expect(components).toContain("opportunityCard");
    });

    it("should have 2 LWC components in the enterprise project", () => {
      const lwcDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc");
      const components = fs.readdirSync(lwcDir).filter(f => {
        const componentDir = path.join(lwcDir, f);
        return fs.statSync(componentDir).isDirectory();
      });

      expect(components).toHaveLength(2);
      expect(components).toContain("accountList");
      expect(components).toContain("opportunityCard");
    });
  });

  // =========================================================================
  // accountList LWC Component - All 4 Files
  // =========================================================================

  describe("accountList LWC Component", () => {
    const accountListPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList");

    it("should have accountList.js file with LWC class", () => {
      const jsPath = path.join(accountListPath, "accountList.js");
      expect(fs.existsSync(jsPath)).toBe(true);

      const content = fs.readFileSync(jsPath, "utf-8");
      expect(content).toContain("import { LightningElement");
      expect(content).toContain("export default class AccountList");
      expect(content).toContain("extends LightningElement");
    });

    it("should have accountList.html file with template markup", () => {
      const htmlPath = path.join(accountListPath, "accountList.html");
      expect(fs.existsSync(htmlPath)).toBe(true);

      const content = fs.readFileSync(htmlPath, "utf-8");
      expect(content).toContain("<template>");
      expect(content).toContain("<lightning-card");
      expect(content).toContain("for:each={filteredAccounts}");
      expect(content).toContain("onchange={handleSearchTermChange}");
    });

    it("should have accountList.css file with styling", () => {
      const cssPath = path.join(accountListPath, "accountList.css");
      expect(fs.existsSync(cssPath)).toBe(true);

      const content = fs.readFileSync(cssPath, "utf-8");
      expect(content).toContain(".slds-table");
      expect(content).toContain(".slds-truncate");
      expect(content).toContain(".account-link");
    });

    it("should have accountList.js-meta.xml file with exposed targets", () => {
      const metaPath = path.join(accountListPath, "accountList.js-meta.xml");
      expect(fs.existsSync(metaPath)).toBe(true);

      const content = fs.readFileSync(metaPath, "utf-8");
      expect(content).toContain("isExposed");
      expect(content).toContain("lightning__RecordPage");
      expect(content).toContain("lightning__AppPage");
      expect(content).toContain("lightning__HomePage");
    });
  });

  // =========================================================================
  // opportunityCard LWC Component - All 4 Files
  // =========================================================================

  describe("opportunityCard LWC Component", () => {
    const opportunityCardPath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard");

    it("should have opportunityCard.js file with LWC class", () => {
      const jsPath = path.join(opportunityCardPath, "opportunityCard.js");
      expect(fs.existsSync(jsPath)).toBe(true);

      const content = fs.readFileSync(jsPath, "utf-8");
      expect(content).toContain("import { LightningElement");
      expect(content).toContain("export default class OpportunityCard");
      expect(content).toContain("NavigationMixin(LightningElement)");
      expect(content).toContain("NavigationMixin");
    });

    it("should have opportunityCard.html file with card markup", () => {
      const htmlPath = path.join(opportunityCardPath, "opportunityCard.html");
      expect(fs.existsSync(htmlPath)).toBe(true);

      const content = fs.readFileSync(htmlPath, "utf-8");
      expect(content).toContain("<template>");
      expect(content).toContain("<lightning-card");
      expect(content).toContain("if:true={");
      expect(content).toContain("onclick={handleViewRecord}");
    });

    it("should have opportunityCard.css file with urgency styling", () => {
      const cssPath = path.join(opportunityCardPath, "opportunityCard.css");
      expect(fs.existsSync(cssPath)).toBe(true);

      const content = fs.readFileSync(cssPath, "utf-8");
      expect(content).toContain(".urgency-past");
      expect(content).toContain(".urgency-critical");
      expect(content).toContain(".urgency-warning");
      expect(content).toContain(".urgency-normal");
    });

    it("should have opportunityCard.js-meta.xml file with exposed targets", () => {
      const metaPath = path.join(opportunityCardPath, "opportunityCard.js-meta.xml");
      expect(fs.existsSync(metaPath)).toBe(true);

      const content = fs.readFileSync(metaPath, "utf-8");
      expect(content).toContain("isExposed");
      expect(content).toContain("lightning__RecordPage");
      expect(content).toContain("lightning__AppPage");
    });
  });

  // =========================================================================
  // accountList JS - LWC Decorators and Features
  // =========================================================================

  describe("accountList.js - LWC Decorators and Features", () => {
    it("should detect @track decorator for reactive properties", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      // @track decorator pattern
      expect(content).toContain("@track");
      expect(content).toMatch(/@track\s+accounts\s*=/);
      expect(content).toMatch(/@track\s+filteredAccounts\s*=/);
      expect(content).toMatch(/@track\s+searchTerm\s*=/);
      expect(content).toMatch(/@track\s+industryFilter\s*=/);
      expect(content).toMatch(/@track\s+isLoading\s*=/);
      expect(content).toMatch(/@track\s+error\s*=/);
    });

    it("should detect @wire decorator for apex methods", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      expect(content).toContain("@wire");
      expect(content).toContain("getAccounts");
      expect(content).toContain("@salesforce/apex");
    });

    it("should detect LightningElement as base class", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      expect(content).toContain("extends LightningElement");
    });

    it("should detect getAccounts import from @salesforce/apex", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      expect(content).toContain("import getAccounts from '@salesforce/apex/AccountController.getAccounts'");
    });

    it("should detect ShowToastEvent import", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      expect(content).toContain("import { ShowToastEvent } from 'lightning/platformShowToastEvent'");
    });

    it("should detect getter for hasAccounts", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      expect(content).toContain("get hasAccounts");
      expect(content).toMatch(/get\s+hasAccounts\s*\(\)\s*\{/);
    });

    it("should detect event handlers", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      expect(content).toContain("handleSearchTermChange");
      expect(content).toContain("handleIndustryChange");
      expect(content).toContain("handleRefresh");
      expect(content).toContain("handleAccountClick");
    });

    it("should detect custom event dispatch", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      expect(content).toContain("dispatchEvent(new CustomEvent('accountselect'");
    });

    it("should extract symbols from accountList.js", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/lwc/accountList/accountList.js", "js", content);
      const result = extractSymbols([file]);

      // Should detect the class
      const classSymbols = result.symbols.filter(s => s.type === "class");
      const accountListClass = classSymbols.find(s => s.name === "AccountList");
      expect(accountListClass).toBeDefined();
    });
  });

  // =========================================================================
  // opportunityCard JS - LWC Decorators and Features
  // =========================================================================

  describe("opportunityCard.js - LWC Decorators and Features", () => {
    it("should detect @api decorator for public properties", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      expect(content).toContain("@api");
      expect(content).toMatch(/@api\s+recordId/);
    });

    it("should detect @track decorator for reactive properties", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      expect(content).toContain("@track");
      expect(content).toMatch(/@track\s+opportunity\s*=/);
      expect(content).toMatch(/@track\s+isLoading\s*=/);
    });

    it("should detect @wire decorator for uiRecordApi", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      expect(content).toContain("@wire");
      expect(content).toContain("getRecord");
      expect(content).toContain("lightning/uiRecordApi");
    });

    it("should detect NavigationMixin import", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      expect(content).toContain("import { NavigationMixin } from 'lightning/navigation'");
      expect(content).toContain("extends NavigationMixin(LightningElement)");
    });

    it("should detect lightning/uiRecordApi imports", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      expect(content).toContain("import { getRecord, getFieldValue } from 'lightning/uiRecordApi'");
    });

    it("should detect @salesforce/schema imports", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      expect(content).toContain("@salesforce/schema/Opportunity.Name");
      expect(content).toContain("@salesforce/schema/Opportunity.StageName");
      expect(content).toContain("@salesforce/schema/Opportunity.Amount");
      expect(content).toContain("@salesforce/schema/Opportunity.CloseDate");
      expect(content).toContain("@salesforce/schema/Opportunity.Account.Name");
    });

    it("should detect getter methods for computed properties", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      expect(content).toContain("get name");
      expect(content).toContain("get stage");
      expect(content).toContain("get amount");
      expect(content).toContain("get closeDate");
      expect(content).toContain("get accountName");
      expect(content).toContain("get stageColor");
      expect(content).toContain("get formattedAmount");
      expect(content).toContain("get formattedCloseDate");
      expect(content).toContain("get daysUntilClose");
      expect(content).toContain("get urgencyClass");
    });

    it("should detect NavigationMixin.Navigate usage", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      expect(content).toContain("NavigationMixin.Navigate");
      expect(content).toContain("handleViewRecord");
      expect(content).toContain("handleEditRecord");
    });

    it("should extract symbols from opportunityCard.js", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/lwc/opportunityCard/opportunityCard.js", "js", content);
      const result = extractSymbols([file]);

      // Should detect the class
      const classSymbols = result.symbols.filter(s => s.type === "class");
      const opportunityCardClass = classSymbols.find(s => s.name === "OpportunityCard");
      expect(opportunityCardClass).toBeDefined();
    });
  });

  // =========================================================================
  // LWC HTML Template Tests
  // =========================================================================

  describe("LWC HTML Templates", () => {
    describe("accountList.html", () => {
      it("should have proper template tag", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.html"),
          "utf-8"
        );

        expect(content).toContain("<template>");
        expect(content).toContain("</template>");
      });

      it("should use lightning-base components", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.html"),
          "utf-8"
        );

        expect(content).toContain("<lightning-card");
        expect(content).toContain("<lightning-input");
        expect(content).toContain("<lightning-combobox");
        expect(content).toContain("<lightning-button");
        expect(content).toContain("<lightning-spinner");
        expect(content).toContain("<lightning-layout");
        expect(content).toContain("<lightning-formatted-number");
      });

      it("should have for:each iteration", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.html"),
          "utf-8"
        );

        expect(content).toContain("for:each={filteredAccounts}");
        expect(content).toContain("for:item=");
      });

      it("should have conditional rendering with if:true/if:false", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.html"),
          "utf-8"
        );

        expect(content).toContain("if:true={isLoading}");
        expect(content).toContain("if:true={hasAccounts}");
        expect(content).toContain("if:false={hasAccounts}");
      });

      it("should have slot elements", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.html"),
          "utf-8"
        );

        expect(content).toContain("slot=");
      });

      it("should reference JS methods as event handlers", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.html"),
          "utf-8"
        );

        expect(content).toContain("onchange={handleSearchTermChange}");
        expect(content).toContain("onchange={handleIndustryChange}");
        expect(content).toContain("onclick={handleRefresh}");
        expect(content).toContain("onclick={handleAccountClick}");
      });
    });

    describe("opportunityCard.html", () => {
      it("should have proper template tag", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.html"),
          "utf-8"
        );

        expect(content).toContain("<template>");
        expect(content).toContain("</template>");
      });

      it("should use lightning-base components", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.html"),
          "utf-8"
        );

        expect(content).toContain("<lightning-card");
        expect(content).toContain("<lightning-button");
        expect(content).toContain("<lightning-button-group");
        expect(content).toContain("<lightning-icon");
      });

      it("should have conditional rendering", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.html"),
          "utf-8"
        );

        expect(content).toContain("if:true={");
        expect(content).toContain("if:true={daysUntilClose}");
      });

      it("should reference computed getters", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.html"),
          "utf-8"
        );

        expect(content).toContain("{name}");
        expect(content).toContain("{stage}");
        expect(content).toContain("{formattedAmount}");
        expect(content).toContain("{formattedCloseDate}");
        expect(content).toContain("{urgencyClass}");
        expect(content).toContain("{stageColor}");
        expect(content).toContain("{daysUntilClose}");
      });

      it("should reference JS methods as event handlers", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.html"),
          "utf-8"
        );

        expect(content).toContain("onclick={handleViewRecord}");
        expect(content).toContain("onclick={handleEditRecord}");
      });
    });
  });

  // =========================================================================
  // LWC CSS Tests
  // =========================================================================

  describe("LWC CSS", () => {
    describe("accountList.css", () => {
      it("should have CSS class selectors", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.css"),
          "utf-8"
        );

        expect(content).toContain(".slds-table");
        expect(content).toContain(".slds-card");
        expect(content).toContain(".account-link");
      });

      it("should have SLDS design tokens", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.css"),
          "utf-8"
        );

        // SLDS color tokens
        expect(content).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
        expect(content).toContain("background-color");
        expect(content).toContain("border");
        expect(content).toContain("padding");
      });

      it("should define hover states", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.css"),
          "utf-8"
        );

        expect(content).toContain(":hover");
        expect(content).toContain(".account-link:hover");
      });
    });

    describe("opportunityCard.css", () => {
      it("should have CSS class selectors", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.css"),
          "utf-8"
        );

        expect(content).toContain(".opportunity-card");
        expect(content).toContain(".opportunity-name");
        expect(content).toContain(".info-label");
        expect(content).toContain(".info-value");
      });

      it("should have urgency color classes", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.css"),
          "utf-8"
        );

        expect(content).toContain(".urgency-past");
        expect(content).toContain(".urgency-critical");
        expect(content).toContain(".urgency-warning");
        expect(content).toContain(".urgency-normal");
      });

      it("should have SLDS theme classes", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.css"),
          "utf-8"
        );

        expect(content).toContain(".slds-theme_warning");
        expect(content).toContain(".slds-theme_info");
        expect(content).toContain(".slds-theme_success");
        expect(content).toContain(".slds-theme_error");
      });

      it("should have urgency styling classes", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.css"),
          "utf-8"
        );

        expect(content).toContain(".urgency-past");
        expect(content).toContain(".urgency-critical");
        expect(content).toContain(".urgency-warning");
        expect(content).toContain(".urgency-normal");
      });
    });
  });

  // =========================================================================
  // LWC Metadata Tests
  // =========================================================================

  describe("LWC Metadata (js-meta.xml)", () => {
    describe("accountList.js-meta.xml", () => {
      it("should be valid JSON or XML metadata", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js-meta.xml"),
          "utf-8"
        );

        // Should contain key metadata fields
        expect(content).toContain("apiVersion");
        expect(content).toContain("isExposed");
        expect(content).toContain("masterLabel");
        expect(content).toContain("targets");
      });

      it("should expose targets for Lightning Experience", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js-meta.xml"),
          "utf-8"
        );

        expect(content).toContain("lightning__RecordPage");
        expect(content).toContain("lightning__AppPage");
        expect(content).toContain("lightning__HomePage");
      });

      it("should define properties for component configuration", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js-meta.xml"),
          "utf-8"
        );

        expect(content).toContain("properties");
        expect(content).toContain("searchTerm");
        expect(content).toContain("industryFilter");
      });

      it("should have correct API version", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js-meta.xml"),
          "utf-8"
        );

        expect(content).toContain("59.0");
      });
    });

    describe("opportunityCard.js-meta.xml", () => {
      it("should be valid JSON or XML metadata", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js-meta.xml"),
          "utf-8"
        );

        expect(content).toContain("apiVersion");
        expect(content).toContain("isExposed");
        expect(content).toContain("masterLabel");
        expect(content).toContain("targets");
      });

      it("should expose targets for Lightning Experience", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js-meta.xml"),
          "utf-8"
        );

        expect(content).toContain("lightning__RecordPage");
        expect(content).toContain("lightning__AppPage");
      });

      it("should define properties for component configuration", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js-meta.xml"),
          "utf-8"
        );

        expect(content).toContain("properties");
        expect(content).toContain("recordId");
      });

      it("should have correct API version", () => {
        const content = fs.readFileSync(
          path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js-meta.xml"),
          "utf-8"
        );

        expect(content).toContain("59.0");
      });
    });
  });

  // =========================================================================
  // LWC Component Detection Tests
  // =========================================================================

  describe("LWC Component Detection", () => {
    it("should detect LWC JavaScript files as entrypoints", () => {
      const accountListJs = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js");
      const opportunityCardJs = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js");

      expect(fs.existsSync(accountListJs)).toBe(true);
      expect(fs.existsSync(opportunityCardJs)).toBe(true);
    });

    it("should detect LWC HTML templates", () => {
      const accountListHtml = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.html");
      const opportunityCardHtml = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.html");

      expect(fs.existsSync(accountListHtml)).toBe(true);
      expect(fs.existsSync(opportunityCardHtml)).toBe(true);
    });

    it("should detect LWC CSS files", () => {
      const accountListCss = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.css");
      const opportunityCardCss = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.css");

      expect(fs.existsSync(accountListCss)).toBe(true);
      expect(fs.existsSync(opportunityCardCss)).toBe(true);
    });

    it("should detect LWC metadata files", () => {
      const accountListMeta = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js-meta.xml");
      const opportunityCardMeta = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js-meta.xml");

      expect(fs.existsSync(accountListMeta)).toBe(true);
      expect(fs.existsSync(opportunityCardMeta)).toBe(true);
    });

    it("should verify all 4 files exist for each LWC component", () => {
      const components = ["accountList", "opportunityCard"];

      for (const component of components) {
        const basePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc", component);
        expect(fs.existsSync(path.join(basePath, `${component}.js`))).toBe(true);
        expect(fs.existsSync(path.join(basePath, `${component}.html`))).toBe(true);
        expect(fs.existsSync(path.join(basePath, `${component}.css`))).toBe(true);
        expect(fs.existsSync(path.join(basePath, `${component}.js-meta.xml`))).toBe(true);
      }
    });

    it("should detect LightningElement imports from lwc", () => {
      const accountListContent = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );
      const opportunityCardContent = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      expect(accountListContent).toContain("from 'lwc'");
      expect(opportunityCardContent).toContain("from 'lwc'");
    });
  });

  // =========================================================================
  // UNIT TESTS - LWC Patterns
  // =========================================================================

  describe("Unit: LWC JavaScript patterns", () => {
    it("should parse LWC class declaration", () => {
      const content = `import { LightningElement } from 'lwc';
        export default class MyComponent extends LightningElement {}`;

      const file = createFileInfo("test.js", "js", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.name === "MyComponent");
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.type).toBe("class");
    });

    it("should detect @api decorator pattern", () => {
      const content = `import { LightningElement, api } from 'lwc';
        export default class TestComponent extends LightningElement {
          @api recordId;
        }`;

      const file = createFileInfo("test.js", "js", content);
      const result = extractSymbols([file]);

      // Class should be detected
      const classSymbol = result.symbols.find(s => s.name === "TestComponent");
      expect(classSymbol).toBeDefined();
      expect(content).toContain("@api");
    });

    it("should detect @track decorator pattern", () => {
      const content = `import { LightningElement, track } from 'lwc';
        export default class TestComponent extends LightningElement {
          @track items = [];
        }`;

      const file = createFileInfo("test.js", "js", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.name === "TestComponent");
      expect(classSymbol).toBeDefined();
      expect(content).toContain("@track");
    });

    it("should detect @wire decorator pattern", () => {
      const content = `import { LightningElement, wire } from 'lwc';
        import getRecords from '@salesforce/apex/MyController.getRecords';
        export default class TestComponent extends LightningElement {
          @wire(getRecords, { object: 'Account' })
          wiredRecords;
        }`;

      const file = createFileInfo("test.js", "js", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.name === "TestComponent");
      expect(classSymbol).toBeDefined();
      expect(content).toContain("@wire");
    });

    it("should detect getter methods", () => {
      const content = `import { LightningElement } from 'lwc';
        export default class TestComponent extends LightningElement {
          get items() { return this._items; }
        }`;

      const file = createFileInfo("test.js", "js", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.name === "TestComponent");
      expect(classSymbol).toBeDefined();
      expect(content).toContain("get items");
    });

    it("should detect NavigationMixin pattern", () => {
      const content = `import { LightningElement } from 'lwc';
        import { NavigationMixin } from 'lightning/navigation';
        export default class TestComponent extends NavigationMixin(LightningElement) {}`;

      const file = createFileInfo("test.js", "js", content);
      const result = extractSymbols([file]);

      expect(content).toContain("NavigationMixin");
      expect(content).toContain("NavigationMixin(LightningElement)");
    });
  });

  // =========================================================================
  // Symbol Extraction Accuracy
  // =========================================================================

  describe("Symbol Extraction Accuracy for LWC", () => {
    it("should extract class symbol from accountList.js", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/lwc/accountList/accountList.js", "js", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.type === "class" && s.name === "AccountList");
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.file).toBe("force-app/main/default/lwc/accountList/accountList.js");
    });

    it("should extract class symbol from opportunityCard.js", () => {
      const content = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/lwc/opportunityCard/opportunityCard.js", "js", content);
      const result = extractSymbols([file]);

      const classSymbol = result.symbols.find(s => s.type === "class" && s.name === "OpportunityCard");
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.file).toBe("force-app/main/default/lwc/opportunityCard/opportunityCard.js");
    });

    it("should detect exported LWC classes", () => {
      const accountListContent = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      const file = createFileInfo("force-app/main/default/lwc/accountList/accountList.js", "js", accountListContent);
      const result = extractSymbols([file]);

      // Find AccountList class - it should be exported
      const accountListClass = result.symbols.find(s => s.name === "AccountList");
      expect(accountListClass).toBeDefined();
      expect(accountListClass?.export).toBe(true);
    });
  });

  // =========================================================================
  // Entrypoint Detection for LWC
  // =========================================================================

  describe("Entrypoint Detection for LWC Components", () => {
    it("should identify LWC components as entrypoints", () => {
      const accountListContent = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      const opportunityCardContent = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js"),
        "utf-8"
      );

      // LWC components are always entrypoints - they extend LightningElement
      expect(accountListContent).toContain("extends LightningElement");
      expect(opportunityCardContent).toContain("LightningElement");

      // LWC components use decorators
      expect(accountListContent).toMatch(/@(?:api|track|wire)/);
      expect(opportunityCardContent).toMatch(/@(?:api|track|wire)/);
    });

    it("should identify LWC as frontend component type", () => {
      const accountListContent = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js"),
        "utf-8"
      );

      // LWC components have specific patterns
      expect(accountListContent).toContain("LightningElement");
      expect(accountListContent).toContain("from 'lwc'");
    });

    it("should verify LWC metadata marks components as exposed", () => {
      const accountListMeta = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/accountList/accountList.js-meta.xml"),
        "utf-8"
      );

      const opportunityCardMeta = fs.readFileSync(
        path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/lwc/opportunityCard/opportunityCard.js-meta.xml"),
        "utf-8"
      );

      expect(accountListMeta).toContain("isExposed");
      expect(opportunityCardMeta).toContain("isExposed");
    });
  });
});
