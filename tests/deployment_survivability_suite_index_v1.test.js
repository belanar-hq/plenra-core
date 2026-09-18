const indexArtifact = require("../contracts/deployment_survivability_suite_index_v1.json");

const requiredTopLevelFields = [
  "artifact_id",
  "version",
  "status",
  "production_activation_allowed",
  "runtime_mutation_allowed",
  "cloudflare_activation_allowed",
  "autonomous_deployment_allowed",
  "validation_purpose",
  "registered_artifacts",
  "dependency_order",
  "bounded_scope_rules",
  "survivability_domains",
  "suite_validation_rules",
  "suite_completion_status"
];

const registeredArtifacts = [
  "deployment_pressure_scenarios_v1",
  "deployment_replay_drill_v1",
  "rollback_survivability_drill_v1",
  "blast_radius_simulation_v1",
  "deployment_entropy_governance_v1"
];

const survivabilityDomains = [
  "replay_survivability",
  "rollback_survivability",
  "blast_radius_containment",
  "deployment_entropy_control",
  "deployment_lineage_integrity",
  "authority_integrity",
  "bounded_environment_isolation"
];

const boundedScopeRules = [
  "no_production_activation",
  "no_runtime_mutation",
  "no_cloudflare_activation",
  "no_autonomous_deployment",
  "no_infrastructure_automation",
  "contracts_and_tests_only"
];

const suiteValidationRules = [
  "all_registered_artifacts_must_exist",
  "all_registered_artifacts_must_be_non_executable",
  "all_registered_artifacts_must_preserve_bounded_scope",
  "all_registered_artifacts_must_be_replay_safe",
  "missing_artifact_returns_HOLD",
  "runtime_mutation_detected_returns_BLOCK",
  "production_activation_detected_returns_BLOCK"
];

const decisionFromRule = (rule) => {
  if (rule.endsWith("_returns_HOLD")) {
    return "HOLD";
  }
  if (rule.endsWith("_returns_BLOCK")) {
    return "BLOCK";
  }
  return undefined;
};

describe("deployment_survivability_suite_index_v1 artifact", () => {
  test("all required top-level artifact fields exist", () => {
    for (const field of requiredTopLevelFields) {
      expect(indexArtifact).toHaveProperty(field);
    }
    expect(indexArtifact.status).toBe("CONCEPTUAL_PRESSURE_ARTIFACT_ONLY");
  });

  test("all activation flags are false", () => {
    expect(indexArtifact.production_activation_allowed).toBe(false);
    expect(indexArtifact.runtime_mutation_allowed).toBe(false);
    expect(indexArtifact.cloudflare_activation_allowed).toBe(false);
    expect(indexArtifact.autonomous_deployment_allowed).toBe(false);
  });

  test("all 5 registered artifacts exist", () => {
    expect(indexArtifact.registered_artifacts).toEqual(registeredArtifacts);
    expect(indexArtifact.registered_artifacts).toHaveLength(5);
  });

  test("dependency_order exactly matches required sequence", () => {
    expect(indexArtifact.dependency_order).toEqual(registeredArtifacts);
  });

  test("survivability_domains exactly match required domains", () => {
    expect(indexArtifact.survivability_domains).toEqual(survivabilityDomains);
  });

  test("bounded_scope_rules include all required constraints", () => {
    expect(indexArtifact.bounded_scope_rules).toEqual(expect.arrayContaining(boundedScopeRules));
  });

  test("suite_validation_rules include all mandatory rules", () => {
    expect(indexArtifact.suite_validation_rules).toEqual(expect.arrayContaining(suiteValidationRules));
  });

  test("suite_completion_status marks all artifacts VALIDATED", () => {
    expect(indexArtifact.suite_completion_status).toEqual({
      deployment_pressure_scenarios_v1: "VALIDATED",
      deployment_replay_drill_v1: "VALIDATED",
      rollback_survivability_drill_v1: "VALIDATED",
      blast_radius_simulation_v1: "VALIDATED",
      deployment_entropy_governance_v1: "VALIDATED"
    });
  });

  test("missing artifact rule returns HOLD", () => {
    expect(decisionFromRule("missing_artifact_returns_HOLD")).toBe("HOLD");
    expect(indexArtifact.suite_validation_rules).toContain("missing_artifact_returns_HOLD");
  });

  test("runtime mutation detection returns BLOCK", () => {
    expect(decisionFromRule("runtime_mutation_detected_returns_BLOCK")).toBe("BLOCK");
    expect(indexArtifact.suite_validation_rules).toContain("runtime_mutation_detected_returns_BLOCK");
  });

  test("production activation detection returns BLOCK", () => {
    expect(decisionFromRule("production_activation_detected_returns_BLOCK")).toBe("BLOCK");
    expect(indexArtifact.suite_validation_rules).toContain("production_activation_detected_returns_BLOCK");
  });

  test("all registered artifacts are declared non-executable", () => {
    expect(indexArtifact.suite_validation_rules).toContain("all_registered_artifacts_must_be_non_executable");
    expect(indexArtifact.bounded_scope_rules).toContain("contracts_and_tests_only");
  });

  test("no runtime logic exists", () => {
    expect(JSON.stringify(indexArtifact)).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
    expect(indexArtifact.runtime_mutation_allowed).toBe(false);
  });

  test("no orchestration runtime exists", () => {
    expect(JSON.stringify(indexArtifact)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_expansion/);
  });

  test("no infrastructure activation exists", () => {
    expect(JSON.stringify(indexArtifact)).not.toMatch(/activate_infrastructure|infrastructure_activation|infrastructure_automation_enabled/);
  });

  test("no autonomous deployment behavior exists", () => {
    expect(JSON.stringify(indexArtifact.registered_artifacts)).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(JSON.stringify(indexArtifact.dependency_order)).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(indexArtifact.autonomous_deployment_allowed).toBe(false);
  });
});
