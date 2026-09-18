const fs = require('fs');
const path = require('path');
const { evaluateRealWorldExecutionReadiness } = require('../readiness-gate-evaluator');

function readyInput(overrides = {}) {
  return {
    readiness_evaluation_id: 'readiness-123',
    schema_version: 'mosquito_real_world_execution_readiness_gate_v1',
    idempotency_key: 'readiness-key-1',
    evidence: {
      operator_runbook_acknowledged: true,
      manual_whatsapp_process_documented: true,
      contractor_availability_confirmed: true,
      manual_payment_proof_process_documented: true,
      replay_logging_validated: true,
      human_friction_logging_ready: true,
      bootstrap_kill_criteria_ready: true,
      rollback_path_documented: true,
      manual_limited_observable_mode: true
    },
    blocked_capabilities: {
      production_deployment: false,
      live_credit_card_charging: false,
      adaptive_routing: false,
      autonomous_learning: false,
      campaign_scaling: false,
      autonomous_optimization: false,
      external_api_activation: false
    },
    created_at: '2026-05-10T00:00:00.000Z',
    lineage: {
      source_module_id: 'mosquito_real_world_execution_readiness_gate_v1'
    },
    ...overrides
  };
}

function missingEvidence(key) {
  const input = readyInput();
  input.evidence[key] = false;
  return input;
}

describe('mosquito_real_world_execution_readiness_gate_v1', () => {
  test('all checks pass returns PASS', () => {
    const result = evaluateRealWorldExecutionReadiness(readyInput());

    expect(result.status).toBe('PASS');
    expect(result.reason_codes).toContain('REAL_WORLD_EXECUTION_READINESS_GATE_PASSED');
    expect(result.execution_mode).toBe('MANUAL_LIMITED_OBSERVABLE');
  });

  test('missing operator runbook returns HOLD', () => {
    const result = evaluateRealWorldExecutionReadiness(missingEvidence('operator_runbook_acknowledged'));

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('OPERATOR_RUNBOOK_NOT_ACKNOWLEDGED');
  });

  test('missing WhatsApp process returns HOLD', () => {
    const result = evaluateRealWorldExecutionReadiness(missingEvidence('manual_whatsapp_process_documented'));

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('MANUAL_WHATSAPP_PROCESS_NOT_DOCUMENTED');
  });

  test('missing contractor availability returns HOLD', () => {
    const result = evaluateRealWorldExecutionReadiness(missingEvidence('contractor_availability_confirmed'));

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('CONTRACTOR_AVAILABILITY_NOT_CONFIRMED');
  });

  test('missing payment proof process returns HOLD', () => {
    const result = evaluateRealWorldExecutionReadiness(missingEvidence('manual_payment_proof_process_documented'));

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('MANUAL_PAYMENT_PROOF_PROCESS_NOT_DOCUMENTED');
  });

  test('missing replay logging validation returns HOLD', () => {
    const result = evaluateRealWorldExecutionReadiness(missingEvidence('replay_logging_validated'));

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('REPLAY_LOGGING_NOT_VALIDATED');
  });

  test('missing friction logging readiness returns HOLD', () => {
    const result = evaluateRealWorldExecutionReadiness(missingEvidence('human_friction_logging_ready'));

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('HUMAN_FRICTION_LOGGING_NOT_READY');
  });

  test('missing kill criteria readiness returns HOLD', () => {
    const result = evaluateRealWorldExecutionReadiness(missingEvidence('bootstrap_kill_criteria_ready'));

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('BOOTSTRAP_KILL_CRITERIA_NOT_READY');
  });

  test('missing rollback path returns HOLD', () => {
    const result = evaluateRealWorldExecutionReadiness(missingEvidence('rollback_path_documented'));

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('ROLLBACK_PATH_NOT_DOCUMENTED');
  });

  test('blocked capability enabled returns BLOCK', () => {
    const input = readyInput();
    input.blocked_capabilities.live_credit_card_charging = true;

    const result = evaluateRealWorldExecutionReadiness(input);

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('BLOCKED_CAPABILITY_ENABLED');
    expect(result.blocked_capabilities_enabled).toContain('live_credit_card_charging');
  });

  test('malformed input returns BLOCK', () => {
    const result = evaluateRealWorldExecutionReadiness(null);

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('MALFORMED_READINESS_INPUT');
  });

  test('missing idempotency_key returns BLOCK', () => {
    const result = evaluateRealWorldExecutionReadiness(readyInput({ idempotency_key: undefined }));

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('MISSING_IDEMPOTENCY_KEY');
  });

  test('readiness gate does not trigger execution', () => {
    const result = evaluateRealWorldExecutionReadiness(readyInput());

    expect(result.status).toBe('PASS');
    expect(result.real_world_execution_triggered).toBe(false);
  });

  test('readiness gate does not enable production', () => {
    const result = evaluateRealWorldExecutionReadiness(readyInput());

    expect(result.production_enabled).toBe(false);
    expect(result.live_payment_enabled).toBe(false);
    expect(result.external_api_activation_enabled).toBe(false);
  });

  test('readiness gate does not mutate runtime state', () => {
    const runtimeState = { current_state: 'OUTCOME_PENDING' };
    const before = JSON.stringify(runtimeState);

    const result = evaluateRealWorldExecutionReadiness(readyInput({ runtime_state: runtimeState }));

    expect(result.status).toBe('PASS');
    expect(JSON.stringify(runtimeState)).toBe(before);
    expect(result.runtime_state_mutated).toBe(false);
  });

  test('execution trigger attempt blocks', () => {
    const result = evaluateRealWorldExecutionReadiness(readyInput({ execution_trigger_attempted: true }));

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('REAL_WORLD_EXECUTION_TRIGGER_ATTEMPTED');
  });

  test('production enablement attempt blocks', () => {
    const result = evaluateRealWorldExecutionReadiness(readyInput({ production_enablement_attempted: true }));

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('PRODUCTION_ENABLEMENT_ATTEMPTED');
  });

  test('existing validated modules are not overwritten', () => {
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'bootstrap', 'kill-criteria-evaluator.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'friction', 'human-friction-logger.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'e2e', 'mosquito-e2e-flow-controller.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'execution', 'booking-execution-runtime.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'revenue', 'payment-state-machine.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'storage', 'mosquito-storage-adapter.js'))).toBe(true);
  });
});
