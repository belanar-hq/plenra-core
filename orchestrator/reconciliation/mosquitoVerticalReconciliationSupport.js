function isMosquitoArtifact(artifact) {
  if (!artifact) return false;
  return artifact.artifact_type === 'MOSQUITO_VERTICAL' || (typeof artifact.artifact_id === 'string' && artifact.artifact_id.includes('mosquito_vertical'));
}

function validateMosquitoSupport(artifactRegistry) {
  const result = {
    allowed: [],
    blocked: []
  };

  for (const artifact of artifactRegistry || []) {
    if (!isMosquitoArtifact(artifact)) continue;
    if (artifact.routing_strategy === 'ADAPTIVE') {
      result.blocked.push({ artifact_id: artifact.artifact_id, reason: 'adaptive_routing_not_allowed' });
    } else {
      result.allowed.push({ artifact_id: artifact.artifact_id, reason: 'static_deterministic_gate' });
    }
  }

  return result;
}

module.exports = { isMosquitoArtifact, validateMosquitoSupport };