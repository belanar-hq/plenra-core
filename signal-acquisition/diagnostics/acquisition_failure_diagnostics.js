const {
  APPROVED_SOURCE,
  validate_raw_signal
} = require("../validation/validate_raw_signal");

const STAGES = Object.freeze({
  URL_GENERATION: "URL_GENERATION",
  HTTP_REQUEST: "HTTP_REQUEST",
  HTTP_RESPONSE: "HTTP_RESPONSE",
  RESPONSE_PARSE: "RESPONSE_PARSE",
  SIGNAL_VALIDATION: "SIGNAL_VALIDATION",
  SIGNAL_STORAGE: "SIGNAL_STORAGE"
});

async function acquisition_failure_diagnostics(redditSourceReference, options = {}) {
  const fetchImpl = options.fetchImpl || global.fetch;
  const diagnostic = createDiagnosticRecord(redditSourceReference);

  let requestedUrl;
  try {
    requestedUrl = prepareRedditJsonUrl(redditSourceReference);
    diagnostic.requested_url = requestedUrl;
  } catch (error) {
    return fail(diagnostic, STAGES.URL_GENERATION, "URL_GENERATION_FAILED", error);
  }

  if (typeof fetchImpl !== "function") {
    diagnostic.network_failure_flag = true;
    return fail(
      diagnostic,
      STAGES.HTTP_REQUEST,
      "REDDIT_ACQUISITION_UNAVAILABLE",
      new Error("fetch unavailable")
    );
  }

  let response;
  try {
    response = await fetchImpl(requestedUrl, {
      headers: { "User-Agent": "plenra-signal-acquisition-v1" }
    });
  } catch (error) {
    diagnostic.network_failure_flag = true;
    return fail(diagnostic, STAGES.HTTP_REQUEST, "REDDIT_ACQUISITION_UNAVAILABLE", error);
  }

  diagnostic.http_status = response.status || null;
  diagnostic.response_content_type = getResponseContentType(response);

  let responseText = "";
  try {
    responseText = typeof response.text === "function" ? await response.text() : "";
    diagnostic.response_body_summary = summarizeBody(responseText);
  } catch (error) {
    diagnostic.response_body_summary = "";
  }

  if (!response.ok) {
    return fail(
      diagnostic,
      STAGES.HTTP_RESPONSE,
      "REDDIT_ACQUISITION_UNAVAILABLE",
      new Error(`HTTP ${diagnostic.http_status}`)
    );
  }

  let redditJson;
  try {
    redditJson = JSON.parse(responseText);
  } catch (error) {
    diagnostic.parse_failure_flag = true;
    return fail(diagnostic, STAGES.RESPONSE_PARSE, "RESPONSE_PARSE_FAILED", error);
  }

  const data = extractRedditThingData(redditJson);
  const rawSignal = {
    source: APPROVED_SOURCE,
    raw_text: data ? extractFetchedRawText(data) : "",
    timestamp: data && typeof data.created_utc === "number"
      ? new Date(data.created_utc * 1000).toISOString()
      : new Date().toISOString(),
    source_url: typeof redditSourceReference === "string" ? redditSourceReference : null
  };

  const validation = validate_raw_signal(rawSignal);
  if (!validation.valid) {
    diagnostic.validation_failure_flag = true;
    return fail(
      diagnostic,
      STAGES.SIGNAL_VALIDATION,
      validation.reason,
      new Error(validation.reason)
    );
  }

  if (options.signalRegistryRuntime) {
    try {
      await options.signalRegistryRuntime.create_signal({
        source: rawSignal.source,
        raw_text: rawSignal.raw_text,
        timestamp: rawSignal.timestamp
      });
    } catch (error) {
      return fail(diagnostic, STAGES.SIGNAL_STORAGE, "SIGNAL_STORAGE_FAILED", error);
    }
  }

  diagnostic.runtime_stage = null;
  diagnostic.error_code = null;
  diagnostic.error_message = null;
  return diagnostic;
}

function createDiagnosticRecord(redditSourceReference) {
  return {
    requested_url: typeof redditSourceReference === "string" ? redditSourceReference : null,
    runtime_stage: null,
    error_code: null,
    error_message: null,
    http_status: null,
    response_content_type: null,
    response_body_summary: null,
    network_failure_flag: false,
    parse_failure_flag: false,
    validation_failure_flag: false
  };
}

function prepareRedditJsonUrl(sourceUrl) {
  if (typeof sourceUrl !== "string" || !/^https:\/\/(www\.)?reddit\.com\//.test(sourceUrl)) {
    throw new Error("UNAPPROVED_SOURCE");
  }

  return sourceUrl.endsWith(".json")
    ? sourceUrl
    : `${sourceUrl.replace(/\/$/, "")}.json`;
}

function getResponseContentType(response) {
  if (!response.headers || typeof response.headers.get !== "function") return null;
  return response.headers.get("content-type");
}

function summarizeBody(body) {
  if (typeof body !== "string") return "";
  const compact = body.replace(/\s+/g, " ").trim();
  return compact.length > 240 ? `${compact.slice(0, 240)}...` : compact;
}

function fail(diagnostic, stage, code, error) {
  return {
    ...diagnostic,
    runtime_stage: stage,
    error_code: code,
    error_message: error && error.message ? error.message : String(error)
  };
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
      return data && (
        typeof data.body === "string" ||
        typeof data.selftext === "string" ||
        typeof data.title === "string"
      );
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

module.exports = {
  STAGES,
  acquisition_failure_diagnostics
};
