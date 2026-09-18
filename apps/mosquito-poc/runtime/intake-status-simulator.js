const fs = require('fs');
const path = require('path');

const payloadPath = path.join(__dirname, 'webhook-test-payloads.json');
const payloads = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
const endpoint = 'http://localhost:3000/intake';

async function sendPayload(payload) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': payload.message_id
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let body;

    try {
      body = JSON.parse(text);
    } catch (error) {
      body = { error: 'Invalid JSON response', raw: text };
    }

    return {
      caseName: payload.case,
      statusCode: response.status,
      ok: response.ok,
      body
    };
  } catch (error) {
    return {
      caseName: payload.case,
      statusCode: null,
      ok: false,
      body: { error: error.message }
    };
  }
}

async function run() {
  console.log('MOSQUITO POC WEBHOOK TEST SIMULATOR');
  for (const payload of payloads) {
    const result = await sendPayload(payload);
    console.log('-------------------------------------------');
    console.log(`Case: ${result.caseName}`);
    console.log(`HTTP Status: ${result.statusCode}`);

    if (result.ok && result.body) {
      console.log(`lead_id: ${result.body.lead_id}`);
      console.log(`lead_score: ${result.body.lead_score}`);
      console.log(`status: ${result.body.status}`);
      console.log(`next_action: ${result.body.next_action}`);
    } else {
      console.log('Error:', JSON.stringify(result.body));
    }
  }
}

run().catch((error) => {
  console.error('Simulator error:', error);
});
