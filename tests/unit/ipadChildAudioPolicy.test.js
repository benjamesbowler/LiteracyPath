import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { playCvcSoundSequence } from "../../src/components/learn/phonics/cvc/cvcHelpers.js";

const stepHearWord = readFileSync(
  new URL("../../src/components/learn/phonics/cvc/StepHearWord.jsx", import.meta.url),
  "utf8"
);
const cvcHelpers = readFileSync(
  new URL("../../src/components/learn/phonics/cvc/cvcHelpers.js", import.meta.url),
  "utf8"
);
const stepBuildWord = readFileSync(
  new URL("../../src/components/learn/phonics/cvc/StepBuildWord.jsx", import.meta.url),
  "utf8"
);
const phonicsAudio = readFileSync(
  new URL("../../src/hooks/usePhonicsAudio.js", import.meta.url),
  "utf8"
);
const app = readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8");
const childAudioLifecycle = readFileSync(
  new URL("../../src/utils/audio/childAudioLifecycle.js", import.meta.url),
  "utf8"
);
const assessmentController = readFileSync(
  new URL("../../src/appState/assessmentRoundController.js", import.meta.url),
  "utf8"
);
const firstSoundQuestion = readFileSync(
  new URL("../../src/components/questions/FirstSoundQuestion.jsx", import.meta.url),
  "utf8"
);

test("CVC sound-out waits for each recording instead of interrupting it on a timer", async () => {
  assert.match(stepHearWord, /await playCvcSoundSequence/);
  assert.doesNotMatch(stepHearWord, /index\s*\*\s*CVC_SOUND_DELAY/);
  assert.match(stepBuildWord, /await playCvcSoundSequence/);
  assert.doesNotMatch(stepBuildWord, /index\s*\*\s*CVC_SOUND_DELAY/);
  const cues = [];
  const result = playCvcSoundSequence({
    wordModel: { word: "cat", letters: ["c", "a", "t"], audio: "/cat.mp3" },
    family: { vowel: "a" },
    playCue: src => new Promise(resolve => cues.push({ src, resolve })),
    wait: async () => {}
  });
  for (let index = 0; index < 4; index += 1) {
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(cues.length, index + 1, "the next cue must wait for the current recording");
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(cues.length, index + 1);
    cues[index].resolve("ended");
  }
  assert.equal(cues[3].src, "/cat.mp3");
  assert.deepEqual(await result, { audioDelivery: "delivered" });
});

test("phonics begins imperatively in the tap call stack and transient Safari blocks stay retryable", () => {
  assert.match(cvcHelpers, /playbackRef\.current = playPhonicsAudio\(src \|\| ""/);
  assert.doesNotMatch(cvcHelpers, /useEffect\([\s\S]*?play\(\)/);
  assert.doesNotMatch(phonicsAudio, /on\("playerror",\s*\(\) => failedSources\.add/);
  assert.match(phonicsAudio, /const onPlayError = \(\) => settle\("blocked"\)/);
});

test("child route changes stop every shared audio system", () => {
  assert.match(app, /stopAllChildAudio\("route-change"\)/);
  assert.match(app, /installChildAudioPageLifecycle\(\)/);
  assert.match(childAudioLifecycle, /visibilitychange/);
  for (const stopFunction of [
    "stopPhonicsAudio",
    "stopCueAudio",
    "stopGameMusic",
    "stopGameAmbience",
    "cancelGameSfx",
    "stopQuestActionSfx"
  ]) {
    assert.match(childAudioLifecycle, new RegExp(`${stopFunction}\\(`));
  }
});

test("assessment replay controls use the cancellable shared voice", () => {
  assert.match(assessmentController, /playCueAudio\(preferredAudioPath/);
  assert.doesNotMatch(assessmentController, /new Audio\(preferredAudioPath\)/);
  assert.match(firstSoundQuestion, /playCueAudio\(audioUrl/);
  assert.doesNotMatch(firstSoundQuestion, /new Audio\(audioUrl\)/);
});
