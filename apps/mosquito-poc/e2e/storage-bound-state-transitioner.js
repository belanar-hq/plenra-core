/**
 * Storage-bound state transitioner.
 * Persists every state transition to durable storage and replay log.
 */

function validateTransitionPersistence({ storageAdapter, entityType, record }) {
  if (!storageAdapter) {
    return {
      valid: false,
      status: 'HOLD',
      reason_codes: ['STORAGE_ADAPTER_REQUIRED'],
      error: 'Storage adapter is required for persistence'
    };
  }

  if (!entityType || !record || !record.case_id) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['INVALID_TRANSITION_RECORD'],
      error: 'entityType and record with case_id are required'
    };
  }

  return {
    valid: true,
    status: 'PASS'
  };
}

async function persistAndTransition({ storageAdapter, eventLog, entityType, record, event, idempotency_key }) {
  const validation = validateTransitionPersistence({ storageAdapter, entityType, record });
  if (validation.status !== 'PASS') {
    return validation;
  }

  try {
    switch (entityType) {
      case 'booking':
        await storageAdapter.saveBooking(record, { idempotencyKey: idempotency_key, includeEvent: false });
        break;
      case 'slot_lock':
        await storageAdapter.saveSlotLock(record, { idempotencyKey: idempotency_key, includeEvent: false });
        break;
      case 'payment_state':
        await storageAdapter.savePaymentState(record, { idempotencyKey: idempotency_key, includeEvent: false });
        break;
      case 'invoice_receipt':
        await storageAdapter.saveInvoiceReceiptLineage(record, { idempotencyKey: idempotency_key, includeEvent: false });
        break;
      case 'field_status':
        await storageAdapter.saveFieldStatus(record, { idempotencyKey: idempotency_key, includeEvent: false });
        break;
      case 'contractor_schedule':
        await storageAdapter.saveContractorSchedule(record, { idempotencyKey: idempotency_key, includeEvent: false });
        break;
      case 'customer_reminder':
        await storageAdapter.saveCustomerReminder(record, { idempotencyKey: idempotency_key, includeEvent: false });
        break;
      default:
        return {
          valid: false,
          status: 'BLOCK',
          reason_codes: ['UNKNOWN_ENTITY_TYPE'],
          error: `Unknown entityType: ${entityType}`
        };
    }

    if (eventLog || storageAdapter.eventLog) {
      const payload = event || {
        event_type: 'state_transition',
        case_id: record.case_id,
        payload: record
      };

      await (eventLog || storageAdapter.eventLog).writeOperationalTransition(payload);
    }

    return {
      valid: true,
      status: 'PASS'
    };
  } catch (error) {
    if (error && error.message && error.message.includes('duplicate')) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['DUPLICATE_STATE_TRANSITION'],
        error: error.message
      };
    }

    return {
      valid: false,
      status: 'HOLD',
      reason_codes: ['PERSISTENCE_FAILED'],
      error: error.message || 'Unknown storage failure'
    };
  }
}

module.exports = {
  validateTransitionPersistence,
  persistAndTransition
};
