const artifact = require("../contracts/blast_radius_simulation_v1.json");

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
  "hold_conditions",
  "scoring_dimensions",
  "decision_rules"
];

const requiredDimensions = [
  "affected_domains",
  "affected_surfaces",
  "shared_dependencies",
  "runtime_dependency_collision",
  "production_exposure_risk",
  "rollback_complexity",
  "observability_coverage"
];

const decisionFor = (condition) => {
  const rule = artifact.decision_rules.find((item) => item.condition === condition);
  return rule && rule.decision;
};

const dimensionFor = (dimension) => artifact.scoring_dimensions.find((item) => item.dimension === dimension);

describe("blast_radius_simulation_v1 artifact", () => {
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

  test("all 7 scoring dimensions exist", () => {
    expect(artifact.scoring_dimensions.map((item) => item.dimension)).toEqual(requiredDimensions);
    expect(artifact.scoring_dimensions).toHaveLength(7);
  });

  test("every scoring dimension has score_range 0-5", () => {
    for (const dimension of artifact.scoring_dimensions) {
      expect(dimension.score_range).toBe("0-5");
    }
  });

  test("affected_domains has hold_if_unknown true", () => {
    expect(dimensionFor("affected_domains").hold_if_unknown).toBe(true);
  });

  test("affected_surfaces has hold_if_unknown true", () => {
    expect(dimensionFor("affected_surfaces").hold_if_unknown).toBe(true);
  });

  test("shared_dependencies has hold_if_unknown true", () => {
    expect(dimensionFor("shared_dependencies").hold_if_unknown).toBe(true);
  });

  test("runtime_dependency_collision blocks at score >= 4", () => {
    expect(dimensionFor("runtime_dependency_collision").block_if_score_at_or_above).toBe(4);
    expect(decisionFor("runtime_dependency_collision_score_at_or_above_4")).toBe("BLOCK");
  });

  test("production_exposure_risk blocks at score >= 4", () => {
    expect(dimensionFor("production_exposure_risk").block_if_score_at_or_above).toBe(4);
  });

  test("rollback_complexity holds at score >= 3", () => {
    expect(dimensionFor("rollback_complexity").hold_if_score_at_or_above).toBe(3);
    expect(decisionFor("rollback_complexity_score_at_or_above_3")).toBe("HOLD");
  });

  test("observability_coverage holds below score 3", () => {
    expect(dimensionFor("observability_coverage").hold_if_score_below).toBe(3);
    expect(decisionFor("observability_coverage_score_below_3")).toBe("HOLD");
  });

  test("blast_radius_cannot_be_calculated returns HOLD", () => {
    expect(decisionFor("blast_radius_cannot_be_calculated")).toBe("HOLD");
  });

  test("production_state_may_be_affected_without_rollback_proof returns BLOCK", () => {
    expect(decisionFor("production_state_may_be_affected_without_rollback_proof")).toBe("BLOCK");
  });

  test("all known scores within threshold return PASS", () => {
    expect(decisionFor("all_scores_known_and_within_threshold")).toBe("PASS");
  });

  test("no runtime mutation logic exists", () => {
    expect(JSON.stringify(artifact.scoring_dimensions)).not.toMatch(/mutate_runtime|runtime_mutation_logic/);
    expect(JSON.stringify(artifact.decision_rules)).not.toMatch(/mutate_runtime|runtime_mutation_logic/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no production deployment logic exists", () => {
    expect(JSON.stringify(artifact.scoring_dimensions)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(JSON.stringify(artifact.decision_rules)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(artifact.production_activation_allowed).toBe(false);
  });

  test("no Cloudflare activation logic exists", () => {
    expect(JSON.stringify(artifact.scoring_dimensions)).not.toMatch(/activate_cloudflare|cloudflare_activation_logic/);
    expect(JSON.stringify(artifact.decision_rules)).not.toMatch(/activate_cloudflare|cloudflare_activation_logic/);
    expect(artifact.cloudflare_activation_allowed).toBe(false);
  });

  test("no autonomous deployment behavior exists", () => {
    expect(JSON.stringify(artifact.scoring_dimensions)).not.toMatch(/autonomous_deploy|autonomous_deployment_logic/);
    expect(JSON.stringify(artifact.decision_rules)).not.toMatch(/autonomous_deploy|autonomous_deployment_logic/);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });
});
