const fs = require('fs');
const os = require('os');
const path = require('path');
const { createRuntimeHookRegistry } = require('../../../../orchestrator/runtime-layer');
const { HumanFrictionLogger, createHumanFrictionHook } = require('../human-friction-logger');
const { aggregateFrictionEvents } = require('../friction-aggregation');

function createLogger() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mosquito-friction-'));
  return {
    tempDir,
    eventsPath: path.join(tempDir, 'friction-events.jsonl'),
    logger: new HumanFrictionLogger({ eventsDir: tempDir })
  };
}

function runtimeContext(overrides = {}) {
  return {
    execution_id: 'execution-123',
    case_id: 'case-123',
    booking_id: 'booking-123',
    payment_id: 'payment-123',
    module_id: 'mosquito_e2e_operational_wiring_v1',
    gate_id: 'mosquito_vertical_v1',
    event_id: 'runtime-event-123',
    runtime_state: 'BOOKING_PENDING',
    ...overrides
  };
}

function executionState(overrides = {}) {
  return {
    current_state: 'BOOKING_PENDING',
    ...overrides
  };
}

function frictionPayload(overrides = {}) {
  return {
    idempotency_key: 'friction-key-1',
    friction_type: 'CUSTOMER_STUCK',
    severity: 'MEDIUM',
    reason_codes: ['CUSTOMER_STUCK_ON_BOOKING'],
    friction_fields: {
      customer_stuck_reason: 'Could not understand installation timing question',
      next_required_fix: 'Rewrite booking timing prompt'
    },
    ...overrides
  };
}

describe('mosquito_human_friction_logging_v1', () => {
  test('valid friction event logs successfully', () => {
    const { logger } = createLogger();

    const result = logger.logFrictionEvent({
      runtime_event_context: runtimeContext(),
      execution_state: executionState(),
      friction_payload: frictionPayload()
    });

    expect(result.status).toBe('PASS');
    expect(result.event.friction_event_id).toBeDefined();
    expect(result.event.execution_id).toBe('execution-123');
    expect(logger.readEvents()).toHaveLength(1);
  });

  test('missing idempotency_key returns BLOCK', () => {
    const { logger } = createLogger();

    const result = logger.logFrictionEvent({
      runtime_event_context: runtimeContext(),
      execution_state: executionState(),
      friction_payload: frictionPayload({ idempotency_key: undefined })
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('MISSING_IDEMPOTENCY_KEY');
  });

  test('malformed friction payload returns BLOCK', () => {
    const { logger } = createLogger();

    const result = logger.logFrictionEvent({
      runtime_event_context: runtimeContext(),
      execution_state: executionState(),
      friction_payload: frictionPayload({ friction_type: 'ADAPTIVE_ROUTING_SIGNAL' })
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('MALFORMED_FRICTION_TYPE');
  });

  test('missing execution_id returns HOLD', () => {
    const { logger } = createLogger();

    const result = logger.logFrictionEvent({
      runtime_event_context: runtimeContext({ execution_id: undefined }),
      execution_state: executionState(),
      friction_payload: frictionPayload()
    });

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('MISSING_EXECUTION_ID');
  });

  test('append-only log does not overwrite events', () => {
    const { logger, eventsPath } = createLogger();

    logger.logFrictionEvent({
      runtime_event_context: runtimeContext(),
      execution_state: executionState(),
      friction_payload: frictionPayload()
    });
    logger.logFrictionEvent({
      runtime_event_context: runtimeContext({ case_id: 'case-124', execution_id: 'execution-124' }),
      execution_state: executionState(),
      friction_payload: frictionPayload({
        idempotency_key: 'friction-key-2',
        friction_type: 'BOOKING_FAILED',
        reason_codes: ['BOOKING_SLOT_CONFUSION'],
        friction_fields: {
          booking_failed_reason: 'Customer picked unavailable date',
          next_required_fix: 'Clarify available slots'
        }
      })
    });

    const lines = fs.readFileSync(eventsPath, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).idempotency_key).toBe('friction-key-1');
  });

  test('duplicate idempotency_key with same payload returns existing result', () => {
    const { logger } = createLogger();
    const input = {
      runtime_event_context: runtimeContext(),
      execution_state: executionState(),
      friction_payload: frictionPayload()
    };

    const first = logger.logFrictionEvent(input);
    const second = logger.logFrictionEvent(input);

    expect(second.status).toBe('PASS');
    expect(second.idempotent).toBe(true);
    expect(second.event.friction_event_id).toBe(first.event.friction_event_id);
    expect(logger.readEvents()).toHaveLength(1);
  });

  test('duplicate idempotency_key with different payload returns BLOCK', () => {
    const { logger } = createLogger();
    logger.logFrictionEvent({
      runtime_event_context: runtimeContext(),
      execution_state: executionState(),
      friction_payload: frictionPayload()
    });

    const result = logger.logFrictionEvent({
      runtime_event_context: runtimeContext(),
      execution_state: executionState(),
      friction_payload: frictionPayload({
        friction_fields: {
          customer_stuck_reason: 'Changed reason',
          next_required_fix: 'Different fix'
        }
      })
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('IDEMPOTENCY_KEY_PAYLOAD_CONFLICT');
  });

  test('runtime hook exists and is inactive by default', () => {
    const registry = createRuntimeHookRegistry();
    const hook = registry.listHooks().find((item) => item.hook_id === 'mosquito_human_friction_logging_v1');

    expect(hook).toBeDefined();
    expect(hook.active).toBe(false);
  });

  test('runtime hook logs event only when explicitly called', () => {
    const { logger } = createLogger();
    const registry = createRuntimeHookRegistry();
    registry.registerHook('mosquito_human_friction_logging_v1', createHumanFrictionHook(logger));

    const blocked = registry.executeHook('mosquito_human_friction_logging_v1', {
      runtime_event_context: {
        ...runtimeContext(),
        friction_payload: frictionPayload()
      },
      execution_state: executionState()
    });

    expect(blocked.status).toBe('BLOCK');
    expect(blocked.reason_codes).toContain('FRICTION_HOOK_REQUIRES_EXPLICIT_CALL');

    const logged = registry.executeHook('mosquito_human_friction_logging_v1', {
      runtime_event_context: {
        ...runtimeContext(),
        explicit_friction_logging_call: true,
        friction_payload: frictionPayload()
      },
      execution_state: executionState()
    });

    expect(logged.status).toBe('PASS');
    expect(logger.readEvents()).toHaveLength(1);
  });

  test('hook does not mutate runtime state', () => {
    const { logger } = createLogger();
    const hook = createHumanFrictionHook(logger);
    const state = executionState();
    const before = JSON.stringify(state);

    hook({
      runtime_event_context: {
        ...runtimeContext(),
        explicit_friction_logging_call: true,
        friction_payload: frictionPayload()
      },
      execution_state: state
    });

    expect(JSON.stringify(state)).toBe(before);
  });

  test('hook does not change routing', () => {
    const { logger } = createLogger();
    const result = logger.logFrictionEvent({
      runtime_event_context: runtimeContext(),
      execution_state: executionState(),
      friction_payload: frictionPayload({ routing_mutation_attempted: true })
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('ROUTING_MUTATION_ATTEMPTED');
  });

  test('hook does not trigger kill criteria', () => {
    const { logger } = createLogger();
    const result = logger.logFrictionEvent({
      runtime_event_context: runtimeContext(),
      execution_state: executionState(),
      friction_payload: frictionPayload({ kill_criteria_execution_attempted: true })
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('KILL_CRITERIA_EXECUTION_ATTEMPTED');
  });

  test('hook does not trigger optimization', () => {
    const { logger } = createLogger();
    const result = logger.logFrictionEvent({
      runtime_event_context: runtimeContext(),
      execution_state: executionState(),
      friction_payload: frictionPayload({ autonomous_optimization_triggered: true })
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('OPTIMIZATION_TRIGGER_ATTEMPTED');
  });

  test('contractor response time aggregation works', () => {
    const aggregate = aggregateFrictionEvents([
      eventForAggregation('CONTRACTOR_NO_RESPONSE', { contractor_response_time_minutes: 20 }),
      eventForAggregation('CONTRACTOR_NO_RESPONSE', { contractor_response_time_minutes: 40 })
    ]);

    expect(aggregate.average_contractor_response_time_minutes).toBe(30);
    expect(aggregate.observation_only).toBe(true);
  });

  test('repeated manual operator note detection works', () => {
    const aggregate = aggregateFrictionEvents([
      eventForAggregation('MANUAL_OPERATOR_NOTE', { manual_operator_note: 'needs callback' }),
      eventForAggregation('MANUAL_OPERATOR_NOTE', { manual_operator_note: 'needs callback' }),
      eventForAggregation('MANUAL_OPERATOR_NOTE', { manual_operator_note: 'different' })
    ]);

    expect(aggregate.repeated_manual_operator_notes).toEqual([
      { note: 'needs callback', count: 2 }
    ]);
  });

  test('customer confusion rate calculation works', () => {
    const aggregate = aggregateFrictionEvents([
      eventForAggregation('CUSTOMER_STUCK', { customer_stuck_reason: 'stuck' }),
      eventForAggregation('CONFUSING_QUESTION', { confusing_question_id: 'q1' }),
      eventForAggregation('PAYMENT_BLOCK', { payment_block_reason: 'bank transfer unclear' }),
      eventForAggregation('BOOKING_FAILED', { booking_failed_reason: 'slot mismatch' })
    ]);

    expect(aggregate.customer_confusion_rate).toBe(0.5);
    expect(aggregate.payment_block_count).toBe(1);
    expect(aggregate.booking_failed_count).toBe(1);
  });

  test('fail-closed behavior preserved', () => {
    const { logger } = createLogger();

    const result = logger.logFrictionEvent({
      runtime_event_context: runtimeContext({ case_id: undefined }),
      execution_state: executionState(),
      friction_payload: frictionPayload({ severity: 'BLOCKING' })
    });

    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('MISSING_CASE_ID');
  });

  test('existing validated mosquito modules are not overwritten', () => {
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'e2e', 'mosquito-e2e-flow-controller.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'execution', 'booking-execution-runtime.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'revenue', 'payment-state-machine.js'))).toBe(true);
    expect(fs.existsSync(path.join('apps', 'mosquito-poc', 'storage', 'mosquito-storage-adapter.js'))).toBe(true);
  });
});

function eventForAggregation(friction_type, friction_fields) {
  return {
    friction_type,
    friction_fields
  };
}
