const artifact = require("../contracts/mosquito_pilot_manual_operator_flow_v1.json");

const requiredTopLevelFields = [
  "artifact_id",
  "version",
  "status",
  "production_activation_allowed",
  "runtime_mutation_allowed",
  "autonomous_execution_allowed",
  "validation_purpose",
  "whatsapp_number",
  "operator_flow_steps",
  "decision_states",
  "contradiction_escalation_rules",
  "replay_logging_requirements",
  "operator_override_rules",
  "rollback_requirements",
  "bounded_scope_constraints",
  "operational_flow_decision"
];

const operatorFlowSteps = [
  "receive_whatsapp_intake",
  "capture_problem_summary",
  "capture_location_context",
  "evaluate_basic_legitimacy",
  "evaluate_contradictions",
  "assign_PASS_HOLD_BLOCK",
  "manual_operator_review",
  "bounded_scheduling_if_PASS",
  "manual_followup_logging",
  "record_outcome"
];

const contradictionRules = {
  missing_required_information: "HOLD",
  unclear_location_or_scope: "HOLD",
  contradictory_behavioral_signals: "HOLD",
  unsafe_or_invalid_request: "BLOCK",
  validated_legitimate_request: "PASS"
};

const replayLoggingRequirements = [
  "intake_timestamp",
  "operator_id",
  "decision_state",
  "contradiction_flags",
  "scheduling_state",
  "outcome_state",
  "rollback_reference",
  "replay_reference"
];

const boundedScopeConstraints = [
  "human_supervision_required",
  "autonomous_execution_forbidden",
  "runtime_mutation_forbidden",
  "bounded_geographic_scope_only",
  "manual_override_required_for_uncertainty",
  "contradiction_escalation_required"
];

describe("mosquito_pilot_manual_operator_flow_v1 artifact", () => {
  test("all required top-level artifact fields exist", () => {
    for (const field of requiredTopLevelFields) {
      expect(artifact).toHaveProperty(field);
    }
    expect(artifact.status).toBe("CONCEPTUAL_OPERATIONAL_FLOW_ARTIFACT_ONLY");
  });

  test("all activation flags are false", () => {
    expect(artifact.production_activation_allowed).toBe(false);
    expect(artifact.runtime_mutation_allowed).toBe(false);
    expect(artifact.autonomous_execution_allowed).toBe(false);
  });

  test("whatsapp_number matches exactly 0542270080", () => {
    expect(artifact.whatsapp_number).toBe("0542270080");
  });

  test("all operator flow steps exist", () => {
    expect(artifact.operator_flow_steps).toEqual(operatorFlowSteps);
  });

  test("only PASS, HOLD, and BLOCK are used", () => {
    expect(artifact.decision_states).toEqual(["PASS", "HOLD", "BLOCK"]);
    for (const rule of artifact.contradiction_escalation_rules) {
      expect(artifact.decision_states).toContain(rule.decision);
    }
  });

  test("all contradiction escalation rules exist", () => {
    expect(Object.fromEntries(
      artifact.contradiction_escalation_rules.map((rule) => [rule.condition, rule.decision])
    )).toEqual(contradictionRules);
  });

  test("replay_logging_requirements include all required fields", () => {
    expect(artifact.replay_logging_requirements).toEqual(replayLoggingRequirements);
  });

  test("operator_override_rules all equal true", () => {
    expect(Object.values(artifact.operator_override_rules)).toEqual([true, true, true, true]);
  });

  test("bounded_scope_constraints include all required constraints", () => {
    expect(artifact.bounded_scope_constraints).toEqual(expect.arrayContaining(boundedScopeConstraints));
  });

  test("operational_flow_decision matches exactly", () => {
    expect(artifact.operational_flow_decision).toBe("READY_FOR_BOUNDED_HUMAN_SUPERVISED_OPERATIONAL_FLOW_REVIEW_ONLY");
  });

  test("no runtime logic exists", () => {
    expect(JSON.stringify(artifact.operator_flow_steps)).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
    expect(JSON.stringify(artifact.contradiction_escalation_rules)).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no autonomous execution behavior exists", () => {
    expect(JSON.stringify(artifact.operator_flow_steps)).not.toMatch(/autonomous_execution|autonomous_deploy|autonomous_routing|ai_execution/);
    expect(JSON.stringify(artifact.contradiction_escalation_rules)).not.toMatch(/autonomous_execution|autonomous_deploy|autonomous_routing|ai_execution/);
    expect(artifact.autonomous_execution_allowed).toBe(false);
  });

  test("no orchestration runtime exists", () => {
    expect(JSON.stringify(artifact.operator_flow_steps)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
    expect(JSON.stringify(artifact.contradiction_escalation_rules)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
  });

  test("no infrastructure activation exists", () => {
    expect(JSON.stringify(artifact.operator_flow_steps)).not.toMatch(/activate_infrastructure|infrastructure_activation|infrastructure_automation/);
    expect(JSON.stringify(artifact.contradiction_escalation_rules)).not.toMatch(/activate_infrastructure|infrastructure_activation|infrastructure_automation/);
  });
});
