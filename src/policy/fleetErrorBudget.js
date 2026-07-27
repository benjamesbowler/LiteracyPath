export const FLEET_ERROR_BUDGET_POLICY = Object.freeze({
  windowHours: 24,
  fatalEventBudget: 0,
  alertEventBudget: 0,
  repeatFingerprintAlertCount: 5,
  repeatFingerprintWindowMinutes: 1
});

function count(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

export function evaluateFleetErrorBudget(summary) {
  if (!summary || typeof summary !== "object") {
    return {
      status: "no-data",
      label: "No data",
      fatalEvents: 0,
      alertEvents: 0,
      budgetUsed: 0,
      explanation: "No release telemetry is available for this 24-hour window."
    };
  }

  const fatalEvents = count(summary.fatal_events_24h);
  const alertEvents = count(summary.alerts_24h);
  const budgetUsed = Math.max(fatalEvents, alertEvents);

  if (
    fatalEvents > FLEET_ERROR_BUDGET_POLICY.fatalEventBudget
    || alertEvents > FLEET_ERROR_BUDGET_POLICY.alertEventBudget
  ) {
    return {
      status: "breached",
      label: "Breached",
      fatalEvents,
      alertEvents,
      budgetUsed,
      explanation: `${budgetUsed} actionable fleet event${budgetUsed === 1 ? "" : "s"} must be resolved.`
    };
  }

  return {
    status: "within-budget",
    label: "Within budget",
    fatalEvents,
    alertEvents,
    budgetUsed: 0,
    explanation: "No fatal or repeat-fingerprint alert events were retained."
  };
}
