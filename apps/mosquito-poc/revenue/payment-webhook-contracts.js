/**
 * Payment Webhook Contracts
 * 
 * Future-ready webhook schemas for CREDIT_CARD_PAYMENT_PAGE mode.
 * These contracts are INACTIVE in MVP.
 * They define the shape of future webhooks but do not execute them.
 */

class PaymentWebhookContracts {
  constructor() {
    this.schema_version = '1.0.0';
    this.mode = 'CREDIT_CARD_PAYMENT_PAGE';
    this.active_in_mvp = false; // FUTURE READY ONLY
  }

  /**
   * Payment Success Webhook Contract (INACTIVE IN MVP)
   * Defines shape but does not execute
   */
  getPaymentSuccessContract() {
    return {
      webhook_name: 'payment_success',
      active_now: false,
      status: 'FUTURE_READY_ONLY',
      schema: {
        webhook_event_id: { type: 'string', description: 'Unique webhook ID for idempotency' },
        payment_provider_session_id: { type: 'string', description: 'Provider session ID' },
        payment_id: { type: 'string', description: 'Internal payment ID' },
        booking_id: { type: 'string', description: 'Booking reference' },
        amount: { type: 'number', description: 'Payment amount in ILS' },
        currency: { type: 'string', enum: ['ILS'], description: 'Currency' },
        provider: { type: 'string', description: 'Payment provider' },
        status: { type: 'string', enum: ['SUCCESS'], description: 'Payment status' },
        timestamp: { type: 'string', description: 'ISO 8601 timestamp' }
      },
      required_fields: [
        'webhook_event_id',
        'payment_provider_session_id',
        'payment_id',
        'booking_id',
        'amount',
        'currency',
        'provider',
        'status',
        'timestamp'
      ],
      idempotency_key: 'webhook_event_id',
      transition_to_state: 'payment_success_webhook_received'
    };
  }

  /**
   * Payment Failed Webhook Contract (INACTIVE IN MVP)
   */
  getPaymentFailedContract() {
    return {
      webhook_name: 'payment_failed',
      active_now: false,
      status: 'FUTURE_READY_ONLY',
      schema: {
        webhook_event_id: { type: 'string' },
        payment_provider_session_id: { type: 'string' },
        payment_id: { type: 'string' },
        booking_id: { type: 'string' },
        error_code: { type: 'string', description: 'Provider error code' },
        error_message: { type: 'string', description: 'Provider error message' },
        timestamp: { type: 'string' }
      },
      required_fields: [
        'webhook_event_id',
        'payment_provider_session_id',
        'payment_id',
        'booking_id',
        'error_code',
        'error_message',
        'timestamp'
      ],
      idempotency_key: 'webhook_event_id',
      transition_to_state: 'payment_failed'
    };
  }

  /**
   * Refund Webhook Contract (INACTIVE IN MVP)
   */
  getRefundContract() {
    return {
      webhook_name: 'refund_initiated',
      active_now: false,
      status: 'FUTURE_READY_ONLY',
      schema: {
        webhook_event_id: { type: 'string' },
        payment_provider_session_id: { type: 'string' },
        refund_id: { type: 'string' },
        booking_id: { type: 'string' },
        payment_id: { type: 'string' },
        refund_amount: { type: 'number' },
        reason: { type: 'string' },
        timestamp: { type: 'string' }
      },
      required_fields: [
        'webhook_event_id',
        'refund_id',
        'payment_id',
        'booking_id',
        'refund_amount',
        'timestamp'
      ],
      idempotency_key: 'webhook_event_id',
      transition_to_state: 'refund_pending'
    };
  }

  /**
   * Validate webhook against contract (no execution in MVP)
   */
  validateWebhook(webhook, contractName) {
    let contract;

    switch (contractName) {
      case 'payment_success':
        contract = this.getPaymentSuccessContract();
        break;
      case 'payment_failed':
        contract = this.getPaymentFailedContract();
        break;
      case 'refund':
        contract = this.getRefundContract();
        break;
      default:
        return { valid: false, error: 'UNKNOWN_WEBHOOK_CONTRACT' };
    }

    // Check if active in MVP (should NOT be)
    if (contract.active_now === true) {
      return { valid: false, error: 'WEBHOOK_ACTIVE_IN_MVP_NOT_ALLOWED' };
    }

    // Validate required fields
    const missingFields = contract.required_fields.filter(f => !webhook[f]);
    if (missingFields.length > 0) {
      return {
        valid: false,
        error: 'MISSING_REQUIRED_FIELDS',
        missing_fields: missingFields
      };
    }

    // Validate types
    const typeErrors = [];
    for (const [field, schema] of Object.entries(contract.schema)) {
      if (webhook[field] !== undefined) {
        const actual = typeof webhook[field];
        if (schema.type && schema.type !== actual) {
          typeErrors.push(`${field}: expected ${schema.type}, got ${actual}`);
        }
        if (schema.enum && !schema.enum.includes(webhook[field])) {
          typeErrors.push(`${field}: value must be one of ${schema.enum.join(', ')}`);
        }
      }
    }

    if (typeErrors.length > 0) {
      return { valid: false, error: 'TYPE_VALIDATION_FAILED', details: typeErrors };
    }

    return { valid: true, status: 'FUTURE_READY_VALID', contract_name: contractName };
  }

  /**
   * Check webhook idempotency (FUTURE: prevent duplicate processing)
   */
  checkIdempotency(webhook, contractName, processedWebhooks = []) {
    let contract;
    switch (contractName) {
      case 'payment_success':
        contract = this.getPaymentSuccessContract();
        break;
      case 'payment_failed':
        contract = this.getPaymentFailedContract();
        break;
      case 'refund':
        contract = this.getRefundContract();
        break;
      default:
        return { idempotent: false, error: 'UNKNOWN_CONTRACT' };
    }

    const idempotencyKey = webhook[contract.idempotency_key];
    const isDuplicate = processedWebhooks.includes(idempotencyKey);

    return {
      idempotent: !isDuplicate,
      idempotency_key: idempotencyKey,
      is_duplicate: isDuplicate
    };
  }

  /**
   * Get all future-ready contracts
   */
  getAllContracts() {
    return {
      payment_success: this.getPaymentSuccessContract(),
      payment_failed: this.getPaymentFailedContract(),
      refund: this.getRefundContract()
    };
  }
}

module.exports = { PaymentWebhookContracts };
