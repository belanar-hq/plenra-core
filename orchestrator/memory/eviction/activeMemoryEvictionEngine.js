function enforceActiveMemoryEviction(memoryRegistry, options = {}) {
  const active = memoryRegistry.active || [];
  const maxItems = memoryRegistry.limits?.active_max_items || 7;
  const ttlTurns = memoryRegistry.limits?.active_ttl_turns || 1;

  if (active.length <= maxItems) {
    return { result: 'PASS', evicted: [] };
  }

  const now = Date.now();
  const expired = [];
  const valid = [];

  for (const item of active) {
    const age = now - item.created_at;
    const ttlMs = ttlTurns * 60000; // Assume 1 turn = 1 minute for simplicity
    if (age > ttlMs) {
      expired.push(item);
    } else {
      valid.push(item);
    }
  }

  // For expired, try to demote to CANON or ARCHIVE
  const demoted = [];
  const held = [];

  for (const item of expired) {
    // Simulate Canon Gate check - for now, assume pass if not conflicting
    // In real impl, check against canon
    const canonGatePass = true; // Placeholder
    if (canonGatePass) {
      demoted.push({ ...item, memory_status: 'CANON' });
    } else {
      held.push(item);
    }
  }

  if (held.length > 0) {
    return { result: 'HOLD', reason: 'Cannot determine safe destination for expired memory', held };
  }

  // Update registry
  memoryRegistry.active = valid;
  memoryRegistry.canon = [...(memoryRegistry.canon || []), ...demoted];

  return { result: 'PASS', evicted: demoted };
}

module.exports = {
  enforceActiveMemoryEviction
};