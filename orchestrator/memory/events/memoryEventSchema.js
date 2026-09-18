const MEMORY_EVENT_SCHEMA = {
  required_fields: [
    'event_id',
    'schema_version',
    'idempotency_key',
    'memory_id',
    'memory_type',
    'memory_status',
    'source_type',
    'source_ref',
    'reason_codes',
    'created_at',
    'updated_at',
    'lineage',
    'replay'
  ],
  allowed_memory_types: [
    'DECISION_MEMORY',
    'POLICY_MEMORY',
    'PATTERN_MEMORY',
    'CONTEXT_MEMORY',
    'PREVENTED_LOSS_MEMORY'
  ],
  allowed_memory_statuses: [
    'ACTIVE',
    'CANON',
    'ARCHIVE',
    'REJECTED'
  ],
  allowed_source_types: [
    'CHAT',
    'ARTIFACT',
    'DECISION_EVENT',
    'OUTCOME_EVENT',
    'CODEX_VALIDATION',
    'MANUAL_CANON_APPROVAL'
  ]
};

function validateMemoryEventShape(event) {
  // Check required fields
  for (const field of MEMORY_EVENT_SCHEMA.required_fields) {
    if (!(field in event)) {
      return { valid: false, reason: `Missing required field: ${field}` };
    }
  }

  // Check memory_type
  if (!MEMORY_EVENT_SCHEMA.allowed_memory_types.includes(event.memory_type)) {
    return { valid: false, reason: `Invalid memory_type: ${event.memory_type}` };
  }

  // Check memory_status
  if (!MEMORY_EVENT_SCHEMA.allowed_memory_statuses.includes(event.memory_status)) {
    return { valid: false, reason: `Invalid memory_status: ${event.memory_status}` };
  }

  // Check source_type
  if (!MEMORY_EVENT_SCHEMA.allowed_source_types.includes(event.source_type)) {
    return { valid: false, reason: `Invalid source_type: ${event.source_type}` };
  }

  // Check reason_codes is array
  if (!Array.isArray(event.reason_codes)) {
    return { valid: false, reason: 'reason_codes must be an array' };
  }

  // Check no free_text_source_of_truth
  if ('free_text_source_of_truth' in event) {
    return { valid: false, reason: 'free_text_source_of_truth is forbidden' };
  }

  // Check no_pii
  if (event.no_pii !== true) {
    return { valid: false, reason: 'no_pii must be true unless explicitly authorized' };
  }

  return { valid: true };
}

module.exports = {
  MEMORY_EVENT_SCHEMA,
  validateMemoryEventShape
};