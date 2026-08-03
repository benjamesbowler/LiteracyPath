import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  approvedGuidedReadingBookIds,
  filterApprovedGuidedReadingBooks,
  guidedReadingReviewMap,
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

test("Guided Reading publication fails closed for missing and quarantined reviews", () => {
  const rows = [
    { bookId: "approved-book", status: "approved", reviewNote: "" },
    { bookId: "quarantined-book", status: "quarantined", reviewNote: "Fix the image." }
  ];
  const books = [
    { id: "approved-book" },
    { id: "quarantined-book" },
    { id: "never-reviewed-book" }
  ];

  const approvedIds = approvedGuidedReadingBookIds(rows.map(row => ({
    book_id: row.bookId,
    status: row.status,
    review_note: row.reviewNote
  })));

  assert.deepEqual(approvedIds, ["approved-book"]);
  assert.deepEqual(filterApprovedGuidedReadingBooks(books, approvedIds), [
    { id: "approved-book" }
  ]);
  assert.deepEqual(filterApprovedGuidedReadingBooks(books, []), []);
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

test("every child Guided Reading entry path receives the approved-book allowlist", () => {
  assert.match(
    appSurfaceSource,
    /setReadingFollowerBooks\(filterApprovedGuidedReadingBooks\(/
  );
  assert.match(appSurfaceSource, /<StudentBooksPage[\s\S]*?approvedBookIds=\{approvedReadingBookIds\}/);
  assert.match(appSurfaceSource, /renderReader=\{\(\{ bookId, books, onExit \}\)[\s\S]*?<GuidedReadingPage[\s\S]*?books=\{books\}/);
  assert.match(appSurfaceSource, /<ReadingSessionSetup[\s\S]*?approvedBookIds=\{approvedReadingBookIds\}/);
});

test("the admin decision appears only at the end and provides Pass and Fail actions", () => {
  assert.match(
    guidedReadingPageSource,
    /isReviewMode && !isReaderFullscreen && pageIndex === selectedBook\.pages\.length - 1/
  );
  assert.match(guidedReadingPageSource, /Pass and activate/);
  assert.match(guidedReadingPageSource, /Fail to quarantine/);
});

test("database access exposes approved rows publicly and reserves review writes for app admins", () => {
  assert.match(
    publicationMigration,
    /to anon, authenticated\s+using \(status = 'approved'\)/
  );
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
