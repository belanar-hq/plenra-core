const artifact = require("../contracts/deployment_suite_pressure_review_v1.json");

const requiredTopLevelFields = [
  "artifact_id",
  "version",
  "status",
  "production_activation_allowed",
  "runtime_mutation_allowed",
  "cloudflare_activation_allowed",
  "autonomous_deployment_allowed",
  "validation_purpose",
  "reviewed_artifacts",
  "pressure_review_matrix",
  "contradiction_checks",
  "replay_consistency_checks",
  "rollback_consistency_checks",
  "blast_radius_consistency_checks",
  "entropy_governance_checks",
  "suite_level_decision_rules"
];

const reviewedArtifacts = [
  "deployment_pressure_scenarios_v1",
  "deployment_replay_drill_v1",
  "rollback_survivability_drill_v1",
  "blast_radius_simulation_v1",
  "deployment_entropy_governance_v1",
  "deployment_survivability_suite_index_v1"
];

const matrixReviewIds = [
  "replay_vs_rollback_consistency",
  "blast_radius_vs_rollback_consistency",
  "entropy_vs_orphan_surface_consistency",
  "lineage_vs_replay_consistency",
  "authority_vs_rollback_consistency",
  "observability_vs_blast_radius_consistency"
];

const matrixFields = [
  "review_id",
  "validation_target",
  "expected_consistency_behavior",
  "hold_condition",
  "block_condition"
];

const decisionFor = (condition) => {
  const rule = artifact.suite_level_decision_rules.find((item) => item.condition === condition);
  return rule && rule.decision;
};

describe("deployment_suite_pressure_review_v1 artifact", () => {
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

  test("all reviewed artifacts exist", () => {
    expect(artifact.reviewed_artifacts).toEqual(reviewedArtifacts);
    expect(artifact.reviewed_artifacts).toHaveLength(6);
  });

  test("all pressure review matrix items exist", () => {
    expect(artifact.pressure_review_matrix.map((item) => item.review_id)).toEqual(matrixReviewIds);
    expect(artifact.pressure_review_matrix).toHaveLength(6);
  });

  test("every matrix item includes all mandatory fields", () => {
    for (const item of artifact.pressure_review_matrix) {
      for (const field of matrixFields) {
        expect(item).toHaveProperty(field);
      }
    }
  });

  test("missing_reviewed_artifact returns HOLD", () => {
    expect(decisionFor("missing_reviewed_artifact")).toBe("HOLD");
  });

  test("contradiction_between_artifacts returns HOLD", () => {
    expect(decisionFor("contradiction_between_artifacts")).toBe("HOLD");
  });

  test("replay_and_rollback_inconsistency returns BLOCK", () => {
    expect(decisionFor("replay_and_rollback_inconsistency")).toBe("BLOCK");
  });

  test("blast_radius_without_observability_alignment returns HOLD", () => {
    expect(decisionFor("blast_radius_without_observability_alignment")).toBe("HOLD");
  });

  test("entropy_controls_missing_for_orphan_surfaces returns BLOCK", () => {
    expect(decisionFor("entropy_controls_missing_for_orphan_surfaces")).toBe("BLOCK");
  });

  test("all_consistency_checks_pass returns PASS", () => {
    expect(decisionFor("all_consistency_checks_pass")).toBe("PASS");
  });

  test("no runtime logic exists", () => {
    expect(JSON.stringify(artifact.reviewed_artifacts)).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
    expect(JSON.stringify(artifact.pressure_review_matrix)).not.toMatch(/runtime_engine|runtime_logic|execute_runtime|mutate_runtime/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no orchestration runtime exists", () => {
    expect(JSON.stringify(artifact.reviewed_artifacts)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
    expect(JSON.stringify(artifact.pressure_review_matrix)).not.toMatch(/orchestration_runtime|orchestrator_runtime|orchestration_logic/);
  });

  test("no infrastructure activation exists", () => {
    expect(JSON.stringify(artifact.reviewed_artifacts)).not.toMatch(/activate_infrastructure|infrastructure_activation|infrastructure_automation/);
    expect(JSON.stringify(artifact.pressure_review_matrix)).not.toMatch(/activate_infrastructure|infrastructure_activation|infrastructure_automation/);
  });

  test("no autonomous deployment behavior exists", () => {
    expect(JSON.stringify(artifact.reviewed_artifacts)).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(JSON.stringify(artifact.pressure_review_matrix)).not.toMatch(/autonomous_deploy|autonomous_execution|autonomous_deployment_behavior/);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });
});
