const fs = require('fs');

function verifyLineageContinuity(lineageRecords, artifactRegistry, codexQueue) {
  const result = {
    valid_lineage: [],
    broken_lineage: []
  };

  const artifactIds = new Set((artifactRegistry || []).map(a => a.artifact_id).filter(Boolean));
  const queueTaskIds = new Set((codexQueue || []).map(entry => entry.codex_task_id || entry.task_id || `${entry.artifact_id}`));

  for (const record of lineageRecords || []) {
    const brokenReasons = [];
    if (!record.source_chat_id) brokenReasons.push('missing_source_chat_id');
    if (!record.artifact_id) brokenReasons.push('missing_artifact_id');
    if (!record.canon_file) brokenReasons.push('missing_canon_file');
    if (!record.codex_task_id) brokenReasons.push('missing_codex_task_id');
    if (!record.validation_result) brokenReasons.push('missing_validation_result');
    if (record.artifact_id && !artifactIds.has(record.artifact_id)) brokenReasons.push('artifact_not_registered');
    if (record.codex_task_id && !queueTaskIds.has(record.codex_task_id)) brokenReasons.push('codex_task_not_found');
    if (brokenReasons.length) {
      result.broken_lineage.push({ record, broken_reasons: brokenReasons });
    } else {
      result.valid_lineage.push(record);
    }
  }

  return result;
}

module.exports = { verifyLineageContinuity };