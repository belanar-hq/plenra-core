const { aggregateFrictionEvents } = require('../friction/friction-aggregation');
const {
  KILL_CRITERIA_SCHEMA_VERSION,
  validateKillCriteriaInput
} = require('./kill-criteria-schema');
const { createFixTaskStub } = require('./fix-task-stub');

function buildCriteriaInputFromFrictionSummary(baseInput, frictionSummary) {
  const summary = frictionSummary || {};
  return {
    ...baseInput,
    average_contractor_response_time_minutes: summary.average_contractor_response_time_minutes,
    customer_confusion_rate: summary.customer_confusion_rate,
    repeated_manual_operator_notes: summary.repeated_manual_operator_notes,
    friction_summary_source: {
      source_type: 'mosquito_human_friction_logging_v1',
      observation_only: summary.observation_only === true
    }
  };
}

function buildCriteriaInputFromFrictionEvents(baseInput, frictionEvents) {
  return buildCriteriaInputFromFrictionSummary(baseInput, aggregateFrictionEvents(frictionEvents));
}

function evaluateBootstrapKillCriteria(input) {
  const validation = validateKillCriteriaInput(input);
  if (validation.status !== 'PASS') {
    return validation;
  }

  const triggered_rules = [];
  const actions = [];
  const reason_codes = [];
  const fix_tasks = [];

  addRule({
    condition: input.execution_window_days <= 45 && input.real_booking_count < 3,
    action: 'HOLD',
    rule_id: 'MINIMUM_REAL_BOOKINGS_NOT_MET',
    reason_code: 'FEWER_THAN_3_REAL_BOOKINGS_WITHIN_45_DAYS'
  });

  addRule({
    condition: input.routing_completion_rate < 0.4,
    action: 'INVESTIGATE',
    rule_id: 'LOW_ROUTING_COMPLETION_RATE',
    reason_code: 'ROUTING_COMPLETION_RATE_BELOW_40'
  });

  addRule({
    condition: input.average_contractor_response_time_minutes > 15,
    action: 'FAIL_ROUTING',
    rule_id: 'CONTRACTOR_RESPONSE_TIME_TOO_HIGH',
    reason_code: 'CONTRACTOR_RESPONSE_TIME_ABOVE_15'
  });

  addRule({
    condition: input.replay_integrity < 1,
    action: 'BLOCK_SCALING',
    rule_id: 'REPLAY_INTEGRITY_INCOMPLETE',
    reason_code: 'REPLAY_INTEGRITY_BELOW_100'
  });

  addRule({
    condition: input.customer_confusion_rate > 0.25,
    action: 'SIMPLIFY_INTAKE',
    rule_id: 'CUSTOMER_CONFUSION_TOO_HIGH',
    reason_code: 'CUSTOMER_CONFUSION_RATE_ABOVE_25'
  });

  addRule({
    condition: input.payment_completion_rate < 0.5,
    action: 'REVIEW_PAYMENT_FLOW',
    rule_id: 'PAYMENT_COMPLETION_TOO_LOW',
    reason_code: 'PAYMENT_COMPLETION_RATE_BELOW_50'
  });

  addRule({
    condition: input.outcome_confirmation_missing_rate > 0.3,
    action: 'BLOCK_LEARNING',
    rule_id: 'OUTCOME_CONFIRMATION_MISSING_TOO_HIGH',
    reason_code: 'OUTCOME_CONFIRMATION_MISSING_RATE_ABOVE_30'
  });

  for (const note of input.repeated_manual_operator_notes) {
    if (note.count >= 3) {
      addRule({
        condition: true,
        action: 'CREATE_FIX_TASK',
        rule_id: 'REPEATED_MANUAL_OPERATOR_NOTE',
        reason_code: 'MANUAL_OPERATOR_NOTE_REPEATED_3_TIMES',
        metadata: {
          repeated_note: note.note,
          count: note.count
        }
      });
      fix_tasks.push(createFixTaskStub({
        evaluation_id: input.evaluation_id,
        source_rule: 'REPEATED_MANUAL_OPERATOR_NOTE',
        repeated_note: note.note,
        count: note.count,
        next_required_fix: note.next_required_fix
      }));
    }
  }

  if (actions.length === 0) {
    actions.push('PASS');
    reason_codes.push('BOOTSTRAP_KILL_CRITERIA_HEALTHY');
  }

  return {
    valid: true,
    status: 'PASS',
    schema_version: input.schema_version || KILL_CRITERIA_SCHEMA_VERSION,
    evaluation_id: input.evaluation_id,
    idempotency_key: input.idempotency_key,
    actions,
    triggered_rules,
    reason_codes,
    fix_tasks,
    scaling_enabled: false,
    routing_changed: false,
    optimization_triggered: false,
    real_world_action_triggered: false,
    fix_executed: false
  };

  function addRule({ condition, action, rule_id, reason_code, metadata = {} }) {
    if (!condition) {
      return;
    }

    if (!actions.includes(action)) {
      actions.push(action);
    }

    triggered_rules.push({
      rule_id,
      action,
      reason_code,
      ...metadata
    });
    reason_codes.push(reason_code);
  }
}

function createBootstrapKillCriteriaHook() {
  return function mosquitoBootstrapKillCriteriaHook({ runtime_event_context, execution_state }) {
    if (!runtime_event_context || !execution_state) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['MISSING_RUNTIME_CONTEXT']
      };
    }

    if (!runtime_event_context.explicit_kill_criteria_call) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['KILL_CRITERIA_HOOK_REQUIRES_EXPLICIT_CALL']
      };
    }

    const input = {
      ...(runtime_event_context.kill_criteria_input || {}),
      lineage: {
        execution_id: runtime_event_context.execution_id,
        parent_event_id: runtime_event_context.event_id || null,
        runtime_state: execution_state.current_state || null,
        source_module_id: 'mosquito_bootstrap_kill_criteria_v1'
      }
    };

    return evaluateBootstrapKillCriteria(input);
  };
}

module.exports = {
  buildCriteriaInputFromFrictionSummary,
  buildCriteriaInputFromFrictionEvents,
  evaluateBootstrapKillCriteria,
  createBootstrapKillCriteriaHook
};
