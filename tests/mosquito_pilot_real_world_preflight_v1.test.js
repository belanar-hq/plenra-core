const artifact = require("../contracts/mosquito_pilot_real_world_preflight_v1.json");

const requiredTopLevelFields = [
  "artifact_id",
  "version",
  "status",
  "production_activation_allowed",
  "runtime_mutation_allowed",
  "autonomous_execution_allowed",
  "validation_purpose",
  "dedicated_whatsapp_number",
  "preflight_checks",
  "human_supervision_requirements",
  "intake_requirements",
  "logging_requirements",
  "rollback_requirements",
  "contradiction_requirements",
  "payment_handling_requirements",
  "pilot_block_conditions",
  "pilot_hold_conditions",
  "preflight_decision"
];

const preflightChecks = [
  "dedicated_whatsapp_number_exists",
  "whatsapp_number_is_pilot_specific",
  "human_operator_available",
  "manual_intake_flow_defined",
  "replay_safe_logging_defined",
  "manual_routing_defined",
  "bounded_scheduling_defined",
  "contradiction_escalation_defined",
  "manual_payment_handling_defined",
  "rollback_path_defined",
  "autonomous_execution_blocked"
];

describe("mosquito_pilot_real_world_preflight_v1 artifact", () => {
  test("all required top-level artifact fields exist", () => {
    for (const field of requiredTopLevelFields) {
      expect(artifact).toHaveProperty(field);
    }
    expect(artifact.status).toBe("CONCEPTUAL_PREFLIGHT_ARTIFACT_ONLY");
  });

  test("all activation flags are false", () => {
    expect(artifact.production_activation_allowed).toBe(false);
    expect(artifact.runtime_mutation_allowed).toBe(false);
    expect(artifact.autonomous_execution_allowed).toBe(false);
  });

  test("dedicated WhatsApp number equals 0542270080", () => {
    expect(artifact.dedicated_whatsapp_number).toBe("0542270080");
  });

  test("all mandatory preflight checks exist", () => {
    expect(artifact.preflight_checks).toEqual(preflightChecks);
  });

  test("autonomous execution is blocked", () => {
    expect(artifact.preflight_checks).toContain("autonomous_execution_blocked");
    expect(artifact.pilot_block_conditions).toContain("autonomous_execution_detected");
    expect(artifact.autonomous_execution_allowed).toBe(false);
  });

  test("manual intake, routing, scheduling, payment handling, and rollback are declared", () => {
    expect(artifact.intake_requirements).toContain("manual_intake_flow_defined");
    expect(artifact.preflight_checks).toContain("manual_routing_defined");
    expect(artifact.preflight_checks).toContain("bounded_scheduling_defined");
    expect(artifact.payment_handling_requirements).toContain("manual_payment_handling_defined");
    expect(artifact.rollback_requirements).toContain("rollback_path_defined");
  });

  test("preflight decision matches required value", () => {
    expect(artifact.preflight_decision).toBe("READY_FOR_HUMAN_SUPERVISED_PREFLIGHT_REVIEW_ONLY");
  });

  test("no runtime mutation logic exists", () => {
    expect(JSON.stringify(artifact)).not.toMatch(/mutate_runtime|runtime_mutation_logic|runtime_engine/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no deployment automation logic exists", () => {
    expect(JSON.stringify(artifact)).not.toMatch(/deploy_to_production|deployment_engine|deployment_automation/);
    expect(artifact.production_activation_allowed).toBe(false);
  });

  test("no payment automation logic exists", () => {
    expect(JSON.stringify(artifact.payment_handling_requirements)).not.toMatch(/payment_automation_enabled|automated_payment|payment_engine/);
    expect(artifact.payment_handling_requirements).toContain("payment_automation_forbidden");
  });
});
