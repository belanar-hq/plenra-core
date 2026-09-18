# Scheduling Rules

Rules for coordinating mosquito trap installation appointments.

## Geographic Scope

- **Initial Area** — Petah Tikva only
- **Expansion Ready** — Configurable for additional cities

## Grouping Logic

- **Area Clustering** — Group installs within 2km radius
- **Daily Routes** — Optimize technician travel paths
- **Capacity Limits** — Max 8 installs per technician per day

## Time Preferences

- **Preferred Blocks** — 16:00-20:00 (evening hours)
- **Avoid** — Friday afternoons, holidays
- **Duration** — 30 minutes per install

## Scheduling Options

Customer receives:

1. Today (if before 14:00)
2. Tomorrow
3. This weekend
4. Next week

## Technician Assignment

- **Single Tech** — One technician per install
- **Backup** — Secondary technician for overflow
- **Training** — Certified for trap installation only

## Reschedule Logic

- **Customer Request** — Allow 1 reschedule within 7 days
- **Weather Issues** — Auto-reschedule rain >50% chance
- **Tech Unavailable** — System finds next available slot
- **Late Cancellation** — 24-hour notice required

## Failed Payment Handling

- **Payment Retry** — Hold slot for 48 hours
- **Slot Release** — Reopen slot after payment failure
- **Rebooking** — Customer must reinitiate booking flow

## Make.com Automation

- **Calendar Integration** — Google Calendar for technician schedules
- **SMS/WhatsApp Reminders** — 24h and 2h before appointment
- **Route Optimization** — Use mapping API for efficient routing
- **Capacity Alerts** — Notify when approaching daily limits