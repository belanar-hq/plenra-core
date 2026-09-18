function scoreChatMaturity(chatRecord, artifacts) {
  // Placeholder: based on artifacts
  if (artifacts.length === 0) {
    return 'NOISE';
  }
  const readyCount = artifacts.filter(a => a.maturity_status === 'READY_FOR_CODEX').length;
  if (readyCount > 0) {
    return 'READY_FOR_CODEX';
  }
  return 'NEEDS_STRUCTURE';
}

function scoreArtifactMaturity(artifact) {
  const content = artifact.content || '';

  const hasArtifactId = artifact.artifact_id && !artifact.artifact_id.startsWith('provisional');
  const hasDeterministicRules = content.includes('deterministic') || content.includes('rules');
  const hasValidationRequirements = content.includes('validation') || content.includes('requirements');
  const hasFailClosedLogic = content.includes('fail-closed') || content.includes('fail closed');
  const hasDependencies = content.includes('dependencies') || content.includes('dependency');
  const hasImplementationPath = content.includes('implementation') || content.includes('path');
  const hasAcceptanceCriteria = content.includes('acceptance') || content.includes('criteria');

  const requirements = [
    hasArtifactId,
    hasDeterministicRules,
    hasValidationRequirements,
    hasFailClosedLogic,
    hasDependencies,
    hasImplementationPath,
    hasAcceptanceCriteria
  ];

  const missing = requirements.filter(r => !r).length;

  if (missing === 0) {
    return { maturity_status: 'READY_FOR_CODEX', missing_requirements: [] };
  }

  const missingReqs = [];
  if (!hasArtifactId) missingReqs.push('artifact_id');
  if (!hasDeterministicRules) missingReqs.push('deterministic_rules');
  if (!hasValidationRequirements) missingReqs.push('validation_requirements');
  if (!hasFailClosedLogic) missingReqs.push('fail_closed_logic');
  if (!hasDependencies) missingReqs.push('dependencies');
  if (!hasImplementationPath) missingReqs.push('implementation_path');
  if (!hasAcceptanceCriteria) missingReqs.push('acceptance_criteria');

  if (missingReqs.length > 3) {
    return { maturity_status: 'NEEDS_STRUCTURE', missing_requirements: missingReqs };
  }
  if (missingReqs.includes('validation_requirements') || missingReqs.includes('fail_closed_logic')) {
    return { maturity_status: 'NEEDS_VALIDATION', missing_requirements: missingReqs };
  }
  return { maturity_status: 'NEEDS_DECISION', missing_requirements: missingReqs };
}

module.exports = {
  scoreChatMaturity,
  scoreArtifactMaturity
};