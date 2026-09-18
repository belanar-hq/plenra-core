function detectCodexRegression(artifactRegistry, codexQueue) {
  const result = {
    missing_queue_entries: [],
    downgraded_without_reason: [],
    missing_acceptance_criteria: []
  };

  const queueArtifactIds = new Set((codexQueue || []).map(entry => entry.artifact_id).filter(Boolean));

  for (const artifact of artifactRegistry || []) {
    if (!artifact || !artifact.artifact_id) continue;
    const isReady = artifact.maturity_status === 'READY_FOR_CODEX' || artifact.codex_readiness === 'READY';
    if (isReady && !queueArtifactIds.has(artifact.artifact_id)) {
      result.missing_queue_entries.push(artifact.artifact_id);
    }
    if (isReady && !artifact.acceptance_criteria) {
      result.missing_acceptance_criteria.push(artifact.artifact_id);
    }
    if (artifact.previous_maturity_status === 'READY_FOR_CODEX' && artifact.maturity_status !== 'READY_FOR_CODEX' && !artifact.downgrade_reason) {
      result.downgraded_without_reason.push(artifact.artifact_id);
    }
  }

  return result;
}

module.exports = { detectCodexRegression };