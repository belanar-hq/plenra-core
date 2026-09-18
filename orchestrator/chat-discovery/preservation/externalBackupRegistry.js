const fs = require('fs');
const path = require('path');

const BACKUP_REGISTRY_PATH = path.join(__dirname, '..', '..', '..', 'plenra_exports', 'backupRegistry.json');

function ensureBackupRegistry() {
  if (!fs.existsSync(BACKUP_REGISTRY_PATH)) {
    fs.writeFileSync(BACKUP_REGISTRY_PATH, JSON.stringify({}, null, 2));
  }
}

function createBackupRecord(artifact_id) {
  ensureBackupRegistry();
  const registry = JSON.parse(fs.readFileSync(BACKUP_REGISTRY_PATH, 'utf8'));
  registry[artifact_id] = {
    local_canon_repository: 'UNKNOWN',
    git_version_control: 'UNKNOWN',
    google_drive_backup: 'UNKNOWN',
    google_sheets_registry: 'UNKNOWN',
    json_artifact_file: 'UNKNOWN',
    markdown_artifact_file: 'UNKNOWN',
    created_at: Date.now()
  };
  fs.writeFileSync(BACKUP_REGISTRY_PATH, JSON.stringify(registry, null, 2));
  return registry[artifact_id];
}

function updateBackupStatus(registryPath, artifact_id, status) {
  ensureBackupRegistry();
  const registry = JSON.parse(fs.readFileSync(BACKUP_REGISTRY_PATH, 'utf8'));
  if (registry[artifact_id]) {
    Object.assign(registry[artifact_id], status);
    fs.writeFileSync(BACKUP_REGISTRY_PATH, JSON.stringify(registry, null, 2));
  }
}

function evaluateBackupCompleteness(artifact_id, registryPath) {
  ensureBackupRegistry();
  const registry = JSON.parse(fs.readFileSync(BACKUP_REGISTRY_PATH, 'utf8'));
  const record = registry[artifact_id];
  if (!record) {
    return { completeness: 'UNKNOWN', blocked_systems: ['backup', 'dependent_systems'] };
  }

  const required = ['local_canon_repository', 'json_artifact_file', 'markdown_artifact_file'];
  const complete = required.every(r => record[r] === 'COMPLETED');

  if (complete) {
    return { completeness: 'COMPLETE', blocked_systems: [] };
  }

  return { completeness: 'INCOMPLETE', blocked_systems: ['backup', 'dependent_systems'] };
}

module.exports = {
  createBackupRecord,
  updateBackupStatus,
  evaluateBackupCompleteness
};