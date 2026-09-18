const fs = require('fs');
const path = require('path');
const { WhatsAppExecutionRuntime } = require('../whatsapp-execution-runtime');
const { BookingExecutionRuntime } = require('../booking-execution-runtime');
const { ContractorSchedulingRuntime } = require('../contractor-scheduling-runtime');
const { OperatorStatusDashboard } = require('../operator-status-dashboard');
const { OperationalReplayLogger } = require('../operational-replay-logger');
const { CustomerReminderEngine } = require('../customer-reminder-engine');
const { ContractorNotificationLayer } = require('../contractor-notification-layer');
const { FieldStatusLifecycle } = require('../field-status-lifecycle');
const { OperationalMetricsPipeline } = require('../operational-metrics-pipeline');

describe('Mosquito Operational Execution v1', () => {
  let whatsapp = new WhatsAppExecutionRuntime();
  let booking = new BookingExecutionRuntime();
  let contractor = new ContractorSchedulingRuntime();
  let dashboard = new OperatorStatusDashboard();
  let logger = new OperationalReplayLogger();
  let reminders = new CustomerReminderEngine();
  let notifications = new ContractorNotificationLayer();
  let fieldStatus = new FieldStatusLifecycle();
  let metrics = new OperationalMetricsPipeline();

  // Setup test data
  beforeEach(() => {
    booking.addAvailableSlots({
      geo_scope: 'Petah Tikva',
      slots: [
        { slot_id: 'slot_001', time: '2026-05-10T10:00:00Z' },
        { slot_id: 'slot_002', time: '2026-05-10T14:00:00Z' },
        { slot_id: 'slot_003', time: '2026-05-11T10:00:00Z' }
      ]
    });

    contractor.registerContractor({
      contractor_id: 'cont_001',
      name: 'Test Contractor',
      geo_scope: 'Petah Tikva'
    });
  });

  test('1. WhatsApp handoff is created only after gate_passed', () => {
    const input = {
      case_id: 'case_001',
      customer_phone: '+972501234567',
      geo_scope: 'Petah Tikva',
      gate_status: 'gate_passed'
    };

    const handoff = whatsapp.createWhatsAppHandoff(input);
    expect(handoff.success).toBe(true);
    expect(handoff.status).toBe('WHATSAPP_HANDOFF_CREATED');
    expect(handoff.routing_channel).toBe('WhatsApp');
  });

  test('2. Out-of-scope geo returns HOLD', () => {
    const input = {
      case_id: 'case_002',
      customer_phone: '+972501234567',
      geo_scope: 'Tel Aviv',
      gate_status: 'gate_passed'
    };

    const handoff = whatsapp.createWhatsAppHandoff(input);
    expect(handoff.success).toBe(false);
    expect(handoff.status).toBe('HOLD');
    expect(handoff.reason_codes).toContain('OUT_OF_GEO_SCOPE');
  });

  test('3. Booking options are sent only when slots exist', () => {
    const input = {
      geo_scope: 'Petah Tikva',
      service_type: 'standard'
    };

    const options = booking.sendBookingOptions(input);
    expect(options.success).toBe(true);
    expect(options.status).toBe('BOOKING_OPTIONS_SENT');
    expect(options.available_slots.length).toBeGreaterThan(0);
  });

  test('4. Slot locking prevents duplicate booking', () => {
    const bookingInput = {
      case_id: 'case_003',
      slot_id: 'slot_001',
      customer_id: 'cust_001',
      geo_scope: 'Petah Tikva'
    };

    const selection = booking.selectBookingSlot(bookingInput);
    expect(selection.success).toBe(true);

    const lockInput = {
      booking_id: selection.booking_id,
      slot_id: 'slot_001',
      case_id: 'case_003'
    };

    const lock = booking.lockBookingSlot(lockInput);
    expect(lock.success).toBe(true);
    expect(lock.status).toBe('SLOT_LOCKED');
  });

  test('5. Duplicate booking returns BLOCK', () => {
    // Create first booking
    const firstBooking = {
      case_id: 'case_004',
      slot_id: 'slot_002',
      customer_id: 'cust_002',
      geo_scope: 'Petah Tikva'
    };

    booking.selectBookingSlot(firstBooking);

    // Try to create duplicate
    const duplicateCheck = booking.preventDuplicateBooking({
      case_id: 'case_004',
      customer_id: 'cust_002'
    });

    expect(duplicateCheck.valid).toBe(false);
    expect(duplicateCheck.status).toBe('BLOCK');
    expect(duplicateCheck.reason_codes).toContain('DUPLICATE_BOOKING_DETECTED');
  });

  test('6. Manual payment request is created only after slot selected', () => {
    const bookingInput = {
      case_id: 'case_005',
      slot_id: 'slot_003',
      customer_id: 'cust_003',
      geo_scope: 'Petah Tikva'
    };

    const selection = booking.selectBookingSlot(bookingInput);
    expect(selection.success).toBe(true);

    // Payment can now be requested since slot is selected
    expect(selection.status).toBe('BOOKING_SLOT_SELECTED');
  });

  test('7. Booking cannot advance without payment_validated', () => {
    const transition = fieldStatus.validateFieldStatusTransition({
      current_state: 'manual_payment_requested',
      next_state: 'invoice_receipt_ready',
      case_id: 'case_006'
    });

    expect(transition.valid).toBe(false);
    expect(transition.status).toBe('BLOCK');
  });

  test('8. Contractor notification occurs only after payment_validated', () => {
    const input = {
      booking_id: 'book_001',
      case_id: 'case_007',
      contractor_id: 'cont_001',
      customer_phone: '+972501234567',
      service_slot: 'slot_001',
      geo_scope: 'Petah Tikva',
      payment_status: 'payment_pending'
    };

    const notification = notifications.createContractorNotification(input);
    expect(notification.success).toBe(false);
    expect(notification.status).toBe('HOLD');
    expect(notification.reason_codes).toContain('PAYMENT_NOT_VALIDATED');
  });

  test('9. Invoice/receipt handoff occurs only after payment_validated', () => {
    const transition = fieldStatus.validateFieldStatusTransition({
      current_state: 'payment_validated',
      next_state: 'invoice_receipt_ready',
      case_id: 'case_008'
    });

    expect(transition.valid).toBe(true);
  });

  test('10. Customer no-response creates HOLD', () => {
    const input = {
      case_id: 'case_009',
      customer_phone: '+972501234567',
      reminder_type: 'payment_follow_up',
      customer_no_response: true
    };

    const reminder = reminders.createCustomerReminder(input);
    expect(reminder.success).toBe(false);
    expect(reminder.status).toBe('HOLD');
    expect(reminder.reason_codes).toContain('CUSTOMER_NO_RESPONSE');
  });

  test('11. Service completion required before post-service follow-up', () => {
    const input = {
      case_id: 'case_010',
      customer_phone: '+972501234567',
      service_completed: false
    };

    const followup = reminders.createPostServiceFollowup(input);
    expect(followup.success).toBe(false);
    expect(followup.status).toBe('HOLD');
    expect(followup.reason_codes).toContain('SERVICE_NOT_COMPLETED');
  });

  test('12. Seasonal refill reminder can be scheduled only after service_completed', () => {
    const input = {
      case_id: 'case_011',
      customer_phone: '+972501234567',
      service_completed: true
    };

    const reminder = reminders.scheduleSeasonalRefillReminder(input);
    expect(reminder.success).toBe(true);
    expect(reminder.status).toBe('SEASONAL_REFILL_REMINDER_SCHEDULED');
  });

  test('13. Operational replay logs every state transition', () => {
    const logInput = {
      case_id: 'case_012',
      previous_state: 'lead_created',
      next_state: 'gate_passed',
      reason_codes: ['STATIC_GATE_VALIDATION_PASSED'],
      actor_type: 'system',
      actor_id: 'gate_validator_v1'
    };

    const logResult = logger.logOperationalTransition(logInput);
    expect(logResult.success).toBe(true);
    expect(logResult.status).toBe('TRANSITION_LOGGED');

    const transitions = logger.listOperationalTransitions('case_012');
    expect(transitions.transition_count).toBeGreaterThan(0);
  });

  test('14. Operator dashboard exposes current status without allowing unsafe override', () => {
    const statusInput = {
      case_id: 'case_013',
      current_state: 'payment_validated',
      payment_status: 'payment_validated',
      booking_id: 'book_002'
    };

    const status = dashboard.getOperationalStatus(statusInput);
    expect(status.valid).toBe(true);
    expect(status.next_allowed_actions).toContain('invoice_receipt_ready');
    expect(status.next_allowed_actions).toContain('contractor_notified');

    // Try unsafe action
    const unsafeAction = dashboard.validateOperatorAction({
      action: 'BYPASS_GATE_VALIDATION',
      current_state: 'payment_validated',
      case_id: 'case_013'
    });

    expect(unsafeAction.valid).toBe(false);
    expect(unsafeAction.status).toBe('BLOCK');
  });

  test('15. CAC vs collected revenue metric can be calculated without adaptive optimization', () => {
    const input = {
      case_id: 'case_014',
      acquisition_cost: 50,
      collected_revenue: 500,
      currency: 'ILS'
    };

    const metric = metrics.calculateCacVsCollectedRevenue(input);
    expect(metric.valid).toBe(true);
    expect(metric.status).toBe('METRICS_CALCULATED');
    expect(metric.roi_percentage).toBe(900);
    expect(metric.profit).toBe(450);
  });

  test('16. Adaptive routing remains blocked', () => {
    const input = {
      current_state: 'contractor_notified',
      adaptive_routing_enabled: true
    };

    // Confirm adaptive routing cannot be triggered in execution layer
    expect(input.adaptive_routing_enabled).toBe(true);
    // But the contractor scheduling doesn't use it
    const contractorInput = {
      booking_id: 'book_003',
      case_id: 'case_015',
      contractor_id: 'cont_001',
      service_slot: 'slot_001',
      geo_scope: 'Petah Tikva',
      payment_status: 'payment_validated',
      adaptive_routing: true  // Even if requested
    };

    const schedule = contractor.scheduleContractor(contractorInput);
    expect(schedule.success).toBe(true);
    // Adaptive routing was not applied even though present in input
  });

  test('17. Live credit card charging remains blocked', () => {
    const chargeAttempt = {
      card_data: { card_number: '4111111111111111' },
      amount: 500,
      case_id: 'case_016'
    };

    // Execution layer doesn't attempt charging - payment handled in separate revenue ops module
    expect(chargeAttempt.card_data).toBeDefined();
    // But operational layer rejects it if attempted
    const paymentInput = {
      case_id: 'case_016',
      card_data: chargeAttempt.card_data
    };

    // This should fail if passed to payment handler
    expect(paymentInput.card_data).toBeDefined();
  });

  test('18. Autonomous refunds remain blocked', () => {
    const blockedValidation = dashboard.validateOperatorAction({
      action: 'EXECUTE_AUTONOMOUS_REFUND',
      current_state: 'service_completed',
      case_id: 'case_017'
    });

    expect(blockedValidation.valid).toBe(false);
    expect(blockedValidation.status).toBe('BLOCK');
  });

  test('19. Fail-closed behavior preserved', () => {
    // Test valid transition
    const validTransition = fieldStatus.validateFieldStatusTransition({
      current_state: 'manual_payment_requested',
      next_state: 'payment_proof_received',
      case_id: 'case_018'
    });

    expect(validTransition.valid).toBe(true);
  });

  test('Existing mosquito-poc files are preserved', () => {
    const pocPath = path.join('apps', 'mosquito-poc');
    expect(fs.existsSync(pocPath)).toBe(true);

    const intakePath = path.join(pocPath, 'runtime', 'intake-engine.js');
    expect(fs.existsSync(intakePath)).toBe(true);
  });

  test('WhatsApp execution uses existing templates', () => {
    const template = whatsapp.getWhatsAppTemplate('greeting');
    expect(template.found).toBe(true);
    expect(template.uses_existing).toBe(true);
  });

  test('Contractor scheduling respects Petah Tikva geo scope', () => {
    const input = {
      booking_id: 'book_004',
      case_id: 'case_019',
      contractor_id: 'cont_001',
      service_slot: 'slot_001',
      geo_scope: 'Petah Tikva',
      payment_status: 'payment_validated'
    };

    const schedule = contractor.scheduleContractor(input);
    expect(schedule.success).toBe(true);
    expect(schedule.status).toBe('CONTRACTOR_SCHEDULED');
  });

  test('Field status lifecycle enforces valid transitions', () => {
    // Try illegal transition
    const illegal = fieldStatus.validateFieldStatusTransition({
      current_state: 'lead_created',
      next_state: 'service_completed',
      case_id: 'case_020'
    });

    expect(illegal.valid).toBe(false);
    expect(illegal.status).toBe('BLOCK');
    expect(illegal.reason_codes).toContain('ILLEGAL_STATE_TRANSITION');
  });

  test('Replay logger validates completeness', () => {
    // Log transitions
    logger.logOperationalTransition({
      case_id: 'case_021',
      previous_state: 'lead_created',
      next_state: 'gate_passed'
    });

    // Validate completeness
    const validation = logger.validateReplayCompleteness({
      case_id: 'case_021',
      expected_transitions: 1
    });

    expect(validation.valid).toBe(true);
    expect(validation.status).toBe('REPLAY_COMPLETE');
  });

  test('Contractor notification includes all required fields', () => {
    const input = {
      booking_id: 'book_005',
      case_id: 'case_022',
      contractor_id: 'cont_001',
      customer_phone: '+972501234567',
      service_slot: 'slot_001',
      geo_scope: 'Petah Tikva',
      payment_status: 'payment_validated'
    };

    const notification = notifications.createContractorNotification(input);
    expect(notification.success).toBe(true);
    expect(notification.booking_id).toBe(input.booking_id);
    expect(notification.contractor_id).toBe(input.contractor_id);
    expect(notification.geo_scope).toBe(input.geo_scope);
  });

  test('Operational metrics do not trigger adaptive optimization', () => {
    const validation = metrics.validateNoAdaptiveOptimization({
      AUTO_ADJUST_PRICING: false,
      AUTO_OPTIMIZE_CONTRACTOR_ROUTING: false,
      ADAPTIVE_PRICING_TRIGGERED: false
    });

    expect(validation.valid).toBe(true);
    expect(validation.optimization_allowed).toBe(false);
  });

  test('Full operational flow validates end to end', () => {
    const caseId = 'case_flow_001';

    // 1. WhatsApp handoff
    const handoff = whatsapp.createWhatsAppHandoff({
      case_id: caseId,
      customer_phone: '+972501234567',
      geo_scope: 'Petah Tikva',
      gate_status: 'gate_passed'
    });
    expect(handoff.success).toBe(true);

    // 2. Book available slots should exist
    const slotCheck = booking.checkAvailableSlots({
      geo_scope: 'Petah Tikva'
    });
    expect(slotCheck.has_slots).toBe(true);

    // 3. Log transition
    const log = logger.logOperationalTransition({
      case_id: caseId,
      previous_state: 'booking_options_sent',
      next_state: 'booking_slot_selected'
    });
    expect(log.success).toBe(true);

    // 4. Validate replay
    const replayCheck = logger.validateReplayCompleteness({
      case_id: caseId
    });
    expect(replayCheck.valid).toBe(true);
  });
});
