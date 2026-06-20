# PEST_CONTROL_WHATSAPP_EVIDENCE_BATCH_001 Evidence Registry

Status: internal-only candidate artifact.

## Counts

- evidence_count: 28
- outcome_count: 26
- opportunity_count: 2

## Blocked Uses

- no customer-facing copy
- no public-facing claims
- no marketing assets
- no ads
- no WhatsApp outreach
- no automation
- no CRM or funnel assets
- no canon mutation
- no architecture changes
- no screenshot analysis
- no private raw WhatsApp image inspection
- no conversion of pipeline into outcome

## Privacy And Redaction Rules

Redact names, phone numbers, addresses, apartment numbers, building identifiers, committee contacts, family relationships when identifying, children/minor context, kindergarten/institution names, access codes, key locations, alarm details, bank details, payment screenshots, Bit/PayBox details, invoice/receipt links, invoice/receipt numbers, photos/videos revealing property, and voice notes unless transcribed and redacted.

Every evidence row requires redaction. Asset generation is not allowed from any evidence row.

## Use Constraints

Visible screenshot evidence and operator-confirmed outcome remain separate where relevant. Invoice or receipt visibility is not treated as payment unless payment_received is explicitly true in the seed data. Review requests are not counted as received reviews. Referrals, additional apartments, buildings, family units, and committee referrals remain pipeline until separately closed, performed, and paid.

## Next Allowed Task After PASS

ORCH_TO_CODEX_PEST_AUDIT_DIMENSIONS_AND_SCORING_002
