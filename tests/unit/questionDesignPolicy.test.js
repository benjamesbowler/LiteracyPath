import test from "node:test";
import assert from "node:assert/strict";

import {
  auditQuestionAgainstPolicy,
  normalizeQuestionText
} from "../../src/policy/questionDesignPolicy.js";
import { balanceShortVowelDiscriminationChoices } from "../../src/data/questionMediaResolver.js";

const validQuestion = {
  id: "policy-valid-1",
  prompt: "Which word starts with m?",
  choices: ["map", "sun", "dog"],
  answer: "map",
  image: "/images/example.webp",
  spokenPrompt: "Which word starts with m?",
  distractorRationales: {
    sun: "Starts with s.",
    dog: "Starts with d."
  }
};

test("a clear, accessible early-years item passes the Question Design Bible rules", () => {
  assert.deepEqual(auditQuestionAgainstPolicy(validQuestion, {
    ageBand: "A",
    requireId: true,
    requireVisual: true,
    requireSpoken: true,
    requireDistractorRationales: true
  }), []);
});

test("ambiguous, banned and inaccessible options are rejected", () => {
  const codes = auditQuestionAgainstPolicy({
    prompt: "Which answer is not right?",
    choices: ["Cat", "cat", "all of the above"],
    answer: "cat"
  }, {
    ageBand: "A",
    requireId: true,
    requireVisual: true,
    requireSpoken: true
  }).map(item => item.code);

  for (const code of ["Q-ID", "Q-DUPLICATE-OPTION", "Q-BANNED-OPTION", "Q-NEGATIVE-STEM", "Q-VISUAL", "Q-SPEAKER"]) {
    assert.ok(codes.includes(code), `expected ${code}; got ${codes.join(", ")}`);
  }
});

test("negative stems are only allowed in later bands when the negative is emphasized", () => {
  const question = {
    id: "negative-b-1",
    prompt: "Which sentence does NOT show kindness?",
    choices: ["Sam shares.", "Sam helps.", "Sam grabs."],
    answer: "Sam grabs."
  };
  assert.deepEqual(auditQuestionAgainstPolicy(question, {
    ageBand: "B",
    allowNegativeStem: true
  }), []);

  const issues = auditQuestionAgainstPolicy({ ...question, prompt: "Which sentence does not show kindness?" }, {
    ageBand: "B",
    allowNegativeStem: true
  });
  assert.ok(issues.some(item => item.code === "Q-NEGATIVE-EMPHASIS"));
});

test("orthography-sensitive tasks preserve meaningful apostrophe differences", () => {
  const question = {
    id: "contraction-1",
    prompt: "Fix the contraction",
    choices: ["cant", "can't", "can,t"],
    answer: "can't"
  };
  assert.deepEqual(auditQuestionAgainstPolicy(question, {
    ageBand: "C",
    orthographySensitiveOptions: true
  }), []);
  assert.ok(auditQuestionAgainstPolicy(question, { ageBand: "C" }).some(item => item.code === "Q-DUPLICATE-OPTION"));
});

test("constructed-response tasks are not forced through multiple-choice counts", () => {
  assert.deepEqual(auditQuestionAgainstPolicy({
    id: "build-1",
    prompt: "Build the word cat.",
    letterTiles: ["c", "a", "t"]
  }, {
    ageBand: "A",
    requireId: true,
    constructedResponse: true
  }), []);
});

test("case and punctuation rationales use the same literal distinctions as their options", () => {
  for (const [choices, answer, context] of [
    [["Ben", "ben", "bEn"], "Ben", { caseSensitiveOptions: true }],
    [["Let's go.", "Lets go.", "Lets' go."], "Let's go.", { orthographySensitiveOptions: true }]
  ]) {
    const distractors = choices.filter(value => value !== answer);
    const question = { id: "literal-contrast", prompt: "Which choice is correct?", choices, answer,
      distractorRationales: Object.fromEntries(distractors.map(value => [value, "Uses the wrong written form."])) };
    assert.deepEqual(auditQuestionAgainstPolicy(question, { ...context, requireDistractorRationales: true }), []);
    // A rationale for a different literal form cannot cover this distractor.
    delete question.distractorRationales[distractors[1]];
    assert.ok(auditQuestionAgainstPolicy(question, { ...context, requireDistractorRationales: true })
      .some(issue => issue.code === "Q-DISTRACTOR-RATIONALE"));
  }
});

test("runtime short-vowel balancing rebuilds rationales for the actual displayed choices", () => {
  const balanced = balanceShortVowelDiscriminationChoices({
    id: "svd-runtime-rationale-1",
    skillId: "short_vowel_discrimination",
    itemKey: "short_a",
    prompt: "Which picture has short a?",
    choices: ["tap", "tip", "top", "ten"],
    answer: "tap",
    correctAnswer: "tap",
    distractorRationales: { tip: "old", top: "old", ten: "old" }
  });

  assert.equal(balanced.shortVowelDistractorsBalanced, true);
  assert.equal(balanced.choices.length, 4);
  assert.ok(balanced.choices.includes("tap"));
  const expectedKeys = balanced.choices
    .filter(choice => choice !== "tap")
    .map(normalizeQuestionText)
    .sort();
  assert.deepEqual(Object.keys(balanced.distractorRationales).map(normalizeQuestionText).sort(), expectedKeys);
});
