function resolveMemoryReference(memoryRegistry, ref) {
  const active = memoryRegistry.active || [];
  const canon = memoryRegistry.canon || [];
  const archive = memoryRegistry.archive || [];

  let candidates = [];

  if (ref.memory_id) {
    candidates = [...active, ...canon, ...archive].filter(i => i.memory_id === ref.memory_id);
  } else if (ref.artifact_id) {
    candidates = [...active, ...canon, ...archive].filter(i => i.artifact_id === ref.artifact_id);
  } else if (ref.source_chat_id) {
    candidates = [...active, ...canon, ...archive].filter(i => i.source_ref === ref.source_chat_id);
  } else if (ref.event_id) {
    candidates = [...active, ...canon, ...archive].filter(i => i.event_id === ref.event_id);
  } else if (ref.canon_path) {
    candidates = canon.filter(i => i.canon_path === ref.canon_path);
  }

  if (candidates.length === 0) {
    return { result: 'HOLD', reason: 'Missing reference' };
  }

  if (candidates.length > 1) {
    return { result: 'HOLD', reason: 'Ambiguous reference' };
  }

  return { result: 'RESOLVED', item: candidates[0] };
}

function createMemoryReference(memoryItem) {
  return {
    memory_id: memoryItem.memory_id,
    artifact_id: memoryItem.artifact_id,
    source_chat_id: memoryItem.source_ref,
    event_id: memoryItem.event_id,
    canon_path: memoryItem.canon_path
  };
}

module.exports = {
  resolveMemoryReference,
  createMemoryReference
};