# System Summary

## Main Components

- `Plenra Dataset Builder Service` is the central canonized agent.
- Core control layers are `CRITICAL FIREWALL`, `DUPLICATE CONTROL`, `SAFE NORMALIZATION RULES`, `LEARNING ELIGIBILITY ENFORCEMENT`, `TRUST CLASSIFICATION`, `ROUTING RULES`, `STATUS RULES`, and `FINAL RULE`.
- Structural support comes from operating decisions (`fail_closed_on_learning`, `safe_fallback_on_input`, safe normalization of malformed input, audit routing for non-learning records), explicit constraints, and the definitions `validation_failed` and `normalization_applied`.

## Main Flows

- The service enforces normalization, eligibility, trust, routing, and duplicate/firewall controls.
- `SAFE NORMALIZATION RULES` feed `validation_failed` and `normalization_applied`.
- `validation_failed` and `normalization_applied` feed both `CRITICAL FIREWALL` and `STATUS RULES`.
- `LEARNING ELIGIBILITY ENFORCEMENT` and `TRUST CLASSIFICATION` feed `ROUTING RULES`.
- `DUPLICATE CONTROL` feeds `STATUS RULES`.
- `CRITICAL FIREWALL` blocks the path into routing outcomes when learning admission conditions fail.

## Unresolved Risks

- `Meta Controller` is referenced by canon rules but remains undefined.
- `learning_dataset`, `audit_log`, `low_trust_storage`, and `quarantine_storage` are referenced as targets but are not defined as canon nodes with explicit interfaces or ownership.

## Structural Weaknesses

- Storage targets exist only as unresolved placeholders, so destination semantics are referenced but not structurally specified.
- The control authority of `Meta Controller` is acknowledged but not defined, which leaves an external dependency in the policy layer.
- The canon is strong on enforcement logic, but weak on explicit node definitions for downstream systems it depends on.
