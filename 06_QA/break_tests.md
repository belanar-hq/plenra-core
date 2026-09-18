# Break Tests

- scenario: Direct routing to `learning_dataset` without `Meta Controller`
  expected: BLOCK
  actual: BLOCK
  result: PASS

- scenario: Routing when `CRITICAL_FIREWALL` triggered
  expected: BLOCK
  actual: BLOCK
  result: PASS

- scenario: Duplicate bypass attempt
  expected: BLOCK
  actual: BLOCK
  result: PASS

- scenario: Skip `Meta Controller`
  expected: FAIL-CLOSED
  actual: FAIL-CLOSED
  result: PASS

- scenario: Override without `Meta Controller`
  expected: BLOCK
  actual: BLOCK
  result: PASS

- scenario: Valid allow flow
  expected: PASS -> `learning_dataset`
  actual: PASS -> `audit_log` then `learning_dataset`
  result: PASS

- scenario: Valid block flow
  expected: PASS -> `audit_log` only
  actual: PASS -> `audit_log` then `blocked`
  result: FAIL
  breach: The current hardened flow requires logging before routing, but its route step still includes a separate `blocked` target. That means a valid block flow is not constrained to `audit_log` only.

# Post Fix Validation

- scenario: Direct routing to `learning_dataset` without `Meta Controller`
  expected: BLOCK
  actual: BLOCK
  result: PASS

- scenario: Routing when `CRITICAL_FIREWALL` triggered
  expected: BLOCK
  actual: BLOCK
  result: PASS

- scenario: Duplicate bypass attempt
  expected: BLOCK
  actual: BLOCK
  result: PASS

- scenario: Skip `Meta Controller`
  expected: FAIL-CLOSED
  actual: FAIL-CLOSED
  result: PASS

- scenario: Override without `Meta Controller`
  expected: BLOCK
  actual: BLOCK
  result: PASS

- scenario: Valid allow flow
  expected: PASS -> `learning_dataset`
  actual: PASS -> `audit_log` then `learning_dataset`
  result: PASS

- scenario: Valid block flow
  expected: PASS -> `audit_log` only
  actual: PASS -> `audit_log` only
  result: PASS
