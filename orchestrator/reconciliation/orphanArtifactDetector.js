const fs = require('fs');
const path = require('path');

function getAllCanonJsonFiles(rootPath) {
  const canonPath = path.join(rootPath, 'canon');
  const files = [];
  function traverse(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (path.extname(fullPath) === '.json') {
        files.push(fullPath);
      }
    }
  }
  if (fs.existsSync(canonPath)) {
    traverse(canonPath);
  }
  return files;
}

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

function detectOrphanArtifacts(rootPath, artifactRegistry) {
  const registeredIds = new Set((artifactRegistry || []).map(a => a.artifact_id).filter(Boolean));
  const orphanCanonFiles = [];
  const registryMissingCanon = [];
  const canonJsonFiles = getAllCanonJsonFiles(rootPath);

  for (const file of canonJsonFiles) {
    const id = path.basename(file, '.json');
    if (!registeredIds.has(id)) {
      orphanCanonFiles.push(id);
    }
  }

  for (const artifact of artifactRegistry || []) {
    if (!artifact || !artifact.artifact_id) continue;
    const folder = typeToFolder[artifact.artifact_type] || 'archive';
    const jsonPath = path.join(rootPath, 'canon', folder, `${artifact.artifact_id}.json`);
    if (!fs.existsSync(jsonPath)) {
      registryMissingCanon.push(artifact.artifact_id);
    }
  }

  return {
    orphan_canon_files: orphanCanonFiles,
    registry_missing_canon: registryMissingCanon
  };
}

module.exports = { detectOrphanArtifacts };