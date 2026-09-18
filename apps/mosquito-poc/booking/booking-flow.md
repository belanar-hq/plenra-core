# Booking Flow

Operational flow for mosquito trap installation booking after lead qualification.

## Flow Overview

1. **Trigger** — HIGH_PRIORITY lead status
2. **Offer** — Send installation offer via WhatsApp
3. **Payment** — Require payment before scheduling
4. **Confirmation** — Payment received → INSTALL_CONFIRMED
5. **Scheduling** — Customer selects time slot
6. **Execution** — Technician visit for trap installation

## Trigger Conditions

- lead_score ≥ 61
- status = HIGH_PRIORITY
- No prior booking attempts

## Business Rules

- **No Free Inspection** — Payment required upfront
- **Single Visit Only** — One technician visit for installation
- **Payment First** — No scheduling without payment confirmation
- **Geographic Limit** — Petah Tikva only initially

## Status Transitions

- HIGH_PRIORITY → BOOKING_PENDING (offer sent)
- BOOKING_PENDING → PAID (payment received)
- PAID → INSTALL_CONFIRMED (scheduling confirmed)

## WhatsApp Integration

- Send offer with pricing and payment options
- Confirm payment receipt
- Send scheduling options
- Confirm appointment

## Make.com Ready

- Webhook triggers on status change
- WhatsApp message templates in flows/whatsapp-message-templates.md
- Payment gateway integrations (future)