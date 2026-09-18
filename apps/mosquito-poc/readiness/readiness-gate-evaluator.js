const {
  READINESS_SCHEMA_VERSION,
  REQUIRED_READINESS_CHECKS,
  BLOCKED_CAPABILITIES,
  validateReadinessInput
} = require('./readiness-gate-schema');

const CHECK_REASON_CODES = Object.freeze({
  operator_runbook_acknowledged: 'OPERATOR_RUNBOOK_NOT_ACKNOWLEDGED',
  manual_whatsapp_process_documented: 'MANUAL_WHATSAPP_PROCESS_NOT_DOCUMENTED',
  contractor_availability_confirmed: 'CONTRACTOR_AVAILABILITY_NOT_CONFIRMED',
  manual_payment_proof_process_documented: 'MANUAL_PAYMENT_PROOF_PROCESS_NOT_DOCUMENTED',
  replay_logging_validated: 'REPLAY_LOGGING_NOT_VALIDATED',
  human_friction_logging_ready: 'HUMAN_FRICTION_LOGGING_NOT_READY',
  bootstrap_kill_criteria_ready: 'BOOTSTRAP_KILL_CRITERIA_NOT_READY',
  rollback_path_documented: 'ROLLBACK_PATH_NOT_DOCUMENTED',
  manual_limited_observable_mode: 'MANUAL_LIMITED_OBSERVABLE_MODE_NOT_CONFIRMED'
});

function evaluateRealWorldExecutionReadiness(input) {
  const validation = validateReadinessInput(input);
  if (validation.status !== 'PASS') {
    return validation;
  }

  const enabledBlockedCapabilities = BLOCKED_CAPABILITIES.filter((capability) => input.blocked_capabilities[capability] === true);
  if (enabledBlockedCapabilities.length > 0) {
    return {
      valid: false,
      status: 'BLOCK',
      readiness_status: 'BLOCKED',
      reason_codes: ['BLOCKED_CAPABILITY_ENABLED'],
      blocked_capabilities_enabled: enabledBlockedCapabilities,
      execution_allowed: false,
      production_enabled: false,
      runtime_state_mutated: false
    };
  }

  const missingChecks = REQUIRED_READINESS_CHECKS.filter((check) => input.evidence[check] !== true);
  if (missingChecks.length > 0) {
    return {
      valid: false,
      status: 'HOLD',
      readiness_status: 'HOLD',
      reason_codes: missingChecks.map((check) => CHECK_REASON_CODES[check]),
      missing_checks: missingChecks,
      execution_allowed: false,
      production_enabled: false,
      runtime_state_mutated: false
    };
  }

  return {
    valid: true,
    status: 'PASS',
    readiness_status: 'READY_FOR_MANUAL_LIMITED_OBSERVABLE_EXECUTION_REVIEW',
    schema_version: input.schema_version || READINESS_SCHEMA_VERSION,
    readiness_evaluation_id: input.readiness_evaluation_id,
    idempotency_key: input.idempotency_key,
    reason_codes: ['REAL_WORLD_EXECUTION_READINESS_GATE_PASSED'],
    execution_allowed: true,
    execution_mode: 'MANUAL_LIMITED_OBSERVABLE',
    production_enabled: false,
    live_payment_enabled: false,
    adaptive_routing_enabled: false,
    autonomous_learning_enabled: false,
    campaign_scaling_enabled: false,
    external_api_activation_enabled: false,
    runtime_state_mutated: false,
    real_world_execution_triggered: false
  };
}

module.exports = {
  evaluateRealWorldExecutionReadiness
};
