# Lead Routing Logic

Deterministic routing rules based on lead status and score.

## Routing Rules

### LOW Score (0-30)
**Action:** Followup only
- Send educational content about mosquito prevention
- No booking offer
- Archive after 7 days
- Status: REVIEW → CLOSED

### REVIEW Score (31-60)
**Action:** Manual review queue
- Flag for human review
- Send nurture sequence (3 messages over 7 days)
- If engagement increases → re-score
- If no response → archive
- Status: REVIEW (hold)

### HIGH_PRIORITY Score (61-100+)
**Action:** Booking automation
- Immediate booking offer
- Payment required before scheduling
- Fast-track to installation
- Status: HIGH_PRIORITY → BOOKING_PENDING

### FAILED_PAYMENT
**Action:** Retry flow
- Send 2 payment reminder messages (24h, 72h)
- Hold booking slot for 48 hours
- After 3 failures → reset to HIGH_PRIORITY
- After 7 days → CLOSED

### RENEWAL_DUE
**Action:** Renewal sequence
- Send renewal reminder (5 days before due date)
- Offer renewal payment
- If paid → extend service
- If declined → followup sequence
- Status: RENEWAL_DUE → FOLLOWUP (renewed) or CLOSED

## Routing Implementation

### Make.com Router Module

```
Input: lead_scored webhook
Condition: lead_score
Routes:
  - 0-30 → Scenario: LOW_Followup
  - 31-60 → Scenario: REVIEW_Queue
  - 61+ → Scenario: HIGH_PRIORITY_Booking
```

### Queue Management

- **REVIEW Queue** — Human review dashboard
- **FAILED_PAYMENT Queue** — Automated retry sequences
- **RENEWAL_DUE Queue** — Renewal campaign triggers

## Business Rules

- **No Status Skipping** — Must follow state machine transitions
- **Payment Gate** — No scheduling without payment
- **Single Technician Visit** — Installation only
- **Geographic Limits** — Petah Tikva only initially
- **Time Windows** — Evening scheduling preference

## Failure Handling

- **Timeout** — 60 minutes for intake completion
- **Invalid Input** — Retry question with clarification
- **Webhook Failure** — Retry 3 times with exponential backoff
- **Payment Timeout** — 7 days for payment completion