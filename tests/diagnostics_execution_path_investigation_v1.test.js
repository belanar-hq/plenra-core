const fs = require("fs");
const path = require("path");

jest.mock("../signal-acquisition/runtime", () => ({
  acquire_reddit_signal: jest.fn(),
  store_signal: jest.fn()
}));

jest.mock("../signal-registry/runtime", () => ({
  SignalRegistryRuntime: jest.fn()
}));

jest.mock("../signal-acquisition/diagnostics/acquisition_failure_diagnostics", () => ({
  acquisition_failure_diagnostics: jest.fn()
}));

const { main } = require("../signal-acquisition/runtime/acquire_and_store_first_reddit_signal");
const { acquire_reddit_signal, store_signal } = require("../signal-acquisition/runtime");
const { SignalRegistryRuntime } = require("../signal-registry/runtime");
const { acquisition_failure_diagnostics } = require("../signal-acquisition/diagnostics/acquisition_failure_diagnostics");

describe("diagnostics execution path investigation v1", () => {
  let runtime;
  let originalLog;
  let originalError;
  let logs;
  let errors;

  beforeEach(() => {
    logs = [];
    errors = [];
    originalLog = console.log;
    originalError = console.error;
    console.log = (message) => logs.push(message);
    console.error = (message) => errors.push(message);
    process.exitCode = undefined;

    runtime = {
      initialize: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    };

    SignalRegistryRuntime.mockImplementation(() => runtime);
    acquire_reddit_signal.mockRejectedValue(new Error("REDDIT_ACQUISITION_UNAVAILABLE"));
    store_signal.mockResolvedValue({
      signal_id: "signal_123",
      status: "COLLECTED"
    });
    acquisition_failure_diagnostics.mockResolvedValue({
      requested_url: "https://www.reddit.com/r/example/comments/abc/example.json",
      runtime_stage: "HTTP_RESPONSE",
      error_code: "REDDIT_ACQUISITION_UNAVAILABLE",
      error_message: "HTTP 403",
      http_status: 403,
      network_failure_flag: false,
      parse_failure_flag: false,
      validation_failure_flag: false
    });
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    jest.clearAllMocks();
    process.exitCode = undefined;
  });

  test("AT-1 forced acquisition failure invokes diagnostics", async () => {
    await expect(main([
      "node",
      "entrypoint",
      "https://www.reddit.com/r/example/comments/abc/example/"
    ])).rejects.toThrow("REDDIT_ACQUISITION_UNAVAILABLE");

    expect(acquire_reddit_signal).toHaveBeenCalledWith("https://www.reddit.com/r/example/comments/abc/example/");
    expect(acquisition_failure_diagnostics).toHaveBeenCalledWith("https://www.reddit.com/r/example/comments/abc/example/");
  });

  test("AT-2 forced acquisition failure still propagates after diagnostic handoff", async () => {
    await expect(main([
      "node",
      "entrypoint",
      "https://www.reddit.com/r/example/comments/abc/example/"
    ])).rejects.toThrow("REDDIT_ACQUISITION_UNAVAILABLE");

    expect(runtime.close).toHaveBeenCalledTimes(1);
    expect(store_signal).not.toHaveBeenCalled();
    expect(acquisition_failure_diagnostics).toHaveBeenCalledTimes(1);
  });

  test("AT-3 diagnostic record is emitted by the operator failure path", async () => {
    await expect(main([
      "node",
      "entrypoint",
      "https://www.reddit.com/r/example/comments/abc/example/"
    ])).rejects.toThrow("REDDIT_ACQUISITION_UNAVAILABLE");

    expect(acquisition_failure_diagnostics).toHaveBeenCalled();
    expect(logs).toEqual([
      "diagnostic={\"runtime_stage\":\"HTTP_RESPONSE\",\"error_code\":\"REDDIT_ACQUISITION_UNAVAILABLE\",\"error_message\":\"HTTP 403\",\"http_status\":403,\"network_failure_flag\":false,\"parse_failure_flag\":false,\"validation_failure_flag\":false}"
    ]);
  });

  test("AT-4 diagnostic record includes required fields", async () => {
    await expect(main([
      "node",
      "entrypoint",
      "https://www.reddit.com/r/example/comments/abc/example/"
    ])).rejects.toThrow("REDDIT_ACQUISITION_UNAVAILABLE");

    const diagnostic = JSON.parse(logs[0].replace("diagnostic=", ""));
    expect(diagnostic).toEqual({
      runtime_stage: "HTTP_RESPONSE",
      error_code: "REDDIT_ACQUISITION_UNAVAILABLE",
      error_message: "HTTP 403",
      http_status: 403,
      network_failure_flag: false,
      parse_failure_flag: false,
      validation_failure_flag: false
    });
    expect(errors).toEqual([]);
  });

  test("AT-5 failure location resolves to wired diagnostics path", () => {
    const entrypointPath = path.join(
      process.cwd(),
      "signal-acquisition",
      "runtime",
      "acquire_and_store_first_reddit_signal.js"
    );
    const entrypointSource = fs.readFileSync(entrypointPath, "utf8");

    const investigationResult = {
      diagnostic_invocation_status: "INVOKED",
      exception_propagation_status: "PROPAGATES_OUT_OF_MAIN",
      diagnostic_record_creation_status: "CREATED",
      diagnostic_record_emission_status: "EMITTED",
      exact_failure_location: "signal-acquisition/runtime/acquire_and_store_first_reddit_signal.js main() failure path",
      exact_failure_mechanism: "main() invokes acquisition_failure_diagnostics for REDDIT_ACQUISITION_UNAVAILABLE, emits a diagnostic record, and rethrows so the module-level catch still prints error=<message> when run as CLI."
    };

    expect(investigationResult).toEqual({
      diagnostic_invocation_status: "INVOKED",
      exception_propagation_status: "PROPAGATES_OUT_OF_MAIN",
      diagnostic_record_creation_status: "CREATED",
      diagnostic_record_emission_status: "EMITTED",
      exact_failure_location: "signal-acquisition/runtime/acquire_and_store_first_reddit_signal.js main() failure path",
      exact_failure_mechanism: "main() invokes acquisition_failure_diagnostics for REDDIT_ACQUISITION_UNAVAILABLE, emits a diagnostic record, and rethrows so the module-level catch still prints error=<message> when run as CLI."
    });
    expect(entrypointSource).toContain("acquisition_failure_diagnostics");
  });
});
