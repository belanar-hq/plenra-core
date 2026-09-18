function validateReplaySafety(events) {
  const eventIds = new Set();
  const idempotencyKeys = new Set();

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    // Check duplicate event_id
    if (eventIds.has(event.event_id)) {
      return { result: 'BLOCK', reason: 'Duplicate event_id', event_id: event.event_id };
    }
    eventIds.add(event.event_id);

    // Check idempotency
    if (!event.idempotency_key) {
      return { result: 'BLOCK', reason: 'Missing idempotency_key', event_id: event.event_id };
    }
    if (idempotencyKeys.has(event.idempotency_key)) {
      return { result: 'BLOCK', reason: 'Duplicate idempotency_key', event_id: event.event_id };
    }
    idempotencyKeys.add(event.idempotency_key);

    // Check lineage
    if (!event.lineage || !Array.isArray(event.lineage)) {
      return { result: 'BLOCK', reason: 'Missing or invalid lineage', event_id: event.event_id };
    }

    // Check replay
    if (!event.replay) {
      return { result: 'BLOCK', reason: 'Missing replay data', event_id: event.event_id };
    }

    // Check parent references
    for (const parent of event.lineage) {
      const parentEvent = events.find(e => e.event_id === parent);
      if (!parentEvent) {
        return { result: 'BLOCK', reason: 'Broken parent reference', event_id: event.event_id, parent };
      }
    }

    // Check active expired memory
    if (event.memory_status === 'ACTIVE') {
      const age = Date.now() - event.created_at;
      if (age > 60000) { // 1 min
        return { result: 'BLOCK', reason: 'Active expired memory in replay path', event_id: event.event_id };
      }
    }
  }

  return { result: 'PASS' };
}

module.exports = {
  validateReplaySafety
};