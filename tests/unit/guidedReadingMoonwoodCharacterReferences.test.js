import assert from "node:assert/strict";
import test from "node:test";

import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";

const moonwood = getRuntimeGuidedReadingBooks().filter(book => book.seriesId === "moonwood-tales");
const originalBooks = moonwood.filter(book => Number(book.bookNumber) <= 25);
const expansionBooks = moonwood.filter(book => Number(book.bookNumber) > 25);

test("original Moonwood references preserve Stone's giant scale instead of the retired baby-troll description", () => {
  assert.equal(originalBooks.length, 25);
  for (const book of originalBooks) {
    const description = book.characterReference.stone;
    assert.match(description, /stone giant/i, book.id);
    assert.match(description, /two to three times Pip's height/i, book.id);
    assert.match(description, /smooth pale gr[ae]y/i, book.id);
    assert.match(description, /tan sleeveless tunic/i, book.id);
    assert.doesNotMatch(description, /baby|troll/i, book.id);
  }
});

test("expansion Stone retains the separate rocky model at the same giant scale", () => {
  const stoneBooks = expansionBooks.filter(book => book.characterReference.stone);
  assert.ok(stoneBooks.length > 0);
  for (const book of stoneBooks) {
    const description = book.characterReference.stone;
    assert.match(description, /two to three times Pip's height/i, book.id);
    assert.match(description, /rough gr[ae]y stone skin/i, book.id);
    assert.match(description, /mossy shoulders/i, book.id);
    assert.match(description, /bare rocky torso/i, book.id);
    assert.doesNotMatch(description, /smooth|tan sleeveless tunic/i, book.id);
  }
});

test("original Fern and Luna references retain the botanical silhouette and natural owl anatomy", () => {
  for (const book of originalBooks) {
    const { fern, luna } = book.characterReference;
    assert.match(fern, /leaf-green skin/i, book.id);
    assert.match(fern, /fern-frond hair/i, book.id);
    assert.match(fern, /leaf-shaped wings/i, book.id);
    assert.doesNotMatch(fern, /fern-frond wings/i, book.id);
    assert.match(luna, /feathered wings/i, book.id);
    assert.match(luna, /taloned feet/i, book.id);
    assert.match(luna, /no human hands/i, book.id);
  }
});
