import test from "node:test";
import assert from "node:assert/strict";
import { baseQuestState } from "../../src/utils/questProgress.js";
import { resolveQuestQuality } from "../../src/utils/questPerformance.js";
import { freeRoamReviewPlan } from "../../src/utils/questReviewMode.js";
import {
  addQuestActiveTime,
  beginQuestSession,
  endQuestSession,
  questTelemetryTotals,
  recordQuestTelemetryAnswer,
  recordQuestTelemetryStop
} from "../../src/utils/questTelemetry.js";
import { buildQuestMasteryReport } from "../../src/utils/questReport.js";

test("performance tiers respect explicit accessibility and low-device signals", () => {
  assert.equal(resolveQuestQuality({ displayMode: "2d" }).id, "2d");
  assert.equal(resolveQuestQuality({ displayMode: "rich", deviceMemory: 1 }).id, "rich");
  assert.equal(resolveQuestQuality({ deviceMemory: 2, hardwareConcurrency: 2 }).id, "low");
  assert.equal(resolveQuestQuality({ deviceMemory: 8, hardwareConcurrency: 8, width: 1280 }).id, "rich");
  assert.equal(resolveQuestQuality({ webglAvailable: false }).id, "2d");
});

test("free roam is built from the child's weakest attempted sounds", () => {
  const state = baseQuestState();
  state.mastery = {
    s: { seen: 8, correct: 7, state: "practising" },
    a: { seen: 6, correct: 2, state: "learning" },
    t: { seen: 10, correct: 6, state: "at-risk" }
  };
  const plan = freeRoamReviewPlan(state, 2);
  assert.deepEqual(plan.targets, ["a", "t"]);
  assert.equal(plan.weakest[0].target, "a");
  assert.ok(plan.stopId.startsWith("s"));
});

test("quest sessions bank active time, responses, stops, and review mode", () => {
  let state = beginQuestSession(baseQuestState(), {
    id: "session-1",
    at: "2026-07-14T08:00:00.000Z",
    mode: "review",
    qualityTier: "balanced",
    stopId: "s3"
  });
  state = addQuestActiveTime(state, 125000, "2026-07-14T08:01:00.000Z");
  state = recordQuestTelemetryAnswer(state, true);
  state = recordQuestTelemetryAnswer(state, false);
  state = recordQuestTelemetryStop(state, "s3");
  state = endQuestSession(state, { at: "2026-07-14T08:02:00.000Z", reason: "review_complete" });
  const totals = questTelemetryTotals(state.telemetry);
  assert.equal(totals.activeMs, 60000, "a single heartbeat is capped to one minute");
  assert.equal(totals.answers, 2);
  assert.equal(totals.correct, 1);
  assert.equal(totals.stopsCompleted, 1);
  assert.equal(totals.reviewSessions, 1);
});

test("teacher report combines journey, mastery, and time-on-task evidence", () => {
  const state = baseQuestState();
  state.trail.stopsDone = ["s1", "s2"];
  state.trail.stars = { s1: 3, s2: 2 };
  state.mastery = {
    s: { seen: 10, correct: 9, state: "mastered" },
    a: { seen: 8, correct: 4, state: "learning" }
  };
  state.telemetry.sessions = [{
    id: "session-1",
    mode: "journey",
    activeMs: 180000,
    answers: 18,
    correct: 13,
    stopsCompleted: 2,
    lastActiveAt: "2026-07-14T08:03:00.000Z"
  }];
  const report = buildQuestMasteryReport(state);
  assert.equal(report.stopsCompleted, 2);
  assert.equal(report.stars, 5);
  assert.equal(report.stonesLit, 1);
  assert.equal(report.timeOnTask, "3 min");
  assert.deepEqual(report.currentFocus, ["a", "s"]);
});
