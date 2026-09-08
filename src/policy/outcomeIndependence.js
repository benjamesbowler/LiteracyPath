// Shared evidence boundary: supported completion is not an independent response.
export function isIndependentOutcome(outcome = {}) {
  const evidence = outcome?.evidence || {};
  return evidence.independent !== false
    && !(Number(evidence.supportLevel) > 0)
    && String(evidence.measure || "").trim().toLowerCase() !== "support_only"
    && !(Array.isArray(evidence.supportUsed) && evidence.supportUsed.length);
}
