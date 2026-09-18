# S06 — Dataset, ledger, and migration references

SOURCE_ID: S06
CHAT_TITLE: Multiple search results, listed individually below
PROJECT: Not established
DATE_OR_PERIOD: February–August 2026 (search labels, not exact message dates)
SEARCH_TERM: PLENRA_LEDGER_V1; PLENRA_DECISION_DATASET_V1; MIG-001; MIG-011
SOURCE_CLASSIFICATION: REFERENCE_ONLY (dataset has partial schema text)
SOURCE_PARITY: REFERENCE_ONLY / ORIGINAL_CONVERSATION_TEXT search excerpts / DERIVED_SUMMARY as individually noted
LINEAGE: BELANAR_PRECURSOR for decision and migration excerpts; UNCERTAIN for unopened ledger
ORIGINAL_TEXT_AVAILABLE: Search excerpts only; no underlying ledger/dataset/registry rows retrieved
ATTACHMENTS_REFERENCED: Google Drive PLENRA_LEDGER_V1 (February 18); PLENRA_DECISION_DATASET_V1 (March 10)
DEPENDENCIES_REFERENCED: ORCHESTRATOR_KNOWLEDGE_MIGRATION_REGISTRY; Make; Sheets; decision_dataset_record
RECOVERY_NOTES: Search excerpts are preserved as excerpts, not complete source artifacts. Claims of empty datasets and completed migration are historical assistant summaries and were not independently verified against files.

## Ledger

Search found a library entry and setup connection instructions in `OpenAI קונה OpenClaw`, https://chatgpt.com/c/6993870d-f14c-8394-9229-7294cffde812. No records recovered. LINEAGE: UNCERTAIN. SOURCE_CLASSIFICATION: REFERENCE_ONLY.

## Dataset schema excerpt

Source: `הפקת דוחות עם Claude`, https://chatgpt.com/c/69ad4697-cbc8-8395-875c-5b79cce2b491. Search result labeled April 10. SOURCE_CLASSIFICATION: RECOVERED_PARTIAL; SOURCE_PARITY: ORIGINAL_CONVERSATION_TEXT (search excerpt only).

```text
decision_id
run_id
cluster_hash
diagnostic_id
decision_type
decision_action
decision_timestamp
outcome_type
impact_level
outcome_timestamp
record_status
```

Exact workflow excerpt: `Webhook → Parse JSON → Google Sheets Add Row`.

A second source, `מנועי גילוי תובנות`, https://chatgpt.com/c/69b32cae-6590-838e-82c5-1047bfb95396, search label March 13, proposes the same dataset name with tabs `sources_queue`, `raw_narratives`, `decision_records`, `normalized_decision_records`, `decision_patterns`. These are distinct proposed structures and are not silently reconciled here.

## Migration summary evidence

Source: `עבודה עם Google Docs ב-ChatGPT`, https://chatgpt.com/c/6a80cc8d-c5a4-83ed-b89b-67061c548f32, search label August 16.

Exact field-name excerpt:

```text
SOURCE_ORCHESTRATOR
SOURCE_ARTIFACT
DOMAIN
ORIGINAL_STATUS
PROPOSED_CLASS
CURRENT_CANON_MATCH
CONFLICT_STATE
PROVENANCE_ID
MIGRATION_STATUS
DESTINATION
```

The MIG-011 search excerpt describes MIG-001 through MIG-011 as UNREVIEWED. The MIG-001 search excerpt describes MIG-001 through MIG-016 as COMPLETE. These are different historical summary passages, not recovered row-level migration records. No status is promoted into verified current truth.

The same later summary says one Recovery Master described coaches/printables/emotional-commerce and another contained Quantum Federation, Value Lease, and speculative growth forecasts. This supports the need for version and lineage separation but is DERIVED_SUMMARY, not recovery of either master's complete source.

MIG-002 through MIG-010 were referenced as a range but not individually searched in this pass at the time this record was written.
