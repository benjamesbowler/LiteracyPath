import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { browserSpeechViolations } from "../../tools/browserSpeechPolicy.js";

const page = "src/components/progress/ProgressCheckPage.jsx";
const source = readFileSync(new URL(`../../${page}`, import.meta.url), "utf8");
const retiredAccess = `async function play(cue) {
  if (!cue.path && cue.fallback === "speech_access" && !cue.required) {
    const utterance = new SpeechSynthesisUtterance(cue.text);
    globalThis.speechSynthesis.speak(utterance);
  }
}`;

test("current Progress access and warmup use exact recordings without browser speech", () => {
  assert.doesNotMatch(source, /SpeechSynthesisUtterance|speechSynthesis/);
  assert.deepEqual(browserSpeechViolations(page, source), []);
});
test("Progress and game production speech cannot revive the retired access exception", () => {
  assert.equal(browserSpeechViolations(page, retiredAccess).length, 2);
  assert.equal(browserSpeechViolations("src/components/learn/games/games/PopTheWord.jsx", retiredAccess).length, 2);
});
test("required stimulus fallback fails even when an old speech_access guard remains nearby", () => {
  assert.equal(browserSpeechViolations(page, retiredAccess.replace(' && !cue.required', '')).length, 2);
  assert.equal(browserSpeechViolations(page, retiredAccess.replace(' && !cue.required', ' && cue.required')).length, 2);
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
  const unsafe = retiredAccess.replace('async function play(cue) {', 'async function play(cue) { globalThis.speechSynthesis.speak(new SpeechSynthesisUtterance("answer"));');
  assert.equal(browserSpeechViolations(page, unsafe).length, 4);
});
test("even unscored warmup requires a recording", () => {
  const warmup = `function speakWarmup() {
    if (ref.current?.status !== "warmup") return;
    const utterance = new SpeechSynthesisUtterance("Tap the circle.");
    globalThis.speechSynthesis.speak(utterance);
  }`;
  assert.equal(browserSpeechViolations(page, warmup).length, 2);
  assert.equal(browserSpeechViolations(page, warmup.replace('if (ref.current?.status !== "warmup") return;', '')).length, 2);
});
