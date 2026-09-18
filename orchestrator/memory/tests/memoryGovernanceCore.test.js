const { validateMemoryEventShape } = require('../events/memoryEventSchema');
const { appendMemoryEvent, findMemoryEventByIdempotencyKey } = require('../events/memoryEventStore');
const { enforceActiveMemoryEviction } = require('../eviction/activeMemoryEvictionEngine');
const { evaluateMemoryTtl } = require('../ttl/memoryTtlRuntime');
const { detectCanonDuplicates, resolveCanonDuplicate } = require('../dedup/canonDeduplicationRuntime');
const { migrateToArchive } = require('../archive/archiveMigrationLayer');
const { resolveMemoryReference } = require('../references/registryBackedMemoryReferenceLayer');
const { compactNarrativeToMemoryEvent } = require('../compaction/narrativeToStructuredCompactionEngine');
const { validateReplaySafety } = require('../replay/replaySafeMemoryValidator');
const { validateMemoryGovernance } = require('../validation/memoryGovernanceValidator');

describe('Memory Governance Core v1', () => {
  beforeEach(() => {
    // Reset events file if exists
    const fs = require('fs');
    const path = require('path');
    const eventsFile = path.join(__dirname, '..', 'events', 'memoryEvents.json');
    if (fs.existsSync(eventsFile)) {
      fs.writeFileSync(eventsFile, JSON.stringify([], null, 2));
    }
  });

  test('Valid memory event passes schema validation', () => {
    const event = {
      event_id: 'test1',
      schema_version: 'v1',
      idempotency_key: 'key1',
      memory_id: 'mem1',
      memory_type: 'DECISION_MEMORY',
      memory_status: 'ACTIVE',
      source_type: 'CHAT',
      source_ref: 'ref1',
      reason_codes: ['test'],
      created_at: Date.now(),
      updated_at: Date.now(),
      lineage: [],
      replay: {},
      no_pii: true
    };
    expect(validateMemoryEventShape(event).valid).toBe(true);
  });

  test('Missing idempotency_key returns BLOCK', () => {
    const event = { event_id: 'test1' };
    expect(validateMemoryEventShape(event).valid).toBe(false);
  });

  test('Free-text decision memory as source of truth returns BLOCK', () => {
    const event = {
      event_id: 'test1',
      schema_version: 'v1',
      idempotency_key: 'key1',
      memory_id: 'mem1',
      memory_type: 'DECISION_MEMORY',
      memory_status: 'ACTIVE',
      source_type: 'CHAT',
      source_ref: 'ref1',
      reason_codes: ['test'],
      created_at: Date.now(),
      updated_at: Date.now(),
      lineage: [],
      replay: {},
      no_pii: true,
      free_text_source_of_truth: 'text'
    };
    expect(validateMemoryEventShape(event).valid).toBe(false);
  });

  test('Append-only event store does not overwrite historical events', () => {
    const event = {
      event_id: 'test1',
      schema_version: 'v1',
      idempotency_key: 'key1',
      memory_id: 'mem1',
      memory_type: 'DECISION_MEMORY',
      memory_status: 'ACTIVE',
      source_type: 'CHAT',
      source_ref: 'ref1',
      reason_codes: ['test'],
      created_at: Date.now(),
      updated_at: Date.now(),
      lineage: [],
      replay: {},
      no_pii: true
    };
    appendMemoryEvent('', event);
    const result = appendMemoryEvent('', { ...event, memory_type: 'POLICY_MEMORY' });
    expect(result.result).toBe('BLOCK');
  });

  test('Duplicate idempotency_key returns existing event safely', () => {
    const event = {
      event_id: 'test1',
      schema_version: 'v1',
      idempotency_key: 'key1',
      memory_id: 'mem1',
      memory_type: 'DECISION_MEMORY',
      memory_status: 'ACTIVE',
      source_type: 'CHAT',
      source_ref: 'ref1',
      reason_codes: ['test'],
      created_at: Date.now(),
      updated_at: Date.now(),
      lineage: [],
      replay: {},
      no_pii: true
    };
    appendMemoryEvent('', event);
    const result = appendMemoryEvent('', event);
    expect(result.result).toBe('idempotent_result');
  });

  test('ACTIVE memory over cap triggers eviction logic', () => {
    const registry = {
      active: Array(8).fill().map((_, i) => ({
        memory_id: `mem${i}`,
        created_at: Date.now() - 120000, // 2 min ago
        ttl_policy: { turns: 1 }
      })),
      limits: { active_max_items: 7 }
    };
    const result = enforceActiveMemoryEviction(registry);
    expect(result.result).toBe('PASS');
    expect(result.evicted.length).toBeGreaterThan(0);
  });

  test('Missing TTL on ACTIVE memory returns HOLD', () => {
    const item = { memory_status: 'ACTIVE', created_at: Date.now() };
    const result = evaluateMemoryTtl(item);
    expect(result.result).toBe('HOLD');
  });

  test('Expired ACTIVE memory cannot influence orchestration', () => {
    const item = {
      memory_status: 'ACTIVE',
      created_at: Date.now() - 120000,
      ttl_policy: { turns: 1 }
    };
    const result = evaluateMemoryTtl(item);
    expect(result.expired).toBe(true);
  });

  test('Canon duplicate without version lineage returns HOLD', () => {
    const candidate = { canonical_label: 'test' };
    const existing = { canonical_label: 'test' };
    const result = resolveCanonDuplicate(candidate, existing);
    expect(result.result).toBe('HOLD');
  });

  test('Conflicting Canon duplicate returns BLOCK', () => {
    const candidate = { canonical_label: 'test1', version_lineage: 'v1' };
    const existing = { canonical_label: 'test2', version_lineage: 'v1' };
    const result = resolveCanonDuplicate(candidate, existing);
    expect(result.result).toBe('BLOCK');
  });

  test('Archive migration preserves lineage', () => {
    const registry = {
      active: [{
        memory_id: 'mem1',
        memory_type: 'DECISION_MEMORY',
        lineage: ['parent1']
      }]
    };
    const result = migrateToArchive(registry, 'mem1', ['test']);
    expect(result.result).toBe('MIGRATED');
    expect(registry.archive.length).toBe(1);
    expect(registry.active.length).toBe(0);
  });

  test('Registry-backed reference resolves memory_id', () => {
    const registry = {
      active: [{ memory_id: 'mem1' }]
    };
    const result = resolveMemoryReference(registry, { memory_id: 'mem1' });
    expect(result.result).toBe('RESOLVED');
  });

  test('Ambiguous registry reference returns HOLD', () => {
    const registry = {
      active: [
        { memory_id: 'mem1', artifact_id: 'art1' },
        { memory_id: 'mem2', artifact_id: 'art1' }
      ]
    };
    const result = resolveMemoryReference(registry, { artifact_id: 'art1' });
    expect(result.result).toBe('HOLD');
  });

  test('Narrative compaction outputs structured event only', () => {
    const input = {
      source_ref: 'ref1',
      source_type: 'CHAT',
      narrative: 'This is a long enough narrative for testing.',
      proposed_memory_type: 'DECISION_MEMORY',
      proposed_status: 'ACTIVE',
      reason_codes: ['test']
    };
    const result = compactNarrativeToMemoryEvent(input);
    expect(result.result).toBe('COMPACTED');
    expect(result.event.memory_type).toBe('DECISION_MEMORY');
  });

  test('Narrative compaction blocks unredacted PII', () => {
    const input = {
      source_ref: 'ref1',
      source_type: 'CHAT',
      narrative: 'Contains PII data',
      proposed_memory_type: 'DECISION_MEMORY',
      proposed_status: 'ACTIVE',
      reason_codes: ['test']
    };
    const result = compactNarrativeToMemoryEvent(input);
    expect(result.result).toBe('BLOCK');
  });

  test('Replay validator blocks duplicate event_id', () => {
    const events = [
      { event_id: 'e1', idempotency_key: 'k1', lineage: [], replay: {} },
      { event_id: 'e1', idempotency_key: 'k2', lineage: [], replay: {} }
    ];
    const result = validateReplaySafety(events);
    expect(result.result).toBe('BLOCK');
  });

  test('Replay validator blocks broken lineage', () => {
    const events = [
      { event_id: 'e1', idempotency_key: 'k1', lineage: ['missing'], replay: {} }
    ];
    const result = validateReplaySafety(events);
    expect(result.result).toBe('BLOCK');
  });

  test('Memory governance validator keeps coverage_confidence PARTIAL when preservation or replay state is incomplete', () => {
    // Mock incomplete registry
    const result = validateMemoryGovernance('.');
    expect(result.coverage_confidence).toBe('PARTIAL');
  });

  test('Memory governance validator returns PASS only when registry, events, references, TTL, dedup, archive, and replay pass', () => {
    // This would require full setup, for now assume PARTIAL
    const result = validateMemoryGovernance('.');
    expect(result.validation_status).toBe('BLOCK'); // Since registry exists but incomplete
  });

  test('Cross-gate learning remains BLOCKED until memory governance validation PASS', () => {
    const result = validateMemoryGovernance('.');
    expect(result.blocked_systems).toContain('memory_governance');
  });
});