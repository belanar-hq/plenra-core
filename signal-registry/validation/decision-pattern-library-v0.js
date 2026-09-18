const DECISION_PATTERN_LIBRARY_V0 = Object.freeze([
  "UNKNOWN",
  "MARKET_PAIN_SIGNAL",
  "BUYER_INTENT_SIGNAL",
  "REVENUE_PATH_SIGNAL",
  "CLUSTER_CANDIDATE_SIGNAL"
]);

function isKnownDecisionPattern(patternId) {
  return DECISION_PATTERN_LIBRARY_V0.includes(patternId);
}

module.exports = {
  DECISION_PATTERN_LIBRARY_V0,
  isKnownDecisionPattern
};
