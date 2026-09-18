# Webhook Structure

Standardized webhook payloads for all automation events.

## Payload Format

All webhooks use JSON format:

```json
{
  "event_id": "unique-event-identifier",
  "timestamp": "2026-05-07T10:30:00Z",
  "lead_id": "lead-12345",
  "source_id": "PT-KIRYAT_ARIE-V1",
  "status": "current-lead-status",
  "event_data": {
    // Event-specific fields
  }
}
```

## Required Events

### qr_scanned
**Trigger:** QR code scan detected
```json
{
  "event_id": "qr-12345",
  "timestamp": "2026-05-07T10:30:00Z",
  "lead_id": null,
  "source_id": "PT-KIRYAT_ARIE-V1",
  "status": null,
  "event_data": {
    "scan_timestamp": "2026-05-07T10:30:00Z",
    "user_agent": "iPhone Safari",
    "ip_address": "192.168.1.1"
  }
}
```

### whatsapp_opened
**Trigger:** WhatsApp successfully opened
```json
{
  "event_id": "wa-12345",
  "timestamp": "2026-05-07T10:31:00Z",
  "lead_id": "lead-12345",
  "source_id": "PT-KIRYAT_ARIE-V1",
  "status": "NEW",
  "event_data": {
    "message_prefilled": true,
    "neighborhood": "Kiryat Arie"
  }
}
```

### intake_started
**Trigger:** First intake question sent
```json
{
  "event_id": "intake-start-12345",
  "timestamp": "2026-05-07T10:32:00Z",
  "lead_id": "lead-12345",
  "source_id": "PT-KIRYAT_ARIE-V1",
  "status": "NEW",
  "event_data": {
    "question_count": 5,
    "timeout_minutes": 60
  }
}
```

### intake_completed
**Trigger:** All 5 questions answered
```json
{
  "event_id": "intake-complete-12345",
  "timestamp": "2026-05-07T10:45:00Z",
  "lead_id": "lead-12345",
  "source_id": "PT-KIRYAT_ARIE-V1",
  "status": "REVIEW",
  "event_data": {
    "answers": {
      "q1_bites_location": "1,2,3",
      "q2_mosquito_frequency": "3",
      "q3_duration": "2",
      "q4_household_count": "2",
      "q5_has_yard": "1,4"
    },
    "completion_time_minutes": 13
  }
}
```

### lead_scored
**Trigger:** Score calculation completed
```json
{
  "event_id": "score-12345",
  "timestamp": "2026-05-07T10:46:00Z",
  "lead_id": "lead-12345",
  "source_id": "PT-KIRYAT_ARIE-V1",
  "status": "HIGH_PRIORITY",
  "event_data": {
    "lead_score": 85,
    "scoring_factors": {
      "mosquito_frequency": 10,
      "has_yard": 25,
      "has_water_source": 20,
      "bites_location": 15,
      "household_complaints": 15
    }
  }
}
```

### booking_requested
**Trigger:** HIGH_PRIORITY lead enters booking
```json
{
  "event_id": "booking-req-12345",
  "timestamp": "2026-05-07T10:47:00Z",
  "lead_id": "lead-12345",
  "source_id": "PT-KIRYAT_ARIE-V1",
  "status": "BOOKING_PENDING",
  "event_data": {
    "offer_amount": 500,
    "payment_methods": ["Bit", "Paybox", "Credit Card"]
  }
}
```

### payment_received
**Trigger:** Payment confirmation
```json
{
  "event_id": "payment-12345",
  "timestamp": "2026-05-07T11:00:00Z",
  "lead_id": "lead-12345",
  "source_id": "PT-KIRYAT_ARIE-V1",
  "status": "PAID",
  "event_data": {
    "payment_amount": 500,
    "payment_method": "Bit",
    "payment_timestamp": "2026-05-07T11:00:00Z",
    "transaction_id": "bit-tx-789"
  }
}
```

### install_confirmed
**Trigger:** Installation scheduled
```json
{
  "event_id": "install-conf-12345",
  "timestamp": "2026-05-07T11:15:00Z",
  "lead_id": "lead-12345",
  "source_id": "PT-KIRYAT_ARIE-V1",
  "status": "INSTALL_CONFIRMED",
  "event_data": {
    "install_date": "2026-05-08T17:00:00Z",
    "technician_name": "David Cohen",
    "estimated_duration": 30
  }
}
```

### followup_sent
**Trigger:** Post-install followup message
```json
{
  "event_id": "followup-12345",
  "timestamp": "2026-06-07T10:00:00Z",
  "lead_id": "lead-12345",
  "source_id": "PT-KIRYAT_ARIE-V1",
  "status": "FOLLOWUP",
  "event_data": {
    "followup_type": "service_check",
    "days_post_install": 30,
    "message_template": "service_check"
  }
}
```

### renewal_due
**Trigger:** Renewal reminder sent
```json
{
  "event_id": "renewal-12345",
  "timestamp": "2026-06-02T10:00:00Z",
  "lead_id": "lead-12345",
  "source_id": "PT-KIRYAT_ARIE-V1",
  "status": "RENEWAL_DUE",
  "event_data": {
    "renewal_amount": 200,
    "next_service_date": "2026-06-07T17:00:00Z",
    "reminder_count": 1
  }
}
```

## Webhook Security

- **HMAC Signature** — Verify payload authenticity
- **Idempotency** — event_id prevents duplicate processing
- **Rate Limiting** — Max 100 events/minute per source