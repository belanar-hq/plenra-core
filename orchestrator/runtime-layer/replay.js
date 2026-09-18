const { restoreRuntimeState } = require('./stateRestorer');

function replayRuntimeExecution({ eventLog, execution_id, expected_state, expected_event_count, replay_run_id }) {
  if (!eventLog || typeof eventLog.readEvents !== 'function') {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['RUNTIME_EVENT_LOG_REQUIRED'],
      error: 'eventLog with readEvents is required for replay'
    };
  }

  if (!execution_id) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['MISSING_EXECUTION_ID'],
      error: 'execution_id is required for replay'
    };
  }

  const beforeCount = eventLog.readEvents().length;
  const restoreResult = restoreRuntimeState(eventLog.readEvents(), execution_id);
  const afterCount = eventLog.readEvents().length;

  if (afterCount !== beforeCount) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['REPLAY_CREATED_SIDE_EFFECT'],
      error: 'Replay must not append or mutate runtime events'
    };
  }

  if (restoreResult.status !== 'PASS') {
    return {
      ...restoreResult,
      replay_only: true,
      replay_run_id: replay_run_id || null
    };
  }

  if (expected_state && restoreResult.current_state !== expected_state) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['REPLAY_STATE_MISMATCH'],
      expected_state,
      actual_state: restoreResult.current_state,
      replay_only: true,
      replay_run_id: replay_run_id || null
    };
  }

  if (typeof expected_event_count === 'number' && restoreResult.event_count !== expected_event_count) {
    return {
      valid: false,
      status: 'BLOCK',
      reason_codes: ['REPLAY_MISSING_EVENTS'],
      expected_event_count,
      actual_event_count: restoreResult.event_count,
      replay_only: true,
      replay_run_id: replay_run_id || null
    };
  }

  return {
    valid: true,
    status: 'PASS',
    reason_codes: ['RUNTIME_REPLAY_VERIFIED'],
    execution_id,
    current_state: restoreResult.current_state,
    replay_only: true,
    replay_run_id: replay_run_id || null
  };
}

module.exports = {
  replayRuntimeExecution
};
