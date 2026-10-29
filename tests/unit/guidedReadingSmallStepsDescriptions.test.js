import test from "node:test";
import assert from "node:assert/strict";
import { GUIDED_READING_SMALL_STEPS_BOOKS } from "../../src/data/guidedReadingSmallStepsBooks.js";
import { GUIDED_READING_SMALL_STEPS_DESCRIPTIONS } from "../../src/data/guidedReadingSmallStepsDescriptions.js";

test("all 150 Small Steps pages expose complete descriptions without production instructions", () => {
  assert.equal(GUIDED_READING_SMALL_STEPS_BOOKS.length, 20);
  assert.deepEqual(Object.keys(GUIDED_READING_SMALL_STEPS_DESCRIPTIONS).sort(),
    GUIDED_READING_SMALL_STEPS_BOOKS.map(book => book.id).sort());

  const productionTerms = /\b(?:canonical|canon|composition|foreground|background|anatomically|anatomy|image brief|reference image|same master|continuity|no (?:second|extra|duplicate)|preserve|retain|avoid)\b|(?:^|[.!?]\s+)(?:Show|Keep|Make|Do not)\b/iu;
  let pageCount = 0;
  for (const book of GUIDED_READING_SMALL_STEPS_BOOKS) {
    const descriptions = GUIDED_READING_SMALL_STEPS_DESCRIPTIONS[book.id];
    assert.equal(descriptions.length, book.pages.length, book.id);
    for (const page of book.pages) {
      const label = `${book.id} page ${page.pageNumber}`;
      const description = descriptions[page.pageNumber - 1];
      assert.equal(typeof description, "string", label);
      assert.ok(description.trim().length > 0, label);
      assert.match(description, /[.!?]$/u, label);
      assert.doesNotMatch(description, productionTerms, label);
      assert.notEqual(description, page.imageBrief, label);
      assert.equal(page.imageAlt, description, label);
      assert.equal(page.pageDescription, description, label);
      pageCount += 1;
    }
  }
  assert.equal(pageCount, 150);
});
