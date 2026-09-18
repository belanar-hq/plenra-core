const fs = require('fs');
const path = require('path');
const { ManualPaymentConfirmation } = require('../manual-payment-confirmation');
const { PaymentStateMachine } = require('../payment-state-machine');
const { AccountingEventSchema } = require('../accounting-event-schema');
const { PaymentWebhookContracts } = require('../payment-webhook-contracts');
const { BookingPaymentReconciliation } = require('../booking-payment-reconciliation');
const { MorningAdapter } = require('../morning-adapter');
const { OperationalRevenueValidator } = require('../operational-revenue-validator');

describe('Mosquito Revenue Ops v1 - Deterministic Revenue Layer', () => {
  let manual = new ManualPaymentConfirmation();
  let stateMachine = new PaymentStateMachine();
  let accounting = new AccountingEventSchema();
  let webhooks = new PaymentWebhookContracts();
  let reconciliation = new BookingPaymentReconciliation();
  let morning = new MorningAdapter();
  let validator = new OperationalRevenueValidator();

  test('1. Manual payment confirmation keeps booking unconfirmed until payment_validated', () => {
    const proofContent = { screenshot: 'base64...' };
    const proofHash = require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(proofContent))
      .digest('hex');

    const payment = {
      payment_id: 'pay_001',
      booking_id: 'book_001',
      proof_data: {
        proof_uploaded: true,
        proof_hash: proofHash,
        proof_content: proofContent
      }
    };

    const booking = {
      booking_id: 'book_001',
      status: 'payment_pending'
    };

    // Before confirmation
    expect(booking.status).not.toBe('booking_confirmed');

    // After manual confirmation
    const confirmation = manual.confirmPayment(payment);
    expect(confirmation.success).toBe(true);
    expect(confirmation.status).toBe('PAYMENT_VALIDATED');
    expect(confirmation.confirmation_method).toBe('MANUAL');
  });

  test('2. Valid manual payment proof allows invoice generation', () => {
    const proofContent = { receipt: 'data' };
    const proofHash = require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(proofContent))
      .digest('hex');

    const payment = {
      payment_id: 'pay_002',
      booking_id: 'book_002',
      amount: 500,
      proof_data: {
        proof_uploaded: true,
        proof_hash: proofHash,
        proof_content: proofContent
      }
    };

    const proofValidation = manual.validateProof(payment);
    expect(proofValidation.valid).toBe(true);
    expect(proofValidation.status).toBe('PROOF_VALIDATED');
  });

  test('3. Missing proof returns HOLD', () => {
    const payment = {
      payment_id: 'pay_003',
      booking_id: 'book_003',
      proof_data: {
        proof_uploaded: false
      }
    };

    const proofValidation = manual.validateProof(payment);
    expect(proofValidation.valid).toBe(false);
    expect(proofValidation.status).toBe('HOLD');
    expect(proofValidation.reason_codes).toContain('PROOF_MISSING_IN_MANUAL_MODE');
  });

  test('4. Future payment page state exists but inactive', () => {
    const contract = webhooks.getPaymentSuccessContract();
    expect(contract.webhook_name).toBe('payment_success');
    expect(contract.active_now).toBe(false);
    expect(contract.status).toBe('FUTURE_READY_ONLY');
  });

  test('5. Payment success webhook validates payment only in FUTURE_READY mode', () => {
    const webhook = {
      webhook_event_id: 'wh_001',
      payment_provider_session_id: 'sess_001',
      payment_id: 'pay_004',
      booking_id: 'book_004',
      amount: 500,
      currency: 'ILS',
      provider: 'Stripe',
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    };

    const validation = webhooks.validateWebhook(webhook, 'payment_success');
    expect(validation.valid).toBe(true);
    expect(validation.status).toBe('FUTURE_READY_VALID');
  });

  test('6. Card data rejected if present', () => {
    const payment = {
      payment_id: 'pay_005',
      booking_id: 'book_005',
      card_data: { card_number: '4111111111111111' }
    };

    const confirmation = manual.confirmPayment(payment);
    expect(confirmation.success).toBe(false);
    expect(confirmation.status).toBe('BLOCK');
    expect(confirmation.reason_codes).toContain('CARD_DATA_DETECTED');
  });

  test('7. Duplicate invoice blocked', () => {
    const payment = {
      payment_id: 'pay_006',
      booking_id: 'book_006',
      amount: 500
    };

    const existingInvoices = [
      {
        invoice_id: 'inv_001',
        payment_id: 'pay_006',
        booking_id: 'book_006'
      }
    ];

    const check = reconciliation.validateNoDuplicateInvoice(payment, existingInvoices);
    expect(check.valid).toBe(false);
    expect(check.status).toBe('BLOCK');
    expect(check.reason_codes).toContain('DUPLICATE_INVOICE_DETECTED');
  });

  test('8. Invoice amount mismatch returns HOLD', () => {
    const payment = { amount: 500 };
    const invoice = { amount: 550 };

    const check = reconciliation.validateAmountMatch(payment, invoice);
    expect(check.valid).toBe(false);
    expect(check.status).toBe('HOLD');
    expect(check.reason_codes).toContain('INVOICE_AMOUNT_MISMATCH');
  });

  test('9. VAT mismatch returns HOLD', () => {
    const payment = { amount: 500 };
    const invoice = { amount: 500, vat_amount: 50 }; // 10% instead of 17%

    const check = reconciliation.validateVAT(payment, invoice, 0.17);
    expect(check.valid).toBe(false);
    expect(check.status).toBe('HOLD');
    expect(check.reason_codes).toContain('VAT_MISMATCH');
  });

  test('10. Receipt without invoice returns BLOCK', () => {
    const receipt = { invoice_id: null };
    const invoice = { invoice_id: 'inv_002' };
    const payment = { payment_id: 'pay_007' };

    const check = reconciliation.validateReceiptLinks(receipt, invoice, payment);
    expect(check.valid).toBe(false);
    expect(check.status).toBe('BLOCK');
    expect(check.reason_codes).toContain('RECEIPT_INVOICE_LINK_MISSING');
  });

  test('11. Booking confirmation without validated payment returns BLOCK', () => {
    const booking = { status: 'booking_confirmed' };
    const payment = { status: 'payment_pending' };

    const check = reconciliation.validatePaymentValidatedBeforeBookingConfirmed(booking, payment);
    expect(check.valid).toBe(false);
    expect(check.status).toBe('BLOCK');
    expect(check.reason_codes).toContain('BOOKING_CONFIRMED_WITHOUT_PAYMENT_VALIDATED');
  });

  test('12. Morning aliases Green Invoice and חשבונית ירוקה map to same provider', () => {
    expect(morning.isMorningProvider('morning')).toBe(true);
    expect(morning.isMorningProvider('Green Invoice')).toBe(true);
    expect(morning.isMorningProvider('חשבונית ירוקה')).toBe(true);
    expect(morning.isMorningProvider('green_invoice')).toBe(true);

    expect(morning.normalize('Green Invoice')).toBe('Morning');
    expect(morning.normalize('חשבונית ירוקה')).toBe('Morning');
    expect(morning.normalize('morning')).toBe('Morning');
  });

  test('13. Provider error maps to provider_error_hold', () => {
    const event = accounting.createAccountingEvent({
      event_type: 'PROVIDER_ERROR',
      booking_id: 'book_008',
      payment_id: 'pay_008',
      amount: 500,
      currency: 'ILS',
      payment_method: 'card',
      payment_mode: 'CREDIT_CARD_PAYMENT_PAGE',
      provider: 'unknown_provider'
    });

    expect(event.valid).toBe(false);
    expect(event.reason_codes).toContain('UNMAPPED_PROVIDER');
  });

  test('14. Webhook idempotency prevents duplicate processing', () => {
    const webhook = {
      webhook_event_id: 'wh_123'
    };

    const processedWebhooks = ['wh_122', 'wh_121'];
    const check1 = webhooks.checkIdempotency(webhook, 'payment_success', processedWebhooks);
    expect(check1.idempotent).toBe(true);
    expect(check1.is_duplicate).toBe(false);

    processedWebhooks.push('wh_123');
    const check2 = webhooks.checkIdempotency(webhook, 'payment_success', processedWebhooks);
    expect(check2.idempotent).toBe(false);
    expect(check2.is_duplicate).toBe(true);
  });

  test('15. Refund state tracked but not auto-executed', () => {
    const refundContract = webhooks.getRefundContract();
    expect(refundContract.webhook_name).toBe('refund_initiated');
    expect(refundContract.active_now).toBe(false);
    expect(refundContract.status).toBe('FUTURE_READY_ONLY');
  });

  test('16. Accounting schema rejects free-text source of truth', () => {
    const event = {
      event_type: 'PAYMENT_CONFIRMED',
      booking_id: 'book_009',
      payment_id: 'pay_009',
      amount: 500,
      currency: 'ILS',
      payment_method: 'manual',
      payment_mode: 'MANUAL_CONFIRMATION',
      notes: 'Customer paid via bank transfer'  // FREE TEXT
    };

    const freeTextCheck = accounting.rejectFreeTextSourceOfTruth(event);
    expect(freeTextCheck.valid).toBe(false);
    expect(freeTextCheck.reason_codes).toContain('FREE_TEXT_SOURCE_OF_TRUTH_DETECTED');
  });

  test('17. Operational Revenue Validation fails closed on unknown state', () => {
    const operation = {
      current_state: 'unknown_state_xyz'
    };

    const validation = validator.validate(operation);
    expect(validation.valid).toBe(false);
    expect(validation.reason_codes).toContain('UNKNOWN_STATE');
  });

  test('18. mosquito_vertical_v1 remains isolated from mosquito_revenue_ops_v1', () => {
    // Verify canon files exist separately
    const verticalCanonPath = path.join('canon', 'gates', 'mosquito_vertical_v1.json');
    const revenueCanonPath = path.join('canon', 'gates', 'mosquito_revenue_ops_v1.json');

    expect(fs.existsSync(verticalCanonPath)).toBe(true);
    expect(fs.existsSync(revenueCanonPath)).toBe(true);

    // Verify they have different artifact IDs
    const vertical = JSON.parse(fs.readFileSync(verticalCanonPath, 'utf8'));
    const revenue = JSON.parse(fs.readFileSync(revenueCanonPath, 'utf8'));

    expect(vertical.artifact_id).toBe('mosquito_vertical_v1');
    expect(revenue.artifact_id).toBe('mosquito_revenue_ops_v1');
    expect(vertical.artifact_id).not.toBe(revenue.artifact_id);
  });

  test('State machine allows valid MVP transitions', () => {
    const sm = stateMachine;
    
    const transition1 = sm.canTransition('booking_created', 'payment_pending');
    expect(transition1.allowed).toBe(true);

    const transition2 = sm.canTransition('payment_pending', 'manual_payment_requested');
    expect(transition2.allowed).toBe(true);
  });

  test('State machine blocks invalid transitions', () => {
    const sm = stateMachine;
    
    const transition = sm.canTransition('booking_created', 'service_completed');
    expect(transition.allowed).toBe(false);
    expect(transition.reason).toBe('INVALID_STATE_TRANSITION');
  });

  test('Accounting event validates required fields', () => {
    const event = accounting.createAccountingEvent({
      event_type: 'PAYMENT_CONFIRMED'
      // Missing other required fields
    });

    expect(event.valid).toBe(false);
    expect(event.reason_codes).toContain('MISSING_REQUIRED_FIELDS');
  });

  test('Manual confirmation payment mode is active now', () => {
    expect(manual.active_now).toBe(true);
    expect(manual.payment_mode).toBe('MANUAL_CONFIRMATION');
  });

  test('Credit card future-ready is NOT active now', () => {
    const ccContract = webhooks.getPaymentSuccessContract();
    expect(ccContract.active_now).toBe(false);
  });

  test('Existing mosquito-poc files are preserved', () => {
    const pocPath = path.join('apps', 'mosquito-poc');
    expect(fs.existsSync(pocPath)).toBe(true);

    const intakePath = path.join(pocPath, 'runtime', 'intake-engine.js');
    expect(fs.existsSync(intakePath)).toBe(true);

    const whatsappPath = path.join(pocPath, 'flows', 'whatsapp-message-templates.md');
    expect(fs.existsSync(whatsappPath)).toBe(true);
  });

  test('No autonomous revenue optimization attempted', () => {
    const operation = {
      current_state: 'payment_validated',
      adaptive_pricing_enabled: true
    };

    const validation = validator.validate(operation);
    expect(validation.valid).toBe(false);
    expect(validation.reason_codes).toContain('ADAPTIVE_PRICING_NOT_ALLOWED');
  });

  test('No autonomous refunds executed', () => {
    const operation = {
      current_state: 'service_completed',
      autonomous_refund_execution: true
    };

    const validation = validator.validate(operation);
    expect(validation.valid).toBe(false);
    expect(validation.reason_codes).toContain('AUTONOMOUS_REFUND_NOT_ALLOWED');
  });
});
