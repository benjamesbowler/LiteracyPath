import assert from "node:assert/strict";
import { test } from "node:test";
import { BUILDING_FAMILIES } from "../../src/components/learn/games/games/phonicsBuildingRounds.js";
import { getChildWordAsset } from "../../src/data/childAssets.js";
import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { buildShortVowelTeachingSequence } from "../../src/utils/shortVowelTeachingSequence.js";

const book = getRuntimeGuidedReadingBooks().find(item => item.id === "small-steps-01");
const game = GAME_LIST.find(item => item.id === "blend-and-build");
const input = { book, game, starterFamilies: BUILDING_FAMILIES.easy, wordPicture: getChildWordAsset("cat")?.image, reviews: { complete: true, rows: [] } };

test("the short-a sequence checks runtime materials and leaves the independent word out of practice", () => {
  const sequence = buildShortVowelTeachingSequence(input);
  assert.equal(sequence.game.id, game.id);
  assert.equal(sequence.book.text, "I am a cat.");
  assert.equal(sequence.book.afterCycle, 10);
  assert.equal(sequence.checkWord, "tap");
  assert.ok(sequence.plan.length > 0 && sequence.plan.length <= 240);
  const repeated = buildShortVowelTeachingSequence({ ...input, starterFamilies: [...input.starterFamilies, ["ap", "tap"]] });
  assert.equal(repeated.checkWord, "");
  assert.equal(repeated.plan, "");
});

test("unreviewed, quarantined and incomplete materials leave the unavailable step out", () => {
  const cases = [
    { ...input, reviews: { complete: false } },
    { ...input, reviews: { complete: true, rows: [{ book_id: book.id, status: "quarantined" }] } },
    { ...input, book: { ...book, pages: [{ ...book.pages[0], image: "" }, ...book.pages.slice(1)] } }
  ];
  for (const example of cases) {
    const sequence = buildShortVowelTeachingSequence(example);
    assert.ok(sequence.game);
    assert.equal(sequence.book, null);
    assert.equal(sequence.checkWord, "");
    assert.equal(sequence.plan, "");
  }
});

test("a missing word picture leaves the eligible book available and withholds the full sequence", () => {
  const sequence = buildShortVowelTeachingSequence({ ...input, wordPicture: "" });
  assert.equal(sequence.game, null);
  assert.equal(sequence.book.id, book.id);
  assert.equal(sequence.checkWord, "");
  assert.equal(sequence.plan, "");
});
