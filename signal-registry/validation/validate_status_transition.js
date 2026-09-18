const ALLOWED_STATUSES = Object.freeze([
  "COLLECTED",
  "TAGGED",
  "CLUSTER_CANDIDATE",
  "CLUSTER_VALIDATED",
  "ARCHIVED"
]);

const ALLOWED_TRANSITIONS = Object.freeze({
  COLLECTED: ["TAGGED", "ARCHIVED"],
  TAGGED: ["CLUSTER_CANDIDATE", "ARCHIVED"],
  CLUSTER_CANDIDATE: ["CLUSTER_VALIDATED", "ARCHIVED"],
  CLUSTER_VALIDATED: ["ARCHIVED"],
  ARCHIVED: []
});

function validateStatusValue(status) {
  if (!ALLOWED_STATUSES.includes(status)) {
    return { valid: false, reason: "INVALID_STATUS" };
  }

  return { valid: true };
}

function validateStatusTransition(currentStatus, nextStatus) {
  const statusValidation = validateStatusValue(nextStatus);
  if (!statusValidation.valid) return statusValidation;

  if (currentStatus === nextStatus) {
    return { valid: true };
  }

  const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedNextStatuses || !allowedNextStatuses.includes(nextStatus)) {
    return { valid: false, reason: "INVALID_STATUS_TRANSITION" };
  }

  return { valid: true };
}

module.exports = {
  ALLOWED_STATUSES,
  ALLOWED_TRANSITIONS,
  validateStatusValue,
  validateStatusTransition
};
