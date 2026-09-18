/**
 * SQLite Storage Adapter for Mosquito Persistent Layer
 * Provides durable current-state persistence for all mosquito entities
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class SQLiteStorageAdapter {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(__dirname, 'mosquito_storage.db');
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize database connection and create tables
   * @returns {Promise<void>}
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to open database: ${err.message}`));
        } else {
          this.db.serialize(() => {
            this._createTables((error) => {
              if (error) {
                reject(error);
              } else {
                this.isInitialized = true;
                resolve();
              }
            });
          });
        }
      });
    });
  }

  /**
   * Create all required tables
   * @private
   */
  _createTables(callback) {
    const tables = [
      // Bookings table
      `CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        booking_status TEXT NOT NULL,
        installation_date TEXT NOT NULL,
        installer_name TEXT,
        trap_count INTEGER,
        contact_name TEXT,
        address TEXT,
        confirmation_method TEXT,
        reminder_sent_at TEXT,
        notes TEXT,
        lineage TEXT NOT NULL,
        reason_codes TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(case_id)
      )`,

      // Slot locks table
      `CREATE TABLE IF NOT EXISTS slot_locks (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        slot_id TEXT NOT NULL,
        booking_id TEXT NOT NULL,
        lock_status TEXT NOT NULL,
        locked_at TEXT,
        unlocked_at TEXT,
        release_reason TEXT,
        lineage TEXT NOT NULL,
        reason_codes TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(case_id, slot_id)
      )`,

      // Payments table
      `CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        booking_id TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        payment_proof_hash TEXT,
        proof_upload_time TEXT,
        payment_confirmed_at TEXT,
        payment_failed_reason TEXT,
        retry_count INTEGER DEFAULT 0,
        lineage TEXT NOT NULL,
        reason_codes TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(case_id)
      )`,

      // Invoice and receipt lineage table
      `CREATE TABLE IF NOT EXISTS invoice_receipts (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        booking_id TEXT NOT NULL,
        payment_id TEXT NOT NULL,
        invoice_id TEXT NOT NULL,
        receipt_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        status TEXT NOT NULL,
        invoice_url TEXT,
        receipt_url TEXT,
        vat_amount REAL,
        provider_reference_id TEXT,
        reconciliation_status TEXT,
        lineage TEXT NOT NULL,
        reason_codes TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(case_id, invoice_id)
      )`,

      // Field status table
      `CREATE TABLE IF NOT EXISTS field_status (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        field_name TEXT NOT NULL,
        field_lifecycle_stage TEXT NOT NULL,
        current_value TEXT NOT NULL,
        previous_value TEXT,
        transition_reason TEXT,
        validated_at TEXT,
        lineage TEXT NOT NULL,
        reason_codes TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(case_id, field_name)
      )`,

      // Contractor schedules table
      `CREATE TABLE IF NOT EXISTS contractor_schedules (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        contractor_id TEXT NOT NULL,
        contractor_name TEXT NOT NULL,
        assigned_date TEXT NOT NULL,
        scheduled_time_window TEXT NOT NULL,
        schedule_status TEXT NOT NULL,
        geo_territory TEXT,
        estimated_duration TEXT,
        completion_time TEXT,
        lineage TEXT NOT NULL,
        reason_codes TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(case_id, contractor_id)
      )`,

      // Customer reminders table
      `CREATE TABLE IF NOT EXISTS customer_reminders (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        booking_id TEXT NOT NULL,
        reminder_type TEXT NOT NULL,
        reminder_status TEXT NOT NULL,
        scheduled_send_time TEXT NOT NULL,
        sent_at TEXT,
        delivery_status TEXT,
        customer_response TEXT,
        channel TEXT,
        lineage TEXT NOT NULL,
        reason_codes TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Idempotency keys table
      `CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        operation_type TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        result TEXT NOT NULL,
        expires_at TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      )`
    ];

    let completed = 0;
    let error = null;

    tables.forEach((sql) => {
      this.db.run(sql, (err) => {
        if (err && !error) {
          error = new Error(`Failed to create table: ${err.message}`);
        }
        completed++;
        if (completed === tables.length) {
          callback(error);
        }
      });
    });
  }

  /**
   * Save a booking record
   * @param {object} record - Booking record
   * @returns {Promise<object>} Result with status
   */
  async saveBooking(record) {
    const {
      id,
      case_id,
      customer_phone,
      booking_status,
      installation_date,
      installer_name,
      trap_count,
      contact_name,
      address,
      confirmation_method,
      reminder_sent_at,
      notes,
      lineage,
      reason_codes,
      created_at,
      updated_at
    } = record;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO bookings (
          id, case_id, customer_phone, booking_status, installation_date,
          installer_name, trap_count, contact_name, address, confirmation_method,
          reminder_sent_at, notes, lineage, reason_codes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          id,
          case_id,
          customer_phone,
          booking_status,
          installation_date,
          installer_name,
          trap_count,
          contact_name,
          address,
          confirmation_method,
          reminder_sent_at,
          notes,
          lineage,
          JSON.stringify(reason_codes),
          created_at,
          updated_at
        ],
        (err) => {
          if (err) {
            reject(new Error(`Failed to save booking: ${err.message}`));
          } else {
            resolve({ status: 'saved', id, case_id });
          }
        }
      );
    });
  }

  /**
   * Get a booking record by ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise<object|null>} Booking record or null
   */
  async getBooking(bookingId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM bookings WHERE id = ?',
        [bookingId],
        (err, row) => {
          if (err) {
            reject(new Error(`Failed to get booking: ${err.message}`));
          } else if (row) {
            row.reason_codes = JSON.parse(row.reason_codes);
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Get a booking by case ID
   * @param {string} caseId - Case ID
   * @returns {Promise<object|null>}
   */
  async getBookingByCaseId(caseId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM bookings WHERE case_id = ?',
        [caseId],
        (err, row) => {
          if (err) {
            reject(new Error(`Failed to get booking by case_id: ${err.message}`));
          } else if (row) {
            row.reason_codes = JSON.parse(row.reason_codes);
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Save a slot lock record
   * @param {object} record - Slot lock record
   * @returns {Promise<object>}
   */
  async saveSlotLock(record) {
    const {
      id,
      case_id,
      slot_id,
      booking_id,
      lock_status,
      locked_at,
      unlocked_at,
      release_reason,
      lineage,
      reason_codes,
      created_at,
      updated_at
    } = record;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO slot_locks (
          id, case_id, slot_id, booking_id, lock_status, locked_at,
          unlocked_at, release_reason, lineage, reason_codes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          id,
          case_id,
          slot_id,
          booking_id,
          lock_status,
          locked_at,
          unlocked_at,
          release_reason,
          lineage,
          JSON.stringify(reason_codes),
          created_at,
          updated_at
        ],
        (err) => {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              reject(new Error('DUPLICATE_SLOT_LOCK'));
            } else {
              reject(new Error(`Failed to save slot lock: ${err.message}`));
            }
          } else {
            resolve({ status: 'saved', id, case_id });
          }
        }
      );
    });
  }

  /**
   * Get a slot lock record
   * @param {string} slotId - Slot ID
   * @returns {Promise<object|null>}
   */
  async getSlotLock(slotId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM slot_locks WHERE slot_id = ?',
        [slotId],
        (err, row) => {
          if (err) {
            reject(new Error(`Failed to get slot lock: ${err.message}`));
          } else if (row) {
            row.reason_codes = JSON.parse(row.reason_codes);
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Save a payment state record
   * @param {object} record - Payment state record
   * @returns {Promise<object>}
   */
  async savePaymentState(record) {
    const {
      id,
      case_id,
      booking_id,
      payment_status,
      amount,
      currency,
      payment_method,
      payment_proof_hash,
      proof_upload_time,
      payment_confirmed_at,
      payment_failed_reason,
      retry_count,
      lineage,
      reason_codes,
      created_at,
      updated_at
    } = record;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO payments (
          id, case_id, booking_id, payment_status, amount, currency,
          payment_method, payment_proof_hash, proof_upload_time, payment_confirmed_at,
          payment_failed_reason, retry_count, lineage, reason_codes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          id,
          case_id,
          booking_id,
          payment_status,
          amount,
          currency,
          payment_method,
          payment_proof_hash,
          proof_upload_time,
          payment_confirmed_at,
          payment_failed_reason,
          retry_count,
          lineage,
          JSON.stringify(reason_codes),
          created_at,
          updated_at
        ],
        (err) => {
          if (err) {
            reject(new Error(`Failed to save payment state: ${err.message}`));
          } else {
            resolve({ status: 'saved', id, case_id });
          }
        }
      );
    });
  }

  /**
   * Get a payment state record
   * @param {string} paymentId - Payment ID
   * @returns {Promise<object|null>}
   */
  async getPaymentState(paymentId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM payments WHERE id = ?',
        [paymentId],
        (err, row) => {
          if (err) {
            reject(new Error(`Failed to get payment state: ${err.message}`));
          } else if (row) {
            row.reason_codes = JSON.parse(row.reason_codes);
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Get payment by case ID
   * @param {string} caseId - Case ID
   * @returns {Promise<object|null>}
   */
  async getPaymentStateByCaseId(caseId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM payments WHERE case_id = ?',
        [caseId],
        (err, row) => {
          if (err) {
            reject(new Error(`Failed to get payment by case_id: ${err.message}`));
          } else if (row) {
            row.reason_codes = JSON.parse(row.reason_codes);
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Save invoice/receipt lineage record
   * @param {object} record - Invoice/receipt record
   * @returns {Promise<object>}
   */
  async saveInvoiceReceiptLineage(record) {
    const {
      id,
      case_id,
      booking_id,
      payment_id,
      invoice_id,
      receipt_id,
      provider,
      status,
      invoice_url,
      receipt_url,
      vat_amount,
      provider_reference_id,
      reconciliation_status,
      lineage,
      reason_codes,
      created_at,
      updated_at
    } = record;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO invoice_receipts (
          id, case_id, booking_id, payment_id, invoice_id, receipt_id,
          provider, status, invoice_url, receipt_url, vat_amount,
          provider_reference_id, reconciliation_status, lineage, reason_codes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          id,
          case_id,
          booking_id,
          payment_id,
          invoice_id,
          receipt_id,
          provider,
          status,
          invoice_url,
          receipt_url,
          vat_amount,
          provider_reference_id,
          reconciliation_status,
          lineage,
          JSON.stringify(reason_codes),
          created_at,
          updated_at
        ],
        (err) => {
          if (err) {
            reject(new Error(`Failed to save invoice/receipt: ${err.message}`));
          } else {
            resolve({ status: 'saved', id, case_id });
          }
        }
      );
    });
  }

  /**
   * Save field status record
   * @param {object} record - Field status record
   * @returns {Promise<object>}
   */
  async saveFieldStatus(record) {
    const {
      id,
      case_id,
      field_name,
      field_lifecycle_stage,
      current_value,
      previous_value,
      transition_reason,
      validated_at,
      lineage,
      reason_codes,
      created_at,
      updated_at
    } = record;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO field_status (
          id, case_id, field_name, field_lifecycle_stage, current_value,
          previous_value, transition_reason, validated_at, lineage, reason_codes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          id,
          case_id,
          field_name,
          field_lifecycle_stage,
          current_value,
          previous_value,
          transition_reason,
          validated_at,
          lineage,
          JSON.stringify(reason_codes),
          created_at,
          updated_at
        ],
        (err) => {
          if (err) {
            reject(new Error(`Failed to save field status: ${err.message}`));
          } else {
            resolve({ status: 'saved', id, case_id });
          }
        }
      );
    });
  }

  /**
   * Save contractor schedule record
   * @param {object} record - Contractor schedule record
   * @returns {Promise<object>}
   */
  async saveContractorSchedule(record) {
    const {
      id,
      case_id,
      contractor_id,
      contractor_name,
      assigned_date,
      scheduled_time_window,
      schedule_status,
      geo_territory,
      estimated_duration,
      completion_time,
      lineage,
      reason_codes,
      created_at,
      updated_at
    } = record;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO contractor_schedules (
          id, case_id, contractor_id, contractor_name, assigned_date,
          scheduled_time_window, schedule_status, geo_territory, estimated_duration,
          completion_time, lineage, reason_codes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          id,
          case_id,
          contractor_id,
          contractor_name,
          assigned_date,
          scheduled_time_window,
          schedule_status,
          geo_territory,
          estimated_duration,
          completion_time,
          lineage,
          JSON.stringify(reason_codes),
          created_at,
          updated_at
        ],
        (err) => {
          if (err) {
            reject(new Error(`Failed to save contractor schedule: ${err.message}`));
          } else {
            resolve({ status: 'saved', id, case_id });
          }
        }
      );
    });
  }

  /**
   * Save customer reminder record
   * @param {object} record - Customer reminder record
   * @returns {Promise<object>}
   */
  async saveCustomerReminder(record) {
    const {
      id,
      case_id,
      booking_id,
      reminder_type,
      reminder_status,
      scheduled_send_time,
      sent_at,
      delivery_status,
      customer_response,
      channel,
      lineage,
      reason_codes,
      created_at,
      updated_at
    } = record;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO customer_reminders (
          id, case_id, booking_id, reminder_type, reminder_status,
          scheduled_send_time, sent_at, delivery_status, customer_response,
          channel, lineage, reason_codes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          id,
          case_id,
          booking_id,
          reminder_type,
          reminder_status,
          scheduled_send_time,
          sent_at,
          delivery_status,
          customer_response,
          channel,
          lineage,
          JSON.stringify(reason_codes),
          created_at,
          updated_at
        ],
        (err) => {
          if (err) {
            reject(new Error(`Failed to save customer reminder: ${err.message}`));
          } else {
            resolve({ status: 'saved', id, case_id });
          }
        }
      );
    });
  }

  /**
   * Save idempotency key
   * @param {object} record - Idempotency record
   * @returns {Promise<object>}
   */
  async saveIdempotencyKey(record) {
    const {
      key,
      case_id,
      operation_type,
      payload_hash,
      result,
      expires_at,
      retry_count,
      created_at
    } = record;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO idempotency_keys (
          key, case_id, operation_type, payload_hash, result,
          expires_at, retry_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          key,
          case_id,
          operation_type,
          payload_hash,
          JSON.stringify(result),
          expires_at,
          retry_count,
          created_at
        ],
        (err) => {
          if (err) {
            reject(new Error(`Failed to save idempotency key: ${err.message}`));
          } else {
            resolve({ status: 'saved', key });
          }
        }
      );
    });
  }

  /**
   * Get idempotency key
   * @param {string} key - Idempotency key
   * @returns {Promise<object|null>}
   */
  async getIdempotencyKey(key) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM idempotency_keys WHERE key = ?',
        [key],
        (err, row) => {
          if (err) {
            reject(new Error(`Failed to get idempotency key: ${err.message}`));
          } else if (row) {
            row.result = JSON.parse(row.result);
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = SQLiteStorageAdapter;
