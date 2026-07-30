import test from "node:test";
import assert from "node:assert/strict";
import {
  getAudioPreference,
  getPreferredAudioPath
} from "../../src/data/audioPreferenceManifest.js";
import {
  getApprovedPhonicsPatternAudioPath
} from "../../src/data/approvedPhonicsPatternAudio.js";

// The gold-audio resolver should upgrade a known curriculum word from every
// superseded child-mode path to the installed Leda production recording.
test("known words upgrade to the Leda production recording", () => {
  for (const w of ["cat", "dog", "pig"]) {
    const resolved = getPreferredAudioPath(w, `/audio/child-mode/words/${w}.mp3`);
    assert.match(resolved, new RegExp(`^/audio/production/en-US/isolated_word/${w}-`));
  }
  assert.match(
    getPreferredAudioPath("sun", "/audio/child-mode/words/sun.mp3"),
    /^\/audio\/production\/en-US\/supplemental\/sun-/,
    "the remade sun clip should outrank the superseded isolated-word recording"
  );
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

test("reviewed Leda phonics clips are registered as approved exact-context assets", () => {
  const preference = getAudioPreference("pattern:or:word");
  assert.equal(preference?.status, "approved");
  assert.equal(
    preference?.preferredAudioPath,
    "/audio/production/en-US/pattern/or-as-in-word-f1c092d4d8.mp3"
  );
});

test("ambiguous reviewed phonics clips require their exact anchor", () => {
  assert.equal(getApprovedPhonicsPatternAudioPath("ew"), "");
  assert.equal(
    getApprovedPhonicsPatternAudioPath("ew", "few"),
    "/audio/production/en-US/pattern/ew-as-in-few-a41a73446f.mp3"
  );
  assert.equal(getApprovedPhonicsPatternAudioPath("or"), "");
  assert.equal(
    getApprovedPhonicsPatternAudioPath("or", "word"),
    "/audio/production/en-US/pattern/or-as-in-word-f1c092d4d8.mp3"
  );
  assert.equal(
    getApprovedPhonicsPatternAudioPath("ew", "grew"),
    "/audio/production/en-US/pattern/ew-as-in-grew-207c4b77e4.mp3"
  );
});

test("approved compact-cue blends are available as safe pattern defaults", () => {
  assert.equal(
    getApprovedPhonicsPatternAudioPath("bl"),
    "/audio/production/en-US/pattern/bl-as-in-blue-878a108fa9.mp3"
  );
  assert.equal(
    getApprovedPhonicsPatternAudioPath("st"),
    "/audio/production/en-US/pattern/st-as-in-stop-ff57ce59ae.mp3"
  );
  assert.equal(
    getApprovedPhonicsPatternAudioPath("sp"),
    "/audio/production/en-US/pattern/sp-as-in-spoon-57a7bc4f6a.mp3"
  );
  assert.equal(getApprovedPhonicsPatternAudioPath("nk"), "");
  assert.equal(
    getApprovedPhonicsPatternAudioPath("nd"),
    "/audio/production/en-US/pattern/nd-as-in-hand-3c5e09aa3b.mp3"
  );
  assert.equal(
    getApprovedPhonicsPatternAudioPath("fr"),
    "/audio/production/en-US/pattern/fr-as-in-frog-ec820e30a1.mp3"
  );
  assert.equal(
    getApprovedPhonicsPatternAudioPath("ft"),
    "/audio/production/en-US/pattern/ft-as-in-left-9f4bb83ac7.mp3"
  );
  assert.equal(
    getApprovedPhonicsPatternAudioPath("tr"),
    "/audio/production/en-US/pattern/tr-as-in-train-7fc11cde1c.mp3"
  );
  assert.equal(
    getApprovedPhonicsPatternAudioPath("tw"),
    "/audio/production/en-US/pattern/tw-as-in-twist-1614f22227.mp3"
  );
  assert.equal(
    getApprovedPhonicsPatternAudioPath("ct"),
    "/audio/production/en-US/pattern/ct-as-in-act-776a495964.mp3"
  );
  assert.equal(
    getApprovedPhonicsPatternAudioPath("pt"),
    "/audio/production/en-US/pattern/pt-as-in-kept-3335a20003.mp3"
  );
  assert.equal(
    getApprovedPhonicsPatternAudioPath("xt"),
    "/audio/production/en-US/pattern/xt-as-in-next-c90be54143.mp3"
  );
});
