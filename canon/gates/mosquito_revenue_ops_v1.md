# Mosquito Revenue Operations v1

## Overview

Deterministic fail-closed revenue infrastructure layer for `mosquito_vertical_v1`.

This artifact implements manual payment confirmation as the active MVP payment mode, with credit card payment page future-ready but INACTIVE.

**Key Principle**: All payments fail closed. No adaptive learning. No autonomous revenue optimization.

## Isolation

- **Parent Artifact**: `mosquito_vertical_v1`
- **Isolated**: YES
- **Dependencies**: Uses only existing mosquito-poc booking, routing, and WhatsApp infrastructure
- **Preservation**: All existing POC files remain untouched

## Provider Normalization

The `MorningAdapter` normalizes all references to the same invoicing system:

| Alias | Canonical |
|-------|-----------|
| Morning | Morning |
| Green Invoice | Morning |
| green_invoice | Morning |
| חשבונית ירוקה | Morning |

All three forms are treated as the same provider system internally.

## Active Payment Mode: MANUAL_CONFIRMATION

Currently active MVP flow:

1. **booking_created** — Customer initiates booking
2. **payment_pending** — Awaiting payment
3. **manual_payment_requested** — System requests proof from customer
4. **payment_proof_uploaded** — Customer uploads receipt/screenshot
5. **payment_validated** — Admin confirms payment (no real charging)
6. **invoice_generated** — Invoice created via Morning adapter
7. **receipt_generated** — Receipt generated
8. **booking_confirmed** — Ready for service
9. **service_completed** — Service delivered

### Proof Validation

- **Proof Required**: Screenshot, receipt, or bank confirmation
- **Hash Validation**: SHA256 hash of proof content must match
- **Admin Confirmation**: Human review required before advancing
- **No Card Data**: Card details rejected immediately if present
- **Fail-Closed**: Missing proof returns HOLD

## Future-Ready Payment Mode: CREDIT_CARD_PAYMENT_PAGE

Future-ready but INACTIVE in MVP:

- Payment page creation contract exists
- Payment success webhook contract exists
- Payment failed webhook contract exists
- Refund webhook contract exists
- Idempotency checking implemented
- **NO real charging**
- **NO card storage**
- **NO PCI handling**

All future-ready contracts validate shape but do NOT execute.

## Money State Machine

### Valid MVP Transitions

```
booking_created 
  → payment_pending
    → manual_payment_requested
      → payment_proof_uploaded
        → payment_validated
          → invoice_generated
            → receipt_generated
              → booking_confirmed
                → service_completed
```

Fail states branch from any point:
- `payment_failed`
- `invoice_failed`
- `receipt_failed`
- `duplicate_invoice_blocked`
- `reconciliation_hold`
- `payment_proof_invalid`
- `provider_error_hold`

### State Validation Rules

- Unknown states always block
- Invalid transitions always block
- Booking confirmed forbidden before payment validated
- Terminal states have no further transitions

## Accounting Event Schema

All revenue events immutable and deterministic.

### Required Fields

- `event_id` — UUID
- `event_type` — PAYMENT_CONFIRMED, INVOICE_GENERATED, RECEIPT_GENERATED, REFUND_INITIATED, PROVIDER_ERROR
- `booking_id` — Reference to booking
- `payment_id` — Reference to payment
- `amount` — Numerical amount in ILS
- `currency` — Always "ILS"
- `payment_method` — manual, bit, paybox, credit_card
- `payment_mode` — MANUAL_CONFIRMATION or CREDIT_CARD_PAYMENT_PAGE
- `created_at` — ISO 8601 timestamp

### Provider Normalization in Events

If `provider` field specified:
- Automatically normalizes via `MorningAdapter`
- Stores both canonical and original alias for reference
- Unmapped providers cause HOLD with `UNMAPPED_PROVIDER` reason

### Forbidden Fields (Free Text)

STRICT RULE: The following fields cause immediate BLOCK if present:
- `notes`
- `description`
- `comment`
- `admin_notes`
- Any free-text field

No free text is source of truth in accounting schema.

## Booking-Payment Reconciliation

Validates that booking and payment records are consistent.

### Fail-Closed Validation Rules

1. **Booking Exists**: Booking must exist before payment validation → BLOCK
2. **Payment Exists**: Payment must exist before invoice generation → BLOCK
3. **Amount Match**: Invoice amount must equal payment amount → HOLD
4. **VAT Match**: VAT must match configured rate (17%) → HOLD
5. **Receipt Links**: Receipt must link to both invoice and payment → BLOCK
6. **Booking Confirmation**: Cannot confirm booking before payment validated → BLOCK
7. **Duplicate Invoice**: Cannot create duplicate invoice for same payment → BLOCK
8. **Payment Proof Hash**: Hash mismatch blocks confirmation → BLOCK

## Forbidden Features

These are BLOCKED at validation layer:

| Feature | Status |
|---------|--------|
| Real Stripe/Paddle charging | BLOCKED |
| Real credit card form | BLOCKED |
| Card storage | BLOCKED |
| PCI compliance handling | BLOCKED |
| Subscriptions | BLOCKED |
| Contractor wallets | BLOCKED |
| Autonomous refunds | BLOCKED |
| Adaptive pricing | BLOCKED |
| Autonomous revenue optimization | BLOCKED |
| Multi-provider billing abstraction | BLOCKED |
| Accounting AI | BLOCKED |

## Operational Revenue Validator

Orchestrates all revenue validations with comprehensive fail-closed behavior.

### Validation Checks

1. Current state is known (fail if unknown)
2. Transition is valid (if next_state specified)
3. No card data present
4. No autonomous charging requested
5. No adaptive pricing enabled
6. No autonomous refunds requested
7. Booking ID present (if payment mode requires)
8. Manual proof present (if mode is MANUAL_CONFIRMATION)

Any check that fails causes operation to return fail-closed status.

## Morning Adapter

Provider abstraction layer for Morning/Green Invoice/חשבונית ירוקה.

### Current Status

- **Alias Resolution**: ACTIVE
- **Provider Normalization**: ACTIVE
- **Create Invoice Contract**: FUTURE_READY_ONLY (no API calls)
- **Get Invoice Status Contract**: FUTURE_READY_ONLY (no API calls)

Future-ready contracts exist but do NOT call real APIs.

## Testing

Test suite validates:

1. Manual payment confirmation keeps booking unconfirmed until payment_validated
2. Valid manual payment proof allows invoice generation
3. Missing proof returns HOLD
4. Future payment page state exists but inactive
5. Payment success webhook validates (future-ready)
6. Card data rejected if present
7. Duplicate invoice blocked
8. Invoice amount mismatch returns HOLD
9. VAT mismatch returns HOLD
10. Receipt without invoice returns BLOCK
11. Booking confirmation without validated payment returns BLOCK
12. Morning aliases map correctly
13. Provider error maps to provider_error_hold
14. Webhook idempotency prevents duplicate processing
15. Refund state tracked but not auto-executed
16. Accounting schema rejects free-text source of truth
17. Operational Revenue Validation fails closed on unknown state
18. mosquito_vertical_v1 remains isolated from mosquito_revenue_ops_v1

## Isolation from mosquito_vertical_v1

- Separate canon artifacts
- Separate registry entries
- Separate lineage records
- Separate test suites
- Shared underlying booking/routing infrastructure only

## Non-Destructive Integration

- All existing mosquito-poc files preserved
- New revenue layer files added to `apps/mosquito-poc/revenue/`
- Registry entries added without overwriting
- Lineage extended to include revenue sources

## Fail-Closed by Design

Every validation path returns explicit fail-closed status:

- HOLD: Uncertain states requiring manual review
- BLOCK: Violations of critical business rules
- PASS: Validation successful

No silent failures. No adaptive workarounds. No state inference.

---

**Version**: 1.0.0  
**Created**: 2026-05-09  
**Status**: VALIDATED_FOR_MODULE_SCOPE  
**Parent**: mosquito_vertical_v1
