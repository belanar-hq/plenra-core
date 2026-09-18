function compactNarrativeToMemoryEvent(input) {
  const { source_ref, source_type, narrative, proposed_memory_type, proposed_status, reason_codes } = input;

  // Check for PII
  if (narrative.includes('PII') && !input.no_pii) {
    return { result: 'BLOCK', reason: 'Unredacted PII in narrative' };
  }

  // Simulate deterministic extraction - in real impl, use NLP or rules
  if (!narrative || narrative.length < 10) {
    return { result: 'HOLD', reason: 'Deterministic extraction impossible' };
  }

  const event = {
    event_id: `compacted_${Date.now()}`,
    schema_version: 'memory_event_v1',
    idempotency_key: `compact_${source_ref}`,
    memory_id: `mem_${Date.now()}`,
    memory_type: proposed_memory_type,
    memory_status: proposed_status,
    source_type,
    source_ref,
    reason_codes,
    created_at: Date.now(),
    updated_at: Date.now(),
    lineage: [],
    replay: {},
    no_pii: true
  };

  return { result: 'COMPACTED', event };
}

module.exports = {
  compactNarrativeToMemoryEvent
};