/**
 * Morning Adapter
 * 
 * Normalizes Morning/Green Invoice/חשבונית ירוקה provider references.
 * Treats all three as the same provider system: Morning.
 */

class MorningAdapter {
  constructor() {
    this.canonical_provider = 'Morning';
    this.aliases = [
      'morning',
      'green invoice',
      'green_invoice',
      'חשבונית ירוקה'
    ];
  }

  /**
   * Check if provider is a Morning alias
   */
  isMorningProvider(provider) {
    if (!provider) return false;
    return this.aliases.includes(String(provider).toLowerCase().trim());
  }

  /**
   * Normalize to canonical provider
   */
  normalize(provider) {
    if (this.isMorningProvider(provider)) {
      return this.canonical_provider;
    }
    return provider;
  }

  /**
   * Create invoice via Morning (future-ready contract)
   * Currently INACTIVE - no real API calls
   */
  createInvoiceContract(invoiceData) {
    return {
      contract_name: 'morning_create_invoice',
      status: 'FUTURE_READY_ONLY',
      active_now: false,
      schema: {
        invoice_id: { type: 'string', required: true },
        booking_id: { type: 'string', required: true },
        amount: { type: 'number', required: true },
        vat_rate: { type: 'number', required: true },
        customer_name: { type: 'string', required: false },
        customer_email: { type: 'string', required: false },
        customer_phone: { type: 'string', required: false },
        issue_date: { type: 'string', required: true },
        due_date: { type: 'string', required: false }
      }
    };
  }

  /**
   * Get invoice status via Morning (future-ready contract)
   * Currently INACTIVE - no real API calls
   */
  getInvoiceStatusContract(invoiceId) {
    return {
      contract_name: 'morning_get_invoice_status',
      status: 'FUTURE_READY_ONLY',
      active_now: false,
      invoice_id: invoiceId,
      query_fields: ['status', 'paid_date', 'payment_method', 'payment_id']
    };
  }

  /**
   * Validate invoice data shape
   */
  validateInvoiceData(invoiceData) {
    const required = [
      'invoice_id',
      'booking_id',
      'amount',
      'vat_rate',
      'issue_date'
    ];

    const missing = required.filter(f => !invoiceData[f]);
    if (missing.length > 0) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['MISSING_REQUIRED_FIELDS'],
        missing_fields: missing
      };
    }

    return {
      valid: true,
      status: 'VALID'
    };
  }

  /**
   * Get all Morning aliases for documentation
   */
  getAllAliases() {
    return {
      canonical: this.canonical_provider,
      aliases: this.aliases,
      normalization_rule: 'All aliases normalize to "Morning"'
    };
  }
}

module.exports = { MorningAdapter };
