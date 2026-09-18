# Context Surface Authority and Default-Load Classification - Candidate Guidance v0.2

## Status Notice

STATUS: CANDIDATE_ONLY_NOT_ACTIVE_CANON.

This document is candidate guidance only. It is not active canon. It is not optimization approval. It is not compression approval. It is not routing approval. It is not implementation approval. It is not a token-savings claim. It is not permission to mutate canon, memory, registries, runtime, architecture, scan/reconcile behavior, or repository files beyond this separately authorized one-file documentation write.

## Purpose

This document prevents context-budget reviews from confusing a surface's authority role with its load behavior.

A surface may be authoritative, intermediate, task-routed, explicit-request-only, present but not confirmed loaded, or mutation-capable. None of those classifications alone authorizes optimization, compression, routing changes, deletion, repo writes beyond this one documentation file, or token-savings claims.

## Core Principle

Every context-budget proposal must be evaluated through two separate layers:

1. authority_classification
2. default_load_classification

The authority classification asks what role the surface plays in governance.
The default-load classification asks whether the surface is always loaded, task-routed, explicit-request-only, present but not confirmed loaded, not referenced in inspected runtime paths, or mutation-capable and blocked.

## Classification Table

| Surface | authority_classification | default_load_classification | Guidance |
|---|---|---|---|
| 03_CANON | AUTHORITY_FORMAT_EVIDENCE | NOT_REFERENCED_IN_RUNTIME_PATHS | Use as authority-format evidence where CANON IDs, original TEMP lineage, justification fields, and governance meaning matter. Do not claim it is runtime default-loaded without trace. |
| 04_STRUCTURED_DATA | TEMP_OR_INTERMEDIATE_ONLY | NOT_REFERENCED_IN_RUNTIME_PATHS | Use as structured intermediate evidence only. It is not governance authority and must not override canon. |
| 05_CLAUDE_READY | SUMMARY_SURFACE_PRESENT_BUT_NOT_CONFIRMED_LOADED | PRESENT_BUT_NOT_CONFIRMED_LOADED | Treat as a present summary surface whose loader or use path is not confirmed. Do not treat it as active memory or confirmed-loaded context without trace. |
| canon JSON artifacts | STRUCTURED_TOOLING_OR_MIXED_GOVERNANCE_REQUIRED | TASK_ROUTED_CONFIRMED | Use for deterministic tooling, validators, reconciliation, drift detection, orphan detection, preservation, lineage, tests, and registry-linked checks. Task-routed does not mean removable. |
| canon Markdown companions | HUMAN_REVIEW_OR_PRESERVATION_COMPANION | TASK_ROUTED_CONFIRMED | Use for human review, narrative context, preservation, prompt/reference context, and mixed-governance review. Markdown does not replace JSON, and JSON does not replace Markdown. |
| registries | MIXED_GOVERNANCE_REQUIRED | TASK_ROUTED_CONFIRMED | Use for scheduling, drift, dependency, lineage, fail-closed behavior, and registry expectations. Registries are not optional summaries. |
| codex_tasks | TASK_SPECIFIC_EXECUTION_CONTEXT | EXPLICIT_REQUEST_ONLY_CONFIRMED | Use as explicit task context when selected by Orchestrator. Explicit-request-only does not mean useless. |
| dispatch JSON | SELF_CONTAINED_TASK_ROUTED_EXECUTION_PACK | TASK_ROUTED_CONFIRMED | Use as a bounded task-routed execution pack with locked prompt, hash, target files, forbidden surfaces, and stop conditions. Do not treat as global default context. |
| mutation-capable tests / canonWriter | BLOCKED_FOR_CONTEXT_BUDGET_WORK_WITHOUT_SEPARATE_AUTHORIZATION | MUTATION_CAPABLE_PATH_NOT_ALLOWED_FOR_CONTEXT_BUDGET_TRACE | May be identified read-only as a risk surface, but must not be executed in context-budget work without separate Orchestrator authorization. |

## Quick Rules

- No ALWAYS_LOADED_CONFIRMED finding means no token-savings claim.
- Not-referenced does not mean safe to delete.
- Task-routed does not mean removable.
- Explicit-request-only does not mean useless.
- 04_STRUCTURED_DATA is not governance authority.
- 05_CLAUDE_READY is not active memory without trace.
- JSON does not replace Markdown.
- Markdown does not replace JSON.
- PASS_EQUIVALENT is not permission to optimize.

## Preflight Checklist

Before any context-budget proposal is accepted, verify:

- What is the authority source?
- What is the default-load classification?
- Are blocked actions preserved?
- Are reason codes preserved?
- Are registry expectations preserved?
- Is human rationale still reconstructable?
- Are required tooling fields still available?
- Is the proposal assuming default-load without trace?
- Is the proposal making a token-savings assumption without measurement and replay?
- Is there any repo write, file mutation, routing change, compression, optimization, or scan/reconcile behavior change implied?

## Blocked Proposals

The following remain blocked by this candidate guidance:

- active canon promotion
- optimization
- compression
- routing changes
- scan/reconcile behavior changes
- Markdown companion removal or compression
- 03_CANON / 04_STRUCTURED_DATA consolidation
- 05_CLAUDE_READY active-memory or default-load claims
- mutation-capable tests
- canonWriter execution
- token-savings claims

## Future Evidence Requirements

Future proposals require stronger evidence before any status upgrade:

- runtime trace before always-loaded claims
- before/after token measurement plus behavior-preservation replay before savings claims
- replay before routing proposals
- consumer inventory before JSON/Markdown routing changes
- registry/dependency replay before registry expectation changes
- human review replay before reducing Markdown narrative context
- separate Orchestrator review before active canon promotion

## Final Boundary Statement

This document does not authorize active canon, optimization, compression, Codex execution beyond this bounded documentation task, implementation, routing changes, scan/reconcile changes, canon mutation, memory mutation, registry mutation, architecture change, token-savings claims, Markdown removal, 03_CANON / 04_STRUCTURED_DATA consolidation, 05_CLAUDE_READY active-memory claims, mutation-capable tests, or canonWriter execution.
