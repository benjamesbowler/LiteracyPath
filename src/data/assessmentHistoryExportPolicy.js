export const ASSESSMENT_HISTORY_EXPORT_STATES = Object.freeze({
  LOADING: "loading",
  ERROR: "error",
  PARTIAL: "partial",
  EMPTY: "empty",
  READY: "ready"
});

export function assessmentHistoryExportReadiness({
  readState = {},
  recordCount = 0
} = {}) {
  const count = Math.max(0, Number(recordCount) || 0);
  const status = String(readState.status || "").trim().toLowerCase();
  const hasError = Boolean(readState.error) || status === ASSESSMENT_HISTORY_EXPORT_STATES.ERROR;
  const partial = readState.truncated === true
    || readState.complete !== true
    || status === ASSESSMENT_HISTORY_EXPORT_STATES.PARTIAL;

  if (status === ASSESSMENT_HISTORY_EXPORT_STATES.LOADING) {
    return {
      state: ASSESSMENT_HISTORY_EXPORT_STATES.LOADING,
      canExport: false,
      canRetry: false,
      message: "Loading the complete assessment history. Export will be available when this finishes."
    };
  }
  if (hasError) {
    return {
      state: ASSESSMENT_HISTORY_EXPORT_STATES.ERROR,
      canExport: false,
      canRetry: true,
      message: "We couldn't load the complete assessment history. Nothing has been exported. Check the connection and try again."
    };
  }
  if (partial) {
    return {
      state: ASSESSMENT_HISTORY_EXPORT_STATES.PARTIAL,
      canExport: false,
      canRetry: true,
      message: "Only part of the assessment history is available. Export is paused so the file cannot be mistaken for a complete record. Try again."
    };
  }
  if (count === 0) {
    return {
      state: ASSESSMENT_HISTORY_EXPORT_STATES.EMPTY,
      canExport: false,
      canRetry: false,
      message: "No assessment results have been saved yet."
    };
  }
  return {
    state: ASSESSMENT_HISTORY_EXPORT_STATES.READY,
    canExport: true,
    canRetry: false,
    message: `${count} saved assessment ${count === 1 ? "result is" : "results are"} ready to export.`
  };
}
