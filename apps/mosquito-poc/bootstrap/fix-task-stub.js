function createFixTaskStub({ evaluation_id, source_rule, repeated_note, count, next_required_fix }) {
  return {
    fix_task_id: `fix_task_${evaluation_id}_${source_rule}`,
    source_rule,
    repeated_note,
    count,
    next_required_fix: next_required_fix || 'Investigate repeated manual operator note',
    status: 'STUB_ONLY',
    auto_execute: false,
    routing_changed: false,
    optimization_triggered: false,
    scaling_enabled: false
  };
}

module.exports = {
  createFixTaskStub
};
