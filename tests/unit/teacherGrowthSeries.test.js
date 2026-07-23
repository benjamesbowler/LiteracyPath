import assert from "node:assert/strict";
import test from "node:test";
import {
  GROWTH_METRICS,
  buildTeacherGrowthSeries
} from "../../src/utils/teacherGrowthSeries.js";

function attempt({
  id,
  date,
  skill,
  accuracy,
  version,
  supportUsed,
  wcpm = null,
  total = 10
}) {
  return {
    attempt_id: id,
    assessment_type: wcpm === null ? "skill_checkpoint" : "el_oral_reading_fluency",
    skill_id: wcpm === null ? skill : "el_oral_reading_fluency",
    skill_name: wcpm === null ? skill : "EL Benchmark Oral Reading Fluency",
    completed_at: date,
    total_questions: total,
    correct_count: Math.round((accuracy / 100) * total),
    accuracy,
    status: "passed",
    administration_status: "completed",
    payload: {
      curriculumVersion: version,
      ...(wcpm === null ? {} : { metrics: { wcpm } }),
      questionRecords: [{
        questionId: `${id}-item`,
        responseStatus: "correct",
        supportUsed,
        ...(wcpm === null ? {} : { wcpm })
      }]
    }
  };
}

const history = {
  attempts: [
    attempt({
      id: "a1",
      date: "2025-09-01T09:00:00.000Z",
      skill: "initial_sounds",
      accuracy: 90,
      version: "LP-CURRICULUM-2025.2",
      supportUsed: true
    }),
    attempt({
      id: "a2",
      date: "2025-10-01T09:00:00.000Z",
      skill: "initial_sounds",
      accuracy: 85,
      version: "LP-CURRICULUM-2025.2",
      supportUsed: true
    }),
    attempt({
      id: "a3",
      date: "2026-01-05T09:00:00.000Z",
      skill: "final_sounds",
      accuracy: 90,
      version: "LP-CURRICULUM-2026.1",
      supportUsed: false
    }),
    attempt({
      id: "a4",
      date: "2026-02-05T09:00:00.000Z",
      skill: "initial_sounds",
      accuracy: 95,
      version: "LP-CURRICULUM-2026.1",
      supportUsed: false
    }),
    attempt({
      id: "a5",
      date: "2026-04-10T09:00:00.000Z",
      skill: "cvc_short_vowels",
      accuracy: 80,
      version: "LP-CURRICULUM-2026.2",
      supportUsed: false
    }),
    attempt({
      id: "a6",
      date: "2026-05-10T09:00:00.000Z",
      skill: "final_sounds",
      accuracy: 92,
      version: "LP-CURRICULUM-2026.2",
      supportUsed: false
    }),
    attempt({
      id: "f1",
      date: "2025-10-15T09:00:00.000Z",
      skill: "fluency",
      accuracy: 100,
      version: "LP-CURRICULUM-2025.2",
      supportUsed: true,
      wcpm: 38,
      total: 1
    }),
    attempt({
      id: "f2",
      date: "2026-02-15T09:00:00.000Z",
      skill: "fluency",
      accuracy: 100,
      version: "LP-CURRICULUM-2026.1",
      supportUsed: false,
      wcpm: 52,
      total: 1
    }),
    attempt({
      id: "f3",
      date: "2026-06-15T09:00:00.000Z",
      skill: "fluency",
      accuracy: 100,
      version: "LP-CURRICULUM-2026.2",
      supportUsed: false,
      wcpm: 67,
      total: 1
    })
  ],
  interventions: [
    { id: "i1", status: "reviewed", outcome: "ineffective", reviewed_at: "2026-01-20T09:00:00.000Z" },
    { id: "i2", status: "reviewed", outcome: "partial", reviewed_at: "2026-03-20T09:00:00.000Z" },
    { id: "i3", status: "reviewed", outcome: "effective", reviewed_at: "2026-06-20T09:00:00.000Z" },
    { id: "i4", status: "recorded", outcome: "effective", recorded_at: "2026-06-21T09:00:00.000Z" }
  ]
};

test("growth model exposes all five dated evidence series without inventing values", () => {
  const model = buildTeacherGrowthSeries(history);
  assert.deepEqual(model.series.map(series => series.id), GROWTH_METRICS.map(metric => metric.id));

  const byId = new Map(model.series.map(series => [series.id, series]));
  assert.deepEqual(
    byId.get("skill-acquisition").points.map(point => point.value),
    [1, 2, 3]
  );
  assert.ok(byId.get("retention").points.length >= 3);
  assert.deepEqual(byId.get("fluency").points.map(point => point.value), [38, 52, 67]);
  assert.equal(byId.get("support-dependence").points[0].value, 100);
  assert.equal(byId.get("support-dependence").points.at(-1).value, 0);
  assert.deepEqual(
    byId.get("intervention-response").points.map(point => point.value),
    [0, 50, 100]
  );
  assert.equal(model.interventionCount, 3);
});

test("curriculum versions are unique, dated, and positioned on the shared axis", () => {
  const model = buildTeacherGrowthSeries(history);
  assert.deepEqual(
    model.markers.map(marker => marker.label),
    [
      "LP-CURRICULUM-2025.2",
      "LP-CURRICULUM-2026.1",
      "LP-CURRICULUM-2026.2"
    ]
  );
  assert.ok(model.markers.every(marker => marker.dateLabel && marker.x >= 0 && marker.x <= 100));
  assert.ok(model.markers[0].x < model.markers[1].x);
  assert.ok(model.markers[1].x < model.markers[2].x);
});

test("missing source evidence stays empty instead of becoming a flat zero trend", () => {
  const model = buildTeacherGrowthSeries({
    attempts: [{
      attempt_id: "partial",
      completed_at: "2026-07-01T09:00:00.000Z",
      skill_id: "initial_sounds",
      total_questions: 4,
      accuracy: 100,
      status: "in_progress",
      administration_status: "in_progress",
      payload: {}
    }],
    interventions: []
  });
  assert.equal(model.attemptCount, 0);
  assert.equal(model.markers.length, 0);
  assert.ok(model.series.every(series => series.points.length === 0));
  assert.ok(model.series.every(series => series.current === "No evidence"));
});
