const ACTION_FEEDBACK_KINDS = new Set(["info", "pending", "success", "error", "undo"]);

export function inferActionFeedbackKind(message = "") {
  const value = String(message).trim();
  if (!value) return "info";
  if (/\b(could not|cannot|can't|failed|failure|unavailable|not authorized|no access|error)\b/i.test(value)) {
    return "error";
  }
  if (/\b(loading|preparing|creating|saving|reconnecting|sync is pending|please wait)\b/i.test(value)) {
    return "pending";
  }
  if (/\b(copied|created|downloaded|exported|saved|updated|restored|reset|ready|complete)\b/i.test(value)) {
    return "success";
  }
  return "info";
}

export function normalizeActionFeedback(feedback, fallbackKind = "info") {
  if (!feedback) return null;
  const value = typeof feedback === "string" ? { message: feedback } : feedback;
  const message = String(value.message || "").trim();
  if (!message) return null;
  const inferredKind = inferActionFeedbackKind(message);
  const requestedKind = value.kind || fallbackKind;
  const kind = ACTION_FEEDBACK_KINDS.has(requestedKind)
    ? requestedKind === "info" ? inferredKind : requestedKind
    : inferredKind;
  return {
    ...value,
    kind,
    message
  };
}
