import assert from "node:assert/strict";
import test from "node:test";

import {
  inferAnswerRecordMetadata,
  inferItemMetadata
} from "../../src/appState/assessmentRuntime.js";

test("reloaded initial and final sound answers use their diagnostic target", () => {
  assert.deepEqual(inferAnswerRecordMetadata({
    skill: "Initial Sounds",
    question: "Audit question",
    correct: "correct",
    diagnosticTarget: "/m/"
  }), {
    itemKey: "m",
    itemType: "initial_sound"
  });
  assert.deepEqual(inferAnswerRecordMetadata({
    skill: "Final Sounds",
    question: "Audit question",
    correct: "correct",
    diagnosticTarget: "/t/"
  }), {
    itemKey: "t",
    itemType: "final_sound"
  });
});

test("CVC Short Vowels is classified as a short-vowel target before generic CVC words", () => {
  assert.deepEqual(inferAnswerRecordMetadata({
    skill: "CVC Short Vowels",
    question: "Audit question",
    correct: "correct",
    diagnosticTarget: "short a"
  }), {
    itemKey: "short_a",
    itemType: "short_vowel"
  });
});

test("normal CVC word questions remain word-level evidence", () => {
  assert.deepEqual(inferItemMetadata({
    skill: "CVC Words",
    question: "Read the word.",
    answer: "map"
  }), {
    itemKey: "map",
    itemType: "cvc_word"
  });
});
