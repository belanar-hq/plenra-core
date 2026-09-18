# Campaign Tracking

Metrics and tracking infrastructure for QR campaign performance.

## Tracked Metrics

| Metric | Definition | Source |
|--------|------------|--------|
| **Scans** | QR code scans | WhatsApp open webhooks |
| **WhatsApp Opens** | Successful WhatsApp app opens | WhatsApp API events |
| **Completed Questionnaires** | Full 5-question intake completion | Flow completion webhooks |
| **HIGH_PRIORITY Rate** | % leads scoring ≥61 | Scoring calculation |
| **Paid Installs** | Completed payments + installations | Payment + install records |
| **Renewals by Source** | Follow-up service renewals | Renewal tracking |

## Tracking Structure

### Campaign Performance Table

| source_id | scans | opens | completions | high_priority | paid_installs | renewals | conversion_rate |
|-----------|-------|-------|-------------|---------------|---------------|----------|-----------------|
| PT-KIRYAT_ARIE-V1 | 150 | 120 | 95 | 45 | 32 | 28 | 21.3% |

### Daily Tracking

- **Scan Events** — Timestamped QR scans
- **Conversion Funnel** — NEW → REVIEW → HIGH_PRIORITY → PAID → INSTALLED
- **Time to Conversion** — Days from scan to install

## Attribution Rules

- **Source Persistence** — Source_id stored in lead record
- **Multi-Touch** — Last source wins for multi-scan leads
- **Organic Exclusion** — Only attribute campaign-sourced leads

## Reporting

### Dashboard Metrics

- **Scan Rate by Neighborhood** — Which areas most engaged
- **Flyer Version Performance** — A/B test results
- **Conversion by Building Type** — Houses vs apartments
- **Time-based Trends** — Peak scanning times

### Alerts

- **Low Engagement** — <50 scans per campaign
- **High Bounce** — <70% WhatsApp open rate
- **Poor Conversion** — <15% paid install rate

## Make.com Integration

- **Webhook Aggregation** — Collect events from WhatsApp, payment, install
- **Google Sheets Sync** — Real-time dashboard updates
- **Automated Reports** — Weekly campaign performance emails
- **A/B Testing Logic** — Rotate flyer versions based on performance