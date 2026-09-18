const { validateRuntimeTransition } = require('./stateMachine');

function restoreRuntimeState(events, executionId) {
  if (!executionId) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['MISSING_EXECUTION_ID'],
      error: 'execution_id is required for state restoration'
    };
  }

  if (!Array.isArray(events)) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['MALFORMED_EVENT_STREAM'],
      error: 'events must be an array'
    };
  }

  const executionEvents = events
    .filter((event) => event.execution_id === executionId)
    .slice()
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));

  if (executionEvents.length === 0) {
    return {
      valid: false,
      status: 'HOLD',
      reason_codes: ['NO_RUNTIME_EVENTS_FOUND'],
      error: 'No events found for execution_id'
    };
  }

  const seenEventIds = new Set();
  const seenIdempotency = new Map();
  let latestState = null;
  let previousEvent = null;

  for (const event of executionEvents) {
    const validation = validateRestorationEvent(event);
    if (validation.status !== 'PASS') {
      return validation;
    }

    if (seenEventIds.has(event.event_id)) {
      return block('DUPLICATE_RUNTIME_EVENT_ID', `Duplicate event_id ${event.event_id}`);
    }
    seenEventIds.add(event.event_id);

    if (seenIdempotency.has(event.idempotency_key) && seenIdempotency.get(event.idempotency_key) !== event.payload_hash) {
      return block('IDEMPOTENCY_KEY_PAYLOAD_CONFLICT', `Conflicting duplicate idempotency_key ${event.idempotency_key}`);
    }
    seenIdempotency.set(event.idempotency_key, event.payload_hash);

    if (!previousEvent) {
      if (event.parent_event_id) {
        return block('BROKEN_RUNTIME_LINEAGE', 'First execution event must not have a parent_event_id');
      }
    } else if (event.parent_event_id !== previousEvent.event_id || event.previous_state !== latestState) {
      return block('BROKEN_RUNTIME_LINEAGE', 'Runtime event parent or previous_state does not match restored chain');
    }

    const transition = validateRuntimeTransition({
      current_state: event.previous_state,
      next_state: event.next_state
    });
    if (transition.status !== 'PASS') {
      return transition;
    }

    latestState = event.next_state;
    previousEvent = event;
  }

  return {
    valid: true,
    status: 'PASS',
    reason_codes: ['RUNTIME_STATE_RESTORED'],
    execution_id: executionId,
    current_state: latestState,
    latest_event_id: previousEvent.event_id,
    event_count: executionEvents.length
  };
}

function validateRestorationEvent(event) {
  const required = [
    'event_id',
    'idempotency_key',
    'timestamp',
    'module_id',
    'gate_id',
    'execution_id',
    'previous_state',
    'next_state',
    'event_type',
    'reason_code',
    'payload_hash',
    'schema_version',
    'lineage'
  ];

  const missing = required.filter((field) => !event[field]);
  if (missing.length > 0) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['CORRUPTED_RUNTIME_EVENT'],
      missing_fields: missing,
      error: `Runtime event is missing fields: ${missing.join(', ')}`
    };
  }

  if (event.lineage.execution_id !== event.execution_id || event.lineage.gate_id !== event.gate_id) {
    return block('BROKEN_RUNTIME_LINEAGE', 'Event lineage does not match event identifiers');
  }

  return {
    valid: true,
    status: 'PASS'
  };
}

function block(reasonCode, error) {
  return {
    valid: false,
    status: 'BLOCK',
    reason_codes: [reasonCode],
    error
  };
}

module.exports = {
  restoreRuntimeState,
  validateRestorationEvent
};
