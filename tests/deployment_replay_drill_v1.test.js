const artifact = require("../contracts/deployment_replay_drill_v1.json");

const requiredTopLevelFields = [
  "artifact_id",
  "version",
  "status",
  "production_activation_allowed",
  "runtime_mutation_allowed",
  "cloudflare_activation_allowed",
  "autonomous_deployment_allowed",
  "validation_purpose",
  "pass_conditions",
  "fail_conditions",
  "block_conditions",
  "required_event_fields",
  "decision_rules",
  "reconstruction_steps"
];

const requiredEventFields = [
  "surface_id",
  "lineage_id",
  "deployment_id",
  "environment",
  "previous_state",
  "next_state",
  "rollback_reference",
  "replay_reference",
  "domain_mapping",
  "authority_owner",
  "event_order",
  "payload_hash"
];

const requiredReconstructionSteps = [
  "sort_events_by_event_order",
  "validate_required_fields",
  "validate_payload_hash",
  "reconstruct_environment_transition",
  "reconstruct_domain_mapping",
  "reconstruct_authority_owner",
  "reconstruct_previous_state_to_next_state",
  "verify_rollback_reference",
  "verify_replay_reference",
  "return_replay_equivalence_decision"
];

const requiredDecisionRules = {
  any_required_field_missing: "BLOCK",
  event_order_invalid: "BLOCK",
  payload_hash_mismatch: "BLOCK",
  authority_owner_ambiguous: "BLOCK",
  replay_reconstructs_equivalent_state: "PASS"
};

const decisionFor = (condition) => {
  const rule = artifact.decision_rules.find((item) => item.condition === condition);
  return rule && rule.decision;
};

describe("deployment_replay_drill_v1 artifact", () => {
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

  test("all required event fields exist", () => {
    expect(artifact.required_event_fields).toEqual(requiredEventFields);
  });

  test("all reconstruction steps exist", () => {
    expect(artifact.reconstruction_steps).toEqual(requiredReconstructionSteps);
  });

  test("all decision rules exist", () => {
    expect(Object.fromEntries(artifact.decision_rules.map((rule) => [rule.condition, rule.decision]))).toEqual(requiredDecisionRules);
  });

  test("missing required field returns BLOCK", () => {
    expect(decisionFor("any_required_field_missing")).toBe("BLOCK");
  });

  test("invalid event order returns BLOCK", () => {
    expect(decisionFor("event_order_invalid")).toBe("BLOCK");
  });

  test("payload hash mismatch returns BLOCK", () => {
    expect(decisionFor("payload_hash_mismatch")).toBe("BLOCK");
  });

  test("ambiguous authority_owner returns BLOCK", () => {
    expect(decisionFor("authority_owner_ambiguous")).toBe("BLOCK");
  });

  test("replay equivalence reconstruction returns PASS", () => {
    expect(decisionFor("replay_reconstructs_equivalent_state")).toBe("PASS");
  });

  test("no runtime mutation logic exists", () => {
    expect(JSON.stringify(artifact.reconstruction_steps)).not.toMatch(/mutate_runtime|runtime_mutation_logic/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no production deployment logic exists", () => {
    expect(JSON.stringify(artifact.reconstruction_steps)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(artifact.production_activation_allowed).toBe(false);
  });

  test("no Cloudflare activation logic exists", () => {
    expect(JSON.stringify(artifact.reconstruction_steps)).not.toMatch(/activate_cloudflare|cloudflare_activation_logic/);
    expect(artifact.cloudflare_activation_allowed).toBe(false);
  });

  test("no autonomous deployment logic exists", () => {
    expect(JSON.stringify(artifact.reconstruction_steps)).not.toMatch(/autonomous_deploy|autonomous_deployment_logic/);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });
});
