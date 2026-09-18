function createLineageRecord(input) {
  return {
    source_chat_id: input.source_chat_id,
    artifact_id: input.artifact_id,
    canon_file: input.canon_file,
    codex_task_id: input.codex_task_id,
    validation_result: input.validation_result || null,
    implementation_status: input.implementation_status || 'PENDING',
    parent_artifact_ids: input.parent_artifact_ids || [],
    derived_artifact_ids: input.derived_artifact_ids || []
  };
}

function validateLineage(record) {
  return !!(record.source_chat_id && record.artifact_id && record.canon_file);
}

function findLineageByArtifactId(records, artifact_id) {
  return records.find(r => r.artifact_id === artifact_id);
}

module.exports = {
  createLineageRecord,
  validateLineage,
  findLineageByArtifactId
};