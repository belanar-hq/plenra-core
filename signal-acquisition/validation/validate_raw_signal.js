const APPROVED_SOURCE = "Reddit";

const FORBIDDEN_RAW_SIGNAL_FIELDS = Object.freeze([
  "classification",
  "classifications",
  "confidence",
  "confidence_value",
  "score",
  "scores",
  "rank",
  "ranking",
  "cluster",
  "clusters",
  "cluster_id",
  "cluster_candidate",
  "commercial_label",
  "commercial_labels",
  "decision_pattern_id",
  "decision_pattern_ids",
  "status",
  "pattern",
  "patterns",
  "pattern_extraction"
]);

function validate_raw_signal(input) {
  if (!input || typeof input !== "object") {
    return { valid: false, reason: "INVALID_INPUT" };
  }

  for (const field of FORBIDDEN_RAW_SIGNAL_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      return { valid: false, reason: "FORBIDDEN_ACQUISITION_FIELD", field };
    }
  }

  const source = input.source || input.platform;
  if (source !== APPROVED_SOURCE) {
    return { valid: false, reason: "UNAPPROVED_SOURCE" };
  }

  const rawText = extractRawText(input);
  if (typeof rawText !== "string" || rawText.length === 0) {
    return { valid: false, reason: "RAW_TEXT_REQUIRED" };
  }

  return { valid: true };
}

function extractRawText(input) {
  if (typeof input.raw_text === "string") return input.raw_text;
  if (typeof input.body === "string") return input.body;
  if (typeof input.selftext === "string") {
    if (typeof input.title === "string" && input.title.length > 0) {
      return `${input.title}\n${input.selftext}`;
    }

    return input.selftext;
  }

  if (typeof input.title === "string") return input.title;
  return null;
}

function extractTimestamp(input) {
  if (typeof input.timestamp === "string" && input.timestamp.length > 0) {
    return input.timestamp;
  }

  if (typeof input.created_utc === "number") {
    return new Date(input.created_utc * 1000).toISOString();
  }

  return new Date().toISOString();
}

function extractSourceUrl(input) {
  if (typeof input.source_url === "string") return input.source_url;
  if (typeof input.permalink === "string") return input.permalink;
  if (typeof input.url === "string") return input.url;
  return null;
}

module.exports = {
  APPROVED_SOURCE,
  FORBIDDEN_RAW_SIGNAL_FIELDS,
  validate_raw_signal,
  extractRawText,
  extractTimestamp,
  extractSourceUrl
};
