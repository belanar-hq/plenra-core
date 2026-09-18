/**
 * Replay State Reconstructor for Mosquito Persistent Layer
 * Reconstructs current booking/payment/field state from append-only JSONL logs
 */

const crypto = require('crypto');

class ReplayStateReconstructor {
  constructor(sqlite, eventLog) {
    this.sqlite = sqlite;
    this.eventLog = eventLog;
  }

  /**
   * Reconstruct complete state from event logs
   * @param {string} caseId - Case ID
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, state: object, conflicts: string[] }
   */
  async reconstructCompleteState(caseId) {
    try {
      const state = {
        booking: null,
        payment: null,
        slot_locks: [],
        field_status: [],
        invoice_receipts: null,
        contractor_schedule: null,
        customer_reminders: [],
        events_processed: 0,
        conflicts: []
      };

      // Reconstruct from booking events
      const bookingEvents = await this.eventLog.readEventsByCase('booking_events', caseId);
      for (const event of bookingEvents) {
        state.events_processed++;
        state.booking = state.booking || {};
        Object.assign(state.booking, event.payload);
      }

      // Reconstruct from payment events
      const paymentEvents = await this.eventLog.readEventsByCase('payment_events', caseId);
      for (const event of paymentEvents) {
        state.events_processed++;
        state.payment = state.payment || {};
        Object.assign(state.payment, event.payload);
      }

      // Reconstruct from operational transitions
      const operationalEvents = await this.eventLog.readEventsByCase('operational_transitions', caseId);
      for (const event of operationalEvents) {
        state.events_processed++;

        if (event.event_type === 'slot_locked') {
          state.slot_locks.push(event.payload);
        }

        if (event.event_type === 'field_updated') {
          state.field_status.push(event.payload);
        }

        if (event.event_type === 'reminder_scheduled') {
          state.customer_reminders.push(event.payload);
        }
      }

      // Reconstruct from invoice/receipt events
      const invoiceEvents = await this.eventLog.readEventsByCase('invoice_receipt_events', caseId);
      for (const event of invoiceEvents) {
        state.events_processed++;
        state.invoice_receipts = state.invoice_receipts || {};
        Object.assign(state.invoice_receipts, event.payload);
      }

      // Validate against SQLite state
      const validation = await this._validateReplayConsistency(caseId, state);

      if (validation.status === 'BLOCK') {
        return {
          status: 'BLOCK',
          state: null,
          conflicts: validation.conflicts
        };
      }

      return {
        status: validation.status,
        state,
        conflicts: validation.conflicts
      };
    } catch (error) {
      return {
        status: 'BLOCK',
        state: null,
        conflicts: [`RECONSTRUCTION_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Reconstruct booking state
   * @param {string} caseId - Case ID
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, booking: object|null, conflicts: string[] }
   */
  async reconstructBookingState(caseId) {
    try {
      const booking = await this.sqlite.getBookingByCaseId(caseId);
      const bookingEvents = await this.eventLog.readEventsByCase('booking_events', caseId);

      if (!booking && bookingEvents.length === 0) {
        return {
          status: 'HOLD',
          booking: null,
          conflicts: ['NO_BOOKING_DATA']
        };
      }

      let reconstructedBooking = {};
      for (const event of bookingEvents) {
        Object.assign(reconstructedBooking, event.payload);
      }

      // Check for conflicts
      const conflicts = [];
      if (booking && reconstructedBooking) {
        // Handle both id and booking_id fields from event payload
        const reconstructedId = reconstructedBooking.id || reconstructedBooking.booking_id;
        if (reconstructedId && reconstructedId !== booking.id) {
          conflicts.push('BOOKING_ID_MISMATCH_BETWEEN_DB_AND_EVENTS');
        }
      }

      const status = conflicts.length > 0 ? 'BLOCK' : 'PASS';

      return {
        status,
        booking: booking || reconstructedBooking,
        conflicts
      };
    } catch (error) {
      return {
        status: 'BLOCK',
        booking: null,
        conflicts: [`BOOKING_RECONSTRUCTION_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Reconstruct payment state
   * @param {string} caseId - Case ID
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, payment: object|null, conflicts: string[] }
   */
  async reconstructPaymentState(caseId) {
    try {
      const payment = await this.sqlite.getPaymentStateByCaseId(caseId);
      const paymentEvents = await this.eventLog.readEventsByCase('payment_events', caseId);

      if (!payment && paymentEvents.length === 0) {
        return {
          status: 'HOLD',
          payment: null,
          conflicts: ['NO_PAYMENT_DATA']
        };
      }

      let reconstructedPayment = {};
      for (const event of paymentEvents) {
        Object.assign(reconstructedPayment, event.payload);
      }

      // Check for conflicts
      const conflicts = [];
      if (payment && reconstructedPayment) {
        // Handle both id and payment_id fields from event payload
        const reconstructedId = reconstructedPayment.id || reconstructedPayment.payment_id;
        if (reconstructedId && reconstructedId !== payment.id) {
          conflicts.push('PAYMENT_ID_MISMATCH_BETWEEN_DB_AND_EVENTS');
        }
      }

      const status = conflicts.length > 0 ? 'BLOCK' : 'PASS';

      return {
        status,
        payment: payment || reconstructedPayment,
        conflicts
      };
    } catch (error) {
      return {
        status: 'BLOCK',
        payment: null,
        conflicts: [`PAYMENT_RECONSTRUCTION_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Reconstruct field status state
   * @param {string} caseId - Case ID
   * @param {string} fieldName - Field name (optional, specific field only)
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, fields: object, conflicts: string[] }
   */
  async reconstructFieldStatusState(caseId, fieldName = null) {
    try {
      const operationalEvents = await this.eventLog.readEventsByCase('operational_transitions', caseId);
      const fieldEvents = operationalEvents.filter((e) => e.event_type === 'field_updated');

      if (fieldEvents.length === 0) {
        return {
          status: 'PASS',
          fields: {},
          conflicts: []
        };
      }

      const fields = {};
      for (const event of fieldEvents) {
        const { field_name, field_lifecycle_stage, current_value } = event.payload;

        if (!fieldName || fieldName === field_name) {
          if (!fields[field_name]) {
            fields[field_name] = [];
          }
          fields[field_name].push({
            stage: field_lifecycle_stage,
            value: current_value,
            timestamp: event.timestamp
          });
        }
      }

      return {
        status: 'PASS',
        fields,
        conflicts: []
      };
    } catch (error) {
      return {
        status: 'BLOCK',
        fields: null,
        conflicts: [`FIELD_RECONSTRUCTION_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Validate replay consistency against SQLite
   * @private
   */
  async _validateReplayConsistency(caseId, reconstructedState) {
    const conflicts = [];

    try {
      // Check booking consistency
      if (reconstructedState.booking) {
        const dbBooking = await this.sqlite.getBookingByCaseId(caseId);
        if (dbBooking) {
          // Handle both id and booking_id fields from event payload
          const reconstructedId = reconstructedState.booking.id || reconstructedState.booking.booking_id;
          if (reconstructedId && reconstructedId !== dbBooking.id) {
            conflicts.push('BOOKING_ID_MISMATCH');
          }
        }
      }

      // Check payment consistency
      if (reconstructedState.payment) {
        const dbPayment = await this.sqlite.getPaymentStateByCaseId(caseId);
        if (dbPayment) {
          // Handle both id and payment_id fields from event payload
          const reconstructedId = reconstructedState.payment.id || reconstructedState.payment.payment_id;
          if (reconstructedId && reconstructedId !== dbPayment.id) {
            conflicts.push('PAYMENT_ID_MISMATCH');
          }
        }
      }
    } catch (error) {
      conflicts.push(`CONSISTENCY_CHECK_ERROR: ${error.message}`);
    }

    const status = conflicts.length > 0 ? 'BLOCK' : 'PASS';

    return {
      status,
      conflicts
    };
  }

  /**
   * Verify event ordering is deterministic
   * @param {Array} events - Array of events to check
   * @returns {object} { valid: boolean, issues: string[] }
   */
  verifyEventOrdering(events) {
    const issues = [];

    if (!Array.isArray(events) || events.length === 0) {
      return { valid: true, issues: [] };
    }

    // Check timestamps are monotonic
    for (let i = 1; i < events.length; i++) {
      const prevTimestamp = new Date(events[i - 1].timestamp).getTime();
      const currTimestamp = new Date(events[i].timestamp).getTime();

      if (currTimestamp < prevTimestamp) {
        issues.push(`Event ordering violation at index ${i}: timestamps not monotonic`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

module.exports = ReplayStateReconstructor;
