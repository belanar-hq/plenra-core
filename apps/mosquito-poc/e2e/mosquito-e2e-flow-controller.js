/**
 * Mosquito E2E Flow Controller.
 * Orchestrates storage-bound booking, payment, lifecycle, and replay verification.
 */

const MosquitoStorageAdapter = require('../storage/mosquito-storage-adapter');
const { BookingExecutionRuntime } = require('../execution/booking-execution-runtime');
const { FieldStatusLifecycle } = require('../execution/field-status-lifecycle');
const { OperationalReplayLogger } = require('../execution/operational-replay-logger');
const { PaymentStateMachine } = require('../revenue/payment-state-machine');
const { BookingPaymentReconciliation } = require('../revenue/booking-payment-reconciliation');
const { validateE2EFlowInput } = require('./mosquito-e2e-flow-schema');
const { requireIdempotencyKey, validateE2EIdempotency } = require('./e2e-idempotency-guard');
const { validateE2ESafety } = require('./e2e-fail-closed-validator');
const { persistAndTransition } = require('./storage-bound-state-transitioner');
const { compareReplayToCurrentState } = require('./e2e-replay-verifier');

function deriveStepKey(baseKey, step) {
  return `${baseKey}:${step}`;
}

class MosquitoE2EFlowController {
  constructor({ dbPath, eventsDir, storageAdapter } = {}) {
    this.storageAdapter = storageAdapter || new MosquitoStorageAdapter(dbPath, eventsDir);
    this.bookingRuntime = new BookingExecutionRuntime(this.storageAdapter);
    this.fieldLifecycle = new FieldStatusLifecycle(this.storageAdapter);
    this.replayLogger = new OperationalReplayLogger(this.storageAdapter.eventLog);
    this.paymentStateMachine = new PaymentStateMachine(this.storageAdapter);
    this.reconciliation = new BookingPaymentReconciliation(this.storageAdapter);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      return;
    }
    await this.storageAdapter.initialize();
    this.initialized = true;
  }

  async close() {
    if (!this.initialized) {
      return;
    }

    await this.storageAdapter.close();
    this.initialized = false;
  }

  async runMosquitoE2EFlow(input) {
    const flowValidation = validateE2EFlowInput(input);
    if (flowValidation.status !== 'PASS') {
      return flowValidation;
    }

    const safety = validateE2ESafety(input);
    if (safety.status !== 'PASS') {
      return safety;
    }

    const idempotencyValidation = requireIdempotencyKey({ idempotency_key: input.idempotency_key });
    if (idempotencyValidation.status !== 'PASS') {
      return idempotencyValidation;
    }

    await this.initialize();

    try {
      this.bookingRuntime = new BookingExecutionRuntime(this.storageAdapter);
      this.bookingRuntime.addAvailableSlots({
        geo_scope: input.geo_scope,
        slots: ['slot_A', 'slot_B', 'slot_C']
      });

      const caseId = input.case_id;
      const baseKey = input.idempotency_key;
      const now = new Date().toISOString();

      const steps = [
        'booking_slot_selection',
        'booking_slot_lock',
        'payment_requested',
        'payment_proof_uploaded',
        'payment_validated',
        'invoice_receipt_ready',
        'field_status_scheduled',
        'service_completed',
        'seasonal_refill_reminder_scheduled'
      ];

      let lastBooking = null;
      let lastPayment = null;

      for (const step of steps) {
        const idempotencyKey = deriveStepKey(baseKey, step);
        const validation = requireIdempotencyKey({ idempotency_key: idempotencyKey });
        if (validation.status !== 'PASS') {
          return validation;
        }

        let phaseResult;
        let persistenceRecord;
        let entityType;

        switch (step) {
        case 'booking_slot_selection': {
          const selectedSlot = this.bookingRuntime.selectBookingSlot({ case_id: caseId, slot_id: 'slot_A', geo_scope: input.geo_scope });
          if (selectedSlot.status === 'BLOCK') {
            return selectedSlot;
          }

          lastBooking = {
            id: `booking_${caseId}`,
            booking_id: `booking_${caseId}`,
            case_id: caseId,
            customer_id: input.customer_id,
            customer_phone: '+972000000000',
            slot_id: 'slot_A',
            booking_status: 'slot_selected',
            installation_date: now,
            geo_scope: input.geo_scope,
            lineage: JSON.stringify(input.lineage),
            reason_codes: input.reason_codes,
            created_at: now,
            updated_at: now
          };

          entityType = 'booking';
          persistenceRecord = lastBooking;
          phaseResult = { status: 'PASS' };
          break;
        }
        case 'booking_slot_lock': {
          const lockResult = this.bookingRuntime.lockBookingSlot({
            booking_id: lastBooking.booking_id,
            case_id: caseId,
            slot_id: 'slot_A'
          });
          if (!lockResult.success) {
            return lockResult;
          }

          const existingSlotLock = await this.storageAdapter.getSlotLock('slot_A');
          if (existingSlotLock && existingSlotLock.booking_id !== lastBooking.booking_id) {
            return {
              valid: false,
              status: 'BLOCK',
              reason_codes: ['DUPLICATE_STATE_TRANSITION'],
              error: 'Slot already locked by another booking'
            };
          }

          lastBooking.booking_status = 'slot_locked';

          const slotLockRecord = {
            id: `slot_lock_${caseId}`,
            case_id: caseId,
            slot_id: 'slot_A',
            booking_id: lastBooking.booking_id,
            lock_status: 'locked',
            locked_at: now,
            lineage: JSON.stringify(input.lineage),
            reason_codes: input.reason_codes,
            created_at: now,
            updated_at: now
          };

          entityType = 'slot_lock';
          persistenceRecord = slotLockRecord;
          phaseResult = { status: 'PASS' };
          break;
        }
        case 'payment_requested': {
          lastPayment = {
            id: `payment_${caseId}`,
            payment_id: `payment_${caseId}`,
            case_id: caseId,
            booking_id: lastBooking.booking_id,
            payment_status: 'manual_payment_requested',
            amount: 129.0,
            currency: 'ILS',
            payment_method: 'bank_transfer',
            lineage: JSON.stringify(input.lineage),
            reason_codes: input.reason_codes,
            created_at: now,
            updated_at: now
          };
          entityType = 'payment_state';
          persistenceRecord = lastPayment;
          phaseResult = { status: 'PASS' };
          break;
        }
        case 'payment_proof_uploaded': {
          lastPayment.payment_status = 'payment_proof_uploaded';
          lastPayment.updated_at = now;
          entityType = 'payment_state';
          persistenceRecord = lastPayment;
          phaseResult = { status: 'PASS' };
          break;
        }
        case 'payment_validated': {
          lastPayment.payment_status = 'payment_validated';
          lastPayment.updated_at = now;
          entityType = 'payment_state';
          persistenceRecord = lastPayment;
          phaseResult = { status: 'PASS' };
          break;
        }
        case 'invoice_receipt_ready': {
          const invoiceRecord = {
            id: `invoice_${caseId}`,
            case_id: caseId,
            booking_id: lastBooking.booking_id,
            payment_id: lastPayment.id,
            invoice_id: `invoice_${caseId}`,
            receipt_id: `receipt_${caseId}`,
            provider: 'mosquito_internal',
            status: 'invoice_receipt_ready',
            amount: lastPayment.amount,
            currency: lastPayment.currency,
            lineage: JSON.stringify(input.lineage),
            reason_codes: input.reason_codes,
            created_at: now,
            updated_at: now
          };

          entityType = 'invoice_receipt';
          persistenceRecord = invoiceRecord;
          phaseResult = { status: 'PASS' };
          break;
        }
        case 'field_status_scheduled': {
          const fieldStatus = {
            id: `field_status_${caseId}_scheduled`,
            case_id: caseId,
            field_name: 'service_status',
            field_lifecycle_stage: 'scheduled',
            current_value: 'service_scheduled',
            previous_value: null,
            transition_reason: 'scheduled_for_service',
            validated_at: now,
            lineage: JSON.stringify(input.lineage),
            reason_codes: input.reason_codes,
            created_at: now,
            updated_at: now
          };
          entityType = 'field_status';
          persistenceRecord = fieldStatus;
          phaseResult = { status: 'PASS' };
          break;
        }
        case 'service_completed': {
          const fieldStatus = {
            id: `field_status_${caseId}_completed`,
            case_id: caseId,
            field_name: 'service_status',
            field_lifecycle_stage: 'completed',
            current_value: 'service_completed',
            previous_value: 'service_scheduled',
            transition_reason: 'service_completed',
            validated_at: now,
            lineage: JSON.stringify(input.lineage),
            reason_codes: input.reason_codes,
            created_at: now,
            updated_at: now
          };
          entityType = 'field_status';
          persistenceRecord = fieldStatus;
          phaseResult = { status: 'PASS' };
          break;
        }
        case 'seasonal_refill_reminder_scheduled': {
          const reminder = {
            id: `reminder_${caseId}`,
            case_id: caseId,
            booking_id: lastBooking.booking_id,
            reminder_type: 'seasonal_refill',
            reminder_status: 'scheduled',
            scheduled_send_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
            lineage: JSON.stringify(input.lineage),
            reason_codes: input.reason_codes,
            created_at: now,
            updated_at: now
          };

          entityType = 'customer_reminder';
          persistenceRecord = reminder;
          phaseResult = { status: 'PASS' };
          break;
        }
        default:
          return {
            valid: false,
            status: 'BLOCK',
            reason_codes: ['UNKNOWN_FLOW_STEP'],
            error: `Unknown flow step ${step}`
          };
        }

        const transitionResult = await persistAndTransition({
          storageAdapter: this.storageAdapter,
          entityType,
          record: persistenceRecord,
          idempotency_key: deriveStepKey(baseKey, step),
          event: {
            event_type: 'mosquito_e2e_transition',
            case_id: caseId,
            payload: {
              step,
              record: persistenceRecord,
              actor: 'MosquitoE2EFlowController'
            }
          }
        });

        if (transitionResult.status !== 'PASS') {
          return transitionResult;
        }
      }

      const replayResult = await compareReplayToCurrentState(caseId, this.storageAdapter);
      if (replayResult.status !== 'PASS') {
        return replayResult;
      }

      return {
        valid: true,
        status: 'PASS',
        case_id: caseId,
        message: 'Mosquito E2E flow completed successfully'
      };
    } finally {
      await this.close();
    }
  }
}

module.exports = {
  MosquitoE2EFlowController
};
