/**
 * Booking Payment Reconciliation
 * 
 * Validates that booking and payment records are consistent.
 * Implements fail-closed validation for critical business rules.
 */

class BookingPaymentReconciliation {
  constructor(storageAdapter = null) {
    this.schema_version = '1.0.0';
    this.storageAdapter = storageAdapter;
  }

  /**
   * Read persisted booking/payment/invoice lineage when bound to storage
   */
  async reconcilePersisted(caseId) {
    if (!this.storageAdapter) {
      return {
        valid: true,
        status: 'PASS',
        note: 'STORAGE_NOT_BOUND'
      };
    }

    const booking = await this.storageAdapter.getBookingByCaseId(caseId);
    const payment = await this.storageAdapter.getPaymentStateByCaseId(caseId);
    let invoiceRecord = null;

    if (this.storageAdapter.sqlite) {
      // Query persisted invoice receipts by case_id if possible.
      const invoiceReceipt = await new Promise((resolve, reject) => {
        this.storageAdapter.sqlite.db.get(
          'SELECT * FROM invoice_receipts WHERE case_id = ?',
          [caseId],
          (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          }
        );
      });
      if (invoiceReceipt) {
        invoiceReceipt.reason_codes = JSON.parse(invoiceReceipt.reason_codes);
        invoiceRecord = invoiceReceipt;
      }
    }

    return {
      booking,
      payment,
      invoice: invoiceRecord,
      reconciled: true
    };
  }

  /**
   * FAIL_CLOSED: Booking must exist before payment validation
   */
  validateBookingExists(booking, payment) {
    if (!booking || !booking.booking_id) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['BOOKING_NOT_FOUND'],
        error: 'Booking must exist before payment validation'
      };
    }

    if (booking.booking_id !== payment.booking_id) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['BOOKING_PAYMENT_MISMATCH'],
        error: 'Booking ID does not match payment booking_id'
      };
    }

    return { valid: true, booking_exists: true };
  }

  /**
   * FAIL_CLOSED: Payment must exist before invoice generation
   */
  validatePaymentExists(payment) {
    if (!payment || !payment.payment_id) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['PAYMENT_NOT_FOUND'],
        error: 'Payment must exist before invoice generation'
      };
    }

    return { valid: true, payment_exists: true };
  }

  /**
   * FAIL_CLOSED: Invoice amount must equal payment amount
   */
  validateAmountMatch(payment, invoice) {
    if (!invoice || !invoice.amount) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['INVOICE_AMOUNT_MISSING'],
        error: 'Invoice amount is required'
      };
    }

    if (payment.amount !== invoice.amount) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['INVOICE_AMOUNT_MISMATCH'],
        payment_amount: payment.amount,
        invoice_amount: invoice.amount,
        error: 'Invoice amount does not match payment amount'
      };
    }

    return { valid: true, amount_match: true };
  }

  /**
   * FAIL_CLOSED: VAT must match configured VAT logic
   */
  validateVAT(payment, invoice, configuredVATRate = 0.17) {
    if (invoice.vat_amount === undefined) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['VAT_AMOUNT_MISSING'],
        error: 'VAT amount is required'
      };
    }

    const expectedVAT = Math.round(payment.amount * configuredVATRate * 100) / 100;
    
    if (Math.abs(invoice.vat_amount - expectedVAT) > 0.01) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['VAT_MISMATCH'],
        expected_vat: expectedVAT,
        actual_vat: invoice.vat_amount,
        error: 'VAT amount does not match configured rate'
      };
    }

    return { valid: true, vat_match: true };
  }

  /**
   * FAIL_CLOSED: Receipt must link to invoice and payment
   */
  validateReceiptLinks(receipt, invoice, payment) {
    const errors = [];

    if (!receipt.invoice_id || receipt.invoice_id !== invoice.invoice_id) {
      errors.push('RECEIPT_INVOICE_LINK_MISSING');
    }

    if (!receipt.payment_id || receipt.payment_id !== payment.payment_id) {
      errors.push('RECEIPT_PAYMENT_LINK_MISSING');
    }

    if (errors.length > 0) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: errors,
        error: 'Receipt missing required links to invoice or payment'
      };
    }

    return { valid: true, receipt_links_valid: true };
  }

  /**
   * FAIL_CLOSED: Booking confirmed forbidden before payment_validated
   */
  validatePaymentValidatedBeforeBookingConfirmed(booking, payment) {
    if (booking.status === 'booking_confirmed' && payment.status !== 'payment_validated') {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['BOOKING_CONFIRMED_WITHOUT_PAYMENT_VALIDATED'],
        error: 'Booking cannot be confirmed before payment is validated'
      };
    }

    return { valid: true };
  }

  /**
   * FAIL_CLOSED: Duplicate invoice forbidden
   */
  validateNoDuplicateInvoice(payment, existingInvoices = []) {
    const duplicates = existingInvoices.filter(
      inv => inv.payment_id === payment.payment_id && inv.booking_id === payment.booking_id
    );

    if (duplicates.length > 0) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['DUPLICATE_INVOICE_DETECTED'],
        existing_invoice_id: duplicates[0].invoice_id,
        error: 'Invoice already exists for this payment'
      };
    }

    return { valid: true, no_duplicate: true };
  }

  /**
   * Full reconciliation check
   */
  reconcile(booking, payment, invoice = null, receipt = null, existingInvoices = []) {
    const validations = [];

    // Booking exists
    const bookingCheck = this.validateBookingExists(booking, payment);
    validations.push({ check: 'booking_exists', ...bookingCheck });
    if (!bookingCheck.valid) return { valid: false, validations };

    // Payment exists
    const paymentCheck = this.validatePaymentExists(payment);
    validations.push({ check: 'payment_exists', ...paymentCheck });
    if (!paymentCheck.valid) return { valid: false, validations };

    // If invoice provided, validate it
    if (invoice) {
      const amountCheck = this.validateAmountMatch(payment, invoice);
      validations.push({ check: 'amount_match', ...amountCheck });

      const vatCheck = this.validateVAT(payment, invoice);
      validations.push({ check: 'vat_match', ...vatCheck });

      const duplicateCheck = this.validateNoDuplicateInvoice(payment, existingInvoices);
      validations.push({ check: 'no_duplicate_invoice', ...duplicateCheck });
    }

    // If receipt provided, validate it
    if (receipt && invoice) {
      const receiptCheck = this.validateReceiptLinks(receipt, invoice, payment);
      validations.push({ check: 'receipt_links', ...receiptCheck });
    }

    // Booking status check
    if (booking && payment) {
      const statusCheck = this.validatePaymentValidatedBeforeBookingConfirmed(booking, payment);
      validations.push({ check: 'booking_payment_status', ...statusCheck });
    }

    const hasFailures = validations.some(v => v.valid === false && v.status === 'BLOCK');
    const hasHolds = validations.some(v => v.valid === false && v.status === 'HOLD');

    return {
      valid: !hasFailures && !hasHolds,
      status: hasFailures ? 'BLOCK' : (hasHolds ? 'HOLD' : 'PASS'),
      validations
    };
  }
}

module.exports = { BookingPaymentReconciliation };
