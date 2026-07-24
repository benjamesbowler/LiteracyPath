import assert from "node:assert/strict";
import test from "node:test";

import {
  LEARNING_POLICY_VERSION,
  STUDENT_HOME_RECOMMENDATION_POLICY,
  selectStudentHomeRecommendation
} from "../../src/policy/learningPolicy.js";

const ACTIVITIES = Object.freeze([
  { id: "sound-seekers" },
  { id: "phonics-learning" },
  { id: "adventure-map", missionKind: "quest" },
  { id: "arcade", missionKind: "game" },
  { id: "story-quests" },
  { id: "reading-library", missionKind: "book" },
  { id: "my-hollow" }
]);

test("student-home policy recommends the first incomplete daily mission step", () => {
  const result = selectStudentHomeRecommendation({
    activities: ACTIVITIES,
    missionStatus: { done: { quest: false, book: false, game: false }, missionComplete: false }
  });

  assert.equal(result.primary.id, "adventure-map");
  assert.equal(result.source, "daily-mission:quest");
  assert.deepEqual(result.secondary.map(activity => activity.id), ["reading-library", "arcade"]);
  assert.equal(result.explore.length, 4);
  assert.equal(result.policyId, STUDENT_HOME_RECOMMENDATION_POLICY.id);
  assert.equal(result.policyVersion, LEARNING_POLICY_VERSION);
});

test("student-home policy advances past completed and unavailable mission steps", () => {
  const result = selectStudentHomeRecommendation({
    activities: ACTIVITIES.map(activity => (
      activity.id === "reading-library" ? { ...activity, available: false } : activity
    )),
    missionStatus: { done: { quest: true, book: false, game: false }, missionComplete: false }
  });

  assert.equal(result.primary.id, "arcade");
  assert.equal(result.source, "daily-mission:game");
  assert.equal(
    [...result.secondary, ...result.explore].some(activity => activity.id === "reading-library"),
    false
  );
});

test("student-home policy uses the stable fallback after the daily mission", () => {
  const result = selectStudentHomeRecommendation({
    activities: ACTIVITIES,
    missionStatus: { done: { quest: true, book: true, game: true }, missionComplete: true }
  });

  assert.equal(result.primary.id, "sound-seekers");
  assert.equal(result.source, "daily-mission-complete:fallback");
  assert.deepEqual(result.secondary.map(activity => activity.id), [
    "phonics-learning",
    "adventure-map"
  ]);
});

test("student-home policy partitions every available activity exactly once", () => {
  const result = selectStudentHomeRecommendation({
    activities: ACTIVITIES,
    missionStatus: { done: { quest: false, book: false, game: false } }
  });
  const ids = [
    result.primary.id,
    ...result.secondary.map(activity => activity.id),
    ...result.explore.map(activity => activity.id)
  ];

  assert.equal(new Set(ids).size, ACTIVITIES.length);
  assert.deepEqual(new Set(ids), new Set(ACTIVITIES.map(activity => activity.id)));
  assert.equal(result.secondary.length, 2);
});

test("student-home policy rejects ambiguous duplicate activity ids", () => {
  assert.throws(
    () => selectStudentHomeRecommendation({
      activities: [{ id: "arcade" }, { id: "arcade" }]
    }),
    /Duplicate student-home activity id/
  );
});

test("student-home policy fails closed when no activity is available", () => {
  const result = selectStudentHomeRecommendation({
    activities: [{ id: "arcade", available: false }]
  });

  assert.equal(result.primary, null);
  assert.equal(result.source, "no-available-activity");
  assert.deepEqual(result.secondary, []);
  assert.deepEqual(result.explore, []);
});
