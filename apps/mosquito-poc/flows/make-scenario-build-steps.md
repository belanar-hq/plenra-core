# Make.com Scenario Build Steps

Step-by-step build for mosquito-poc WhatsApp intake automation.

## 1. Webhook Trigger

- Add a Make.com Webhook module
- Configure inbound webhook URL
- Accept JSON payload from WhatsApp intake flow

## 2. Receive WhatsApp Message

- Capture raw WhatsApp message event
- Extract customer phone, source_id, and message text
- Pass raw event into normalization stage

## 3. Normalize Message

- Map WhatsApp payload fields to internal fields
- Validate extracted values
- Convert WhatsApp texts to codes for `q1`–`q5`
- Remove any unsupported free-text diagnosis

## 4. Build Intake Payload

Construct JSON payload matching `POST /intake` contract:
- `source_id`
- `city`
- `area`
- `messages_count`
- `free_text`
- `answers` object with `q1`, `q2`, `q3`, `q4`, `q5`

Example:
```json
{
  "source_id": "PT-KIRYAT_ARIE-V1",
  "city": "Petah Tikva",
  "area": "Kiryat Arie",
  "messages_count": 5,
  "free_text": "יתושים בערב",
  "answers": {
    "q1": "1,2",
    "q2": "4",
    "q3": "2",
    "q4": "2",
    "q5": "1,4"
  }
}
```

## 5. HTTP POST to /intake

- Add HTTP module
- Method: `POST`
- URL: `http://localhost:3000/intake`
- Headers:
  - `Content-Type: application/json`
  - `X-Idempotency-Key: {{custom_idempotency_key}}`
- Body: payload from step 4

## 6. Read API Response

- Capture response JSON
- Required fields:
  - `lead_id`
  - `lead_score`
  - `status`
  - `next_action`

## 7. Route by Status

Add a router module with conditions:
- `status == LOW`
- `status == REVIEW`
- `status == HIGH_PRIORITY`

### `LOW`
- Send a WhatsApp low-priority response
- Log the lead as nurture-only

### `REVIEW`
- Send a WhatsApp review acknowledgement
- Add lead to manual review queue

### `HIGH_PRIORITY`
- Send booking offer response
- Trigger booking automation

## 8. Send WhatsApp Response

Use WhatsApp Business module to send customer messages.

### LOW response
```
תודה על הפרטים. כרגע זה נראה פחות דחוף.
נשלח לכם טיפים למניעת יתושים.
```

### REVIEW response
```
תודה! המידע נשלח לעיון.
נחזור אליכם בקרוב עם המשך.
```

### HIGH_PRIORITY response
```
תודה על המידע. זה נראה דחוף.
נשלח קישור לתשלום ותיאום התקנה.
```

## 9. Log Result

- Write scenario result to a Google Sheet or internal log
- Save `lead_id`, `source_id`, `status`, `lead_score`, timestamp
- Track final route taken

## 10. Error Handling

### Validation Failure
- If payload misses required fields, stop scenario
- Send WhatsApp error acknowledgement if possible

### API Error
- On 400: log and stop, do not retry
- On 500: retry HTTP request 2 times with delay
- On network failure: retry 3 times
- On duplicate idempotency key: treat as success if response exists

## Notes

- Do not use AI or free-text diagnosis in the scenario
- Keep all field mapping deterministic
- Use Hebrew only for customer-facing messages
- Use English only for internal fields and routing logic
