const fs = require('fs');
const path = require('path');
const {
  buildFrictionEvent,
  validateFrictionPayload
} = require('./friction-event-schema');

class HumanFrictionLogger {
  constructor({ eventsDir, eventsPath } = {}) {
    this.eventsDir = eventsDir || path.join(__dirname, 'events');
    this.eventsPath = eventsPath || path.join(this.eventsDir, 'friction-events.jsonl');
    this.ensureLogFile();
  }

  ensureLogFile() {
    const dir = path.dirname(this.eventsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.eventsPath)) {
      fs.writeFileSync(this.eventsPath, '', 'utf8');
    }
  }

  readEvents() {
    this.ensureLogFile();
    const content = fs.readFileSync(this.eventsPath, 'utf8');
    if (!content.trim()) {
      return [];
    }

    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  }

  logFrictionEvent({ runtime_event_context, execution_state, friction_payload } = {}) {
    const validation = validateFrictionPayload({
      runtime_event_context,
      execution_state,
      friction_payload
    });

    if (validation.status !== 'PASS') {
      return validation;
    }

    const frictionEvent = buildFrictionEvent({
      runtime_event_context,
      execution_state,
      friction_payload
    });

    const existing = this.readEvents().find((event) => event.idempotency_key === frictionEvent.idempotency_key);
    if (existing) {
      if (existing.payload_hash !== frictionEvent.payload_hash) {
        return {
          valid: false,
          status: 'BLOCK',
          reason_codes: ['IDEMPOTENCY_KEY_PAYLOAD_CONFLICT'],
          error: 'Duplicate idempotency_key with different payload',
          existing_event: existing
        };
      }

      return {
        valid: true,
        status: 'PASS',
        reason_codes: ['IDEMPOTENT_FRICTION_EVENT_RETURNED'],
        event: existing,
        idempotent: true
      };
    }

    try {
      fs.appendFileSync(this.eventsPath, `${JSON.stringify(frictionEvent)}\n`, 'utf8');
    } catch (error) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['FRICTION_EVENT_WRITE_FAILED'],
        error: error.message
      };
    }

    return {
      valid: true,
      status: 'PASS',
      reason_codes: ['FRICTION_EVENT_LOGGED'],
      event: frictionEvent,
      idempotent: false,
      routing_changed: false,
      optimization_triggered: false,
      kill_criteria_triggered: false
    };
  }
}

function createHumanFrictionHook(logger) {
  const frictionLogger = logger || new HumanFrictionLogger();

  return function mosquitoHumanFrictionLoggingHook({ runtime_event_context, execution_state }) {
    if (!runtime_event_context || !execution_state) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['MISSING_RUNTIME_CONTEXT']
      };
    }

    if (!runtime_event_context.explicit_friction_logging_call) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['FRICTION_HOOK_REQUIRES_EXPLICIT_CALL']
      };
    }

    return frictionLogger.logFrictionEvent({
      runtime_event_context,
      execution_state,
      friction_payload: runtime_event_context.friction_payload
    });
  };
}

module.exports = {
  HumanFrictionLogger,
  createHumanFrictionHook
};
