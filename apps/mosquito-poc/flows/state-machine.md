# State Machine

Deterministic status transitions for mosquito-poc leads.

## Valid States

- NEW
- REVIEW
- HIGH_PRIORITY
- BOOKING_PENDING
- PAID
- INSTALL_CONFIRMED
- INSTALLED
- FOLLOWUP
- RENEWAL_DUE
- CLOSED

## Transition Rules

### NEW
**Allowed Next:** REVIEW
**Trigger:** WhatsApp intake started
**Condition:** Valid source attribution

### REVIEW
**Allowed Next:** HIGH_PRIORITY, CLOSED
**Trigger:** Intake completed + scoring
**Condition:** lead_score determines path

### HIGH_PRIORITY
**Allowed Next:** BOOKING_PENDING
**Trigger:** Score ≥61
**Condition:** Automatic

### BOOKING_PENDING
**Allowed Next:** PAID, HIGH_PRIORITY, CLOSED
**Trigger:** Payment received or failed
**Condition:** Payment success/failure

### PAID
**Allowed Next:** INSTALL_CONFIRMED
**Trigger:** Payment confirmation
**Condition:** Valid payment

### INSTALL_CONFIRMED
**Allowed Next:** INSTALLED
**Trigger:** Installation completed
**Condition:** Technician confirmation

### INSTALLED
**Allowed Next:** FOLLOWUP
**Trigger:** Installation record created
**Condition:** Automatic (30 days)

### FOLLOWUP
**Allowed Next:** RENEWAL_DUE, CLOSED
**Trigger:** Renewal due date approaching
**Condition:** Time-based

### RENEWAL_DUE
**Allowed Next:** FOLLOWUP, CLOSED
**Trigger:** Renewal payment or expiration
**Condition:** Payment received or timeout

### CLOSED
**Allowed Next:** None
**Trigger:** Archive conditions met
**Condition:** No further action required

## Invalid Transitions

- No skipping states
- No backward transitions except BOOKING_PENDING → HIGH_PRIORITY (failed payment)
- No free-text status changes

## State Validation

- **Entry Conditions** — Must meet prerequisites
- **Exit Conditions** — Must complete required actions
- **Timeout Handling** — Automatic progression on delays
- **Error Recovery** — Reset to previous valid state

## Make.com Implementation

```
Router Module:
Input: current_status + trigger_event
Output: next_status
Rules:
  - NEW + intake_started → REVIEW
  - REVIEW + lead_scored → HIGH_PRIORITY (if score ≥61)
  - HIGH_PRIORITY + booking_requested → BOOKING_PENDING
  - BOOKING_PENDING + payment_received → PAID
  - PAID + scheduling_selected → INSTALL_CONFIRMED
  - INSTALL_CONFIRMED + install_completed → INSTALLED
  - INSTALLED + 30_days → FOLLOWUP
  - FOLLOWUP + 25_days → RENEWAL_DUE
  - Any + archive_condition → CLOSED
```