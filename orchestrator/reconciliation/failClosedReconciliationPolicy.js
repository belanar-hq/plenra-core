function evaluateFailClosedPolicy(flags) {
  const reason_codes = [];
  let status = 'PASS';

  if (flags.missing_registry) {
    reason_codes.push('MISSING_REGISTRY_STATE');
    status = 'HOLD';
  }
  if (flags.missing_canon) {
    reason_codes.push('MISSING_CANON_FILE');
    status = status === 'PASS' ? 'HOLD' : status;
  }
  if (flags.canon_drift) {
    reason_codes.push('CANON_DRIFT_DETECTED');
    status = 'BLOCK';
  }
  if (flags.dependency_desync) {
    reason_codes.push('DEPENDENCY_DESYNCHRONIZATION');
    status = status === 'PASS' ? 'HOLD' : status;
  }
  if (flags.codex_regression) {
    reason_codes.push('CODEX_REGRESSION_DETECTED');
    status = status === 'PASS' ? 'HOLD' : status;
  }
  if (flags.preservation_failures) {
    reason_codes.push('PRESERVATION_INTEGRITY_FAILURE');
    status = status === 'PASS' ? 'HOLD' : status;
  }
  if (flags.broken_lineage) {
    reason_codes.push('BROKEN_LINEAGE');
    status = 'BLOCK';
  }
  if (flags.adaptive_mosquito_routing) {
    reason_codes.push('ADAPTIVE_MOSQUITO_ROUTING_BLOCKED');
    status = 'BLOCK';
  }
  if (status === 'PASS' && reason_codes.length === 0) {
    status = 'PASS';
  }

  return { status, reason_codes };
}

module.exports = { evaluateFailClosedPolicy };