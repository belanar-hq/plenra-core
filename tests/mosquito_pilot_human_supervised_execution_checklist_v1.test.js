const artifact = require("../contracts/mosquito_pilot_human_supervised_execution_checklist_v1.json");

const requiredTopLevelFields = [
  "artifact_id",
  "version",
  "status",
  "production_activation_allowed",
  "runtime_mutation_allowed",
  "cloudflare_activation_allowed",
  "autonomous_deployment_allowed",
  "validation_purpose",
  "checklist_scope",
  "mandatory_execution_checks",
  "replayability_checks",
  "rollback_checks",
  "contradiction_checks",
  "observability_checks",
  "human_supervision_checks",
  "operational_boundary_checks",
  "economic_validation_checks",
  "fail_closed_checks",
  "checklist_constraints",
  "operational_checklist_decision"
];

const checklistScope = [
  "whatsapp_intake",
  "bounded_human_routing",
  "bounded_scheduling",
  "replay_safe_logging",
  "contradiction_detection",
  "rollback_validation",
  "bounded_payment_handling",
  "operational_observability",
  "human_override_capability",
  "bounded_blast_radius"
];

const mandatoryExecutionChecks = [
  "human_supervision_confirmed",
  "rollback_path_confirmed",
  "replayability_confirmed",
  "contradiction_escalation_confirmed",
  "blast_radius_bounded",
  "observability_confirmed",
  "bounded_scope_confirmed",
  "manual_override_confirmed",
  "runtime_mutation_prevented",
  "autonomous_execution_prevented"
];

const reviewSections = [
  "replayability_checks",
  "rollback_checks",
  "contradiction_checks",
  "observability_checks",
  "human_supervision_checks",
  "operational_boundary_checks",
  "economic_validation_checks",
  "fail_closed_checks"
];

const reviewFields = [
  "status",
  "survivability_assessment",
  "hold_conditions",
  "block_conditions"
];

const allowedStatuses = ["READY_FOR_REVIEW", "HOLD", "BLOCKED"];

const checklistConstraints = [
  "human_supervision_required_for_all_real_execution",
  "runtime_mutation_remains_forbidden",
  "autonomous_execution_remains_forbidden",
  "bounded_scope_must_remain_preserved",
  "replayability_required_before_any_real_action",
  "contradiction_escalation_required_before_override",
  "manual_override_must_remain_available"
];

describe("mosquito_pilot_human_supervised_execution_checklist_v1 artifact", () => {
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

  test("checklist_scope contains all required items", () => {
    expect(artifact.checklist_scope).toEqual(checklistScope);
  });

  test("all mandatory execution checks exist", () => {
    expect(artifact.mandatory_execution_checks).toEqual(mandatoryExecutionChecks);
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

  test("checklist_constraints include all mandatory constraints", () => {
    expect(artifact.checklist_constraints).toEqual(expect.arrayContaining(checklistConstraints));
  });

  test("operational_checklist_decision matches exactly", () => {
    expect(artifact.operational_checklist_decision).toBe(
      "READY_FOR_BOUNDED_HUMAN_SUPERVISED_REAL_WORLD_CHECKLIST_REVIEW_ONLY"
    );
  });

  test("human supervision constraint exists", () => {
    expect(artifact.checklist_constraints).toContain("human_supervision_required_for_all_real_execution");
  });

  test("replayability constraint exists", () => {
    expect(artifact.checklist_constraints).toContain("replayability_required_before_any_real_action");
  });

  test("contradiction escalation constraint exists", () => {
    expect(artifact.checklist_constraints).toContain("contradiction_escalation_required_before_override");
  });

  test("manual override constraint exists", () => {
    expect(artifact.checklist_constraints).toContain("manual_override_must_remain_available");
  });

  test("no runtime mutation logic exists", () => {
    expect(JSON.stringify(artifact.checklist_scope)).not.toMatch(/mutate_runtime|runtime_mutation_logic/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/mutate_runtime|runtime_mutation_logic/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no production deployment logic exists", () => {
    expect(JSON.stringify(artifact.checklist_scope)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(artifact.production_activation_allowed).toBe(false);
  });

  test("no autonomous execution behavior exists", () => {
    expect(JSON.stringify(artifact.checklist_scope)).not.toMatch(/autonomous_deploy|autonomous_routing/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/autonomous_deploy|autonomous_routing/);
    expect(artifact.checklist_constraints).toContain("autonomous_execution_remains_forbidden");
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });

  test("no orchestration runtime exists", () => {
    expect(JSON.stringify(artifact.checklist_scope)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
    expect(JSON.stringify(reviewSections.map((section) => artifact[section]))).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
  });
});
