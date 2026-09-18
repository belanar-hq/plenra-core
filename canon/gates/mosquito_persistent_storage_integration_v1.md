# Mosquito Persistent Storage Integration v1

## Overview

Deterministic persistent storage layer for `mosquito_vertical_v1` providing durable state persistence through SQLite (current state) and append-only JSONL event logs (operational transitions). Enables replay-safe reconstruction and idempotent operations.

## Architecture

### Storage Strategy: Local-First with Dual Persistence

```
┌─────────────────────────────────────────────────────────────┐
│         Mosquito Operational Layers v1                       │
│   (vertical, revenue_ops, operational_execution)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │  Mosquito Storage       │
        │  Adapter Interface      │
        └────────┬────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    ┌────────┐      ┌──────────┐
    │ SQLite │      │  JSONL   │
    │ Current│      │ Append   │
    │ State  │      │ Only Log │
    └────────┘      └──────────┘
        ▲                 ▲
        │                 │
    ┌───┴──────────┬──────┴────────┐
    │              │               │
  ┌──────┐   ┌──────────┐   ┌───────────┐
  │      │   │          │   │           │
  │Data  │   │ Booking  │   │ Payment   │
  │Base  │   │ Events   │   │ Events    │
  │      │   │          │   │           │
  └──────┘   └──────────┘   └───────────┘
```

### Components

#### 1. **mosquito-storage-adapter.js**

Main facade interface providing:
- `saveBooking(record)` - Persist booking with event log
- `getBooking(bookingId)` - Retrieve booking record
- `saveSlotLock(record)` - Persist slot lock
- `getSlotLock(slotId)` - Retrieve slot lock
- `savePaymentState(record)` - Persist payment state
- `getPaymentState(paymentId)` - Retrieve payment state
- `saveInvoiceReceiptLineage(record)` - Persist invoice/receipt
- `saveFieldStatus(record)` - Persist field lifecycle state
- `saveContractorSchedule(record)` - Persist contractor assignment
- `saveCustomerReminder(record)` - Persist customer reminders
- `writeOperationalEvent(event)` - Write to event log
- `validateStorageHealth()` - Check storage readiness

**Idempotency Protection**: All save operations accept `idempotencyKey` option. Duplicate keys with matching payload return previous result. Duplicate keys with different payload return BLOCK.

#### 2. **sqlite-storage-adapter.js**

Provides durable current-state persistence via SQLite database.

**Tables Created**:
- `bookings` - Booking records
- `slot_locks` - Slot lock records with duplicate prevention (UNIQUE constraint on case_id + slot_id)
- `payments` - Payment state records
- `invoice_receipts` - Invoice and receipt lineage
- `field_status` - Field lifecycle tracking
- `contractor_schedules` - Contractor scheduling
- `customer_reminders` - Customer reminders
- `idempotency_keys` - Idempotency cache with 24-hour expiry

**All Records Include**:
- `id` - Unique identifier
- `case_id` - Case identifier for correlation
- `created_at` - Creation timestamp (ISO8601)
- `updated_at` - Last update timestamp (ISO8601)
- `lineage` - Lineage tracking
- `reason_codes` - Reason codes (JSON array)

#### 3. **jsonl-event-log.js**

Append-only event logging for replay and audit trail.

**Event Log Files**:
- `operational_transitions.jsonl` - State transitions (slot_locked, field_updated, reminder_scheduled, etc.)
- `payment_events.jsonl` - Payment-related events
- `booking_events.jsonl` - Booking-related events
- `invoice_receipt_events.jsonl` - Invoice/receipt events
- `replay_events.jsonl` - Replay reconstruction events

**Event Format**:
```json
{
  "event_id": "evt_1715000000_abc123def",
  "event_type": "booking_created",
  "case_id": "case_xyz",
  "timestamp": "2026-05-09T10:30:45Z",
  "actor": "storage_adapter",
  "payload": { /* event-specific data */ },
  "idempotency_key": "optional_key"
}
```

#### 4. **storage-schema.js**

Strict schema validation for all persistent entities.

**Schemas Defined**:
- `booking` - Required: id, case_id, customer_phone, booking_status, installation_date, etc.
- `slot_lock` - Required: id, case_id, slot_id, booking_id, lock_status, etc.
- `payment_state` - Required: id, case_id, booking_id, payment_status, amount, currency, etc.
- `invoice_receipt_lineage` - Required: id, case_id, booking_id, payment_id, invoice_id, receipt_id, etc.
- `field_status` - Required: id, case_id, field_name, field_lifecycle_stage, current_value, etc.
- `contractor_schedule` - Required: id, case_id, contractor_id, contractor_name, assigned_date, etc.
- `customer_reminder` - Required: id, case_id, booking_id, reminder_type, reminder_status, etc.
- `operational_event` - Required: event_id, event_type, case_id, timestamp, actor, payload
- `idempotency_key` - Required: key, case_id, operation_type, payload_hash, result

#### 5. **persistence-validator.js**

Validates storage consistency and health.

**Validation Methods**:
- `validateStorageHealth()` - Overall storage readiness (PASS/HOLD/BLOCK)
- `validateBookingExistence(caseId)` - Verify booking persisted
- `validateSlotLockExistence(slotId)` - Verify slot lock persisted
- `validatePaymentStateExistence(caseId)` - Verify payment persisted
- `validateReplayEventCoverage(caseId)` - Verify event log entries exist
- `validateIdempotencyKey(key)` - Verify idempotency key stored
- `validateNoDanglingInMemoryEntities(caseId)` - Ensure no entities remain in-memory only
- `validateCase(caseId)` - Comprehensive validation

**Status Values**:
- `PASS` - Validation successful, all checks pass
- `HOLD` - Issues detected, operation should wait for persistence
- `BLOCK` - Critical failure, operation must not proceed

#### 6. **replay-state-reconstructor.js**

Reconstructs current state from append-only event logs.

**Methods**:
- `reconstructCompleteState(caseId)` - Rebuild full case state from events
- `reconstructBookingState(caseId)` - Rebuild booking state
- `reconstructPaymentState(caseId)` - Rebuild payment state
- `reconstructFieldStatusState(caseId, fieldName)` - Rebuild field state
- `verifyEventOrdering(events)` - Check for deterministic ordering

**Conflict Detection**:
- Compares reconstructed state with SQLite state
- Returns BLOCK if mismatch detected
- Verifies event ordering is monotonic

#### 7. **idempotency-store.js**

Prevents duplicate effects from retry operations.

**Rules**:
- Duplicate idempotency key → returns previous result
- Same key + different payload → returns BLOCK
- Missing idempotency key on protected operations → returns BLOCK
- 24-hour expiration on stored keys

**Hash Algorithm**: SHA256 of JSON-stringified payload for comparison.

#### 8. **migration-snapshot.js**

Manages migration from in-memory to persistent state.

**Migration Steps**:
1. Create snapshot with entity hashes
2. Verify snapshot integrity
3. Detect hash mismatches → BLOCK
4. Persist entities to SQLite
5. Write migration completion event

**Hash Verification**: Compares SHA256 hashes to detect data corruption during migration.

## Data Flow Examples

### Booking Creation with Persistence

```
1. Receive booking request
   ├─ case_id: "case_001"
   ├─ customer_phone: "+1234567890"
   └─ idempotency_key: "idempotent_booking_001"

2. Validate idempotency
   ├─ Check SQLite idempotency_keys table
   ├─ If key exists and hash matches: return previous result
   └─ If key exists but hash differs: return BLOCK

3. Save to SQLite
   ├─ INSERT INTO bookings (...)
   └─ Created_at, updated_at, lineage set

4. Write to event log
   ├─ Append to booking_events.jsonl
   ├─ event_type: "booking_created"
   ├─ Includes idempotency_key
   └─ Timestamp: ISO8601

5. Store idempotency key
   ├─ INSERT INTO idempotency_keys
   ├─ payload_hash: SHA256(booking_record)
   ├─ expires_at: +24 hours
   └─ result: { status: "saved", id, case_id }

6. Return result
   └─ { status: "saved", id: "booking_123", case_id: "case_001" }
```

### Replay Reconstruction

```
1. Reconstruct case state
   ├─ case_id: "case_001"
   ├─ Read booking_events.jsonl for case_001
   ├─ Read payment_events.jsonl for case_001
   ├─ Read operational_transitions.jsonl for case_001
   └─ Read invoice_receipt_events.jsonl for case_001

2. Apply events in order
   ├─ Start with empty state
   ├─ For each event in timestamp order:
   │  └─ Merge event.payload into state
   └─ Verify monotonic timestamps

3. Validate consistency
   ├─ Compare reconstructed booking with SQLite booking
   ├─ If IDs match: consistency OK
   └─ If mismatch: return BLOCK

4. Return state
   └─ { status: "PASS", state: { booking, payment, ... }, conflicts: [] }
```

### Migration from In-Memory to Persistent

```
1. Create snapshot
   ├─ Generate hash for each entity
   ├─ Record in migration event
   └─ snapshot_id: "snap_1715000000_xyz"

2. Verify integrity
   ├─ Recalculate entity hashes
   ├─ Compare with snapshot hashes
   └─ If mismatch: return BLOCK

3. Persist to SQLite
   ├─ Save bookings
   ├─ Save payments
   ├─ Save slot locks
   ├─ ... (all entity types)
   └─ Write migration_snapshot_persisted event

4. Verify persistence
   ├─ Query SQLite for each entity
   ├─ Confirm records exist
   └─ Return status
```

## Fail-Closed Rules

All failures result in HOLD or BLOCK, never PASS when issues detected:

| Condition | Status | Reason |
|-----------|--------|--------|
| SQLite unavailable | HOLD | Wait for recovery |
| Event log write fails | BLOCK | Cannot proceed without audit trail |
| Idempotency check fails | BLOCK | Cannot guarantee idempotency |
| Duplicate slot lock detected | BLOCK | Slot already allocated |
| Replay conflicts with SQLite | BLOCK | State inconsistency |
| Required entity in-memory only | HOLD_FOR_PERSISTENCE | Must persist before proceeding |
| Payload hash mismatch | BLOCK | Different data on retry |
| Migration hash mismatch | BLOCK | Data corruption detected |
| Event ordering unstable | BLOCK | Replay safety violated |

## Replay Safety Guarantees

1. **Append-Only Events**: Events never overwritten, only appended
2. **Event Ordering**: Timestamps must be monotonic
3. **Deterministic Reconstruction**: Same events → same state every time
4. **Conflict Detection**: SQLite/event log mismatches detected and blocked
5. **Idempotency**: Same operation + same payload → idempotent
6. **Migration Integrity**: Hash verification on state migration

## Non-Destructive Implementation

This module **strictly preserves**:
- ✅ `mosquito_vertical_v1` gate logic
- ✅ `mosquito_revenue_ops_v1` payment validation
- ✅ `mosquito_operational_execution_v1` execution rules
- ✅ Petah Tikva geographic scope
- ✅ WhatsApp runtime and integrations
- ✅ Booking flow and payment flow
- ✅ Replay safety requirements

This module **does not implement**:
- ❌ Real WhatsApp API integration
- ❌ Real payment webhook activation
- ❌ Live Morning API execution
- ❌ Live credit card charging
- ❌ Autonomous refunds
- ❌ Adaptive routing
- ❌ Autonomous optimization
- ❌ Predictive risk modeling

## Testing

### Test File
- `apps/mosquito-poc/storage/tests/mosquitoPersistentStorage.test.js`

### Test Coverage (19 tests)

1. ✅ SQLite adapter creates required tables
2. ✅ Append-only JSONL log writes deterministic events
3. ✅ Booking record persists durably
4. ✅ Slot lock persists durably
5. ✅ Duplicate slot lock returns BLOCK
6. ✅ Payment state persists durably
7. ✅ Invoice and receipt lineage persists durably
8. ✅ Field lifecycle state persists durably
9. ✅ Replay reconstruction rebuilds current state from event log
10. ✅ Missing idempotency key returns BLOCK
11. ✅ Duplicate idempotency key does not duplicate effects
12. ✅ Same idempotency key with different payload returns BLOCK
13. ✅ Storage adapter unavailable returns HOLD
14. ✅ Storage conflict between SQLite state and JSONL replay returns BLOCK
15. ✅ In-memory-only required entity returns HOLD_FOR_PERSISTENCE
16. ✅ Migration snapshot preserves lineage
17. ✅ Migration hash mismatch returns BLOCK
18. ✅ No existing mosquito gate, revenue, or execution logic is overwritten
19. ✅ Fail-closed behavior preserved

### Running Tests

```bash
# Run module tests only
npx jest apps/mosquito-poc/storage/tests/mosquitoPersistentStorage.test.js --runInBand

# Run all tests
npm test
```

## Module Dependencies

- `sqlite3` - SQLite database
- `crypto` - For hash generation
- `fs` - File system operations
- `path` - Path utilities

## Validation Status

- **Status**: NOT_VALIDATED_UNTIL_TESTS_PASS
- **Tests Required**: All 19 test cases must pass
- **Prerequisites Met**: 
  - ✅ `mosquito_vertical_v1` validated
  - ✅ `mosquito_revenue_ops_v1` validated
  - ✅ `mosquito_operational_execution_v1` validated

## Integration Points

### With mosquito_vertical_v1
- Called by: Lead routing decision gates
- Impact: Persists case state for replay
- Non-Breaking: No modifications to gate logic

### With mosquito_revenue_ops_v1
- Called by: Payment validation flow
- Impact: Persists payment state and invoices
- Non-Breaking: No modifications to payment validation

### With mosquito_operational_execution_v1
- Called by: Execution scheduler
- Impact: Persists execution status and field updates
- Non-Breaking: No modifications to execution logic

## Lineage and Maintainability

**Lineage Sources**:
- All implementation files in `apps/mosquito-poc/storage/`
- Test file: `apps/mosquito-poc/storage/tests/mosquitoPersistentStorage.test.js`
- Canon documentation: This file + `mosquito_persistent_storage_integration_v1.json`

**Maintainers**: plenra-engineering

**Version History**:
- v1.0 (2026-05-09): Initial implementation with SQLite + JSONL
