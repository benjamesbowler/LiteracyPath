import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  GUIDED_READING_PUBLICATION_MODEL,
  approvedGuidedReadingBookIds,
  filterPublishedGuidedReadingBooks,
  guidedReadingReviewMap,
  loadGuidedReadingBookReviews,
  quarantinedGuidedReadingBookIds,
  saveGuidedReadingBookReview
} from "../../src/data/guidedReadingPublication.js";

const appSurfaceSource = readFileSync(
  new URL("../../src/components/AppSurface.jsx", import.meta.url),
  "utf8"
);
const guidedReadingPageSource = readFileSync(
  new URL("../../src/components/guided-reading/GuidedReadingPage.jsx", import.meta.url),
  "utf8"
);
const publicationMigration = readFileSync(
  new URL("../../supabase/migrations/20260803120000_guided_reading_publication_gate.sql", import.meta.url),
  "utf8"
);
const openByDefaultMigration = readFileSync(
  new URL("../../supabase/migrations/20260807090000_guided_reading_open_by_default.sql", import.meta.url),
  "utf8"
);
const failClosedMigration = readFileSync(
  new URL("../../supabase/migrations/20260809090000_guided_reading_fail_closed_publication.sql", import.meta.url),
  "utf8"
);
const continuousReviewMigration = readFileSync(
  new URL("../../supabase/migrations/20260821224000_continuous_guided_reading_review.sql", import.meta.url),
  "utf8"
);

test("Guided Reading accepts every book unless it is explicitly quarantined", () => {
  const rows = [
    { book_id: "approved-book", status: "approved", review_note: "" },
    { book_id: "quarantined-book", status: "quarantined", review_note: "Fix the image." }
  ];
  const books = [
    { id: "approved-book" },
    { id: "quarantined-book" },
    { id: "never-reviewed-book" }
  ];

  assert.equal(GUIDED_READING_PUBLICATION_MODEL, "accepted_unless_quarantined");
  assert.deepEqual(approvedGuidedReadingBookIds(rows), ["approved-book"]);
  assert.deepEqual(quarantinedGuidedReadingBookIds(rows), ["quarantined-book"]);

  assert.deepEqual(
    filterPublishedGuidedReadingBooks(books, quarantinedGuidedReadingBookIds(rows)),
    [{ id: "approved-book" }, { id: "never-reviewed-book" }]
  );

  assert.deepEqual(filterPublishedGuidedReadingBooks(books, []), books);
});

test("an unreadable quarantine list fails closed", async () => {
  assert.deepEqual(filterPublishedGuidedReadingBooks([{ id: "a" }], null), []);
  assert.deepEqual(filterPublishedGuidedReadingBooks([{ id: "a" }], undefined), []);

  const noService = await loadGuidedReadingBookReviews({});
  assert.equal(noService.status, "unavailable");
  assert.equal(noService.complete, false);
  assert.deepEqual(noService.rows, []);
  assert.equal(noService.error, null);
});

test("review maps retain quarantine repair notes", () => {
  const reviews = guidedReadingReviewMap([{
    book_id: "book-1",
    status: "quarantined",
    review_note: "Narration is missing.",
    reviewed_at: "2026-08-03T00:00:00.000Z"
  }]);

  assert.equal(reviews["book-1"].status, "quarantined");
  assert.equal(reviews["book-1"].reviewNote, "Narration is missing.");
});

test("a failed review requires a repair note before any write", async () => {
  let touched = false;
  const result = await saveGuidedReadingBookReview({
    client: { table: () => { touched = true; } },
    bookId: "book-1",
    reviewerId: "admin-1",
    status: "quarantined",
    reviewNote: ""
  });

  assert.equal(result.ok, false);
  assert.equal(touched, false);
  assert.match(result.error.message, /needs fixing/i);
});

test("every Guided Reading entry path receives the quarantine blocklist", () => {
  assert.match(
    appSurfaceSource,
    /setReadingFollowerBooks\(filterPublishedGuidedReadingBooks\(/
  );
  assert.match(appSurfaceSource, /<StudentBooksPage[\s\S]*?quarantinedBookIds=\{quarantinedReadingBookIds\}/);
  assert.match(appSurfaceSource, /renderReader=\{\(\{ bookId, books, onExit \}\)[\s\S]*?<GuidedReadingPage[\s\S]*?books=\{books\}/);
  assert.match(appSurfaceSource, /<ReadingSessionSetup[\s\S]*?quarantinedBookIds=\{quarantinedReadingBookIds\}/);
});

test("the daily mission excludes a quarantined book", () => {
  const dailyMissionSource = readFileSync(
    new URL("../../src/utils/dailyMission.js", import.meta.url),
    "utf8"
  );
  assert.match(dailyMissionSource, /filterPublishedGuidedReadingBooks\(\s*\[\.\.\.GUIDED_READING_BOOK_INDEX\]/);
  assert.match(dailyMissionSource, /buildDailyMission\(scope, quarantinedBookIds\)/);

  const studentHomeSource = readFileSync(
    new URL("../../src/components/StudentHomePage.jsx", import.meta.url),
    "utf8"
  );
  assert.match(studentHomeSource, /buildDailyMission\(progressScopeKey, quarantinedBookIds\)/);
  assert.match(appSurfaceSource, /<StudentHomePage[\s\S]*?quarantinedBookIds=\{quarantinedReadingBookIds\}/);
});

test("the admin decision appears only at the end and provides keep and report actions", () => {
  assert.match(
    guidedReadingPageSource,
    /isReviewMode && !isReaderFullscreen && pageIndex === selectedBook\.pages\.length - 1/
  );
  assert.match(guidedReadingPageSource, /Keep accepted/);
  assert.match(guidedReadingPageSource, /Report defect/);
});

test("database access exposes only quarantine ids publicly and reserves review writes for app admins", () => {
  assert.match(
    failClosedMigration,
    /to anon, authenticated\s+using \(status = 'approved'\)/
  );
  assert.match(
    failClosedMigration,
    /drop policy if exists "Anyone can read quarantined guided reading books"/
  );
  assert.match(openByDefaultMigration, /using \(status = 'quarantined'\)/, "the superseded migration remains auditable");
  assert.match(continuousReviewMigration, /create or replace view public\.guided_reading_quarantines/);
  assert.match(continuousReviewMigration, /select book_id, status[\s\S]*?where status = 'quarantined'/);
  assert.match(continuousReviewMigration, /revoke all on table public\.guided_reading_book_reviews from anon/);
  assert.doesNotMatch(continuousReviewMigration, /review_note[\s\S]*?select book_id, status/);
  assert.match(
    publicationMigration,
    /App admins can read all guided reading reviews[\s\S]*?public\.is_app_admin\(auth\.uid\(\)\)/
  );
  assert.match(
    publicationMigration,
    /App admins can create guided reading reviews[\s\S]*?public\.is_app_admin\(auth\.uid\(\)\)/
  );
  assert.match(
    publicationMigration,
    /guided_reading_quarantine_note_required[\s\S]*?status <> 'quarantined'/
  );
});
