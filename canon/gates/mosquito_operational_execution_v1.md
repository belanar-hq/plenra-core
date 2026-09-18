# Mosquito Operational Execution v1

## Overview

Deterministic operational execution layer connecting static mosquito gate and revenue operations into safe operational runtime.

**System Layer**: VERTICAL_OPERATIONAL_EXECUTION  
**Priority**: P1  
**Geo Scope**: Petah Tikva  
**Routing Channel**: WhatsApp  
**Payment Mode**: MANUAL_CONFIRMATION (active now)

This layer is **NOT**:
- Adaptive routing
- Autonomous optimization
- Live credit card activation
- Autonomous refunds
- Predictive risk
- Campaign scaling

This layer **IS**:
- WhatsApp execution runtime
- Booking execution runtime
- Contractor scheduling runtime
- Operator dashboard/status layer
- Operational replay logging
- Customer reminder automation
- Contractor notification layer
- Field status lifecycle management
- Operational metrics pipeline

## Parent Artifacts

- `mosquito_vertical_v1` — Static decision gate (must remain unmodified)
- `mosquito_revenue_ops_v1` — Payment validation logic (must remain unmodified)

## Required Execution Flow

```
lead_created 
  → gate_passed 
    → whatsapp_handoff_created 
      → booking_options_sent 
        → booking_slot_selected 
          → slot_locked 
            → manual_payment_requested 
              → payment_proof_received 
                → payment_validated 
                  → invoice_receipt_ready 
                    → contractor_notified 
                      → service_scheduled 
                        → service_completed 
                          → post_service_followup_sent 
                            → seasonal_refill_reminder_scheduled
```

## Module: WhatsApp Execution Runtime

Orchestrates WhatsApp handoff and contact validation.

**Exports**:
- `createWhatsAppHandoff(input)`
- `validateWhatsAppContact(input)`

**Rules**:
- Handoff allowed only after gate_passed
- Missing contact returns HOLD
- Out-of-geo scope returns HOLD
- Uses existing WhatsApp templates (preserved)

## Module: Booking Execution Runtime

Manages booking flow: options, slot selection, locking, duplicate prevention.

**Exports**:
- `sendBookingOptions(input)`
- `selectBookingSlot(input)`
- `lockBookingSlot(input)`
- `preventDuplicateBooking(input)`

**Rules**:
- Options sent only when slots exist
- Slot locking required before payment request
- Duplicate booking returns BLOCK
- Slot conflict returns HOLD

## Module: Contractor Scheduling Runtime

Manages contractor availability and scheduling.

**Exports**:
- `checkContractorAvailability(input)`
- `scheduleContractor(input)`

**Rules**:
- Scheduling only after payment_validated
- Contractor unavailable returns HOLD
- No adaptive routing
- Geo scope enforced

## Module: Operator Status Dashboard

Provides operational visibility without unsafe overrides.

**Exports**:
- `getOperationalStatus(input)`
- `validateOperatorAction(input)`

**Rules**:
- Status is read-only
- Unsafe actions blocked (BYPASS_GATE, SKIP_PAYMENT, AUTO_CHARGE, AUTONOMOUS_REFUND)
- Next allowed actions exposed
- Missing requirements listed

**Blocked Operator Actions**:
- BYPASS_GATE_VALIDATION → BLOCK
- SKIP_PAYMENT_VALIDATION → BLOCK
- FORCE_SKIP_CONTRACTOR_CHECK → BLOCK
- AUTO_CHARGE_CREDIT_CARD → BLOCK
- EXECUTE_AUTONOMOUS_REFUND → BLOCK
- ADAPTIVE_PRICING → BLOCK
- MANUAL_BOOKING_CONFIRMATION_WITHOUT_PAYMENT → BLOCK

## Module: Operational Replay Logger

Logs every state transition for audit and replay capability.

**Exports**:
- `logOperationalTransition(input)`
- `listOperationalTransitions(case_id)`
- `validateReplayCompleteness(transitions)`

**Rules**:
- Every transition must be logged
- Missing replay log returns HOLD
- Logs include: previous_state, next_state, reason_codes, timestamp, actor_type, lineage

## Module: Customer Reminder Engine

Manages reminders, post-service follow-up, and seasonal refills.

**Exports**:
- `createCustomerReminder(input)`
- `createPostServiceFollowup(input)`
- `scheduleSeasonalRefillReminder(input)`

**Rules**:
- Customer no-response returns HOLD
- Post-service follow-up only after service_completed
- Seasonal refill reminder only after service_completed
- No marketing automation beyond deterministic reminders

## Module: Contractor Notification Layer

Creates and manages contractor notifications.

**Exports**:
- `createContractorNotification(input)`

**Rules**:
- Notification only after payment_validated
- Must include: booking_id, service_slot, customer_contact_reference, geo_scope, case_id
- No adaptive routing

## Module: Field Status Lifecycle

Manages valid state transitions for operational lifecycle.

**Exports**:
- `transitionFieldStatus(input)`
- `validateFieldStatusTransition(input)`

**Valid States**:
- lead_created
- gate_passed
- whatsapp_handoff_created
- booking_options_sent
- booking_slot_selected
- slot_locked
- manual_payment_requested
- payment_proof_received
- payment_validated
- invoice_receipt_ready
- contractor_notified
- service_scheduled
- service_completed
- post_service_followup_sent
- seasonal_refill_reminder_scheduled
- HOLD
- BLOCK

**Rules**:
- Illegal transition returns BLOCK
- Missing required dependency returns HOLD
- Transitions validated deterministically

## Module: Operational Metrics Pipeline

Calculates CAC vs collected revenue metrics.

**Exports**:
- `calculateCacVsCollectedRevenue(input)`
- `createOperationalMetricEvent(input)`

**Rules**:
- Metrics visibility only
- No adaptive optimization
- CAC and collected revenue calculated
- ROI calculated correctly
- Metrics must not alter routing or pricing

## HOLD States (Uncertain)

These states require manual review before advancing:

- `missing_whatsapp_contact` — WhatsApp contact not provided
- `out_of_geo_scope` — Lead outside Petah Tikva
- `no_available_slots` — No contractor slots available
- `slot_conflict` — Multiple bookings for same slot
- `payment_not_validated` — Payment confirmation pending
- `contractor_not_available` — No contractors available
- `invoice_handoff_failed` — Invoice generation failed
- `customer_no_response` — Customer not responding to communications
- `service_completion_missing` — Service completion not confirmed
- `provider_error_hold` — Error from payment/invoicing provider

## BLOCK States (Violation)

These states indicate critical failures:

- `duplicate_booking_attempt` — Active booking exists for case
- `unsafe_or_unsupported_state` — Unsupported state transition attempted
- `card_data_detected` — Card data present in operational layer
- `auto_charge_attempted` — Auto-charging attempt in MVP
- `unsafe_operator_override` — Operator attempted unsafe action

## Fail-Closed Behavior

All uncertain states return HOLD. All violations return BLOCK.

### WhatsApp Execution

- Handoff forbidden before gate_passed → HOLD
- Missing contact → HOLD
- Out of geo scope → HOLD

### Booking Execution

- No available slots → HOLD
- Duplicate booking attempt → BLOCK
- Slot conflict → HOLD
- Slot not locked → HOLD

### Contractor Execution

- Payment not validated → HOLD
- Contractor not available → HOLD
- No adaptive routing attempted

### Payment Execution

- Booking cannot advance without payment_validated → HOLD
- Contractor notification forbidden before payment_validated → HOLD

### Customer Execution

- Customer no-response → HOLD
- Post-service follow-up before service_completed → HOLD
- Seasonal reminder before service_completed → HOLD

### Operator Execution

- Unsafe override → BLOCK
- Unknown action → HOLD
- Unsafe actions explicitly blocked

### Replay Execution

- Transition not logged → HOLD
- Missing replay log → HOLD
- Malformed log → BLOCK

## Preservation

All existing mosquito-poc files preserved:
- ✅ WhatsApp templates
- ✅ Booking flow docs
- ✅ Routing logic
- ✅ Payment flow
- ✅ Automation events
- ✅ Contractor scheduling docs
- ✅ Petah Tikva geo scope

New execution layer files in `apps/mosquito-poc/execution/`:
- `whatsapp-execution-runtime.js`
- `booking-execution-runtime.js`
- `contractor-scheduling-runtime.js`
- `operator-status-dashboard.js`
- `operational-replay-logger.js`
- `customer-reminder-engine.js`
- `contractor-notification-layer.js`
- `field-status-lifecycle.js`
- `operational-metrics-pipeline.js`

## Non-Adaptive by Design

Explicitly blocked:
- Adaptive routing
- Autonomous contractor assignment
- Autonomous refunds
- Adaptive pricing
- Autonomous revenue optimization
- Contractor wallet system
- Subscriptions
- Campaign scaling

## Testing

19 comprehensive tests validating:

1. WhatsApp handoff created only after gate_passed
2. Out-of-scope geo returns HOLD
3. Booking options sent only when slots exist
4. Slot locking prevents duplicate booking
5. Duplicate booking returns BLOCK
6. Manual payment request only after slot selected
7. Booking cannot advance without payment_validated
8. Contractor notification only after payment_validated
9. Invoice/receipt handoff only after payment_validated
10. Customer no-response creates HOLD
11. Service completion required before post-service follow-up
12. Seasonal refill reminder only after service_completed
13. Operational replay logs every transition
14. Operator dashboard enforces safe overrides
15. CAC vs revenue metric calculated without optimization
16. Adaptive routing remains blocked
17. Live credit card charging remains blocked
18. Autonomous refunds remain blocked
19. Fail-closed behavior preserved

---

**Version**: 1.0.0  
**Created**: 2026-05-09  
**Status**: VALIDATED_FOR_MODULE_SCOPE  
**Parent Artifacts**: mosquito_vertical_v1, mosquito_revenue_ops_v1  
**Dependencies**: static gate, revenue ops, fail-closed behavior  
**Preservation**: All existing POC assets untouched  
**Isolation**: Execution layer only, no modification of parent artifacts
