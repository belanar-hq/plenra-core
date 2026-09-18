const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "importValidationSchema.json"), "utf8"));
const fixture = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "sampleImportReport.valid.json"), "utf8"));

const hex64 = /^[a-f0-9]{64}$/;
const targetPattern = /^dispatches\/[^/]+\.dispatch\.json$/;

describe("importValidationSchema", () => {
  test("requires immutable import report fields", () => {
    expect(schema.source_design_id).toBe("repository_runtime_boundary_bridge_v1");
    expect(schema.required).toEqual([
      "source_snapshot_id",
      "prompt_hash",
      "dispatch_file_hash",
      "hash_algorithm",
      "repository_target_path",
      "lineage",
      "safe_to_continue"
    ]);
    expect(schema.additionalProperties).toBe(false);
  });

  test("valid fixture conforms to boundary schema constraints", () => {
    for (const key of schema.required) {
      expect(fixture).toHaveProperty(key);
    }
    expect(fixture.hash_algorithm).toBe("SHA-256");
    expect(fixture.prompt_hash).toMatch(hex64);
    expect(fixture.dispatch_file_hash).toMatch(hex64);
    expect(fixture.repository_target_path).toMatch(targetPattern);
    expect(fixture.safe_to_continue).toBe(false);
  });

  test("lineage mirrors verified hash inputs", () => {
    expect(fixture.lineage.source_snapshot_id).toBe(fixture.source_snapshot_id);
    expect(fixture.lineage.prompt_hash).toBe(fixture.prompt_hash);
    expect(fixture.lineage.dispatch_file_hash).toBe(fixture.dispatch_file_hash);
    expect(new Date(fixture.lineage.import_timestamp).toISOString()).toBe(fixture.lineage.import_timestamp);
  });
});
