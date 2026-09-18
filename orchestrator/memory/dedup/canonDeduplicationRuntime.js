function detectCanonDuplicates(canonEntries) {
  const duplicates = [];
  const seen = new Set();

  for (const entry of canonEntries) {
    const key = `${entry.artifact_id || ''}-${entry.memory_id || ''}-${entry.source_ref || ''}-${entry.stable_hash || ''}-${entry.canonical_label || ''}`;
    if (seen.has(key)) {
      duplicates.push(entry);
    } else {
      seen.add(key);
    }
  }

  return duplicates;
}

function resolveCanonDuplicate(candidate, existing) {
  // Check for version lineage
  if (!candidate.version_lineage || !existing.version_lineage) {
    return { result: 'HOLD', reason: 'No explicit version lineage' };
  }

  // Check for conflicts
  if (candidate.canonical_label !== existing.canonical_label) {
    return { result: 'BLOCK', reason: 'Conflicting canonical labels' };
  }

  // Assume resolution if lineage exists and no conflict
  return { result: 'RESOLVED', action: 'MERGE' };
}

module.exports = {
  detectCanonDuplicates,
  resolveCanonDuplicate
};