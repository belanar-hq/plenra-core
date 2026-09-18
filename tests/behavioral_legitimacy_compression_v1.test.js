const contract = require("../contracts/behavioral_legitimacy_compression_v1.json");

const frozenPrimitiveIds = [
  "behavior_vs_discussion",
  "persistence_vs_spike",
  "irregularity_vs_synchronization"
];

const expectedDecisionRules = {
  discussion_without_behavior: "LOW_LEGITIMACY",
  virality_without_persistence: "LOW_LEGITIMACY",
  perfect_synchronization: "HIGH_SYNTHETIC_RISK",
  persistent_real_world_friction: "HIGH_LEGITIMACY",
  behavioral_irregularity: "HUMAN_AUTHENTICITY_SIGNAL",
  economic_commitment_with_friction: "HIGH_CONFIDENCE_SIGNAL"
};

const expectedHoldConditions = [
  "high_alignment_without_variance",
  "viral_spike_without_persistence",
  "discussion_consensus_without_behavior",
  "behavioral_uniformity_too_high",
  "real_world_friction_missing",
  "economic_interest_without_human_irregularity"
];

const expectedBlockConditions = [
  "new_runtime_layer_creation",
  "new_authenticity_taxonomy_creation",
  "recursive_legitimacy_expansion",
  "synthetic_behavior_scoring_systems",
  "platform_authority_assignment",
  "behavior_replaced_by_discussion_consensus",
  "synchronization_treated_as_legitimacy"
];

const primitiveIds = () => contract.frozen_primitives.map((primitive) => primitive.id);

const assertMapsOnlyToFrozenPrimitives = (mapping) => {
  for (const primitiveId of Object.values(mapping)) {
    expect(frozenPrimitiveIds).toContain(primitiveId);
  }
};

describe("behavioral_legitimacy_compression_v1 contract", () => {
  test("no new primitives allowed", () => {
    expect(primitiveIds()).toEqual(frozenPrimitiveIds);
    expect(contract.frozen_primitives).toHaveLength(3);
    expect(contract.forbidden_runtime_behaviors).toContain("add_new_primitives");
  });

  test("all behavioral logic maps to one of the 3 primitives", () => {
    expect(Object.keys(contract.decision_rule_primitive_map)).toEqual(Object.keys(expectedDecisionRules));
    expect(Object.keys(contract.hold_condition_primitive_map)).toEqual(expectedHoldConditions);
    expect(Object.keys(contract.block_condition_primitive_map)).toEqual(expectedBlockConditions);
    assertMapsOnlyToFrozenPrimitives(contract.decision_rule_primitive_map);
    assertMapsOnlyToFrozenPrimitives(contract.hold_condition_primitive_map);
    assertMapsOnlyToFrozenPrimitives(contract.block_condition_primitive_map);
  });

  test("discussion without behavior returns LOW_LEGITIMACY", () => {
    expect(contract.decision_rules.discussion_without_behavior).toBe("LOW_LEGITIMACY");
  });

  test("virality without persistence returns LOW_LEGITIMACY", () => {
    expect(contract.decision_rules.virality_without_persistence).toBe("LOW_LEGITIMACY");
  });

  test("perfect synchronization returns HIGH_SYNTHETIC_RISK", () => {
    expect(contract.decision_rules.perfect_synchronization).toBe("HIGH_SYNTHETIC_RISK");
  });

  test("persistent real-world friction returns HIGH_LEGITIMACY", () => {
    expect(contract.decision_rules.persistent_real_world_friction).toBe("HIGH_LEGITIMACY");
  });

  test("behavioral irregularity returns HUMAN_AUTHENTICITY_SIGNAL", () => {
    expect(contract.decision_rules.behavioral_irregularity).toBe("HUMAN_AUTHENTICITY_SIGNAL");
  });

  test("economic commitment with friction returns HIGH_CONFIDENCE_SIGNAL", () => {
    expect(contract.decision_rules.economic_commitment_with_friction).toBe("HIGH_CONFIDENCE_SIGNAL");
  });

  test("new taxonomy creation is BLOCKED", () => {
    expect(contract.block_conditions).toContain("new_authenticity_taxonomy_creation");
    expect(contract.forbidden_runtime_behaviors).toContain("expand_taxonomy");
  });

  test("synthetic behavior scoring is BLOCKED", () => {
    expect(contract.block_conditions).toContain("synthetic_behavior_scoring_systems");
    expect(contract.forbidden_runtime_behaviors).toContain("add_synthetic_scoring_engines");
  });

  test("platform authority assignment is BLOCKED", () => {
    expect(contract.block_conditions).toContain("platform_authority_assignment");
    expect(contract.forbidden_runtime_behaviors).toContain("add_platform_specific_authority");
  });

  test("contract contains exact HOLD, BLOCK, and reuse surfaces", () => {
    expect(contract.hold_conditions).toEqual(expectedHoldConditions);
    expect(contract.block_conditions).toEqual(expectedBlockConditions);
    expect(contract.runtime_reuse_list).toEqual([
      "contradiction_runtime",
      "intent_runtime",
      "decision_economics_runtime",
      "cross_platform_contradiction_logic",
      "bounded_signal_validation"
    ]);
  });

  test("contract remains bounded to contracts and tests only", () => {
    expect(contract.scope).toBe("contracts_and_tests_only");
    expect(contract.allowed_runtime_behaviors).toEqual([
      "compress_behavioral_legitimacy_to_frozen_primitives",
      "reuse_existing_runtime_surfaces_only",
      "return_frozen_decision_rule_outputs_only",
      "hold_when_required_conditions_are_present",
      "block_when_forbidden_conditions_are_present"
    ]);
  });
});
