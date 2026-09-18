const KILL_CRITERIA_SCHEMA_VERSION = 'mosquito_bootstrap_kill_criteria_v1';

const ALLOWED_ACTIONS = Object.freeze([
  'PASS',
  'HOLD',
  'INVESTIGATE',
  'FAIL_ROUTING',
  'BLOCK_SCALING',
  'SIMPLIFY_INTAKE',
  'REVIEW_PAYMENT_FLOW',
  'BLOCK_LEARNING',
  'CREATE_FIX_TASK',
  'BLOCK'
]);

const REQUIRED_METRICS = Object.freeze([
  'execution_window_days',
  'real_booking_count',
  'routing_completion_rate',
  'average_contractor_response_time_minutes',
  'replay_integrity',
  'customer_confusion_rate',
  'payment_completion_rate',
  'outcome_confirmation_missing_rate',
  'repeated_manual_operator_notes'
]);

const PERCENTAGE_METRICS = Object.freeze([
  'routing_completion_rate',
  'replay_integrity',
  'customer_confusion_rate',
  'payment_completion_rate',
  'outcome_confirmation_missing_rate'
]);

const NUMERIC_METRICS = Object.freeze([
  'execution_window_days',
  'real_booking_count',
  'average_contractor_response_time_minutes'
]);

function validateKillCriteriaInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return block('MALFORMED_KILL_CRITERIA_INPUT', 'evaluation input must be an object');
  }

  if (!input.idempotency_key) {
    return block('MISSING_IDEMPOTENCY_KEY', 'idempotency_key is required');
  }

  if (!input.evaluation_id) {
    return hold('MISSING_EVALUATION_ID', 'evaluation_id is required');
  }

  const missing = REQUIRED_METRICS.filter((metric) => input[metric] === undefined || input[metric] === null);
  if (missing.length > 0) {
    return {
      valid: false,
      status: 'HOLD',
      reason_codes: ['MISSING_REQUIRED_METRIC'],
      missing_metrics: missing,
      error: `Missing required metrics: ${missing.join(', ')}`
    };
  }

  if (typeof input.friction_summary_source !== 'object' || input.friction_summary_source === null || Array.isArray(input.friction_summary_source)) {
    return block('FREE_TEXT_SOURCE_OF_TRUTH_REJECTED', 'friction_summary_source must be structured data');
  }

  for (const metric of PERCENTAGE_METRICS) {
    if (typeof input[metric] !== 'number' || input[metric] < 0 || input[metric] > 1) {
      return block('MALFORMED_PERCENTAGE_METRIC', `${metric} must be a number between 0 and 1`);
    }
  }

  for (const metric of NUMERIC_METRICS) {
    if (typeof input[metric] !== 'number' || input[metric] < 0) {
      return block('MALFORMED_NUMERIC_METRIC', `${metric} must be a non-negative number`);
    }
  }

  if (!Array.isArray(input.repeated_manual_operator_notes)) {
    return block('MALFORMED_REPEATED_MANUAL_OPERATOR_NOTES', 'repeated_manual_operator_notes must be an array');
  }

  for (const note of input.repeated_manual_operator_notes) {
    if (!note || typeof note !== 'object' || typeof note.note !== 'string' || typeof note.count !== 'number') {
      return block('MALFORMED_REPEATED_MANUAL_OPERATOR_NOTES', 'manual note repeats must include note and count');
    }
  }

  if (input.routing_mutation_attempted) {
    return block('ROUTING_MUTATION_ATTEMPTED', 'kill criteria cannot mutate routing');
  }

  if (input.autonomous_optimization_triggered) {
    return block('OPTIMIZATION_TRIGGER_ATTEMPTED', 'kill criteria cannot trigger optimization');
  }

  if (input.scaling_enablement_attempted) {
    return block('SCALING_ENABLEMENT_ATTEMPTED', 'kill criteria cannot enable scaling');
  }

  if (input.automatic_fix_execution_attempted) {
    return block('AUTOMATIC_FIX_EXECUTION_ATTEMPTED', 'kill criteria cannot execute fixes automatically');
  }

  return {
    valid: true,
    status: 'PASS',
    reason_codes: ['KILL_CRITERIA_INPUT_VALID']
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
  KILL_CRITERIA_SCHEMA_VERSION,
  ALLOWED_ACTIONS,
  REQUIRED_METRICS,
  validateKillCriteriaInput
};
