import assert from "node:assert/strict";
import test from "node:test";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import {
  HEART_WORD_ACTIVITY_TYPES as EVIDENCE_HEART_WORD_ACTIVITY_TYPES
} from "../../src/features/soundSeekers/engine/evidenceEligibility.js";
import {
  HEART_WORD_ACTIVITY_TYPES,
  SOUND_SEEKERS_HEART_WORDS
} from "../../src/features/soundSeekers/content/heartWords.js";
import { getPronunciation } from "../../src/features/soundSeekers/content/pronunciationLexicon.js";

const EXPECTED_HEART_INTRODUCTION_SCHEDULE = {
  s1: ["a"], s3: ["I", "the"], s4: ["is"], s5: ["to", "go"],
  s6: ["my", "and"], s7: ["he", "she"], s8: ["we", "me"],
  s9: ["be", "was"], s10: ["no", "you"], s11: ["they", "all"],
  s12: ["her", "are"], s13: ["said", "so"], s14: ["have", "like"],
  s15: ["some", "come"], s16: ["were", "there"], s17: ["little", "one"],
  s18: ["do", "when"], s19: ["out", "what"], s20: ["oh", "their"],
  s21: ["people", "called"], s22: ["looked", "asked"],
  s23: ["your", "water"], s24: ["where", "who"],
  s25: ["again", "thought"], s26: ["through", "work"],
  s27: ["any", "many"], s28: ["laughed", "because"],
  s29: ["different", "eyes"], s30: ["friends", "once"],
  s31: ["please", "could"], s32: ["would", "should"]
};

function introductionWordsByStop() {
  return Object.fromEntries([...new Set(SOUND_SEEKERS_HEART_WORDS
    .map(record => record.introductionStopId))].map(stopId => [
    stopId,
    SOUND_SEEKERS_HEART_WORDS.filter(record => record.introductionStopId === stopId)
      .map(record => record.display)
  ]));
}

test("the canonical sixty words are partitioned truthfully", () => {
  const declared = new Set(QUEST_STOPS.flatMap(stop => stop.heartWords.map(word => word.toLowerCase())));
  assert.strictEqual(HEART_WORD_ACTIVITY_TYPES, EVIDENCE_HEART_WORD_ACTIVITY_TYPES);
  assert.equal(declared.size, 60);
  assert.equal(SOUND_SEEKERS_HEART_WORDS.length, 60);
  assert.deepEqual(new Set(SOUND_SEEKERS_HEART_WORDS.map(item => item.display.toLowerCase())), declared);

  for (const record of SOUND_SEEKERS_HEART_WORDS) {
    const pronunciation = getPronunciation(record.pronunciationId);
    assert.ok(pronunciation, record.recordId);
    assert.equal(record.meaningId, pronunciation.meaningId);
    assert.deepEqual(
      [...record.regularParts, ...record.heartParts].sort((a, b) => a - b),
      pronunciation.units.map((_, index) => index),
      record.recordId
    );
    assert.equal(record.heartParts.every(index => pronunciation.units[index].role === "irregular"), true);
    assert.equal(record.regularParts.every(index => pronunciation.units[index].role !== "irregular"), true);
    const expectedActivities = record.heartParts.length
      ? HEART_WORD_ACTIVITY_TYPES
      : HEART_WORD_ACTIVITY_TYPES.filter(activity => activity !== "heart_part_mapping");
    assert.deepEqual(record.eligibleActivityTypes, expectedActivities);
    assert.deepEqual(Object.keys(record.answerTokensByActivity), expectedActivities);
    assert.equal(Object.isFrozen(record), true);
  }
  assert.equal(SOUND_SEEKERS_HEART_WORDS.find(item => item.recordId === "hw:a").regularParts.length, 0);
  assert.equal(SOUND_SEEKERS_HEART_WORDS.find(item => item.recordId === "hw:and").heartParts.length, 0);
});

test("the independent introduction schedule is exact and capped at two", () => {
  assert.deepEqual(introductionWordsByStop(), EXPECTED_HEART_INTRODUCTION_SCHEDULE);
  for (const [stopId, words] of Object.entries(EXPECTED_HEART_INTRODUCTION_SCHEDULE)) {
    assert.ok(words.length <= 2, stopId);
    words.forEach((word, index) => {
      const record = SOUND_SEEKERS_HEART_WORDS.find(item => item.display === word);
      assert.equal(record.introductionSlotId, `heart-slot-${stopId}-${index + 1}`);
      assert.deepEqual(record.slotIds, [record.introductionSlotId]);
    });
  }
});
