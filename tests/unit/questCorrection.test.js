import test from "node:test";
import assert from "node:assert/strict";
import {
  CORRECTION_MODES,
  completeTeachBack,
  correctionKey,
  correctionPresentation,
  nextQueuedReview,
  normalizeCorrection,
  recordCorrectionMiss
} from "../../src/utils/questCorrection.js";

const stage = {
  prompt: "Find m.",
  help: "Listen and choose.",
  items: [
    { id: "m", label: "m", correct: true },
    { id: "b", label: "b", correct: false },
    { id: "t", label: "t", correct: false },
    { id: "a", label: "a", correct: false }
  ]
};

test("correction escalates from retry to two choices to teach-back", () => {
  const first = recordCorrectionMiss(null, "b");
  const second = recordCorrectionMiss(first, "t");
  const third = recordCorrectionMiss(second, "a");

  assert.equal(first.mode, CORRECTION_MODES.RETRY);
  assert.equal(second.mode, CORRECTION_MODES.NARROW);
  assert.equal(correctionPresentation(stage, second).visibleIds.length, 2);
  assert.equal(third.mode, CORRECTION_MODES.TEACH);
  assert.deepEqual(correctionPresentation(stage, third).visibleIds, ["m"]);

  const guided = completeTeachBack(third);
  assert.equal(guided.mode, CORRECTION_MODES.GUIDED);
  assert.equal(correctionPresentation(stage, guided).needsLaterReview, true);
});

test("correction state is robust and task keys separate every physical stage", () => {
  assert.deepEqual(normalizeCorrection({ misses: -9, mode: "nonsense" }), {
    misses: 0,
    mode: CORRECTION_MODES.DISCOVER,
    lastWrongId: null
  });
  assert.equal(correctionKey({ id: "friend" }, 2, 1), "friend:2:1");
});

test("later review queues each taught-back beat once", () => {
  assert.equal(nextQueuedReview([2, 0, 2], []), 2);
  assert.equal(nextQueuedReview([2, 0, 2], [2]), 0);
  assert.equal(nextQueuedReview([2, 0, 2], [2, 0]), null);
});
