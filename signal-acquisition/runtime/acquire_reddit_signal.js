const {
  APPROVED_SOURCE,
  validate_raw_signal,
  extractRawText,
  extractTimestamp,
  extractSourceUrl
} = require("../validation/validate_raw_signal");

async function acquire_reddit_signal(redditSourceReference) {
  const rawReference = typeof redditSourceReference === "string"
    ? await fetchRedditReference(redditSourceReference)
    : redditSourceReference;

  const validation = validate_raw_signal(rawReference);
  if (!validation.valid) {
    const error = new Error(validation.reason);
    error.validation = validation;
    throw error;
  }

  const payload = {
    source: APPROVED_SOURCE,
    raw_text: extractRawText(rawReference),
    timestamp: extractTimestamp(rawReference)
  };

  const sourceUrl = extractSourceUrl(rawReference);
  if (sourceUrl) {
    payload.source_url = sourceUrl;
  }

  return payload;
}

async function fetchRedditReference(sourceUrl) {
  if (!isRedditUrl(sourceUrl)) {
    throw new Error("UNAPPROVED_SOURCE");
  }

  if (typeof fetch !== "function") {
    throw new Error("REDDIT_ACQUISITION_UNAVAILABLE");
  }

  const fetchUrl = sourceUrl.endsWith(".json") ? sourceUrl : `${sourceUrl.replace(/\/$/, "")}.json`;
  const response = await fetch(fetchUrl, {
    headers: { "User-Agent": "plenra-signal-acquisition-v1" }
  });

  if (!response.ok) {
    throw new Error("REDDIT_ACQUISITION_UNAVAILABLE");
  }

  const redditJson = await response.json();
  const data = extractRedditThingData(redditJson);
  if (!data) {
    throw new Error("RAW_TEXT_REQUIRED");
  }

  return {
    source: APPROVED_SOURCE,
    raw_text: extractFetchedRawText(data),
    timestamp: typeof data.created_utc === "number"
      ? new Date(data.created_utc * 1000).toISOString()
      : undefined,
    source_url: sourceUrl
  };
}

function isRedditUrl(sourceUrl) {
  return typeof sourceUrl === "string" && /^https:\/\/(www\.)?reddit\.com\//.test(sourceUrl);
}

function extractRedditThingData(redditJson) {
  if (Array.isArray(redditJson)) {
    for (const item of redditJson) {
      const data = extractRedditThingData(item);
      if (data) return data;
    }
  }

  if (redditJson && redditJson.data && Array.isArray(redditJson.data.children)) {
    const child = redditJson.data.children.find((item) => {
      const data = item && item.data;
      return data && (typeof data.body === "string" || typeof data.selftext === "string" || typeof data.title === "string");
    });

    return child ? child.data : null;
  }

  if (redditJson && redditJson.data) {
    return redditJson.data;
  }

  return null;
}

function extractFetchedRawText(data) {
  if (typeof data.body === "string") return data.body;
  if (typeof data.selftext === "string") {
    if (typeof data.title === "string" && data.title.length > 0) {
      return `${data.title}\n${data.selftext}`;
    }

    return data.selftext;
  }

  if (typeof data.title === "string") return data.title;
  return "";
}

module.exports = acquire_reddit_signal;
