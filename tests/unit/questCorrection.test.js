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

const v2Miss = overrides => ({
  targetId: "short_i",
  domain: "phoneme_to_grapheme",
  selected: "short_e",
  intended: "short_i",
  ...overrides
});

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
    { missCount: 2, targetId: "short_i", domain: "phoneme_to_grapheme" },
    v2Miss()
  );

  assert.equal(correction.modelOnce, true);
  assert.equal(correction.requiresFreshAttempt, true);
  assert.equal(correction.supportLevel, 3);
  assert.equal(correction.missCount, 3);
});

test("the correction ladder preserves the contrast then queues another legitimate domain", () => {
  const first = nextCorrection({}, v2Miss());
  assert.equal(first.supportLevel, 1);
  assert.equal(first.replayContrast, true);
  assert.equal(first.selected, "short_e");

  const second = nextCorrection(first, v2Miss({ selected: "short_a", position: "middle" }));
  assert.equal(second.supportLevel, 2);
  assert.equal(second.isolatePosition, "middle");
  assert.equal(second.reduceIrrelevantLoad, true);

  const later = nextCorrection(
    { missCount: 3, targetId: "short_i", domain: "phoneme_to_grapheme" },
    v2Miss({ eligibleDomains: ["phoneme_to_grapheme", "grapheme_to_phoneme"] })
  );
  assert.equal(later.queueIsomorphicReview, true);
  assert.equal(later.reviewDomain, "grapheme_to_phoneme");
});

test("later correction review fails closed without an alternate legitimate domain", () => {
  const correction = nextCorrection(
    { missCount: 3, targetId: "short_i", domain: "phoneme_to_grapheme" },
    v2Miss({ eligibleDomains: ["phoneme_to_grapheme", "collision"] })
  );
  assert.equal(correction.queueIsomorphicReview, false);
  assert.equal(correction.reviewDomain, null);
  assert.equal(correction.reviewTargetId, null);
});

test("later correction review fails closed when its prior domain is not legitimate", () => {
  const correction = nextCorrection(
    { missCount: 3, targetId: "short_i", domain: "collision" },
    v2Miss({ domain: "collision", eligibleDomains: ["phoneme_to_grapheme"] })
  );
  assert.equal(correction, null);
});

test("Word Forge preserves the exact numeric missed position as misses move through a word", () => {
  const first = nextCorrection({}, {
    targetId: "word:letter",
    wordId: "letter",
    domain: "word_segmentation_encoding",
    selected: "e",
    intended: "t",
    position: 2
  });
  assert.equal(first.targetId, "word:letter");
  assert.equal(first.wordId, "letter");
  assert.equal(first.position, 2);

  const second = nextCorrection(first, {
    targetId: "word:letter",
    wordId: "letter",
    domain: "word_segmentation_encoding",
    selected: "r",
    intended: "t",
    position: 3
  });
  assert.equal(second.position, 3);
  assert.equal(second.isolatePosition, 3);
  assert.equal(second.targetId, "word:letter");
});

test("duplicate letter tiles retain their word slot and queue the canonical construct, not the answer token", () => {
  const resumed = {
    evidenceKind: "practice",
    missCount: 3,
    targetId: "word:letter",
    wordId: "letter",
    domain: "word_segmentation_encoding",
    position: 3
  };
  const later = nextCorrection(resumed, {
    targetId: "word:letter",
    wordId: "letter",
    domain: "word_segmentation_encoding",
    selected: "tile:t:first",
    intended: "t",
    position: 3,
    eligibleDomains: ["word_segmentation_encoding", "word_decoding"]
  });

  assert.equal(later.reviewTargetId, "word:letter");
  assert.notEqual(later.reviewTargetId, later.intended);
  assert.equal(later.reviewWordId, "letter");
  assert.equal(later.reviewPosition, 3);
  assert.equal(later.reviewEvidenceKind, "practice");
  assert.deepEqual(later.review, {
    targetId: "word:letter",
    wordId: "letter",
    position: 3,
    domain: "word_decoding",
    evidenceKind: "practice"
  });
  assert.equal("formalStatus" in later, false);
  assert.doesNotMatch(JSON.stringify(later), /secure/iu);
});

test("a modeled correction resumes into one fresh supported attempt without losing construct identity", () => {
  const third = nextCorrection({
    evidenceKind: "practice",
    missCount: 2,
    targetId: "word:letter",
    wordId: "letter",
    domain: "word_segmentation_encoding",
    position: 2
  }, {
    targetId: "word:letter",
    wordId: "letter",
    domain: "word_segmentation_encoding",
    selected: "e",
    intended: "t",
    position: 2
  });
  assert.equal(third.modelOnce, true);
  assert.equal(third.requiresFreshAttempt, true);

  const resumed = JSON.parse(JSON.stringify(third));
  const freshAttempt = nextCorrection(resumed, {
    targetId: "word:letter",
    wordId: "letter",
    domain: "word_segmentation_encoding",
    selected: "e",
    intended: "t",
    eligibleDomains: ["word_segmentation_encoding", "word_decoding"]
  });
  assert.equal(freshAttempt.missCount, 4);
  assert.equal(freshAttempt.modelOnce, false);
  assert.equal(freshAttempt.requiresFreshAttempt, true);
  assert.equal(freshAttempt.position, 2);
  assert.equal(freshAttempt.reviewTargetId, "word:letter");
});

test("v2 correction payloads fail closed on missing or conflicting construct identity", () => {
  const validMiss = {
    targetId: "word:letter",
    wordId: "letter",
    domain: "word_segmentation_encoding",
    selected: "e",
    intended: "t",
    position: 2
  };
  assert.equal(nextCorrection({}, { ...validMiss, targetId: "" }), null);
  assert.equal(nextCorrection({}, { ...validMiss, domain: "collision" }), null);
  assert.equal(nextCorrection({}, { ...validMiss, position: -1 }), null);
  assert.equal(nextCorrection({}, { ...validMiss, intended: {} }), null);
  assert.equal(nextCorrection({}, { ...validMiss, evidenceKind: "assessment" }), null);
  assert.equal(nextCorrection({
    missCount: 1,
    targetId: "word:letter",
    wordId: "letter",
    domain: "word_segmentation_encoding",
    position: 2
  }, { ...validMiss, targetId: "" }), null);
  assert.equal(nextCorrection({
    missCount: 1,
    targetId: "word:letter",
    wordId: "letter",
    domain: "word_segmentation_encoding",
    position: 2
  }, { ...validMiss, domain: "collision" }), null);
  assert.equal(nextCorrection({
    missCount: 1,
    targetId: "word:letter",
    wordId: "letter",
    domain: "word_segmentation_encoding",
    position: 2
  }, { ...validMiss, targetId: "word:better" }), null);
});
