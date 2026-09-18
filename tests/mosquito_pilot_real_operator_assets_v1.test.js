const fs = require("fs");
const path = require("path");

const contract = require("../contracts/mosquito_pilot_real_operator_assets_v1.json");

const root = path.resolve(__dirname, "..");
const files = {
  contract: path.join(root, "contracts", "mosquito_pilot_real_operator_assets_v1.json"),
  openingMessage: path.join(root, "artifacts", "mosquito_whatsapp_opening_message_v1.md"),
  examples: path.join(root, "artifacts", "mosquito_pass_hold_block_examples_v1.md"),
  loggingTemplate: path.join(root, "artifacts", "mosquito_manual_logging_template_v1.csv")
};

const requiredHeaders = [
  "timestamp",
  "operator_id",
  "whatsapp_number",
  "city",
  "neighborhood",
  "intake_summary",
  "decision_state",
  "decision_reason",
  "contradiction_flags",
  "scheduling_status",
  "followup_required",
  "next_manual_action",
  "outcome_status",
  "replay_reference",
  "operator_notes"
];

const forbiddenAutomationPattern = /autonomous\s+(execute|route|routing|decide|decision)|auto[-\s]?route|auto[-\s]?schedule|without human|no human/i;
const forbiddenRuntimePattern = /runtime engine|runtime logic|mutate runtime|runtime mutation logic|execute runtime/i;
const forbiddenOrchestrationPattern = /orchestration runtime|orchestrator runtime|orchestration logic/i;
const forbiddenInfrastructurePattern = /activate infrastructure|infrastructure activation|infrastructure automation/i;
const forbiddenAuthorityPattern = /\bAI\b|artificial intelligence|automated authority|machine decision/i;
const forbiddenGuaranteePattern = /we guarantee|guaranteed result|guaranteed removal|will eliminate/i;
const forbiddenMedicalSafetyPattern = /medical advice|health guarantee|safety guarantee|safe for all|clinically/i;

const read = (filePath) => fs.readFileSync(filePath, "utf8");

describe("mosquito_pilot_real_operator_assets_v1", () => {
  test("all required files exist", () => {
    for (const filePath of Object.values(files)) {
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  test("WhatsApp number equals 0542270080", () => {
    expect(contract.whatsapp_number).toBe("0542270080");
    expect(read(files.openingMessage)).toContain("0542270080");
  });

  test("opening message remains under bounded length", () => {
    const message = read(files.openingMessage).trim();
    expect(message.length).toBeLessThanOrEqual(400);
  });

  test("opening message asks only minimum required intake info", () => {
    const message = read(files.openingMessage);
    expect(message).toContain("City");
    expect(message).toContain("Neighborhood");
    expect(message).toContain("Apartment or house");
    expect(message).toContain("Where mosquitoes appear most");
    expect(message).toContain("When the problem is strongest");
    expect(message).toContain("Optional photo or video");
  });

  test("PASS/HOLD/BLOCK examples exist", () => {
    const examples = read(files.examples);
    expect(examples).toContain("## PASS");
    expect(examples).toContain("Localized recurring mosquito problem in one home or building area");
    expect(examples).toContain("Clear operational scope, such as yard, balcony, stairwell, or apartment");
    expect(examples).toContain("Reachable area for a human-supervised pilot check");
    expect(examples).toContain("Realistic expectation: review the case and decide the next manual step");
    expect(examples).toContain("## HOLD");
    expect(examples).toContain("Unclear location or missing neighborhood");
    expect(examples).toContain("Contradictory details, such as two different addresses or problem areas");
    expect(examples).toContain("Unclear severity or timing");
    expect(examples).toContain("Missing operational details needed before scheduling or follow-up");
    expect(examples).toContain("## BLOCK");
    expect(examples).toContain("Unsafe requests or requests requiring non-pilot handling");
    expect(examples).toContain("Outside supported region");
    expect(examples).toContain("Impossible guarantees requested");
    expect(examples).toContain("Unrelated pest requests");
  });

  test("logging template includes all required headers", () => {
    const headers = read(files.loggingTemplate).trim().split(",");
    expect(headers).toEqual(requiredHeaders);
  });

  test("logging template improves replay and operator clarity", () => {
    const headers = read(files.loggingTemplate).trim().split(",");
    expect(headers).toContain("decision_reason");
    expect(headers).toContain("next_manual_action");
    expect(headers).toContain("operator_notes");
    expect(headers.indexOf("decision_state")).toBeLessThan(headers.indexOf("decision_reason"));
    expect(headers.indexOf("outcome_status")).toBeLessThan(headers.indexOf("replay_reference"));
  });

  test("no autonomous execution instructions exist", () => {
    const assets = [read(files.openingMessage), read(files.examples), read(files.loggingTemplate)].join("\n");
    expect(assets).not.toMatch(forbiddenAutomationPattern);
    expect(contract.autonomous_execution_allowed).toBe(false);
  });

  test("no runtime logic exists", () => {
    const assets = [read(files.openingMessage), read(files.examples), read(files.loggingTemplate)].join("\n");
    expect(assets).not.toMatch(forbiddenRuntimePattern);
    expect(contract.runtime_mutation_allowed).toBe(false);
  });

  test("no orchestration runtime exists", () => {
    const assets = [read(files.openingMessage), read(files.examples), read(files.loggingTemplate)].join("\n");
    expect(assets).not.toMatch(forbiddenOrchestrationPattern);
  });

  test("no infrastructure activation exists", () => {
    const assets = [read(files.openingMessage), read(files.examples), read(files.loggingTemplate)].join("\n");
    expect(assets).not.toMatch(forbiddenInfrastructurePattern);
    expect(contract.infrastructure_activation_allowed).toBe(false);
  });

  test("no AI authority language exists", () => {
    const assets = [read(files.openingMessage), read(files.examples), read(files.loggingTemplate)].join("\n");
    expect(assets).not.toMatch(forbiddenAuthorityPattern);
  });

  test("no guarantee or medical safety claims exist", () => {
    const assets = [read(files.openingMessage), read(files.examples), read(files.loggingTemplate)].join("\n");
    expect(assets).not.toMatch(forbiddenGuaranteePattern);
    expect(assets).not.toMatch(forbiddenMedicalSafetyPattern);
  });
});
