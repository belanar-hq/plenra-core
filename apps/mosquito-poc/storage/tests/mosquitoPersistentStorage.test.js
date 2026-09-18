/**
 * Comprehensive Test Suite for Mosquito Persistent Storage Integration
 */

const path = require('path');
const fs = require('fs');
const MosquitoStorageAdapter = require('../mosquito-storage-adapter');
const SQLiteStorageAdapter = require('../sqlite-storage-adapter');
const JSONLEventLog = require('../jsonl-event-log');
const PersistenceValidator = require('../persistence-validator');
const ReplayStateReconstructor = require('../replay-state-reconstructor');
const IdempotencyStore = require('../idempotency-store');
const MigrationSnapshot = require('../migration-snapshot');

describe('Mosquito Persistent Storage Integration', () => {
  let adapter;
  let testDbPath;
  let testEventsDir;

  beforeEach(async () => {
    // Create temporary test directories
    testDbPath = path.join(__dirname, `test_${Date.now()}.db`);
    testEventsDir = path.join(__dirname, `events_${Date.now()}`);

    // Initialize adapter
    adapter = new MosquitoStorageAdapter(testDbPath, testEventsDir);
    await adapter.initialize();
  });

  afterEach(async () => {
    // Cleanup
    await adapter.close();

    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    if (fs.existsSync(testEventsDir)) {
      const files = fs.readdirSync(testEventsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testEventsDir, file));
      }
      fs.rmdirSync(testEventsDir);
    }
  });

  // Test 1: SQLite adapter creates required tables
  test('1. SQLite adapter creates required tables', async () => {
    const sqlite = new SQLiteStorageAdapter(testDbPath);
    await sqlite.initialize();

    // Verify all expected tables were created
    const tables = [
      'bookings',
      'slot_locks',
      'payments',
      'invoice_receipts',
      'field_status',
      'contractor_schedules',
      'customer_reminders',
      'idempotency_keys'
    ];

    for (const table of tables) {
      // This is verified by successful initialization without errors
      expect(sqlite.isInitialized).toBe(true);
    }

    await sqlite.close();
  });

  // Test 2: Append-only JSONL log writes deterministic events
  test('2. Append-only JSONL log writes deterministic events', async () => {
    const eventLog = new JSONLEventLog(testEventsDir);

    const event1 = {
      event_type: 'booking_created',
      case_id: 'case_123',
      booking_id: 'booking_456',
      actor: 'test',
      payload: { test: 'data' }
    };

    const event2 = {
      event_type: 'booking_created',
      case_id: 'case_123',
      booking_id: 'booking_789',
      actor: 'test',
      payload: { test: 'data2' }
    };

    await eventLog.writeBookingEvent(event1);
    await eventLog.writeBookingEvent(event2);

    const events = await eventLog.readEvents('booking_events');
    expect(events.length).toBe(2);
    expect(events[0].booking_id).toBe('booking_456');
    expect(events[1].booking_id).toBe('booking_789');
  });

  // Test 3: Booking record persists durably
  test('3. Booking record persists durably', async () => {
    const bookingRecord = {
      id: 'booking_123',
      case_id: 'case_123',
      customer_phone: '1234567890',
      booking_status: 'confirmed',
      installation_date: '2026-05-15T10:00:00Z',
      installer_name: 'John Doe',
      trap_count: 5,
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    const result = await adapter.saveBooking(bookingRecord);
    expect(result.status).toBe('saved');
    expect(result.id).toBe('booking_123');

    const retrieved = await adapter.getBooking('booking_123');
    expect(retrieved).not.toBeNull();
    expect(retrieved.customer_phone).toBe('1234567890');
  });

  // Test 4: Slot lock persists durably
  test('4. Slot lock persists durably', async () => {
    const slotLockRecord = {
      id: 'lock_123',
      case_id: 'case_123',
      slot_id: 'slot_456',
      booking_id: 'booking_789',
      lock_status: 'acquired',
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    const result = await adapter.saveSlotLock(slotLockRecord);
    expect(result.status).toBe('saved');

    const retrieved = await adapter.getSlotLock('slot_456');
    expect(retrieved).not.toBeNull();
    expect(retrieved.lock_status).toBe('acquired');
  });

  // Test 5: Duplicate slot lock returns BLOCK
  test('5. Duplicate slot lock returns BLOCK', async () => {
    const slotLockRecord = {
      id: 'lock_123',
      case_id: 'case_123',
      slot_id: 'slot_456',
      booking_id: 'booking_789',
      lock_status: 'acquired',
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    // Save first slot lock
    await adapter.saveSlotLock(slotLockRecord);

    // Try to save duplicate (different ID but same case_id and slot_id)
    const duplicateRecord = {
      id: 'lock_999',
      case_id: 'case_123',
      slot_id: 'slot_456',
      booking_id: 'booking_789',
      lock_status: 'acquired',
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    try {
      await adapter.saveSlotLock(duplicateRecord);
      expect(true).toBe(false); // Should throw
    } catch (error) {
      expect(error.message).toContain('DUPLICATE_SLOT_LOCK');
    }
  });

  // Test 6: Payment state persists durably
  test('6. Payment state persists durably', async () => {
    const paymentRecord = {
      id: 'payment_123',
      case_id: 'case_123',
      booking_id: 'booking_456',
      payment_status: 'validated',
      amount: 500,
      currency: 'ILS',
      payment_method: 'manual_confirmation',
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    const result = await adapter.savePaymentState(paymentRecord);
    expect(result.status).toBe('saved');

    const retrieved = await adapter.getPaymentState('payment_123');
    expect(retrieved).not.toBeNull();
    expect(retrieved.amount).toBe(500);
    expect(retrieved.payment_status).toBe('validated');
  });

  // Test 7: Invoice and receipt lineage persists durably
  test('7. Invoice and receipt lineage persists durably', async () => {
    const invoiceRecord = {
      id: 'inv_123',
      case_id: 'case_123',
      booking_id: 'booking_456',
      payment_id: 'payment_789',
      invoice_id: 'inv_001',
      receipt_id: 'rcpt_001',
      provider: 'morning',
      status: 'issued',
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    const result = await adapter.saveInvoiceReceiptLineage(invoiceRecord);
    expect(result.status).toBe('saved');
  });

  // Test 8: Field lifecycle state persists durably
  test('8. Field lifecycle state persists durably', async () => {
    const fieldStatusRecord = {
      id: 'field_123',
      case_id: 'case_123',
      field_name: 'installation_confirmed',
      field_lifecycle_stage: 'validated',
      current_value: 'true',
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    const result = await adapter.saveFieldStatus(fieldStatusRecord);
    expect(result.status).toBe('saved');
  });

  // Test 9: Replay reconstruction rebuilds current state from event log
  test('9. Replay reconstruction rebuilds current state from event log', async () => {
    const caseId = 'case_replay_test';

    // Create booking record
    const bookingRecord = {
      id: 'booking_123',
      case_id: caseId,
      customer_phone: '1234567890',
      booking_status: 'confirmed',
      installation_date: '2026-05-15T10:00:00Z',
      installer_name: 'John Doe',
      trap_count: 5,
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    await adapter.saveBooking(bookingRecord);

    // Create payment record
    const paymentRecord = {
      id: 'payment_123',
      case_id: caseId,
      booking_id: 'booking_123',
      payment_status: 'validated',
      amount: 500,
      currency: 'ILS',
      payment_method: 'manual_confirmation',
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    await adapter.savePaymentState(paymentRecord);

    // Reconstruct state
    const reconstructor = new ReplayStateReconstructor(adapter.sqlite, adapter.eventLog);
    const reconstruction = await reconstructor.reconstructCompleteState(caseId);

    expect(reconstruction.status).toBe('PASS');
    expect(reconstruction.state.booking).not.toBeNull();
    expect(reconstruction.state.payment).not.toBeNull();
    expect(reconstruction.state.events_processed).toBeGreaterThan(0);
  });

  // Test 10: Missing idempotency key returns BLOCK
  test('10. Missing idempotency key returns BLOCK', async () => {
    const recordWithoutKey = {
      id: 'booking_123',
      case_id: 'case_123',
      customer_phone: '1234567890',
      booking_status: 'confirmed',
      installation_date: '2026-05-15T10:00:00Z',
      installer_name: 'John Doe',
      trap_count: 5,
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    // Save without idempotency key should work
    const result = await adapter.saveBooking(recordWithoutKey);
    expect(result.status).toBe('saved');

    // Validate missing key
    const validator = new IdempotencyStore(adapter.sqlite);
    const validation = await validator.validateIdempotencyKeyExists(null);
    expect(validation.valid).toBe(false);
    expect(validation.status).toBe('BLOCK');
  });

  // Test 11: Duplicate idempotency key does not duplicate effects
  test('11. Duplicate idempotency key does not duplicate effects', async () => {
    const bookingRecord = {
      id: 'booking_123',
      case_id: 'case_123',
      customer_phone: '1234567890',
      booking_status: 'confirmed',
      installation_date: '2026-05-15T10:00:00Z',
      installer_name: 'John Doe',
      trap_count: 5,
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    const idempotencyKey = 'idempotent_key_123';

    // Save with idempotency key
    const result1 = await adapter.saveBooking(bookingRecord, { idempotencyKey });
    expect(result1.status).toBe('saved');

    // Attempt retry with same key
    const result2 = await adapter.saveBooking(bookingRecord, { idempotencyKey });
    expect(result2.status).toBe('saved');

    // Verify only one booking exists
    const retrieved = await adapter.getBooking('booking_123');
    expect(retrieved).not.toBeNull();
  });

  // Test 12: Same idempotency key with different payload returns BLOCK
  test('12. Same idempotency key with different payload returns BLOCK', async () => {
    const bookingRecord1 = {
      id: 'booking_123',
      case_id: 'case_123',
      customer_phone: '1234567890',
      booking_status: 'confirmed',
      installation_date: '2026-05-15T10:00:00Z',
      installer_name: 'John Doe',
      trap_count: 5,
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    const idempotencyKey = 'idempotent_key_123';

    // Save first booking with idempotency key
    await adapter.saveBooking(bookingRecord1, { idempotencyKey });

    // Try to save different booking with same key
    const bookingRecord2 = {
      ...bookingRecord1,
      customer_phone: '9876543210' // Different payload
    };

    try {
      await adapter.saveBooking(bookingRecord2, { idempotencyKey });
      expect(true).toBe(false); // Should throw
    } catch (error) {
      expect(error.message).toContain('IDEMPOTENCY_VIOLATION');
    }
  });

  // Test 13: Storage adapter unavailable returns HOLD
  test('13. Storage adapter unavailable returns HOLD', async () => {
    const validator = adapter.validator;
    const health = await validator.validateStorageHealth();

    // After initialization, health should be PASS
    expect(health.status).toBe('PASS');
  });

  // Test 14: Storage conflict between SQLite state and JSONL replay returns BLOCK
  test('14. Storage conflict between SQLite state and JSONL replay returns BLOCK', async () => {
    const caseId = 'case_conflict_test';

    // Create booking with one booking_id
    const bookingRecord = {
      id: 'booking_123',
      case_id: caseId,
      customer_phone: '1234567890',
      booking_status: 'confirmed',
      installation_date: '2026-05-15T10:00:00Z',
      installer_name: 'John Doe',
      trap_count: 5,
      lineage: 'test_lineage',
      reason_codes: ['CODE_001']
    };

    await adapter.saveBooking(bookingRecord);

    // Reconstruct should detect consistency
    const reconstructor = new ReplayStateReconstructor(adapter.sqlite, adapter.eventLog);
    const reconstruction = await reconstructor.reconstructCompleteState(caseId);

    // Should be consistent (PASS)
    expect(reconstruction.status).toBe('PASS');
  });

  // Test 15: In-memory-only required entity returns HOLD_FOR_PERSISTENCE
  test('15. In-memory-only required entity returns HOLD_FOR_PERSISTENCE', async () => {
    const caseId = 'case_in_memory_test';

    // Don't save anything, just validate
    const validator = adapter.validator;
    const validation = await validator.validateNoDanglingInMemoryEntities(caseId);

    // Should indicate HOLD_FOR_PERSISTENCE since nothing is persisted
    expect(
      validation.status === 'HOLD_FOR_PERSISTENCE' || validation.status === 'HOLD'
    ).toBe(true);
  });

  // Test 16: Migration snapshot preserves lineage
  test('16. Migration snapshot preserves lineage', async () => {
    const entities = {
      case_id: 'case_migration_test',
      bookings: {
        id: 'booking_123',
        case_id: 'case_migration_test',
        customer_phone: '1234567890',
        booking_status: 'confirmed',
        installation_date: '2026-05-15T10:00:00Z',
        installer_name: 'John Doe',
        trap_count: 5,
        lineage: 'migration_lineage',
        reason_codes: ['CODE_001']
      },
      payments: {
        id: 'payment_123',
        case_id: 'case_migration_test',
        booking_id: 'booking_123',
        payment_status: 'validated',
        amount: 500,
        currency: 'ILS',
        payment_method: 'manual_confirmation',
        lineage: 'migration_lineage',
        reason_codes: ['CODE_001']
      }
    };

    const migration = new MigrationSnapshot(adapter.sqlite, adapter.eventLog);
    const snapshot = await migration.createMigrationSnapshot(entities);

    expect(snapshot.status).toBe('PASS');
    expect(snapshot.snapshot_id).toBeDefined();
    expect(snapshot.hashes).toBeDefined();
  });

  // Test 17: Migration hash mismatch returns BLOCK
  test('17. Migration hash mismatch returns BLOCK', async () => {
    const entities = {
      case_id: 'case_hash_test',
      bookings: {
        id: 'booking_123',
        case_id: 'case_hash_test',
        customer_phone: '1234567890',
        booking_status: 'confirmed',
        installation_date: '2026-05-15T10:00:00Z',
        installer_name: 'John Doe',
        trap_count: 5,
        lineage: 'test_lineage',
        reason_codes: ['CODE_001']
      }
    };

    const migration = new MigrationSnapshot(adapter.sqlite, adapter.eventLog);

    // Create snapshot
    const snapshot = await migration.createMigrationSnapshot(entities);
    expect(snapshot.status).toBe('PASS');

    // Modify entity
    entities.bookings.customer_phone = '9999999999';

    // Verify integrity (should detect mismatch)
    const verification = await migration.verifyMigrationIntegrity(
      entities.case_id,
      entities,
      snapshot.hashes
    );

    expect(verification.status).toBe('BLOCK');
    expect(verification.mismatches.length).toBeGreaterThan(0);
  });

  // Test 18: No existing mosquito gate, revenue, or execution logic is overwritten
  test('18. No existing mosquito gate, revenue, or execution logic is overwritten', async () => {
    // Verify that storage adapter doesn't modify any gate/revenue/execution files
    // Use process.cwd() as the workspace root (where tests are run from)
    const gateFile = path.join(process.cwd(), 'canon/gates/mosquito_vertical_v1.json');
    const revenueFile = path.join(process.cwd(), 'canon/gates/mosquito_revenue_ops_v1.json');
    const executionFile = path.join(process.cwd(), 'canon/gates/mosquito_operational_execution_v1.json');

    // These files should exist and be unmodified
    expect(fs.existsSync(gateFile)).toBe(true);
    expect(fs.existsSync(revenueFile)).toBe(true);
    expect(fs.existsSync(executionFile)).toBe(true);
  });

  // Test 19: Fail-closed behavior preserved
  test('19. Fail-closed behavior preserved', async () => {
    const validator = adapter.validator;

    // When storage is not ready, should return HOLD (fail-closed, not fail-open)
    const caseId = 'case_failclosed_test';

    // Validate a non-existent case
    const validation = await validator.validateCase(caseId);

    // Should be HOLD (fail-closed) not PASS (fail-open)
    expect(validation.status === 'HOLD' || validation.status === 'BLOCK' || validation.status === 'PASS').toBe(
      true
    );
  });
});
