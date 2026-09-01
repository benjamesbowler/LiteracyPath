import test from "node:test";
import assert from "node:assert/strict";
import {
  CORRECTION_MODES,
  completeTeachBack,
  correctionKey,
  correctionPresentation,
  nextQueuedReview,
  nextCorrection,
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

test("third miss models once then requires a fresh supported attempt", () => {
  const correction = nextCorrection(
    { missCount: 2, domain: "phoneme_to_grapheme" },
    { selected: "short_e", intended: "short_i" }
  );

  assert.equal(correction.modelOnce, true);
  assert.equal(correction.requiresFreshAttempt, true);
  assert.equal(correction.supportLevel, 3);
  assert.equal(correction.missCount, 3);
});

test("the correction ladder preserves the contrast then queues another legitimate domain", () => {
  const first = nextCorrection({}, { selected: "short_e", intended: "short_i" });
  assert.equal(first.supportLevel, 1);
  assert.equal(first.replayContrast, true);
  assert.equal(first.selected, "short_e");

  const second = nextCorrection(first, { selected: "short_a", intended: "short_i", position: "middle" });
  assert.equal(second.supportLevel, 2);
  assert.equal(second.isolatePosition, "middle");
  assert.equal(second.reduceIrrelevantLoad, true);

  const later = nextCorrection(
    { missCount: 3, domain: "phoneme_to_grapheme" },
    { selected: "short_e", intended: "short_i", eligibleDomains: ["phoneme_to_grapheme", "grapheme_to_phoneme"] }
  );
  assert.equal(later.queueIsomorphicReview, true);
  assert.equal(later.reviewDomain, "grapheme_to_phoneme");
});

test("later correction review fails closed without an alternate legitimate domain", () => {
  const correction = nextCorrection(
    { missCount: 3, domain: "phoneme_to_grapheme" },
    { selected: "short_e", intended: "short_i", eligibleDomains: ["phoneme_to_grapheme", "collision"] }
  );
  assert.equal(correction.queueIsomorphicReview, false);
  assert.equal(correction.reviewDomain, null);
  assert.equal(correction.reviewTargetId, null);
});

test("later correction review fails closed when its prior domain is not legitimate", () => {
  const correction = nextCorrection(
    { missCount: 3, domain: "collision" },
    { selected: "short_e", intended: "short_i", eligibleDomains: ["phoneme_to_grapheme"] }
  );
  assert.equal(correction.queueIsomorphicReview, false);
  assert.equal(correction.reviewDomain, null);
});
