const fs = require('fs');
const path = require('path');

const STATE_FILE = 'reconciliationState.json';

function loadReconciliationState(rootPath) {
  const statePath = path.join(rootPath, 'orchestrator', 'reconciliation', STATE_FILE);
  if (!fs.existsSync(statePath)) {
    return { current_cycle: 0, cycles: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (e) {
    return { current_cycle: 0, cycles: [] };
  }
}

function saveReconciliationState(rootPath, state) {
  const statePath = path.join(rootPath, 'orchestrator', 'reconciliation', STATE_FILE);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function createDeterministicCycleId(currentCycle) {
  return `reconciliation_cycle_${currentCycle + 1}`;
}

function createReconciliationCycle(rootPath) {
  const state = loadReconciliationState(rootPath);
  const cycle = {
    cycle_id: createDeterministicCycleId(state.current_cycle),
    started_at: new Date().toISOString(),
    completed_at: null,
    status: 'IN_PROGRESS',
    reason_codes: []
  };
  state.current_cycle += 1;
  state.cycles.push(cycle);
  saveReconciliationState(rootPath, state);
  return cycle;
}

function completeReconciliationCycle(rootPath, cycle, status, reason_codes) {
  const state = loadReconciliationState(rootPath);
  const existing = state.cycles.find(entry => entry.cycle_id === cycle.cycle_id);
  const completed = {
    ...cycle,
    status,
    reason_codes,
    completed_at: new Date().toISOString()
  };
  if (existing) {
    Object.assign(existing, completed);
  } else {
    state.cycles.push(completed);
  }
  saveReconciliationState(rootPath, state);
  return completed;
}

module.exports = {
  loadReconciliationState,
  createReconciliationCycle,
  completeReconciliationCycle
};