import test from "node:test";
import assert from "node:assert/strict";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import {
  SOUND_SEEKERS_REVIEW_SEQUENCES,
  getReviewSequence
} from "../../src/features/soundSeekers/content/reviewSequences.js";

const EXPECTED_S8_TARGETS = [
  "a", "m", "t", "s", "n", "i", "f", "d", "o", "l", "r", "h", "b", "w", "qu", "u",
  "c", "g", "p", "y", "x", "e", "v", "k", "j", "z", "ff", "ll", "ss", "zz"
];

const EXPECTED_S17_TARGETS = [
  "sh", "ch", "th", "ng", "nk", "ck", "wh", "nd", "st", "mp", "ft", "sp", "sn", "sk",
  "sm", "sw", "bl", "cl", "fl", "gl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "pr", "tr",
  "y_ie", "y_ee"
];

test("review stops publish one deterministic sequence for the targets introduced since the prior review", () => {
  assert.deepEqual(Object.keys(SOUND_SEEKERS_REVIEW_SEQUENCES), ["s8", "s17"]);
  assert.deepEqual(getReviewSequence("s8").targetIds, EXPECTED_S8_TARGETS);
  assert.deepEqual(getReviewSequence("s17").targetIds, EXPECTED_S17_TARGETS);
  assert.equal(getReviewSequence("s18"), null);
});

test("review sequences contain unique targets taught before their review stop", () => {
  for (const sequence of Object.values(SOUND_SEEKERS_REVIEW_SEQUENCES)) {
    const reviewStop = QUEST_STOPS.find(stop => stop.id === sequence.stopId);
    const taughtBefore = new Set(QUEST_STOPS
      .filter(stop => stop.index < reviewStop.index)
      .flatMap(stop => stop.teach.map(item => item.id)));

    assert.equal(new Set(sequence.targetIds).size, sequence.targetIds.length, sequence.stopId);
    for (const targetId of sequence.targetIds) {
      assert.ok(taughtBefore.has(targetId), `${sequence.stopId}:${targetId}`);
    }
    assert.equal(Object.isFrozen(sequence), true);
    assert.equal(Object.isFrozen(sequence.targetIds), true);
  }
});
