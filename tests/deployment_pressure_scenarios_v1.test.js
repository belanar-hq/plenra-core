const artifact = require("../contracts/deployment_pressure_scenarios_v1.json");

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
  "scenarios"
];

const requiredScenarioIds = [
  "corrupted_deployment_lineage",
  "partial_rollback_failure",
  "staging_to_production_drift",
  "orphan_microsite_accumulation",
  "hidden_domain_mapping",
  "cross_environment_state_leakage",
  "replay_reconstruction_failure",
  "observability_event_saturation",
  "blast_radius_underestimation",
  "authority_ambiguity_during_rollback",
  "expired_surface_not_archived",
  "duplicated_production_promotion_attempt"
];

const mandatoryScenarioFields = [
  "scenario_id",
  "failure_type",
  "simulated_trigger",
  "expected_survivable_behavior",
  "measurement_method",
  "pass_condition",
  "fail_condition",
  "max_allowed_blast_radius",
  "required_orchestrator_decision",
  "required_recovery_action"
];

const allowedDecisions = ["PASS", "HOLD", "BLOCK"];

describe("deployment_pressure_scenarios_v1 artifact", () => {
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

  test("all 12 required scenarios exist", () => {
    expect(artifact.scenarios.map((scenario) => scenario.scenario_id)).toEqual(requiredScenarioIds);
    expect(artifact.scenarios).toHaveLength(12);
  });

  test("every scenario includes all mandatory fields", () => {
    for (const scenario of artifact.scenarios) {
      for (const field of mandatoryScenarioFields) {
        expect(scenario).toHaveProperty(field);
      }
    }
  });

  test("every scenario includes measurement_method", () => {
    for (const scenario of artifact.scenarios) {
      expect(typeof scenario.measurement_method).toBe("string");
      expect(scenario.measurement_method.length).toBeGreaterThan(0);
    }
  });

  test("every scenario includes pass_condition", () => {
    for (const scenario of artifact.scenarios) {
      expect(typeof scenario.pass_condition).toBe("string");
      expect(scenario.pass_condition.length).toBeGreaterThan(0);
    }
  });

  test("every scenario includes fail_condition", () => {
    for (const scenario of artifact.scenarios) {
      expect(typeof scenario.fail_condition).toBe("string");
      expect(scenario.fail_condition.length).toBeGreaterThan(0);
    }
  });

  test("no scenario enables production deployment", () => {
    expect(JSON.stringify(artifact.scenarios)).not.toMatch(/production_activation_allowed|enable_production_deployment/);
    expect(artifact.production_activation_allowed).toBe(false);
  });

  test("no runtime mutation logic exists", () => {
    expect(JSON.stringify(artifact.scenarios)).not.toMatch(/mutate_runtime|runtime_mutation_logic/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no Cloudflare activation logic exists", () => {
    expect(JSON.stringify(artifact.scenarios)).not.toMatch(/activate_cloudflare|cloudflare_integration/);
    expect(artifact.cloudflare_activation_allowed).toBe(false);
  });

  test("no autonomous deployment logic exists", () => {
    expect(JSON.stringify(artifact.scenarios)).not.toMatch(/autonomous_deploy|deployment_engine/);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });

  test("no runtime authority escalation exists", () => {
    expect(JSON.stringify(artifact.scenarios)).not.toMatch(/escalate_runtime_authority|platform_authority_assignment/);
  });

  test("only PASS, HOLD, and BLOCK are used", () => {
    for (const scenario of artifact.scenarios) {
      expect(allowedDecisions).toContain(scenario.required_orchestrator_decision);
    }
  });
});
