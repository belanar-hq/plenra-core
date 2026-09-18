function detectDependencyDesync(artifactRegistry, dependencyGraph) {
  const artifactIds = new Set((artifactRegistry || []).map(a => a.artifact_id).filter(Boolean));
  const missingDependencies = [];
  const circularDependencies = [];
  const unresolvedBlockers = [];
  const mismatchedBlockedSystems = [];

  const edges = new Map();
  if (dependencyGraph && typeof dependencyGraph === 'object') {
    for (const key of Object.keys(dependencyGraph)) {
      const entry = dependencyGraph[key];
      if (!entry || !entry.artifact_id) continue;
      const deps = [];
      if (Array.isArray(entry.validation_dependencies)) deps.push(...entry.validation_dependencies);
      if (Array.isArray(entry.replay_dependencies)) deps.push(...entry.replay_dependencies);
      if (Array.isArray(entry.codex_dependencies)) deps.push(...entry.codex_dependencies);
      edges.set(entry.artifact_id, deps);

      for (const dependencyId of deps) {
        if (!artifactIds.has(dependencyId)) {
          missingDependencies.push({ artifact_id: entry.artifact_id, missing_dependency: dependencyId });
        }
      }
      if (Array.isArray(entry.blocked_by)) {
        for (const blockedBy of entry.blocked_by) {
          if (!artifactIds.has(blockedBy)) {
            unresolvedBlockers.push({ artifact_id: entry.artifact_id, blocked_by: blockedBy });
          }
        }
      }
    }
  }

  function detectCycle(artifactId, visited, stack) {
    if (!edges.has(artifactId)) return false;
    if (stack.has(artifactId)) {
      circularDependencies.push([...stack, artifactId].join(' -> '));
      return true;
    }
    if (visited.has(artifactId)) return false;
    visited.add(artifactId);
    stack.add(artifactId);
    for (const next of edges.get(artifactId)) {
      detectCycle(next, visited, stack);
    }
    stack.delete(artifactId);
    return false;
  }

  for (const artifactId of edges.keys()) {
    detectCycle(artifactId, new Set(), new Set());
  }

  for (const artifact of artifactRegistry || []) {
    if (!artifact || !artifact.artifact_id) continue;
    const graphEntry = dependencyGraph && dependencyGraph[artifact.artifact_id];
    if (artifact.blocked_systems && Array.isArray(artifact.blocked_systems) && graphEntry) {
      const blockedBy = new Set(graphEntry.blocked_by || []);
      for (const blockedSystem of artifact.blocked_systems) {
        if (!blockedBy.has(blockedSystem)) {
          mismatchedBlockedSystems.push({ artifact_id: artifact.artifact_id, mismatched_system: blockedSystem });
        }
      }
    }
  }

  return {
    missing_dependencies: missingDependencies,
    circular_dependencies: circularDependencies,
    unresolved_blockers: unresolvedBlockers,
    mismatched_blocked_systems: mismatchedBlockedSystems
  };
}

module.exports = { detectDependencyDesync };