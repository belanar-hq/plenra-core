const artifact = require("../contracts/deployment_survivability_suite_registration_v1.json");

const requiredTopLevelFields = [
  "artifact_id",
  "version",
  "status",
  "production_activation_allowed",
  "runtime_mutation_allowed",
  "cloudflare_activation_allowed",
  "autonomous_deployment_allowed",
  "validation_purpose",
  "registered_suite",
  "validated_artifacts",
  "validation_results",
  "replay_status",
  "governance_status",
  "bounded_scope_rules",
  "registration_constraints",
  "suite_registration_decision"
];

const validatedArtifacts = [
  "deployment_pressure_scenarios_v1",
  "deployment_replay_drill_v1",
  "rollback_survivability_drill_v1",
  "blast_radius_simulation_v1",
  "deployment_entropy_governance_v1",
  "deployment_survivability_suite_index_v1",
  "deployment_suite_pressure_review_v1"
];

const boundedScopeRules = [
  "contracts_and_tests_only",
  "no_runtime_mutation",
  "no_production_activation",
  "no_cloudflare_activation",
  "no_autonomous_execution",
  "no_infrastructure_automation"
];

const registrationConstraints = [
  "simulation_artifacts_cannot_authorize_production",
  "simulation_artifacts_cannot_mutate_runtime",
  "simulation_artifacts_cannot_expand_governance",
  "simulation_artifacts_remain_non_executable"
];

describe("deployment_survivability_suite_registration_v1 artifact", () => {
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

  test("registered_suite matches exactly", () => {
    expect(artifact.registered_suite).toBe("DEPLOYMENT_SURVIVABILITY_PRESSURE_SIMULATION_SUITE");
  });

  test("all validated artifacts exist", () => {
    expect(artifact.validated_artifacts).toEqual(validatedArtifacts);
    expect(artifact.validation_results.map((result) => result.artifact_name)).toEqual(validatedArtifacts);
  });

  test("all artifact validation statuses equal VALIDATED", () => {
    for (const result of artifact.validation_results) {
      expect(result.validation_status).toBe("VALIDATED");
    }
  });

  test("all bounded_scope_preserved values equal true", () => {
    for (const result of artifact.validation_results) {
      expect(result.bounded_scope_preserved).toBe(true);
    }
  });

  test("all runtime_mutation_detected values equal false", () => {
    for (const result of artifact.validation_results) {
      expect(result.runtime_mutation_detected).toBe(false);
    }
  });

  test("all production_activation_detected values equal false", () => {
    for (const result of artifact.validation_results) {
      expect(result.production_activation_detected).toBe(false);
    }
  });

  test("replay_status values are all true", () => {
    expect(Object.values(artifact.replay_status)).toEqual([true, true, true, true]);
  });

  test("governance_status values are all false", () => {
    expect(Object.values(artifact.governance_status)).toEqual([false, false, false, false]);
  });

  test("bounded_scope_rules include all required constraints", () => {
    expect(artifact.bounded_scope_rules).toEqual(expect.arrayContaining(boundedScopeRules));
  });

  test("registration_constraints include all mandatory constraints", () => {
    expect(artifact.registration_constraints).toEqual(expect.arrayContaining(registrationConstraints));
  });

  test("suite_registration_decision equals VALIDATED_AND_BOUNDED", () => {
    expect(artifact.suite_registration_decision).toBe("VALIDATED_AND_BOUNDED");
  });

  test("no runtime logic exists", () => {
    expect(JSON.stringify(artifact.validated_artifacts)).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
    expect(JSON.stringify(artifact.validation_results)).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no orchestration runtime exists", () => {
    expect(JSON.stringify(artifact.validated_artifacts)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
    expect(JSON.stringify(artifact.validation_results)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
  });

  test("no infrastructure activation exists", () => {
    expect(JSON.stringify(artifact.validated_artifacts)).not.toMatch(/activate_infrastructure|infrastructure_activation|infrastructure_automation/);
    expect(JSON.stringify(artifact.validation_results)).not.toMatch(/activate_infrastructure|infrastructure_activation|infrastructure_automation/);
  });

  test("no autonomous deployment behavior exists", () => {
    expect(JSON.stringify(artifact.validated_artifacts)).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(JSON.stringify(artifact.validation_results)).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });
});
