const { listChatRecords } = require('../indexing/chatIndexRegistry');
const { validateMemoryGovernance } = require('../../memory/validation/memoryGovernanceValidator');

function auditCoverage(rootPath) {
  const chats = listChatRecords('');
  const known = chats.length;
  const ingested = chats.filter(c => c.coverage_status === 'INGESTED').length;
  const unprocessed = chats.filter(c => c.coverage_status === 'UNSCANNED').length;
  const partially = chats.filter(c => c.maturity_status === 'NEEDS_STRUCTURE').length;
  const ready = chats.filter(c => c.codex_readiness === 'READY').length;

  const missedImportant = chats
    .filter(c => c.coverage_status === 'UNSCANNED' && c.maturity_status !== 'NOISE')
    .map(c => c.source_chat_id);
  const immatureImportant = chats
    .filter(c => c.maturity_status === 'NEEDS_STRUCTURE' && c.coverage_status !== 'NOISE')
    .map(c => c.source_chat_id);

  const memoryValidation = validateMemoryGovernance(rootPath);

  let coverage_confidence = 'PARTIAL';
  if (unprocessed === 0 && memoryValidation.validation_status === 'PASS' && ingested === known && ready > 0) {
    coverage_confidence = 'HIGH';
  }

  return {
    coverage_audit_status: 'COMPLETED',
    coverage_confidence,
    known_plenra_chats_count: known,
    ingested_chats_count: ingested,
    unprocessed_chats_count: unprocessed,
    partially_processed_chats_count: partially,
    missed_important_chats: missedImportant,
    immature_but_important_chats: immatureImportant,
    ready_for_codex_chats: ready,
    coverage_gaps: unprocessed > 0 ? ['unprocessed_chats'] : [],
    next_required_action: unprocessed > 0 ? 'SCAN_UNPROCESSED_CHATS' : 'NONE',
    manual_user_prioritization_required: missedImportant.length > 0 || immatureImportant.length > 0
  };
}

module.exports = {
  auditCoverage
};