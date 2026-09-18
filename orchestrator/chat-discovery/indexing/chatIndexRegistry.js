const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CHAT_REGISTRY_PATH = path.join(__dirname, '..', '..', 'registry', 'chatRegistry.json');

function ensureRegistry() {
  if (!fs.existsSync(CHAT_REGISTRY_PATH)) {
    fs.writeFileSync(CHAT_REGISTRY_PATH, JSON.stringify({ chats: [] }, null, 2));
  }
}

function readRegistryFile() {
  ensureRegistry();
  const raw = JSON.parse(fs.readFileSync(CHAT_REGISTRY_PATH, 'utf8'));
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && Array.isArray(raw.chats)) {
    return raw.chats;
  }
  return [];
}

function writeRegistryFile(records) {
  fs.writeFileSync(CHAT_REGISTRY_PATH, JSON.stringify({ chats: records }, null, 2));
}

function createSourceChatId(chat) {
  if (chat.source_chat_id) {
    return chat.source_chat_id;
  }
  const input = `${chat.source_chat_label || ''}-${chat.chat_location || ''}`;
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

function normalizeChatRecord(chat) {
  const now = Date.now();
  return {
    source_chat_id: createSourceChatId(chat),
    source_chat_label: chat.source_chat_label || '',
    chat_location: chat.chat_location || 'PROJECT',
    discovered_at: chat.discovered_at || now,
    last_scanned_at: chat.last_scanned_at || now,
    artifact_count: chat.artifact_count || 0,
    maturity_status: chat.maturity_status || 'NEEDS_STRUCTURE',
    coverage_status: chat.coverage_status || 'UNSCANNED',
    codex_readiness: chat.codex_readiness || 'NOT_READY',
    external_backup_status: chat.external_backup_status || 'UNKNOWN',
    dependency_status: chat.dependency_status || 'UNKNOWN',
    scheduler_status: chat.scheduler_status || 'NOT_SCHEDULED'
  };
}

function upsertChatRecord(registryPath, chat) {
  const registry = readRegistryFile();
  const normalized = normalizeChatRecord(chat);
  const existingIndex = registry.findIndex(r => r.source_chat_id === normalized.source_chat_id);

  if (existingIndex >= 0) {
    const existing = registry[existingIndex];
    registry[existingIndex] = {
      ...existing,
      ...normalized,
      discovered_at: existing.discovered_at,
      last_scanned_at: Date.now()
    };
  } else {
    registry.push(normalized);
  }

  writeRegistryFile(registry);
  return registry.find(r => r.source_chat_id === normalized.source_chat_id);
}

function listChatRecords(registryPath) {
  return readRegistryFile();
}

function findChatById(registryPath, source_chat_id) {
  const registry = listChatRecords(registryPath);
  return registry.find(r => r.source_chat_id === source_chat_id);
}

module.exports = {
  createSourceChatId,
  normalizeChatRecord,
  upsertChatRecord,
  listChatRecords,
  findChatById
};