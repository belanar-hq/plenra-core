const fs = require('fs');
const path = require('path');

function validateRegistrySync(chatRegistry, artifactRegistry, codexQueue, rootPath) {
  const result = {
    missing_state: [],
    queue_mismatches: [],
    canon_sync_issues: [],
    chat_registry_issues: [],
    artifact_registry_issues: []
  };

  if (!chatRegistry) {
    result.missing_state.push('chatRegistry');
  }
  if (!artifactRegistry) {
    result.missing_state.push('artifactRegistry');
  }
  if (!codexQueue) {
    result.missing_state.push('codexQueue');
  }

  if (artifactRegistry) {
    const registeredIds = new Set(artifactRegistry.map(a => a.artifact_id).filter(Boolean));
    const canonRoot = path.join(rootPath, 'canon');
    if (fs.existsSync(canonRoot)) {
      const canonFiles = [];
      function traverse(dir) {
        for (const item of fs.readdirSync(dir)) {
          const fullPath = path.join(dir, item);
          if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
          } else if (path.extname(fullPath) === '.json') {
            canonFiles.push(path.basename(fullPath, '.json'));
          }
        }
      }
      traverse(canonRoot);
      for (const id of canonFiles) {
        if (!registeredIds.has(id)) {
          result.canon_sync_issues.push({ orphan_canon: id });
        }
      }
    }
    if (codexQueue) {
      const queueArtifactIds = new Set(codexQueue.map(entry => entry.artifact_id).filter(Boolean));
      for (const artifact of artifactRegistry) {
        if (artifact.maturity_status === 'READY_FOR_CODEX' || artifact.codex_readiness === 'READY') {
          if (!queueArtifactIds.has(artifact.artifact_id)) {
            result.queue_mismatches.push({ artifact_id: artifact.artifact_id, reason: 'READY artifact missing from queue' });
          }
        }
      }
    }
  }

  if (!chatRegistry && !artifactRegistry) {
    result.chat_registry_issues.push('Missing chat and artifact registry state');
  }

  return result;
}

module.exports = { validateRegistrySync };