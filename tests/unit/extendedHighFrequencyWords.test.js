import assert from "node:assert/strict";
import test from "node:test";

import {
  ALL_HFW_WORDS,
  HFW_WORD_BANDS,
  getHfwBandWords,
  normalizeHfwSkillId
} from "../../src/data/highFrequencyWordBands.js";
import { SIGHT_WORDS } from "../../src/data/learnGamesData.js";

test("the high-frequency bank spans 1,000 unique words in forty rarity bands", () => {
  assert.equal(Object.keys(HFW_WORD_BANDS).length, 40);
  assert.equal(Object.values(HFW_WORD_BANDS).every(words => words.length === 25), true);
  assert.equal(ALL_HFW_WORDS.length, 1000);
  assert.equal(new Set(ALL_HFW_WORDS).size, 1000);
  assert.deepEqual(getHfwBandWords("hfw_976_1000").slice(-3), [
    "wouldn't",
    "wrong",
    "yellow"
  ]);
});

test("extended range labels normalize and the arcade exposes every rarity tier", () => {
  assert.equal(
    normalizeHfwSkillId("High-Frequency Words 901-925"),
    "hfw_901_925"
  );
  assert.equal(SIGHT_WORDS.level1.length, 50);
  assert.equal(SIGHT_WORDS.level2.length, 250);
  assert.equal(SIGHT_WORDS.level3.length, 700);
  assert.deepEqual(
    new Set([...SIGHT_WORDS.level1, ...SIGHT_WORDS.level2, ...SIGHT_WORDS.level3]),
    new Set(ALL_HFW_WORDS)
  );
});
