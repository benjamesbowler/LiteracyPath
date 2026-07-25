import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSESSMENT_ROUND_DIVERSITY_BUDGET,
  getAssessmentItemKeyBudgetFailures,
  getAssessmentTemplateBudgetFailures,
  selectAssessmentRoundCandidate
} from "../../src/data/assessmentRoundSelector.js";

function question(id, template, target = id) {
  return {
    id,
    skillId: "final_sounds",
    itemType: "final_sound",
    itemKey: id,
    targetWord: target,
    prompt: `Prompt ${id}`,
    correctAnswer: id,
    choices: [id, `${id}-x`],
    formatType: template,
    templateType: template
  };
}

test("selector enforces the runtime template concentration budget when alternatives remain", () => {
  const selected = Array.from({ length: 5 }, (_, index) =>
    question(`ending-${index}`, "ENDING_SOUND")
  );
  const pool = [
    question("ending-next", "ENDING_SOUND"),
    question("word-match", "ENDING_SOUND_WORD_MATCH")
  ];

  const result = selectAssessmentRoundCandidate(pool, {
    selectedQuestions: selected,
    skillId: "final_sounds",
    roundLength: 15
  });

  assert.equal(ASSESSMENT_ROUND_DIVERSITY_BUDGET.maxTemplateShare, 0.35);
  assert.equal(result.maxTemplateCount, 5);
  assert.equal(result.question?.id, "word-match");
});

test("selector rejects exact signatures and caps repeated phoneme or item keys", () => {
  const prior = question("prior", "ENDING_SOUND", "cat");
  const repeatedSignature = { ...prior, id: "signature-copy" };
  const sameItemTwo = { ...question("same-item-two", "ENDING_SOUND_WORD_MATCH", "dog"), itemKey: "prior" };
  const sameItemThree = { ...question("same-item-three", "FINAL_SOUND_PAIR_SELECT", "map"), itemKey: "prior" };
  const repeatedItem = { ...question("repeat-item", "ENDING_SOUND_WORD_MATCH", "sun"), itemKey: "prior" };
  const safe = question("safe", "FINAL_SOUND_PAIR_SELECT", "hill");

  const result = selectAssessmentRoundCandidate(
    [repeatedItem, repeatedSignature, safe],
    {
      selectedQuestions: [prior, sameItemTwo, sameItemThree],
      skillId: "final_sounds",
      roundLength: 15
    }
  );

  assert.equal(result.question?.id, "safe");
  assert.equal(result.duplicateRelaxation, "none");
  assert.equal(result.maxItemKeyCount, 3);
});

test("selector caps repeated distractor sets when another set is available", () => {
  const selected = Array.from({ length: 5 }, (_, index) => ({
    ...question(`selected-${index}`, "ENDING_SOUND", `target-${index}`),
    choices: ["b", "d", "g", "t"]
  }));
  const repeatedSet = {
    ...question("repeated-set", "ENDING_SOUND", "fresh-target"),
    choices: ["b", "d", "g", "t"]
  };
  const alternativeSet = {
    ...question("alternative-set", "ENDING_SOUND", "other-target"),
    choices: ["f", "m", "n", "p"]
  };
  const otherSets = Array.from({ length: 13 }, (_, index) => ({
    ...question(`other-set-${index}`, "ENDING_SOUND", `other-target-${index}`),
    choices: [`choice-${index}`, `choice-${index}-a`]
  }));

  const result = selectAssessmentRoundCandidate(
    [repeatedSet, alternativeSet, ...otherSets],
    {
      selectedQuestions: selected,
      skillId: "final_sounds",
      roundLength: 15
    }
  );

  assert.equal(result.maxOptionSetCount, 5);
  assert.equal(result.question?.id, "alternative-set");
});

test("template budget distinguishes avoidable concentration from a thin source pool", () => {
  const avoidableSelected = [
    ...Array.from({ length: 6 }, (_, index) => question(`a-${index}`, "ENDING_SOUND")),
    ...Array.from({ length: 4 }, (_, index) => question(`b-${index}`, "ENDING_SOUND_WORD_MATCH")),
    ...Array.from({ length: 5 }, (_, index) => question(`c-${index}`, "FINAL_SOUND_PAIR_SELECT"))
  ];
  const balancedPool = [
    ...avoidableSelected,
    ...Array.from({ length: 4 }, (_, index) => question(`b-more-${index}`, "ENDING_SOUND_WORD_MATCH"))
  ];
  assert.deepEqual(
    getAssessmentTemplateBudgetFailures(avoidableSelected, balancedPool, {
      skillId: "final_sounds",
      roundLength: 15
    }),
    [{ value: "ending_sound", count: 6, allowedCount: 5 }]
  );

  const thinPool = [
    ...Array.from({ length: 10 }, (_, index) => question(`a-thin-${index}`, "ENDING_SOUND")),
    ...Array.from({ length: 5 }, (_, index) => question(`b-thin-${index}`, "ENDING_SOUND_WORD_MATCH"))
  ];
  assert.deepEqual(
    getAssessmentTemplateBudgetFailures(thinPool, thinPool, {
      skillId: "final_sounds",
      roundLength: 15
    }),
    []
  );
});

test("selector preserves unique content keys before reusing a target variant", () => {
  const prior = question("dogs-one", "GRAMMAR_IMAGE_CHOICE", "dogs");
  prior.prompt = "Choose the word that matches the picture.";
  prior.correctAnswer = "dogs";
  const duplicateContent = {
    ...question("dogs-two", "GRAMMAR_IMAGE_CHOICE", "dogs"),
    prompt: prior.prompt,
    correctAnswer: "dogs",
    choices: ["dogs", "dog"]
  };
  const freshContent = question("cats-one", "GRAMMAR_IMAGE_CHOICE", "cats");

  const result = selectAssessmentRoundCandidate(
    [prior, duplicateContent, freshContent],
    {
      selectedQuestions: [prior],
      skillId: "plurals",
      roundLength: 15
    }
  );

  assert.equal(result.question?.id, "cats-one");
});

test("item-key budget allows necessary concept reuse but rejects avoidable concentration", () => {
  const selected = [
    ...Array.from({ length: 4 }, (_, index) => ({ ...question(`a-${index}`, "ENDING_SOUND"), itemKey: "a" })),
    ...Array.from({ length: 11 }, (_, index) => ({ ...question(`other-${index}`, "ENDING_SOUND"), itemKey: `key-${index}` }))
  ];
  const available = [
    ...selected,
    ...Array.from({ length: 4 }, (_, index) => ({ ...question(`b-${index}`, "ENDING_SOUND"), itemKey: "b" }))
  ];

  assert.deepEqual(
    getAssessmentItemKeyBudgetFailures(selected, available, { roundLength: 15 }),
    [{ value: "final_sound::a", count: 4, allowedCount: 3 }]
  );
});

test("item-key feasibility counts distinct targets rather than duplicate question variants", () => {
  const selected = [
    ...Array.from({ length: 5 }, (_, index) => ({
      ...question(`ee-${index}`, "PICTURE_AUDIO_TO_PATTERN", `ee-target-${index}`),
      itemKey: "ee"
    })),
    ...Array.from({ length: 3 }, (_, index) => ({
      ...question(`ea-${index}`, "PICTURE_AUDIO_TO_PATTERN", `ea-target-${index}`),
      itemKey: "ea"
    })),
    ...Array.from({ length: 3 }, (_, index) => ({
      ...question(`ai-${index}`, "PICTURE_AUDIO_TO_PATTERN", `ai-target-${index}`),
      itemKey: "ai"
    })),
    ...Array.from({ length: 3 }, (_, index) => ({
      ...question(`oa-${index}`, "PICTURE_AUDIO_TO_PATTERN", `oa-target-${index}`),
      itemKey: "oa"
    })),
    { ...question("ay-one", "PICTURE_AUDIO_TO_PATTERN", "clay"), itemKey: "ay" }
  ];
  const available = [
    ...selected,
    { ...question("ay-two", "PICTURE_AUDIO_TO_PATTERN", "clay"), itemKey: "ay" },
    { ...question("ay-three", "PICTURE_AUDIO_TO_PATTERN", "clay"), itemKey: "ay" }
  ];

  assert.deepEqual(
    getAssessmentItemKeyBudgetFailures(selected, available, { roundLength: 15 }),
    []
  );
});
