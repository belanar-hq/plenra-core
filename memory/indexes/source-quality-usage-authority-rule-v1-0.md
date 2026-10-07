---
id: source-quality-usage-authority-rule-v1-0
type: policy
status: active
version: "1.0"
approved_on: "2026-10-07"
approved_by: "Amos Cohen"
decision_status: "user-approved-material-delta"
provenance:
  origin: "Oct 7, 2026 idiCORE transcript extraction and external verification"
  decision: "Belanar chat approval: SOURCE QUALITY != USAGE AUTHORITY is a Material Delta and must be persisted in the canonical System of Record"
  prior_persistence: "ChatGPT persistent Memory verified before canonical SoR write"
related_to:
  - source-priority-rules
  - plenra-core-principles
  - evidence-before-commitment
  - evidence-grounded-recursive-expansion
  - business-context-bootstrap
  - buyer-acquisition-verification
  - dynamic-capability-acquisition
  - execution-contract
  - verified-comprehension
  - outcome-closure
---

# Belanar Source Quality x Usage Authority Rule V1.0

## Status
USER-APPROVED MATERIAL DELTA.

Integrate this rule into existing Belanar governance and workflows that acquire or use external information. Do not create a standalone agent, investigation subsystem, surveillance capability, framework, architecture, or product solely for this rule.

## Core Insight
The epistemic quality of a source and the authority or permissibility to obtain or use information from that source are separate dimensions.

A source can be highly reliable while its use is unauthorized or impermissible for the current purpose. Authorized access does not make information reliable.

## Core Rule
SOURCE QUALITY != USAGE AUTHORITY.

## Evidence Eligibility Gate
Before external information may materially affect a Belanar decision or action, independently evaluate both dimensions.

### 1. Source Quality
Evaluate:
- provenance
- reliability
- relevance
- freshness and temporal fit
- corroboration
- known limitations

### 2. Usage Authority
Evaluate:
- authorization
- permissible purpose
- privacy constraints
- legal constraints
- provider terms
- scope
- purpose limitation

Only evidence that passes the required threshold on BOTH dimensions is ELIGIBLE_FOR_DECISION for that specific purpose.

## Canonical Pattern
CONTEXT NEED
-> SOURCE DISCOVERY
-> SOURCE QUALITY ASSESSMENT
-> USAGE AUTHORITY / PERMISSIBLE-PURPOSE CHECK
-> RETRIEVE OR USE ONLY IF AUTHORIZED
-> PRESERVE PROVENANCE
-> CORROBORATE AS NEEDED
-> EVIDENCE ELIGIBILITY
-> DECISION / ACTION
-> OUTCOME VERIFICATION

## Fail-Closed Rules
- HIGH SOURCE QUALITY + NO OR UNKNOWN USAGE AUTHORITY -> DO NOT USE. Resolve authority or choose an authorized source.
- AUTHORIZED ACCESS + LOW OR UNKNOWN SOURCE QUALITY -> do not promote to fact or decision-grade evidence. Corroborate or downgrade confidence.
- DISCOVERED OR TECHNICALLY ACCESSIBLE DATA != AUTHORIZED DATA USE.
- PROPRIETARY OR PROFESSIONAL DATA != VERIFIED REALITY.
- ACCESS AUTHORITY != PURPOSE AUTHORITY.
- AUTHORITY FOR ONE PURPOSE != AUTHORITY FOR ANOTHER PURPOSE.
- If either dimension is materially unknown, mark the evidence INELIGIBLE or PENDING rather than silently inferring permission or truth.

## Recursive Expansion Application
Every newly discovered source, entity, or relationship inherits no automatic authority from the seed.

Before expanding or using it, evaluate both evidence strength and usage authority.

DISCOVERED CONNECTION != VERIFIED RELATIONSHIP remains mandatory.

## Execution Contract Application
For material external-data operations, include or derive:
- intended purpose
- source and provenance
- required evidence threshold
- authority basis and permissible purpose
- allowed scope
- verification requirement

A provider or tool being technically callable does not satisfy this gate.

## Learning
Track failures separately:
- SOURCE_QUALITY_FAILURE
- USAGE_AUTHORITY_FAILURE

Remediation must target the failed dimension rather than treating all evidence failures as equivalent.

## Provenance Note
This rule was derived from the Oct 7, 2026 idiCORE transcript extraction and external verification. The source illustrated that professional or proprietary investigative data can provide stronger context while still being constrained by eligibility, permissible purpose, privacy, legal, and provider requirements.

The generalizable Belanar Material Delta is the separation of epistemic source quality from authority to use information. It is NOT adoption of idiCORE itself.
