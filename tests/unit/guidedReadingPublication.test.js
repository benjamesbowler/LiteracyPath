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

test("Guided Reading publishes only explicitly approved books", () => {
  const rows = [
    { book_id: "approved-book", status: "approved", review_note: "" },
    { book_id: "quarantined-book", status: "quarantined", review_note: "Fix the image." }
  ];
  const books = [
    { id: "approved-book" },
    { id: "quarantined-book" },
    { id: "never-reviewed-book" }
  ];

  assert.equal(GUIDED_READING_PUBLICATION_MODEL, "approved_only");
  assert.deepEqual(approvedGuidedReadingBookIds(rows), ["approved-book"]);
  assert.deepEqual(quarantinedGuidedReadingBookIds(rows), ["quarantined-book"]);

  assert.deepEqual(
    filterPublishedGuidedReadingBooks(books, approvedGuidedReadingBookIds(rows)),
    [{ id: "approved-book" }]
  );

  assert.deepEqual(filterPublishedGuidedReadingBooks(books, []), []);
});

test("an unreadable review list fails closed", async () => {
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

test("every Guided Reading entry path receives the approval allowlist", () => {
  assert.match(
    appSurfaceSource,
    /setReadingFollowerBooks\(filterPublishedGuidedReadingBooks\(/
  );
  assert.match(appSurfaceSource, /<StudentBooksPage[\s\S]*?approvedBookIds=\{approvedReadingBookIds\}/);
  assert.match(appSurfaceSource, /renderReader=\{\(\{ bookId, books, onExit \}\)[\s\S]*?<GuidedReadingPage[\s\S]*?books=\{books\}/);
  assert.match(appSurfaceSource, /<ReadingSessionSetup[\s\S]*?approvedBookIds=\{approvedReadingBookIds\}/);
});

test("the daily mission advertises only an approved book", () => {
  const dailyMissionSource = readFileSync(
    new URL("../../src/utils/dailyMission.js", import.meta.url),
    "utf8"
  );
  assert.match(dailyMissionSource, /filterPublishedGuidedReadingBooks\(\s*\[\.\.\.GUIDED_READING_BOOK_INDEX\]/);
  assert.match(dailyMissionSource, /buildDailyMission\(scope, approvedBookIds\)/);

  const studentHomeSource = readFileSync(
    new URL("../../src/components/StudentHomePage.jsx", import.meta.url),
    "utf8"
  );
  assert.match(studentHomeSource, /buildDailyMission\(progressScopeKey, approvedBookIds\)/);
  assert.match(appSurfaceSource, /<StudentHomePage[\s\S]*?approvedBookIds=\{approvedReadingBookIds\}/);
});

test("the admin decision appears only at the end and provides Pass and Fail actions", () => {
  assert.match(
    guidedReadingPageSource,
    /isReviewMode && !isReaderFullscreen && pageIndex === selectedBook\.pages\.length - 1/
  );
  assert.match(guidedReadingPageSource, /Pass and publish/);
  assert.match(guidedReadingPageSource, /Fail to quarantine/);
});

test("database access exposes only approvals publicly and reserves review writes for app admins", () => {
  assert.match(
    failClosedMigration,
    /to anon, authenticated\s+using \(status = 'approved'\)/
  );
  assert.match(
    failClosedMigration,
    /drop policy if exists "Anyone can read quarantined guided reading books"/
  );
  assert.match(openByDefaultMigration, /using \(status = 'quarantined'\)/, "the superseded migration remains auditable");
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
