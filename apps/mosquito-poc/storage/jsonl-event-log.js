/**
 * JSONL Event Log for Mosquito Persistent Layer
 * Append-only event log for replay and audit trail
 */

const fs = require('fs');
const path = require('path');

class JSONLEventLog {
  constructor(storageDir = null) {
    this.storageDir = storageDir || path.join(__dirname, 'events');
    this._ensureDirectories();
  }

  /**
   * Ensure event directories exist
   * @private
   */
  _ensureDirectories() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Get event log file path
   * @private
   */
  _getEventLogPath(logType) {
    const logFiles = {
      operational_transitions: 'operational_transitions.jsonl',
      payment_events: 'payment_events.jsonl',
      booking_events: 'booking_events.jsonl',
      invoice_receipt_events: 'invoice_receipt_events.jsonl',
      replay_events: 'replay_events.jsonl'
    };

    if (!logFiles[logType]) {
      throw new Error(`Unknown log type: ${logType}`);
    }

    return path.join(this.storageDir, logFiles[logType]);
  }

  /**
   * Write event to append-only JSONL log
   * @param {string} logType - Type of event log
   * @param {object} event - Event object
   * @returns {Promise<void>}
   */
  async writeEvent(logType, event) {
    return new Promise((resolve, reject) => {
      const logPath = this._getEventLogPath(logType);

      // Add timestamp if not present
      if (!event.timestamp) {
        event.timestamp = new Date().toISOString();
      }

      const jsonlLine = JSON.stringify(event) + '\n';

      fs.appendFile(logPath, jsonlLine, 'utf8', (err) => {
        if (err) {
          reject(new Error(`Failed to write to event log: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Read all events from a log file
   * @param {string} logType - Type of event log
   * @returns {Promise<object[]>} Array of events
   */
  async readEvents(logType) {
    return new Promise((resolve, reject) => {
      const logPath = this._getEventLogPath(logType);

      if (!fs.existsSync(logPath)) {
        resolve([]);
        return;
      }

      fs.readFile(logPath, 'utf8', (err, data) => {
        if (err) {
          reject(new Error(`Failed to read event log: ${err.message}`));
        } else {
          try {
            const events = data
              .split('\n')
              .filter((line) => line.trim())
              .map((line) => JSON.parse(line));
            resolve(events);
          } catch (parseErr) {
            reject(new Error(`Failed to parse event log: ${parseErr.message}`));
          }
        }
      });
    });
  }

  /**
   * Read events for a specific case
   * @param {string} logType - Type of event log
   * @param {string} caseId - Case ID to filter
   * @returns {Promise<object[]>}
   */
  async readEventsByCase(logType, caseId) {
    const events = await this.readEvents(logType);
    return events.filter((event) => event.case_id === caseId);
  }

  /**
   * Write operational state transition event
   * @param {object} event - Operational event
   * @returns {Promise<void>}
   */
  async writeOperationalTransition(event) {
    const fullEvent = {
      event_id: event.event_id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: event.event_type,
      case_id: event.case_id,
      timestamp: event.timestamp || new Date().toISOString(),
      actor: event.actor,
      payload: event.payload,
      idempotency_key: event.idempotency_key
    };

    await this.writeEvent('operational_transitions', fullEvent);
    return fullEvent;
  }

  /**
   * Write payment event
   * @param {object} event - Payment event
   * @returns {Promise<void>}
   */
  async writePaymentEvent(event) {
    const fullEvent = {
      event_id: event.event_id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: event.event_type,
      case_id: event.case_id,
      payment_id: event.payment_id,
      booking_id: event.booking_id,
      timestamp: event.timestamp || new Date().toISOString(),
      actor: event.actor,
      payload: event.payload,
      idempotency_key: event.idempotency_key
    };

    await this.writeEvent('payment_events', fullEvent);
    return fullEvent;
  }

  /**
   * Write booking event
   * @param {object} event - Booking event
   * @returns {Promise<void>}
   */
  async writeBookingEvent(event) {
    const fullEvent = {
      event_id: event.event_id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: event.event_type,
      case_id: event.case_id,
      booking_id: event.booking_id,
      timestamp: event.timestamp || new Date().toISOString(),
      actor: event.actor,
      payload: event.payload,
      idempotency_key: event.idempotency_key
    };

    await this.writeEvent('booking_events', fullEvent);
    return fullEvent;
  }

  /**
   * Write invoice/receipt event
   * @param {object} event - Invoice/receipt event
   * @returns {Promise<void>}
   */
  async writeInvoiceReceiptEvent(event) {
    const fullEvent = {
      event_id: event.event_id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: event.event_type,
      case_id: event.case_id,
      invoice_id: event.invoice_id,
      receipt_id: event.receipt_id,
      booking_id: event.booking_id,
      payment_id: event.payment_id,
      timestamp: event.timestamp || new Date().toISOString(),
      actor: event.actor,
      payload: event.payload,
      idempotency_key: event.idempotency_key
    };

    await this.writeEvent('invoice_receipt_events', fullEvent);
    return fullEvent;
  }

  /**
   * Write replay event
   * @param {object} event - Replay event
   * @returns {Promise<void>}
   */
  async writeReplayEvent(event) {
    const fullEvent = {
      event_id: event.event_id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: 'state_replayed',
      case_id: event.case_id,
      timestamp: event.timestamp || new Date().toISOString(),
      actor: 'replay_engine',
      payload: event.payload
    };

    await this.writeEvent('replay_events', fullEvent);
    return fullEvent;
  }

  /**
   * Get event log file size (for diagnostics)
   * @param {string} logType - Type of event log
   * @returns {number} File size in bytes, or 0 if doesn't exist
   */
  getEventLogSize(logType) {
    try {
      const logPath = this._getEventLogPath(logType);
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        return stats.size;
      }
      return 0;
    } catch (err) {
      return 0;
    }
  }

  /**
   * Get event count for a log type
   * @param {string} logType - Type of event log
   * @returns {Promise<number>}
   */
  async getEventCount(logType) {
    const events = await this.readEvents(logType);
    return events.length;
  }

  /**
   * Clear all events (for testing only)
   * @param {string} logType - Type of event log (optional, clears all if not specified)
   * @returns {Promise<void>}
   */
  async clearEvents(logType = null) {
    if (logType) {
      const logPath = this._getEventLogPath(logType);
      if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath);
      }
    } else {
      // Clear all logs
      const logTypes = [
        'operational_transitions',
        'payment_events',
        'booking_events',
        'invoice_receipt_events',
        'replay_events'
      ];

      for (const type of logTypes) {
        const logPath = this._getEventLogPath(type);
        if (fs.existsSync(logPath)) {
          fs.unlinkSync(logPath);
        }
      }
    }
  }
}

module.exports = JSONLEventLog;
