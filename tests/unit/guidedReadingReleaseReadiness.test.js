import assert from "node:assert/strict";
import test from "node:test";

import {
  GUIDED_READING_RELEASE_READINESS,
  classifyGuidedReadingMediaFinding,
  getGuidedReadingReleaseBlock
} from "../../src/content/storyContentReviews.js";
import { RELEASE_GATES } from "../../tools/releaseGate.mjs";
import { BETA_RELEASE_POLICY } from "../../src/policy/betaReleasePolicy.js";
import { filterPublishedGuidedReadingBooks } from "../../src/policy/guidedReadingApprovalPolicy.js";

test("the official release gate strictly enforces both guided-reading release verdicts", () => {
  const storyPolicy = RELEASE_GATES.find(gate => gate.id === "story-content-policy");
  const storyBible = RELEASE_GATES.find(gate => gate.id === "guided-reading-story-bible");

  assert.deepEqual(
    storyPolicy?.command,
    ["npm", "run", "check:story-content-policy", "--", "--release"]
  );
  assert.deepEqual(
    storyBible?.command,
    ["npm", "run", "check:guided-reading-story-bible", "--", "--release"]
  );
});

test("a book field cannot bypass missing-media enforcement", () => {
  const spoofedBook = {
    id: "unregistered-book",
    mediaStatus: "scheduled"
  };
  assert.equal(getGuidedReadingReleaseBlock(spoofedBook), null);
  assert.deepEqual(
    classifyGuidedReadingMediaFinding(spoofedBook, "missing page image"),
    { error: "missing page image", releaseBlock: null }
  );
});

test("continuous QA accepts Willow without inventing human-listening evidence", () => {
  assert.equal(BETA_RELEASE_POLICY.unreportedMediaIsAccepted, true);
  assert.equal(GUIDED_READING_RELEASE_READINESS.status, "accepted");
  assert.equal(GUIDED_READING_RELEASE_READINESS.reviewMode, "continuous-pass-by-exception");
  assert.equal(GUIDED_READING_RELEASE_READINESS.bookIds.length, 20);
  assert.equal(GUIDED_READING_RELEASE_READINESS.blockedBooks.length, 0);
  assert.equal(GUIDED_READING_RELEASE_READINESS.expectedImages, 180);
  assert.equal(GUIDED_READING_RELEASE_READINESS.reviewedImages, 180);
  assert.equal(GUIDED_READING_RELEASE_READINESS.expectedNarrationPages, 160);
  assert.equal(GUIDED_READING_RELEASE_READINESS.exactNarrationPages, 160);
  assert.equal(GUIDED_READING_RELEASE_READINESS.humanListeningPendingPages, 160);
  assert.match(GUIDED_READING_RELEASE_READINESS.reason, /Direct human listening is not recorded for 160 page clips/u);
  assert.match(GUIDED_READING_RELEASE_READINESS.authorityFingerprint, /^[a-f0-9]{64}$/u);

  const registered = { id: "willow-street-the-lunchbox-mix-up", mediaStatus: "approved" };
  assert.equal(getGuidedReadingReleaseBlock(registered), null);
  for (const finding of ["missing cover image", "missing exact-text narration", "missing provenance"]) {
    assert.deepEqual(
      classifyGuidedReadingMediaFinding(registered, finding),
      { error: finding, releaseBlock: null }
    );
  }
});

test("Willow acceptance never overrides a reported quarantine or unavailable quarantine state", () => {
  const books = GUIDED_READING_RELEASE_READINESS.bookIds.map(id => ({ id }));
  const quarantinedId = books[0].id;
  assert.equal(filterPublishedGuidedReadingBooks(books, []).length, 20);
  const published = filterPublishedGuidedReadingBooks(books, [quarantinedId]);
  assert.equal(published.length, 19);
  assert.equal(published.some(book => book.id === quarantinedId), false);
  assert.deepEqual(filterPublishedGuidedReadingBooks(books, null), []);
});
