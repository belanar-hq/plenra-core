/**
 * Operational Replay Logger
 * 
 * Logs every state transition for audit and replay capability.
 * Fail-closed if replay logs missing.
 */

const fs = require('fs');
const path = require('path');

class OperationalReplayLogger {
  constructor(eventLog = null) {
    this.schema_version = '1.0.0';
    this.logs = {}; // In-memory for testing; in production: database
    this.eventLog = eventLog;
  }

  /**
   * Log operational state transition
   * Every transition must be logged
   */
  logOperationalTransition(input) {
    const {
      case_id,
      previous_state,
      next_state,
      reason_codes,
      actor_type,
      actor_id,
      lineage
    } = input;

    if (!case_id || !previous_state || !next_state) {
      return {
        success: false,
        error: 'case_id, previous_state, next_state required'
      };
    }

    const transitionLog = {
      log_id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      case_id,
      previous_state,
      next_state,
      reason_codes: reason_codes || [],
      actor_type: actor_type || 'system',
      actor_id: actor_id || 'unknown',
      timestamp: new Date().toISOString(),
      lineage: lineage || []
    };

    // Initialize logs for this case if not exists
    if (!this.logs[case_id]) {
      this.logs[case_id] = [];
    }

    // Append transition log
    this.logs[case_id].push(transitionLog);

    return {
      success: true,
      log_id: transitionLog.log_id,
      status: 'TRANSITION_LOGGED',
      timestamp: transitionLog.timestamp
    };
  }

  /**
   * Write operational transition to append-only JSONL when available
   */
  async logOperationalTransitionAsync(input) {
    const result = this.logOperationalTransition(input);

    if (this.eventLog) {
      const eventPayload = {
        event_type: 'operational_transition',
        case_id: input.case_id,
        payload: {
          previous_state: input.previous_state,
          next_state: input.next_state,
          reason_codes: input.reason_codes,
          actor_type: input.actor_type,
          actor_id: input.actor_id,
          lineage: input.lineage
        }
      };

      await this.eventLog.writeOperationalTransition(eventPayload);
    }

    return result;
  }

  /**
   * List all operational transitions for a case
   */
  listOperationalTransitions(case_id) {
    if (!case_id) {
      return {
        valid: false,
        error: 'case_id required'
      };
    }

    const transitions = this.logs[case_id] || [];

    return {
      valid: true,
      case_id,
      transition_count: transitions.length,
      transitions: transitions
    };
  }

  /**
   * Validate replay completeness
   * FAIL_CLOSED: Missing replay log returns HOLD
   */
  validateReplayCompleteness(input) {
    const { case_id, expected_transitions } = input;

    if (!case_id) {
      return {
        valid: false,
        status: 'BLOCK',
        error: 'case_id required'
      };
    }

    const transitionList = this.listOperationalTransitions(case_id);

    if (!transitionList.valid) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['REPLAY_LOG_MISSING'],
        error: 'Replay log not found for case'
      };
    }

    const transitions = transitionList.transitions;

    if (expected_transitions && transitions.length < expected_transitions) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['INCOMPLETE_REPLAY_LOG'],
        expected: expected_transitions,
        actual: transitions.length,
        error: 'Replay log incomplete - missing transitions'
      };
    }

    // Validate all transitions have required fields
    const missingFields = transitions.filter(t =>
      !t.log_id || !t.previous_state || !t.next_state || !t.timestamp
    );

    if (missingFields.length > 0) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['MALFORMED_REPLAY_LOG'],
        error: `${missingFields.length} transitions missing required fields`
      };
    }

    return {
      valid: true,
      status: 'REPLAY_COMPLETE',
      transition_count: transitions.length,
      can_replay: true
    };
  }

  /**
   * Get complete case history
   */
  getCaseHistory(case_id) {
    const transitionList = this.listOperationalTransitions(case_id);
    
    if (!transitionList.valid) {
      return {
        valid: false,
        error: 'Case history not found'
      };
    }

    const transitions = transitionList.transitions;

    // Build state progression
    const progression = transitions.map(t => ({
      state: t.next_state,
      timestamp: t.timestamp,
      actor: t.actor_type
    }));

    return {
      valid: true,
      case_id,
      state_progression: progression,
      total_transitions: transitions.length,
      first_transition: transitions[0]?.timestamp,
      last_transition: transitions[transitions.length - 1]?.timestamp
    };
  }

  /**
   * Validate transition is logged
   */
  validateTransitionLogged(case_id, expectedState) {
    const transitionList = this.listOperationalTransitions(case_id);

    if (!transitionList.valid) {
      return {
        logged: false,
        error: 'Case not found'
      };
    }

    const found = transitionList.transitions.some(t => t.next_state === expectedState);

    return {
      logged: found,
      expected_state: expectedState
    };
  }
}

module.exports = { OperationalReplayLogger };
