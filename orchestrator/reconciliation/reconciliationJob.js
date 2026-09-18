const fs = require('fs');
const path = require('path');
const { scanRepository } = require('../discovery/repoScanner');
const { verifyFileHash } = require('../hashes/hashManager');

function reconcile(rootPath) {
  const result = {
    missing_artifacts: [],
    orphan_artifacts: [],
    hash_mismatches: [],
    unscheduled_p0: [],
    missing_backups: [],
    stale_canon_files: [],
    dependency_drift: [],
    coverage_confidence: 'PARTIAL',
    scheduling_status: 'PASS'
  };

  // Run repo scan
  const scanResult = scanRepository(rootPath);

  // Load registries
  const chatRegistryPath = path.join(rootPath, 'orchestrator', 'registry', 'chatRegistry.json');
  const artifactRegistryPath = path.join(rootPath, 'orchestrator', 'registry', 'artifactRegistry.json');
  const codexQueuePath = path.join(rootPath, 'orchestrator', 'scheduler', 'codexQueue.json');
  const dependencyGraphPath = path.join(rootPath, 'orchestrator', 'registry', 'dependencyGraph.json');

  let chatRegistry = null;
  let artifactRegistry = null;
  let codexQueue = null;
  let dependencyGraph = null;

  function normalizeArtifacts(registry) {
    if (!registry) return [];
    if (Array.isArray(registry)) return registry;
    if (registry.artifacts && Array.isArray(registry.artifacts)) return registry.artifacts;
    return [];
  }

  try {
    if (fs.existsSync(chatRegistryPath)) {
      chatRegistry = JSON.parse(fs.readFileSync(chatRegistryPath, 'utf8'));
    }
  } catch (e) {
    result.missing_artifacts.push('chatRegistry.json');
  }

  try {
    if (fs.existsSync(artifactRegistryPath)) {
      artifactRegistry = normalizeArtifacts(JSON.parse(fs.readFileSync(artifactRegistryPath, 'utf8')));
    }
  } catch (e) {
    result.missing_artifacts.push('artifactRegistry.json');
  }

  try {
    if (fs.existsSync(codexQueuePath)) {
      codexQueue = JSON.parse(fs.readFileSync(codexQueuePath, 'utf8'));
    }
  } catch (e) {
    result.missing_artifacts.push('codexQueue.json');
  }

  try {
    if (fs.existsSync(dependencyGraphPath)) {
      dependencyGraph = JSON.parse(fs.readFileSync(dependencyGraphPath, 'utf8'));
    }
  } catch (e) {
    // Dependency graph missing
  }

  // Fail closed if critical registries missing
  if (!chatRegistry || !artifactRegistry || !codexQueue) {
    result.scheduling_status = 'HOLD';
    return result;
  }

  // Check canon files exist for registered artifacts
  const canonPath = path.join(rootPath, 'canon');
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

  for (const artifact of artifactRegistry) {
    const folder = typeToFolder[artifact.artifact_type] || 'archive';
    const jsonPath = path.join(canonPath, folder, `${artifact.artifact_id}.json`);
    const mdPath = path.join(canonPath, folder, `${artifact.artifact_id}.md`);

    if (!fs.existsSync(jsonPath)) {
      result.missing_artifacts.push(`${artifact.artifact_id}.json`);
    }
    if (!fs.existsSync(mdPath)) {
      result.missing_artifacts.push(`${artifact.artifact_id}.md`);
    }

    // Check hash if present in registry
    if (artifact.hash && fs.existsSync(jsonPath)) {
      if (!verifyFileHash(jsonPath, artifact.hash)) {
        result.hash_mismatches.push(artifact.artifact_id);
      }
    } else if (artifact.hash) {
      result.missing_artifacts.push(`hash for ${artifact.artifact_id}`);
    }
  }

  // Check for orphan artifacts (canon files not in registry)
  if (fs.existsSync(canonPath)) {
    const canonFiles = getAllJsonFiles(canonPath);
    const registeredIds = new Set(artifactRegistry.map(a => a.artifact_id));
    for (const file of canonFiles) {
      const id = path.basename(file, '.json');
      if (!registeredIds.has(id)) {
        result.orphan_artifacts.push(id);
      }
    }
  }

  // Check unscheduled P0 artifacts
  const queueEntries = Array.isArray(codexQueue) ? codexQueue : (codexQueue && Array.isArray(codexQueue.queue) ? codexQueue.queue : []);
  const queueIds = new Set(queueEntries.map(q => q.artifact_id));
  for (const artifact of artifactRegistry) {
    if (artifact.priority === 'P0' && !queueIds.has(artifact.artifact_id)) {
      result.unscheduled_p0.push(artifact.artifact_id);
    }
  }

  // Check missing backups for P0/P1
  for (const artifact of artifactRegistry) {
    if ((artifact.priority === 'P0' || artifact.priority === 'P1') && artifact.external_backup_status !== 'backed_up') {
      result.missing_backups.push(artifact.artifact_id);
    }
  }

  // Dependency graph check
  const dependencyRequired = !dependencyGraph || dependencyGraph.status !== 'not_required_for_current_scope';
  if (dependencyRequired && !dependencyGraph) {
    result.dependency_drift.push('missing dependency graph');
  }

  // Determine coverage_confidence
  const allConditions = [
    chatRegistry !== null,
    artifactRegistry !== null,
    result.missing_artifacts.length === 0,
    result.hash_mismatches.length === 0,
    codexQueue !== null,
    (!dependencyRequired || dependencyGraph !== null),
    result.orphan_artifacts.length === 0,
    result.unscheduled_p0.length === 0,
    result.missing_backups.length === 0
  ];

  result.coverage_confidence = allConditions.every(Boolean) ? 'HIGH' : 'PARTIAL';

  // Fail closed: if preservation uncertain, HOLD scheduling
  if (result.coverage_confidence === 'PARTIAL') {
    result.scheduling_status = 'HOLD';
  }

  return result;
}

function getAllJsonFiles(dirPath) {
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
  traverse(dirPath);
  return files;
}

module.exports = { reconcile };