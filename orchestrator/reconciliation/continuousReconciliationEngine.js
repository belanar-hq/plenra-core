const fs = require('fs');
const path = require('path');
const { scanRepository } = require('../discovery/repoScanner');
const { verifyFileHash, createHashForFile, createHashForObject } = require('../hashes/hashManager');
const { createReconciliationCycle, completeReconciliationCycle, loadReconciliationState } = require('./reconciliationScheduler');
const { detectCanonDrift } = require('./canonDriftDetector');
const { detectOrphanArtifacts } = require('./orphanArtifactDetector');
const { detectDependencyDesync } = require('./dependencyDesyncDetector');
const { validateRegistrySync } = require('./registrySyncValidator');
const { detectCodexRegression } = require('./codexRegressionDetector');
const { validatePreservationIntegrity } = require('./preservationIntegrityValidator');
const { verifyLineageContinuity } = require('./lineageContinuityVerifier');
const { evaluateFailClosedPolicy } = require('./failClosedReconciliationPolicy');
const { validateMosquitoSupport } = require('./mosquitoVerticalReconciliationSupport');

function loadJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function normalizeRegistryArtifacts(artifactRegistry) {
  if (!artifactRegistry) return [];
  if (Array.isArray(artifactRegistry)) return artifactRegistry;
  if (artifactRegistry.artifacts && Array.isArray(artifactRegistry.artifacts)) return artifactRegistry.artifacts;
  return [];
}

function normalizeCodexQueue(codexQueue) {
  if (!codexQueue) return [];
  if (Array.isArray(codexQueue)) return codexQueue;
  if (codexQueue.queue && Array.isArray(codexQueue.queue)) return codexQueue.queue;
  return [];
}

function normalizeChatRegistry(chatRegistry) {
  if (!chatRegistry) return [];
  if (Array.isArray(chatRegistry)) return chatRegistry;
  if (chatRegistry.chats && Array.isArray(chatRegistry.chats)) return chatRegistry.chats;
  return [];
}

function loadLineageRecords(rootPath) {
  const lineagePath = path.join(rootPath, 'orchestrator', 'lineage', 'lineageRecords.json');
  return loadJsonFile(lineagePath) || [];
}

function scanCanonFiles(rootPath) {
  const canonRoot = path.join(rootPath, 'canon');
  if (!fs.existsSync(canonRoot)) return [];
  const results = [];

  function traverse(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (path.extname(fullPath) === '.json') {
        const artifactId = path.basename(fullPath, '.json');
        const mdPath = path.join(path.dirname(fullPath), `${artifactId}.md`);
        results.push({ jsonPath: fullPath, mdPath, artifactId, existsMd: fs.existsSync(mdPath) });
      }
    }
  }

  traverse(canonRoot);
  return results;
}

function buildArtifactIndex(artifacts) {
  const index = new Map();
  for (const artifact of artifacts) {
    if (artifact && artifact.artifact_id) {
      index.set(artifact.artifact_id, artifact);
    }
  }
  return index;
}

function countPreservationRecords(rootPath) {
  const canonFiles = scanCanonFiles(rootPath);
  return canonFiles.length;
}

function runContinuousReconciliation(rootPath = '.') {
  const cycle = createReconciliationCycle(rootPath);
  const result = {
    cycle,
    canonical_scan: {},
    orphan_detection: {},
    dependency_desync: {},
    registry_sync: {},
    codex_regression: {},
    preservation_integrity: {},
    lineage_continuity: {},
    mosquito_support: {},
    fail_closed_decision: {},
    status: 'HOLD',
    reason_codes: []
  };

  const scanResult = scanRepository(rootPath);
  const chatRegistry = loadJsonFile(path.join(rootPath, 'orchestrator', 'registry', 'chatRegistry.json'));
  const artifactRegistryRaw = loadJsonFile(path.join(rootPath, 'orchestrator', 'registry', 'artifactRegistry.json'));
  const codexQueueRaw = loadJsonFile(path.join(rootPath, 'orchestrator', 'scheduler', 'codexQueue.json'));
  const dependencyGraph = loadJsonFile(path.join(rootPath, 'orchestrator', 'registry', 'dependencyGraph.json'));
  const lineageRecords = loadLineageRecords(rootPath);

  const artifactRegistry = normalizeRegistryArtifacts(artifactRegistryRaw);
  const codexQueue = normalizeCodexQueue(codexQueueRaw);
  const chatRecords = normalizeChatRegistry(chatRegistry);

  result.scan = scanResult;

  if (!chatRegistry || !artifactRegistryRaw || !codexQueueRaw) {
    result.fail_closed_decision = evaluateFailClosedPolicy({ missing_registry: true });
    result.status = result.fail_closed_decision.status;
    result.reason_codes = result.fail_closed_decision.reason_codes;
    completeReconciliationCycle(rootPath, cycle, result.status, result.reason_codes);
    return result;
  }

  result.canonical_scan = detectCanonDrift(rootPath, artifactRegistry);
  result.orphan_detection = detectOrphanArtifacts(rootPath, artifactRegistry);
  result.dependency_desync = detectDependencyDesync(artifactRegistry, dependencyGraph);
  result.registry_sync = validateRegistrySync(chatRegistry, artifactRegistry, codexQueue, rootPath);
  result.codex_regression = detectCodexRegression(artifactRegistry, codexQueue);
  result.preservation_integrity = validatePreservationIntegrity(rootPath, artifactRegistry);
  result.lineage_continuity = verifyLineageContinuity(lineageRecords, artifactRegistry, codexQueue);
  result.mosquito_support = validateMosquitoSupport(artifactRegistry);

  const finalDecision = evaluateFailClosedPolicy({
    missing_registry: false,
    canon_drift: result.canonical_scan.hash_mismatches.length > 0 || result.canonical_scan.version_mismatches.length > 0,
    missing_canon: result.orphan_detection.registry_missing_canon.length > 0,
    orphan_canon: result.orphan_detection.orphan_canon_files.length > 0,
    dependency_desync: result.dependency_desync.missing_dependencies.length > 0 || result.dependency_desync.circular_dependencies.length > 0,
    codex_regression: result.codex_regression.missing_queue_entries.length > 0 || result.codex_regression.missing_acceptance_criteria.length > 0,
    preservation_failures: result.preservation_integrity.preservation_issues.length > 0,
    broken_lineage: result.lineage_continuity.broken_lineage.length > 0,
    adaptive_mosquito_routing: result.mosquito_support.blocked.length > 0
  });

  result.fail_closed_decision = finalDecision;
  result.status = finalDecision.status;
  result.reason_codes = finalDecision.reason_codes;
  completeReconciliationCycle(rootPath, cycle, result.status, result.reason_codes);
  return result;
}

module.exports = {
  runContinuousReconciliation,
  loadLineageRecords,
  scanCanonFiles,
  normalizeRegistryArtifacts,
  normalizeCodexQueue,
  normalizeChatRegistry
};