import assert from "node:assert/strict";
import test from "node:test";

import { getFinalSoundQuestionLevel } from "../../src/appState/assessmentRuntime.js";
import { finalSoundLevelOneCommonWords } from "../../src/data/earlyPhonicsValidation.js";
import {
  buildFinalSoundAvailableWordMap,
  buildFinalSoundAvailabilitySummary,
  evaluateFinalSoundLevelOneMasteryDepth,
  finalSoundLevelOneTargets,
  getFinalSoundLevelOneRequiredContentWords
} from "../../src/data/finalSoundMasteryDepth.js";
import { loadAssessmentSkillBankCandidates } from "../../src/data/loadAssessmentSkillBank.js";
import { questions as finalSoundQuestions } from "../../src/data/v3/banks/final_sounds.v3.generated.js";
import { getEarlySkillRuntimeEligibilityIssues } from "../../src/utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";

const levelOneQuestions = finalSoundQuestions.filter(question => question.level === 1 && !question.retentionOnly);

test("published v3 Final Sounds Level 1 questions keep their authored level", () => {
  assert.equal(levelOneQuestions.length, 32);
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

test("Final Sounds mastery depth matches the four-variant v3 bank", () => {
  for (const target of finalSoundLevelOneTargets) {
    assert.equal(getFinalSoundLevelOneRequiredContentWords(target), 3, target);
  }

  const summary = buildFinalSoundAvailabilitySummary(levelOneQuestions);
  for (const target of finalSoundLevelOneTargets) {
    assert.equal(summary[target].runtimeVariantCount, 4, target);
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
    assert.equal(finalSoundLevelOneCommonWords[target].length, 4, target);
    assert.equal(new Set(finalSoundLevelOneCommonWords[target]).size, 4, target);
  }
  const allWords = Object.values(finalSoundLevelOneCommonWords).flat();
  for (const rejected of ["bread", "flag", "frog", "whirlpool", "drum", "sheep", "sleep", "goat", "boat"]) {
    assert.equal(allWords.includes(rejected), false, rejected);
  }
});
