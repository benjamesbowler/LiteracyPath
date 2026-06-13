import test from "node:test";
import assert from "node:assert/strict";
import { getGraphemeAudioPath } from "../../src/data/cvcWordFamilies.js";

// Regression guard for the Word Builder vowel bug: the vowel must resolve to a
// real pure-phoneme/clean recording path, never a "short a" label or synthetic
// buzz. Consonants resolve to the clean-human consonant recordings.
test("vowels resolve to a clean short-vowel grapheme recording", () => {
  for (const v of ["a", "e", "i", "o", "u"]) {
    assert.equal(
      getGraphemeAudioPath(v, v),
      `/audio/child-mode/clean-human/graphemes/short_vowels/short_${v}.mp3`
    );
  }
});

test("consonants resolve to clean-human consonant recordings", () => {
  assert.equal(getGraphemeAudioPath("c", ""), "/audio/child-mode/clean-human/graphemes/consonants/c.mp3");
  assert.equal(getGraphemeAudioPath("t", ""), "/audio/child-mode/clean-human/graphemes/consonants/t.mp3");
});

test("never returns a synthetic 'generated:' source", () => {
  for (const l of ["a", "b", "c", "m", "z"]) {
    assert.ok(!getGraphemeAudioPath(l, "").startsWith("generated:"));
  }
});
