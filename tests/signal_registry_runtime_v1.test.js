const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  SignalRegistryRuntime,
  create_signal,
  assign_pattern,
  update_status,
  export_csv
} = require("../signal-registry/runtime");

describe("signal registry runtime v1", () => {
  let tempDir;
  let dbPath;
  let exportDir;
  let runtime;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "signal-registry-"));
    dbPath = path.join(tempDir, "signals.db");
    exportDir = path.join(tempDir, "exports");
    runtime = new SignalRegistryRuntime({ dbPath, exportDir });
    await runtime.initialize();
  });

  afterEach(async () => {
    if (runtime) {
      await runtime.close();
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("AT-1 creates a collected signal with generated id and timestamp", async () => {
    const signal = await create_signal(runtime, {
      source: "manual_note",
      raw_text: "Buyer asked whether this can replace spreadsheet triage."
    });

    expect(signal.signal_id).toBeDefined();
    expect(signal.source).toBe("manual_note");
    expect(signal.raw_text).toBe("Buyer asked whether this can replace spreadsheet triage.");
    expect(signal.decision_pattern_ids).toEqual(["UNKNOWN"]);
    expect(signal.status).toBe("COLLECTED");
    expect(Date.parse(signal.timestamp)).not.toBeNaN();
  });

  test("AT-2 assigns multiple existing patterns as a JSON array", async () => {
    const signal = await create_signal(runtime, {
      source: "interview",
      raw_text: "The buyer described urgent manual work and a clear payment path."
    });

    const updated = await assign_pattern(runtime, {
      signal_id: signal.signal_id,
      decision_pattern_ids: ["BUYER_INTENT_SIGNAL", "REVENUE_PATH_SIGNAL"]
    });

    expect(updated.decision_pattern_ids).toEqual([
      "BUYER_INTENT_SIGNAL",
      "REVENUE_PATH_SIGNAL"
    ]);
    expect(updated.status).toBe("TAGGED");

    const stored = await runtime.get_signal(signal.signal_id);
    expect(stored.decision_pattern_ids).toEqual([
      "BUYER_INTENT_SIGNAL",
      "REVENUE_PATH_SIGNAL"
    ]);
  });

  test("AT-3 accepts UNKNOWN as a pattern assignment", async () => {
    const signal = await create_signal(runtime, {
      source: "raw_chat",
      raw_text: "Ambiguous signal that should stay reviewable."
    });

    const updated = await assign_pattern(runtime, {
      signal_id: signal.signal_id,
      decision_pattern_ids: ["UNKNOWN"]
    });

    expect(updated.decision_pattern_ids).toEqual(["UNKNOWN"]);
  });

  test("AT-4 stores a valid lifecycle status transition", async () => {
    const signal = await create_signal(runtime, {
      source: "operator_review",
      raw_text: "This looks like a cluster candidate after manual review."
    });

    await assign_pattern(runtime, {
      signal_id: signal.signal_id,
      decision_pattern_ids: ["CLUSTER_CANDIDATE_SIGNAL"]
    });

    const updated = await update_status(runtime, {
      signal_id: signal.signal_id,
      new_status: "CLUSTER_CANDIDATE"
    });

    expect(updated.status).toBe("CLUSTER_CANDIDATE");
  });

  test("AT-5 rejects invalid lifecycle status values", async () => {
    const signal = await create_signal(runtime, {
      source: "operator_review",
      raw_text: "Invalid lifecycle expansion must fail closed."
    });

    await expect(update_status(runtime, {
      signal_id: signal.signal_id,
      new_status: "SCORED"
    })).rejects.toThrow("INVALID_STATUS");
  });

  test("AT-6 rejects raw_text modification attempts after creation", async () => {
    const signal = await create_signal(runtime, {
      source: "manual_note",
      raw_text: "Original replay text must remain intact."
    });

    await expect(assign_pattern(runtime, {
      signal_id: signal.signal_id,
      raw_text: "rewritten text",
      decision_pattern_ids: ["BUYER_INTENT_SIGNAL"]
    })).rejects.toThrow("RAW_TEXT_IMMUTABLE");

    const stored = await runtime.get_signal(signal.signal_id);
    expect(stored.raw_text).toBe("Original replay text must remain intact.");
  });

  test("AT-7 persists signals across runtime restart", async () => {
    const signal = await create_signal(runtime, {
      source: "field_note",
      raw_text: "Persistence check."
    });

    await runtime.close();
    runtime = new SignalRegistryRuntime({ dbPath, exportDir });
    await runtime.initialize();

    const restored = await runtime.get_signal(signal.signal_id);
    expect(restored).not.toBeNull();
    expect(restored.raw_text).toBe("Persistence check.");
    expect(restored.status).toBe("COLLECTED");
  });

  test("AT-8 exports all stored fields to CSV without changing stored raw_text", async () => {
    const rawText = "Buyer said, \"send me the price\"\nand asked for timing.";
    const signal = await create_signal(runtime, {
      source: "manual_review",
      raw_text: rawText
    });

    const result = await export_csv(runtime);

    expect(result.row_count).toBe(1);
    expect(fs.existsSync(result.export_path)).toBe(true);
    expect(result.csv.split("\n")[0]).toBe(
      "signal_id,source,raw_text,decision_pattern_ids,status,timestamp,cluster_candidate,buyer_candidate,revenue_path_candidate"
    );
    expect(result.csv).toContain(`"${rawText.replace(/"/g, '""')}"`);

    const stored = await runtime.get_signal(signal.signal_id);
    expect(stored.raw_text).toBe(rawText);
  });

  test("manual review workflow can view, assign patterns, and update lifecycle status", async () => {
    const signal = await create_signal(runtime, {
      source: "human_review_queue",
      raw_text: "Manual reviewer should keep control over classification."
    });

    const viewed = await runtime.get_signal(signal.signal_id);
    expect(viewed.raw_text).toBe("Manual reviewer should keep control over classification.");

    await assign_pattern(runtime, {
      signal_id: signal.signal_id,
      decision_pattern_ids: ["MARKET_PAIN_SIGNAL", "BUYER_INTENT_SIGNAL"]
    });

    const reviewed = await update_status(runtime, {
      signal_id: signal.signal_id,
      new_status: "CLUSTER_CANDIDATE"
    });

    expect(reviewed.status).toBe("CLUSTER_CANDIDATE");
    expect(reviewed.decision_pattern_ids).toEqual([
      "MARKET_PAIN_SIGNAL",
      "BUYER_INTENT_SIGNAL"
    ]);
  });

  test("runtime rejects singular decision_pattern_id and unknown pattern identifiers", async () => {
    const signal = await create_signal(runtime, {
      source: "manual_note",
      raw_text: "Pattern validation must enforce the frozen V0 library."
    });

    await expect(assign_pattern(runtime, {
      signal_id: signal.signal_id,
      decision_pattern_id: "BUYER_INTENT_SIGNAL",
      decision_pattern_ids: ["BUYER_INTENT_SIGNAL"]
    })).rejects.toThrow("FORBIDDEN_FIELD");

    await expect(assign_pattern(runtime, {
      signal_id: signal.signal_id,
      decision_pattern_ids: ["NEWLY_CREATED_PATTERN"]
    })).rejects.toThrow("UNKNOWN_PATTERN_IDENTIFIER");
  });
});
