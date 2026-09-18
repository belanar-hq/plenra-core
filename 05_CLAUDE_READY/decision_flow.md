# Decision Flow

## How decisions are made

- Input enters under safe normalization and fail-closed rules.
- Gate evaluation applies the canon gates `CRITICAL FIREWALL` and `DUPLICATE CONTROL`.
- `Meta Controller` is evaluated before the final decision and has final `allow`, `block`, or `override` authority.
- The decision is finalized only after gate evaluation and Meta Controller review.
- Every decision is logged to `audit_log` before routing.
- Routing sends approved outcomes toward `learning_dataset`, while block outcomes terminate at `audit_log`.

## Where control exists

- `CRITICAL FIREWALL` blocks learning admission when canonical blocking conditions are present.
- `DUPLICATE CONTROL` blocks duplicate entries from normal acceptance flow.
- `Meta Controller` is the non-bypassable final control authority and does not execute actions.
- `audit_log` enforces immutable decision recording for all outcomes.

## Where the system can fail

- Missing or invalid input must fail closed before approval.
- If `Meta Controller` is unavailable or cannot be evaluated, the flow cannot safely approve and must block.
- If logging to `audit_log` cannot occur, decision integrity is lost and the flow should not continue as approved.
- If routing targets are unavailable, final storage cannot complete even after decision and logging.

## Execution Guarantees

- `gate_evaluation` must always execute immediately after input.
- `CRITICAL FIREWALL` and `DUPLICATE CONTROL` are mandatory blocking gates, and any triggered gate forces a block path.
- `Meta Controller` must always execute after gates and before any routing step.
- `Meta Controller` is non-bypassable and controls the final decision through `allow`, `block`, or `override`.
- No direct routing is allowed from input or gate evaluation.
- Access to `learning_dataset` is allowed only if `Meta Controller` returns `allow`.
- Block routing must occur if `Meta Controller` returns `block`.
- Override authority belongs only to `Meta Controller`.

## Block Handling Guarantee

- A block result follows a single terminal path.
- `audit_log` is the only destination for a block result.
- No further execution is allowed after block routing.
