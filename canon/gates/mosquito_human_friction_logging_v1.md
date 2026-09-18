# mosquito_human_friction_logging_v1

Minimal bootstrap survival infrastructure for recording human and operational friction before real-world mosquito execution.

This artifact is observation-only. It does not perform adaptive routing, autonomous optimization, payment execution, contractor routing, or kill-criteria execution.

## Runtime Contract

- Logs structured friction events to local append-only JSONL storage.
- Requires runtime context with `execution_id` and `case_id`.
- Requires `idempotency_key` for each friction event.
- Returns `PASS`, `HOLD`, or `BLOCK` with explicit `reason_codes`.
- Integrates through the inactive-by-default `mosquito_human_friction_logging_v1` runtime hook.

## Fail-Closed Behavior

- Missing `idempotency_key` returns `BLOCK`.
- Missing `execution_id` or `case_id` returns `HOLD`.
- Malformed `friction_type` or `severity` returns `BLOCK`.
- Duplicate idempotency conflict returns `BLOCK`.
- Routing mutation, optimization trigger, or kill-criteria execution attempts return `BLOCK`.

## Scope Boundary

Aggregation helpers are observation-only and must not trigger kill criteria. The separate `mosquito_bootstrap_kill_criteria_v1` artifact is required before real-world execution readiness can be considered.
