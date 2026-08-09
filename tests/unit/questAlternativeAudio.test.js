import assert from "node:assert/strict";
import test from "node:test";

import { NEEDS_AUDIO } from "../../src/data/questSequence.js";
import {
  altPronunciationCandidates,
  graphemeCandidates,
  graphemeSrc
} from "../../src/utils/questAudio.js";

test("Sound Seekers alternatives require their own dedicated recordings", () => {
  for (const key of NEEDS_AUDIO) {
    const expected = [`/audio/quest/alt/${key}.mp3`];
    assert.deepEqual(altPronunciationCandidates(key), expected);
    assert.deepEqual(graphemeCandidates(key), expected);
    assert.equal(graphemeSrc(key), "");
  }
});

test("product-owner-approved alternative spellings reuse only exact matching sounds", () => {
  const approved = {
    y_ie: "/audio/production/en-US/letter_name/i-letter-name-08b2250332.mp3",
    y_ee: "/audio/production/en-US/letter_name/e-letter-name-772c8c22cd.mp3",
    oo_short: "/audio/phonemes/reviewed/short-oo.mp3",
    ow_ou: "/audio/phonemes/reviewed/ow-cow.mp3",
    c_s: "/audio/phonemes/s.mp3",
    g_j: "/audio/phonemes/reviewed/j-soft-g.mp3",
    ch_k: "/audio/phonemes/k.mp3",
    ea_e: "/audio/phonemes/reviewed/short-e.mp3"
  };
  for (const [key, expected] of Object.entries(approved)) {
    assert.deepEqual(graphemeCandidates(key), [expected]);
    assert.equal(graphemeSrc(key), expected);
  }
});

test("an empty alternative id never produces a public path", () => {
  assert.deepEqual(altPronunciationCandidates(""), []);
});
