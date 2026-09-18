const { validate_raw_signal } = require("../validation/validate_raw_signal");

async function store_signal(signalRegistryRuntime, rawSignalPayload) {
  const validation = validate_raw_signal(rawSignalPayload);
  if (!validation.valid) {
    const error = new Error(validation.reason);
    error.validation = validation;
    throw error;
  }

  return signalRegistryRuntime.create_signal({
    source: rawSignalPayload.source,
    raw_text: rawSignalPayload.raw_text,
    timestamp: rawSignalPayload.timestamp
  });
}

module.exports = store_signal;
