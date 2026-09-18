const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Manual Payment Confirmation Handler
 * 
 * Active NOW in MVP.
 * - Customer uploads payment proof (screenshot/receipt)
 * - System validates proof hash and presence
 * - Manual admin confirmation triggers invoice generation
 * - NO real card charging, NO PCI handling
 */

class ManualPaymentConfirmation {
  constructor() {
    this.schema_version = '1.0.0';
    this.payment_mode = 'MANUAL_CONFIRMATION';
    this.active_now = true;
  }

  /**
   * Validate proof upload and hash
   * Fails closed if proof missing or hash mismatches
   */
  validateProof(paymentRecord) {
    // FAIL_CLOSED: If proof missing in MANUAL_CONFIRMATION mode
    if (!paymentRecord.proof_data || !paymentRecord.proof_data.proof_uploaded) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['PROOF_MISSING_IN_MANUAL_MODE'],
        error: 'Manual confirmation requires payment proof upload'
      };
    }

    // If no proof_hash provided, calculate it
    let calculatedHash;
    if (paymentRecord.proof_data.proof_content) {
      calculatedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(paymentRecord.proof_data.proof_content))
        .digest('hex');
    }

    const providedHash = paymentRecord.proof_data.proof_hash;

    // Only validate hash if both provided hash and content exist
    if (providedHash && calculatedHash && providedHash !== calculatedHash) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['PAYMENT_PROOF_HASH_MISMATCH'],
        error: 'Proof hash validation failed'
      };
    }

    return {
      valid: true,
      status: 'PROOF_VALIDATED',
      proof_hash: providedHash || calculatedHash
    };
  }

  /**
   * Admin confirms payment after validating proof
   * This is deterministic and non-adaptive
   */
  confirmPayment(paymentRecord) {
    // FAIL_CLOSED: booking must exist
    if (!paymentRecord.booking_id) {
      return {
        success: false,
        status: 'BLOCK',
        reason_codes: ['BOOKING_ID_MISSING'],
        error: 'Cannot confirm payment without booking'
      };
    }

    // FAIL_CLOSED: No card data allowed (check FIRST before proof validation)
    if (paymentRecord.card_data || paymentRecord.pci_data) {
      return {
        success: false,
        status: 'BLOCK',
        reason_codes: ['CARD_DATA_DETECTED'],
        error: 'Card data detected - immediate block'
      };
    }

    // FAIL_CLOSED: No autonomous charging
    if (paymentRecord.auto_charge_requested || paymentRecord.autonomous_charge_attempt) {
      return {
        success: false,
        status: 'BLOCK',
        reason_codes: ['AUTO_CHARGE_ATTEMPTED_IN_MVP_NOW'],
        error: 'Autonomous charging not allowed in MVP'
      };
    }

    // Validate proof
    const proofValidation = this.validateProof(paymentRecord);
    if (!proofValidation.valid) {
      return {
        success: false,
        status: proofValidation.status,
        reason_codes: proofValidation.reason_codes,
        error: proofValidation.error
      };
    }

    return {
      success: true,
      status: 'PAYMENT_VALIDATED',
      confirmed_at: new Date().toISOString(),
      confirmation_method: 'MANUAL',
      payment_mode: this.payment_mode
    };
  }

  /**
   * Record manual confirmation event
   */
  recordConfirmationEvent(paymentRecord, confirmationResult) {
    if (!confirmationResult.success) {
      return {
        event_recorded: false,
        reason: confirmationResult.reason_codes
      };
    }

    return {
      event_recorded: true,
      event_type: 'MANUAL_PAYMENT_CONFIRMED',
      payment_id: paymentRecord.payment_id,
      booking_id: paymentRecord.booking_id,
      timestamp: confirmationResult.confirmed_at,
      proof_hash: paymentRecord.proof_data.proof_hash
    };
  }
}

module.exports = { ManualPaymentConfirmation };
