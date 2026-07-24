import assert from "node:assert/strict";
import test from "node:test";

import {
  firstUncelebratedMissionStep,
  normalizeMissionCelebratedSteps,
  withMissionStepCelebrated
} from "../../src/utils/dailyMissionState.js";

test("daily mission identifies the first completed step that still needs its celebration", () => {
  assert.equal(
    firstUncelebratedMissionStep(
      { quest: true, book: true, game: false },
      ["quest"]
    ),
    "book"
  );
});

test("celebrating a step is durable, ordered, and idempotent", () => {
  const state = {
    done: { quest: true, book: true, game: false },
    celebratedSteps: []
  };
  const questCelebrated = withMissionStepCelebrated(state, "quest");
  const bookCelebrated = withMissionStepCelebrated(questCelebrated, "book");
  const repeated = withMissionStepCelebrated(bookCelebrated, "book");

  assert.deepEqual(bookCelebrated.celebratedSteps, ["quest", "book"]);
  assert.deepEqual(repeated.celebratedSteps, ["quest", "book"]);
  assert.equal(firstUncelebratedMissionStep(repeated.done, repeated.celebratedSteps), "");
});

test("a step cannot celebrate before it is complete", () => {
  const state = {
    done: { quest: true, book: false, game: false },
    celebratedSteps: ["quest"]
  };

  assert.equal(withMissionStepCelebrated(state, "book"), state);
  assert.deepEqual(
    normalizeMissionCelebratedSteps(["quest", "book", "unknown"], state.done),
    ["quest"]
  );
});

test("legacy fully celebrated missions do not replay old step celebrations", () => {
  assert.deepEqual(
    normalizeMissionCelebratedSteps(
      undefined,
      { quest: true, book: true, game: true },
      { missionAlreadyCelebrated: true }
    ),
    ["quest", "book", "game"]
  );
});
