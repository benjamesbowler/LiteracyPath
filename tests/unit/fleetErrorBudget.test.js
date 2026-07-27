import assert from "node:assert/strict";
import test from "node:test";

import {
  FLEET_ERROR_BUDGET_POLICY,
  evaluateFleetErrorBudget
} from "../../src/policy/fleetErrorBudget.js";

test("fleet budget is strict and tied to the monitor alert contract", () => {
  assert.equal(FLEET_ERROR_BUDGET_POLICY.windowHours, 24);
  assert.equal(FLEET_ERROR_BUDGET_POLICY.fatalEventBudget, 0);
  assert.equal(FLEET_ERROR_BUDGET_POLICY.alertEventBudget, 0);
  assert.equal(FLEET_ERROR_BUDGET_POLICY.repeatFingerprintAlertCount, 5);
  assert.equal(FLEET_ERROR_BUDGET_POLICY.repeatFingerprintWindowMinutes, 1);
});

test("missing telemetry remains unknown instead of being reported as healthy", () => {
  assert.deepEqual(evaluateFleetErrorBudget(null), {
    status: "no-data",
    label: "No data",
    fatalEvents: 0,
    alertEvents: 0,
    budgetUsed: 0,
    explanation: "No release telemetry is available for this 24-hour window."
  });
});

test("ordinary sampled errors without alerts remain within budget", () => {
  const result = evaluateFleetErrorBudget({
    events_24h: 12,
    fatal_events_24h: 0,
    alerts_24h: 0
  });
  assert.equal(result.status, "within-budget");
  assert.equal(result.budgetUsed, 0);
});

test("one fatal or repeat alert breaches the zero-tolerance operational budget", () => {
  const fatal = evaluateFleetErrorBudget({
    fatal_events_24h: 1,
    alerts_24h: 1
  });
  assert.equal(fatal.status, "breached");
  assert.equal(fatal.budgetUsed, 1);

  const repeated = evaluateFleetErrorBudget({
    fatal_events_24h: 0,
    alerts_24h: 3
  });
  assert.equal(repeated.status, "breached");
  assert.equal(repeated.budgetUsed, 3);
});
