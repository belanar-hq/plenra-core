function scanChatManifest(manifest) {
  // Placeholder: assume manifest is array of chats
  return manifest.map(chat => ({
    ...chat,
    plenra_signals: detectPlenraSignals(chat)
  }));
}

function detectPlenraSignals(chat) {
  const content = JSON.stringify(chat).toLowerCase();
  const signals = [];

  if (content.includes('plenra')) {
    signals.push('PLENRA_KEYWORD_MATCH');
  }
  if (content.includes('decision gate') || content.includes('gate logic')) {
    signals.push('DECISION_GATE_LOGIC_DETECTED');
  }
  if (content.includes('agent spec') || content.includes('agent specification')) {
    signals.push('AGENT_SPEC_DETECTED');
  }
  if (content.includes('codex prompt') || content.includes('codex task')) {
    signals.push('CODEX_PROMPT_DETECTED');
  }
  if (content.includes('memory') && content.includes('replay')) {
    signals.push('MEMORY_OR_REPLAY_LOGIC_DETECTED');
  }
  if (content.includes('infrastructure') && content.includes('dependency')) {
    signals.push('INFRASTRUCTURE_DEPENDENCY_DETECTED');
  }
  if (content.includes('revenue') && content.includes('routing')) {
    signals.push('REVENUE_ROUTING_LOGIC_DETECTED');
  }
  if (content.includes('vertical gate')) {
    signals.push('VERTICAL_GATE_LOGIC_DETECTED');
  }
  if (content.includes('validation rules') || content.includes('validation requirements')) {
    signals.push('VALIDATION_RULES_DETECTED');
  }
  if (content.includes('orchestration logic') || content.includes('orchestrator')) {
    signals.push('ORCHESTRATION_LOGIC_DETECTED');
  }

  return signals;
}

module.exports = {
  scanChatManifest,
  detectPlenraSignals
};