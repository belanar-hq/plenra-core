# Automation Events

Detailed triggers, actions, retries, and failure handling for all events.

## Event: qr_scanned

**Trigger:** QR code scan via URL redirect
**Actions:**
- Log scan event with timestamp, source_id
- Check for existing lead (prevent duplicates)
- If new → create lead record with status=NEW
**Retries:** None (fire-and-forget)
**Failure Handling:** Log failed scans for analysis
**Idempotency:** Source_id + timestamp prevents duplicates

## Event: whatsapp_opened

**Trigger:** WhatsApp API message received
**Actions:**
- Update lead status to NEW
- Send initial greeting message
- Start intake timer (60 minutes)
**Retries:** 3 attempts with 5-minute intervals
**Failure Handling:** Fallback to SMS if WhatsApp fails
**Idempotency:** Lead_id prevents duplicate opens

## Event: intake_started

**Trigger:** First question sent successfully
**Actions:**
- Set intake start timestamp
- Send question 1
- Initialize answer collection
**Retries:** 2 attempts per question
**Failure Handling:** Restart intake if >3 failures
**Idempotency:** Lead_id + question_number

## Event: intake_completed

**Trigger:** All 5 answers collected
**Actions:**
- Validate answer format
- Store answers in lead record
- Trigger scoring calculation
**Retries:** None (manual restart if incomplete)
**Failure Handling:** Flag incomplete intakes for review
**Idempotency:** Lead_id prevents duplicate completions

## Event: lead_scored

**Trigger:** Scoring algorithm completes
**Actions:**
- Update lead_score field
- Set new status based on score bands
- Route to appropriate automation path
**Retries:** 1 retry on calculation error
**Failure Handling:** Manual scoring override
**Idempotency:** Lead_id prevents duplicate scoring

## Event: booking_requested

**Trigger:** HIGH_PRIORITY status set
**Actions:**
- Send booking offer message
- Set status to BOOKING_PENDING
- Start payment timer (7 days)
**Retries:** 2 attempts for message delivery
**Failure Handling:** Move to REVIEW if delivery fails
**Idempotency:** Lead_id prevents duplicate offers

## Event: payment_received

**Trigger:** Payment gateway webhook
**Actions:**
- Update payment fields
- Set status to PAID
- Send payment confirmation
- Trigger scheduling flow
**Retries:** Webhook retry from gateway
**Failure Handling:** Manual payment verification
**Idempotency:** Transaction_id prevents duplicates

## Event: install_confirmed

**Trigger:** Scheduling selection received
**Actions:**
- Book technician slot
- Send confirmation message
- Update calendar
- Set status to INSTALL_CONFIRMED
**Retries:** 3 attempts for calendar booking
**Failure Handling:** Manual slot assignment
**Idempotency:** Lead_id + install_date

## Event: followup_sent

**Trigger:** Time-based (30 days post-install)
**Actions:**
- Send service check message
- Update followup record
- Set status to FOLLOWUP
**Retries:** 2 attempts with 24h delay
**Failure Handling:** Log missed followups
**Idempotency:** Lead_id + followup_type

## Event: renewal_due

**Trigger:** Date calculation (25 days post-install)
**Actions:**
- Send renewal reminder
- Set status to RENEWAL_DUE
- Start renewal timer (7 days)
**Retries:** 3 attempts over 7 days
**Failure Handling:** Move to CLOSED if no response
**Idempotency:** Lead_id + renewal_period

## General Failure Handling

- **Webhook Timeouts** — 30-second timeout, retry after 5 minutes
- **API Rate Limits** — Exponential backoff (1m, 5m, 15m)
- **Data Validation** — Reject invalid payloads, log errors
- **Circuit Breaker** — Pause automation after 5 consecutive failures
- **Manual Override** — Admin dashboard for stuck leads