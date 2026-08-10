import test from "node:test";
import assert from "node:assert/strict";
import { buildImpactDashboard, impactDashboardCsv, MIN_COMPARABLE_LEARNERS } from "../../src/utils/impactDashboard.js";

function rows(studentId, correctCurrent, correctPrior) {
  const now = new Date("2026-08-09T12:00:00Z").getTime();
  return [...Array.from({ length: 5 }, (_, index) => ({ student_id: studentId, skill: "CVC", is_correct: index < correctCurrent, answered_at: new Date(now - (index + 1) * 86400000).toISOString() })), ...Array.from({ length: 5 }, (_, index) => ({ student_id: studentId, skill: "CVC", is_correct: index < correctPrior, answered_at: new Date(now - (30 + index) * 86400000).toISOString() }))];
}

test("observed change uses equal learner weights once the cohort floor is met", () => {
  const model = buildImpactDashboard({ answers: [...rows("a", 5, 2), ...rows("b", 3, 2), ...rows("c", 4, 2)], studentIds: ["a", "b", "c"], windowDays: 28, now: new Date("2026-08-09T12:00:00Z") });
  assert.equal(model.currentAccuracy, 80);
  assert.equal(model.priorAccuracy, 40);
  assert.equal(model.changePp, 40);
  assert.equal(model.comparableLearners, 3);
  assert.equal(model.minimumComparableLearners, MIN_COMPARABLE_LEARNERS);
});

test("class and skill headlines are suppressed below the comparable cohort floor", () => {
  const model = buildImpactDashboard({ answers: [...rows("a", 5, 2), ...rows("b", 3, 2)], studentIds: ["a", "b", "c"], windowDays: 28, now: new Date("2026-08-09T12:00:00Z") });
  assert.equal(model.comparableLearners, 2);
  assert.equal(model.changePp, null);
  assert.deepEqual(model.skills, []);
});

test("learners without five answers in both windows are excluded", () => {
  const model = buildImpactDashboard({ answers: rows("a", 5, 2).slice(0, 7), studentIds: ["a"], windowDays: 28, now: new Date("2026-08-09T12:00:00Z") });
  assert.equal(model.comparableLearners, 0);
  assert.equal(model.changePp, null);
});

test("CSV retains the non-causal claim and both evidence floors", () => {
  const model = buildImpactDashboard({ answers: rows("a", 5, 2), studentIds: ["a"], windowDays: 28, now: new Date("2026-08-09T12:00:00Z") });
  const csv = impactDashboardCsv(model);
  assert.match(csv, /observed_association_not_causal_impact/);
  assert.match(csv, /minimum_responses_per_learner_per_window/);
  assert.match(csv, /minimum_comparable_learners/);
});
