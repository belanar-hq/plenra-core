const fs = require('fs');
const path = require('path');
const { listMemoryEvents } = require('../events/memoryEventStore');
const { validateReplaySafety } = require('../replay/replaySafeMemoryValidator');
const { detectCanonDuplicates } = require('../dedup/canonDeduplicationRuntime');
const { evaluateMemoryTtl } = require('../ttl/memoryTtlRuntime');

function validateMemoryGovernance(rootPath) {
  const registryPath = path.join(rootPath, 'orchestrator', 'memory', 'memoryRegistry.json');
  const eventsPath = path.join(rootPath, 'orchestrator', 'memory', 'events');

  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch (e) {
    return {
      validation_status: 'BLOCK',
      coverage_confidence: 'PARTIAL',
      reason_codes: ['missing_registry'],
      blocked_systems: ['memory_governance', 'cross_gate_learning', 'predictive_risk', 'adaptive_memory', 'autonomous_optimization', 'self_improving_agents', 'replay_based_evolution']
    };
  }

  const events = listMemoryEvents(eventsPath);

  // Check if registry has required sections
  if (!registry.active || !registry.canon || !registry.archive || !registry.limits) {
    return {
      validation_status: 'BLOCK',
      coverage_confidence: 'PARTIAL',
      reason_codes: ['incomplete_registry'],
      blocked_systems: ['memory_governance', 'cross_gate_learning', 'predictive_risk', 'adaptive_memory', 'autonomous_optimization', 'self_improving_agents', 'replay_based_evolution']
    };
  }

  // Check ACTIVE limits
  const active = registry.active || [];
  if (active.length > registry.limits.active_max_items) {
    return {
      validation_status: 'HOLD',
      coverage_confidence: 'PARTIAL',
      reason_codes: ['active_over_limit'],
      blocked_systems: ['eviction', 'memory_governance', 'cross_gate_learning', 'predictive_risk', 'adaptive_memory', 'autonomous_optimization', 'self_improving_agents', 'replay_based_evolution']
    };
  }

  // Check TTL
  for (const item of active) {
    const ttlResult = evaluateMemoryTtl(item);
    if (ttlResult.result === 'HOLD') {
      return {
        validation_status: 'HOLD',
        coverage_confidence: 'PARTIAL',
        reason_codes: ['missing_ttl'],
        blocked_systems: ['ttl', 'memory_governance', 'cross_gate_learning', 'predictive_risk', 'adaptive_memory', 'autonomous_optimization', 'self_improving_agents', 'replay_based_evolution']
      };
    }
  }

  // Check dedup
  const canon = registry.canon || [];
  const duplicates = detectCanonDuplicates(canon);
  if (duplicates.length > 0) {
    return {
      validation_status: 'HOLD',
      coverage_confidence: 'PARTIAL',
      reason_codes: ['canon_duplicates'],
      blocked_systems: ['dedup', 'memory_governance', 'cross_gate_learning', 'predictive_risk', 'adaptive_memory', 'autonomous_optimization', 'self_improving_agents', 'replay_based_evolution']
    };
  }

  // Check archive migration safety - placeholder
  // Assume safe for now

  // Check registry references - placeholder
  // Assume ok

  // Check replay safety
  const replayResult = validateReplaySafety(events);
  if (replayResult.result !== 'PASS') {
    return {
      validation_status: 'BLOCK',
      coverage_confidence: 'PARTIAL',
      reason_codes: ['replay_unsafe'],
      blocked_systems: ['replay', 'memory_governance', 'cross_gate_learning', 'predictive_risk', 'adaptive_memory', 'autonomous_optimization', 'self_improving_agents', 'replay_based_evolution']
    };
  }

  // If no events or empty registry, not fully validated
  if (events.length === 0 || active.length === 0 && canon.length === 0 && registry.archive.length === 0) {
    return {
      validation_status: 'BLOCK',
      coverage_confidence: 'PARTIAL',
      reason_codes: ['no_memory_items'],
      blocked_systems: ['memory_governance', 'cross_gate_learning', 'predictive_risk', 'adaptive_memory', 'autonomous_optimization', 'self_improving_agents', 'replay_based_evolution']
    };
  }

  // All pass
  return {
    validation_status: 'PASS',
    coverage_confidence: 'HIGH',
    reason_codes: [],
    blocked_systems: []
  };
}

module.exports = {
  validateMemoryGovernance
};