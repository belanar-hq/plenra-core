const artifact = require("../contracts/mosquito_pilot_operational_readiness_assessment_v1.json");

const requiredTopLevelFields = [
  "artifact_id",
  "version",
  "status",
  "production_activation_allowed",
  "runtime_mutation_allowed",
  "cloudflare_activation_allowed",
  "autonomous_deployment_allowed",
  "validation_purpose",
  "pilot_scope",
  "operational_readiness_checks",
  "replayability_review",
  "rollback_review",
  "contradiction_review",
  "boundedness_review",
  "observability_review",
  "human_supervision_review",
  "economic_validation_review",
  "readiness_constraints",
  "operational_readiness_decision"
];

const pilotScope = [
  "whatsapp_intake",
  "human_supervised_routing",
  "bounded_scheduling",
  "replay_safe_logging",
  "contradiction_detection",
  "rollback_capability",
  "bounded_payment_handling",
  "operational_metrics_collection"
];

const operationalReadinessChecks = [
  "replayability_preserved",
  "rollback_available",
  "contradiction_escalation_available",
  "bounded_scope_preserved",
  "human_supervision_required",
  "blast_radius_bounded",
  "observability_available",
  "runtime_mutation_prevented",
  "autonomous_execution_prevented"
];

const reviewSections = [
  "replayability_review",
  "rollback_review",
  "contradiction_review",
  "boundedness_review",
  "observability_review",
  "human_supervision_review",
  "economic_validation_review"
];

const reviewFields = [
  "status",
  "survivability_assessment",
  "hold_conditions",
  "block_conditions"
];

const allowedStatuses = ["READY_FOR_REVIEW", "HOLD", "BLOCKED"];

const readinessConstraints = [
  "human_supervision_required_for_all_real_execution",
  "runtime_mutation_remains_forbidden",
  "autonomous_execution_remains_forbidden",
  "bounded_scope_must_remain_preserved",
  "replayability_required_before_any_real_action",
  "contradiction_escalation_required_before_override"
];

describe("mosquito_pilot_operational_readiness_assessment_v1 artifact", () => {
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

  test("pilot_scope contains all required items", () => {
    expect(artifact.pilot_scope).toEqual(pilotScope);
  });

  test("all operational readiness checks exist", () => {
    expect(artifact.operational_readiness_checks).toEqual(operationalReadinessChecks);
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

  test("readiness_constraints include all mandatory constraints", () => {
    expect(artifact.readiness_constraints).toEqual(expect.arrayContaining(readinessConstraints));
  });

  test("operational_readiness_decision matches exactly", () => {
    expect(artifact.operational_readiness_decision).toBe("READY_FOR_BOUNDED_HUMAN_SUPERVISED_PILOT_REVIEW_ONLY");
  });

  test("human supervision constraint exists", () => {
    expect(artifact.readiness_constraints).toContain("human_supervision_required_for_all_real_execution");
  });

  test("replayability constraint exists", () => {
    expect(artifact.readiness_constraints).toContain("replayability_required_before_any_real_action");
  });

  test("contradiction escalation constraint exists", () => {
    expect(artifact.readiness_constraints).toContain("contradiction_escalation_required_before_override");
  });

  test("no runtime mutation logic exists", () => {
    expect(JSON.stringify(artifact.pilot_scope)).not.toMatch(/mutate_runtime|runtime_mutation_logic/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/mutate_runtime|runtime_mutation_logic/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no production deployment logic exists", () => {
    expect(JSON.stringify(artifact.pilot_scope)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(artifact.production_activation_allowed).toBe(false);
  });

  test("no autonomous execution behavior exists", () => {
    expect(JSON.stringify(artifact.pilot_scope)).not.toMatch(/autonomous_execution|autonomous_deploy|autonomous_routing/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/autonomous_execution|autonomous_deploy|autonomous_routing/);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });

  test("no orchestration runtime exists", () => {
    expect(JSON.stringify(artifact.pilot_scope)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
  });
});
