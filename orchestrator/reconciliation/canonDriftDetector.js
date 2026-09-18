const fs = require('fs');
const path = require('path');
const { verifyFileHash, createHashForFile } = require('../hashes/hashManager');

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

function detectCanonDrift(rootPath, artifactRegistry) {
  const result = {
    missing_canon_files: [],
    missing_markdown_files: [],
    hash_mismatches: [],
    version_mismatches: [],
    stale_canon_files: []
  };

  for (const artifact of artifactRegistry) {
    if (!artifact || !artifact.artifact_id) continue;
    const folder = typeToFolder[artifact.artifact_type] || 'archive';
    const jsonPath = path.join(rootPath, 'canon', folder, `${artifact.artifact_id}.json`);
    const mdPath = path.join(rootPath, 'canon', folder, `${artifact.artifact_id}.md`);

    if (!fs.existsSync(jsonPath)) {
      result.missing_canon_files.push(artifact.artifact_id);
      continue;
    }
    if (!fs.existsSync(mdPath)) {
      result.missing_markdown_files.push(artifact.artifact_id);
    }
    if (artifact.hash && !verifyFileHash(jsonPath, artifact.hash)) {
      result.hash_mismatches.push(artifact.artifact_id);
    }
    try {
      const canon = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (artifact.version != null && canon.version != null && artifact.version !== canon.version) {
        result.version_mismatches.push(artifact.artifact_id);
        if (artifact.version < canon.version) {
          result.stale_canon_files.push(artifact.artifact_id);
        }
      }
    } catch (e) {
      result.hash_mismatches.push(artifact.artifact_id);
    }
  }

  return result;
}

module.exports = { detectCanonDrift };