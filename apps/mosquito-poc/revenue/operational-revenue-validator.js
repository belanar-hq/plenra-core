/**
 * Operational Revenue Validator
 * 
 * Orchestrates all revenue validations with fail-closed behavior.
 * Unknown states always fail closed.
 */

const { ManualPaymentConfirmation } = require('./manual-payment-confirmation');
const { PaymentStateMachine } = require('./payment-state-machine');
const { AccountingEventSchema } = require('./accounting-event-schema');
const { BookingPaymentReconciliation } = require('./booking-payment-reconciliation');

class OperationalRevenueValidator {
  constructor() {
    this.manual_payment = new ManualPaymentConfirmation();
    this.state_machine = new PaymentStateMachine();
    this.accounting = new AccountingEventSchema();
    this.reconciliation = new BookingPaymentReconciliation();
    this.schema_version = '1.0.0';
  }

  /**
   * Comprehensive revenue operation validation
   * Fails closed on any unknown state or missing required data
   */
  validate(operationData) {
    const validationResult = {
      valid: false,
      status: 'HOLD',
      checks: [],
      reason_codes: []
    };

    // Check 1: Current state is known
    const stateCheck = this.validateStateKnown(operationData.current_state);
    validationResult.checks.push(stateCheck);
    if (!stateCheck.valid) {
      validationResult.reason_codes.push('UNKNOWN_STATE');
      return validationResult;
    }

    // Check 2: Transition is valid (if next_state provided)
    if (operationData.next_state) {
      const transitionCheck = this.validateTransition(operationData);
      validationResult.checks.push(transitionCheck);
      if (!transitionCheck.valid) {
        validationResult.reason_codes.push(transitionCheck.reason);
        validationResult.status = transitionCheck.status;
        return validationResult;
      }
    }

    // Check 3: No card data
    if (operationData.has_card_data || operationData.card_data) {
      validationResult.checks.push({
        check: 'card_data_check',
        valid: false,
        status: 'BLOCK',
        reason: 'CARD_DATA_DETECTED'
      });
      validationResult.reason_codes.push('CARD_DATA_DETECTED');
      validationResult.status = 'BLOCK';
      return validationResult;
    }

    // Check 4: No autonomous charging in MVP
    if (operationData.auto_charge_requested || operationData.autonomous_execution) {
      validationResult.checks.push({
        check: 'autonomous_charge_check',
        valid: false,
        status: 'BLOCK',
        reason: 'AUTO_CHARGE_NOT_ALLOWED_IN_MVP'
      });
      validationResult.reason_codes.push('AUTO_CHARGE_NOT_ALLOWED_IN_MVP');
      validationResult.status = 'BLOCK';
      return validationResult;
    }

    // Check 5: No adaptive pricing
    if (operationData.adaptive_pricing_enabled) {
      validationResult.checks.push({
        check: 'adaptive_pricing_check',
        valid: false,
        status: 'BLOCK',
        reason: 'ADAPTIVE_PRICING_NOT_ALLOWED'
      });
      validationResult.reason_codes.push('ADAPTIVE_PRICING_NOT_ALLOWED');
      validationResult.status = 'BLOCK';
      return validationResult;
    }

    // Check 6: No autonomous refunds
    if (operationData.autonomous_refund_execution) {
      validationResult.checks.push({
        check: 'autonomous_refund_check',
        valid: false,
        status: 'BLOCK',
        reason: 'AUTONOMOUS_REFUND_NOT_ALLOWED'
      });
      validationResult.reason_codes.push('AUTONOMOUS_REFUND_NOT_ALLOWED');
      validationResult.status = 'BLOCK';
      return validationResult;
    }

    // Check 7: Booking exists
    if (operationData.booking_id) {
      const bookingCheck = {
        check: 'booking_exists',
        valid: operationData.booking_id ? true : false,
        status: operationData.booking_id ? 'PASS' : 'BLOCK',
        reason: operationData.booking_id ? '' : 'BOOKING_ID_REQUIRED'
      };
      validationResult.checks.push(bookingCheck);
      if (!bookingCheck.valid) {
        validationResult.reason_codes.push(bookingCheck.reason);
        validationResult.status = 'BLOCK';
        return validationResult;
      }
    }

    // Check 8: Manual payment proof if mode is MANUAL_CONFIRMATION
    if (operationData.payment_mode === 'MANUAL_CONFIRMATION') {
      const proofCheck = this.manual_payment.validateProof(operationData.payment || {});
      validationResult.checks.push({
        check: 'manual_proof',
        valid: proofCheck.valid,
        status: proofCheck.status
      });
      if (!proofCheck.valid) {
        validationResult.reason_codes.push(...proofCheck.reason_codes);
        validationResult.status = proofCheck.status;
      }
    }

    // If any check failed, return fail-closed
    const hasFailed = validationResult.checks.some(c => c.valid === false);
    if (hasFailed) {
      validationResult.valid = false;
      return validationResult;
    }

    validationResult.valid = true;
    validationResult.status = 'PASS';
    return validationResult;
  }

  /**
   * Check that current state is known
   */
  validateStateKnown(state) {
    const known = this.state_machine.all_states.includes(state);
    return {
      check: 'state_known',
      valid: known,
      status: known ? 'PASS' : 'BLOCK',
      reason: known ? '' : 'UNKNOWN_REVENUE_STATE'
    };
  }

  /**
   * Check that transition is valid
   */
  validateTransition(operationData) {
    const transition = this.state_machine.canTransition(
      operationData.current_state,
      operationData.next_state,
      operationData.payment_mode || 'MANUAL_CONFIRMATION'
    );

    return {
      check: 'valid_transition',
      valid: transition.allowed,
      status: transition.status,
      reason: transition.reason
    };
  }

  /**
   * Reject free text source of truth
   */
  validateNoFreeTextTruth(eventData) {
    const freeTextCheck = this.accounting.rejectFreeTextSourceOfTruth(eventData);
    return {
      check: 'no_free_text_source_of_truth',
      valid: freeTextCheck.valid,
      status: freeTextCheck.status,
      reason_codes: freeTextCheck.reason_codes
    };
  }
}

module.exports = { OperationalRevenueValidator };
