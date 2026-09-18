const fs = require('fs');
const path = require('path');
const { writeCanonArtifact } = require('../../storage/canonWriter');
const { createHashForFile } = require('../../hashes/hashManager');
const { resolveMemoryReference } = require('../../memory/references/registryBackedMemoryReferenceLayer');

function preserveArtifactToCanon(rootPath, artifact) {
  const result = writeCanonArtifact(rootPath, artifact);

  if (!result || !result.paths || result.paths.length === 0) {
    return { result: 'BLOCK', reason: 'Canon write failed' };
  }

  const jsonPath = result.paths[0];
  const manifestPath = result.paths[1];

  if (fs.existsSync(jsonPath)) {
    const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    if (artifact.artifact_id === existing.artifact_id && artifact.canonical_label && existing.canonical_label && artifact.canonical_label !== existing.canonical_label) {
      return { result: 'BLOCK', reason: 'Conflicting canonical labels' };
    }

    if (artifact.artifact_id === existing.artifact_id && !artifact.version_lineage && !existing.version_lineage) {
      const currentPayload = JSON.stringify(artifact);
      const existingPayload = JSON.stringify(existing);
      if (currentPayload === existingPayload) {
        return {
          result: 'PRESERVED',
          paths: result.paths,
          hashes: result.hashes,
          artifact_id: artifact.artifact_id
        };
      }
      return { result: 'HOLD', reason: 'No version lineage for duplicate' };
    }
  }

  const registryPath = path.join(rootPath, 'orchestrator', 'registry', 'artifactRegistry.json');
  let registry = [];
  if (fs.existsSync(registryPath)) {
    const content = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    registry = Array.isArray(content) ? content : content.artifacts || [];
  }
  registry.push({
    artifact_id: artifact.artifact_id,
    preserved_at: Date.now(),
    paths: result.paths,
    hashes: result.hashes
  });
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

  return {
    result: 'PRESERVED',
    paths: result.paths,
    hashes: result.hashes,
    artifact_id: artifact.artifact_id
  };
}

function preserveArtifactsBatch(rootPath, artifacts) {
  const results = [];
  for (const artifact of artifacts) {
    const result = preserveArtifactToCanon(rootPath, artifact);
    results.push(result);
    if (result.result === 'BLOCK') {
      break; // Fail fast
    }
  }
  return results;
}

module.exports = {
  preserveArtifactToCanon,
  preserveArtifactsBatch
};