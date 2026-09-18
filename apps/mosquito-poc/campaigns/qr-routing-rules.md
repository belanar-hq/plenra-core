# QR Routing Rules

Rules for QR code to WhatsApp lead capture routing.

## QR Code Behavior

- **Direct WhatsApp Open** — QR scan opens WhatsApp app/web
- **Pre-filled Message** — Auto-inserts neighborhood-specific greeting
- **Source Attribution** — Encodes campaign source in URL parameters

## URL Structure

```
https://wa.me/[PHONE_NUMBER]?text=[ENCODED_MESSAGE]&source=[SOURCE_ID]
```

**Example:**
```
https://wa.me/972501234567?text=שלום!%20ראיתי%20את%20הפלייר%20בשכונה&source=PT-KIRYAT_ARIE-V1
```

## Source Attribution

- **source Parameter** — Captured on WhatsApp open
- **Lead Enrichment** — Add source fields to lead record:
  - source_id
  - neighborhood
  - building_type
  - campaign_date
  - flyer_version

## Routing Logic

1. **QR Scan** — User scans code
2. **WhatsApp Opens** — Direct to business number
3. **Message Auto-filled** — Neighborhood greeting appears
4. **Webhook Trigger** — Make.com captures source parameter
5. **Lead Creation** — New lead with source attribution
6. **Status Set** — status = NEW, next_action = intake_flow

## Pre-filled Messages by Neighborhood

| Neighborhood | Pre-filled Message |
|--------------|-------------------|
| Kiryat Arie | שלום! ראיתי את הפלייר בקרית אריה |
| Kiryat Menahem | שלום! ראיתי את הפלייר בקרית מנחם |
| Hadar Yosef | שלום! ראיתי את הפלייר בהדר יוסף |
| Ramat Yosef | שלום! ראיתי את הפלייר ברמת יוסף |
| Shikun Vatikim | שלום! ראיתי את הפלייר בשיכון ותיקים |

## Error Handling

- **Invalid Source** — Default to generic message
- **WhatsApp Unavailable** — Fallback to web version
- **Parameter Missing** — Log as unknown source

## Make.com Integration

- **Webhook Endpoint** — Receives WhatsApp open events
- **Parameter Parsing** — Extract source_id from URL
- **Database Update** — Enrich lead with source data
- **Flow Trigger** — Start whatsapp-intake-flow.md