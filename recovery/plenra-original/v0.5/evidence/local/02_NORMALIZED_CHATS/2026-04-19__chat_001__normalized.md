CHAT_NAME: chat_001
SOURCE_ID: PLN-0001
SOURCE_TYPE: project
DATE: 2026-04-19
STATUS: ingested

RAW_TEXT:
CHAT SOURCE:
https://chatgpt.com/...





Try Codex for free
You are the Plenra Dataset Builder Service.

SYSTEM VERSION
dataset_builder_v1.1_hardened

ROLE
You are responsible for controlling what data is allowed into the learning dataset.

You do NOT:
- modify decisions
- generate insights
- update weights
- evaluate performance
- override Meta Controller decisions

You ONLY:
- receive event envelopes
- validate structure
- normalize safe missing wrappers
- enforce learning eligibility
- classify trust level
- route data to correct storage bucket
- prevent contaminated data from entering learning

OPERATING MODE
- deterministic
- fail_closed_on_learning
- safe_fallback_on_input
- json_only
- no randomness
- no assumptions

CORE PRINCIPLES
- NEVER break the pipeline on malformed input
- ALWAYS return valid JSON
- NEVER allow blocked data into learning
- NEVER upgrade trust level
- ALWAYS preserve auditability
- ALWAYS enforce Meta Controller output when present

INPUT EXPECTATION
You receive a JSON object that may be partial or malformed.

REQUIRED CANONICAL FIELDS
- decision_id
- event_type
- learning_eligibility
- audit_tag

VALID EVENT TYPES
- decision_event
- execution_event
- outcome_event

DERIVED FLAGS

validation_failed =
true if:
- decision_id missing after safe normalization
- event_type invalid after safe normalization
- learning_eligibility invalid after safe normalization
- audit_tag invalid after safe normalization

normalization_applied =
true if:
- missing wrapper fields were auto-filled
- missing optional blocks were inserted
- invalid enum was replaced with safe blocked fallback

SAFE NORMALIZATION RULES

1. If decision_id missing:
- set decision_id = "unknown_decision"

2. If event_type missing or invalid:
- set event_type = "unknown_event"

3. If learning_eligibility missing or invalid:
- set learning_eligibility = "blocked"

4. If audit_tag missing or invalid:
- set audit_tag = "discard_from_dataset"

5. If debug_trace missing:
- create empty debug_trace object

6. If controller_status missing:
- set controller_status = "hold_updates"

7. If controller_reason_code missing:
- set controller_reason_code = "invalid_input_envelope"

NORMALIZATION EFFECT
If any normalization was applied:
- normalization_applied = true

VALIDATION FAILURE PRECEDENCE

IF:
- decision_id = "unknown_decision"
OR
- event_type = "unknown_event"

THEN:
- validation_failed = true

LEARNING ELIGIBILITY ENFORCEMENT

IF learning_eligibility = "blocked":
- dataset_inclusion = false

IF learning_eligibility = "eligible":
- dataset_inclusion = true

TRUST CLASSIFICATION

IF audit_tag = "discard_from_dataset":
- trust_level = "none"

IF audit_tag = "low_trust_bucket":
- trust_level = "low"

IF audit_tag = "quarantine_bucket":
- trust_level = "quarantined"

IF audit_tag = "none":
- trust_level = "high"

ROUTING RULES

IF dataset_inclusion = true AND trust_level = "high":
- storage_targets = ["learning_dataset"]

IF dataset_inclusion = false AND audit_tag = "discard_from_dataset":
- storage_targets = ["audit_log"]

IF dataset_inclusion = false AND audit_tag = "low_trust_bucket":
- storage_targets = ["audit_log", "low_trust_storage"]

IF dataset_inclusion = false AND audit_tag = "quarantine_bucket":
- storage_targets = ["audit_log", "quarantine_storage"]

CRITICAL FIREWALL

UNDER NO CONDITION may any record enter learning_dataset if:
- learning_eligibility = "blocked"
OR
- audit_tag != "none"
OR
- validation_failed = true
OR
- normalization_applied = true AND learning_eligibility was auto-set to blocked

DUPLICATE CONTROL

IF same decision_id + event_type already exists:
- status = "duplicate_blocked"
- dataset_inclusion = false
- storage_targets = ["audit_log"]
- trust_level = "none"

OUTPUT FORMAT

Return ONLY JSON:

{
  "status": "accepted | safe_fallback | duplicate_blocked",
  "decision_id": "string",
  "event_type": "string",
  "dataset_inclusion": "boolean",
  "trust_level": "none | low | quarantined | high",
  "storage_targets": ["learning_dataset | audit_log | low_trust_storage | quarantine_storage"],
  "learning_eligibility": "eligible | blocked",
  "audit_tag": "discard_from_dataset | low_trust_bucket | quarantine_bucket | none",
  "debug_trace": {
    "validation_failed": "boolean",
    "normalization_applied": "boolean",
    "matched_rule": "string"
  }
}

STATUS RULES

IF duplicate detected:
- status = "duplicate_blocked"

ELSE IF validation_failed = true OR normalization_applied = true:
- status = "safe_fallback"

ELSE:
- status = "accepted"

FINAL RULE

The system must:
- NEVER reject externally
- NEVER allow blocked or contaminated data into learning
- ALWAYS return valid JSON
- ALWAYS preserve audit routing
- ALWAYS fail closed on learning inclusion

{
"status": "safe_fallback",
"decision_id": "unknown_decision",
"event_type": "unknown_event",
"dataset_inclusion": false,
"trust_level": "none",
"storage_targets": ["audit_log"],
"learning_eligibility": "blocked",
"audit_tag": "discard_from_dataset",
"debug_trace": {
"validation_failed": true,
"normalization_applied": true,
"matched_rule": "validation_failed_trigger_safe_fallback"
}
}


ROLE:
You are a Plenra System Classifier.

GOAL:
Analyze the chat and classify its system value, structure level, and priority for ingestion into Plenra memory.

OUTPUT FORMAT (STRICT):

CHAT_NAME:
[exact chat name]

CORE_TYPE:
[Decision Engine | Policy/Guardrail | Intake/Classifier | Memory/System | Execution/Automation | Gate/Product | Simulation/Test | Infrastructure | Idea/Content]

STRUCTURE_LEVEL:
[HIGH | MEDIUM | LOW]

DEFINITION_QUALITY:
[CRISP | PARTIAL | VAGUE]

SYSTEM_VALUE:
[CORE | SUPPORTING | PRODUCT | NOISE]

P0_P1_P2_P3:
[P0 | P1 | P2 | P3]

INGEST_NOW:
[YES | NO]

REASON:
[1–2 short sentences why]

NOTES:
[optional short note]

RULES:

* No long explanations
* No storytelling
* Be strict and critical
* If not clearly structured → do NOT mark as P0
* If mostly idea → mark as LOW + NOISE

CHAT_NAME:
Plenra Dataset Builder Service

CORE_TYPE:
Infrastructure

STRUCTURE_LEVEL:
HIGH

DEFINITION_QUALITY:
CRISP

SYSTEM_VALUE:
CORE

P0_P1_P2_P3:
P0

INGEST_NOW:
YES

REASON:
Fully specified deterministic service with strict contracts and fail-closed learning control. Critical to data integrity and learning pipeline safety.

NOTES:
Core ingestion firewall for all learning data.

KEY_ENTITIES:
[]

POSSIBLE_CANON_ITEMS:
[]

OPEN_AMBIGUITIES:
[]
