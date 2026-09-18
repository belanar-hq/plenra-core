# S01 — Artifact index schema

SOURCE_ID: S01
CHAT_TITLE: שימור מסמכים בגוגל דוקס
CHAT_URL: https://chatgpt.com/c/69b9138a-0024-8384-a357-4864c04875b6
PROJECT: Not established from this chat's header
DATE_OR_PERIOD: March 19, 2026 (visible date separator; year contextual)
SEARCH_TERM: PLENRA_ARTIFACT_INDEX_V1
SOURCE_CLASSIFICATION: RECOVERED_PARTIAL
SOURCE_PARITY: ORIGINAL_CONVERSATION_TEXT
LINEAGE: UNCERTAIN
ORIGINAL_TEXT_AVAILABLE: Yes, schema and workflow; populated index not retrieved
ATTACHMENTS_REFERENCED: Uploaded screenshots; Google Drive library search entry named PLENRA_ARTIFACT_INDEX_V1
DEPENDENCIES_REFERENCED: Make; Google Sheets; Google Docs; proposed migration to a database
RECOVERY_NOTES: The schema is original conversation evidence, not recovered spreadsheet rows. Generic persistence logic and March date alone do not establish Original Product ownership. No original artifact inventory references could be followed from this schema.

## Exact code-block text observed in conversation

```text
artifact_key
artifact_name
artifact_type
entity_id
version
storage_folder
status
reason_code
summary
doc_url
doc_id
created_at
updated_at
```

```text
Webhook
→ Router
→ Google Sheets: Search Rows
→ Filter: only if not exists
→ Google Docs: Create Document
→ Google Sheets: Add Row
```

Other exact values: sheet `artifacts`; search column `artifact_key`; search value `{{artifact_name}}`; limit `1`; filter label `only_if_not_exists`; condition `Total number of bundles = 0`. The conversation proposes initially using artifact_name as artifact_key, with a stronger idempotency key possible later. This last sentence is an analyst summary, not a verbatim source quote.
