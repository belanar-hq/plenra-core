const { main } = require("../signal-acquisition/runtime/acquire_and_store_first_reddit_signal");
const { SignalRegistryRuntime } = require("../signal-registry/runtime");

jest.mock("../signal-acquisition/runtime", () => ({
  acquire_reddit_signal: jest.fn(),
  store_signal: jest.fn()
}));

jest.mock("../signal-registry/runtime", () => ({
  SignalRegistryRuntime: jest.fn()
}));

const { acquire_reddit_signal, store_signal } = require("../signal-acquisition/runtime");

describe("first signal operator entrypoint v1", () => {
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
    acquire_reddit_signal.mockResolvedValue({
      source: "Reddit",
      raw_text: "raw",
      timestamp: "2026-06-05T10:00:00.000Z"
    });
    store_signal.mockResolvedValue({
      signal_id: "signal_123",
      status: "COLLECTED"
    });
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    jest.clearAllMocks();
    process.exitCode = undefined;
  });

  test("accepts one Reddit URL, stores the first signal, prints confirmation, and closes runtime", async () => {
    await main(["node", "entrypoint", "https://www.reddit.com/r/example/comments/abc/example/"]);

    expect(SignalRegistryRuntime).toHaveBeenCalledTimes(1);
    expect(runtime.initialize).toHaveBeenCalledTimes(1);
    expect(acquire_reddit_signal).toHaveBeenCalledWith("https://www.reddit.com/r/example/comments/abc/example/");
    expect(store_signal).toHaveBeenCalledWith(runtime, {
      source: "Reddit",
      raw_text: "raw",
      timestamp: "2026-06-05T10:00:00.000Z"
    });
    expect(logs).toEqual([
      "signal_id=signal_123",
      "status=COLLECTED",
      "storage=confirmed"
    ]);
    expect(runtime.close).toHaveBeenCalledTimes(1);
  });

  test("requires a Reddit URL argument", async () => {
    await main(["node", "entrypoint"]);

    expect(errors).toEqual([
      "Usage: node signal-acquisition/runtime/acquire_and_store_first_reddit_signal.js <reddit_url>"
    ]);
    expect(process.exitCode).toBe(1);
    expect(SignalRegistryRuntime).not.toHaveBeenCalled();
  });
});
