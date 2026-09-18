const { appendMemoryEvent } = require('../events/memoryEventStore');

function migrateToArchive(memoryRegistry, memory_id, reason_codes) {
  const active = memoryRegistry.active || [];
  const canon = memoryRegistry.canon || [];

  let item = active.find(i => i.memory_id === memory_id);
  let source = 'active';

  if (!item) {
    item = canon.find(i => i.memory_id === memory_id);
    source = 'canon';
  }

  if (!item) {
    return { result: 'HOLD', reason: 'Missing memory_id' };
  }

  // Create archive event
  const archiveEvent = {
    event_id: `archive_${memory_id}_${Date.now()}`,
    schema_version: 'memory_event_v1',
    idempotency_key: `archive_${memory_id}`,
    memory_id,
    memory_type: item.memory_type,
    memory_status: 'ARCHIVE',
    source_type: 'CODEX_VALIDATION',
    source_ref: memory_id,
    reason_codes,
    created_at: Date.now(),
    updated_at: Date.now(),
    lineage: item.lineage || [],
    replay: item.replay || {},
    no_pii: true
  };

  const appendResult = appendMemoryEvent('', archiveEvent);
  if (appendResult.result === 'BLOCK') {
    return { result: 'BLOCK', reason: appendResult.reason };
  }

  // Move to archive
  memoryRegistry.archive = [...(memoryRegistry.archive || []), item];

  // Remove from source
  if (source === 'active') {
    memoryRegistry.active = active.filter(i => i.memory_id !== memory_id);
  } else {
    memoryRegistry.canon = canon.filter(i => i.memory_id !== memory_id);
  }

  return { result: 'MIGRATED', item };
}

module.exports = {
  migrateToArchive
};