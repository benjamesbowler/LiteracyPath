import assert from "node:assert/strict";
import test from "node:test";

import { auditGuidedReadingNarrationProvenance } from "../../tools/checkGuidedReadingNarrationProvenance.mjs";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";

test("every Guided Reading page keeps word-for-word narration provenance", () => {
  const audit = auditGuidedReadingNarrationProvenance();
  const livePageCount = getRuntimeGuidedReadingBooks()
    .reduce((total, book) => total + (book.pages || []).length, 0);
  assert.equal(audit.livePageCount, livePageCount);
  assert.equal(audit.wordSequenceMismatchCount, 0);
  assert.equal(audit.missingAudioCount, 0);
  assert.equal(audit.unknownProvenanceCount, 0);
  assert.equal(audit.snapshotMatches, true);
  assert.deepEqual(audit.failures, []);
});

test("every Willow Street page has exact-current narration provenance", () => {
  const audit = auditGuidedReadingNarrationProvenance({ verifySnapshot: false });
  const willowPages = audit.pages.filter(page => page.bookId.startsWith("willow-street-"));

  assert.equal(willowPages.length, 160);
  assert.equal(willowPages.every(page => page.exactLedaAudioResolves), true);
  assert.equal(willowPages.some(page => page.origin === "unknown"), false);
  assert.equal(willowPages.some(page => page.narrationNeedsRebuild), false);
  assert.equal(audit.wordSequenceMismatchCount, 0);
});
