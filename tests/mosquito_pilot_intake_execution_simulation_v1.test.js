const fs = require("fs");
const path = require("path");

const contract = require("../contracts/mosquito_pilot_intake_execution_simulation_v1.json");
const cases = require("../artifacts/mosquito_simulated_intake_cases_v1.json");

const root = path.resolve(__dirname, "..");
const files = {
  contract: path.join(root, "contracts", "mosquito_pilot_intake_execution_simulation_v1.json"),
  cases: path.join(root, "artifacts", "mosquito_simulated_intake_cases_v1.json"),
  walkthrough: path.join(root, "artifacts", "mosquito_operator_decision_walkthrough_v1.md")
};

const expectedCaseIds = [
  "clear_localized_mosquito_problem_PASS",
  "unclear_location_HOLD",
  "contradictory_behavior_HOLD",
  "outside_supported_area_BLOCK",
  "impossible_expectation_BLOCK",
  "high_confidence_real_problem_PASS"
];

const requiredCaseFields = [
  "case_id",
  "intake_message",
  "location",
  "detected_contradictions",
  "expected_decision",
  "operator_reason",
  "next_manual_action"
];

const replayRequirements = [
  "operator_id",
  "intake_timestamp",
  "decision_reason",
  "contradiction_flags",
  "next_manual_action",
  "replay_reference"
];

const forbiddenRuntimePattern = /runtime engine|runtime logic|execute runtime|mutate runtime/i;
const forbiddenOrchestrationPattern = /orchestration runtime|orchestrator runtime|orchestration logic/i;
const forbiddenInfrastructurePattern = /activate infrastructure|infrastructure activation|infrastructure automation/i;
const forbiddenAutonomousPattern = /autonomous execution behavior|autonomous deploy|autonomous routing|auto[-\s]?route|auto[-\s]?schedule/i;

const read = (filePath) => fs.readFileSync(filePath, "utf8");

describe("mosquito_pilot_intake_execution_simulation_v1", () => {
  test("all required files exist", () => {
    for (const filePath of Object.values(files)) {
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  test("all activation flags are false", () => {
    expect(contract.production_activation_allowed).toBe(false);
    expect(contract.runtime_mutation_allowed).toBe(false);
    expect(contract.autonomous_execution_allowed).toBe(false);
  });

  test("exactly 6 simulated cases exist", () => {
    expect(cases.map((item) => item.case_id)).toEqual(expectedCaseIds);
    expect(cases).toHaveLength(6);
    expect(contract.simulated_case_count).toBe(6);
  });

  test("only PASS, HOLD, and BLOCK decisions are used", () => {
    expect(contract.allowed_decisions).toEqual(["PASS", "HOLD", "BLOCK"]);
    for (const item of cases) {
      expect(contract.allowed_decisions).toContain(item.expected_decision);
    }
  });

  test("every case includes all mandatory fields", () => {
    for (const item of cases) {
      for (const field of requiredCaseFields) {
        expect(item).toHaveProperty(field);
      }
      expect(Array.isArray(item.detected_contradictions)).toBe(true);
    }
  });

  test("walkthrough file exists and contains all required stages", () => {
    const walkthrough = read(files.walkthrough).toLowerCase();
    expect(walkthrough).toContain("intake received");
    expect(walkthrough).toContain("operator review");
    expect(walkthrough).toContain("contradiction check");
    expect(walkthrough).toContain("pass/hold/block assignment");
    expect(walkthrough).toContain("replay logging step");
    expect(walkthrough).toContain("next manual action");
    expect(walkthrough.length).toBeLessThanOrEqual(1200);
  });

  test("replay requirements include all mandatory fields", () => {
    expect(contract.replay_requirements).toEqual(replayRequirements);
  });

  test("bounded constraints and simulation decision are preserved", () => {
    expect(contract.bounded_scope_constraints).toEqual(expect.arrayContaining([
      "human_supervision_required",
      "autonomous_execution_forbidden",
      "runtime_mutation_forbidden",
      "bounded_geographic_scope_only",
      "contradiction_escalation_required"
    ]));
    expect(contract.simulation_decision).toBe("READY_FOR_BOUNDED_REAL_WORLD_OPERATOR_SIMULATION_ONLY");
  });

  test("no runtime logic exists", () => {
    const assets = [JSON.stringify(contract), JSON.stringify(cases), read(files.walkthrough)].join("\n");
    expect(assets).not.toMatch(forbiddenRuntimePattern);
  });

  test("no orchestration runtime exists", () => {
    const assets = [JSON.stringify(contract), JSON.stringify(cases), read(files.walkthrough)].join("\n");
    expect(assets).not.toMatch(forbiddenOrchestrationPattern);
  });

  test("no infrastructure activation exists", () => {
    const assets = [JSON.stringify(cases), read(files.walkthrough)].join("\n");
    expect(assets).not.toMatch(forbiddenInfrastructurePattern);
  });

  test("no autonomous behavior exists", () => {
    const assets = [JSON.stringify(cases), read(files.walkthrough)].join("\n");
    expect(assets).not.toMatch(forbiddenAutonomousPattern);
    expect(contract.autonomous_execution_allowed).toBe(false);
  });
});
