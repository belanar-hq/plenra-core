const fs = require('fs');
const path = require('path');
const { createHashForFile } = require('../hashes/hashManager');

const typeToFolder = {
  INFRASTRUCTURE_CORE: 'infrastructure',
  POLICY_GUARDRAIL: 'policies',
  DECISION_GATE: 'gates',
  AGENT_SPEC: 'agents',
  SCHEMA_CONTRACT: 'schemas',
  PROMPT_ASSET: 'prompts',
  VALIDATION_TEST: 'tests',
  CODEX_TASK: 'codex_tasks',
  DATASET_SCHEMA: 'datasets'
};

function writeCanonArtifact(rootPath, artifact) {
  const folder = typeToFolder[artifact.artifact_type] || 'archive';
  const canonPath = path.join(rootPath, 'canon', folder);
  if (!fs.existsSync(canonPath)) {
    fs.mkdirSync(canonPath, { recursive: true });
  }

  const jsonPath = path.join(canonPath, `${artifact.artifact_id}.json`);
  const mdPath = path.join(canonPath, `${artifact.artifact_id}.md`);

  // Check if file exists and version is higher
  if (fs.existsSync(jsonPath)) {
    const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const jsonHash = createHashForFile(jsonPath);
    const mdHash = fs.existsSync(mdPath) ? createHashForFile(mdPath) : null;

    if (artifact.version == null || existing.version == null) {
      return {
        paths: [jsonPath, mdPath],
        hashes: [jsonHash, mdHash],
        existing: true,
        did_write: false
      };
    }

    if (artifact.version <= existing.version) {
      return {
        paths: [jsonPath, mdPath],
        hashes: [jsonHash, mdHash],
        existing: true,
        did_write: false
      };
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(mdPath, `# ${artifact.artifact_id}\n\n${artifact.description || 'No description'}`);

  const jsonHash = createHashForFile(jsonPath);
  const mdHash = createHashForFile(mdPath);

  return {
    paths: [jsonPath, mdPath],
    hashes: [jsonHash, mdHash]
  };
}

module.exports = { writeCanonArtifact };