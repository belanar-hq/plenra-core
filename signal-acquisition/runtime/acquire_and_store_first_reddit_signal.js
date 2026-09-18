const { acquire_reddit_signal, store_signal } = require("./index");
const { SignalRegistryRuntime } = require("../../signal-registry/runtime");
const { acquisition_failure_diagnostics } = require("../diagnostics/acquisition_failure_diagnostics");

async function main(argv = process.argv) {
  const redditUrl = argv[2];

  if (!redditUrl) {
    console.error("Usage: node signal-acquisition/runtime/acquire_and_store_first_reddit_signal.js <reddit_url>");
    process.exitCode = 1;
    return;
  }

  const runtime = new SignalRegistryRuntime();

  try {
    await runtime.initialize();
    let acquired;
    try {
      acquired = await acquire_reddit_signal(redditUrl);
    } catch (error) {
      if (error && error.message === "REDDIT_ACQUISITION_UNAVAILABLE") {
        const diagnostic = await acquisition_failure_diagnostics(redditUrl);
        emitDiagnosticRecord(diagnostic);
      }

      throw error;
    }

    const stored = await store_signal(runtime, acquired);

    console.log(`signal_id=${stored.signal_id}`);
    console.log(`status=${stored.status}`);
    console.log("storage=confirmed");
  } finally {
    await runtime.close();
  }
}

function emitDiagnosticRecord(diagnostic) {
  console.log(`diagnostic=${JSON.stringify({
    runtime_stage: diagnostic.runtime_stage,
    error_code: diagnostic.error_code,
    error_message: diagnostic.error_message,
    http_status: diagnostic.http_status,
    network_failure_flag: diagnostic.network_failure_flag,
    parse_failure_flag: diagnostic.parse_failure_flag,
    validation_failure_flag: diagnostic.validation_failure_flag
  })}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`error=${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  main
};
