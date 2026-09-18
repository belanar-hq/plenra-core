# Make Scenario Map

Complete operational flow for mosquito-poc automation in Make.com.

## Full Flow Sequence

1. **QR Scan** → User scans neighborhood QR code
2. **WhatsApp Open** → Direct WhatsApp open with pre-filled message
3. **Intake Questions** → 5 structured questions via WhatsApp
4. **Lead Creation** → New lead record with source attribution
5. **Score Calculation** → Apply scoring logic to answers
6. **Status Assignment** → Set status based on score
7. **HIGH_PRIORITY Detection** → Trigger booking if score ≥61
8. **Booking Trigger** → Send installation offer
9. **Payment Trigger** → Require payment before scheduling
10. **Install Scheduling** → Customer selects time slot
11. **Followup** → Post-install service monitoring
12. **Renewal Reminder** → Automated renewal notifications

## Make.com Scenario Structure

### Scenario 1: Lead Capture & Intake
- **Trigger:** WhatsApp webhook (qr_scanned, whatsapp_opened)
- **Actions:** Create lead, send intake questions, collect answers
- **Output:** intake_completed webhook

### Scenario 2: Lead Qualification
- **Trigger:** intake_completed webhook
- **Actions:** Calculate score, assign status, route lead
- **Output:** lead_scored webhook

### Scenario 3: Booking Automation
- **Trigger:** HIGH_PRIORITY status
- **Actions:** Send booking offer, monitor payment
- **Output:** booking_requested, payment_received webhooks

### Scenario 4: Installation Management
- **Trigger:** payment_received webhook
- **Actions:** Schedule install, send confirmations
- **Output:** install_confirmed webhook

### Scenario 5: Followup & Renewal
- **Trigger:** install_confirmed webhook + time delays
- **Actions:** Send followup messages, renewal reminders
- **Output:** followup_sent, renewal_due webhooks

## Data Flow

```
QR Scan (campaigns/)
    ↓
WhatsApp Intake (flows/)
    ↓
Lead Scoring (flows/)
    ↓
Booking Flow (booking/)
    ↓
Payment Processing (booking/)
    ↓
Scheduling (booking/)
    ↓
Installation (followup/)
    ↓
Renewal Cycle (followup/)
```

## Integration Points

- **WhatsApp API** — Message sending/receiving
- **Payment Gateways** — Bit, Paybox, etc.
- **Calendar API** — Google Calendar for scheduling
- **Database** — Lead/install/renewal records
- **Analytics** — Campaign tracking dashboard