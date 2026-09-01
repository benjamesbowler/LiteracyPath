import assert from "node:assert/strict";
import test from "node:test";

import {
  getAnchorWord,
  hasAnchorChoiceLeakage,
  isListenChooseVowelQuestion as isRuntimeListenChooseVowelQuestion
} from "../../src/appState/assessmentRuntime.js";
import { isListenChooseVowelQuestion as isAudioListenChooseVowelQuestion } from "../../src/utils/assessmentAudioPolicy.js";

const revisedQuestion = {
  skillId: "short_vowel_discrimination",
  formatType: "LISTEN_CHOOSE_VOWEL",
  prompt: "Listen to the word. What vowel sound can you hear?"
};

test("listen-and-choose-vowel routing follows the assessment format rather than fragile prompt copy", () => {
  assert.equal(isRuntimeListenChooseVowelQuestion(revisedQuestion), true);
  assert.equal(isAudioListenChooseVowelQuestion(revisedQuestion), true);

  const alternateProperWording = {
    ...revisedQuestion,
    prompt: "Which vowel do you hear in the middle?"
  };
  assert.equal(isRuntimeListenChooseVowelQuestion(alternateProperWording), true);
  assert.equal(isAudioListenChooseVowelQuestion(alternateProperWording), true);
});

test("format routing does not widen to unrelated skills or question types", () => {
  assert.equal(isRuntimeListenChooseVowelQuestion({
    ...revisedQuestion,
    skillId: "initial_sounds"
  }), false);
  assert.equal(isRuntimeListenChooseVowelQuestion({
    ...revisedQuestion,
    formatType: "SHORT_VOWEL_WORD"
  }), false);
});

test("generic sound-comparison wording keeps its hidden spoken anchor available to runtime checks", () => {
  const pairQuestion = {
    skillId: "initial_sounds",
    formatType: "INITIAL_SOUND_PAIR_SELECT",
    prompt: "Which word has the same starting sound?",
    targetWord: "moon",
    choices: ["map", "net", "sun", "moon"]
  };

  assert.equal(getAnchorWord(pairQuestion), "moon");
  assert.equal(hasAnchorChoiceLeakage(pairQuestion), true);
  assert.equal(hasAnchorChoiceLeakage({
    ...pairQuestion,
    choices: ["map", "net", "sun", "fish"]
  }), false);
});
