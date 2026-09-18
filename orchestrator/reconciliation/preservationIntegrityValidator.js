const fs = require('fs');
const path = require('path');

const typeToFolder = {
  INFRASTRUCTURE_CORE: 'infrastructure',
  POLICY_GUARDRAIL: 'policies',
  DECISION_GATE: 'gates',
  AGENT_SPEC: 'agents',
  SCHEMA_CONTRACT: 'schemas',
  PROMPT_ASSET: 'prompts',
  VALIDATION_TEST: 'tests',
  CODEX_TASK: 'codex_tasks',
  DATASET_SCHEMA: 'datasets',
  MOSQUITO_VERTICAL: 'gates'
};

function validatePreservationIntegrity(rootPath, artifactRegistry) {
  const result = {
    preservation_issues: [],
    p0_p1_missing_files: [],
    missing_backup_status: []
  };

  for (const artifact of artifactRegistry || []) {
    if (!artifact || !artifact.artifact_id) continue;
    if (artifact.priority !== 'P0' && artifact.priority !== 'P1') continue;

    const folder = typeToFolder[artifact.artifact_type] || 'archive';
    const jsonPath = path.join(rootPath, 'canon', folder, `${artifact.artifact_id}.json`);
    const mdPath = path.join(rootPath, 'canon', folder, `${artifact.artifact_id}.md`);

    if (!fs.existsSync(jsonPath)) {
      result.p0_p1_missing_files.push({ artifact_id: artifact.artifact_id, missing: 'json' });
      result.preservation_issues.push(artifact.artifact_id);
    }
    if (!fs.existsSync(mdPath)) {
      result.p0_p1_missing_files.push({ artifact_id: artifact.artifact_id, missing: 'md' });
      result.preservation_issues.push(artifact.artifact_id);
    }
    if (artifact.external_backup_status !== 'backed_up') {
      result.missing_backup_status.push(artifact.artifact_id);
      result.preservation_issues.push(artifact.artifact_id);
    }
  }

  return result;
}

module.exports = { validatePreservationIntegrity };