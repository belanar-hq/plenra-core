const artifact = require("../contracts/deployment_suite_operational_readiness_review_v1.json");

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
  "operational_readiness_checks",
  "replay_readiness",
  "rollback_readiness",
  "blast_radius_readiness",
  "entropy_governance_readiness",
  "boundedness_readiness",
  "governance_readiness",
  "readiness_constraints",
  "readiness_decision"
];

const operationalReadinessChecks = [
  "replay_survivability_validated",
  "rollback_survivability_validated",
  "blast_radius_containment_validated",
  "deployment_entropy_controls_validated",
  "bounded_scope_preserved",
  "non_executable_artifacts_only",
  "no_runtime_mutation_detected",
  "no_production_activation_detected"
];

const readinessSections = [
  "replay_readiness",
  "rollback_readiness",
  "blast_radius_readiness",
  "entropy_governance_readiness",
  "boundedness_readiness",
  "governance_readiness"
];

const readinessFields = [
  "status",
  "blocking_conditions",
  "hold_conditions",
  "survivability_assessment"
];

const allowedStatuses = ["READY_FOR_REVIEW", "HOLD", "BLOCKED"];

const readinessConstraints = [
  "simulation_artifacts_cannot_authorize_production",
  "manual_human_review_required_before_real_deployment",
  "runtime_mutation_remains_forbidden",
  "bounded_scope_must_remain_preserved",
  "replayability_required_before_any_real_execution"
];

describe("deployment_suite_operational_readiness_review_v1 artifact", () => {
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

  test("all operational readiness checks exist", () => {
    expect(artifact.operational_readiness_checks).toEqual(operationalReadinessChecks);
  });

  test("all readiness sections exist", () => {
    for (const section of readinessSections) {
      expect(artifact).toHaveProperty(section);
    }
  });

  test("all readiness sections include required fields", () => {
    for (const section of readinessSections) {
      for (const field of readinessFields) {
        expect(artifact[section]).toHaveProperty(field);
      }
    }
  });

  test("only READY_FOR_REVIEW, HOLD, and BLOCKED status values are used", () => {
    for (const section of readinessSections) {
      expect(allowedStatuses).toContain(artifact[section].status);
    }
  });

  test("readiness_constraints include all mandatory constraints", () => {
    expect(artifact.readiness_constraints).toEqual(expect.arrayContaining(readinessConstraints));
  });

  test("readiness_decision equals READY_FOR_MANUAL_GOVERNANCE_REVIEW_ONLY", () => {
    expect(artifact.readiness_decision).toBe("READY_FOR_MANUAL_GOVERNANCE_REVIEW_ONLY");
  });

  test("replayability constraint exists", () => {
    expect(artifact.readiness_constraints).toContain("replayability_required_before_any_real_execution");
  });

  test("manual human review constraint exists", () => {
    expect(artifact.readiness_constraints).toContain("manual_human_review_required_before_real_deployment");
  });

  test("no runtime mutation constraint exists", () => {
    expect(artifact.readiness_constraints).toContain("runtime_mutation_remains_forbidden");
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no production activation logic exists", () => {
    expect(JSON.stringify(artifact.operational_readiness_checks)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(JSON.stringify(readinessSections.map((section) => artifact[section]))).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(artifact.production_activation_allowed).toBe(false);
  });

  test("no runtime logic exists", () => {
    expect(JSON.stringify(artifact.operational_readiness_checks)).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
    expect(JSON.stringify(readinessSections.map((section) => artifact[section]))).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
  });

  test("no orchestration runtime exists", () => {
    expect(JSON.stringify(artifact.operational_readiness_checks)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
    expect(JSON.stringify(readinessSections.map((section) => artifact[section]))).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
  });

  test("no autonomous deployment behavior exists", () => {
    expect(JSON.stringify(artifact.operational_readiness_checks)).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(JSON.stringify(readinessSections.map((section) => artifact[section]))).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });
});
