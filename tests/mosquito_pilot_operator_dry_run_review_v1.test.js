const fs = require("fs");
const path = require("path");

const contract = require("../contracts/mosquito_pilot_operator_dry_run_review_v1.json");

const root = path.resolve(__dirname, "..");
const files = {
  contract: path.join(root, "contracts", "mosquito_pilot_operator_dry_run_review_v1.json"),
  results: path.join(root, "artifacts", "mosquito_operator_dry_run_results_v1.md"),
  test: path.join(root, "tests", "mosquito_pilot_operator_dry_run_review_v1.test.js")
};

const reviewedAssets = [
  "mosquito_simulated_intake_cases_v1.json",
  "mosquito_operator_decision_walkthrough_v1.md",
  "mosquito_manual_logging_template_v1.csv"
];

const dryRunChecks = [
  "operator_can_follow_flow",
  "pass_hold_block_logic_understandable",
  "contradictions_visible",
  "replay_logging_understandable",
  "manual_actions_clear",
  "bounded_scope_preserved",
  "autonomous_execution_prevented",
  "runtime_mutation_prevented"
];

const reviewSections = [
  "replay_clarity_review",
  "contradiction_visibility_review",
  "operator_comprehension_review",
  "pass_hold_block_consistency_review",
  "operational_friction_review"
];

const allowedStatuses = ["READY_FOR_REVIEW", "HOLD", "BLOCKED"];

const forbiddenRuntimePattern = /runtime engine|runtime logic|execute runtime|mutate runtime/i;
const forbiddenOrchestrationPattern = /orchestration runtime|orchestrator runtime|orchestration logic/i;
const forbiddenInfrastructurePattern = /activate infrastructure|infrastructure activation|infrastructure automation/i;
const forbiddenAutonomousPattern = /autonomous execution behavior|autonomous deploy|autonomous routing|auto[-\s]?route|auto[-\s]?schedule/i;

const read = (filePath) => fs.readFileSync(filePath, "utf8");

describe("mosquito_pilot_operator_dry_run_review_v1", () => {
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

  test("all dry_run_checks exist", () => {
    expect(contract.dry_run_checks).toEqual(dryRunChecks);
  });

  test("all review sections exist", () => {
    for (const section of reviewSections) {
      expect(contract).toHaveProperty(section);
      expect(contract[section]).toHaveProperty("status");
      expect(contract[section]).toHaveProperty("survivability_assessment");
      expect(contract[section]).toHaveProperty("hold_conditions");
      expect(contract[section]).toHaveProperty("block_conditions");
    }
  });

  test("only READY_FOR_REVIEW, HOLD, and BLOCKED statuses are used", () => {
    for (const section of reviewSections) {
      expect(allowedStatuses).toContain(contract[section].status);
    }
  });

  test("reviewed_assets contain only required assets", () => {
    expect(contract.reviewed_assets).toEqual(reviewedAssets);
  });

  test("dry_run_decision matches exactly", () => {
    expect(contract.dry_run_decision).toBe("READY_FOR_BOUNDED_REAL_WORLD_HUMAN_SUPERVISED_PILOT_ONLY");
  });

  test("dry-run results contain required bounded sections", () => {
    const results = read(files.results);
    expect(results).toContain("summary_of_simulated_cases");
    expect(results).toContain("PASS examples");
    expect(results).toContain("HOLD examples");
    expect(results).toContain("BLOCK examples");
    expect(results).toContain("contradiction observations");
    expect(results).toContain("operator confusion points");
    expect(results).toContain("replay clarity observations");
    expect(results).toContain("recommended bounded improvements");
    expect(results.length).toBeLessThanOrEqual(1500);
  });

  test("bounded scope constraints are present", () => {
    expect(contract.bounded_scope_constraints).toEqual(expect.arrayContaining([
      "human_supervision_required",
      "autonomous_execution_forbidden",
      "runtime_mutation_forbidden",
      "bounded_geographic_scope_only",
      "contradiction_escalation_required",
      "manual_override_required"
    ]));
  });

  test("no runtime logic exists", () => {
    const assets = [JSON.stringify(contract.reviewed_assets), JSON.stringify(contract.dry_run_checks), read(files.results)].join("\n");
    expect(assets).not.toMatch(forbiddenRuntimePattern);
  });

  test("no orchestration runtime exists", () => {
    const assets = [JSON.stringify(contract.reviewed_assets), JSON.stringify(contract.dry_run_checks), read(files.results)].join("\n");
    expect(assets).not.toMatch(forbiddenOrchestrationPattern);
  });

  test("no infrastructure activation exists", () => {
    const assets = [JSON.stringify(contract.reviewed_assets), JSON.stringify(contract.dry_run_checks), read(files.results)].join("\n");
    expect(assets).not.toMatch(forbiddenInfrastructurePattern);
  });

  test("no autonomous execution behavior exists", () => {
    const assets = [JSON.stringify(contract.reviewed_assets), JSON.stringify(contract.dry_run_checks), read(files.results)].join("\n");
    expect(assets).not.toMatch(forbiddenAutonomousPattern);
    expect(contract.autonomous_execution_allowed).toBe(false);
  });
});
