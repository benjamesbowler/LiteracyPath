import { test } from "node:test";
import assert from "node:assert/strict";
import {
  segmentWord,
  graphemesIn,
  isDecodable,
  untaughtGraphemes,
  findSplitDigraph
} from "../../src/utils/questSegments.js";

test("plain CVC words split into single letters", () => {
  assert.deepEqual(segmentWord("sat"), ["s", "a", "t"]);
  assert.deepEqual(segmentWord("hop"), ["h", "o", "p"]);
});

test("digraphs are one grapheme, not two letters", () => {
  assert.deepEqual(segmentWord("ship"), ["sh", "i", "p"]);
  assert.deepEqual(segmentWord("chin"), ["ch", "i", "n"]);
  assert.deepEqual(segmentWord("thing"), ["th", "i", "ng"]);
  assert.deepEqual(segmentWord("duck"), ["d", "u", "ck"]);
});

test("`ing` is MORPHOLOGY, not a grapheme — a child blends i + ng", () => {
  // The first draft had `ing` in the grapheme list, which segmented "thing" as
  // th|ing: a syllable, not a sound, and two planks on the Stone Bridge for a
  // three-phoneme word. -s and -ed are the same: they add no new spelling.
  assert.deepEqual(segmentWord("sing"), ["s", "i", "ng"]);
  assert.deepEqual(segmentWord("jumping"), ["j", "u", "m", "p", "i", "ng"]);
  assert.deepEqual(segmentWord("singing"), ["s", "i", "ng", "i", "ng"]);
});

test("a grapheme the child has not been taught does NOT get matched", () => {
  // This is the whole reason the segmenter is known-set aware. Without it,
  // "ship" looks decodable at stop 2, when the child has never met `sh`.
  assert.deepEqual(segmentWord("ship", { known: ["s", "h", "i", "p"] }), ["s", "h", "i", "p"]);
  assert.deepEqual(segmentWord("ship", { known: ["sh", "i", "p"] }), ["sh", "i", "p"]);
});

test("split digraphs come out as one grapheme, in phoneme order", () => {
  assert.deepEqual(segmentWord("cake"), ["c", "a_e", "k"]);
  assert.deepEqual(segmentWord("these"), ["th", "e_e", "s"]);
  assert.deepEqual(segmentWord("stone"), ["s", "t", "o_e", "n"]);
  assert.deepEqual(segmentWord("ice"), ["i_e", "c"]);
});

test("-r words are r-controlled, NOT split digraphs", () => {
  // Leave r in the split-digraph consonant class and every -ore/-are word
  // mis-segments (more -> m|o_e|r). This is the bug that check catches.
  assert.deepEqual(segmentWord("more"), ["m", "ore"]);
  assert.deepEqual(segmentWord("care"), ["c", "are"]);
  assert.deepEqual(segmentWord("store"), ["s", "t", "ore"]);
  assert.equal(findSplitDigraph("more"), null);
});

test("-ve words are never split digraphs (have, give, love)", () => {
  assert.equal(findSplitDigraph("have"), null);
  assert.equal(findSplitDigraph("give"), null);
  assert.equal(findSplitDigraph("love"), null);
});

test("a vowel before the vowel blocks the split (house, please)", () => {
  assert.equal(findSplitDigraph("house"), null);
  assert.equal(findSplitDigraph("please"), null);
  assert.deepEqual(segmentWord("house"), ["h", "ou", "s", "e"]);
});

test("split digraphs are not applied before they are taught", () => {
  // At stop 5 a child has c, a, k, e but NOT a_e. "cake" must come out as an
  // undecodable four-letter word, not be silently rewritten into a legal one.
  const known = ["c", "a", "k", "e"];
  assert.deepEqual(segmentWord("cake", { known }), ["c", "a", "k", "e"]);
  assert.equal(isDecodable("cake", known), true, "letter-by-letter it IS in the known set");
  assert.deepEqual(segmentWord("cake", { known: [...known, "a_e"] }), ["c", "a_e", "k"]);
});

test("`le` is only a grapheme at the END of a word", () => {
  // Without the final-only rule, "le" swallows the start of "let" and "less".
  assert.deepEqual(segmentWord("let"), ["l", "e", "t"]);
  assert.deepEqual(segmentWord("less"), ["l", "e", "ss"]);
  assert.deepEqual(segmentWord("little"), ["l", "i", "t", "t", "le"]);
  assert.deepEqual(segmentWord("table"), ["t", "a", "b", "le"]);
});

test("longest match wins (igh before i, are before ar, ore before or)", () => {
  assert.deepEqual(segmentWord("light"), ["l", "igh", "t"]);
  assert.deepEqual(segmentWord("star"), ["s", "t", "ar"]);
  assert.deepEqual(segmentWord("share"), ["sh", "are"]);
  assert.deepEqual(segmentWord("hear"), ["h", "ear"]);
});

test("doubles are one grapheme", () => {
  assert.deepEqual(segmentWord("buzz"), ["b", "u", "zz"]);
  assert.deepEqual(segmentWord("bell"), ["b", "e", "ll"]);
  assert.deepEqual(segmentWord("hiss"), ["h", "i", "ss"]);
});

test("isDecodable / untaughtGraphemes name the exact culprit", () => {
  assert.equal(isDecodable("sat", ["s", "a", "t"]), true);
  assert.equal(isDecodable("ship", ["s", "a", "t", "i", "p"]), false);
  assert.deepEqual(untaughtGraphemes("ship", ["s", "i", "p"]), ["h"]);
  assert.deepEqual(untaughtGraphemes("sat", ["s", "a", "t"]), []);
});

test("graphemesIn dedupes", () => {
  assert.deepEqual(graphemesIn("dad"), ["d", "a"]);
});

test("punctuation and case are ignored", () => {
  assert.deepEqual(segmentWord("  Ship! "), ["sh", "i", "p"]);
  assert.deepEqual(segmentWord(""), []);
  assert.deepEqual(segmentWord(null), []);
});
