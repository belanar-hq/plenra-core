const contract = require("../../contracts/signal_collection_validation_v1.json");
const { isKnownDecisionPattern } = require("./decision-pattern-library-v0");

function validateNoForbiddenFields(input) {
  for (const field of contract.forbidden_signal_fields) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      return { valid: false, reason: "FORBIDDEN_FIELD", field };
    }
  }

  return { valid: true };
}

function validateCreateSignalInput(input) {
  if (!input || typeof input !== "object") {
    return { valid: false, reason: "INVALID_INPUT" };
  }

  const forbidden = validateNoForbiddenFields(input);
  if (!forbidden.valid) return forbidden;

  if (typeof input.source !== "string" || input.source.length === 0) {
    return { valid: false, reason: "SOURCE_REQUIRED" };
  }

  if (typeof input.raw_text !== "string" || input.raw_text.length === 0) {
    return { valid: false, reason: "RAW_TEXT_REQUIRED" };
  }

  return { valid: true };
}

function validatePatternAssignments(input) {
  if (!input || typeof input !== "object") {
    return { valid: false, reason: "INVALID_INPUT" };
  }

  const forbidden = validateNoForbiddenFields(input);
  if (!forbidden.valid) return forbidden;

  if (!Array.isArray(input.decision_pattern_ids)) {
    return { valid: false, reason: "DECISION_PATTERN_IDS_MUST_BE_ARRAY" };
  }

  if (input.decision_pattern_ids.length < contract.decision_pattern_ids.minimum_items) {
    return { valid: false, reason: "DECISION_PATTERN_IDS_REQUIRED" };
  }

  for (const patternId of input.decision_pattern_ids) {
    if (typeof patternId !== "string" || !isKnownDecisionPattern(patternId)) {
      return { valid: false, reason: "UNKNOWN_PATTERN_IDENTIFIER", pattern_id: patternId };
    }
  }

  return { valid: true };
}

function validateRawTextNotModified(input) {
  if (input && Object.prototype.hasOwnProperty.call(input, "raw_text")) {
    return { valid: false, reason: "RAW_TEXT_IMMUTABLE" };
  }

  return { valid: true };
}

module.exports = {
  validateNoForbiddenFields,
  validateCreateSignalInput,
  validatePatternAssignments,
  validateRawTextNotModified
};
