function extractOperationalArtifacts(chat) {
  const content = chat.content || JSON.stringify(chat);
  const artifacts = [];

  // Simple extraction logic - in real impl, use NLP or regex
  const lines = content.split('\n');
  let currentArtifact = null;

  for (const line of lines) {
    if (line.includes('artifact_id:') || line.includes('INFRASTRUCTURE_CORE') || line.includes('POLICY_GUARDRAIL')) {
      if (currentArtifact) {
        artifacts.push(currentArtifact);
      }
      currentArtifact = { content: line };
    } else if (currentArtifact) {
      currentArtifact.content += '\n' + line;
    }
  }

  if (currentArtifact) {
    artifacts.push(currentArtifact);
  }

  return artifacts.map(a => classifyArtifactType(a));
}

function classifyArtifactType(extracted) {
  const content = extracted.content.toLowerCase();

  if (content.includes('infrastructure') && content.includes('core')) {
    return { ...extracted, artifact_type: 'INFRASTRUCTURE_CORE' };
  }
  if (content.includes('policy') && content.includes('guardrail')) {
    return { ...extracted, artifact_type: 'POLICY_GUARDRAIL' };
  }
  if (content.includes('decision gate')) {
    return { ...extracted, artifact_type: 'DECISION_GATE' };
  }
  if (content.includes('agent spec')) {
    return { ...extracted, artifact_type: 'AGENT_SPEC' };
  }
  if (content.includes('schema') && content.includes('contract')) {
    return { ...extracted, artifact_type: 'SCHEMA_CONTRACT' };
  }
  if (content.includes('prompt') && content.includes('asset')) {
    return { ...extracted, artifact_type: 'PROMPT_ASSET' };
  }
  if (content.includes('validation') && content.includes('test')) {
    return { ...extracted, artifact_type: 'VALIDATION_TEST' };
  }
  if (content.includes('execution') && content.includes('automation')) {
    return { ...extracted, artifact_type: 'EXECUTION_AUTOMATION' };
  }
  if (content.includes('dataset') && content.includes('schema')) {
    return { ...extracted, artifact_type: 'DATASET_SCHEMA' };
  }
  if (content.includes('codex task')) {
    return { ...extracted, artifact_type: 'CODEX_TASK' };
  }
  if (content.includes('replay engine')) {
    return { ...extracted, artifact_type: 'REPLAY_ENGINE' };
  }
  if (content.includes('memory rule')) {
    return { ...extracted, artifact_type: 'MEMORY_RULE' };
  }
  if (content.includes('dependency rule')) {
    return { ...extracted, artifact_type: 'DEPENDENCY_RULE' };
  }

  return { ...extracted, artifact_type: 'NOISE' };
}

function buildArtifactRecord(extracted, source_chat_id) {
  const artifact_id = extracted.artifact_id || `provisional_${Date.now()}`;
  return {
    artifact_id,
    artifact_type: extracted.artifact_type,
    source_chat_id,
    content: extracted.content,
    extracted_at: Date.now(),
    maturity_status: extracted.artifact_id ? 'READY_FOR_INGESTION' : 'NEEDS_STRUCTURE'
  };
}

module.exports = {
  extractOperationalArtifacts,
  classifyArtifactType,
  buildArtifactRecord
};