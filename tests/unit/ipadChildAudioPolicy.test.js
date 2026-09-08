import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
const stepWordMagic = readFileSync(
  new URL("../../src/components/learn/phonics/cvc/StepWordMagic.jsx", import.meta.url),
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

test("CVC sound-out waits for each recording instead of interrupting it on a timer", () => {
  assert.match(stepHearWord, /await playCvcSoundSequence/);
  assert.doesNotMatch(stepHearWord, /index\s*\*\s*CVC_SOUND_DELAY/);
  assert.match(cvcHelpers, /const playback = playCue/);
  assert.match(cvcHelpers, /const status = await playback/);
  assert.match(cvcHelpers, /const wordStatus = await playCue/);
  assert.match(stepBuildWord, /await playCvcSoundSequence/);
  assert.doesNotMatch(stepBuildWord, /index\s*\*\s*CVC_SOUND_DELAY/);
  assert.match(stepWordMagic, /const onsetStatus = await playCue/);
  assert.match(stepWordMagic, /const wordStatus = await playCue/);
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
