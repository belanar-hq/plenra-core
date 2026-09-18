# Runtime Test

Test the intake-engine.js with sample payload and API server.

## Prerequisites

- Node.js installed
- Dependencies: `npm install uuid express cors`

## Setup

```bash
cd apps/mosquito-poc/runtime
npm init -y
npm install uuid express cors
```

## Test Intake Engine Directly

```bash
node -e "
const {processLead} = require('./intake-engine.js');
const payload = require('./sample-payload.json');
const result = processLead(payload);
console.log('Result:', JSON.stringify(result, null, 2));
"
```

## Start API Server

```bash
node server.js
```

Server will run on http://localhost:3000

## Test API Endpoints

### Health Check

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

### Intake Processing

```bash
curl -X POST http://localhost:3000/intake \
  -H "Content-Type: application/json" \
  -d @sample-payload.json
```

Expected:
```json
{
  "lead_id": "some-uuid",
  "lead_score": 90,
  "status": "HIGH_PRIORITY",
  "next_action": "BOOKING_PENDING"
}
```

## Expected Output (Direct Test)

```
Result: {
  "lead_id": "some-uuid",
  "timestamp": "2026-05-07T12:00:00.000Z",
  "status": "HIGH_PRIORITY",
  "lead_score": 90,
  "next_action": "BOOKING_PENDING",
  "fields": {
    "bite_location": ["1", "2", "3"],
    "mosquito_frequency": "multiple_week",
    "neighborhood_reports": "single",
    "has_yard": true,
    "has_water_source": true
  }
}
```

## Verify CSV

Check `../data/leads.csv` for new row appended after each test.

## Sample Payload Explanation

- **q1**: "1,2,3" → bites_location: legs, arms, back
- **q2**: "4" → evening
- **q3**: "2" → multiple days
- **q4**: "2" → 2-3 people
- **q5**: "1,4" → big yard + irrigation

Score: 20 (freq) + 25 (yard) + 20 (water) + 10 (multi locations) + 5 (single reports) + 10 (evening) = 90 → HIGH_PRIORITY