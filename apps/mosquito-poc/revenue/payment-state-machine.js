/**
 * Payment State Machine
 * 
 * Deterministic state transitions for mosquito vertical revenue.
 * Encodes all valid money states and fail states.
 * No adaptive learning, no state creation outside this machine.
 */

const ACTIVE_MVP_STATES = [
  'booking_created',           // 0: Initial state
  'payment_pending',           // 1: Waiting for manual confirmation
  'manual_payment_requested',  // 2: Payment proof requested from customer
  'payment_proof_uploaded',    // 3: Customer uploaded proof
  'payment_validated',         // 4: Admin confirmed payment
  'invoice_generated',         // 5: Invoice created
  'receipt_generated',         // 6: Receipt created
  'booking_confirmed',         // 7: Ready for service
  'service_completed'          // 8: Service delivered
];

const FUTURE_READY_STATES = [
  'payment_page_created',      // Future: Payment page URL generated
  'payment_success_webhook_received',  // Future: Webhook from provider
];

const FAIL_STATES = [
  'payment_failed',            // Payment attempt failed
  'invoice_failed',            // Invoice generation failed
  'receipt_failed',            // Receipt generation failed
  'duplicate_invoice_blocked', // Duplicate invoice detected
  'refund_pending',            // Refund requested
  'refund_completed',          // Refund executed
  'reconciliation_hold',       // Amount mismatch hold
  'webhook_missing',           // Expected webhook didn't arrive
  'payment_proof_invalid',     // Proof validation failed
  'provider_error_hold'        // Provider returned error
];

class PaymentStateMachine {
  constructor(storageAdapter = null) {
    this.storageAdapter = storageAdapter;
    this.active_mvp_states = ACTIVE_MVP_STATES;
    this.future_ready_states = FUTURE_READY_STATES;
    this.fail_states = FAIL_STATES;
    this.all_states = [
      ...this.active_mvp_states,
      ...this.future_ready_states,
      ...this.fail_states
    ];
  }

  /**
   * Persist payment state through optional storage adapter
   */
  async persistPaymentState(record, options = {}) {
    if (!this.storageAdapter) {
      throw new Error('STORAGE_ADAPTER_NOT_BOUND');
    }

    return this.storageAdapter.savePaymentState(record, options);
  }

  /**
   * Define valid transitions for MVP (MANUAL_CONFIRMATION active NOW)
   */
  getValidMVPTransitions() {
    return {
      'booking_created': ['payment_pending'],
      'payment_pending': ['manual_payment_requested', 'payment_failed'],
      'manual_payment_requested': ['payment_proof_uploaded', 'payment_failed'],
      'payment_proof_uploaded': ['payment_validated', 'payment_proof_invalid'],
      'payment_validated': ['invoice_generated', 'invoice_failed'],
      'invoice_generated': ['receipt_generated', 'receipt_failed', 'duplicate_invoice_blocked'],
      'receipt_generated': ['booking_confirmed', 'receipt_failed'],
      'booking_confirmed': ['service_completed'],
      'service_completed': ['refund_pending'] // Only refunds allowed after completion
    };
  }

  /**
   * Define valid transitions for future CREDIT_CARD_PAYMENT_PAGE (NOT ACTIVE NOW)
   */
  getFutureReadyTransitions() {
    return {
      'payment_pending': ['payment_page_created'],
      'payment_page_created': ['payment_success_webhook_received', 'payment_failed', 'webhook_missing'],
      'payment_success_webhook_received': ['payment_validated', 'invoice_generated']
    };
  }

  /**
   * Validate transition with fail-closed behavior
   */
  canTransition(currentState, nextState, paymentMode = 'MANUAL_CONFIRMATION') {
    // FAIL_CLOSED: State must be known
    if (!this.all_states.includes(currentState)) {
      return {
        allowed: false,
        reason: 'UNKNOWN_CURRENT_STATE',
        status: 'BLOCK'
      };
    }

    if (!this.all_states.includes(nextState)) {
      return {
        allowed: false,
        reason: 'UNKNOWN_NEXT_STATE',
        status: 'BLOCK'
      };
    }

    const transitions = paymentMode === 'MANUAL_CONFIRMATION' 
      ? this.getValidMVPTransitions()
      : this.getFutureReadyTransitions();

    const validNextStates = transitions[currentState] || [];

    if (!validNextStates.includes(nextState)) {
      return {
        allowed: false,
        reason: 'INVALID_STATE_TRANSITION',
        status: 'HOLD',
        current: currentState,
        requested: nextState,
        valid_next: validNextStates
      };
    }

    // FAIL_CLOSED: Booking confirmed only after payment validated
    if (nextState === 'booking_confirmed' && currentState !== 'receipt_generated') {
      return {
        allowed: false,
        reason: 'BOOKING_CONFIRMED_WITHOUT_RECEIPT',
        status: 'BLOCK'
      };
    }

    return {
      allowed: true,
      reason: 'VALID_TRANSITION',
      status: 'PROCEED'
    };
  }

  /**
   * Is this state a fail state?
   */
  isFailState(state) {
    return this.fail_states.includes(state);
  }

  /**
   * Is this state part of active MVP?
   */
  isActiveMVPState(state) {
    return this.active_mvp_states.includes(state);
  }

  /**
   * Get all valid terminal states (no further transitions)
   */
  getTerminalStates() {
    return ['service_completed', 'refund_completed', ...this.fail_states];
  }
}

module.exports = { PaymentStateMachine };
