// Contracts for the generated item universe (real report denominators):
// every itemType the report chart depends on has a non-zero count, and the
// level totals derived from those counts can never sit below the mastered
// numerator (so the bar is 0-100 and can reach exactly 100%).
import test from "node:test";
import assert from "node:assert/strict";
import { itemUniverseCounts } from "../../src/data/generated/itemUniverse.generated.js";
import {
  buildSoundsProgress,
  SOUND_LEVEL1_ITEM_TYPES,
  SOUND_LEVEL2_ITEM_TYPES
} from "../../src/utils/reportSections.js";

const REQUIRED_ITEM_TYPES = [
  "initial_sound",
  "rhyming_family",
  "short_vowel",
  "final_sound",
  "letter_sound",
  "phonics_pattern",
  "letter_name"
];

function masteredRowsOf(itemType, count) {
  return Array.from({ length: count }, (_, index) => ({ itemType, itemKey: `${itemType}_${index}` }));
}

test("universe counts are positive integers for every itemType the chart uses", () => {
  REQUIRED_ITEM_TYPES.forEach(itemType => {
    const count = itemUniverseCounts[itemType];
    assert.equal(Number.isInteger(count), true, `${itemType} count must be an integer (got ${count})`);
    assert.equal(count > 0, true, `${itemType} count must be > 0 (got ${count})`);
  });
});

test("universe matches curated expectations where they exist", () => {
  // coverageExpectations.js documents 25 initial-sound targets (x excluded)
  // and 5 medial short vowels; the bank-derived universe must agree.
  assert.equal(itemUniverseCounts.initial_sound, 25);
  assert.equal(itemUniverseCounts.short_vowel, 5);
  // One letter_name and one letter_sound per EL letter (a-z).
  assert.equal(itemUniverseCounts.letter_name, 26);
  assert.equal(itemUniverseCounts.letter_sound, 26);
});

test("level totals are at least the mastered counts in a realistic sample", () => {
  const sample = [
    ...masteredRowsOf("initial_sound", 6),
    ...masteredRowsOf("rhyming_family", 4),
    ...masteredRowsOf("short_vowel", 2),
    ...masteredRowsOf("final_sound", 5),
    ...masteredRowsOf("letter_name", 10),
    ...masteredRowsOf("letter_sound", 8),
    ...masteredRowsOf("phonics_pattern", 3),
    ...masteredRowsOf("sight_word", 12) // must not leak into either level
  ];
  const progress = buildSoundsProgress(sample, itemUniverseCounts);

  assert.equal(progress.level1.mastered, 12);
  assert.equal(progress.level2.mastered, 26);
  assert.equal(progress.level1.total >= progress.level1.mastered, true);
  assert.equal(progress.level2.total >= progress.level2.mastered, true);
  [progress.level1.percent, progress.level2.percent].forEach(percent => {
    assert.equal(percent >= 0 && percent <= 100, true, `percent out of range: ${percent}`);
  });
});

test("full mastery reaches exactly 100% on both levels", () => {
  const level1Total = SOUND_LEVEL1_ITEM_TYPES.reduce((sum, type) => sum + itemUniverseCounts[type], 0);
  const level2Total = SOUND_LEVEL2_ITEM_TYPES.reduce((sum, type) => sum + itemUniverseCounts[type], 0);
  const progress = buildSoundsProgress(
    [...masteredRowsOf("initial_sound", level1Total), ...masteredRowsOf("final_sound", level2Total)],
    itemUniverseCounts
  );

  assert.equal(progress.level1.percent, 100);
  assert.equal(progress.level2.percent, 100);
  assert.equal(progress.level1.mastered, progress.level1.total);
  assert.equal(progress.level2.mastered, progress.level2.total);
});

test("overflow clamps to 100%, never above, by raising the total", () => {
  const level2Total = SOUND_LEVEL2_ITEM_TYPES.reduce((sum, type) => sum + itemUniverseCounts[type], 0);
  const progress = buildSoundsProgress(
    masteredRowsOf("phonics_pattern", level2Total + 25),
    itemUniverseCounts
  );

  assert.equal(progress.level2.percent, 100);
  assert.equal(progress.level2.total, level2Total + 25);
});
