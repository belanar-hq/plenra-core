const express = require('express');
const cors = require('cors');
const { processLead } = require('./intake-engine');
const GoogleSheetsClient = require('./google-sheets-client');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const idempotencyStore = new Map();
const sheetsClient = new GoogleSheetsClient();

console.log('[Init] Google Sheets status:', sheetsClient.getStatus());

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Intake endpoint
app.post('/intake', (req, res) => {
  try {
    const payload = req.body;
    const idempotencyKey = req.header('x-idempotency-key') || payload.message_id || null;

    if (!payload || !payload.answers) {
      return res.status(400).json({
        error: 'Invalid payload: missing answers'
      });
    }

    if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
      return res.json(idempotencyStore.get(idempotencyKey));
    }

    const result = processLead(payload);
    const response = {
      lead_id: result.lead_id,
      lead_score: result.lead_score,
      status: result.status,
      next_action: result.next_action
    };

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, response);
    }

    // Async write to Google Sheets (non-blocking)
    if (sheetsClient.isConfigured) {
      sheetsClient.appendLead({
        lead_id: result.lead_id,
        timestamp: result.timestamp,
        source_id: payload.source_id || '',
        city: payload.city || 'Petah Tikva',
        area: payload.area || '',
        messages_count: payload.messages_count || 0,
        mosquito_frequency: result.fields.mosquito_frequency,
        bites_location: result.fields.bite_location.join(';'),
        has_yard: result.fields.has_yard ? 1 : 0,
        has_water_source: result.fields.has_water_source ? 1 : 0,
        free_text: payload.free_text || '',
        lead_score: result.lead_score,
        status: result.status,
        next_action: result.next_action
      }).catch((error) => {
        console.error('[Sheets] Non-blocking write failed:', error.message);
      });
    }

    res.json(response);

  } catch (error) {
    console.error('Intake processing error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Mosquito POC API server running on port ${PORT}`);
});