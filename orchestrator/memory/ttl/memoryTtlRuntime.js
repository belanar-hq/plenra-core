function evaluateMemoryTtl(memoryItem, now = Date.now()) {
  if (memoryItem.memory_status === 'CANON') {
    // CANON does not expire unless deprecated
    if (memoryItem.deprecated) {
      return { expired: true, reason: 'Deprecated CANON' };
    }
    return { expired: false };
  }

  if (memoryItem.memory_status === 'ARCHIVE') {
    return { expired: false, read_only: true };
  }

  if (memoryItem.memory_status === 'ACTIVE') {
    if (!memoryItem.ttl_policy) {
      return { result: 'HOLD', reason: 'Missing TTL on ACTIVE memory' };
    }

    const age = now - memoryItem.created_at;
    const ttlMs = memoryItem.ttl_policy.turns * 60000; // 1 turn = 1 min
    if (age > ttlMs) {
      return { expired: true, reason: 'TTL exceeded' };
    }
    return { expired: false };
  }

  return { expired: false };
}

module.exports = {
  evaluateMemoryTtl
};