/**
 * E2E Fail-Closed Validator for Mosquito
 * Blocks forbidden operational actions and unsafe runtime flags.
 */

function blockForbiddenE2EActions(input) {
  const blocked = [];

  if (input.external_api_call) {
    blocked.push('EXTERNAL_API_CALL_ATTEMPTED');
  }

  if (input.live_credit_card_activation) {
    blocked.push('LIVE_CREDIT_CARD_ACTIVATION_ATTEMPTED');
  }

  if (input.adaptive_routing) {
    blocked.push('ADAPTIVE_ROUTING_ATTEMPTED');
  }

  if (input.autonomous_optimization) {
    blocked.push('AUTONOMOUS_OPTIMIZATION_ATTEMPTED');
  }

  if (input.production_deployment) {
    blocked.push('PRODUCTION_DEPLOYMENT_ATTEMPTED');
  }

  if (blocked.length > 0) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: blocked,
      error: 'Forbidden E2E action attempted'
    };
  }

  if (input.geo_scope && input.geo_scope !== 'Petah Tikva') {
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

function validateE2ESafety(input) {
  return blockForbiddenE2EActions(input);
}

module.exports = {
  blockForbiddenE2EActions,
  validateE2ESafety
};
