const fs = require("fs");
const path = require("path");
const { acquisition_failure_diagnostics, STAGES } = require("../signal-acquisition/diagnostics/acquisition_failure_diagnostics");

function mockHeaders(contentType) {
  return {
    get: (name) => (name.toLowerCase() === "content-type" ? contentType : null)
  };
}

describe("acquisition failure investigation v1", () => {
  test("AT-1 failure produces diagnostic record", async () => {
    const diagnostic = await acquisition_failure_diagnostics(
      "https://www.reddit.com/r/example/comments/abc/example/",
      {
        fetchImpl: async () => {
          throw new Error("network unavailable");
        }
      }
    );

    expect(diagnostic).toMatchObject({
      requested_url: "https://www.reddit.com/r/example/comments/abc/example.json",
      runtime_stage: STAGES.HTTP_REQUEST,
      error_code: "REDDIT_ACQUISITION_UNAVAILABLE",
      error_message: "network unavailable",
      network_failure_flag: true,
      parse_failure_flag: false,
      validation_failure_flag: false
    });
  });

  test("AT-2 HTTP status is captured when available", async () => {
    const diagnostic = await acquisition_failure_diagnostics(
      "https://www.reddit.com/r/example/comments/abc/example/",
      {
        fetchImpl: async () => ({
          ok: false,
          status: 403,
          headers: mockHeaders("text/html"),
          text: async () => "<html>blocked</html>"
        })
      }
    );

    expect(diagnostic.runtime_stage).toBe(STAGES.HTTP_RESPONSE);
    expect(diagnostic.http_status).toBe(403);
    expect(diagnostic.response_content_type).toBe("text/html");
    expect(diagnostic.response_body_summary).toBe("<html>blocked</html>");
  });

  test("AT-3 requested URL is captured", async () => {
    const diagnostic = await acquisition_failure_diagnostics(
      "https://www.reddit.com/r/example/comments/abc/example/",
      {
        fetchImpl: async () => ({
          ok: false,
          status: 404,
          headers: mockHeaders("application/json"),
          text: async () => "{}"
        })
      }
    );

    expect(diagnostic.requested_url).toBe("https://www.reddit.com/r/example/comments/abc/example.json");
  });

  test("AT-4 failure stage is identified for parse and validation failures", async () => {
    const parseDiagnostic = await acquisition_failure_diagnostics(
      "https://www.reddit.com/r/example/comments/abc/example/",
      {
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          headers: mockHeaders("application/json"),
          text: async () => "not json"
        })
      }
    );

    expect(parseDiagnostic.runtime_stage).toBe(STAGES.RESPONSE_PARSE);
    expect(parseDiagnostic.parse_failure_flag).toBe(true);

    const validationDiagnostic = await acquisition_failure_diagnostics(
      "https://www.reddit.com/r/example/comments/abc/example/",
      {
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          headers: mockHeaders("application/json"),
          text: async () => JSON.stringify({ data: { children: [] } })
        })
      }
    );

    expect(validationDiagnostic.runtime_stage).toBe(STAGES.SIGNAL_VALIDATION);
    expect(validationDiagnostic.validation_failure_flag).toBe(true);
  });

  test("AT-5 no runtime behavior is modified", () => {
    const acquisitionRuntimePath = path.join(
      process.cwd(),
      "signal-acquisition",
      "runtime",
      "acquire_reddit_signal.js"
    );
    const storageRuntimePath = path.join(
      process.cwd(),
      "signal-acquisition",
      "runtime",
      "store_signal.js"
    );

    expect(fs.readFileSync(acquisitionRuntimePath, "utf8")).not.toContain("acquisition_failure_diagnostics");
    expect(fs.readFileSync(storageRuntimePath, "utf8")).not.toContain("acquisition_failure_diagnostics");
  });
});
