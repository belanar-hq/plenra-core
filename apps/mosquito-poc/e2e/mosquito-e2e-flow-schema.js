/**
 * E2E Flow Schema Validation for Mosquito
 * Ensures required payload fields and IDs are present for storage-bound E2E transitions.
 */

const requiredFlowFields = [
  'case_id',
  'customer_id',
  'geo_scope',
  'idempotency_key',
  'lineage',
  'reason_codes'
];

const requiredStateChangingFields = [
  'case_id',
  'idempotency_key',
  'lineage',
  'reason_codes'
];

function validateE2EFlowInput(input) {
  if (!input || typeof input !== 'object') {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['INVALID_FLOW_INPUT'],
      error: 'Input must be an object'
    };
  }

  const missing = requiredFlowFields.filter((field) => !(field in input));

  if (missing.length > 0) {
    const errorCode = missing.includes('idempotency_key') ? 'MISSING_IDEMPOTENCY_KEY' : 'MISSING_REQUIRED_FIELD';
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: [errorCode],
      missing_fields: missing,
      error: `Missing required flow fields: ${missing.join(', ')}`
    };
  }

  if (input.geo_scope !== 'Petah Tikva') {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['INVALID_GEO_SCOPE'],
      error: 'Geo scope must be Petah Tikva'
    };
  }

  return {
    valid: true,
    status: 'PASS'
  };
}

function validateStateChangingActionInput(input) {
  const missing = requiredStateChangingFields.filter((field) => !(field in input));

  if (missing.length > 0) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['MISSING_STATE_CHANGING_FIELD'],
      missing_fields: missing,
      error: `Missing required state-changing fields: ${missing.join(', ')}`
    };
  }

  return {
    valid: true,
    status: 'PASS'
  };
}

module.exports = {
  validateE2EFlowInput,
  validateStateChangingActionInput
};
