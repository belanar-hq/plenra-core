const { createHashForObject } = require('../hashes/hashManager');

const MOSQUITO_VERTICAL_V1_CONTRACT = {
  artifact_id: 'mosquito_vertical_v1',
  contract_type: 'STATIC_DECISION_GATE',
  input_schema: {
    type: 'object',
    properties: {
      geo_scope: { type: 'string', enum: ['Petah Tikva'] },
      contact_channel: { type: 'string', enum: ['WhatsApp'] },
      mosquito_issue_description: { type: 'string' },
      property_type: { type: 'string', enum: ['house', 'apartment', 'yard', 'commercial'] },
      recurring_evening_issue: { type: 'boolean' },
      requested_action: { type: 'string', enum: ['installation', 'renewal', 'consultation'] }
    },
    required: ['geo_scope', 'contact_channel', 'mosquito_issue_description', 'property_type', 'recurring_evening_issue', 'requested_action']
  },
  required_fields: [
    'geo_scope',
    'contact_channel',
    'mosquito_issue_description',
    'property_type',
    'recurring_evening_issue',
    'requested_action'
  ],
  optional_fields: [
    'additional_notes'
  ],
  output_status: ['HOLD', 'PASS', 'BLOCK'],
  reason_codes: [
    'OUT_OF_INITIAL_GEO_SCOPE',
    'MISSING_REQUIRED_FIELDS',
    'UNSUPPORTED_INPUT',
    'ADAPTIVE_ROUTING_REQUESTED',
    'AUTONOMOUS_LEARNING_REQUESTED',
    'PREDICTIVE_RISK_REQUESTED',
    'STATIC_GATE_ELIGIBLE'
  ],
  deterministic_rules: [
    {
      condition: 'geo_scope !== "Petah Tikva"',
      output: 'HOLD',
      reason: 'OUT_OF_INITIAL_GEO_SCOPE'
    },
    {
      condition: 'contact_channel !== "WhatsApp"',
      output: 'HOLD',
      reason: 'UNSUPPORTED_CONTACT_CHANNEL'
    },
    {
      condition: 'missing required fields',
      output: 'HOLD',
      reason: 'MISSING_REQUIRED_FIELDS'
    },
    {
      condition: 'unsafe or inconsistent input',
      output: 'BLOCK',
      reason: 'UNSUPPORTED_INPUT'
    },
    {
      condition: 'adaptive routing requested',
      output: 'BLOCK',
      reason: 'ADAPTIVE_ROUTING_REQUESTED'
    },
    {
      condition: 'autonomous learning requested',
      output: 'BLOCK',
      reason: 'AUTONOMOUS_LEARNING_REQUESTED'
    },
    {
      condition: 'predictive risk requested',
      output: 'BLOCK',
      reason: 'PREDICTIVE_RISK_REQUESTED'
    },
    {
      condition: 'valid Petah Tikva WhatsApp mosquito input',
      output: 'PASS',
      reason: 'STATIC_GATE_ELIGIBLE'
    }
  ],
  partner_pilot_stub: {
    enabled: true,
    routing_mode: 'STUB_ONLY',
    adaptive_routing: false,
    autonomous_optimization: false
  },
  fail_closed_behavior: true
};

function evaluateMosquitoVerticalGate(input) {
  // Validate required fields
  const requiredFields = MOSQUITO_VERTICAL_V1_CONTRACT.required_fields;
  const missingFields = requiredFields.filter(field => !input[field]);
  if (missingFields.length > 0) {
    return { status: 'HOLD', reason_codes: ['MISSING_REQUIRED_FIELDS'] };
  }

  // Check geo scope
  if (input.geo_scope !== 'Petah Tikva') {
    return { status: 'HOLD', reason_codes: ['OUT_OF_INITIAL_GEO_SCOPE'] };
  }

  // Check contact channel
  if (input.contact_channel !== 'WhatsApp') {
    return { status: 'HOLD', reason_codes: ['UNSUPPORTED_CONTACT_CHANNEL'] };
  }

  // Check for blocked features
  if (input.adaptive_routing || input.autonomous_learning || input.predictive_risk) {
    const reasons = [];
    if (input.adaptive_routing) reasons.push('ADAPTIVE_ROUTING_REQUESTED');
    if (input.autonomous_learning) reasons.push('AUTONOMOUS_LEARNING_REQUESTED');
    if (input.predictive_risk) reasons.push('PREDICTIVE_RISK_REQUESTED');
    return { status: 'BLOCK', reason_codes: reasons };
  }

  // Validate input against schema (basic check)
  if (typeof input.mosquito_issue_description !== 'string' || input.mosquito_issue_description.length === 0) {
    return { status: 'BLOCK', reason_codes: ['UNSUPPORTED_INPUT'] };
  }

  // If all checks pass
  return { status: 'PASS', reason_codes: ['STATIC_GATE_ELIGIBLE'] };
}

function validateContractIntegrity() {
  const hash = createHashForObject(MOSQUITO_VERTICAL_V1_CONTRACT);
  return hash;
}

module.exports = {
  MOSQUITO_VERTICAL_V1_CONTRACT,
  evaluateMosquitoVerticalGate,
  validateContractIntegrity
};