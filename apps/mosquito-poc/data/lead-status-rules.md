# Lead Status Rules

Defines the lifecycle states for mosquito treatment leads.

## Status Definitions

| Status | Description | Trigger | Next Step |
|--------|-------------|---------|-----------|
| **NEW** | Lead just captured from QR code or WhatsApp opt-in | Initial capture | Decision gate review |
| **REVIEW** | Lead under qualification assessment | Scoring logic triggered | Move to HIGH_PRIORITY or disqualify |
| **HIGH_PRIORITY** | Strong intent signals, qualifies for immediate outreach | Score ≥ threshold + behavior signals | Initiate booking flow |
| **BOOKING_PENDING** | Scheduled for installation appointment | Booking confirmed | Installer executes, move to INSTALLED |
| **INSTALLED** | Traps deployed and recorded | Installation completed | Schedule renewal tracking |
| **FOLLOWUP** | Active customer in renewal cycle | Post-install maintenance period | Monitor next_service_date |
| **RENEWAL_DUE** | Service renewal due within 7 days | Renewal schedule trigger | Send renewal reminder, capture renewal_id |

## State Transitions

```
NEW → REVIEW → HIGH_PRIORITY → BOOKING_PENDING → INSTALLED → FOLLOWUP ↔ RENEWAL_DUE
                    ↓
                (Disqualified/Archived)
```

## Rules

- Leads can move backward (e.g., HIGH_PRIORITY → REVIEW if scoring drops)
- FOLLOWUP and RENEWAL_DUE may cycle multiple times over customer lifetime
- Status changes logged with timestamp for audit trail
