import test from "node:test";
import assert from "node:assert/strict";
import { segmentWord } from "../../src/utils/graphemeSegments.js";

test("segmentWord keeps digraphs and vowel teams together", () => {
  assert.deepEqual(segmentWord("fish"), ["f", "i", "sh"]);
  assert.deepEqual(segmentWord("boat"), ["b", "oa", "t"]);
  assert.deepEqual(segmentWord("night"), ["n", "igh", "t"]);
  assert.deepEqual(segmentWord("duck"), ["d", "u", "ck"]);
});
