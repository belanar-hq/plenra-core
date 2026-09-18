const fs = require('fs');
const path = require('path');
const { createRuntimeHookRegistry } = require('../../../../orchestrator/runtime-layer');
const {
  buildCriteriaInputFromFrictionSummary,
  evaluateBootstrapKillCriteria,
  createBootstrapKillCriteriaHook
} = require('../kill-criteria-evaluator');

function healthyInput(overrides = {}) {
  return {
    evaluation_id: 'eval-123',
    schema_version: 'mosquito_bootstrap_kill_criteria_v1',
    execution_window_days: 45,
    real_booking_count: 3,
    routing_completion_rate: 0.4,
    average_contractor_response_time_minutes: 15,
    replay_integrity: 1,
    customer_confusion_rate: 0.25,
    payment_completion_rate: 0.5,
    outcome_confirmation_missing_rate: 0.3,
    repeated_manual_operator_notes: [],
    friction_summary_source: { source_type: 'mosquito_human_friction_logging_v1', observation_only: true },
    created_at: '2026-05-10T00:00:00.000Z',
    lineage: { source_module_id: 'mosquito_human_friction_logging_v1' },
    idempotency_key: 'kill-criteria-key-1',
    ...overrides
  };
}

function runtimeContext(overrides = {}) {
  return {
    execution_id: 'execution-123',
    event_id: 'runtime-event-123',
    explicit_kill_criteria_call: true,
    kill_criteria_input: healthyInput(),
    ...overrides
  };
}

function executionState(overrides = {}) {
  return {
    current_state: 'OUTCOME_PENDING',
    ...overrides
  };
}

describe('mosquito_bootstrap_kill_criteria_v1', () => {
  test('valid metrics with all thresholds healthy returns PASS', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput());

    expect(result.status).toBe('PASS');
    expect(result.actions).toEqual(['PASS']);
    expect(result.reason_codes).toContain('BOOTSTRAP_KILL_CRITERIA_HEALTHY');
  });

  test('fewer than 3 real bookings within 45 days returns HOLD', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ real_booking_count: 2 }));

    expect(result.actions).toContain('HOLD');
    expect(result.reason_codes).toContain('FEWER_THAN_3_REAL_BOOKINGS_WITHIN_45_DAYS');
  });

  test('routing_completion_rate below 40 returns INVESTIGATE', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ routing_completion_rate: 0.39 }));

    expect(result.actions).toContain('INVESTIGATE');
  });

  test('contractor response time above 15 returns FAIL_ROUTING', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ average_contractor_response_time_minutes: 16 }));

    expect(result.actions).toContain('FAIL_ROUTING');
  });

  test('replay_integrity below 100 returns BLOCK_SCALING', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ replay_integrity: 0.99 }));

    expect(result.actions).toContain('BLOCK_SCALING');
  });

  test('customer_confusion_rate above 25 returns SIMPLIFY_INTAKE', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ customer_confusion_rate: 0.26 }));

    expect(result.actions).toContain('SIMPLIFY_INTAKE');
  });

  test('payment_completion_rate below 50 returns REVIEW_PAYMENT_FLOW', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ payment_completion_rate: 0.49 }));

    expect(result.actions).toContain('REVIEW_PAYMENT_FLOW');
  });

  test('outcome_confirmation_missing_rate above 30 returns BLOCK_LEARNING', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ outcome_confirmation_missing_rate: 0.31 }));

    expect(result.actions).toContain('BLOCK_LEARNING');
  });

  test('repeated manual_operator_note 3 times returns CREATE_FIX_TASK', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({
      repeated_manual_operator_notes: [{ note: 'needs callback', count: 3, next_required_fix: 'Create callback script' }]
    }));

    expect(result.actions).toContain('CREATE_FIX_TASK');
    expect(result.fix_tasks).toHaveLength(1);
    expect(result.fix_tasks[0].auto_execute).toBe(false);
  });

  test('multiple rules can trigger in one evaluation', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({
      real_booking_count: 1,
      routing_completion_rate: 0.2,
      replay_integrity: 0.9
    }));

    expect(result.actions).toContain('HOLD');
    expect(result.actions).toContain('INVESTIGATE');
    expect(result.actions).toContain('BLOCK_SCALING');
  });

  test('missing idempotency_key returns BLOCK', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ idempotency_key: undefined }));

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('MISSING_IDEMPOTENCY_KEY');
  });

  test('missing required metric returns HOLD', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ payment_completion_rate: undefined }));

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('MISSING_REQUIRED_METRIC');
  });

  test('malformed metric returns BLOCK', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ customer_confusion_rate: 1.2 }));

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('MALFORMED_PERCENTAGE_METRIC');
  });

  test('free-text source of truth is rejected', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ friction_summary_source: 'customer seemed unhappy' }));

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('FREE_TEXT_SOURCE_OF_TRUTH_REJECTED');
  });

  test('hook exists and is inactive by default', () => {
    const registry = createRuntimeHookRegistry();
    const hook = registry.listHooks().find((item) => item.hook_id === 'mosquito_bootstrap_kill_criteria_v1');

    expect(hook).toBeDefined();
    expect(hook.active).toBe(false);
  });

  test('hook evaluates only when explicitly called', () => {
    const registry = createRuntimeHookRegistry();
    registry.registerHook('mosquito_bootstrap_kill_criteria_v1', createBootstrapKillCriteriaHook());

    const blocked = registry.executeHook('mosquito_bootstrap_kill_criteria_v1', {
      runtime_event_context: runtimeContext({ explicit_kill_criteria_call: false }),
      execution_state: executionState()
    });
    expect(blocked.status).toBe('BLOCK');
    expect(blocked.reason_codes).toContain('KILL_CRITERIA_HOOK_REQUIRES_EXPLICIT_CALL');

    const result = registry.executeHook('mosquito_bootstrap_kill_criteria_v1', {
      runtime_event_context: runtimeContext(),
      execution_state: executionState()
    });
    expect(result.status).toBe('PASS');
    expect(result.actions).toEqual(['PASS']);
  });

  test('hook does not mutate runtime state', () => {
    const hook = createBootstrapKillCriteriaHook();
    const state = executionState();
    const before = JSON.stringify(state);

    hook({
      runtime_event_context: runtimeContext(),
      execution_state: state
    });

    expect(JSON.stringify(state)).toBe(before);
  });

  test('hook does not enable scaling', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ scaling_enablement_attempted: true }));

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('SCALING_ENABLEMENT_ATTEMPTED');
  });

  test('CREATE_FIX_TASK creates stub only and does not execute fix', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({
      repeated_manual_operator_notes: [{ note: 'repeat note', count: 3 }]
    }));

    expect(result.actions).toContain('CREATE_FIX_TASK');
    expect(result.fix_tasks[0].status).toBe('STUB_ONLY');
    expect(result.fix_executed).toBe(false);
    expect(result.real_world_action_triggered).toBe(false);
  });

  test('friction aggregation output can feed criteria input', () => {
    const criteriaInput = buildCriteriaInputFromFrictionSummary(healthyInput({
      average_contractor_response_time_minutes: undefined,
      customer_confusion_rate: undefined,
      repeated_manual_operator_notes: undefined
    }), {
      average_contractor_response_time_minutes: 16,
      customer_confusion_rate: 0.1,
      repeated_manual_operator_notes: [],
      observation_only: true
    });

    const result = evaluateBootstrapKillCriteria(criteriaInput);
    expect(result.actions).toContain('FAIL_ROUTING');
  });

  test('fail-closed behavior preserved', () => {
    const result = evaluateBootstrapKillCriteria(healthyInput({ evaluation_id: undefined }));

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('MISSING_EVALUATION_ID');
  });

  test('existing validated mosquito modules are not overwritten', () => {
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'e2e', 'mosquito-e2e-flow-controller.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'friction', 'human-friction-logger.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'execution', 'booking-execution-runtime.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'revenue', 'payment-state-machine.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'storage', 'mosquito-storage-adapter.js'))).toBe(true);
  });
});
