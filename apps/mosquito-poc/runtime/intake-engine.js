const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Scoring logic from lead-scoring.md
function calculateScore(fields) {
  let score = 0;

  // Mosquito Frequency
  const freq = fields.mosquito_frequency;
  if (freq === 'daily') score += 30;
  else if (freq === 'multiple_week') score += 20;
  else if (freq === 'weekly') score += 10;

  // Has Yard
  if (fields.has_yard) score += 25;

  // Has Water Source
  if (fields.has_water_source) score += 20;

  // Bite Location
  const locations = fields.bite_location;
  if (locations.includes('whole_body')) score += 15;
  else if (locations.length > 1) score += 10;

  // Neighborhood Reports (household complaints)
  const reports = fields.neighborhood_reports;
  if (reports === 'multiple') score += 15;
  else if (reports === 'single') score += 5;

  // Activity Pattern (assume evening if frequency indicates)
  if (freq === 'daily' || freq === 'multiple_week') score += 10;

  // Messages Count (assume based on reports)
  if (reports === 'multiple') score += 10;

  return Math.min(score, 120); // Cap at 120
}

// Status assignment
function assignStatus(score) {
  if (score >= 61) return 'HIGH_PRIORITY';
  else if (score >= 31) return 'REVIEW';
  else return 'LOW';
}

// Next action based on status
function getNextAction(status) {
  if (status === 'HIGH_PRIORITY') return 'BOOKING_PENDING';
  else if (status === 'REVIEW') return 'MANUAL_REVIEW';
  else return 'FOLLOWUP_ONLY';
}

// Parse WhatsApp answers into fields
function parseAnswers(answers) {
  // answers is object with q1, q2, q3, q4, q5 as strings (comma-separated for multi)
  const fields = {};

  // Q1: bites_location (multi)
  fields.bite_location = answers.q1 ? answers.q1.split(',').map(s => s.trim()) : [];

  // Q2 & Q3: mosquito_frequency (combine)
  const time = answers.q2;
  const duration = answers.q3;
  if (time === '5' || duration === '1') fields.mosquito_frequency = 'daily';
  else if (time === '4' || duration === '2') fields.mosquito_frequency = 'multiple_week';
  else fields.mosquito_frequency = 'weekly';

  // Q4: neighborhood_reports
  const count = answers.q4;
  if (count === '4') fields.neighborhood_reports = 'multiple';
  else fields.neighborhood_reports = 'single';

  // Q5: has_yard, has_water_source (multi)
  const yardOpts = answers.q5 ? answers.q5.split(',').map(s => s.trim()) : [];
  fields.has_yard = yardOpts.some(opt => ['1','2','3'].includes(opt)); // 1,2,3 are yard related
  fields.has_water_source = yardOpts.includes('4'); // 4 is irrigation

  return fields;
}

// Main processing function
function processLead(payload) {
  // Parse answers
  const fields = parseAnswers(payload.answers);

  // Calculate score
  const lead_score = calculateScore(fields);

  // Assign status
  const status = assignStatus(lead_score);

  // Generate IDs
  const lead_id = uuidv4();
  const timestamp = new Date().toISOString();

  // Next action
  const next_action = getNextAction(status);

  // Prepare CSV row
  const row = [
    lead_id,
    timestamp,
    payload.source_id || '',
    payload.city || 'Petah Tikva',
    payload.area || '',
    payload.messages_count || 0,
    fields.mosquito_frequency,
    fields.bite_location.join(';'), // Multi as semicolon separated
    fields.has_yard ? 1 : 0,
    fields.has_water_source ? 1 : 0,
    payload.free_text || '',
    lead_score,
    status,
    next_action
  ].map(field => `"${field}"`).join(',');

  // Append to CSV
  const csvPath = path.join(__dirname, '..', 'data', 'leads.csv');
  fs.appendFileSync(csvPath, '\n' + row);

  // Return result
  return {
    lead_id,
    timestamp,
    status,
    lead_score,
    next_action,
    fields
  };
}

module.exports = { processLead };