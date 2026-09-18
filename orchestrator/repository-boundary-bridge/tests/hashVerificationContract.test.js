const fs = require("fs");
const path = require("path");

const contract = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "hashVerificationContract.json"), "utf8"));

describe("hashVerificationContract", () => {
  test("requires SHA-256 hash verification", () => {
    expect(contract.source_design_id).toBe("repository_runtime_boundary_bridge_v1");
    expect(contract.algorithm).toBe("SHA-256");
    expect(contract.required).toBe(true);
    expect(contract.hash_format).toEqual({
      encoding: "hex",
      length: 64,
      case: "lowercase"
    });
  });

  test("covers artifact, prompt, and repository file hash checks", () => {
    expect(contract.verifications.map((verification) => verification.name)).toEqual([
      "verify_sandbox_artifact_hash",
      "verify_prompt_hash",
      "verify_dispatch_file_hash"
    ]);
    expect(contract.failure_modes).toEqual(expect.arrayContaining([
      "SANDBOX_ARTIFACT_MISSING",
      "PROMPT_HASH_MISMATCH",
      "HASH_DRIFT_DETECTED"
    ]));
    expect(contract.safe_to_continue).toBe(false);
  });
});
