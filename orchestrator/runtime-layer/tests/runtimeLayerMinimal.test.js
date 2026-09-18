const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  RuntimeEventLog,
  createRuntimeHookRegistry,
  replayRuntimeExecution,
  restoreRuntimeState,
  validateRuntimeTransition
} = require('../index');

function createTempLog() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plenra-runtime-layer-'));
  return {
    tempDir,
    logPath: path.join(tempDir, 'runtime-events.jsonl')
  };
}

function baseEvent(overrides = {}) {
  return {
    idempotency_key: 'runtime-key-1',
    module_id: 'runtime_layer_v1_minimal',
    gate_id: 'mosquito_vertical_v1',
    execution_id: 'execution-1',
    previous_state: 'CREATED',
    next_state: 'INTAKE_RECEIVED',
    event_type: 'runtime_state_transition',
    reason_code: 'INTAKE_ACCEPTED',
    payload: { source: 'test' },
    ...overrides
  };
}

describe('runtime_layer_v1_minimal', () => {
  test('valid state transition passes', () => {
    const result = validateRuntimeTransition({
      current_state: 'CREATED',
      next_state: 'INTAKE_RECEIVED'
    });

    expect(result.status).toBe('PASS');
  });

  test('invalid state transition blocks', () => {
    const result = validateRuntimeTransition({
      current_state: 'CREATED',
      next_state: 'COMPLETED'
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('INVALID_RUNTIME_STATE_TRANSITION');
  });

  test('missing idempotency_key blocks', () => {
    const { logPath } = createTempLog();
    const log = new RuntimeEventLog(logPath);

    const result = log.appendRuntimeEvent(baseEvent({ idempotency_key: undefined }));

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('MISSING_IDEMPOTENCY_KEY');
  });

  test('duplicate same idempotency_key same payload returns existing result', () => {
    const { logPath } = createTempLog();
    const log = new RuntimeEventLog(logPath);

    const first = log.appendRuntimeEvent(baseEvent());
    const second = log.appendRuntimeEvent(baseEvent());

    expect(first.status).toBe('PASS');
    expect(second.status).toBe('PASS');
    expect(second.idempotent).toBe(true);
    expect(second.event.event_id).toBe(first.event.event_id);
    expect(log.readEvents()).toHaveLength(1);
  });

  test('duplicate same idempotency_key different payload blocks', () => {
    const { logPath } = createTempLog();
    const log = new RuntimeEventLog(logPath);

    log.appendRuntimeEvent(baseEvent());
    const conflict = log.appendRuntimeEvent(baseEvent({ payload: { source: 'changed' } }));

    expect(conflict.status).toBe('BLOCK');
    expect(conflict.reason_codes).toContain('IDEMPOTENCY_KEY_PAYLOAD_CONFLICT');
    expect(log.readEvents()).toHaveLength(1);
  });

  test('append-only log does not overwrite events', () => {
    const { logPath } = createTempLog();
    const log = new RuntimeEventLog(logPath);

    const first = log.appendRuntimeEvent(baseEvent());
    log.appendRuntimeEvent(baseEvent({
      idempotency_key: 'runtime-key-2',
      parent_event_id: first.event.event_id,
      previous_state: 'INTAKE_RECEIVED',
      next_state: 'GATE_EVALUATED',
      reason_code: 'GATE_READY'
    }));

    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(log.readEvents()[0].event_id).toBe(first.event.event_id);
  });

  test('state restoration reconstructs latest state', () => {
    const { logPath } = createTempLog();
    const log = new RuntimeEventLog(logPath);

    const first = log.appendRuntimeEvent(baseEvent());
    log.appendRuntimeEvent(baseEvent({
      idempotency_key: 'runtime-key-2',
      parent_event_id: first.event.event_id,
      previous_state: 'INTAKE_RECEIVED',
      next_state: 'GATE_EVALUATED',
      reason_code: 'GATE_READY'
    }));

    const restored = restoreRuntimeState(log.readEvents(), 'execution-1');
    expect(restored.status).toBe('PASS');
    expect(restored.current_state).toBe('GATE_EVALUATED');
  });

  test('corrupted lineage blocks restoration', () => {
    const { logPath } = createTempLog();
    const log = new RuntimeEventLog(logPath);

    const first = log.appendRuntimeEvent(baseEvent());
    const second = log.appendRuntimeEvent(baseEvent({
      idempotency_key: 'runtime-key-2',
      parent_event_id: first.event.event_id,
      previous_state: 'INTAKE_RECEIVED',
      next_state: 'GATE_EVALUATED',
      reason_code: 'GATE_READY'
    }));

    const events = log.readEvents();
    events[1] = { ...second.event, parent_event_id: 'missing-parent' };

    const restored = restoreRuntimeState(events, 'execution-1');
    expect(restored.status).toBe('BLOCK');
    expect(restored.reason_codes).toContain('BROKEN_RUNTIME_LINEAGE');
  });

  test('replay does not create live side effects', () => {
    const { logPath } = createTempLog();
    const log = new RuntimeEventLog(logPath);
    log.appendRuntimeEvent(baseEvent());
    const beforeCount = log.readEvents().length;

    const replay = replayRuntimeExecution({
      eventLog: log,
      execution_id: 'execution-1',
      expected_state: 'INTAKE_RECEIVED',
      expected_event_count: 1,
      replay_run_id: 'replay-1'
    });

    expect(replay.status).toBe('PASS');
    expect(replay.replay_only).toBe(true);
    expect(log.readEvents()).toHaveLength(beforeCount);
  });

  test('integration hooks exist and are inactive by default', () => {
    const hooks = createRuntimeHookRegistry();
    const hookList = hooks.listHooks();

    expect(hookList.find((hook) => hook.hook_id === 'mosquito_human_friction_logging_v1').active).toBe(false);
    expect(hookList.find((hook) => hook.hook_id === 'mosquito_bootstrap_kill_criteria_v1').active).toBe(false);

    const result = hooks.executeHook('mosquito_human_friction_logging_v1', {
      runtime_event_context: { event_id: 'event-1' },
      execution_state: { current_state: 'CREATED' }
    });

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('RUNTIME_HOOK_INACTIVE');
  });

  test('runtime fails closed on malformed input', () => {
    const { logPath } = createTempLog();
    const log = new RuntimeEventLog(logPath);

    const result = log.appendRuntimeEvent(null);

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('MALFORMED_RUNTIME_EVENT_INPUT');
  });
});
