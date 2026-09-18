const fs = require("fs");
const path = require("path");

const rules = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "forbiddenSurfaceRules.json"), "utf8"));

describe("forbiddenSurfaceRules", () => {
  test("allows writes only to dispatch artifacts", () => {
    expect(rules.source_design_id).toBe("repository_runtime_boundary_bridge_v1");
    expect(rules.allowed_write_surfaces).toEqual(["dispatches/*.dispatch.json"]);
  });

  test("blocks forbidden repository surfaces and authority expansions", () => {
    expect(rules.forbidden_repository_surfaces).toEqual(expect.arrayContaining([
      "canon/",
      "registry/",
      "apps/mosquito-poc/",
      "services/decision-gate/",
      "runtime implementation files",
      "API files",
      "automation files"
    ]));
    expect(rules.forbidden_authority_expansions).toEqual(expect.arrayContaining([
      "prompt_mutation",
      "scope_expansion",
      "runtime_authority",
      "production_authority",
      "canon_mutation"
    ]));
    expect(rules.safe_to_continue).toBe(false);
  });
});
