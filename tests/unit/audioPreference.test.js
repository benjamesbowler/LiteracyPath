import test from "node:test";
import assert from "node:assert/strict";
import { getPreferredAudioPath } from "../../src/data/audioPreferenceManifest.js";

// The gold-audio resolver should upgrade a known curriculum word from the old
// /audio/child-mode/words/ path to the clean-human recording.
test("known words upgrade to the clean-human recording", () => {
  for (const w of ["cat", "dog", "sun", "pig"]) {
    const resolved = getPreferredAudioPath(w, `/audio/child-mode/words/${w}.mp3`);
    assert.equal(resolved, `/audio/child-mode/clean-human/words/${w}.mp3`);
  }
});

test("unknown words fall back to the supplied path (no throw)", () => {
  assert.equal(
    getPreferredAudioPath("zzqqx", "/audio/child-mode/words/zzqqx.mp3"),
    "/audio/child-mode/words/zzqqx.mp3"
  );
});

test("empty input is handled safely", () => {
  assert.equal(getPreferredAudioPath("", ""), "");
});
