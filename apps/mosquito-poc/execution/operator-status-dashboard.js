/**
 * Operator Status Dashboard
 * 
 * Provides operational status visibility without allowing unsafe overrides.
 * Returns current state, reason codes, missing requirements, next allowed actions.
 */

class OperatorStatusDashboard {
  constructor() {
    this.schema_version = '1.0.0';
  }

  /**
   * Get comprehensive operational status
   */
  getOperationalStatus(input) {
    const {
      case_id,
      current_state,
      payment_status,
      booking_id,
      contractor_assigned,
      service_completed
    } = input;

    if (!case_id || !current_state) {
      return {
        valid: false,
        error: 'case_id and current_state required'
      };
    }

    // Determine missing requirements
    const missingRequirements = this.determineMissingRequirements({
      current_state,
      payment_status,
      booking_id,
      contractor_assigned,
      service_completed
    });

    // Determine next allowed actions
    const nextActions = this.getNextAllowedActions(current_state);

    return {
      valid: true,
      case_id,
      current_state,
      status: 'OPERATIONAL_STATUS_PROVIDED',
      current_substatus: this.getSubstatus(input),
      missing_requirements: missingRequirements,
      next_allowed_actions: nextActions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Determine missing requirements based on current state
   */
  determineMissingRequirements(input) {
    const missing = [];

    if (input.current_state === 'booking_slot_selected' && !input.booking_id) {
      missing.push('booking_id');
    }

    if (input.current_state === 'manual_payment_requested' && input.payment_status !== 'payment_pending') {
      missing.push('payment_initiated');
    }

    if (input.current_state === 'contractor_notified' && !input.contractor_assigned) {
      missing.push('contractor_assignment');
    }

    if (input.current_state === 'post_service_followup_sent' && !input.service_completed) {
      missing.push('service_completion_confirmation');
    }

    return missing;
  }

  /**
   * Get next allowed actions from current state
   */
  getNextAllowedActions(currentState) {
    const transitions = {
      'lead_created': ['gate_passed'],
      'gate_passed': ['whatsapp_handoff_created'],
      'whatsapp_handoff_created': ['booking_options_sent'],
      'booking_options_sent': ['booking_slot_selected'],
      'booking_slot_selected': ['slot_locked', 'manual_payment_requested'],
      'slot_locked': ['manual_payment_requested'],
      'manual_payment_requested': ['payment_proof_received'],
      'payment_proof_received': ['payment_validated'],
      'payment_validated': ['invoice_receipt_ready', 'contractor_notified'],
      'invoice_receipt_ready': ['contractor_notified'],
      'contractor_notified': ['service_scheduled'],
      'service_scheduled': ['service_completed'],
      'service_completed': ['post_service_followup_sent'],
      'post_service_followup_sent': ['seasonal_refill_reminder_scheduled']
    };

    return transitions[currentState] || [];
  }

  /**
   * Get substatus based on payment and booking state
   */
  getSubstatus(input) {
    if (input.payment_status === 'payment_failed') {
      return 'WAITING_FOR_PAYMENT_RESUBMISSION';
    }

    if (input.service_completed) {
      return 'SERVICE_DELIVERED';
    }

    if (input.contractor_assigned) {
      return 'CONTRACTOR_ASSIGNED';
    }

    return 'IN_PROGRESS';
  }

  /**
   * Validate operator action request
   * FAIL_CLOSED: Unsafe actions blocked
   */
  validateOperatorAction(input) {
    const { action, current_state, case_id } = input;

    if (!action || !current_state) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['MISSING_ACTION_OR_STATE'],
        error: 'Action and current_state required'
      };
    }

    // FAIL_CLOSED: Block unsafe state overrides
    const blockedActions = [
      'BYPASS_GATE_VALIDATION',
      'SKIP_PAYMENT_VALIDATION',
      'FORCE_SKIP_CONTRACTOR_CHECK',
      'AUTO_CHARGE_CREDIT_CARD',
      'EXECUTE_AUTONOMOUS_REFUND',
      'ADAPTIVE_PRICING',
      'MANUAL_BOOKING_CONFIRMATION_WITHOUT_PAYMENT'
    ];

    if (blockedActions.includes(action)) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['UNSAFE_OPERATOR_ACTION'],
        error: `Action not allowed: ${action}`
      };
    }

    // Allowed operator actions
    const allowedActions = [
      'MANUAL_PAYMENT_CONFIRMATION',
      'MANUAL_CONTRACTOR_ASSIGNMENT',
      'SERVICE_COMPLETION_CONFIRMATION',
      'VIEW_STATUS',
      'VIEW_LOGS',
      'ESCALATE_TO_SUPERVISOR',
      'SEND_REMINDER'
    ];

    if (!allowedActions.includes(action)) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['UNKNOWN_ACTION'],
        error: `Unknown action: ${action}`
      };
    }

    return {
      valid: true,
      status: 'ACTION_ALLOWED',
      action,
      current_state,
      case_id
    };
  }
}

module.exports = { OperatorStatusDashboard };
