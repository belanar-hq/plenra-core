const fs = require("fs");
const path = require("path");

const fixture = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "fixtures", "sampleImportReport.valid.json"), "utf8"));

describe("sampleImportReport.valid fixture", () => {
  test("represents a validated dispatch import report without approval authority", () => {
    expect(fixture.source_snapshot_id).toBe("REPOSITORY_RUNTIME_BOUNDARY_BRIDGE_v1_HARDENED_DISPATCH_001_FINAL");
    expect(fixture.hash_algorithm).toBe("SHA-256");
    expect(fixture.repository_target_path).toBe("dispatches/repository_runtime_boundary_bridge_v1_contracts_and_tests_HARDENED.dispatch.json");
    expect(fixture.safe_to_continue).toBe(false);
  });

  test("keeps lineage hash fields synchronized", () => {
    expect(fixture.lineage).toMatchObject({
      source_snapshot_id: fixture.source_snapshot_id,
      prompt_hash: fixture.prompt_hash,
      dispatch_file_hash: fixture.dispatch_file_hash
    });
  });
});
