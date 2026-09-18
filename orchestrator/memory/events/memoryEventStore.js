const fs = require('fs');
const path = require('path');

const EVENTS_FILE = path.join(__dirname, '..', 'events', 'memoryEvents.json');

function ensureEventsFile() {
  if (!fs.existsSync(EVENTS_FILE)) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify([], null, 2));
  }
}

function appendMemoryEvent(storePath, event) {
  ensureEventsFile();
  const events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));

  // Check for duplicate idempotency_key
  const existing = events.find(e => e.idempotency_key === event.idempotency_key);
  if (existing) {
    // Check if payload changed
    if (JSON.stringify(existing) !== JSON.stringify(event)) {
      return { result: 'BLOCK', reason: 'Attempted overwrite with changed payload' };
    }
    return { result: 'idempotent_result', event: existing };
  }

  // Append new event
  events.push(event);
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
  return { result: 'APPENDED', event };
}

function listMemoryEvents(storePath) {
  ensureEventsFile();
  return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
}

function findMemoryEventById(storePath, event_id) {
  const events = listMemoryEvents(storePath);
  return events.find(e => e.event_id === event_id);
}

function findMemoryEventByIdempotencyKey(storePath, idempotency_key) {
  const events = listMemoryEvents(storePath);
  return events.find(e => e.idempotency_key === idempotency_key);
}

module.exports = {
  appendMemoryEvent,
  listMemoryEvents,
  findMemoryEventById,
  findMemoryEventByIdempotencyKey
};