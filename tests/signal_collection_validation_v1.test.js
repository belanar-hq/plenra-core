const artifact = require("../contracts/signal_collection_validation_v1.json");

const requiredFields = [
  "signal_id",
  "source",
  "raw_text",
  "decision_pattern_ids",
  "timestamp",
  "lineage"
];

const forbiddenRawTextOperations = [
  "edit",
  "overwrite",
  "normalize_in_place",
  "rewrite"
];

const decisionFor = (condition) => {
  const rule = artifact.decision_rules.find((item) => item.condition === condition);
  return rule && rule.decision;
};

describe("signal_collection_validation_v1 artifact", () => {
  test("uses plural decision_pattern_ids as the only pattern assignment field", () => {
    expect(artifact.required_signal_fields).toEqual(requiredFields);
    expect(artifact.required_signal_fields).toContain("decision_pattern_ids");
    expect(artifact.required_signal_fields).not.toContain("decision_pattern_id");
    expect(artifact.forbidden_signal_fields).toContain("decision_pattern_id");
  });

  test("decision_pattern_ids is stored as a JSON array of existing V0 pattern identifiers", () => {
    expect(artifact.decision_pattern_ids.storage_type).toBe("TEXT");
    expect(artifact.decision_pattern_ids.storage_format).toBe("JSON_ARRAY");
    expect(artifact.decision_pattern_ids.item_reference).toBe("Decision Pattern Library V0 identifier");
    expect(artifact.decision_pattern_ids.minimum_items).toBe(1);
  });

  test("source remains present and source_type is not introduced", () => {
    expect(artifact.required_signal_fields).toContain("source");
    expect(artifact.source.field_status).toBe("existing_field");
    expect(artifact.source.source_type_required).toBe(false);
    expect(artifact.required_signal_fields).not.toContain("source_type");
    expect(artifact.forbidden_signal_fields).toContain("source_type");
  });

  test("raw_text is immutable after signal creation", () => {
    expect(artifact.raw_text.immutability_rule).toBe("immutable_after_signal_creation");
    expect(artifact.raw_text.allowed_operations).toEqual(["read", "export"]);
    expect(artifact.raw_text.forbidden_operations).toEqual(forbiddenRawTextOperations);
  });

  test("approved pass and block decisions are explicit", () => {
    expect(decisionFor("decision_pattern_ids_present_as_json_array")).toBe("PASS");
    expect(decisionFor("single_decision_pattern_id_field_present")).toBe("BLOCK");
    expect(decisionFor("source_type_added")).toBe("BLOCK");
    expect(decisionFor("raw_text_mutation_attempted_after_creation")).toBe("BLOCK");
  });

  test("artifact stays bounded to minimal correction and replay rule only", () => {
    expect(artifact.scope).toBe("minimal_schema_correction_and_replay_rule_only");
    expect(artifact.new_tables_allowed).toBe(false);
    expect(artifact.new_infrastructure_allowed).toBe(false);
    expect(artifact.production_activation_allowed).toBe(false);
    expect(artifact.runtime_mutation_allowed).toBe(false);
  });
});
