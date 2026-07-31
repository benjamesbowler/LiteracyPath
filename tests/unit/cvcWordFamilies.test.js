import test from "node:test";
import assert from "node:assert/strict";
import { getGraphemeAudioPath } from "../../src/data/cvcWordFamilies.js";

// Regression guard for the Word Builder vowel bug: the vowel must resolve to a
// real pure-phoneme recording path, never a "short a" label or synthetic buzz.
test("approved vowels resolve to the reviewed short-vowel bank", () => {
  for (const v of ["a", "i", "o", "u"]) {
    assert.equal(
      getGraphemeAudioPath(v, v),
      `/audio/phonemes/short_${v}.mp3`
    );
  }
});

test("consonants resolve to the reviewed phoneme bank", () => {
  assert.equal(getGraphemeAudioPath("c", ""), "/audio/phonemes/c.mp3");
  assert.equal(getGraphemeAudioPath("t", ""), "/audio/phonemes/t.mp3");
});

test("deferred sounds stay silent after their old audio is deleted", () => {
  for (const sound of ["e", "b", "j", "ch", "sh", "th", "nk", "zz"]) {
    assert.equal(getGraphemeAudioPath(sound, sound === "e" ? "e" : ""), "");
  }
});

test("never returns a synthetic 'generated:' source", () => {
  for (const l of ["a", "b", "c", "m", "z"]) {
    assert.ok(!getGraphemeAudioPath(l, "").startsWith("generated:"));
  }
});
