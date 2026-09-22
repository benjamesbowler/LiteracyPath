import assert from "node:assert/strict";
import test from "node:test";
import { getAssessmentStimulusAudioText, hasAudioOnlyChoices, normalizeAssessmentAudioRoles } from "../../src/utils/assessmentAudioPolicy.js";
import { importV3Bank, listV3PublishedSkillIds } from "../../src/data/v3/v3Registry.js";
import { normalizeV3Question } from "../../src/data/loadAssessmentSkillBank.js";
import { enrichQuestionWithExistingMedia } from "../../src/data/questionMediaResolver.js";
import { getAnswerOptionMedia, getAnswerOptionValue } from "../../src/utils/answerOptions.js";
import { normalizeAssessmentQuestion } from "../../src/appState/assessmentRuntime.js";
import { createAssessmentSessionMediaUsage, resolveQuestionMediaDynamically, validateResolvedQuestionMedia } from "../../src/data/assessmentMediaPicker.js";

test("an answer or recording path alone never creates a listening stimulus", () => {
  for (const question of [
    { answer: "big", choices: ["dig", "bin", "big", "bag"] },
    { answer: "bed", audioPath: "/audio/production/en-US/isolated_word/bed.mp3" },
    { correctAnswer: "cold", audioUrl: "/audio/cold.mp3" }
  ]) {
    assert.equal(getAssessmentStimulusAudioText(question), "");
    assert.equal(getAssessmentStimulusAudioText(normalizeAssessmentAudioRoles(question)), "");
  }
});

test("authored listening targets survive even when the target is the correct answer", () => {
  assert.equal(getAssessmentStimulusAudioText({ targetWord: "the", answer: "the" }), "the");
  assert.equal(getAssessmentStimulusAudioText({ targetWord: "cat", answer: "hat" }), "cat");
  assert.equal(getAssessmentStimulusAudioText({ audioText: "The cat sat.", targetWord: "cat" }), "The cat sat.");
  assert.equal(getAssessmentStimulusAudioText({ targetWord: "bed", suppressStimulusAudio: true }), "");
});

test("every published bank keeps its scoring key independent of target replay", async () => {
  for (const skill of listV3PublishedSkillIds()) {
    for (const item of await importV3Bank(skill)) {
      const before = getAssessmentStimulusAudioText(item);
      const alteredKey = { ...item, answer: "A DIFFERENT SCORING KEY", correctAnswer: "ANOTHER KEY" };
      assert.equal(getAssessmentStimulusAudioText(alteredKey), before, item.id);
      if (!item.audioText && !item.targetWord) assert.equal(before, "", item.id);
      const delivered = normalizeV3Question(item, skill);
      const changedKey = normalizeV3Question(alteredKey, skill);
      assert.equal(getAssessmentStimulusAudioText(delivered), before, `runtime ${item.id}`);
      assert.equal(getAssessmentStimulusAudioText(changedKey), before, `runtime changed key ${item.id}`);
      if (!before) for (const field of ["audio", "audioPath", "audioUrl"]) assert.equal(delivered[field], undefined, `${item.id} ${field}`);
    }
  }
});

test("audio-only choice presentation requires both hidden print and an audio evidence declaration", () => {
  assert.equal(hasAudioOnlyChoices({ hideWrittenLabels: true, evidenceModality: "audio" }), true);
  assert.equal(hasAudioOnlyChoices({ hideWrittenLabels: true, evidenceModality: "audio+image" }), false);
  assert.equal(hasAudioOnlyChoices({ evidenceModality: "audio" }), false);
});

test("the delivery pipeline preserves reviewed choices and rejects inferred pictures", async () => {
  const blends = await importV3Bank("blends");
  const spellingContrast = blends.find(item => item.id === "lp3.blends.l2.B.nt.v2");
  assert.ok(spellingContrast, "the heard tent/ten contrast must be present");
  assert.equal(spellingContrast.v3AuthoredMedia.cards, false);
  assert.equal(spellingContrast.answerOptions.some(option => getAnswerOptionMedia(option).image), false);
  const legacy = enrichQuestionWithExistingMedia(spellingContrast);
  assert.ok(legacy.answerOptions.some(option => getAnswerOptionMedia(option).image),
    "the regression fixture must exercise actual legacy image inference");

  let nonvisualItems = 0;
  let authoredPictureItems = 0;
  const sessionUsage = createAssessmentSessionMediaUsage();
  for (const skill of listV3PublishedSkillIds()) {
    for (const item of await importV3Bank(skill)) {
      const prepared = normalizeAssessmentQuestion(normalizeV3Question(item, skill), skill);
      const delivered = resolveQuestionMediaDynamically(prepared, {
        skillId: skill, level: item.level, phase: item.phase, sessionUsage
      });
      assert.deepEqual(delivered.choices, item.choices, `${item.id} preserves reviewed choices and order`);
      assert.deepEqual(delivered.distractorRationales, item.distractorRationales, `${item.id} preserves choice rationales`);
      assert.equal(delivered.answer, item.answer, `${item.id} preserves the scoring key`);
      assert.equal(getAssessmentStimulusAudioText(delivered), getAssessmentStimulusAudioText(item),
        `${item.id} keeps replay independent of the scoring key`);
      assert.deepEqual(validateResolvedQuestionMedia(delivered), [], `${item.id} resolves its reviewed media`);
      assert.deepEqual((delivered.answerOptions || []).map(getAnswerOptionValue),
        (item.answerOptions || []).map(getAnswerOptionValue), `${item.id} preserves answer values and order`);
      if (item.v3AuthoredMedia?.cards === false) {
        nonvisualItems++;
        assert.equal(delivered.imageCards, undefined, `${item.id} inferred image cards`);
        assert.equal(delivered.choiceImages, undefined, `${item.id} inferred choice images`);
        for (const option of delivered.answerOptions || []) {
          assert.equal(getAnswerOptionMedia(option).image, "", `${item.id} option ${getAnswerOptionValue(option)}`);
        }
      } else if (item.v3AuthoredMedia?.cards && item.imageCards?.length) {
        authoredPictureItems++;
        assert.deepEqual(delivered.imageCards.map(card => [getAnswerOptionValue(card), getAnswerOptionMedia(card).image]),
          item.imageCards.map(card => [getAnswerOptionValue(card), getAnswerOptionMedia(card).image]),
          `${item.id} preserves reviewed picture choices`);
      }
    }
  }
  assert.ok(nonvisualItems > 0, "must exercise published nonvisual choices");
  assert.ok(authoredPictureItems > 0, "must exercise published picture choices");
});
