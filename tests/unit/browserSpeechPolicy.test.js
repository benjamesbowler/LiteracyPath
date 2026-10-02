import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { browserSpeechViolations } from "../../tools/browserSpeechPolicy.js";

const page = "src/components/progress/ProgressCheckPage.jsx";
const source = readFileSync(new URL(`../../${page}`, import.meta.url), "utf8");

test("current Progress speech obeys its explicit ordinary-access and unscored warmup contract", () => {
  assert.deepEqual(browserSpeechViolations(page, source), []);
});
test("game and other production speech cannot inherit the Progress exception", () => {
  assert.equal(browserSpeechViolations("src/components/learn/games/games/PopTheWord.jsx", source).length, 1);
});
test("required stimulus fallback fails even when a speech_access guard remains nearby", () => {
  assert.equal(browserSpeechViolations(page, source.replace(' && !cue.required', '')).length, 2);
  assert.equal(browserSpeechViolations(page, source.replace(' && !cue.required', ' && cue.required')).length, 2);
});
test("the alternate branch does not inherit a positive optional-access guard", () => {
  const unsafe = `async function play(cue) {
    if (!cue.path && cue.fallback === "speech_access" && !cue.required) {
      return;
    } else {
      const utterance = new SpeechSynthesisUtterance("required answer");
      globalThis.speechSynthesis.speak(utterance);
    }
  }`;
  const violations = browserSpeechViolations(page, unsafe);
  assert.equal(violations.length, 2);
  assert.deepEqual(violations.map(issue => issue.line), [5, 6]);
});
test("an unguarded caller inside play is rejected despite its safe sibling branch", () => {
  const unsafe = source.replace('async function play(cue) {', 'async function play(cue) { globalThis.speechSynthesis.speak(new SpeechSynthesisUtterance("answer"));');
  assert.equal(browserSpeechViolations(page, unsafe).length, 2);
});
test("warmup speech fails if the unscored-status guard is removed", () => {
  assert.equal(browserSpeechViolations(page, source.replace('if (ref.current?.status !== "warmup") return;', '')).length, 2);
});
