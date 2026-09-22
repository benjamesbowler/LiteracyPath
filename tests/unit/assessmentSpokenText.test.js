import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSpokenCloze } from "../../src/utils/assessmentSpokenText.js";
import { buildAssessmentSpeechInput } from "../../tools/assessmentSpeechInput.mjs";

test("cloze placeholders pause without deleting the word blank from instructions", () => {
  assert.equal(normalizeSpokenCloze("I clap; she ___."), "I clap; she ….");
  assert.equal(normalizeSpokenCloze("Which printed word fills the blank?"), "Which printed word fills the blank?");
  assert.equal(normalizeSpokenCloze("The cat is hmm the bed."), "The cat is … the bed.");
});

test("synthesis uses explicit silent gaps and escapes literal SSML characters", () => {
  assert.deepEqual(buildAssessmentSpeechInput("Complete: I clap; she ___."), {
    ssml: '<speak>Complete: I clap; she <break time="600ms"/>.</speak>'
  });
  assert.deepEqual(buildAssessmentSpeechInput("A & B: ___ < ___ > 'one'."), {
    ssml: '<speak>A &amp; B: <break time="600ms"/> &lt; <break time="600ms"/> &gt; one.</speak>'
  });
  assert.deepEqual(buildAssessmentSpeechInput("Listen to the whole sentence. Which word fills the blank?"), {
    text: "Listen to the whole sentence. Which word fills the blank?"
  });
});

test("quoted cloze examples omit spoken delimiters without changing printed copy", () => {
  const printed = "Complete ‘I clap; she … ’.";
  assert.equal(normalizeSpokenCloze(printed), printed);
  assert.deepEqual(buildAssessmentSpeechInput(printed), {
    ssml: '<speak>Complete I clap; she <break time="600ms"/>.</speak>'
  });
  assert.deepEqual(buildAssessmentSpeechInput('Ben said, “___ can bake.”'), {
    ssml: '<speak>Ben said, <break time="600ms"/> can bake.</speak>'
  });
  assert.deepEqual(buildAssessmentSpeechInput("Which spelling fits 'to ___ the answer'?"), {
    ssml: '<speak>Which spelling fits to <break time="600ms"/> the answer?</speak>'
  });
});

test("SSML preserves internal apostrophes and non-cloze speech stays unchanged", () => {
  assert.deepEqual(buildAssessmentSpeechInput("‘Don't ___ the child’s hat.’"), {
    ssml: '<speak>Don&apos;t <break time="600ms"/> the child’s hat.</speak>'
  });
  assert.deepEqual(buildAssessmentSpeechInput("Lunch starts ___ six o'clock."), {
    ssml: '<speak>Lunch starts <break time="600ms"/> six o&apos;clock.</speak>'
  });
  assert.deepEqual(buildAssessmentSpeechInput('Say “hello.”'), { text: 'Say “hello.”' });
});
