/**
 * Persistence Validator for Mosquito Persistent Layer
 * Validates persistence health and consistency
 */

class PersistenceValidator {
  constructor(sqlite, eventLog) {
    this.sqlite = sqlite;
    this.eventLog = eventLog;
  }

  /**
   * Validate overall storage health
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, issues: string[] }
   */
  async validateStorageHealth() {
    const issues = [];

    // Check database accessibility
    try {
      if (!this.sqlite.isInitialized) {
        issues.push('SQLite not initialized');
        return { status: 'BLOCK', issues };
      }
    } catch (err) {
      issues.push(`Database check failed: ${err.message}`);
      return { status: 'BLOCK', issues };
    }

    // Check event log directory
    try {
      if (!this.eventLog) {
        issues.push('Event log not initialized');
        return { status: 'BLOCK', issues };
      }
    } catch (err) {
      issues.push(`Event log check failed: ${err.message}`);
      return { status: 'HOLD', issues };
    }

    // All checks passed
    return { status: 'PASS', issues: [] };
  }

  /**
   * Validate booking before payment validation
   * @param {string} caseId - Case ID
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, reason_codes: string[] }
   */
  async validateBookingExistence(caseId) {
    try {
      const booking = await this.sqlite.getBookingByCaseId(caseId);

      if (!booking) {
        return {
          status: 'HOLD',
          reason_codes: ['BOOKING_NOT_PERSISTED']
        };
      }

      // Verify event log entry
      const bookingEvents = await this.eventLog.readEventsByCase('booking_events', caseId);
      if (bookingEvents.length === 0) {
        return {
          status: 'HOLD',
          reason_codes: ['BOOKING_EVENT_MISSING']
        };
      }

      return { status: 'PASS', reason_codes: [] };
    } catch (error) {
      return {
        status: 'BLOCK',
        reason_codes: [`VALIDATION_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Validate slot lock before booking confirmation
   * @param {string} slotId - Slot ID
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, reason_codes: string[] }
   */
  async validateSlotLockExistence(slotId) {
    try {
      const slotLock = await this.sqlite.getSlotLock(slotId);

      if (!slotLock) {
        return {
          status: 'HOLD',
          reason_codes: ['SLOT_LOCK_NOT_PERSISTED']
        };
      }

      if (slotLock.lock_status !== 'acquired' && slotLock.lock_status !== 'held') {
        return {
          status: 'BLOCK',
          reason_codes: [`SLOT_LOCK_INVALID_STATUS: ${slotLock.lock_status}`]
        };
      }

      return { status: 'PASS', reason_codes: [] };
    } catch (error) {
      return {
        status: 'BLOCK',
        reason_codes: [`VALIDATION_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Validate payment state before invoice/receipt handoff
   * @param {string} caseId - Case ID
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, reason_codes: string[] }
   */
  async validatePaymentStateExistence(caseId) {
    try {
      const payment = await this.sqlite.getPaymentStateByCaseId(caseId);

      if (!payment) {
        return {
          status: 'HOLD',
          reason_codes: ['PAYMENT_STATE_NOT_PERSISTED']
        };
      }

      if (payment.payment_status !== 'validated') {
        return {
          status: 'HOLD',
          reason_codes: [`PAYMENT_NOT_VALIDATED: ${payment.payment_status}`]
        };
      }

      // Verify event log entry
      const paymentEvents = await this.eventLog.readEventsByCase('payment_events', caseId);
      if (paymentEvents.length === 0) {
        return {
          status: 'HOLD',
          reason_codes: ['PAYMENT_EVENT_MISSING']
        };
      }

      return { status: 'PASS', reason_codes: [] };
    } catch (error) {
      return {
        status: 'BLOCK',
        reason_codes: [`VALIDATION_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Validate replay event exists for every state transition
   * @param {string} caseId - Case ID
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, reason_codes: string[] }
   */
  async validateReplayEventCoverage(caseId) {
    try {
      const operationalEvents = await this.eventLog.readEventsByCase('operational_transitions', caseId);
      const bookingEvents = await this.eventLog.readEventsByCase('booking_events', caseId);
      const paymentEvents = await this.eventLog.readEventsByCase('payment_events', caseId);

      const totalEvents = operationalEvents.length + bookingEvents.length + paymentEvents.length;

      if (totalEvents === 0) {
        return {
          status: 'HOLD',
          reason_codes: ['NO_EVENTS_RECORDED']
        };
      }

      return { status: 'PASS', reason_codes: [] };
    } catch (error) {
      return {
        status: 'BLOCK',
        reason_codes: [`VALIDATION_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Validate idempotency key exists for write operations
   * @param {string} idempotencyKey - Idempotency key
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, reason_codes: string[] }
   */
  async validateIdempotencyKey(idempotencyKey) {
    if (!idempotencyKey) {
      return {
        status: 'BLOCK',
        reason_codes: ['MISSING_IDEMPOTENCY_KEY']
      };
    }

    try {
      const keyRecord = await this.sqlite.getIdempotencyKey(idempotencyKey);

      if (!keyRecord) {
        return {
          status: 'HOLD',
          reason_codes: ['IDEMPOTENCY_KEY_NOT_STORED']
        };
      }

      return { status: 'PASS', reason_codes: [] };
    } catch (error) {
      return {
        status: 'BLOCK',
        reason_codes: [`VALIDATION_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Validate no required entity remains in-memory only
   * @param {string} caseId - Case ID
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, reason_codes: string[] }
   */
  async validateNoDanglingInMemoryEntities(caseId) {
    const issues = [];

    try {
      // Check booking
      const booking = await this.sqlite.getBookingByCaseId(caseId);
      if (!booking) {
        issues.push('BOOKING_IN_MEMORY_ONLY');
      }

      // Check payment
      const payment = await this.sqlite.getPaymentStateByCaseId(caseId);
      if (!payment) {
        issues.push('PAYMENT_IN_MEMORY_ONLY');
      }

      if (issues.length > 0) {
        return {
          status: 'HOLD_FOR_PERSISTENCE',
          reason_codes: issues
        };
      }

      return { status: 'PASS', reason_codes: [] };
    } catch (error) {
      return {
        status: 'BLOCK',
        reason_codes: [`VALIDATION_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Comprehensive case validation
   * @param {string} caseId - Case ID
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, validations: object }
   */
  async validateCase(caseId) {
    const validations = {
      storage_health: await this.validateStorageHealth(),
      booking_exists: await this.validateBookingExistence(caseId),
      payment_exists: await this.validatePaymentStateExistence(caseId),
      replay_coverage: await this.validateReplayEventCoverage(caseId),
      no_dangling: await this.validateNoDanglingInMemoryEntities(caseId)
    };

    // Determine overall status
    let overallStatus = 'PASS';
    for (const validation of Object.values(validations)) {
      if (validation.status === 'BLOCK') {
        overallStatus = 'BLOCK';
        break;
      }
      if (validation.status === 'HOLD' && overallStatus !== 'BLOCK') {
        overallStatus = 'HOLD';
      }
    }

    return {
      status: overallStatus,
      validations
    };
  }
}

module.exports = PersistenceValidator;
