const fs = require('fs');
const os = require('os');
const path = require('path');
const { createReconciliationCycle, loadReconciliationState } = require('../reconciliationScheduler');
const { detectCanonDrift } = require('../canonDriftDetector');
const { detectOrphanArtifacts } = require('../orphanArtifactDetector');
const { detectDependencyDesync } = require('../dependencyDesyncDetector');
const { validateRegistrySync } = require('../registrySyncValidator');
const { detectCodexRegression } = require('../codexRegressionDetector');
const { validatePreservationIntegrity } = require('../preservationIntegrityValidator');
const { verifyLineageContinuity } = require('../lineageContinuityVerifier');
const { evaluateFailClosedPolicy } = require('../failClosedReconciliationPolicy');
const { validateMosquitoSupport } = require('../mosquitoVerticalReconciliationSupport');
const { runContinuousReconciliation } = require('../continuousReconciliationEngine');

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'plenra-reconcile-'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, 'utf8');
}

function cleanupTempRoot(rootPath) {
  if (fs.existsSync(rootPath)) {
    fs.rmSync(rootPath, { recursive: true, force: true });
  }
}

function buildBasicFixture(rootPath) {
  writeJson(path.join(rootPath, 'orchestrator', 'registry', 'chatRegistry.json'), { chats: [{ source_chat_id: 'chat-1', source_chat_label: 'test', chat_location: 'PROJECT' }] });
  writeJson(path.join(rootPath, 'orchestrator', 'registry', 'artifactRegistry.json'), [
    { artifact_id: 'artifact-ready', artifact_type: 'INFRASTRUCTURE_CORE', maturity_status: 'READY_FOR_CODEX', priority: 'P0', acceptance_criteria: 'Complete acceptance', external_backup_status: 'backed_up', hash: 'incorrect-hash' }
  ]);
  writeJson(path.join(rootPath, 'orchestrator', 'scheduler', 'codexQueue.json'), [{ artifact_id: 'artifact-ready', codex_task_id: 'task-1' }]);
  writeJson(path.join(rootPath, 'orchestrator', 'registry', 'dependencyGraph.json'), {
    artifact_ready: {
      artifact_id: 'artifact-ready',
      blocks: [],
      blocked_by: [],
      validation_dependencies: [],
      replay_dependencies: [],
      codex_dependencies: []
    }
  });
  writeJson(path.join(rootPath, 'orchestrator', 'lineage', 'lineageRecords.json'), [
    {
      source_chat_id: 'chat-1',
      artifact_id: 'artifact-ready',
      canon_file: 'canon/archive/artifact-ready.json',
      codex_task_id: 'task-1',
      validation_result: 'PASS'
    }
  ]);
  writeJson(path.join(rootPath, 'canon', 'infrastructure', 'artifact-ready.json'), { artifact_id: 'artifact-ready', version: 1 });
  writeText(path.join(rootPath, 'canon', 'infrastructure', 'artifact-ready.md'), '# artifact-ready\n');
}

function buildOrphanCanonFixture(rootPath) {
  buildBasicFixture(rootPath);
  writeJson(path.join(rootPath, 'canon', 'archive', 'orphan.json'), { artifact_id: 'orphan' });
}

function buildRegistryMissingCanonFixture(rootPath) {
  buildBasicFixture(rootPath);
  writeJson(path.join(rootPath, 'orchestrator', 'registry', 'artifactRegistry.json'), [
    { artifact_id: 'missing-canon', artifact_type: 'INFRASTRUCTURE_CORE', maturity_status: 'READY_FOR_CODEX', priority: 'P0', acceptance_criteria: 'Complete acceptance', external_backup_status: 'backed_up' }
  ]);
}

describe('Continuous Discovery and Reconciliation Engine v1', () => {
  test('Runtime scan detects Canon artifact changes', () => {
    const root = makeTempRoot();
    try {
      buildBasicFixture(root);
      const artifactRegistry = JSON.parse(fs.readFileSync(path.join(root, 'orchestrator', 'registry', 'artifactRegistry.json'), 'utf8'));
      const drift = detectCanonDrift(root, artifactRegistry);
      expect(drift.hash_mismatches).toContain('artifact-ready');
    } finally {
      cleanupTempRoot(root);
    }
  });

  test('Scheduler creates deterministic reconciliation cycle', () => {
    const root = makeTempRoot();
    try {
      const cycle = createReconciliationCycle(root);
      expect(cycle.cycle_id).toBe('reconciliation_cycle_1');
      const state = loadReconciliationState(root);
      expect(state.current_cycle).toBe(1);
      expect(state.cycles[0].cycle_id).toBe('reconciliation_cycle_1');
    } finally {
      cleanupTempRoot(root);
    }
  });

  test('Canon drift detector catches hash mismatch', () => {
    const root = makeTempRoot();
    try {
      buildBasicFixture(root);
      const artifactRegistry = JSON.parse(fs.readFileSync(path.join(root, 'orchestrator', 'registry', 'artifactRegistry.json'), 'utf8'));
      const drift = detectCanonDrift(root, artifactRegistry);
      expect(drift.hash_mismatches.length).toBeGreaterThan(0);
    } finally {
      cleanupTempRoot(root);
    }
  });

  test('Orphan detector finds Canon file without registry entry', () => {
    const root = makeTempRoot();
    try {
      buildOrphanCanonFixture(root);
      const artifactRegistry = JSON.parse(fs.readFileSync(path.join(root, 'orchestrator', 'registry', 'artifactRegistry.json'), 'utf8'));
      const orphans = detectOrphanArtifacts(root, artifactRegistry);
      expect(orphans.orphan_canon_files).toContain('orphan');
    } finally {
      cleanupTempRoot(root);
    }
  });

  test('Orphan detector finds registry entry without Canon file', () => {
    const root = makeTempRoot();
    try {
      buildRegistryMissingCanonFixture(root);
      const artifactRegistry = JSON.parse(fs.readFileSync(path.join(root, 'orchestrator', 'registry', 'artifactRegistry.json'), 'utf8'));
      const orphans = detectOrphanArtifacts(root, artifactRegistry);
      expect(orphans.registry_missing_canon).toContain('missing-canon');
    } finally {
      cleanupTempRoot(root);
    }
  });

  test('Dependency desync detector catches missing dependency', () => {
    const root = makeTempRoot();
    try {
      const artifactRegistry = [{ artifact_id: 'artifact-ready' }];
      const dependencyGraph = {
        'artifact-ready': {
          artifact_id: 'artifact-ready',
          validation_dependencies: ['missing-dependency'],
          replay_dependencies: [],
          codex_dependencies: [],
          blocked_by: []
        }
      };
      const desync = detectDependencyDesync(artifactRegistry, dependencyGraph);
      expect(desync.missing_dependencies[0].missing_dependency).toBe('missing-dependency');
    } finally {
      cleanupTempRoot(root);
    }
  });

  test('Registry sync validator fails closed when artifactRegistry missing', () => {
    const root = makeTempRoot();
    try {
      writeJson(path.join(root, 'orchestrator', 'registry', 'chatRegistry.json'), { chats: [] });
      writeJson(path.join(root, 'orchestrator', 'scheduler', 'codexQueue.json'), []);
      const sync = validateRegistrySync({ chats: [] }, null, [], root);
      expect(sync.missing_state).toContain('artifactRegistry');
    } finally {
      cleanupTempRoot(root);
    }
  });

  test('Codex regression detector catches READY artifact missing from queue', () => {
    const artifactRegistry = [{ artifact_id: 'missing', maturity_status: 'READY_FOR_CODEX', acceptance_criteria: 'ok' }];
    const regression = detectCodexRegression(artifactRegistry, []);
    expect(regression.missing_queue_entries).toContain('missing');
  });

  test('Preservation validator fails P0 artifact without Markdown file', () => {
    const root = makeTempRoot();
    try {
      writeJson(path.join(root, 'orchestrator', 'registry', 'artifactRegistry.json'), [
        { artifact_id: 'p0-artifact', priority: 'P0', external_backup_status: 'backed_up' }
      ]);
      writeJson(path.join(root, 'canon', 'archive', 'p0-artifact.json'), { artifact_id: 'p0-artifact' });
      const registry = JSON.parse(fs.readFileSync(path.join(root, 'orchestrator', 'registry', 'artifactRegistry.json'), 'utf8'));
      const validation = validatePreservationIntegrity(root, registry);
      expect(validation.p0_p1_missing_files.some(issue => issue.artifact_id === 'p0-artifact')).toBe(true);
    } finally {
      cleanupTempRoot(root);
    }
  });

  test('Lineage verifier passes valid source_chat_id to codex_task_id chain', () => {
    const lineageRecords = [{ source_chat_id: 'chat-1', artifact_id: 'artifact-ready', canon_file: 'canon/archive/artifact-ready.json', codex_task_id: 'task-1', validation_result: 'PASS' }];
    const artifactRegistry = [{ artifact_id: 'artifact-ready' }];
    const codexQueue = [{ artifact_id: 'artifact-ready', codex_task_id: 'task-1' }];
    const lineage = verifyLineageContinuity(lineageRecords, artifactRegistry, codexQueue);
    expect(lineage.broken_lineage.length).toBe(0);
    expect(lineage.valid_lineage[0].source_chat_id).toBe('chat-1');
  });

  test('Lineage verifier blocks broken lineage', () => {
    const lineageRecords = [{ source_chat_id: 'chat-1', artifact_id: 'artifact-missing', canon_file: 'canon/archive/artifact-missing.json', codex_task_id: 'task-1', validation_result: 'PASS' }];
    const artifactRegistry = [{ artifact_id: 'artifact-ready' }];
    const codexQueue = [{ artifact_id: 'artifact-ready', codex_task_id: 'task-1' }];
    const lineage = verifyLineageContinuity(lineageRecords, artifactRegistry, codexQueue);
    expect(lineage.broken_lineage.length).toBeGreaterThan(0);
  });

  test('Fail-closed policy returns HOLD for unknown state', () => {
    const decision = evaluateFailClosedPolicy({ missing_registry: true });
    expect(decision.status).toBe('HOLD');
  });

  test('Mosquito support allows static deterministic artifact reconciliation', () => {
    const artifactRegistry = [{ artifact_id: 'mosquito_vertical_v1', artifact_type: 'MOSQUITO_VERTICAL', routing_strategy: 'STATIC' }];
    const support = validateMosquitoSupport(artifactRegistry);
    expect(support.allowed.length).toBe(1);
    expect(support.blocked.length).toBe(0);
  });

  test('Mosquito support blocks adaptive routing', () => {
    const artifactRegistry = [{ artifact_id: 'mosquito_vertical_v1', artifact_type: 'MOSQUITO_VERTICAL', routing_strategy: 'ADAPTIVE' }];
    const support = validateMosquitoSupport(artifactRegistry);
    expect(support.blocked.length).toBe(1);
  });

  test('Full reconciliation cycle returns PASS only when all systems synchronized', () => {
    const root = makeTempRoot();
    try {
      writeJson(path.join(root, 'orchestrator', 'registry', 'chatRegistry.json'), { chats: [{ source_chat_id: 'chat-1', source_chat_label: 'test', chat_location: 'PROJECT' }] });
      writeJson(path.join(root, 'orchestrator', 'registry', 'artifactRegistry.json'), [
        { artifact_id: 'artifact-ready', artifact_type: 'INFRASTRUCTURE_CORE', maturity_status: 'READY_FOR_CODEX', priority: 'P0', acceptance_criteria: 'Complete acceptance', external_backup_status: 'backed_up' }
      ]);
      writeJson(path.join(root, 'orchestrator', 'scheduler', 'codexQueue.json'), [{ artifact_id: 'artifact-ready', codex_task_id: 'task-1' }]);
      writeJson(path.join(root, 'orchestrator', 'registry', 'dependencyGraph.json'), {
        'artifact-ready': {
          artifact_id: 'artifact-ready',
          blocks: [],
          blocked_by: [],
          validation_dependencies: [],
          replay_dependencies: [],
          codex_dependencies: []
        }
      });
      writeJson(path.join(root, 'orchestrator', 'lineage', 'lineageRecords.json'), [
        {
          source_chat_id: 'chat-1',
          artifact_id: 'artifact-ready',
          canon_file: 'canon/archive/artifact-ready.json',
          codex_task_id: 'task-1',
          validation_result: 'PASS'
        }
      ]);
      writeJson(path.join(root, 'canon', 'infrastructure', 'artifact-ready.json'), { artifact_id: 'artifact-ready', version: 1 });
      writeText(path.join(root, 'canon', 'infrastructure', 'artifact-ready.md'), '# artifact-ready\n');

      const result = runContinuousReconciliation(root);
      expect(result.status).toBe('PASS');
    } finally {
      cleanupTempRoot(root);
    }
  });
});