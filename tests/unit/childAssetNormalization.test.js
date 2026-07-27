import test from "node:test";
import assert from "node:assert/strict";
import { getChildAudioPath } from "../../src/data/childAssets.js";

test("child phrase audio ignores terminal punctuation without duplicate manifest rows", () => {
  const expected = "/audio/child-mode/phrases/tap-rumble.mp3";
  assert.equal(getChildAudioPath("Tap Rumble to hear it again"), expected);
  assert.equal(getChildAudioPath("Tap Rumble to hear it again."), expected);
  assert.equal(getChildAudioPath("Tap Rumble to hear it again?!"), expected);
});

test("terminal punctuation normalisation preserves question prompt audio", () => {
  const expected = "/audio/child-mode/clean-human/phrases/which-word-matches.mp3";
  assert.equal(getChildAudioPath("Which word matches the picture"), expected);
  assert.equal(getChildAudioPath("Which word matches the picture?"), expected);
});
