import assert from "node:assert/strict";
import test from "node:test";

import {
  GUIDED_READING_RELEASE_READINESS,
  classifyGuidedReadingMediaFinding,
  getGuidedReadingReleaseBlock
} from "../../src/content/storyContentReviews.js";

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

test("the central Willow pending authority is exact and fingerprint-bound", () => {
  assert.equal(GUIDED_READING_RELEASE_READINESS.status, "release-blocked");
  assert.equal(GUIDED_READING_RELEASE_READINESS.blockedBooks.length, 20);
  assert.equal(GUIDED_READING_RELEASE_READINESS.expectedImages, 180);
  assert.equal(GUIDED_READING_RELEASE_READINESS.expectedNarrationPages, 160);
  assert.match(GUIDED_READING_RELEASE_READINESS.authorityFingerprint, /^[a-f0-9]{64}$/u);

  const registered = { id: "willow-street-the-lunchbox-mix-up", mediaStatus: "approved" };
  assert.ok(getGuidedReadingReleaseBlock(registered));
  assert.deepEqual(
    classifyGuidedReadingMediaFinding(registered, "missing cover image"),
    { error: null, releaseBlock: "missing cover image" }
  );
});
