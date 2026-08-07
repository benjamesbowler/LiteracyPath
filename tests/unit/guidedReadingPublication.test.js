import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  GUIDED_READING_PUBLICATION_MODEL,
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

test("Guided Reading is open by default and only a failed review removes a book", () => {
  const rows = [
    { book_id: "approved-book", status: "approved", review_note: "" },
    { book_id: "quarantined-book", status: "quarantined", review_note: "Fix the image." }
  ];
  const books = [
    { id: "approved-book" },
    { id: "quarantined-book" },
    { id: "never-reviewed-book" }
  ];

  assert.equal(GUIDED_READING_PUBLICATION_MODEL, "open_by_default");
  assert.deepEqual(quarantinedGuidedReadingBookIds(rows), ["quarantined-book"]);

  // A book nobody has reviewed reaches children. That is the point of the change.
  assert.deepEqual(
    filterPublishedGuidedReadingBooks(books, quarantinedGuidedReadingBookIds(rows)),
    [{ id: "approved-book" }, { id: "never-reviewed-book" }]
  );

  // An empty review table means an open library, not an empty one.
  assert.deepEqual(filterPublishedGuidedReadingBooks(books, []), books);
});

test("an unreadable review list shows every book rather than none", async () => {
  // A publication service blip must never empty a five-year-old's shelf.
  assert.deepEqual(filterPublishedGuidedReadingBooks([{ id: "a" }], null), [{ id: "a" }]);
  assert.deepEqual(filterPublishedGuidedReadingBooks([{ id: "a" }], undefined), [{ id: "a" }]);

  const noService = await loadGuidedReadingBookReviews({});
  assert.equal(noService.status, "open");
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

test("every child Guided Reading entry path receives the quarantine blocklist", () => {
  assert.match(
    appSurfaceSource,
    /setReadingFollowerBooks\(filterPublishedGuidedReadingBooks\(/
  );
  assert.match(appSurfaceSource, /<StudentBooksPage[\s\S]*?quarantinedBookIds=\{quarantinedReadingBookIds\}/);
  assert.match(appSurfaceSource, /renderReader=\{\(\{ bookId, books, onExit \}\)[\s\S]*?<GuidedReadingPage[\s\S]*?books=\{books\}/);
  assert.match(appSurfaceSource, /<ReadingSessionSetup[\s\S]*?quarantinedBookIds=\{quarantinedReadingBookIds\}/);

  // The old allowlist filter must not creep back into a child path.
  assert.ok(!/filterApprovedGuidedReadingBooks/.test(appSurfaceSource));
});

test("the daily mission never advertises a book an admin has pulled", () => {
  // The mission's book tile deep-links by id, bypassing the library shelf. If
  // the blocklist stopped at the shelf, a failed book would still be the
  // advertised "book of the day" and one tap would open it.
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

test("the admin decision appears only at the end and provides Pass and Fail actions", () => {
  assert.match(
    guidedReadingPageSource,
    /isReviewMode && !isReaderFullscreen && pageIndex === selectedBook\.pages\.length - 1/
  );
  assert.match(guidedReadingPageSource, /Pass and keep live/);
  assert.match(guidedReadingPageSource, /Fail to quarantine/);
});

test("database access exposes the quarantine list publicly and reserves review writes for app admins", () => {
  // The child side reads what to HIDE, not what to show.
  assert.match(
    openByDefaultMigration,
    /to anon, authenticated\s+using \(status = 'quarantined'\)/
  );
  assert.match(
    openByDefaultMigration,
    /drop policy if exists "Anyone can read approved guided reading books"/
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
