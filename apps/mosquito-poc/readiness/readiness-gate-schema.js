const READINESS_SCHEMA_VERSION = 'mosquito_real_world_execution_readiness_gate_v1';

const REQUIRED_READINESS_CHECKS = Object.freeze([
  'operator_runbook_acknowledged',
  'manual_whatsapp_process_documented',
  'contractor_availability_confirmed',
  'manual_payment_proof_process_documented',
  'replay_logging_validated',
  'human_friction_logging_ready',
  'bootstrap_kill_criteria_ready',
  'rollback_path_documented',
  'manual_limited_observable_mode'
]);

const BLOCKED_CAPABILITIES = Object.freeze([
  'production_deployment',
  'live_credit_card_charging',
  'adaptive_routing',
  'autonomous_learning',
  'campaign_scaling',
  'autonomous_optimization',
  'external_api_activation'
]);

function validateReadinessInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return block('MALFORMED_READINESS_INPUT', 'Readiness input must be an object');
  }

  if (!input.idempotency_key) {
    return block('MISSING_IDEMPOTENCY_KEY', 'idempotency_key is required');
  }

  if (!input.readiness_evaluation_id) {
    return hold('MISSING_READINESS_EVALUATION_ID', 'readiness_evaluation_id is required');
  }

  if (!input.evidence || typeof input.evidence !== 'object' || Array.isArray(input.evidence)) {
    return hold('MISSING_READINESS_EVIDENCE', 'readiness evidence object is required');
  }

  if (!input.blocked_capabilities || typeof input.blocked_capabilities !== 'object' || Array.isArray(input.blocked_capabilities)) {
    return block('MALFORMED_BLOCKED_CAPABILITIES', 'blocked_capabilities must be an object');
  }

  for (const capability of BLOCKED_CAPABILITIES) {
    if (typeof input.blocked_capabilities[capability] !== 'boolean') {
      return block('MALFORMED_BLOCKED_CAPABILITY_FLAG', `${capability} must be boolean`);
    }
  }

  for (const check of REQUIRED_READINESS_CHECKS) {
    if (input.evidence[check] === undefined) {
      return hold('MISSING_REQUIRED_READINESS_CHECK', `${check} is required`);
    }

    if (typeof input.evidence[check] !== 'boolean') {
      return block('MALFORMED_READINESS_CHECK', `${check} must be boolean`);
    }
  }

  if (input.execution_trigger_attempted) {
    return block('REAL_WORLD_EXECUTION_TRIGGER_ATTEMPTED', 'Readiness gate cannot trigger execution');
  }

  if (input.production_enablement_attempted) {
    return block('PRODUCTION_ENABLEMENT_ATTEMPTED', 'Readiness gate cannot enable production');
  }

  if (input.runtime_state_mutation_attempted) {
    return block('RUNTIME_STATE_MUTATION_ATTEMPTED', 'Readiness gate cannot mutate runtime state');
  }

  return {
    valid: true,
    status: 'PASS',
    reason_codes: ['READINESS_INPUT_VALID']
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
  READINESS_SCHEMA_VERSION,
  REQUIRED_READINESS_CHECKS,
  BLOCKED_CAPABILITIES,
  validateReadinessInput
};
