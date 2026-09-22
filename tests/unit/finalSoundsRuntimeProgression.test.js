import assert from "node:assert/strict";
import test from "node:test";

import { getFinalSoundQuestionLevel } from "../../src/appState/assessmentRuntime.js";
import { getFinalSoundsLevel1QuestionIssues, finalSoundLevelOneCommonWords } from "../../src/data/earlyPhonicsValidation.js";
import {
  buildFinalSoundAvailableWordMap,
  buildFinalSoundAvailabilitySummary,
  evaluateFinalSoundLevelOneMasteryDepth,
  finalSoundLevelOneTargets,
  getFinalSoundLevelOneRequiredContentWords
} from "../../src/data/finalSoundMasteryDepth.js";
import { loadAssessmentSkillBankCandidates } from "../../src/data/loadAssessmentSkillBank.js";
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";
import { LEDA_WORD_AUDIO } from "../../src/data/generated/ledaWordAudio.generated.js";
import { questions as finalSoundQuestions } from "../../src/data/v3/banks/final_sounds.v3.generated.js";
import { getEarlySkillRuntimeEligibilityIssues } from "../../src/utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";

const levelOneQuestions = finalSoundQuestions.filter(question => question.level === 1 && !question.retentionOnly);

test("published v3 Final Sounds Level 1 questions keep their authored level", () => {
  assert.ok(levelOneQuestions.length >= 40, "two full ten-item sittings per phase");
  for (const question of levelOneQuestions) {
    assert.equal(getFinalSoundQuestionLevel(question), 1, question.id);
  }
});

test("the Final Sounds Level 1 runtime guard understands every published response format", async () => {
  const runtimeLevelOneQuestions = (await loadAssessmentSkillBankCandidates("final_sounds"))
    .filter(question => question.level === 1 && !question.retentionOnly);
  const expectedFormats = new Set(["ENDING_SOUND", "ENDING_SOUND_WORD_MATCH", "FINAL_SOUND_PAIR_SELECT"]);
  assert.deepEqual(new Set(runtimeLevelOneQuestions.map(question => question.formatType)), expectedFormats);

  for (const question of runtimeLevelOneQuestions) {
    const issues = getEarlySkillRuntimeEligibilityIssues(question, {
      skillId: "final_sounds",
      level: 1,
      pathExists: () => true
    });
    assert.deepEqual(issues, [], `${question.id}: ${issues.join("; ")}`);
  }
});

test("Final Sounds mastery depth uses all published v3 variants without changing its evidence threshold", () => {
  for (const target of finalSoundLevelOneTargets) {
    assert.equal(getFinalSoundLevelOneRequiredContentWords(target), 3, target);
  }

  const summary = buildFinalSoundAvailabilitySummary(levelOneQuestions);
  for (const target of finalSoundLevelOneTargets) {
    assert.ok(summary[target].runtimeVariantCount >= 5, target);
    assert.equal(summary[target].contentGap, false, `${target} needs at least three distinct valid content words`);
  }

  const allCorrectEvidence = [...levelOneQuestions, ...levelOneQuestions].map((question, index) => ({
    ...question,
    questionId: `${question.id}-attempt-${index}`,
    stage: "Final Sounds",
    isCorrect: true
  }));
  const mastery = evaluateFinalSoundLevelOneMasteryDepth(allCorrectEvidence, {
    availableWordsBySound: buildFinalSoundAvailableWordMap(levelOneQuestions)
  });
  assert.equal(mastery.contentGaps.length, 0);
  assert.equal(mastery.allSoundsMastered, true);
  assert.equal(mastery.enoughSuccessfulRounds, true);
  assert.equal(mastery.levelOneMastered, true);
});

test("Final Sounds Level 1 has a positive reviewed common-word policy", () => {
  assert.deepEqual(Object.keys(finalSoundLevelOneCommonWords), finalSoundLevelOneTargets);
  for (const target of finalSoundLevelOneTargets) {
    assert.ok(finalSoundLevelOneCommonWords[target].length >= 4, target);
    assert.equal(new Set(finalSoundLevelOneCommonWords[target]).size, finalSoundLevelOneCommonWords[target].length, target);
  }
  const allWords = Object.values(finalSoundLevelOneCommonWords).flat();
  for (const rejected of ["bread", "flag", "frog", "whirlpool", "drum", "sheep", "sleep", "goat", "boat"]) {
    assert.equal(allWords.includes(rejected), false, rejected);
  }
});


test("all published Level 1 Final Sounds reserves obey the same vocabulary and ending rules", () => {
  for (const question of finalSoundQuestions.filter(item => item.level === 1 && item.retentionOnly)) {
    assert.deepEqual(getFinalSoundsLevel1QuestionIssues(question), [], question.id);
  }
});

test("heard-only final sounds need a reviewed contract and a real target recording", async () => {
  const question = (await loadAssessmentSkillBankCandidates("final_sounds"))
    .find(item => item.id === "lp3.final_sounds.l1.C.b.v6");
  const context = { skillId: "final_sounds", level: 1, pathExists: () => true };
  assert.deepEqual(getEarlySkillRuntimeEligibilityIssues(question, context), []);
  const noAudio = getEarlySkillRuntimeEligibilityIssues(question, {
    ...context, pathExists: path => !/\.(mp3|wav)$/i.test(path)
  });
  assert.ok(noAudio.some(issue => issue.includes("audio")), noAudio.join("; "));
  const noContract = getEarlySkillRuntimeEligibilityIssues({ ...question, assessmentMediaDecision: undefined }, context);
  assert.ok(noContract.some(issue => issue.includes("image")), noContract.join("; "));
});

test("runtime sound questions resolve the same approved production word clips as the renderer", async () => {
  const question = (await loadAssessmentSkillBankCandidates("initial_sounds"))
    .find(item => item.targetWord === "underpants");
  const withoutSerializedAudio = { ...question, audio: undefined, audioPath: undefined, audioUrl: undefined };
  assert.ok(getLedaWordAudioPath("underpants"));
  assert.deepEqual(getEarlySkillRuntimeEligibilityIssues(withoutSerializedAudio, { skillId: "initial_sounds", level: 1 }), []);
});

test("the compact word catalogue matches current production repairs without carrying narration", () => {
  for (const [text, audioPath] of Object.entries(LEDA_WORD_AUDIO)) {
    assert.ok(text.trim() && !/\s/u.test(text.trim()), `narration leaked into compact lookup: ${text}`);
    assert.equal(audioPath, getLedaWordAudioPath(text), `${text} must keep production repair and child-override priority`);
  }
  for (const word of ["iguana", "underpants", "undershirt", "pup", "bow", "zipper", "vase", "umbrella"]) {
    assert.ok(LEDA_WORD_AUDIO[word], `${word} must resolve without the full assessment audio catalogue`);
    assert.equal(LEDA_WORD_AUDIO[word], getLedaWordAudioPath(word), word);
  }
});

test("spoken rhyme choices need four distinct approved recordings", async () => {
  const question = (await loadAssessmentSkillBankCandidates("rhyming"))
    .find(item => item.id === "lp3.rhyming.l1.B.up.v2");
  const context = { skillId: "rhyming", level: 1, pathExists: () => true };
  assert.deepEqual(getEarlySkillRuntimeEligibilityIssues(question, context), []);
  const missingPup = getEarlySkillRuntimeEligibilityIssues(question, {
    ...context, pathExists: path => path !== getLedaWordAudioPath("pup")
  });
  assert.ok(missingPup.includes("runtime card set is incomplete"));
  const threeChoices = getEarlySkillRuntimeEligibilityIssues({ ...question, choices: question.choices.slice(0, 3) }, context);
  assert.ok(threeChoices.includes("runtime card set is incomplete"));
});

test("short-vowel runtime honors heard print choices while preserving required picture cards", async () => {
  const questions = await loadAssessmentSkillBankCandidates("short_vowel_discrimination");
  for (const question of questions) {
    const issues = getEarlySkillRuntimeEligibilityIssues(question, { skillId: "short_vowel_discrimination", level: question.level });
    assert.deepEqual(issues, [], `${question.id}: ${issues.join("; ")}`);
  }
  const pictured = questions.find(item => item.formatType === "SHORT_VOWEL_IMAGE_GROUP_SELECT");
  const broken = { ...pictured, imageCards: pictured.imageCards.slice(1) };
  assert.ok(getEarlySkillRuntimeEligibilityIssues(broken, { skillId: "short_vowel_discrimination", level: 2 }).includes("runtime card set is incomplete"));
});


test("printed CVC vowel classification uses its spoken anchor instruction without replaying a keyed word", async () => {
  const questions = (await loadAssessmentSkillBankCandidates("cvc_short_vowels"))
    .filter(item => item.formatType === "SHORT_VOWEL_WORD");
  assert.ok(questions.length >= 15);
  for (const question of questions) {
    assert.equal(question.targetWord, undefined);
    assert.equal(question.audioText, undefined);
    assert.equal(question.instructionAudioText, question.spokenPrompt);
    assert.equal(question.instructionAudioPath, getLedaInstructionAudioPath(question.spokenPrompt));
    const context = { skillId: "cvc_short_vowels", level: question.level };
    assert.deepEqual(getEarlySkillRuntimeEligibilityIssues(question, context), [], question.id);
    const missingInstruction = getEarlySkillRuntimeEligibilityIssues(question, {
      ...context, pathExists: path => path !== getLedaInstructionAudioPath(question.spokenPrompt)
    });
    assert.ok(missingInstruction.some(issue => issue.includes("audio")), question.id);
    for (const changed of [
      { instructionAudioPath: undefined },
      { instructionAudioText: undefined },
      { instructionAudioText: "Listen to a different vowel anchor." },
      { instructionAudioPath: getLedaWordAudioPath(question.answer) },
      { instructionAudioPath: undefined, audioPath: getLedaWordAudioPath(question.answer) }
    ]) {
      const invalidAnchor = getEarlySkillRuntimeEligibilityIssues({ ...question, ...changed }, context);
      assert.ok(invalidAnchor.some(issue => issue.includes("audio")), `${question.id}: ${JSON.stringify(changed)}`);
    }
  }
});
