import test from "node:test";
import assert from "node:assert/strict";
import { segmentWord } from "../../src/utils/graphemeSegments.js";

test("segmentWord keeps digraphs and vowel teams together", () => {
  assert.deepEqual(segmentWord("fish"), ["f", "i", "sh"]);
  assert.deepEqual(segmentWord("boat"), ["b", "oa", "t"]);
  assert.deepEqual(segmentWord("night"), ["n", "igh", "t"]);
  assert.deepEqual(segmentWord("duck"), ["d", "u", "ck"]);
});

test("segmentWord folds magic-e into its vowel instead of counting it", () => {
  assert.deepEqual(segmentWord("stone"), ["s", "t", "o_e", "n"]);
  assert.deepEqual(segmentWord("flame"), ["f", "l", "a_e", "m"]);
  assert.deepEqual(segmentWord("glide"), ["g", "l", "i_e", "d"]);
  assert.deepEqual(segmentWord("prize"), ["p", "r", "i_e", "z"]);
  // Final e after a vowel team or another vowel is not folded.
  assert.deepEqual(segmentWord("tree"), ["t", "r", "ee"]);
  assert.deepEqual(segmentWord("she"), ["sh", "e"]);
});

test("segmentWord treats a trailing consonant-le as one segment", () => {
  assert.deepEqual(segmentWord("sparkle"), ["s", "p", "ar", "k", "le"]);
  assert.deepEqual(segmentWord("table"), ["t", "a", "b", "le"]);
});

test("segmentWord collapses doubled consonants to one sound", () => {
  assert.deepEqual(segmentWord("glimmer"), ["g", "l", "i", "m", "er"]);
  assert.deepEqual(segmentWord("shimmer"), ["sh", "i", "m", "er"]);
  assert.deepEqual(segmentWord("moss"), ["m", "o", "s"]);
  assert.deepEqual(segmentWord("bell"), ["b", "e", "l"]);
});
