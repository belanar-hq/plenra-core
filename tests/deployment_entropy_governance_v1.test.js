const artifact = require("../contracts/deployment_entropy_governance_v1.json");

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
  "lifecycle_controls",
  "decision_rules"
];

const lifecycleTargets = [
  "inactive_surfaces",
  "orphan_deployments",
  "unused_domains",
  "stale_preview_links",
  "duplicated_surfaces",
  "unclaimed_lineage_branches",
  "high_frequency_deploy_loops"
];

const lifecycleFields = [
  "target",
  "archive_rule",
  "expiration_rule",
  "merge_rule",
  "delete_block_rule",
  "cost_risk_score"
];

const allowedRiskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const controlFor = (target) => artifact.lifecycle_controls.find((item) => item.target === target);

const decisionFor = (condition) => {
  const rule = artifact.decision_rules.find((item) => item.condition === condition);
  return rule && rule.decision;
};

describe("deployment_entropy_governance_v1 artifact", () => {
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

  test("all 7 lifecycle targets exist", () => {
    expect(artifact.lifecycle_controls.map((item) => item.target)).toEqual(lifecycleTargets);
    expect(artifact.lifecycle_controls).toHaveLength(7);
  });

  test("every lifecycle control includes all mandatory fields", () => {
    for (const control of artifact.lifecycle_controls) {
      for (const field of lifecycleFields) {
        expect(control).toHaveProperty(field);
      }
    }
  });

  test("only LOW, MEDIUM, HIGH, and CRITICAL cost risk values are used", () => {
    for (const control of artifact.lifecycle_controls) {
      expect(allowedRiskLevels).toContain(control.cost_risk_score);
    }
  });

  test("orphan_production_surface_detected returns BLOCK", () => {
    expect(decisionFor("orphan_production_surface_detected")).toBe("BLOCK");
  });

  test("unclaimed_lineage_branch_attempts_promotion returns BLOCK", () => {
    expect(decisionFor("unclaimed_lineage_branch_attempts_promotion")).toBe("BLOCK");
  });

  test("lifecycle_control_missing returns HOLD", () => {
    expect(decisionFor("lifecycle_control_missing")).toBe("HOLD");
  });

  test("cost_risk_score_CRITICAL returns BLOCK", () => {
    expect(decisionFor("cost_risk_score_CRITICAL")).toBe("BLOCK");
  });

  test("all_lifecycle_controls_present returns PASS", () => {
    expect(decisionFor("all_lifecycle_controls_present")).toBe("PASS");
  });

  test("inactive_surfaces include archive rules", () => {
    expect(controlFor("inactive_surfaces").archive_rule).toContain("archive");
    expect(artifact.pass_conditions).toContain("inactive_surfaces_have_archive_rules");
  });

  test("unused_domains include expiration rules", () => {
    expect(controlFor("unused_domains").expiration_rule).toContain("expire");
    expect(artifact.pass_conditions).toContain("unused_domains_have_expiration_rules");
  });

  test("duplicated_surfaces include merge rules", () => {
    expect(controlFor("duplicated_surfaces").merge_rule).toContain("merge");
    expect(artifact.pass_conditions).toContain("duplicated_surfaces_have_merge_rules");
  });

  test("unclaimed_lineage_branches include block or archive behavior", () => {
    const control = controlFor("unclaimed_lineage_branches");
    expect(`${control.archive_rule} ${control.delete_block_rule}`).toMatch(/archive|block/);
    expect(artifact.pass_conditions).toContain("unclaimed_lineage_branches_are_blocked_or_archived");
  });

  test("high_frequency_deploy_loops are detected", () => {
    const control = controlFor("high_frequency_deploy_loops");
    expect(`${control.archive_rule} ${control.merge_rule} ${control.delete_block_rule}`).toContain("loop");
    expect(artifact.pass_conditions).toContain("high_frequency_deploy_loops_are_detected");
  });

  test("mandatory pass, fail, and block conditions are present", () => {
    expect(artifact.pass_conditions).toEqual(expect.arrayContaining([
      "inactive_surfaces_have_archive_rules",
      "orphan_deployments_have_block_or_delete_rules",
      "unused_domains_have_expiration_rules",
      "stale_preview_links_have_expiration_rules",
      "duplicated_surfaces_have_merge_rules",
      "unclaimed_lineage_branches_are_blocked_or_archived",
      "high_frequency_deploy_loops_are_detected"
    ]));
    expect(artifact.fail_conditions).toEqual(expect.arrayContaining([
      "inactive_surface_without_lifecycle_control",
      "orphan_deployment_remaining_active",
      "unused_domain_remaining_mapped",
      "stale_preview_link_without_expiration",
      "duplicated_surface_remaining_unmerged_without_justification",
      "unclaimed_lineage_branch_remaining_deployable"
    ]));
    expect(artifact.block_conditions).toEqual(expect.arrayContaining([
      "orphan_production_surface_detected",
      "unclaimed_lineage_branch_attempts_promotion",
      "unused_domain_attached_to_active_surface",
      "high_frequency_deploy_loop_with_unbounded_cost_risk"
    ]));
  });

  test("no runtime mutation logic exists", () => {
    expect(JSON.stringify(artifact.lifecycle_controls)).not.toMatch(/mutate_runtime|runtime_mutation_logic/);
    expect(JSON.stringify(artifact.decision_rules)).not.toMatch(/mutate_runtime|runtime_mutation_logic/);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });

  test("no production deployment logic exists", () => {
    expect(JSON.stringify(artifact.lifecycle_controls)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(JSON.stringify(artifact.decision_rules)).not.toMatch(/deploy_to_production|production_deployment_logic/);
    expect(artifact.production_activation_allowed).toBe(false);
  });

  test("no Cloudflare activation logic exists", () => {
    expect(JSON.stringify(artifact.lifecycle_controls)).not.toMatch(/activate_cloudflare|cloudflare_activation_logic/);
    expect(JSON.stringify(artifact.decision_rules)).not.toMatch(/activate_cloudflare|cloudflare_activation_logic/);
    expect(artifact.cloudflare_activation_allowed).toBe(false);
  });

  test("no autonomous deployment behavior exists", () => {
    expect(JSON.stringify(artifact.lifecycle_controls)).not.toMatch(/autonomous_deploy|autonomous_deployment_logic/);
    expect(JSON.stringify(artifact.decision_rules)).not.toMatch(/autonomous_deploy|autonomous_deployment_logic/);
    expect(artifact.autonomous_deployment_allowed).toBe(false);
  });
});
