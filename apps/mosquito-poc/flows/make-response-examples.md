# Make.com Response Examples

Example responses for mosquito-poc intake webhook integration.

## Successful Response

When the intake payload is valid and the lead is processed successfully:

```json
{
  "lead_id": "427ba324-37ce-4af6-8950-73ad933fe780",
  "lead_score": 90,
  "status": "HIGH_PRIORITY",
  "next_action": "BOOKING_PENDING"
}
```

Use this response to route the lead into booking automation.

## HOLD / REVIEW Response

When the intake payload is valid but score places the lead in review:

```json
{
  "lead_id": "d7fbc134-0a1d-4f3c-b4b6-cc7a2f15d8a1",
  "lead_score": 45,
  "status": "REVIEW",
  "next_action": "MANUAL_REVIEW"
}
```

Use this response to send a Hebrew review acknowledgement and add the lead to the review queue.

## Validation Failure

When required fields are missing or invalid:

```json
{ "error": "Invalid payload: missing answers" }
```

- HTTP status: `400`
- Do not retry
- Send a WhatsApp validation message only if the user can correct the payload

## Duplicate Handling

If the same idempotency key or `message_id` is received again, the local runtime returns the original response.

Request header:

```
X-Idempotency-Key: high-001
```

Response:

```json
{
  "lead_id": "427ba324-37ce-4af6-8950-73ad933fe780",
  "lead_score": 90,
  "status": "HIGH_PRIORITY",
  "next_action": "BOOKING_PENDING"
}
```

This ensures duplicate WhatsApp events do not create multiple leads.

## Retry Logic

For transient server errors, retry the request with backoff.

Example transient failure response:

```json
{ "error": "Internal server error" }
```

- HTTP status: `500`
- Retry up to `2` times
- Use increasing delay between attempts
- If retry still fails, log the failure and stop the scenario
