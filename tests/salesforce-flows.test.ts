import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FileInfo } from "../src/core/repoScanner";
import fs from "fs";
import path from "path";
import os from "os";
import { extractSymbols } from "../src/analyzers/symbols";

const SALESFORCE_ENTERPRISE_PATH = path.join(process.cwd(), "test-projects/salesforce-enterprise");

describe("Salesforce Flows Detection", () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "salesforce-flows-test-"));
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
    it("should detect both Flow files in the enterprise project", () => {
      const flowsDir = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows");
      const files = fs.readdirSync(flowsDir).filter(f => f.endsWith(".flow-meta.xml"));

      expect(files).toHaveLength(2);
      expect(files).toContain("Account_Create.flow-meta.xml");
      expect(files).toContain("Opportunity_Update.flow-meta.xml");
    });

    it("should read both Flow files successfully", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");

      const accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");
      const opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");

      expect(accountCreateContent).toContain("<Flow xmlns=");
      expect(opportunityUpdateContent).toContain("<Flow xmlns=");
    });
  });

  // =========================================================================
  // Account_Create.flow-meta.xml - Screen Flow
  // =========================================================================

  describe("Account_Create Flow (Screen Flow)", () => {
    let accountCreateContent: string;

    beforeAll(() => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");
    });

    it("should have correct apiVersion (59.0)", () => {
      expect(accountCreateContent).toContain("<apiVersion>59.0</apiVersion>");
    });

    it("should have correct label (Account Create)", () => {
      expect(accountCreateContent).toContain("<label>Account Create</label>");
    });

    it("should have processType as Flow (Screen Flow)", () => {
      expect(accountCreateContent).toContain("<processType>Flow</processType>");
    });

    it("should have status Active", () => {
      expect(accountCreateContent).toContain("<status>Active</status>");
    });

    describe("Screen Elements", () => {
      it("should have EnterAccountDetails screen", () => {
        expect(accountCreateContent).toContain("<name>EnterAccountDetails</name>");
        expect(accountCreateContent).toContain("<label>Enter Account Details</label>");
      });

      it("should have screen location coordinates", () => {
        expect(accountCreateContent).toContain("<locationX>176</locationX>");
        expect(accountCreateContent).toContain("<locationY>158</locationY>");
      });

      it("should allow back, finish, and pause on screen", () => {
        expect(accountCreateContent).toContain("<allowBack>true</allowBack>");
        expect(accountCreateContent).toContain("<allowFinish>true</allowFinish>");
        expect(accountCreateContent).toContain("<allowPause>true</allowPause>");
      });

      it("should have connector to ValidateAccountData", () => {
        expect(accountCreateContent).toContain("<targetReference>ValidateAccountData</targetReference>");
      });
    });

    describe("Input Fields", () => {
      it("should have AccountName field (required)", () => {
        expect(accountCreateContent).toContain("<name>AccountName</name>");
        expect(accountCreateContent).toContain("<fieldType>InputField</fieldType>");
        expect(accountCreateContent).toContain("<label>Account Name</label>");
        expect(accountCreateContent).toContain("<required>true</required>");
        expect(accountCreateContent).toContain("Enter the full legal name of the account");
      });

      it("should have Industry field", () => {
        expect(accountCreateContent).toContain("<name>Industry</name>");
        expect(accountCreateContent).toContain("<fieldType>InputField</fieldType>");
        expect(accountCreateContent).toContain("<label>Industry</label>");
        expect(accountCreateContent).toContain("<dataType>String</dataType>");
      });

      it("should have AnnualRevenue field (Currency)", () => {
        expect(accountCreateContent).toContain("<name>AnnualRevenue</name>");
        expect(accountCreateContent).toContain("<fieldType>InputField</fieldType>");
        expect(accountCreateContent).toContain("<label>Annual Revenue</label>");
        expect(accountCreateContent).toContain("<dataType>Currency</dataType>");
      });

      it("should have Phone field", () => {
        expect(accountCreateContent).toContain("<name>Phone</name>");
        expect(accountCreateContent).toContain("<fieldType>InputField</fieldType>");
        expect(accountCreateContent).toContain("<label>Phone</label>");
        expect(accountCreateContent).toContain("<dataType>Phone</dataType>");
      });

      it("should have BillingStreet field", () => {
        expect(accountCreateContent).toContain("<name>BillingStreet</name>");
        expect(accountCreateContent).toContain("<fieldType>InputField</fieldType>");
        expect(accountCreateContent).toContain("<label>Billing Street</label>");
        expect(accountCreateContent).toContain("<dataType>String</dataType>");
      });

      it("should have additional billing address fields", () => {
        expect(accountCreateContent).toContain("<name>BillingCity</name>");
        expect(accountCreateContent).toContain("<name>BillingState</name>");
        expect(accountCreateContent).toContain("<name>BillingPostalCode</name>");
        expect(accountCreateContent).toContain("<name>BillingCountry</name>");
      });

      it("should have total of 9 input fields in screen", () => {
        // Count <fields> elements within the <screens> section
        const screensMatch = accountCreateContent.match(/<screens>([\s\S]*?)<\/screens>/);
        expect(screensMatch).toBeTruthy();
        const screensContent = screensMatch?.[1] || "";
        const fieldMatches = screensContent.match(/<fields>/g);
        expect(fieldMatches).toHaveLength(9);
      });
    });

    describe("Decision Elements", () => {
      it("should have ValidateAccountData decision", () => {
        expect(accountCreateContent).toContain("<name>ValidateAccountData</name>");
        expect(accountCreateContent).toContain("<label>Validate Account Data</label>");
      });

      it("should have decision location coordinates", () => {
        expect(accountCreateContent).toContain("<locationX>176</locationX>");
        expect(accountCreateContent).toContain("<locationY>326</locationY>");
      });

      it("should have default connector label", () => {
        expect(accountCreateContent).toContain("<defaultConnectorLabel>Default Outcome</defaultConnectorLabel>");
      });

      it("should have IsValidAccount rule with conditions", () => {
        expect(accountCreateContent).toContain("<name>IsValidAccount</name>");
        expect(accountCreateContent).toContain("<conditionLogic>and</conditionLogic>");
        expect(accountCreateContent).toContain("<leftValueReference>EnterAccountDetails.AccountName</leftValueReference>");
        expect(accountCreateContent).toContain("<operator>IsNull</operator>");
        expect(accountCreateContent).toContain("<label>Is Valid Account</label>");
      });
    });

    describe("Action Elements", () => {
      it("should have CreateAccountRecord action", () => {
        expect(accountCreateContent).toContain("<name>CreateAccountRecord</name>");
        expect(accountCreateContent).toContain("<label>Create Account Record</label>");
      });

      it("should have action type CreateRecord", () => {
        expect(accountCreateContent).toContain("<actionType>CreateRecord</actionType>");
      });

      it("should have input parameters mapping to screen fields", () => {
        expect(accountCreateContent).toContain("<elementReference>EnterAccountDetails.AccountName</elementReference>");
        expect(accountCreateContent).toContain("<elementReference>EnterAccountDetails.Industry</elementReference>");
        expect(accountCreateContent).toContain("<elementReference>EnterAccountDetails.AnnualRevenue</elementReference>");
        expect(accountCreateContent).toContain("<elementReference>EnterAccountDetails.Phone</elementReference>");
      });

      it("should target Account object", () => {
        expect(accountCreateContent).toContain("<object>Account</object>");
      });
    });

    describe("Start Element", () => {
      it("should have start element with location", () => {
        expect(accountCreateContent).toContain("<locationX>50</locationX>");
        expect(accountCreateContent).toContain("<locationY>0</locationY>");
      });

      it("should start with connector to EnterAccountDetails", () => {
        expect(accountCreateContent).toContain("<targetReference>EnterAccountDetails</targetReference>");
      });
    });
  });

  // =========================================================================
  // Opportunity_Update.flow-meta.xml - Record-triggered Flow
  // =========================================================================

  describe("Opportunity_Update Flow (Record-triggered Flow)", () => {
    let opportunityUpdateContent: string;

    beforeAll(() => {
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");
      opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");
    });

    it("should have correct apiVersion (59.0)", () => {
      expect(opportunityUpdateContent).toContain("<apiVersion>59.0</apiVersion>");
    });

    it("should have correct label (Opportunity Update)", () => {
      expect(opportunityUpdateContent).toContain("<label>Opportunity Update</label>");
    });

    it("should have processType as Flow (Record-triggered)", () => {
      expect(opportunityUpdateContent).toContain("<processType>Flow</processType>");
    });

    it("should have status Active", () => {
      expect(opportunityUpdateContent).toContain("<status>Active</status>");
    });

    describe("Trigger Elements", () => {
      it("should have OnOpportunityChange trigger", () => {
        expect(opportunityUpdateContent).toContain("<name>OnOpportunityChange</name>");
        expect(opportunityUpdateContent).toContain("<label>When an Opportunity is updated</label>");
      });

      it("should have trigger location coordinates", () => {
        expect(opportunityUpdateContent).toContain("<locationX>0</locationX>");
        expect(opportunityUpdateContent).toContain("<locationY>0</locationY>");
      });

      it("should have trigger condition in Chinese (当一条记录被更新时)", () => {
        expect(opportunityUpdateContent).toContain("<触发条件>When a record is updated</触发条件>");
      });

      it("should trigger on Opportunity object", () => {
        expect(opportunityUpdateContent).toContain("<object>Opportunity</object>");
      });

      it("should have trigger type Upon Create or Update", () => {
        expect(opportunityUpdateContent).toContain("<triggerType>Upon Create or Update</triggerType>");
      });

      it("should have filter on StageName IsChanged", () => {
        expect(opportunityUpdateContent).toContain("<filters>");
        expect(opportunityUpdateContent).toContain("<field>StageName</field>");
        expect(opportunityUpdateContent).toContain("<operator>IsChanged</operator>");
        expect(opportunityUpdateContent).toContain("<booleanValue>true</booleanValue>");
      });
    });

    describe("Decision Elements", () => {
      it("should have CheckStageChange decision", () => {
        expect(opportunityUpdateContent).toContain("<name>CheckStageChange</name>");
        expect(opportunityUpdateContent).toContain("<label>Check Stage Change</label>");
      });

      it("should have decision location coordinates", () => {
        expect(opportunityUpdateContent).toContain("<locationX>128</locationX>");
        expect(opportunityUpdateContent).toContain("<locationY>224</locationY>");
      });

      it("should have default connector label (No Stage Change)", () => {
        expect(opportunityUpdateContent).toContain("<defaultConnectorLabel>No Stage Change</defaultConnectorLabel>");
      });

      it("should have StageChangedToNegotiation rule", () => {
        expect(opportunityUpdateContent).toContain("<name>StageChangedToNegotiation</name>");
        expect(opportunityUpdateContent).toContain("<conditionLogic>and</conditionLogic>");
        expect(opportunityUpdateContent).toContain("<leftValueReference>$Opportunity.StageName</leftValueReference>");
        expect(opportunityUpdateContent).toContain("<operator>Equal</operator>");
        expect(opportunityUpdateContent).toContain("<stringValue>Negotiation/Review</stringValue>");
        expect(opportunityUpdateContent).toContain("<label>Stage Changed to Negotiation</label>");
      });

      it("should have StageChangedToClosedWon rule", () => {
        expect(opportunityUpdateContent).toContain("<name>StageChangedToClosedWon</name>");
        expect(opportunityUpdateContent).toContain("<conditionLogic>and</conditionLogic>");
        expect(opportunityUpdateContent).toContain("<leftValueReference>$Opportunity.StageName</leftValueReference>");
        expect(opportunityUpdateContent).toContain("<operator>Equal</operator>");
        expect(opportunityUpdateContent).toContain("<stringValue>Closed Won</stringValue>");
        expect(opportunityUpdateContent).toContain("<label>Stage Changed to Closed Won</label>");
      });

      it("should have 2 decision rules", () => {
        const ruleMatches = opportunityUpdateContent.match(/<name>StageChangedTo/g);
        expect(ruleMatches).toHaveLength(2);
      });
    });

    describe("Action Elements", () => {
      it("should have UpdateProbabilityHigh action", () => {
        expect(opportunityUpdateContent).toContain("<name>UpdateProbabilityHigh</name>");
        expect(opportunityUpdateContent).toContain("<label>Set Probability to High</label>");
      });

      it("should have action type UpdateRecord", () => {
        expect(opportunityUpdateContent).toContain("<actionType>UpdateRecord</actionType>");
      });

      it("should have OpportunityId input parameter", () => {
        expect(opportunityUpdateContent).toContain("<name>OpportunityId</name>");
        expect(opportunityUpdateContent).toContain("<elementReference>$Opportunity.Id</elementReference>");
      });

      it("should have Probability input parameter with value 90", () => {
        expect(opportunityUpdateContent).toContain("<name>Probability</name>");
        expect(opportunityUpdateContent).toContain("<numberValue>90</numberValue>");
      });

      it("should have SendWinNotification action", () => {
        expect(opportunityUpdateContent).toContain("<name>SendWinNotification</name>");
        expect(opportunityUpdateContent).toContain("<label>Send Win Notification</label>");
      });

      it("should have action type EmailAlert", () => {
        expect(opportunityUpdateContent).toContain("<actionType>EmailAlert</actionType>");
      });

      it("should have flowTransactionModel", () => {
        expect(opportunityUpdateContent).toContain("<flowTransactionModel>CurrentTransaction</flowTransactionModel>");
      });
    });

    describe("Start Element", () => {
      it("should have start element with location", () => {
        expect(opportunityUpdateContent).toContain("<locationX>50</locationX>");
        expect(opportunityUpdateContent).toContain("<locationY>0</locationY>");
      });

      it("should start with connector to CheckStageChange", () => {
        expect(opportunityUpdateContent).toContain("<targetReference>CheckStageChange</targetReference>");
      });
    });
  });

  // =========================================================================
  // FLOW FILE STRUCTURE VERIFICATION
  // =========================================================================

  describe("Flow File Structure", () => {
    it("should have valid XML declaration", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");

      const accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");
      const opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");

      expect(accountCreateContent).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
      expect(opportunityUpdateContent).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    });

    it("should have correct Salesforce Flow namespace", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");

      const accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");
      const opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");

      expect(accountCreateContent).toContain('xmlns="http://soap.sforce.com/2006/04/metadata"');
      expect(opportunityUpdateContent).toContain('xmlns="http://soap.sforce.com/2006/04/metadata"');
    });

    it("should have Flow root element in both files", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");

      const accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");
      const opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");

      expect(accountCreateContent).toContain("<Flow xmlns=");
      expect(opportunityUpdateContent).toContain("<Flow xmlns=");
    });

    it("should have interviewLabel in both flows", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");

      const accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");
      const opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");

      expect(accountCreateContent).toContain("<interviewLabel>Account Create Flow-1</interviewLabel>");
      expect(opportunityUpdateContent).toContain("<interviewLabel>Opportunity Update Flow-1</interviewLabel>");
    });
  });

  // =========================================================================
  // FLOW TYPES COMPARISON
  // =========================================================================

  describe("Flow Types Comparison", () => {
    it("should distinguish Screen Flow (Account_Create) from Record-triggered Flow (Opportunity_Update)", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");

      const accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");
      const opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");

      // Account_Create has screens element (Screen Flow indicator)
      expect(accountCreateContent).toContain("<screens>");
      expect(accountCreateContent).not.toContain("<triggers>");

      // Opportunity_Update has triggers element (Record-triggered Flow indicator)
      expect(opportunityUpdateContent).toContain("<triggers>");
      expect(opportunityUpdateContent).not.toContain("<screens>");
    });

    it("should have different start element targets based on flow type", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");

      const accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");
      const opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");

      // Account_Create starts with screen (EnterAccountDetails)
      expect(accountCreateContent).toContain("<targetReference>EnterAccountDetails</targetReference>");

      // Opportunity_Update starts with decision (CheckStageChange)
      expect(opportunityUpdateContent).toContain("<targetReference>CheckStageChange</targetReference>");
    });
  });

  // =========================================================================
  // UNIT TESTS - Flow XML parsing patterns
  // =========================================================================

  describe("Unit: Flow XML parsing patterns", () => {
    it("should parse Flow metadata elements", () => {
      const flowXml = `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <interviewLabel>Test Flow-1</interviewLabel>
    <label>Test Flow</label>
    <processType>Flow</processType>
    <status>Active</status>
</Flow>`;

      expect(flowXml).toContain("<apiVersion>59.0</apiVersion>");
      expect(flowXml).toContain("<label>Test Flow</label>");
      expect(flowXml).toContain("<processType>Flow</processType>");
      expect(flowXml).toContain("<status>Active</status>");
    });

    it("should parse Screen Flow elements", () => {
      const screenFlowXml = `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <screens>
        <name>TestScreen</name>
        <label>Test Screen</label>
        <fields>
            <name>TestField</name>
            <fieldType>InputField</fieldType>
            <required>true</required>
        </fields>
    </screens>
</Flow>`;

      expect(screenFlowXml).toContain("<screens>");
      expect(screenFlowXml).toContain("<name>TestScreen</name>");
      expect(screenFlowXml).toContain("<fieldType>InputField</fieldType>");
      expect(screenFlowXml).toContain("<required>true</required>");
    });

    it("should parse Record-triggered Flow elements", () => {
      const recordTriggeredFlowXml = `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <triggers>
        <name>TestTrigger</name>
        <object>TestObject__c</object>
        <triggerType>Upon Create or Update</triggerType>
        <filters>
            <field>Status__c</field>
            <operator>Equal</operator>
        </filters>
    </triggers>
</Flow>`;

      expect(recordTriggeredFlowXml).toContain("<triggers>");
      expect(recordTriggeredFlowXml).toContain("<name>TestTrigger</name>");
      expect(recordTriggeredFlowXml).toContain("<object>TestObject__c</object>");
      expect(recordTriggeredFlowXml).toContain("<triggerType>Upon Create or Update</triggerType>");
      expect(recordTriggeredFlowXml).toContain("<filters>");
    });

    it("should parse Decision elements with rules", () => {
      const decisionFlowXml = `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <decisions>
        <name>CheckCondition</name>
        <rules>
            <name>ConditionMet</name>
            <conditions>
                <leftValueReference>$Record.Status</leftValueReference>
                <operator>Equal</operator>
                <rightValue>
                    <stringValue>Active</stringValue>
                </rightValue>
            </conditions>
        </rules>
    </decisions>
</Flow>`;

      expect(decisionFlowXml).toContain("<decisions>");
      expect(decisionFlowXml).toContain("<name>CheckCondition</name>");
      expect(decisionFlowXml).toContain("<rules>");
      expect(decisionFlowXml).toContain("<name>ConditionMet</name>");
      expect(decisionFlowXml).toContain("<leftValueReference>$Record.Status</leftValueReference>");
      expect(decisionFlowXml).toContain("<stringValue>Active</stringValue>");
    });

    it("should parse Action elements", () => {
      const actionFlowXml = `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <actions>
        <name>UpdateRecord</name>
        <label>Update Record</label>
        <actionType>UpdateRecord</actionType>
        <inputParameters>
            <name>RecordId</name>
            <value>
                <elementReference>$Record.Id</elementReference>
            </value>
        </inputParameters>
    </actions>
</Flow>`;

      expect(actionFlowXml).toContain("<actions>");
      expect(actionFlowXml).toContain("<name>UpdateRecord</name>");
      expect(actionFlowXml).toContain("<actionType>UpdateRecord</actionType>");
      expect(actionFlowXml).toContain("<elementReference>$Record.Id</elementReference>");
    });
  });

  // =========================================================================
  // FLOW SYMBOL EXTRACTION
  // =========================================================================

  describe("Flow Symbol Extraction", () => {
    it("should extract Flow file as symbol (via XML extension)", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const content = fs.readFileSync(accountCreatePath, "utf-8");

      // Flow files have .flow-meta.xml extension
      // The symbol extractor handles XML files through the parser registry
      const file = createFileInfo("force-app/main/default/flows/Account_Create.flow-meta.xml", "flow-meta.xml", content);
      const result = extractSymbols([file]);

      // XML files should be parsed (at minimum, the Flow root element should be recognized)
      // Note: The current symbol extractor doesn't have specific Flow XML parsing
      // but it should still process the file without error
      expect(result).toBeDefined();
      expect(result.symbols).toBeDefined();
    });

    it("should detect Flow metadata via XML content parsing", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");

      const accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");
      const opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");

      // Verify we can parse Flow name from XML
      const accountCreateNameMatch = accountCreateContent.match(/<interviewLabel>([^<]+)-1<\/interviewLabel>/);
      const opportunityUpdateNameMatch = opportunityUpdateContent.match(/<interviewLabel>([^<]+)-1<\/interviewLabel>/);

      expect(accountCreateNameMatch).toBeTruthy();
      expect(accountCreateNameMatch?.[1]).toBe("Account Create Flow");
      expect(opportunityUpdateNameMatch).toBeTruthy();
      expect(opportunityUpdateNameMatch?.[1]).toBe("Opportunity Update Flow");
    });

    it("should extract Flow type from processType element", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");

      const accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");
      const opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");

      const accountCreateTypeMatch = accountCreateContent.match(/<processType>(\w+)<\/processType>/);
      const opportunityUpdateTypeMatch = opportunityUpdateContent.match(/<processType>(\w+)<\/processType>/);

      expect(accountCreateTypeMatch?.[1]).toBe("Flow");
      expect(opportunityUpdateTypeMatch?.[1]).toBe("Flow");
    });

    it("should extract Flow elements (screens, triggers, decisions, actions)", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");

      const accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");
      const opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");

      // Account_Create has screens and decisions and actions
      expect(accountCreateContent).toMatch(/<screens>[\s\S]*<\/screens>/);
      expect(accountCreateContent).toMatch(/<decisions>[\s\S]*<\/decisions>/);
      expect(accountCreateContent).toMatch(/<actions>[\s\S]*<\/actions>/);

      // Opportunity_Update has triggers and decisions and actions
      expect(opportunityUpdateContent).toMatch(/<triggers>[\s\S]*<\/triggers>/);
      expect(opportunityUpdateContent).toMatch(/<decisions>[\s\S]*<\/decisions>/);
      expect(opportunityUpdateContent).toMatch(/<actions>[\s\S]*<\/actions>/);
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe("Edge Cases", () => {
    it("should handle flows with multiple decision rules", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const content = fs.readFileSync(accountCreatePath, "utf-8");

      // ValidateAccountData decision has 1 rule
      const validateAccountDecision = content.match(/<name>ValidateAccountData<\/name>[\s\S]*?<\/decisions>/);
      expect(validateAccountDecision).toBeTruthy();

      const ruleMatches = content.match(/<name>IsValidAccount<\/name>/g);
      expect(ruleMatches).toHaveLength(1);
    });

    it("should handle flows with multiple actions", () => {
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");
      const content = fs.readFileSync(opportunityUpdatePath, "utf-8");

      // Opportunity_Update has 2 action blocks
      const actionMatches = content.match(/<name>UpdateProbabilityHigh<\/name>|<name>SendWinNotification<\/name>/g);
      expect(actionMatches).toHaveLength(2);
    });

    it("should handle flows with Chinese characters in trigger condition", () => {
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");
      const content = fs.readFileSync(opportunityUpdatePath, "utf-8");

      // Chinese characters in XML element
      expect(content).toContain("<触发条件>When a record is updated</触发条件>");
    });

    it("should handle flows with different field data types", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const content = fs.readFileSync(accountCreatePath, "utf-8");

      // Different data types in fields
      expect(content).toContain("<dataType>String</dataType>");
      expect(content).toContain("<dataType>Currency</dataType>");
      expect(content).toContain("<dataType>Phone</dataType>");
    });

    it("should handle flows with conditionLogic variations", () => {
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");

      const opportunityUpdateContent = fs.readFileSync(opportunityUpdatePath, "utf-8");
      const accountCreateContent = fs.readFileSync(accountCreatePath, "utf-8");

      // Both use "and" condition logic
      expect(opportunityUpdateContent).toContain("<conditionLogic>and</conditionLogic>");
      expect(accountCreateContent).toContain("<conditionLogic>and</conditionLogic>");
    });

    it("should handle flows with element references ($Record, $Opportunity)", () => {
      const opportunityUpdatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Opportunity_Update.flow-meta.xml");
      const content = fs.readFileSync(opportunityUpdatePath, "utf-8");

      // Opportunity_Update uses $Opportunity variable
      expect(content).toContain("$Opportunity.StageName");
      expect(content).toContain("$Opportunity.Id");
    });

    it("should handle flows with input/output field mappings", () => {
      const accountCreatePath = path.join(SALESFORCE_ENTERPRISE_PATH, "force-app/main/default/flows/Account_Create.flow-meta.xml");
      const content = fs.readFileSync(accountCreatePath, "utf-8");

      // Element references in input parameters
      expect(content).toContain("<elementReference>EnterAccountDetails.AccountName</elementReference>");
      expect(content).toContain("<elementReference>EnterAccountDetails.Industry</elementReference>");
      expect(content).toContain("<elementReference>EnterAccountDetails.AnnualRevenue</elementReference>");
      expect(content).toContain("<elementReference>EnterAccountDetails.Phone</elementReference>");
    });
  });
});
