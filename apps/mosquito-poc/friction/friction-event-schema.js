const { createPayloadHash } = require('../../../orchestrator/runtime-layer');

const FRICTION_SCHEMA_VERSION = 'mosquito_human_friction_logging_v1';

const ALLOWED_FRICTION_TYPES = Object.freeze([
  'CUSTOMER_STUCK',
  'CONFUSING_QUESTION',
  'CONTRACTOR_NO_RESPONSE',
  'CONVERSATION_BREAK',
  'BOOKING_FAILED',
  'TRUST_DROP',
  'PAYMENT_BLOCK',
  'MANUAL_OPERATOR_NOTE',
  'UNKNOWN_FRICTION'
]);

const ALLOWED_SEVERITIES = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'BLOCKING']);

const REQUIRED_FRICTION_FIELD_KEYS = Object.freeze([
  'customer_stuck_reason',
  'confusing_question_id',
  'contractor_no_response_reason',
  'contractor_response_time_minutes',
  'conversation_break_point',
  'booking_failed_reason',
  'trust_drop_signal',
  'payment_block_reason',
  'manual_operator_note',
  'next_required_fix'
]);

function validateFrictionPayload({ runtime_event_context, execution_state, friction_payload }) {
  if (!runtime_event_context || !execution_state) {
    return {
      valid: false,
      status: 'HOLD',
      reason_codes: ['MISSING_RUNTIME_CONTEXT'],
      error: 'runtime_event_context and execution_state are required'
    };
  }

  if (!runtime_event_context.execution_id) {
    return hold('MISSING_EXECUTION_ID', 'execution_id is required');
  }

  if (!runtime_event_context.case_id) {
    return hold('MISSING_CASE_ID', 'case_id is required');
  }

  if (!friction_payload || typeof friction_payload !== 'object') {
    return block('MALFORMED_FRICTION_PAYLOAD', 'friction_payload must be an object');
  }

  if (!friction_payload.idempotency_key) {
    return block('MISSING_IDEMPOTENCY_KEY', 'idempotency_key is required');
  }

  if (friction_payload.routing_mutation_attempted) {
    return block('ROUTING_MUTATION_ATTEMPTED', 'Friction logging cannot mutate routing');
  }

  if (friction_payload.autonomous_optimization_triggered) {
    return block('OPTIMIZATION_TRIGGER_ATTEMPTED', 'Friction logging cannot trigger optimization');
  }

  if (friction_payload.kill_criteria_execution_attempted) {
    return block('KILL_CRITERIA_EXECUTION_ATTEMPTED', 'Friction logging cannot execute kill criteria');
  }

  if (!ALLOWED_FRICTION_TYPES.includes(friction_payload.friction_type)) {
    return block('MALFORMED_FRICTION_TYPE', 'friction_type is not allowed');
  }

  if (!ALLOWED_SEVERITIES.includes(friction_payload.severity)) {
    return block('MALFORMED_SEVERITY', 'severity is not allowed');
  }

  if (!Array.isArray(friction_payload.reason_codes) || friction_payload.reason_codes.length === 0) {
    return block('MALFORMED_REASON_CODES', 'reason_codes must be a non-empty array');
  }

  if (!friction_payload.friction_fields || typeof friction_payload.friction_fields !== 'object' || Array.isArray(friction_payload.friction_fields)) {
    return block('MALFORMED_FRICTION_FIELDS', 'friction_fields must be an object');
  }

  const hasKnownField = REQUIRED_FRICTION_FIELD_KEYS.some((key) => friction_payload.friction_fields[key] !== undefined);
  if (!hasKnownField) {
    return block('MISSING_FRICTION_FIELDS', 'at least one supported friction field is required');
  }

  if (
    friction_payload.friction_fields.contractor_response_time_minutes !== undefined &&
    typeof friction_payload.friction_fields.contractor_response_time_minutes !== 'number'
  ) {
    return block('MALFORMED_CONTRACTOR_RESPONSE_TIME', 'contractor_response_time_minutes must be numeric');
  }

  return {
    valid: true,
    status: 'PASS',
    reason_codes: ['FRICTION_PAYLOAD_VALID']
  };
}

function buildFrictionEvent({ runtime_event_context, execution_state, friction_payload }) {
  const payloadForHash = {
    execution_id: runtime_event_context.execution_id,
    case_id: runtime_event_context.case_id,
    booking_id: runtime_event_context.booking_id || friction_payload.booking_id || null,
    payment_id: runtime_event_context.payment_id || friction_payload.payment_id || null,
    source_module_id: friction_payload.source_module_id || runtime_event_context.module_id,
    runtime_state: execution_state.current_state || runtime_event_context.runtime_state,
    friction_type: friction_payload.friction_type,
    friction_fields: friction_payload.friction_fields,
    reason_codes: friction_payload.reason_codes,
    severity: friction_payload.severity,
    lineage: buildLineage(runtime_event_context, execution_state, friction_payload)
  };
  const payload_hash = createPayloadHash(payloadForHash);

  return {
    friction_event_id: friction_payload.friction_event_id || `friction_evt_${payload_hash.slice(0, 24)}`,
    schema_version: FRICTION_SCHEMA_VERSION,
    execution_id: runtime_event_context.execution_id,
    case_id: runtime_event_context.case_id,
    booking_id: payloadForHash.booking_id,
    payment_id: payloadForHash.payment_id,
    source_module_id: payloadForHash.source_module_id,
    runtime_state: payloadForHash.runtime_state,
    friction_type: friction_payload.friction_type,
    friction_fields: friction_payload.friction_fields,
    reason_codes: friction_payload.reason_codes,
    severity: friction_payload.severity,
    created_at: friction_payload.created_at || new Date().toISOString(),
    lineage: payloadForHash.lineage,
    idempotency_key: friction_payload.idempotency_key,
    payload_hash
  };
}

function buildLineage(runtime_event_context, execution_state, friction_payload) {
  return {
    execution_id: runtime_event_context.execution_id,
    parent_event_id: runtime_event_context.event_id || runtime_event_context.parent_event_id || null,
    originating_module_id: runtime_event_context.originating_module_id || runtime_event_context.module_id || friction_payload.source_module_id,
    current_module_id: 'mosquito_human_friction_logging_v1',
    source_module_id: friction_payload.source_module_id || runtime_event_context.module_id,
    gate_id: runtime_event_context.gate_id || null,
    decision_id: runtime_event_context.decision_id || null,
    replay_run_id: runtime_event_context.replay_run_id || null,
    observed_runtime_state: execution_state.current_state || runtime_event_context.runtime_state || null
  };
}

function block(reasonCode, error) {
  return {
    valid: false,
    status: 'BLOCK',
    reason_codes: [reasonCode],
    error
  };
}

function hold(reasonCode, error) {
  return {
    valid: false,
    status: 'HOLD',
    reason_codes: [reasonCode],
    error
  };
}

module.exports = {
  FRICTION_SCHEMA_VERSION,
  ALLOWED_FRICTION_TYPES,
  ALLOWED_SEVERITIES,
  REQUIRED_FRICTION_FIELD_KEYS,
  validateFrictionPayload,
  buildFrictionEvent
};
