const fs = require("fs");
const path = require("path");
const os = require("os");
const { SignalRegistryRuntime } = require("../signal-registry/runtime");
const {
  acquire_reddit_signal,
  store_signal
} = require("../signal-acquisition/runtime");

describe("signal acquisition runtime v1", () => {
  let tempDir;
  let runtime;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "signal-acquisition-"));
    runtime = new SignalRegistryRuntime({
      dbPath: path.join(tempDir, "signals.db"),
      exportDir: path.join(tempDir, "exports")
    });
    await runtime.initialize();
  });

  afterEach(async () => {
    if (runtime) {
      await runtime.close();
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("AT-1 acquires a raw Reddit signal", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          children: [
            {
              data: {
                body: "I am tired of copying lead notes between tabs.",
                created_utc: 1770000000
              }
            }
          ]
        }
      })
    });

    const acquired = await acquire_reddit_signal({
      source: "Reddit",
      body: "I am tired of copying lead notes between tabs.",
      created_utc: 1770000000,
      permalink: "https://www.reddit.com/r/example/comments/abc/example/"
    });

    expect(acquired).toEqual({
      source: "Reddit",
      raw_text: "I am tired of copying lead notes between tabs.",
      timestamp: "2026-02-02T02:40:00.000Z",
      source_url: "https://www.reddit.com/r/example/comments/abc/example/"
    });

    const fetched = await acquire_reddit_signal("https://www.reddit.com/r/example/comments/abc/example/");
    expect(fetched).toEqual({
      source: "Reddit",
      raw_text: "I am tired of copying lead notes between tabs.",
      timestamp: "2026-02-02T02:40:00.000Z",
      source_url: "https://www.reddit.com/r/example/comments/abc/example/"
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://www.reddit.com/r/example/comments/abc/example.json",
      { headers: { "User-Agent": "plenra-signal-acquisition-v1" } }
    );

    global.fetch = originalFetch;
  });

  test("AT-2 stores an acquired signal in the existing registry", async () => {
    const acquired = await acquire_reddit_signal({
      source: "Reddit",
      raw_text: "Can someone recommend a way to stop manually qualifying every request?",
      timestamp: "2026-06-05T10:00:00.000Z"
    });

    const stored = await store_signal(runtime, acquired);

    expect(stored.signal_id).toBeDefined();
    expect(stored.source).toBe("Reddit");
    expect(stored.raw_text).toBe("Can someone recommend a way to stop manually qualifying every request?");
    expect(stored.timestamp).toBe("2026-06-05T10:00:00.000Z");

    const retrieved = await runtime.get_signal(stored.signal_id);
    expect(retrieved.raw_text).toBe(stored.raw_text);
  });

  test("AT-3 assigns UNKNOWN by default and does not accept pattern assignment input", async () => {
    const stored = await store_signal(runtime, {
      source: "Reddit",
      raw_text: "Raw evidence only.",
      timestamp: "2026-06-05T11:00:00.000Z"
    });

    expect(stored.decision_pattern_ids).toEqual(["UNKNOWN"]);

    await expect(store_signal(runtime, {
      source: "Reddit",
      raw_text: "Do not assign during acquisition.",
      timestamp: "2026-06-05T11:01:00.000Z",
      decision_pattern_ids: ["BUYER_INTENT_SIGNAL"]
    })).rejects.toThrow("FORBIDDEN_ACQUISITION_FIELD");
  });

  test("AT-4 stores status as COLLECTED without lifecycle advancement", async () => {
    const stored = await store_signal(runtime, {
      source: "Reddit",
      raw_text: "Keep lifecycle at collection.",
      timestamp: "2026-06-05T12:00:00.000Z"
    });

    expect(stored.status).toBe("COLLECTED");

    await expect(store_signal(runtime, {
      source: "Reddit",
      raw_text: "Status injection should be rejected.",
      timestamp: "2026-06-05T12:01:00.000Z",
      status: "TAGGED"
    })).rejects.toThrow("FORBIDDEN_ACQUISITION_FIELD");
  });

  test("AT-5 rejects classification attempts", async () => {
    await expect(acquire_reddit_signal({
      source: "Reddit",
      raw_text: "Raw text with prohibited interpretation attached.",
      classification: "buyer_intent"
    })).rejects.toThrow("FORBIDDEN_ACQUISITION_FIELD");
  });

  test("AT-6 rejects scoring attempts", async () => {
    await expect(acquire_reddit_signal({
      source: "Reddit",
      raw_text: "Raw text with prohibited score attached.",
      score: 0.91
    })).rejects.toThrow("FORBIDDEN_ACQUISITION_FIELD");
  });

  test("AT-7 rejects cluster creation attempts", async () => {
    await expect(acquire_reddit_signal({
      source: "Reddit",
      raw_text: "Raw text with prohibited cluster attached.",
      cluster: "manual_workaround"
    })).rejects.toThrow("FORBIDDEN_ACQUISITION_FIELD");
  });

  test("AT-8 preserves raw_text immutability after storage", async () => {
    const stored = await store_signal(runtime, {
      source: "Reddit",
      raw_text: "Original Reddit evidence must remain replayable.",
      timestamp: "2026-06-05T13:00:00.000Z"
    });

    await expect(runtime.assign_pattern({
      signal_id: stored.signal_id,
      raw_text: "Changed evidence",
      decision_pattern_ids: ["UNKNOWN"]
    })).rejects.toThrow("RAW_TEXT_IMMUTABLE");

    const retrieved = await runtime.get_signal(stored.signal_id);
    expect(retrieved.raw_text).toBe("Original Reddit evidence must remain replayable.");
  });

  test("rejects every non-Reddit source", async () => {
    await expect(acquire_reddit_signal({
      source: "Forum",
      raw_text: "Wrong source."
    })).rejects.toThrow("UNAPPROVED_SOURCE");
  });
});
