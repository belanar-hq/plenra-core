const artifact = require("../contracts/deployment_suite_constitutional_review_summary_v1.json");

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
  "validated_modules",
  "constitutional_review_summary",
  "replayability_summary",
  "boundedness_summary",
  "survivability_summary",
  "governance_constraints",
  "freeze_conditions",
  "constitutional_review_decision"
];

const validatedModules = [
  "deployment_pressure_scenarios_v1",
  "deployment_replay_drill_v1",
  "rollback_survivability_drill_v1",
  "blast_radius_simulation_v1",
  "deployment_entropy_governance_v1",
  "deployment_survivability_suite_index_v1",
  "deployment_suite_pressure_review_v1",
  "deployment_survivability_suite_registration_v1",
  "deployment_suite_operational_readiness_review_v1",
  "deployment_suite_manual_governance_review_v1"
];

const governanceConstraints = [
  "manual_human_review_required_before_any_real_deployment",
  "simulation_artifacts_remain_non_executable",
  "runtime_mutation_remains_forbidden",
  "production_activation_remains_forbidden",
  "bounded_scope_must_remain_preserved",
  "governance_expansion_remains_frozen"
];

const freezeConditions = [
  "runtime_mutation_detected",
  "production_activation_detected",
  "replayability_break_detected",
  "governance_entropy_growth_detected",
  "bounded_scope_violation_detected"
];

describe("deployment_suite_constitutional_review_summary_v1 artifact", () => {
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

  test("all validated modules exist", () => {
    expect(artifact.validated_modules).toEqual(validatedModules);
  });

  test("all constitutional_review_summary values equal true", () => {
    expect(Object.values(artifact.constitutional_review_summary)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ]);
  });

  test("all governance_constraints exist", () => {
    expect(artifact.governance_constraints).toEqual(expect.arrayContaining(governanceConstraints));
  });

  test("all freeze_conditions exist", () => {
    expect(artifact.freeze_conditions).toEqual(freezeConditions);
  });

  test("constitutional_review_decision matches exactly", () => {
    expect(artifact.constitutional_review_decision).toBe(
      "READY_FOR_BOUNDED_HUMAN_SUPERVISED_OPERATIONAL_DEPLOYMENT_REVIEW_ONLY"
    );
  });

  test("replayability preservation exists", () => {
    expect(artifact.constitutional_review_summary.replayability_preserved).toBe(true);
    expect(artifact.replayability_summary.status).toBe("PRESERVED");
  });

  test("bounded scope preservation exists", () => {
    expect(artifact.constitutional_review_summary.bounded_scope_preserved).toBe(true);
    expect(artifact.boundedness_summary.scope).toBe("contracts_and_tests_only");
  });

  test("runtime mutation prevention exists", () => {
    expect(artifact.constitutional_review_summary.runtime_mutation_prevented).toBe(true);
    expect(artifact.governance_constraints).toContain("runtime_mutation_remains_forbidden");
  });

  test("governance freeze constraint exists", () => {
    expect(artifact.governance_constraints).toContain("governance_expansion_remains_frozen");
  });

  test("no production activation logic exists", () => {
    expect(JSON.stringify(artifact.validated_modules)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(JSON.stringify(artifact.survivability_summary)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(artifact.production_activation_allowed).toBe(false);
  });

  test("no runtime logic exists", () => {
    expect(JSON.stringify(artifact.validated_modules)).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
    expect(JSON.stringify(artifact.survivability_summary)).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no orchestration runtime exists", () => {
    expect(JSON.stringify(artifact.validated_modules)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
    expect(JSON.stringify(artifact.survivability_summary)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
  });

  test("no autonomous deployment behavior exists", () => {
    expect(JSON.stringify(artifact.validated_modules)).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(JSON.stringify(artifact.survivability_summary)).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });
});
