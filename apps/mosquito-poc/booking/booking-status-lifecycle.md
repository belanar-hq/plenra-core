# Booking Status Lifecycle

Complete status progression for mosquito trap booking and service lifecycle.

## Status Definitions

| Status | Description | Trigger | Next Status |
|--------|-------------|---------|-------------|
| **NEW** | Lead captured from QR/WhatsApp | Initial capture | REVIEW |
| **REVIEW** | Under qualification | Questions answered | HIGH_PRIORITY or archive |
| **HIGH_PRIORITY** | Qualified for booking | lead_score ≥ 61 | BOOKING_PENDING |
| **BOOKING_PENDING** | Installation offer sent | Offer message sent | PAID or HIGH_PRIORITY (failed) |
| **PAID** | Payment received | Payment confirmation | INSTALL_CONFIRMED |
| **INSTALL_CONFIRMED** | Appointment scheduled | Time slot selected | INSTALLED |
| **INSTALLED** | Traps deployed | Installation completed | FOLLOWUP |
| **FOLLOWUP** | Active service period | Post-install 30 days | RENEWAL_DUE |
| **RENEWAL_DUE** | Renewal reminder sent | 25 days post-install | FOLLOWUP (renewed) or CLOSED |
| **CLOSED** | Service ended | No renewal or cancellation | Archive |

## State Transitions

```
NEW → REVIEW → HIGH_PRIORITY → BOOKING_PENDING → PAID → INSTALL_CONFIRMED → INSTALLED → FOLLOWUP ↔ RENEWAL_DUE → CLOSED
                                                                                                      ↓
                                                                             (No renewal) → CLOSED
```

## Business Rules

- **Linear Progression** — No skipping statuses
- **Payment Gate** — Must reach PAID before INSTALL_CONFIRMED
- **Single Visit** — INSTALLED marks completion
- **Renewal Cycle** — FOLLOWUP/RENEWAL_DUE can repeat
- **Archive Threshold** — CLOSED after 90 days inactive

## Status Change Triggers

- **Automated** — Webhooks from WhatsApp, payment gateways, calendar
- **Manual** — Technician updates post-install
- **Time-based** — Renewal due dates, follow-up schedules

## Make.com Integration

- **Status Webhooks** — Trigger on each change
- **Conditional Logic** — Route based on current status
- **Data Updates** — Sync to leads.csv, installs.csv, renewals.csv
- **Notifications** — WhatsApp/SMS based on status