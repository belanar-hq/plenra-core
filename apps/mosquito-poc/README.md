# Mosquito POC

End-to-end mosquito trap subscription management system. Converts QR code interactions into qualified leads, orchestrates sales flow via WhatsApp, manages bookings, tracks installations, and automates service renewals.

## Folder Structure

| Folder | Responsibility |
|--------|-----------------|
| **qr** | QR code generation, tracking, and initial lead capture |
| **campaigns** | Campaign templates, messaging sequences, and audience targeting |
| **prompts** | AI/decision gate prompts for lead qualification and routing |
| **flows** | Workflow orchestration and decision logic |
| **booking** | Installation appointment scheduling and slot management |
| **followup** | Renewal reminders and service follow-up automation |
| **analytics** | Reporting, metrics, and conversion funnel analysis |
| **exports** | Data export pipelines for external integrations |
| **data** | Sample/seed datasets (leads, installs, renewals) |
| **docs** | Technical documentation and architecture |
| **assets** | Static resources (images, templates, configurations) |

## Lead Lifecycle

1. **QR Scan** — Customer scans QR code, triggers lead capture with timestamp and source
2. **Qualification** — Decision gate evaluates lead quality (messaging count, profile signals)
3. **WhatsApp Engagement** — Campaigns deliver personalized messages, collect free-text feedback
4. **Booking** — Qualified leads moved to booking flow for installation appointment scheduling
5. **Installation** — Installer records trap deployment, quantity, and status
6. **Renewal Tracking** — Post-install, system schedules and tracks follow-up service dates

## Data Flow

```
QR Code Scan
    ↓
[qr/] → Lead Capture (lead_id, timestamp, source, city)
    ↓
[flows/] → Lead Qualification (decision gate scoring)
    ↓
[campaigns/] → WhatsApp Engagement (messaging, feedback collection)
    ↓
[booking/] → Appointment Scheduling (convert → install slot)
    ↓
[followup/] + [flows/] → Installation Execution (trap_count, installer_name)
    ↓
[analytics/], [exports/] → Renewal Pipeline (track next_service_date, automate follow-up)
```

## Future Integrations

- **CRM Sync** — Push leads and install records to external CRM
- **Payment Gateway** — Invoice generation and subscription billing
- **SMS Fallback** — SMS-based lead engagement for non-WhatsApp users
- **Geo Analytics** — Territory heatmaps and optimizer routing for installers
- **IoT Trap Sensors** — Real-time trap activity monitoring and predictive maintenance alerts

## Quick Start

- Review [data/README.md](data/README.md) for sample data structure
- Decision gate logic: See [flows/](flows/) and [prompts/](prompts/)
- Campaign templates: [campaigns/](campaigns/)
