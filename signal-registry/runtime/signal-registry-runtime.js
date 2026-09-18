const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const { validateCreateSignalInput, validatePatternAssignments, validateRawTextNotModified } = require("../validation/validate_signal");
const { validateStatusTransition } = require("../validation/validate_status_transition");

const DEFAULT_DB_PATH = path.join(__dirname, "..", "data", "signals.db");
const DEFAULT_EXPORT_DIR = path.join(__dirname, "..", "data", "exports");

class SignalRegistryRuntime {
  constructor(options = {}) {
    this.dbPath = options.dbPath || DEFAULT_DB_PATH;
    this.exportDir = options.exportDir || DEFAULT_EXPORT_DIR;
    this.db = null;
  }

  async initialize() {
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    fs.mkdirSync(this.exportDir, { recursive: true });

    this.db = await openDatabase(this.dbPath);
    await run(this.db, `CREATE TABLE IF NOT EXISTS signals (
      signal_id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      decision_pattern_ids TEXT NOT NULL,
      status TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      cluster_candidate TEXT NULL,
      buyer_candidate TEXT NULL,
      revenue_path_candidate TEXT NULL
    )`);
  }

  async create_signal(input) {
    this.ensureInitialized();

    const validation = validateCreateSignalInput(input);
    if (!validation.valid) throw validationError(validation);

    const signal = {
      signal_id: crypto.randomUUID(),
      source: input.source,
      raw_text: input.raw_text,
      decision_pattern_ids: JSON.stringify(["UNKNOWN"]),
      status: "COLLECTED",
      timestamp: input.timestamp || new Date().toISOString(),
      cluster_candidate: input.cluster_candidate || null,
      buyer_candidate: input.buyer_candidate || null,
      revenue_path_candidate: input.revenue_path_candidate || null
    };

    await run(
      this.db,
      `INSERT INTO signals (
        signal_id, source, raw_text, decision_pattern_ids, status, timestamp,
        cluster_candidate, buyer_candidate, revenue_path_candidate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        signal.signal_id,
        signal.source,
        signal.raw_text,
        signal.decision_pattern_ids,
        signal.status,
        signal.timestamp,
        signal.cluster_candidate,
        signal.buyer_candidate,
        signal.revenue_path_candidate
      ]
    );

    return parseSignal(signal);
  }

  async assign_pattern(input) {
    this.ensureInitialized();

    const immutable = validateRawTextNotModified(input);
    if (!immutable.valid) throw validationError(immutable);

    const validation = validatePatternAssignments(input);
    if (!validation.valid) throw validationError(validation);

    const existing = await this.get_signal(input.signal_id);
    if (!existing) throw new Error("SIGNAL_NOT_FOUND");

    await run(
      this.db,
      "UPDATE signals SET decision_pattern_ids = ?, status = ? WHERE signal_id = ?",
      [JSON.stringify(input.decision_pattern_ids), "TAGGED", input.signal_id]
    );

    return this.get_signal(input.signal_id);
  }

  async update_status(input) {
    this.ensureInitialized();

    const immutable = validateRawTextNotModified(input);
    if (!immutable.valid) throw validationError(immutable);

    if (!input || typeof input !== "object" || typeof input.signal_id !== "string") {
      throw new Error("INVALID_INPUT");
    }

    const existing = await this.get_signal(input.signal_id);
    if (!existing) throw new Error("SIGNAL_NOT_FOUND");

    const validation = validateStatusTransition(existing.status, input.new_status);
    if (!validation.valid) throw validationError(validation);

    await run(this.db, "UPDATE signals SET status = ? WHERE signal_id = ?", [
      input.new_status,
      input.signal_id
    ]);

    return this.get_signal(input.signal_id);
  }

  async get_signal(signalId) {
    this.ensureInitialized();

    const row = await get(this.db, "SELECT * FROM signals WHERE signal_id = ?", [signalId]);
    return row ? parseSignal(row) : null;
  }

  async list_signals() {
    this.ensureInitialized();

    const rows = await all(this.db, "SELECT * FROM signals ORDER BY timestamp ASC, signal_id ASC");
    return rows.map(parseSignal);
  }

  async export_csv(outputPath = null) {
    this.ensureInitialized();

    const rows = await all(this.db, "SELECT * FROM signals ORDER BY timestamp ASC, signal_id ASC");
    const fields = [
      "signal_id",
      "source",
      "raw_text",
      "decision_pattern_ids",
      "status",
      "timestamp",
      "cluster_candidate",
      "buyer_candidate",
      "revenue_path_candidate"
    ];

    const csv = [
      fields.join(","),
      ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))
    ].join("\n");

    const exportPath = outputPath || path.join(this.exportDir, `signals_${Date.now()}.csv`);
    fs.mkdirSync(path.dirname(exportPath), { recursive: true });
    fs.writeFileSync(exportPath, csv, "utf8");

    return { export_path: exportPath, row_count: rows.length, csv };
  }

  async close() {
    if (!this.db) return;
    const db = this.db;
    this.db = null;

    await new Promise((resolve, reject) => {
      db.close((err) => (err ? reject(err) : resolve()));
    });
  }

  ensureInitialized() {
    if (!this.db) throw new Error("SQLITE_PERSISTENCE_UNAVAILABLE");
  }
}

function openDatabase(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(new Error(`SQLITE_PERSISTENCE_UNAVAILABLE: ${err.message}`));
      else resolve(db);
    });
  });
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function parseSignal(row) {
  return {
    ...row,
    decision_pattern_ids: JSON.parse(row.decision_pattern_ids)
  };
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function validationError(validation) {
  const error = new Error(validation.reason);
  error.validation = validation;
  return error;
}

module.exports = {
  SignalRegistryRuntime,
  DEFAULT_DB_PATH,
  DEFAULT_EXPORT_DIR
};
