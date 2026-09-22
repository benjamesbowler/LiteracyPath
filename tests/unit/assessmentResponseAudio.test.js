import assert from "node:assert/strict";
import test from "node:test";
import { allowsAssessmentChoiceAudio } from "../../src/utils/assessmentAudioPolicy.js";
import { importV3Bank } from "../../src/data/v3/v3Registry.js";

test("response audio cannot supply the printed letter or word the child must identify", async () => {
  for (const [skillId, formatType] of [
    ["initial_sounds", "FIRST_SOUND"], ["final_sounds", "ENDING_SOUND"],
    ["cvc_short_vowels", "MISSING_VOWEL_CVC"], ["cvc_short_vowels", "PICTURE_TO_PRINT_MATCH"],
    ["short_vowel_discrimination", "LISTEN_FIND_WORD"], ["blends", "MPD"],
    ["digraphs", "DIGRAPH_COMPLETE_WORD"], ["long_vowels", "SILENT_E_TRANSFORM"],
    ["vowel_teams", "CPS"], ["vowel_teams", "PTD"], ["r_controlled", "PICTURE_AUDIO_TO_PATTERN"]
  ]) assert.equal(allowsAssessmentChoiceAudio({ skillId, formatType }), false, `${skillId} ${formatType}`);
  for (const skill of ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"]) {
    const questions = (await importV3Bank(skill)).filter(q => q.level === 1 && !q.retentionOnly);
    assert.equal(questions.length, 75, `${skill} full L1 recognition bank`);
    for (const q of questions) assert.equal(allowsAssessmentChoiceAudio(q), false, q.id);
  }
});

test("spoken comparisons and oral access to meaning questions retain choice replay", async () => {
  for (const skill of ["rhyming", "sentence_comprehension", "inference", "adjectives"]) {
    for (const q of await importV3Bank(skill)) assert.equal(allowsAssessmentChoiceAudio(q), true, q.id);
  }
  for (const formatType of ["INITIAL_SOUND_PAIR_SELECT", "FINAL_SOUND_PAIR_SELECT", "ENDING_SOUND_WORD_MATCH", "BLEND_IMAGE_CHOICE", "DIGRAPH_IMAGE_CHOICE", "SHORT_VOWEL_IMAGE_GROUP_SELECT"]) {
    assert.equal(allowsAssessmentChoiceAudio({ formatType, constructClaim: "final_sound_discrimination" }), true);
  }
});
