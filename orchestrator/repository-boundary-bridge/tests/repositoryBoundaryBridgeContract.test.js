const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "repositoryBoundaryBridgeContract.json"), "utf8"));

describe("repositoryBoundaryBridgeContract", () => {
  test("is bound to the locked source design", () => {
    expect(contract.source_design_id).toBe("repository_runtime_boundary_bridge_v1");
    expect(contract.source_design_status).toBe("LOCKED_SOURCE_DESIGN");
    expect(contract.contract_version).toBe("v1");
  });

  test("allows only the source transfer flow and dispatch target", () => {
    expect(contract.allowed_transfer_flow).toEqual([
      "verify_sandbox_artifact_hash",
      "verify_prompt_hash",
      "verify_repository_target_path",
      "allow_import_only_into_dispatches",
      "record_dispatch_lineage",
      "run_post_import_validation"
    ]);
    expect(contract.allowed_repository_targets).toEqual(["dispatches/*.dispatch.json"]);
  });

  test("preserves boundary constraints", () => {
    expect(contract.required_hash_verification).toEqual({ algorithm: "SHA-256", required: true });
    expect(contract.repository_import_rules).toEqual(expect.arrayContaining([
      "write_access_allowed_only_to_dispatches",
      "no_prompt_mutation",
      "no_scope_expansion",
      "no_runtime_authority",
      "no_production_authority",
      "no_canon_mutation"
    ]));
    expect(contract.safe_to_continue).toBe(false);
  });
});
