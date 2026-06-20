# Evidence Scoring Guide v1

Status: internal-only candidate artifact.

## Purpose

This guide defines manual scoring fields for the next 5 new WhatsApp conversations. It is for internal review only and does not create outcomes, customer-facing claims, outreach, ads, automation, CRM assets, funnel assets, canon updates, or public material.

## How To Use This Guide Manually

Review only redacted conversation evidence and registry-style summaries. Score each field from 0 to 3, record the evidence basis in notes, and keep outcome, stuck risk, deferred outcome, review pipeline, referral pipeline, and other pipeline opportunities separate.

## Scoring Scale

0 = not present
1 = weak or unclear signal
2 = present but incomplete
3 = strong clear signal

## Required Manual Scoring Fields For Next 5 Records

record_id
source_conversation_id
review_owner
review_date
intent_clarity_score
scheduling_clarity_score
reschedule_recovery_score
expectation_setting_score
access_coordination_score
scope_expansion_score
visual_evidence_score
payment_closure_score
outcome_vs_pipeline_score
evidence_quality_score
privacy_risk_level
outcome_class
outcome_event
stuck_risk_signal
pipeline_detected
recommended_manual_next_action
confidence
notes

## Outcome Class Options

hard_commercial_outcome
hard_operational_outcome
admin_outcome
trust_outcome
negative_deferred_outcome
stuck_risk_signal
pipeline_opportunity
review_pipeline
referral_pipeline
unresolved_or_unknown

## Confidence Options

low
medium
high_internal

Use high_internal only when the existing registry explicitly supports service_completed, payment_received, or operator-confirmed operational outcome. Do not use high_internal for pipeline-only, review-request-only, referral-only, or unresolved cases.

## Outcome Vs Pipeline Rules

Pipeline must never be counted as outcome. Additional apartments, buildings, family units, committee referrals, review requests, and referral sharing remain pipeline until separately confirmed as closed, performed, and paid where applicable.

Do not count review_request_sent as review_received. Do not count referral_shared as converted referral. Do not treat invoice_or_receipt_visible as payment_received unless payment_received is explicitly true in the registry. Do not infer new outcomes from notes.

## Evidence Quality Rules

Use only registry-supported facts. Keep visible screenshot evidence and operator-confirmed outcomes separate in notes where relevant. For unknown dimensions, use 0 or 1 and explain the uncertainty. Do not inspect private images or screenshots to fill missing fields.

## Privacy And Redaction Rules

Every scoring artifact must preserve privacy and redaction requirements. Mark records as strict_redaction_required when they include private property, access, payment, family, institution, or minor context.

Redact names, phone numbers, addresses, apartment numbers, building identifiers, committee contacts, family relationships when identifying, children/minor context, kindergarten/institution names, access codes, key locations, alarm details, bank details, payment screenshots, Bit/PayBox details, invoice/receipt links, invoice/receipt numbers, photos/videos revealing property, and voice notes unless transcribed and redacted.

## How To Score The Next 5 New WhatsApp Conversations

Create one internal scoring row per new conversation. Fill the required manual scoring fields, use the 0/1/2/3 scale, assign one outcome_class option, and write notes that explain only the internal evidence basis. If a record has both a completed job and a pipeline signal, score the completed job separately from the pipeline signal.

## What Not To Do

Do not infer customer identity, payment, service completion, reviews received, converted referrals, or new outcomes. Do not create customer-facing copy, recommendations for customers, marketing copy, ads, outreach, funnel assets, automation assets, CRM flows, public claims, canon updates, architecture updates, or public assets.
