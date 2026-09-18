# QR Campaign Structure

Infrastructure for neighborhood-specific mosquito awareness campaigns.

## QR Code Generation

- **Unique per Neighborhood** — Separate QR for each Petah Tikva neighborhood
- **Version Variants** — Different QR for each flyer design
- **Dynamic URLs** — QR links to WhatsApp with source parameters

## Source Tracking Fields

| Field | Type | Description |
|-------|------|-------------|
| source_id | string | Unique QR identifier (e.g., PT-KIRYAT_ARIE-V1) |
| neighborhood | string | Petah Tikva neighborhood name |
| building_type | string | Apartment, House, Villa, Commercial |
| campaign_date | date | Campaign launch date |
| flyer_version | string | Flyer design variant (1-5) |

## Campaign Organization

- **Geographic Targeting** — One campaign per neighborhood
- **A/B Testing** — Different flyer versions per area
- **Seasonal Timing** — Launch during mosquito season peaks
- **Distribution** — Door-to-door, community boards, local shops

## QR URL Structure

```
https://wa.me/972XXXXXXXXX?text=שלום!%20ראיתי%20את%20הפלייר%20בשכונה&source=PT-KIRYAT_ARIE-V1
```

- **Phone Number** — WhatsApp business number
- **Pre-filled Message** — Neighborhood-specific greeting
- **Source Parameter** — Encoded source_id for attribution

## Make.com Integration

- **QR Generator** — Create QR codes with unique URLs
- **Webhook Receiver** — Capture source on WhatsApp open
- **Lead Enrichment** — Add source fields to lead record
- **Campaign Dashboard** — Real-time tracking by source