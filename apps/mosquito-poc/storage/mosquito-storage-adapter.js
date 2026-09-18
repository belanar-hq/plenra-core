/**
 * Main Storage Adapter Interface for Mosquito Persistent Layer
 * Facade for storage operations with validation and error handling
 */

const SQLiteStorageAdapter = require('./sqlite-storage-adapter');
const JSONLEventLog = require('./jsonl-event-log');
const IdempotencyStore = require('./idempotency-store');
const PersistenceValidator = require('./persistence-validator');
const crypto = require('crypto');

class MosquitoStorageAdapter {
  constructor(dbPath = null, eventsDir = null) {
    this.sqlite = new SQLiteStorageAdapter(dbPath);
    this.eventLog = new JSONLEventLog(eventsDir);
    this.idempotencyStore = new IdempotencyStore(this.sqlite);
    this.validator = new PersistenceValidator(this.sqlite, this.eventLog);
  }

  /**
   * Initialize storage layer
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.sqlite.initialize();
  }

  /**
   * Save booking with event log
   * @param {object} record - Booking record
   * @param {object} options - Options (includeEvent, idempotencyKey)
   * @returns {Promise<object>} Result with status
   */
  async saveBooking(record, options = {}) {
    const { includeEvent = true, idempotencyKey } = options;

    // Check idempotency
    if (idempotencyKey) {
      const existing = await this.idempotencyStore.checkIdempotency(
        idempotencyKey,
        'save_booking',
        record
      );

      if (existing === 'DUPLICATE_KEY_DIFFERENT_PAYLOAD') {
        throw new Error('IDEMPOTENCY_VIOLATION: Same key with different payload');
      }

      if (existing) {
        return existing.result;
      }
    }

    const timestamp = new Date().toISOString();
    record.created_at = record.created_at || timestamp;
    record.updated_at = timestamp;

    try {
      const result = await this.sqlite.saveBooking(record);

      if (includeEvent) {
        await this.eventLog.writeBookingEvent({
          event_type: 'booking_created',
          case_id: record.case_id,
          booking_id: record.id,
          actor: 'storage_adapter',
          payload: {
            booking_id: record.id,
            customer_phone: record.customer_phone,
            booking_status: record.booking_status
          },
          idempotency_key: idempotencyKey
        });
      }

      if (idempotencyKey) {
        await this.idempotencyStore.storeIdempotencyKey(
          idempotencyKey,
          'save_booking',
          record,
          result
        );
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to save booking: ${error.message}`);
    }
  }

  /**
   * Get booking record
   * @param {string} bookingId - Booking ID
   * @returns {Promise<object|null>}
   */
  async getBooking(bookingId) {
    return this.sqlite.getBooking(bookingId);
  }

  /**
   * Get booking by case ID
   * @param {string} caseId - Case ID
   * @returns {Promise<object|null>}
   */
  async getBookingByCaseId(caseId) {
    return this.sqlite.getBookingByCaseId(caseId);
  }

  /**
   * Save slot lock with event log
   * @param {object} record - Slot lock record
   * @param {object} options - Options
   * @returns {Promise<object>}
   */
  async saveSlotLock(record, options = {}) {
    const { includeEvent = true, idempotencyKey } = options;

    if (idempotencyKey) {
      const existing = await this.idempotencyStore.checkIdempotency(
        idempotencyKey,
        'save_slot_lock',
        record
      );

      if (existing === 'DUPLICATE_KEY_DIFFERENT_PAYLOAD') {
        throw new Error('IDEMPOTENCY_VIOLATION: Same key with different payload');
      }

      if (existing) {
        return existing.result;
      }
    }

    const timestamp = new Date().toISOString();
    record.created_at = record.created_at || timestamp;
    record.updated_at = timestamp;

    try {
      const result = await this.sqlite.saveSlotLock(record);

      if (includeEvent) {
        await this.eventLog.writeOperationalTransition({
          event_type: 'slot_locked',
          case_id: record.case_id,
          actor: 'storage_adapter',
          payload: {
            slot_id: record.slot_id,
            booking_id: record.booking_id,
            lock_status: record.lock_status
          },
          idempotency_key: idempotencyKey
        });
      }

      if (idempotencyKey) {
        await this.idempotencyStore.storeIdempotencyKey(
          idempotencyKey,
          'save_slot_lock',
          record,
          result
        );
      }

      return result;
    } catch (error) {
      if (error.message === 'DUPLICATE_SLOT_LOCK') {
        throw new Error('DUPLICATE_SLOT_LOCK');
      }
      throw new Error(`Failed to save slot lock: ${error.message}`);
    }
  }

  /**
   * Get slot lock record
   * @param {string} slotId - Slot ID
   * @returns {Promise<object|null>}
   */
  async getSlotLock(slotId) {
    return this.sqlite.getSlotLock(slotId);
  }

  /**
   * Save payment state with event log
   * @param {object} record - Payment state record
   * @param {object} options - Options
   * @returns {Promise<object>}
   */
  async savePaymentState(record, options = {}) {
    const { includeEvent = true, idempotencyKey } = options;

    if (idempotencyKey) {
      const existing = await this.idempotencyStore.checkIdempotency(
        idempotencyKey,
        'save_payment_state',
        record
      );

      if (existing === 'DUPLICATE_KEY_DIFFERENT_PAYLOAD') {
        throw new Error('IDEMPOTENCY_VIOLATION: Same key with different payload');
      }

      if (existing) {
        return existing.result;
      }
    }

    const timestamp = new Date().toISOString();
    record.created_at = record.created_at || timestamp;
    record.updated_at = timestamp;

    try {
      const result = await this.sqlite.savePaymentState(record);

      if (includeEvent) {
        await this.eventLog.writePaymentEvent({
          event_type: 'payment_initiated',
          case_id: record.case_id,
          payment_id: record.id,
          booking_id: record.booking_id,
          actor: 'storage_adapter',
          payload: {
            payment_status: record.payment_status,
            amount: record.amount,
            currency: record.currency,
            payment_method: record.payment_method
          },
          idempotency_key: idempotencyKey
        });
      }

      if (idempotencyKey) {
        await this.idempotencyStore.storeIdempotencyKey(
          idempotencyKey,
          'save_payment_state',
          record,
          result
        );
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to save payment state: ${error.message}`);
    }
  }

  /**
   * Get payment state record
   * @param {string} paymentId - Payment ID
   * @returns {Promise<object|null>}
   */
  async getPaymentState(paymentId) {
    return this.sqlite.getPaymentState(paymentId);
  }

  /**
   * Get payment by case ID
   * @param {string} caseId - Case ID
   * @returns {Promise<object|null>}
   */
  async getPaymentStateByCaseId(caseId) {
    return this.sqlite.getPaymentStateByCaseId(caseId);
  }

  /**
   * Save invoice/receipt lineage with event log
   * @param {object} record - Invoice/receipt record
   * @param {object} options - Options
   * @returns {Promise<object>}
   */
  async saveInvoiceReceiptLineage(record, options = {}) {
    const { includeEvent = true, idempotencyKey } = options;

    if (idempotencyKey) {
      const existing = await this.idempotencyStore.checkIdempotency(
        idempotencyKey,
        'save_invoice_receipt',
        record
      );

      if (existing === 'DUPLICATE_KEY_DIFFERENT_PAYLOAD') {
        throw new Error('IDEMPOTENCY_VIOLATION: Same key with different payload');
      }

      if (existing) {
        return existing.result;
      }
    }

    const timestamp = new Date().toISOString();
    record.created_at = record.created_at || timestamp;
    record.updated_at = timestamp;

    try {
      const result = await this.sqlite.saveInvoiceReceiptLineage(record);

      if (includeEvent) {
        await this.eventLog.writeInvoiceReceiptEvent({
          event_type: 'invoice_generated',
          case_id: record.case_id,
          invoice_id: record.invoice_id,
          receipt_id: record.receipt_id,
          booking_id: record.booking_id,
          payment_id: record.payment_id,
          actor: 'storage_adapter',
          payload: {
            provider: record.provider,
            status: record.status
          },
          idempotency_key: idempotencyKey
        });
      }

      if (idempotencyKey) {
        await this.idempotencyStore.storeIdempotencyKey(
          idempotencyKey,
          'save_invoice_receipt',
          record,
          result
        );
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to save invoice/receipt: ${error.message}`);
    }
  }

  /**
   * Save field status with event log
   * @param {object} record - Field status record
   * @param {object} options - Options
   * @returns {Promise<object>}
   */
  async saveFieldStatus(record, options = {}) {
    const { includeEvent = true, idempotencyKey } = options;

    if (idempotencyKey) {
      const existing = await this.idempotencyStore.checkIdempotency(
        idempotencyKey,
        'save_field_status',
        record
      );

      if (existing === 'DUPLICATE_KEY_DIFFERENT_PAYLOAD') {
        throw new Error('IDEMPOTENCY_VIOLATION: Same key with different payload');
      }

      if (existing) {
        return existing.result;
      }
    }

    const timestamp = new Date().toISOString();
    record.created_at = record.created_at || timestamp;
    record.updated_at = timestamp;

    try {
      const result = await this.sqlite.saveFieldStatus(record);

      if (includeEvent) {
        await this.eventLog.writeOperationalTransition({
          event_type: 'field_updated',
          case_id: record.case_id,
          actor: 'storage_adapter',
          payload: {
            field_name: record.field_name,
            field_lifecycle_stage: record.field_lifecycle_stage,
            current_value: record.current_value
          },
          idempotency_key: idempotencyKey
        });
      }

      if (idempotencyKey) {
        await this.idempotencyStore.storeIdempotencyKey(
          idempotencyKey,
          'save_field_status',
          record,
          result
        );
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to save field status: ${error.message}`);
    }
  }

  /**
   * Save contractor schedule with event log
   * @param {object} record - Contractor schedule record
   * @param {object} options - Options
   * @returns {Promise<object>}
   */
  async saveContractorSchedule(record, options = {}) {
    const { includeEvent = true, idempotencyKey } = options;

    if (idempotencyKey) {
      const existing = await this.idempotencyStore.checkIdempotency(
        idempotencyKey,
        'save_contractor_schedule',
        record
      );

      if (existing === 'DUPLICATE_KEY_DIFFERENT_PAYLOAD') {
        throw new Error('IDEMPOTENCY_VIOLATION: Same key with different payload');
      }

      if (existing) {
        return existing.result;
      }
    }

    const timestamp = new Date().toISOString();
    record.created_at = record.created_at || timestamp;
    record.updated_at = timestamp;

    try {
      const result = await this.sqlite.saveContractorSchedule(record);

      if (includeEvent) {
        await this.eventLog.writeOperationalTransition({
          event_type: 'installation_scheduled',
          case_id: record.case_id,
          actor: 'storage_adapter',
          payload: {
            contractor_id: record.contractor_id,
            contractor_name: record.contractor_name,
            assigned_date: record.assigned_date
          },
          idempotency_key: idempotencyKey
        });
      }

      if (idempotencyKey) {
        await this.idempotencyStore.storeIdempotencyKey(
          idempotencyKey,
          'save_contractor_schedule',
          record,
          result
        );
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to save contractor schedule: ${error.message}`);
    }
  }

  /**
   * Save customer reminder with event log
   * @param {object} record - Customer reminder record
   * @param {object} options - Options
   * @returns {Promise<object>}
   */
  async saveCustomerReminder(record, options = {}) {
    const { includeEvent = true, idempotencyKey } = options;

    if (idempotencyKey) {
      const existing = await this.idempotencyStore.checkIdempotency(
        idempotencyKey,
        'save_customer_reminder',
        record
      );

      if (existing === 'DUPLICATE_KEY_DIFFERENT_PAYLOAD') {
        throw new Error('IDEMPOTENCY_VIOLATION: Same key with different payload');
      }

      if (existing) {
        return existing.result;
      }
    }

    const timestamp = new Date().toISOString();
    record.created_at = record.created_at || timestamp;
    record.updated_at = timestamp;

    try {
      const result = await this.sqlite.saveCustomerReminder(record);

      if (includeEvent) {
        await this.eventLog.writeOperationalTransition({
          event_type: 'reminder_scheduled',
          case_id: record.case_id,
          actor: 'storage_adapter',
          payload: {
            booking_id: record.booking_id,
            reminder_type: record.reminder_type,
            scheduled_send_time: record.scheduled_send_time
          },
          idempotency_key: idempotencyKey
        });
      }

      if (idempotencyKey) {
        await this.idempotencyStore.storeIdempotencyKey(
          idempotencyKey,
          'save_customer_reminder',
          record,
          result
        );
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to save customer reminder: ${error.message}`);
    }
  }

  /**
   * Write operational event to event log
   * @param {object} event - Event object
   * @returns {Promise<object>} Event with generated ID
   */
  async writeOperationalEvent(event) {
    return this.eventLog.writeOperationalTransition(event);
  }

  /**
   * Validate storage health
   * @returns {Promise<object>} Validation result
   */
  async validateStorageHealth() {
    return this.validator.validateStorageHealth();
  }

  /**
   * Close storage connections
   * @returns {Promise<void>}
   */
  async close() {
    await this.sqlite.close();
  }
}

module.exports = MosquitoStorageAdapter;
