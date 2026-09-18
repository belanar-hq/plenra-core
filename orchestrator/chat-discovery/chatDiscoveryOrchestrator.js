const { scanChatManifest } = require('./scanning/chatDiscoveryScanner');
const { upsertChatRecord } = require('./indexing/chatIndexRegistry');
const { extractOperationalArtifacts, buildArtifactRecord } = require('./extraction/artifactExtractionEngine');
const { scoreChatMaturity, scoreArtifactMaturity } = require('./maturity/maturityScoringEngine');
const { preserveArtifactToCanon } = require('./preservation/canonPreservationManager');
const { appendMemoryEvent } = require('../memory/events/memoryEventStore');
const { updateDependencyGraph } = require('./dependencies/chatDependencyMapper');
const { auditCoverage } = require('./coverage/coverageAuditEngine');
const fs = require('fs');
const path = require('path');

function runChatDiscoveryCycle(rootPath, chatManifest) {
  try {
    // 1. Scan chat manifest
    const scannedChats = scanChatManifest(chatManifest);

    // 2. Upsert chat registry records
    const updatedChats = [];
    for (const chat of scannedChats) {
      const updated = upsertChatRecord('', chat);
      updatedChats.push(updated);
    }

    // 3. Extract operational artifacts
    const allArtifacts = [];
    for (const chat of scannedChats) {
      const extracted = extractOperationalArtifacts(chat);
      const artifacts = extracted.map(e => buildArtifactRecord(e, chat.source_chat_id));
      allArtifacts.push(...artifacts);
    }

    // 4. Score maturity
    const maturedArtifacts = allArtifacts.map(a => ({
      ...a,
      ...scoreArtifactMaturity(a)
    }));

    // 5. Preserve READY_FOR_INGESTION or READY_FOR_CODEX artifacts
    const preservable = maturedArtifacts.filter(a => a.maturity_status === 'READY_FOR_INGESTION' || a.maturity_status === 'READY_FOR_CODEX');
    const preservationResults = [];
    for (const artifact of preservable) {
      const result = preserveArtifactToCanon(rootPath, artifact);
      preservationResults.push(result);
      if (result.result === 'BLOCK') {
        return { result: 'BLOCK', reason: 'Preservation failed', details: result };
      }
    }

    // 6. Emit memory events
    for (const artifact of preservable) {
      const memoryEvent = {
        event_id: `discovery_${artifact.artifact_id}_${Date.now()}`,
        schema_version: 'memory_event_v1',
        idempotency_key: `discovery_${artifact.artifact_id}`,
        memory_id: `mem_${artifact.artifact_id}`,
        memory_type: 'CONTEXT_MEMORY',
        memory_status: 'ACTIVE',
        source_type: 'ARTIFACT',
        source_ref: artifact.artifact_id,
        reason_codes: ['chat_discovery'],
        created_at: Date.now(),
        updated_at: Date.now(),
        lineage: [],
        replay: {},
        no_pii: true
      };
      const appendResult = appendMemoryEvent('', memoryEvent);
      if (appendResult.result === 'BLOCK') {
        return { result: 'HOLD', reason: 'Memory event emission failed' };
      }
    }

    // 7. Update dependency graph
    for (const artifact of maturedArtifacts) {
      updateDependencyGraph(rootPath, artifact);
    }

    // 8. Add READY_FOR_CODEX to codexQueue
    const queuePath = path.join(rootPath, 'orchestrator', 'scheduler', 'codexQueue.json');
    let queue = [];
    if (fs.existsSync(queuePath)) {
      queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    }
    const readyForCodex = maturedArtifacts.filter(a => a.maturity_status === 'READY_FOR_CODEX');
    queue.push(...readyForCodex.map(a => ({ artifact_id: a.artifact_id, queued_at: Date.now() })));
    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));

    // 9. Run coverage audit
    const coverage = auditCoverage(rootPath);

    // 10. Return result
    return {
      result: 'SUCCESS',
      chats_processed: updatedChats.length,
      artifacts_extracted: allArtifacts.length,
      artifacts_preserved: preservationResults.length,
      coverage_audit: coverage
    };
  } catch (error) {
    return { result: 'BLOCK', reason: error.message };
  }
}

module.exports = {
  runChatDiscoveryCycle
};