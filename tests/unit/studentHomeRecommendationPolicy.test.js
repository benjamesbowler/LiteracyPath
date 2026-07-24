import assert from "node:assert/strict";
import test from "node:test";

import {
  LEARNING_POLICY_VERSION,
  STUDENT_HOME_RECOMMENDATION_POLICY,
  buildStudentHomeContinuation,
  countCompletedSoundSeekersTrails,
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

test("continuation CTA names the selected daily activity and remaining tasks", () => {
  const continuation = buildStudentHomeContinuation({
    activity: { id: "adventure-map", title: "Adventure Map", missionKind: "quest" },
    missionStatus: {
      done: { quest: false, book: false, game: true },
      doneCount: 1
    }
  });

  assert.equal(continuation.label, "Continue Adventure Map — 2 tasks left today");
  assert.equal(continuation.remaining, 2);
  assert.equal(continuation.goal, "daily mission tasks");
});

test("Sound Seekers continuation uses unique valid trail evidence", () => {
  const soundSeekersProgress = {
    trail: {
      stopsDone: [
        ...Array.from({ length: 38 }, (_, index) => `s${index + 1}`),
        "s38",
        "s41",
        "not-a-trail"
      ]
    }
  };
  const continuation = buildStudentHomeContinuation({
    activity: { id: "sound-seekers", title: "Sound Seekers" },
    soundSeekersProgress
  });

  assert.equal(countCompletedSoundSeekersTrails(soundSeekersProgress), 38);
  assert.equal(continuation.label, "Continue Sound Seekers — 2 trails left");
  assert.equal(continuation.remaining, 2);
  assert.equal(continuation.goal, "Sound Seekers trails");
});

test("Sound Seekers completion never reports a negative remainder", () => {
  const continuation = buildStudentHomeContinuation({
    activity: { id: "sound-seekers", title: "Sound Seekers" },
    soundSeekersProgress: {
      trail: {
        stopsDone: Array.from({ length: 40 }, (_, index) => `s${index + 1}`)
      }
    }
  });

  assert.equal(continuation.label, "Replay Sound Seekers — trail complete");
  assert.equal(continuation.remaining, 0);
});
