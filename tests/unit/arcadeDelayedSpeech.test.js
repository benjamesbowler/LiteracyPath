import test from "node:test";
import assert from "node:assert/strict";
import { isLiveDelayedSpeech } from "../../src/utils/learnGamesSpeechPolicy.js";

test("delayed practice speech requires live sound and the same round target", () => {
  const current = {
    scheduledRound: 0,
    currentRound: 0,
    scheduledTarget: "cat",
    currentTarget: "cat"
  };

  assert.equal(isLiveDelayedSpeech({ ...current, soundEnabled: true }), true);
  assert.equal(isLiveDelayedSpeech({ ...current, soundEnabled: false }), false);
  assert.equal(isLiveDelayedSpeech({ ...current, soundEnabled: true, currentRound: 1 }), false);
  assert.equal(isLiveDelayedSpeech({ ...current, soundEnabled: true, currentTarget: "dog" }), false);
});
