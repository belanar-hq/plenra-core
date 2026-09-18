const artifact = require("../contracts/rollback_survivability_drill_v1.json");

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
  "rollback_tests"
];

const requiredRollbackTestIds = [
  "full_rollback",
  "partial_rollback",
  "failed_rollback",
  "rollback_with_broken_lineage",
  "rollback_with_missing_domain_reference",
  "rollback_during_unresolved_HOLD"
];

const mandatoryRollbackTestFields = [
  "test_id",
  "name",
  "simulated_trigger",
  "expected_decision",
  "measurement_method"
];

const decisionFor = (testId) => {
  const rollbackTest = artifact.rollback_tests.find((item) => item.test_id === testId);
  return rollbackTest && rollbackTest.expected_decision;
};

describe("rollback_survivability_drill_v1 artifact", () => {
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

  test("all 6 required rollback tests exist", () => {
    expect(artifact.rollback_tests.map((rollbackTest) => rollbackTest.test_id)).toEqual(requiredRollbackTestIds);
    expect(artifact.rollback_tests).toHaveLength(6);
  });

  test("every rollback test includes all mandatory fields", () => {
    for (const rollbackTest of artifact.rollback_tests) {
      for (const field of mandatoryRollbackTestFields) {
        expect(rollbackTest).toHaveProperty(field);
      }
    }
  });

  test("full rollback returns PASS", () => {
    expect(decisionFor("full_rollback")).toBe("PASS");
  });

  test("partial rollback returns HOLD", () => {
    expect(decisionFor("partial_rollback")).toBe("HOLD");
  });

  test("failed rollback reconstruction returns BLOCK", () => {
    expect(decisionFor("failed_rollback")).toBe("BLOCK");
  });

  test("broken lineage returns BLOCK", () => {
    expect(decisionFor("rollback_with_broken_lineage")).toBe("BLOCK");
  });

  test("missing domain reference returns BLOCK", () => {
    expect(decisionFor("rollback_with_missing_domain_reference")).toBe("BLOCK");
  });

  test("rollback during unresolved HOLD returns BLOCK", () => {
    expect(decisionFor("rollback_during_unresolved_HOLD")).toBe("BLOCK");
  });

  test("mandatory pass, fail, and block conditions are present", () => {
    expect(artifact.pass_conditions).toEqual(expect.arrayContaining([
      "rollback_reference_exists",
      "rollback_lineage_intact",
      "domain_mapping_restorable",
      "environment_state_reconstructable",
      "unresolved_HOLD_blocks_rollback"
    ]));
    expect(artifact.fail_conditions).toEqual(expect.arrayContaining([
      "rollback_marked_valid_with_missing_lineage",
      "rollback_marked_valid_with_missing_domain_reference",
      "rollback_proceeds_during_unresolved_HOLD",
      "partial_rollback_treated_as_full_rollback"
    ]));
    expect(artifact.block_conditions).toEqual(expect.arrayContaining([
      "broken_lineage",
      "missing_rollback_reference",
      "missing_domain_reference",
      "unresolved_HOLD_during_rollback",
      "production_state_affected_without_rollback_proof"
    ]));
  });

  test("no runtime mutation logic exists", () => {
    expect(JSON.stringify(artifact.rollback_tests)).not.toMatch(/mutate_runtime|runtime_mutation_logic/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no production deployment logic exists", () => {
    expect(JSON.stringify(artifact.rollback_tests)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(artifact.production_activation_allowed).toBe(false);
  });

  test("no Cloudflare activation logic exists", () => {
    expect(JSON.stringify(artifact.rollback_tests)).not.toMatch(/activate_cloudflare|cloudflare_activation_logic/);
    expect(artifact.cloudflare_activation_allowed).toBe(false);
  });

  test("no autonomous rollback behavior exists", () => {
    expect(JSON.stringify(artifact.rollback_tests)).not.toMatch(/autonomous_rollback|autonomous_deployment_logic/);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });
});
