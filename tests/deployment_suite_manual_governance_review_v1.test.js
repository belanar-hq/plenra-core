const artifact = require("../contracts/deployment_suite_manual_governance_review_v1.json");

const requiredTopLevelFields = [
  "artifact_id",
  "version",
  "status",
  "production_activation_allowed",
  "runtime_mutation_allowed",
  "cloudflare_activation_allowed",
  "autonomous_deployment_allowed",
  "validation_purpose",
  "reviewed_suite",
  "governance_review_checks",
  "replay_legibility_review",
  "boundedness_review",
  "rollback_review",
  "blast_radius_review",
  "entropy_review",
  "operator_comprehension_review",
  "governance_constraints",
  "governance_review_decision"
];

const governanceReviewChecks = [
  "replay_legibility_preserved",
  "bounded_scope_preserved",
  "rollback_survivability_preserved",
  "blast_radius_visibility_preserved",
  "entropy_controls_present",
  "operator_comprehension_preserved",
  "non_executable_scope_preserved",
  "no_runtime_mutation_detected",
  "no_production_activation_detected"
];

const reviewSections = [
  "replay_legibility_review",
  "boundedness_review",
  "rollback_review",
  "blast_radius_review",
  "entropy_review",
  "operator_comprehension_review"
];

const reviewFields = [
  "status",
  "survivability_assessment",
  "hold_conditions",
  "block_conditions"
];

const allowedStatuses = ["READY_FOR_REVIEW", "HOLD", "BLOCKED"];

const governanceConstraints = [
  "manual_review_required_before_any_real_deployment",
  "simulation_artifacts_cannot_authorize_runtime_execution",
  "runtime_mutation_remains_forbidden",
  "bounded_scope_must_remain_preserved",
  "replayability_required_before_any_real_execution",
  "governance_expansion_remains_frozen"
];

describe("deployment_suite_manual_governance_review_v1 artifact", () => {
  test("all required top-level artifact fields exist", () => {
    for (const field of requiredTopLevelFields) {
      expect(artifact).toHaveProperty(field);
    }
    expect(artifact.status).toBe("CONCEPTUAL_PRESSURE_ARTIFACT_ONLY");
  });

  test("all activation flags are false", () => {
    expect(artifact.production_activation_allowed).toBe(false);
    expect(artifact.runtime_mutation_allowed).toBe(false);
    expect(artifact.cloudflare_activation_allowed).toBe(false);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });

  test("reviewed_suite matches exactly", () => {
    expect(artifact.reviewed_suite).toBe("DEPLOYMENT_SURVIVABILITY_PRESSURE_SIMULATION_SUITE");
  });

  test("all governance review checks exist", () => {
    expect(artifact.governance_review_checks).toEqual(governanceReviewChecks);
  });

  test("all review sections exist", () => {
    for (const section of reviewSections) {
      expect(artifact).toHaveProperty(section);
    }
  });

  test("all review sections include required fields", () => {
    for (const section of reviewSections) {
      for (const field of reviewFields) {
        expect(artifact[section]).toHaveProperty(field);
      }
    }
  });

  test("only READY_FOR_REVIEW, HOLD, and BLOCKED status values are used", () => {
    for (const section of reviewSections) {
      expect(allowedStatuses).toContain(artifact[section].status);
    }
  });

  test("governance_constraints include all mandatory constraints", () => {
    expect(artifact.governance_constraints).toEqual(expect.arrayContaining(governanceConstraints));
  });

  test("governance_review_decision equals READY_FOR_MANUAL_CONSTITUTIONAL_REVIEW_ONLY", () => {
    expect(artifact.governance_review_decision).toBe("READY_FOR_MANUAL_CONSTITUTIONAL_REVIEW_ONLY");
  });

  test("replayability constraint exists", () => {
    expect(artifact.governance_constraints).toContain("replayability_required_before_any_real_execution");
  });

  test("manual review constraint exists", () => {
    expect(artifact.governance_constraints).toContain("manual_review_required_before_any_real_deployment");
  });

  test("no runtime mutation constraint exists", () => {
    expect(artifact.governance_constraints).toContain("runtime_mutation_remains_forbidden");
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("governance freeze constraint exists", () => {
    expect(artifact.governance_constraints).toContain("governance_expansion_remains_frozen");
  });

  test("no production activation logic exists", () => {
    expect(JSON.stringify(artifact.governance_review_checks)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(artifact.production_activation_allowed).toBe(false);
  });

  test("no runtime logic exists", () => {
    expect(JSON.stringify(artifact.governance_review_checks)).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
  });

  test("no orchestration runtime exists", () => {
    expect(JSON.stringify(artifact.governance_review_checks)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
  });

  test("no autonomous deployment behavior exists", () => {
    expect(JSON.stringify(artifact.governance_review_checks)).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });
});
