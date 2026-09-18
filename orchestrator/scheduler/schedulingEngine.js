function determineSchedulingDecision(artifact, registryState) {
  let decision = 'IGNORE';
  const reasons = [];

  if (artifact.priority === 'P0') {
    if (artifact.status === 'READY_FOR_CODEX' && artifact.validation_status === 'present') {
      if (!artifact.blocked_systems || artifact.blocked_systems.length === 0) {
        decision = 'SCHEDULE_NOW';
        reasons.push('P0_READY_NO_BLOCKERS');
      } else {
        decision = 'HOLD';
        reasons.push('P0_BLOCKED_SYSTEMS');
      }
    } else {
      decision = 'HOLD';
      reasons.push('P0_NOT_READY');
    }
  } else if (artifact.artifact_type === 'NOISE') {
    decision = 'IGNORE';
    reasons.push('NOISE_ARTIFACT');
  } else if (artifact.status === 'ARCHIVE_ONLY') {
    decision = 'ARCHIVE';
    reasons.push('ARCHIVE_ONLY');
  } else {
    decision = 'QUEUE';
    reasons.push('STANDARD_QUEUE');
  }

  return {
    scheduler_decision: decision,
    reason_codes: reasons
  };
}

module.exports = { determineSchedulingDecision };