/**
 * E2E Idempotency Guard for Mosquito
 * Enforces idempotency for every state-changing action in the flow.
 */

const crypto = require('crypto');

function requireIdempotencyKey(input) {
  if (!input || !input.idempotency_key) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['MISSING_IDEMPOTENCY_KEY'],
      error: 'idempotency_key is required for state-changing actions'
    };
  }

  return {
    valid: true,
    status: 'PASS'
  };
}

function generatePayloadHash(payload) {
  const normalized = JSON.stringify(payload || {});
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

async function validateE2EIdempotency({ idempotency_key, operation, payload, storageAdapter }) {
  if (!idempotency_key) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['MISSING_IDEMPOTENCY_KEY'],
      error: 'idempotency_key is required'
    };
  }

  if (!storageAdapter) {
    return {
      valid: true,
      status: 'PASS',
      duplicate: false
    };
  }

  const existing = await storageAdapter.idempotencyStore.checkIdempotency(
    idempotency_key,
    operation,
    payload
  );

  if (existing === 'DUPLICATE_KEY_DIFFERENT_PAYLOAD') {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['IDEMPOTENCY_KEY_PAYLOAD_MISMATCH'],
      error: 'Same idempotency key with different payload'
    };
  }

  if (existing) {
    return {
      valid: true,
      status: 'PASS',
      duplicate: true,
      result: existing.result
    };
  }

  return {
    valid: true,
    status: 'PASS',
    duplicate: false
  };
}

module.exports = {
  requireIdempotencyKey,
  validateE2EIdempotency,
  generatePayloadHash
};
