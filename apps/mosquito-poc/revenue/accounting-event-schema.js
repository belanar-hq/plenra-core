const crypto = require('crypto');

/**
 * Accounting Event Schema
 * 
 * Deterministic schema for revenue operations.
 * STRICT RULE: No free text as source of truth.
 * All events are immutable, hashed, and linked to canonical sources.
 */

class AccountingEventSchema {
  constructor() {
    this.schema_version = '1.0.0';
  }

  /**
   * Create a normalized provider alias
   * Treat Morning, Green Invoice, חשבונית ירוקה as same provider
   */
  normalizeProvider(provider) {
    const normalized = String(provider || '').toLowerCase().trim();
    
    if (normalized === 'green invoice' ||
        normalized === 'חשבונית ירוקה' ||
        normalized === 'green_invoice' ||
        normalized === 'morning') {
      return 'Morning';
    }

    // Unknown providers must be held for manual review
    if (!['bit', 'paybox', 'credit_card', 'manual'].includes(normalized)) {
      return null; // Invalid provider
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  /**
   * Create accounting event with required fields
   * Fails closed if any required field missing or invalid
   */
  createAccountingEvent(eventData) {
    // FAIL_CLOSED: All required fields must be present
    const requiredFields = [
      'event_type',
      'booking_id',
      'payment_id',
      'amount',
      'currency',
      'payment_method',
      'payment_mode'
    ];

    const missingFields = requiredFields.filter(f => !eventData[f]);
    if (missingFields.length > 0) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['MISSING_REQUIRED_FIELDS'],
        missing_fields: missingFields
      };
    }

    // Normalize provider with strict rules
    const normalizedProvider = this.normalizeProvider(eventData.provider);
    if (eventData.provider && !normalizedProvider) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['UNMAPPED_PROVIDER'],
        provided_provider: eventData.provider
      };
    }

    // STRICT: No free text source of truth - only structured data
    const structuredEventData = {
      event_id: eventData.event_id || require('uuid').v4(),
      schema_version: this.schema_version,
      event_type: eventData.event_type,
      booking_id: eventData.booking_id,
      mosquito_case_id: eventData.mosquito_case_id || null,
      payment_id: eventData.payment_id,
      invoice_id: eventData.invoice_id || null,
      receipt_id: eventData.receipt_id || null,
      amount: eventData.amount,
      vat_amount: eventData.vat_amount || 0,
      currency: eventData.currency,
      payment_method: eventData.payment_method,
      payment_mode: eventData.payment_mode,
      provider: normalizedProvider,
      provider_alias: eventData.provider, // Store original for reference
      proof_hash: eventData.proof_hash || null,
      webhook_event_id: eventData.webhook_event_id || null,
      status: eventData.status || 'PENDING',
      reason_codes: eventData.reason_codes || [],
      created_at: new Date().toISOString(),
      lineage: eventData.lineage || []
    };

    // Create immutable hash of event
    const eventHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(structuredEventData))
      .digest('hex');

    return {
      valid: true,
      status: 'VALID',
      event: structuredEventData,
      event_hash: eventHash
    };
  }

  /**
   * Validate accounting event against schema
   */
  validateEvent(event) {
    const errors = [];

    // Type validation
    if (!['PAYMENT_CONFIRMED', 'INVOICE_GENERATED', 'RECEIPT_GENERATED', 'REFUND_INITIATED', 'PROVIDER_ERROR'].includes(event.event_type)) {
      errors.push('INVALID_EVENT_TYPE');
    }

    // Amount validation
    if (typeof event.amount !== 'number' || event.amount <= 0) {
      errors.push('INVALID_AMOUNT');
    }

    // VAT validation
    if (typeof event.vat_amount !== 'number' || event.vat_amount < 0) {
      errors.push('INVALID_VAT_AMOUNT');
    }

    // Currency validation
    if (event.currency !== 'ILS') {
      errors.push('UNSUPPORTED_CURRENCY');
    }

    // Provider validation if present
    if (event.provider && !['Morning', 'Bit', 'Paybox', 'Credit_card', 'Manual'].includes(event.provider)) {
      errors.push('UNMAPPED_PROVIDER');
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors
      };
    }

    return {
      valid: true,
      errors: []
    };
  }

  /**
   * STRICT: Free text detection
   * Accounting schema rejects free-text source of truth
   */
  hasFreeText(event) {
    const freeTextFields = ['notes', 'description', 'comment', 'admin_notes'];
    return freeTextFields.some(field => 
      event[field] && typeof event[field] === 'string' && event[field].length > 0
    );
  }

  /**
   * Validate no free text used as source of truth
   */
  rejectFreeTextSourceOfTruth(event) {
    if (this.hasFreeText(event)) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['FREE_TEXT_SOURCE_OF_TRUTH_DETECTED']
      };
    }
    return { valid: true };
  }
}

module.exports = { AccountingEventSchema };
