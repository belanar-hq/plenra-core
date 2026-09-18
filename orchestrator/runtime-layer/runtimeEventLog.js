const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateRuntimeTransition } = require('./stateMachine');

const SCHEMA_VERSION = 'runtime_layer_v1_minimal';

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function createPayloadHash(payload) {
  return crypto.createHash('sha256').update(stableStringify(payload || {})).digest('hex');
}

function createEventId(event) {
  const identity = {
    execution_id: event.execution_id,
    idempotency_key: event.idempotency_key,
    payload_hash: event.payload_hash,
    previous_state: event.previous_state,
    next_state: event.next_state,
    event_type: event.event_type
  };

  return `runtime_evt_${createPayloadHash(identity).slice(0, 24)}`;
}

class RuntimeEventLog {
  constructor(logPath) {
    this.logPath = logPath || path.join(__dirname, 'runtime-events.jsonl');
    this.ensureLogFile();
  }

  ensureLogFile() {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.logPath)) {
      fs.writeFileSync(this.logPath, '', 'utf8');
    }
  }

  readEvents() {
    this.ensureLogFile();
    const content = fs.readFileSync(this.logPath, 'utf8');
    if (!content.trim()) {
      return [];
    }

    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  }

  readEventsByExecutionId(executionId) {
    return this.readEvents().filter((event) => event.execution_id === executionId);
  }

  appendRuntimeEvent(input) {
    const validation = validateRuntimeEventInput(input);
    if (validation.status !== 'PASS') {
      return validation;
    }

    const payloadHash = input.payload_hash || createPayloadHash(input.payload);
    const existing = this.readEvents().find((event) => event.idempotency_key === input.idempotency_key);

    if (existing) {
      if (existing.payload_hash !== payloadHash) {
        return {
          valid: false,
          status: 'BLOCK',
          reason_codes: ['IDEMPOTENCY_KEY_PAYLOAD_CONFLICT'],
          error: 'Same idempotency_key was used with a different payload_hash',
          existing_event: existing
        };
      }

      return {
        valid: true,
        status: 'PASS',
        reason_codes: ['IDEMPOTENT_REPLAY_RETURNED'],
        event: existing,
        idempotent: true
      };
    }

    const transitionValidation = validateRuntimeTransition({
      current_state: input.previous_state,
      next_state: input.next_state
    });

    if (transitionValidation.status !== 'PASS') {
      return transitionValidation;
    }

    const event = {
      event_id: input.event_id || createEventId({ ...input, payload_hash: payloadHash }),
      idempotency_key: input.idempotency_key,
      timestamp: input.timestamp || new Date().toISOString(),
      module_id: input.module_id,
      gate_id: input.gate_id,
      execution_id: input.execution_id,
      previous_state: input.previous_state,
      next_state: input.next_state,
      event_type: input.event_type,
      reason_code: input.reason_code,
      payload_hash: payloadHash,
      parent_event_id: input.parent_event_id || null,
      schema_version: input.schema_version || SCHEMA_VERSION,
      lineage: {
        execution_id: input.execution_id,
        parent_event_id: input.parent_event_id || null,
        originating_module_id: input.originating_module_id || input.module_id,
        current_module_id: input.current_module_id || input.module_id,
        gate_id: input.gate_id,
        decision_id: input.decision_id || null,
        replay_run_id: input.replay_run_id || null
      },
      replay_only: input.replay_only === true
    };

    fs.appendFileSync(this.logPath, `${JSON.stringify(event)}\n`, 'utf8');

    return {
      valid: true,
      status: 'PASS',
      reason_codes: ['RUNTIME_EVENT_APPENDED'],
      event,
      idempotent: false
    };
  }
}

function validateRuntimeEventInput(input) {
  if (!input || typeof input !== 'object') {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['MALFORMED_RUNTIME_EVENT_INPUT'],
      error: 'Runtime event input must be an object'
    };
  }

  const requiredFields = [
    'idempotency_key',
    'module_id',
    'gate_id',
    'execution_id',
    'previous_state',
    'next_state',
    'event_type',
    'reason_code'
  ];

  const missing = requiredFields.filter((field) => !input[field]);
  if (missing.length > 0) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: missing.includes('idempotency_key') ? ['MISSING_IDEMPOTENCY_KEY'] : ['MISSING_RUNTIME_EVENT_FIELDS'],
      missing_fields: missing,
      error: `Missing runtime event fields: ${missing.join(', ')}`
    };
  }

  return {
    valid: true,
    status: 'PASS'
  };
}

module.exports = {
  RuntimeEventLog,
  SCHEMA_VERSION,
  stableStringify,
  createPayloadHash,
  validateRuntimeEventInput
};
