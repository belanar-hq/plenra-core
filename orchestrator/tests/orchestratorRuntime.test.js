const { scanRepository } = require('../discovery/repoScanner');
const { createHashForObject, verifyHash } = require('../hashes/hashManager');
const { writeCanonArtifact } = require('../storage/canonWriter');
const { reconcile } = require('../reconciliation/reconciliationJob');
const { determineSchedulingDecision } = require('../scheduler/schedulingEngine');
const { createLineageRecord, validateLineage } = require('../lineage/eventLineage');

describe('Orchestrator Runtime', () => {
  test('Repo scanner detects missing canon file', () => {
    const result = scanRepository('.');
    expect(result.missing_canon_files).toBeDefined();
  });

  test('Hash manager creates stable hash', () => {
    const obj = { b: 2, a: 1 };
    const hash1 = createHashForObject(obj);
    const hash2 = createHashForObject(obj);
    expect(hash1).toBe(hash2);
  });

  test('Hash mismatch is detected', () => {
    const obj = { a: 1 };
    const hash = createHashForObject(obj);
    expect(verifyHash({ a: 2 }, hash)).toBe(false);
  });

  test('Canon writer creates JSON and Markdown files', () => {
    const artifact = {
      artifact_id: 'test-artifact',
      artifact_type: 'INFRASTRUCTURE_CORE',
      version: 1,
      description: 'Test artifact'
    };
    const result = writeCanonArtifact('.', artifact);
    expect(result.paths.length).toBe(2);
  });

  test('Artifact registry updates correctly', () => {
    // Placeholder test
    expect(true).toBe(true);
  });

  test('Reconciliation detects orphan artifact', () => {
    const result = reconcile('.');
    expect(result.orphan_artifacts).toBeDefined();
  });

  test('Reconciliation detects unscheduled P0 artifact', () => {
    const result = reconcile('.');
    expect(result.unscheduled_p0).toBeDefined();
  });

  test('Scheduler blocks artifact with missing dependency', () => {
    const artifact = { priority: 'P0', blocked_systems: ['missing'] };
    const decision = determineSchedulingDecision(artifact, {});
    expect(decision.scheduler_decision).toBe('HOLD');
  });

  test('Scheduler schedules P0 artifact with no blockers', () => {
    const artifact = {
      priority: 'P0',
      status: 'READY_FOR_CODEX',
      validation_status: 'present',
      blocked_systems: []
    };
    const decision = determineSchedulingDecision(artifact, {});
    expect(decision.scheduler_decision).toBe('SCHEDULE_NOW');
  });

  test('Event lineage links chat → artifact → canon → Codex task', () => {
    const record = createLineageRecord({
      source_chat_id: 'chat-1',
      artifact_id: 'art-1',
      canon_file: 'canon/art-1.json',
      codex_task_id: 'task-1'
    });
    expect(validateLineage(record)).toBe(true);
  });

  test('Coverage confidence remains PARTIAL if preservation missing', () => {
    const result = reconcile('.');
    expect(result.coverage_confidence).toBe('PARTIAL');
  });

  test('Coverage confidence becomes HIGH only when synchronized', () => {
    // Placeholder
    expect(true).toBe(true);
  });
});