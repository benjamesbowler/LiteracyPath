import assert from "node:assert/strict";
import test from "node:test";

import { guidedReadingBooks } from "../../src/data/guidedReadingBooks.js";
import {
  GUIDED_READING_BAND_PROFILES,
  GUIDED_READING_BOOK_METADATA,
  GUIDED_READING_READING_MODES,
  getGuidedReadingBookMetadata
} from "../../src/data/guidedReadingBookMetadata.js";
import {
  childGuidedReadingModeLabel,
  guidedReadingBandLabel,
  guidedReadingModeLabel
} from "../../src/policy/guidedReadingCatalogPolicy.js";
import { normalizeReadableBook } from "../../src/utils/guidedReading/normalizeReadableBook.js";
import { applyGuidedReadingLevelOverride } from "../../src/utils/guidedReading/bookLevelOverrides.js";

test("every runtime book has one valid editorial classification", () => {
  assert.deepEqual(
    new Set(Object.keys(GUIDED_READING_BOOK_METADATA)),
    new Set(guidedReadingBooks.map(book => book.id))
  );
  for (const book of guidedReadingBooks) {
    const metadata = getGuidedReadingBookMetadata(book.id);
    assert.ok(GUIDED_READING_BAND_PROFILES.includes(metadata.readingBandProfile));
    assert.ok(GUIDED_READING_READING_MODES.includes(metadata.readingMode));
  }
});

test("Moonwood is extended read-together and other current C books are standard", () => {
  for (const book of guidedReadingBooks.filter(book => book.id.startsWith("moonwood-tales-"))) {
    assert.deepEqual(getGuidedReadingBookMetadata(book.id), {
      readingBandProfile: "extended",
      readingMode: "supported-read-together"
    });
  }

  for (const book of guidedReadingBooks.filter(book => book.level === "C" && !book.id.startsWith("moonwood-tales-"))) {
    assert.deepEqual(getGuidedReadingBookMetadata(book.id), {
      readingBandProfile: "standard",
      readingMode: "predictable-levelled"
    });
  }
});

test("the reviewed current catalogue has the exact honest mode split", () => {
  const rows = guidedReadingBooks.map(book => getGuidedReadingBookMetadata(book.id));
  assert.equal(rows.filter(row => row.readingBandProfile === "standard").length, 171);
  assert.equal(rows.filter(row => row.readingBandProfile === "extended").length, 35);
  assert.equal(rows.filter(row => row.readingMode === "predictable-levelled").length, 171);
  assert.equal(rows.filter(row => row.readingMode === "supported-read-together").length, 35);
  assert.equal(rows.filter(row => row.readingMode === "decodable").length, 0);
});

test("the current C Standard authority is exactly the two reviewed ten-book sets", () => {
  const expectedIds = [
    ...Array.from({ length: 10 }, (unused, index) => `ab-c-${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 10 }, (unused, index) => (
      `level-c-nonfiction-${String(index + 1).padStart(2, "0")}-${[
        "bees", "volcanoes", "penguins", "the-moon", "how-seeds-grow",
        "spiders", "under-the-ocean", "butterflies", "caves", "frogs"
      ][index]}`
    ))
  ];
  const actualIds = guidedReadingBooks
    .filter(book => book.level === "C" && getGuidedReadingBookMetadata(book)?.readingBandProfile === "standard")
    .map(book => book.id)
    .sort();
  assert.deepEqual(actualIds, expectedIds.sort());
  assert.equal(Object.keys(GUIDED_READING_BOOK_METADATA).some(id => id.startsWith("willow-street-")), false);
});

test("a decodable editorial label requires explicit full-text decoding evidence", () => {
  for (const book of guidedReadingBooks) {
    const metadata = getGuidedReadingBookMetadata(book.id);
    if (metadata.readingMode === "decodable") {
      assert.ok(book.fullTextDecodingEvidence, `${book.id} needs full-text decoding evidence`);
    } else {
      assert.ok(
        ["predictable-levelled", "supported-read-together"].includes(metadata.readingMode),
        `${book.id} must not claim decodability without evidence`
      );
    }
  }
});

test("normalization preserves immutable editorial metadata when a runtime level changes", () => {
  const moonwood = guidedReadingBooks.find(book => book.id === "moonwood-tales-c-01");
  const overridden = applyGuidedReadingLevelOverride({
    ...moonwood,
    ...getGuidedReadingBookMetadata(moonwood)
  }, { [moonwood.id]: "B" });
  const normalized = normalizeReadableBook(overridden);
  assert.equal(normalized.level, "B");
  assert.equal(normalized.readingBandProfile, "extended");
  assert.equal(normalized.readingMode, "supported-read-together");
});

test("shared teacher labels preserve the current level and name both C bands", () => {
  assert.equal(guidedReadingBandLabel("standard", "A"), "Level A");
  assert.equal(guidedReadingBandLabel("standard", "C"), "C Standard");
  assert.equal(guidedReadingBandLabel("extended", "C"), "C Extended / Read Together");
  assert.equal(guidedReadingBandLabel("extended", "B"), "Level B · Extended / Read Together");
  assert.equal(guidedReadingModeLabel("predictable-levelled"), "Predictable / Levelled");
  assert.equal(guidedReadingModeLabel("supported-read-together"), "Supported Read-Together");
});

test("child editorial labels stay brief enough to sit beside learner-specific support copy", () => {
  assert.equal(childGuidedReadingModeLabel({ readingMode: "decodable" }), "Sound out");
  assert.equal(childGuidedReadingModeLabel({ readingMode: "predictable-levelled" }), "Pattern");
  assert.equal(childGuidedReadingModeLabel({ readingMode: "supported-read-together" }), "Together");
});
