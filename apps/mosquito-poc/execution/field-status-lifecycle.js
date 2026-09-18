/**
 * Field Status Lifecycle
 * 
 * Manages valid state transitions for operational lifecycle.
 * Illegal transitions blocked, missing dependencies return HOLD.
 */

class FieldStatusLifecycle {
  constructor(storageAdapter = null) {
    this.schema_version = '1.0.0';
    this.storageAdapter = storageAdapter;
    
    // All valid operational states
    this.valid_states = [
      'lead_created',
      'gate_passed',
      'whatsapp_handoff_created',
      'booking_options_sent',
      'booking_slot_selected',
      'slot_locked',
      'manual_payment_requested',
      'payment_proof_received',
      'payment_validated',
      'invoice_receipt_ready',
      'contractor_notified',
      'service_scheduled',
      'service_completed',
      'post_service_followup_sent',
      'seasonal_refill_reminder_scheduled',
      'HOLD',
      'BLOCK'
    ];

    // Valid transitions
    this.valid_transitions = {
      'lead_created': ['gate_passed', 'HOLD', 'BLOCK'],
      'gate_passed': ['whatsapp_handoff_created', 'HOLD', 'BLOCK'],
      'whatsapp_handoff_created': ['booking_options_sent', 'HOLD', 'BLOCK'],
      'booking_options_sent': ['booking_slot_selected', 'HOLD', 'BLOCK'],
      'booking_slot_selected': ['slot_locked', 'manual_payment_requested', 'HOLD', 'BLOCK'],
      'slot_locked': ['manual_payment_requested', 'HOLD', 'BLOCK'],
      'manual_payment_requested': ['payment_proof_received', 'HOLD', 'BLOCK'],
      'payment_proof_received': ['payment_validated', 'HOLD', 'BLOCK'],
      'payment_validated': ['invoice_receipt_ready', 'contractor_notified', 'HOLD', 'BLOCK'],
      'invoice_receipt_ready': ['contractor_notified', 'HOLD', 'BLOCK'],
      'contractor_notified': ['service_scheduled', 'HOLD', 'BLOCK'],
      'service_scheduled': ['service_completed', 'HOLD', 'BLOCK'],
      'service_completed': ['post_service_followup_sent', 'HOLD', 'BLOCK'],
      'post_service_followup_sent': ['seasonal_refill_reminder_scheduled', 'HOLD', 'BLOCK'],
      'seasonal_refill_reminder_scheduled': ['HOLD', 'BLOCK'],
      'HOLD': ['lead_created', 'HOLD'],
      'BLOCK': ['HOLD']
    };
  }

  /**
   * Validate field status transition
   * FAIL_CLOSED: Illegal transitions blocked
   */
  validateFieldStatusTransition(input) {
    const { current_state, next_state, case_id } = input;

    if (!current_state || !next_state) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['MISSING_STATE'],
        error: 'current_state and next_state required'
      };
    }

    // Check states are known
    if (!this.valid_states.includes(current_state)) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['UNKNOWN_CURRENT_STATE'],
        error: `Unknown current state: ${current_state}`
      };
    }

    if (!this.valid_states.includes(next_state)) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['UNKNOWN_NEXT_STATE'],
        error: `Unknown next state: ${next_state}`
      };
    }

    // Check transition is valid
    const allowedNextStates = this.valid_transitions[current_state];

    if (!allowedNextStates || !allowedNextStates.includes(next_state)) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['ILLEGAL_STATE_TRANSITION'],
        current_state,
        next_state,
        allowed_next_states: allowedNextStates,
        error: `Illegal transition from ${current_state} to ${next_state}`
      };
    }

    // Check required dependencies
    const dependencyCheck = this.checkDependencies(current_state, next_state, input);

    if (!dependencyCheck.valid) {
      return {
        valid: false,
        status: dependencyCheck.status,
        reason_codes: dependencyCheck.reason_codes,
        error: dependencyCheck.error
      };
    }

    return {
      valid: true,
      status: 'VALID_TRANSITION',
      current_state,
      next_state,
      case_id
    };
  }

  /**
   * Check if all dependencies are met for transition
   */
  checkDependencies(currentState, nextState, input) {
    const dependencies = {
      'manual_payment_requested': {
        required: ['booking_id', 'slot_locked'],
        message: 'Booking must exist and slot must be locked before requesting payment'
      },
      'payment_validated': {
        required: ['payment_proof', 'payment_status'],
        message: 'Payment proof must exist and payment status must be validated'
      },
      'contractor_notified': {
        required: ['payment_validated', 'contractor_id'],
        message: 'Payment must be validated before notifying contractor'
      },
      'service_completed': {
        required: ['contractor_assigned', 'service_slot'],
        message: 'Contractor must be assigned and service slot must exist'
      },
      'post_service_followup_sent': {
        required: ['service_completed'],
        message: 'Service must be completed before follow-up'
      }
    };

    const deps = dependencies[nextState];

    if (!deps) {
      return { valid: true };
    }

    // Check if required fields are present in input
    const missing = deps.required.filter(field => !input[field]);

    if (missing.length > 0) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['MISSING_REQUIRED_DEPENDENCY'],
        missing_fields: missing,
        error: deps.message
      };
    }

    return { valid: true };
  }

  /**
   * Transition field status
   */
  transitionFieldStatus(input) {
    const validation = this.validateFieldStatusTransition(input);

    if (!validation.valid) {
      return validation;
    }

    return {
      success: true,
      status: 'FIELD_STATUS_TRANSITIONED',
      from_state: input.current_state,
      to_state: input.next_state,
      case_id: input.case_id,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get valid next states for current state
   */
  getValidNextStates(currentState) {
    return this.valid_transitions[currentState] || [];
  }

  /**
   * Check if state is a terminal state
   */
  isTerminalState(state) {
    const terminalStates = [
      'seasonal_refill_reminder_scheduled',
      'BLOCK',
      'HOLD'
    ];

    return terminalStates.includes(state);
  }
}

module.exports = { FieldStatusLifecycle };
