# Lead Leakage Agent v0.1 Candidate Spec Freeze

## Status Block

STATUS: CANDIDATE_ONLY_NOT_ACTIVE_CANON

Candidate documentation only.

Not active canon.

Not production-ready.

Not automation approval.

Not WhatsApp sending approval.

Not customer-facing use.

Not Codex authorization.

Not repo/runtime implementation approval.

Artifact type: internal candidate specification freeze documentation.

Approved use:
- internal candidate reference
- manual replay reference
- future readiness review input
- governance artifact
- future repo-doc eligibility review input if separately approved

Blocked use:
- production
- automation
- WhatsApp sending
- customer-facing drafts
- CRM/status/payment/schedule mutation
- pricing or offer changes
- Codex authorization beyond this bounded documentation write
- repo/runtime implementation approval
- active canon
- client-facing claims
- implementation readiness approval
- WhatsApp Review Agent mapping

Review date: 2026-07-15

## Task Lineage

This candidate specification is derived from the following Orchestrator decisions:

1. ORCH_INTEGRATE_BOUNDED_AGENT_PRODUCTION_RELIABILITY_INSIGHTS_001
2. ORCH_EXECUTE_BOUNDED_AGENT_PRODUCTION_READINESS_GOAL_SEQUENCE_001
3. ORCH_PREPARE_RAW_REPLAY_EVIDENCE_BATCH_FOR_LEAD_LEAKAGE_AGENT_001
4. ORCH_EXECUTE_LEAD_LEAKAGE_AGENT_MANUAL_REPLAY_ON_6_CASES_001
5. ORCH_REPAIR_LEAD_LEAKAGE_AGENT_STAGE_CONTRACTS_AFTER_REPLAY_001
6. ORCH_PREPARE_BATCH_002_EVIDENCE_ADMISSIBILITY_FOR_LEAD_LEAKAGE_AGENT_001
7. ORCH_EXECUTE_LEAD_LEAKAGE_AGENT_BATCH_002_MANUAL_REPLAY_ON_4_CASES_001
8. ORCH_REVIEW_LEAD_LEAKAGE_AGENT_POST_BATCH_002_READINESS_STATE_001
9. ORCH_PREPARE_LEAD_LEAKAGE_AGENT_V0_1_CANDIDATE_SPEC_FREEZE_PACKET_001
10. ORCH_REVIEW_LEAD_LEAKAGE_AGENT_V0_1_SPEC_FREEZE_PACKET_FOR_REPO_DOC_ELIGIBILITY_001

## Executive Summary

Lead Leakage Agent v0.1 is an internal/manual bounded candidate agent for classifying lead leakage in raw or redacted WhatsApp evidence and recommending internal next actions without executing them.

It can currently be used only as an internal candidate reference for:
- classifying lead/conversation state
- identifying possible leakage types
- identifying evidence gaps
- preserving outcome boundaries
- recommending internal-only next-action categories
- supporting future readiness review

It cannot:
- send WhatsApp messages
- create final customer-facing drafts
- update CRM, lead status, customer records, payment status, schedule, price, or offer
- infer payment, service completion, satisfaction, or final outcome without direct evidence
- trigger automation
- approve production
- authorize Codex beyond this bounded documentation write
- mutate repo/runtime
- make client-facing or sales claims
- act as active canon

Candidate freeze is justified because 10 internal raw WhatsApp replay cases validated the bounded stage architecture, internal-only operation, forbidden-action preservation, human approval boundary, outcome inference blocking, repaired schema usability, expanded reason-code usability, manual trace candidate usability, evidence-gap detection, and stage isolation.

Production remains blocked because runtime-grade trace is not validated, automation is not validated, WhatsApp sending is not allowed, live CRM/status/payment/schedule mutation is not allowed, cost/token measurement has not been performed, replacement/substitution safety has not been tested, scope/price ambiguity coverage remains weak-to-medium, outcome coverage is incomplete, only 10 cases were tested, WhatsApp Review Agent dependency is not mapped, Codex/repo integration is not authorized, and active canon is not approved.

## Agent Purpose

Lead Leakage Agent v0.1 is an internal/manual bounded candidate agent for classifying lead leakage in raw or redacted WhatsApp evidence and recommending internal next actions without executing them.

## Bounded Stage Architecture

### LLA_STAGE_001_SIGNAL_INTAKE

Purpose: Normalize one raw/redacted WhatsApp evidence item into a safe internal replay record.

Input summary:
- case_id
- evidence_ref
- source type
- redaction status
- visible service context
- repaired thread/media fields

Output summary:
- signal_record
- completeness state
- safe_to_continue
- source reason codes

Allowed actions:
- read evidence
- normalize source
- flag missing fields
- mark privacy risks

Forbidden actions:
- send WhatsApp
- infer outcome
- update status
- trigger automation

Validation gate:
PASS/HOLD/BLOCK based on source safety, completeness, and replay admissibility.

Halt condition:
Missing evidence_ref, unsafe PII, insufficient context, or any request for live action.

### LLA_STAGE_002_CONVERSATION_CLASSIFICATION

Purpose: Classify lead/conversation state without changing anything.

Input summary:
- signal record
- bounded conversation content

Output summary:
- lead_status
- authority_state
- scope/price/schedule/access signals
- assumptions
- reason codes

Allowed actions:
- classify
- extract facts
- separate fact from assumption

Forbidden actions:
- approve booking
- close lead
- change customer status
- infer consent

Validation gate:
PASS if evidence-backed; HOLD if authority/status/scope unclear; BLOCK if unsupported inference is required.

Halt condition:
Decision owner, authority, payment, or outcome cannot be separated from assumption.

### LLA_STAGE_003_LEAKAGE_DETECTION

Purpose: Detect the likely leakage type from evidence-backed classification.

Input summary:
- conversation classification
- repaired schema fields
- evidence refs

Output summary:
- leakage_type
- severity
- leakage reason codes
- evidence gaps

Allowed actions:
- detect leakage pattern
- rank severity
- name blocker

Forbidden actions:
- change offer
- change price
- send follow-up
- promise result

Validation gate:
PASS if leakage maps to evidence and taxonomy; HOLD if weak/ambiguous; BLOCK if it implies unauthorized action.

Halt condition:
Leakage cannot be tied to evidence or would require customer-facing action.

### LLA_STAGE_004_EVIDENCE_GAP_CHECK

Purpose: Identify missing evidence before any safe internal recommendation.

Input summary:
- leakage output
- repaired media/voice/document/outcome fields

Output summary:
- evidence_gap_list
- critical_gap_present
- outcome_evidence_type
- safe_to_continue

Allowed actions:
- identify gaps
- mark criticality
- request internal review

Forbidden actions:
- fill gaps from memory
- infer payment
- infer service completion
- infer satisfaction

Validation gate:
PASS if gaps are explicit; HOLD if gaps affect next action; BLOCK if outcome/consent/payment is inferred.

Halt condition:
Critical gap affects authority, consent, payment, outcome, or customer impact.

### LLA_STAGE_005_NEXT_ACTION_RECOMMENDATION

Purpose: Recommend one internal next action for a human; never execute it.

Input summary:
- classification
- leakage
- evidence gaps
- allowed manual next-action categories

Output summary:
- recommended_internal_next_action
- owner candidate
- evidence gaps
- approval requirement

Allowed actions:
- recommend internal review
- ask for missing evidence
- flag follow-up candidate

Forbidden actions:
- send WhatsApp
- write final customer-facing draft
- update CRM
- collect payment
- change price/offer

Validation gate:
PASS if internal-only and evidence-backed; HOLD if owner/authority unclear; BLOCK if action would execute externally.

Halt condition:
Recommendation affects customer or business state without approval.

### LLA_STAGE_006_HUMAN_APPROVAL_BOUNDARY_CHECK

Purpose: Verify all customer/business-impacting actions remain human/Orchestrator-gated.

Input summary:
- next-action packet
- forbidden-action map

Output summary:
- approval boundary status
- blocked action flags
- safe_to_continue

Allowed actions:
- review boundary
- mark human approval required
- block unsafe action

Forbidden actions:
- auto-send
- auto-update
- auto-charge
- auto-publish

Validation gate:
PASS only if human approval boundary is explicit; HOLD if ambiguous; BLOCK if automatic execution is attempted.

Halt condition:
Human approval missing, implicit, or bypassed.

### LLA_STAGE_007_OUTCOME_LOGGING_IF_EVIDENCE_EXISTS

Purpose: Log observed outcome only when direct evidence exists; otherwise mark unknown.

Input summary:
- outcome evidence type
- evidence refs
- prior stage outputs

Output summary:
- outcome_state
- outcome_ref_candidate
- evidence gaps
- next review need

Allowed actions:
- log evidence-backed outcome
- mark unknown
- link evidence
- schedule review

Forbidden actions:
- infer outcome
- rewrite history
- change payment status
- claim revenue lift

Validation gate:
PASS if direct evidence exists or unknown is explicitly marked; HOLD if evidence incomplete; BLOCK if outcome is inferred.

Halt condition:
Outcome evidence missing but outcome is being asserted.

## Repaired Input Schema

The following candidate input fields are part of the repaired Lead Leakage Agent v0.1 schema:

- thread_segment_id
- thread_cycle_id
- multi_date_thread_present
- service_cycle_boundary_state
- voice_note_present
- voice_transcript_available
- media_present
- media_description_available
- document_present
- document_content_available
- review_link_present
- payment_intention_visible
- payment_confirmation_visible
- service_completion_visible
- customer_satisfaction_visible
- access_details_present
- access_details_redacted
- scope_approval_state
- outcome_evidence_type

Allowed values:

service_cycle_boundary_state:
- single_cycle_clear
- multi_cycle_clear
- multi_cycle_unclear
- unknown

scope_approval_state:
- approved_explicitly
- approval_unclear
- proxy_approval
- not_applicable
- unknown

outcome_evidence_type:
- direct_completion_evidence
- direct_payment_evidence
- explicit_customer_confirmation
- operator_record_linked_to_evidence
- review_link_only
- follow_up_context_only
- scheduling_only
- payment_intention_only
- none

## Reason-Code Catalog

### signal_and_source

- RAW_THREAD_PRESENT
- SOURCE_SAFE_INTERNAL_ONLY
- SIGNAL_COMPLETE_ENOUGH
- MULTI_DATE_THREAD
- THREAD_SEGMENTATION_NEEDED
- THREAD_CYCLE_BOUNDARY_UNCLEAR

### media_voice_document

- VOICE_MEDIA_UNTRANSCRIBED
- VOICE_TRANSCRIPT_MISSING
- MEDIA_CONTENT_UNKNOWN
- DOCUMENT_CONTENT_UNKNOWN
- ARTIFACT_CONTENT_NOT_EVIDENCE

### access_and_authority

- ACCESS_AUTHORITY_GAP
- ACCESS_SIGNAL_VISIBLE
- ACCESS_DETAILS_REDACT_REQUIRED
- ACCESS_ACTION_BLOCKED
- AUTHORITY_CLEAR
- AUTHORITY_UNCLEAR
- PROXY_AUTHORITY_RISK

### scope

- SCOPE_SIGNAL
- SCOPE_EXPANSION_GAP
- SCOPE_APPROVAL_UNCLEAR
- SCOPE_APPROVAL_EXPLICIT
- SCOPE_BOUNDARY_MISSING

### price_and_quote

- PRICE_VISIBLE
- PRICE_CONFIDENCE_GAP
- PRICE_BRIDGE_PRESENT
- QUOTE_TO_SCHEDULE_FLOW

### schedule

- SCHEDULE_VISIBLE
- SCHEDULE_LOCK
- STATUS_SCHEDULED_SUPPORTED
- RESCHEDULE_SIGNAL
- TIMING_CONSTRAINT_VISIBLE

### outcome_boundary

- OUTCOME_UNKNOWN
- NO_OUTCOME_INFERENCE
- PAYMENT_NOT_EVIDENCED
- NO_PAYMENT_INFERENCE
- SERVICE_COMPLETION_NOT_EVIDENCED
- NO_SATISFACTION_INFERENCE
- REVIEW_LINK_NOT_OUTCOME
- FOLLOW_UP_CONTEXT_NOT_OUTCOME
- SCHEDULING_NOT_OUTCOME
- PAYMENT_INTENTION_NOT_PAYMENT

### safety_and_authority

- INTERNAL_REVIEW_ONLY
- ASK_FOR_MISSING_EVIDENCE
- HUMAN_APPROVAL_REQUIRED
- CUSTOMER_IMPACT_BLOCKED
- NO_AUTO_SEND
- NO_STATUS_MUTATION
- NO_AUTO_ACTION

## OUTCOME_BOUNDARY_RULE_001

Scheduling, rescheduling, follow-up context, review-link context, customer preparation questions, payment intention, quote acceptance, access details, or price agreement are not direct outcome evidence.

Outcome may be logged as success, partial, no_change, failed, paid, performed, completed, or resolved only when direct evidence exists.

If direct evidence does not exist, outcome_state must remain unknown.

Direct evidence examples:
- explicit service completion confirmation
- explicit payment confirmation
- explicit customer confirmation
- direct operator record linked to evidence_ref

Non-evidence examples:
- scheduled time
- rescheduled time
- review link sent
- follow-up message
- payment intention
- quote acceptance without performance proof
- access details sent
- preparation question
- price agreement

## Trace Candidate Guidance

Manual replay trace candidate only.

Not runtime validated.

Not implemented.

Candidate trace fields:
- input_payload_hash_candidate
- output_payload_hash_candidate
- hash_method_candidate
- outcome_ref_candidate
- trace_completeness_state

Candidate hash method:
sha256 over normalized JSON containing:
- case_id
- stage_id
- evidence_refs
- redacted_input_summary
- stage_output
- reason_codes
- validation_gate_result
- timestamp

trace_completeness_state values:
- manual_trace_complete
- manual_trace_partial
- runtime_trace_not_validated
- insufficient

This guidance does not authorize runtime implementation, Codex execution beyond this bounded documentation write, repo mutation, automation, or production behavior.

## Replay Evidence Summary

### Batch 001

- 6 cases reviewed
- 3 case PASS
- 3 case HOLD
- 0 case BLOCK
- 35 stage PASS
- 7 stage HOLD
- 0 stage BLOCK

### Batch 002

- 4 cases reviewed
- 3 case PASS
- 1 case HOLD
- 0 case BLOCK
- 27 stage PASS
- 1 stage HOLD
- 0 stage BLOCK

### Aggregate

- 10 total cases reviewed
- 6 case PASS
- 4 case HOLD
- 0 case BLOCK
- 62 stage PASS
- 8 stage HOLD
- 0 stage BLOCK

Replay evidence is candidate validation evidence only. It is not production evidence, not sales evidence, not a client-facing claim, and not active canon.

## Validated Capabilities

Validated for internal candidate use only:

- bounded stage decomposition
- internal-only operation
- forbidden-action preservation
- human approval boundary
- outcome inference blocking
- repaired schema usability
- reason-code usability
- manual trace candidate usability
- evidence-gap detection
- stage isolation

## Remaining Blockers

The following remain blocked or unvalidated:

- runtime-grade trace not validated
- production not validated
- automation not validated
- WhatsApp sending not allowed
- customer-facing action not allowed
- live status/payment/schedule mutation not allowed
- cost/token measurement not performed
- replacement/substitution safety not tested
- scope/price ambiguity coverage weak-to-medium
- outcome coverage incomplete
- only 10 cases tested
- WhatsApp Review Agent dependency not mapped
- Codex/repo integration not authorized beyond this bounded documentation write
- active canon not approved

## Allowed Current Use

Allowed current use:

- internal candidate reference
- manual replay reference
- future readiness review input
- governance artifact
- future repo-doc eligibility review input if separately approved

## Blocked Current Use

Blocked current use:

- production
- automation
- WhatsApp sending
- customer-facing drafts
- CRM/status/payment/schedule mutation
- pricing or offer changes
- Codex authorization beyond this bounded documentation write
- repo/runtime implementation approval
- active canon
- client-facing claims
- implementation readiness approval
- WhatsApp Review Agent mapping

## Production-Readiness Checklist

| Check | Status | Evidence | Blocker |
|---|---|---|---|
| bounded responsibility | PASS_FOR_CANDIDATE | Stayed inside lead-leakage classification, evidence gaps, and internal next-action recommendation across 10 cases. | No production authority. |
| explicit input schema | PASS_FOR_CANDIDATE | Repaired schema handled media/voice/document, thread segmentation, access, payment, scope, and outcome evidence fields. | Runtime schema not implemented. |
| explicit output schema | PASS_FOR_CANDIDATE | Outputs consistently included lead_status, authority_state, leakage_type, severity, next action, confidence, outcome boundary, and trace candidate. | Not runtime-validated. |
| allowed actions | PASS | Only internal classification/review/recommendation actions used. | None. |
| forbidden actions | PASS | No WhatsApp sending, CRM/status mutation, payment action, pricing/offer change, automation, Codex, or repo mutation beyond this doc. | None. |
| required context | PASS_FOR_CANDIDATE | Each replay used only admitted anonymized WhatsApp evidence and stage outputs. | No runtime context-loading contract. |
| excluded context | PASS_FOR_CANDIDATE | No unrelated memory, strategy, pricing authority, or broad context used to infer outcomes. | Runtime exclusion not implemented. |
| reason codes | PASS_FOR_CANDIDATE | Expanded reason-code catalog usable across Batch 002. | Needs future scale testing. |
| confidence state | PASS_FOR_CANDIDATE | Confidence remained LOW/MEDIUM/HIGH/UNKNOWN. | No runtime confidence calibration. |
| trace replayability | PASS_FOR_MANUAL_REPLAY_ONLY | Trace candidate fields usable manually. | Runtime-grade hashes and outcome_ref not validated. |
| outcome capture | PASS_FOR_CANDIDATE | OUTCOME_BOUNDARY_RULE_001 preserved across payment, follow-up, scheduling, media/voice, and unknown-outcome cases. | Outcome coverage incomplete. |
| escalation rule | PASS | Customer-impacting or ambiguous cases remained behind human approval. | None. |
| halt condition | PASS | Forbidden actions and unsafe outcome inferences remained halted. | None. |
| isolation testability | PASS_FOR_CANDIDATE | Stages were testable independently across batches. | No automated or stubbed isolation tests. |
| customer-impact blocking | PASS | Customer-facing actions remained blocked. | None. |
| cost/token measurement readiness | HOLD | Stage boundaries could support measurement later. | No cost/token measurement performed. |
| replacement safety | HOLD | Stage decomposition suggests replaceability. | No substitution/replacement test run. |
| production gate readiness | HOLD | Candidate validation strengthened. | Production blockers unresolved. |

## Future Safe Paths

The following future paths are possible only through separate Orchestrator review. None are approved by this document.

A. Repo-doc write task if separately approved.

B. Batch 003 evidence expansion.

C. Implementation-readiness review only.

D. WhatsApp Review Agent dependency mapping only after separate approval.

E. Production-readiness review only after runtime trace, cost/token measurement, substitution safety, and stronger evidence.

## Final Boundary Statement

This document preserves Lead Leakage Agent v0.1 as candidate documentation only.

It does not authorize production, automation, WhatsApp sending, customer-facing drafts, CRM/status/payment/schedule mutation, pricing or offer changes, implementation readiness, active canon, client-facing claims, WhatsApp Review Agent mapping, or any repo/runtime change beyond this bounded documentation write.

It does not include PII or raw WhatsApp text.

It does not convert replay evidence into sales claims.

It does not claim that direct payment proves service completion.

It does not claim that follow-up context proves outcome.
