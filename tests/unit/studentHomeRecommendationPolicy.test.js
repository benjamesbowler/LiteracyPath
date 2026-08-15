import assert from "node:assert/strict";
import test from "node:test";

import {
  STUDENT_HOME_RECOMMENDATION_POLICY,
  STUDENT_HOME_RECOMMENDATION_POLICY_VERSION,
  buildStudentHomeCardState,
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
  assert.equal(result.policyVersion, STUDENT_HOME_RECOMMENDATION_POLICY_VERSION);
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

test("an explicit teacher pick is the primary even while daily mission work remains", () => {
  const activities = ACTIVITIES.map(activity => (
    activity.id === "sound-seekers"
      ? { ...activity, cardState: { label: "Teacher picked", tone: "teacher" } }
      : activity
  ));
  const result = selectStudentHomeRecommendation({
    activities,
    missionStatus: { done: { quest: false, book: false, game: false }, missionComplete: false }
  });

  assert.equal(result.primary.id, "sound-seekers");
  assert.equal(result.source, "teacher-assignment:sound-seekers");
  assert.equal(result.childReason, "Your teacher picked this for you.");
  assert.deepEqual(result.secondary.map(activity => activity.id), [
    "adventure-map",
    "reading-library"
  ]);
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

test("teacher-picked Sound Seekers state wins while preserving a child-safe progress marker", () => {
  const state = buildStudentHomeCardState("sound-seekers", {
    soundSeekers: {
      assignment: { targets: ["m", "s", "m"] },
      trail: {
        stopsDone: Array.from({ length: 38 }, (_, index) => `s${index + 1}`)
      }
    }
  });

  assert.deepEqual(state, {
    label: "Teacher picked",
    tone: "teacher",
    progressText: "38 of 40 trails"
  });
});

test("card state distinguishes Continue from New without child-facing scores", () => {
  const adventure = buildStudentHomeCardState("adventure-map", {
    adventureMap: {
      cycles: {
        cycle1: { stars: 3 },
        cycle2: { stations: { first: true } }
      }
    }
  });
  const story = buildStudentHomeCardState("story-quests", {});

  assert.deepEqual(adventure, {
    label: "Continue",
    tone: "continue",
    progressText: "1 map stop complete"
  });
  assert.deepEqual(story, {
    label: "New",
    tone: "new",
    progressText: ""
  });
  assert.doesNotMatch(
    JSON.stringify([adventure, story]),
    /accuracy|high.?score|percent|%/i
  );
});

test("reading, arcade, phonics, story, and Hollow progress use completion counts, not raw scores", () => {
  const progress = {
    phonics: { a: "completed", m: "inprogress" },
    arcade: { games: { pop: { plays: 2, highScore: 999 } } },
    storyQuests: { one: { completed: true, updatedAt: "2026-07-24T00:00:00Z" } },
    readingLibrary: {
      one: { completed: true },
      two: {
        completedPages: 3,
        lastReadAt: "2026-07-24T08:00:00.000Z",
        readCount: 1
      },
      malformed: { lastPage: 999 }
    },
    hollow: {
      purchases: [{ id: "one" }],
      feeds: [],
      chests: [],
      layout: { equipped: {}, slots: {} }
    }
  };

  assert.equal(buildStudentHomeCardState("phonics-learning", progress).progressText, "1 letter complete");
  assert.equal(buildStudentHomeCardState("arcade", progress).progressText, "1 game tried");
  assert.equal(buildStudentHomeCardState("story-quests", progress).progressText, "1 story complete");
  assert.equal(buildStudentHomeCardState("reading-library", progress).progressText, "1 book read");
  assert.equal(buildStudentHomeCardState("my-hollow", progress).progressText, "1 change saved");
  assert.doesNotMatch(
    JSON.stringify([
      buildStudentHomeCardState("phonics-learning", progress),
      buildStudentHomeCardState("arcade", progress),
      buildStudentHomeCardState("story-quests", progress),
      buildStudentHomeCardState("reading-library", progress),
      buildStudentHomeCardState("my-hollow", progress)
    ]),
    /999|accuracy|high.?score|percent|%/i
  );
});
