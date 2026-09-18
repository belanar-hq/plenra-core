const RUNTIME_STATES = Object.freeze([
  'CREATED',
  'INTAKE_RECEIVED',
  'GATE_EVALUATED',
  'ROUTING_READY',
  'ROUTING_ATTEMPTED',
  'BOOKING_PENDING',
  'PAYMENT_PENDING',
  'SERVICE_PENDING',
  'OUTCOME_PENDING',
  'COMPLETED',
  'HOLD',
  'BLOCKED',
  'FAILED'
]);

const TERMINAL_STATES = new Set(['COMPLETED', 'BLOCKED', 'FAILED']);

const ALLOWED_TRANSITIONS = Object.freeze({
  CREATED: ['INTAKE_RECEIVED', 'HOLD', 'BLOCKED', 'FAILED'],
  INTAKE_RECEIVED: ['GATE_EVALUATED', 'HOLD', 'BLOCKED', 'FAILED'],
  GATE_EVALUATED: ['ROUTING_READY', 'HOLD', 'BLOCKED', 'FAILED'],
  ROUTING_READY: ['ROUTING_ATTEMPTED', 'BOOKING_PENDING', 'HOLD', 'BLOCKED', 'FAILED'],
  ROUTING_ATTEMPTED: ['BOOKING_PENDING', 'HOLD', 'BLOCKED', 'FAILED'],
  BOOKING_PENDING: ['PAYMENT_PENDING', 'SERVICE_PENDING', 'HOLD', 'BLOCKED', 'FAILED'],
  PAYMENT_PENDING: ['SERVICE_PENDING', 'HOLD', 'BLOCKED', 'FAILED'],
  SERVICE_PENDING: ['OUTCOME_PENDING', 'HOLD', 'BLOCKED', 'FAILED'],
  OUTCOME_PENDING: ['COMPLETED', 'HOLD', 'BLOCKED', 'FAILED'],
  HOLD: ['INTAKE_RECEIVED', 'GATE_EVALUATED', 'ROUTING_READY', 'BOOKING_PENDING', 'PAYMENT_PENDING', 'SERVICE_PENDING', 'OUTCOME_PENDING', 'BLOCKED', 'FAILED'],
  BLOCKED: [],
  FAILED: [],
  COMPLETED: []
});

function validateRuntimeTransition({ current_state, next_state }) {
  if (!current_state || !next_state) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['MISSING_STATE_TRANSITION_DATA'],
      error: 'current_state and next_state are required'
    };
  }

  if (!RUNTIME_STATES.includes(current_state) || !RUNTIME_STATES.includes(next_state)) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['UNKNOWN_RUNTIME_STATE'],
      error: 'current_state or next_state is not recognized'
    };
  }

  if (TERMINAL_STATES.has(current_state)) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['TERMINAL_STATE_TRANSITION_ATTEMPTED'],
      error: 'Terminal runtime states cannot transition'
    };
  }

  if (!ALLOWED_TRANSITIONS[current_state].includes(next_state)) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['INVALID_RUNTIME_STATE_TRANSITION'],
      error: `Transition ${current_state} -> ${next_state} is not allowed`
    };
  }

  return {
    valid: true,
    status: 'PASS',
    reason_codes: ['RUNTIME_TRANSITION_ALLOWED']
  };
}

module.exports = {
  RUNTIME_STATES,
  ALLOWED_TRANSITIONS,
  validateRuntimeTransition
};
