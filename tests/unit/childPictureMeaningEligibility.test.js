import test from "node:test";
import assert from "node:assert/strict";
import { childWordAssets, getChildAudioPath, getChildWordAsset } from "../../src/data/childAssets.js";
import { childImageAssets, shortAEchoCavesQuestions } from "../../src/data/childActivityModels.js";
import { findAssessmentMediaCandidates } from "../../src/data/assessmentMediaRegistry.js";
import {
  hasCompleteVisualQuestionAssets,
  makeVisualCardChoiceQuestion,
  makeWordChoiceQuestion
} from "../../src/data/visualQuestionAssets.js";

test("ambiguous word pictures cannot satisfy a picture-choice contract", () => {
  for (const word of ["pun", "son", "uncle"]) {
    // A laughing mask is not a pun; an isolated boy/man does not show a
    // family relationship. A caption or recording cannot repair that cue.
    for (const options of [{}, { allowBlockedAssessmentImage: true }]) {
      const asset = getChildWordAsset(word, options);
      assert.equal(asset.image, "", word);
      assert.equal(asset.fallbackImage, "", word);
      assert.equal(asset.qaStatus, "excluded_ambiguous_word", word);
      assert.ok(asset.audio, `${word} audio remains available`);
    }
    assert.equal(Boolean(childImageAssets[word]?.image), false, word);
    // The registry also imports raw legacy manifests. It must not restore a
    // picture that the resolved child catalogue has excluded.
    assert.deepEqual(findAssessmentMediaCandidates({ word, mediaType: "image" }), [], word);
    const question = makeVisualCardChoiceQuestion({
      id: `picture-${word}`, choices: [word, "cat"], answer: word
    });
    assert.equal(hasCompleteVisualQuestionAssets(question), false, word);
  }
});

test("picture exclusions preserve legitimate heard-word and text practice", () => {
  for (const word of ["pun", "son", "uncle"]) {
    const question = makeWordChoiceQuestion({
      id: `heard-${word}`, choices: [word, "cat"], answer: word, audioWord: word
    });
    assert.ok(getChildAudioPath(word), word);
    assert.equal(question.answer, word);
    assert.deepEqual(question.choices, [word, "cat"]);
    assert.ok(question.audioPath, word);
    assert.equal(question.imagePath, "");
    assert.equal(hasCompleteVisualQuestionAssets(question), true);
  }
  const pan = shortAEchoCavesQuestions.find(question => question.id === "heard-word-mastery-pan");
  assert.equal(pan.formatType, "HEARD_WORD_TO_PRINT_MINIMAL_PAIR");
  assert.ok(pan.choices.some(choice => choice.word === "pun"));
  assert.ok(pan.choices.every(choice => !choice.image));
});

test("legacy child picture choices keep their authored source bindings after eligibility filtering", () => {
  for (const [word, raw] of Object.entries(childWordAssets)) {
    const resolved = getChildWordAsset(word);
    if (!resolved?.image && !resolved?.fallbackImage) {
      assert.equal(childImageAssets[word], undefined, word);
      continue;
    }
    assert.deepEqual(childImageAssets[word], {
      word, image: raw.image || raw.fallbackImage,
      fallbackImage: raw.fallbackImage, alt: raw.alt
    }, word);
  }
});
