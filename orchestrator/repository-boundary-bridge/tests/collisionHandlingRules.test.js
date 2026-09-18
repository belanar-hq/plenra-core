const fs = require("fs");
const path = require("path");

const rules = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "collisionHandlingRules.json"), "utf8"));

describe("collisionHandlingRules", () => {
  test("maps source design collision outcomes exactly", () => {
    expect(rules.source_design_id).toBe("repository_runtime_boundary_bridge_v1");
    expect(rules.target_scope).toBe("dispatches/*.dispatch.json");
    expect(rules.rules).toEqual([
      { condition: "target_missing", result: "ALLOW_IMPORT" },
      { condition: "target_exists_same_hash", result: "ALREADY_IMPORTED" },
      { condition: "target_exists_different_hash", result: "DISPATCH_COLLISION_DETECTED" }
    ]);
  });

  test("treats collision and out of scope writes as terminal", () => {
    expect(rules.terminal_failures).toEqual(expect.arrayContaining([
      "DISPATCH_COLLISION_DETECTED",
      "OUT_OF_SCOPE_REPOSITORY_WRITE",
      "FORBIDDEN_SURFACE_TOUCH_REQUIRED"
    ]));
    expect(rules.safe_to_continue).toBe(false);
  });
});
