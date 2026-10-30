import test from "node:test";
import assert from "node:assert/strict";
import { validateSharedReadAloudManuscript } from "../../tools/sharedReadAloudGateLib.mjs";
import { usesCharacterNarration } from "../../src/data/sharedReadAloudContracts.js";
import { MEADOW_PALS_SCIENCE_BOOKS } from "../../src/data/meadowPalsScienceBooks.js";

test("the generic shared-reader gate retains the original exact science manuscript checks", () => {
  const book = MEADOW_PALS_SCIENCE_BOOKS[0];
  assert.deepEqual(validateSharedReadAloudManuscript(book), []);
  assert.equal(usesCharacterNarration(book), true);
  assert.ok(validateSharedReadAloudManuscript({...book, pages: book.pages.slice(1)}).includes("approved manuscript changed"));
  assert.deepEqual(validateSharedReadAloudManuscript({...book, id: "unregistered"}), ["unregistered shared-read-aloud book"]);
});

test("ordinary shared-reader narration is included in Leda and cannot bypass manuscript or budget checks", () => {
  const book = {
    id: "bright-ideas-20", title: "Beneath Our Street", level: "READ_ALOUD",
    readingBandProfile: "read-aloud", readingMode: "supported-read-together",
    independentReadingLevel: null, interestAge: "6–9 with support", narrationProfile: "leda",
    pages: [{ text: "word ".repeat(54), narrationProfile: "leda" }]
  };
  assert.equal(usesCharacterNarration(book), false);
  const failures = validateSharedReadAloudManuscript(book);
  assert.ok(failures.includes("approved manuscript changed"));
  assert.ok(failures.includes("approved page count changed"));
  assert.ok(failures.includes("page 1: approved text budget exceeded"));
  assert.ok(validateSharedReadAloudManuscript({...book, narrationProfile: "meadow-science-character-dialogue"})
    .includes("approved narration profile changed"));
});
