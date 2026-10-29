// BOOKS AND STORY QUESTS — the claims the two phase-D screens make about a
// child (2026-07-29 kids-side redesign, spec sections 4 and 5).
//
// Every value on those screens is a claim: which book they stopped in, which
// page they stopped on, how many stars a book won them, which stories are still
// ahead. This suite holds the policy to them, and holds both screens to the
// two-numeric-system cap the spec sets.

import { readFileSync, existsSync } from "node:fs";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import assert from "node:assert/strict";
import test from "node:test";

import { storyQuests } from "../../src/data/storyQuests.js";
import { selectActiveStudentTab } from "../../src/policy/studentRailPolicy.js";
import {
  BOOK_SHELF_SLOTS,
  QUEST_GRID_SLOTS,
  STORY_WORLDS,
  bookCollectionId,
  bookCollectionsForLevel,
  bookCoverSrc,
  bookCoverSources,
  bookReadingProgress,
  buildBookShelves,
  buildQuestCard,
  buildQuestGrid,
  pickContinueBook,
  questEndings,
  questPageNumber,
  questWorldId,
  reachedStoryWorld,
  windowBooks
} from "../../src/policy/childLibraryPolicy.js";
import { splitLevelCBooks } from "../../src/policy/guidedReadingCatalogPolicy.js";
import { APP_READING_LEVELS, getPublicBookMetadata } from "../../src/utils/guidedReading/bookLevelMetadata.js";
import { recommendBooksForStudent } from "../../src/utils/guidedReading/recommendBooksForStudent.js";

const booksPageSource = readFileSync("src/components/StudentBooksPage.jsx", "utf8");
const questsPageSource = readFileSync("src/components/StudentStoryQuestsPage.jsx", "utf8");
const libraryStyles = readFileSync("src/styles/kids-library.css", "utf8");
const appSource = readFileSync("src/components/AppSurface.jsx", "utf8");
const runtimeBooks = getRuntimeGuidedReadingBooks();

function catalogueBook(id) {
  const current = runtimeBooks.find(book => book.id === id);
  assert.ok(current, `${id}: current catalogue fixture`);
  return current;
}

function book(id, level, pages = 6, extra = {}) {
  return {
    id,
    title: id.replaceAll("-", " "),
    level,
    coverImage: `/covers/${id}.webp`,
    pages: Array.from({ length: pages }, (unused, index) => ({
      pageNumber: index + 1,
      image: `/pages/${id}-${index + 1}.webp`
    })),
    ...extra
  };
}

test("book progress does not project legacy quiz stars", () => {
  const progress = bookReadingProgress(
    book("book-1", "C", 2),
    { completed: true, quizScore: 3, quizTotal: 3 }
  );
  assert.equal("stars" in progress, false);
});

test("public App C browsing does not impose the internal C-standard restriction", () => {
  // Compatibility placement/profile changes do not change the reviewed prose.
  const compact = { ...catalogueBook("gr-a-26"), level: "C" };
  const extended = { ...catalogueBook("gr-b-31"), level: "C", readingBandProfile: "extended" };
  assert.equal(getPublicBookMetadata(extended).appReadingLevel, "C");
  const bands = splitLevelCBooks([compact, extended]);
  assert.equal(bands.standard.length, 1);
  assert.equal(bands.extended.length, 1);
  const [shelf] = buildBookShelves({ books: [...bands.standard, ...bands.extended], level: "C" });
  assert.deepEqual(new Set(shelf.books.map(row => row.book.id)), new Set([compact.id, extended.id]));
  assert.equal(shelf.title, "Books for you");
  assert.doesNotMatch(shelf.note, /Level|C Standard/);
  assert.deepEqual(buildBookShelves({ books: [...bands.standard, ...bands.extended], mode: "together" })[0].books.map(row => row.book.id), [extended.id]);
});

for (const level of APP_READING_LEVELS) test(`App ${level} recommendations populate the matching public shelf and collections`, () => {
  const current = runtimeBooks.find(book => getPublicBookMetadata(book).appReadingLevel === level);
  assert.ok(current, `${level}: current reviewed fixture`);
  const stale = { ...current, pages: current.pages.map((page, index) => index ? page : { ...page, text: `${page.text} Changed text.` }) };
  const unreviewed = { ...current, id: `unreviewed-${level}`, level, appReadingLevel: level, levelLabel: `App level ${level}` };
  const candidates = [...runtimeBooks, stale, unreviewed];
  const recommendations = recommendBooksForStudent({ books: candidates, studentProgress: { appReadingLevel: level } });
  assert.ok(recommendations.length > 0, `${level}: recommendations exist`);
  assert.ok(recommendations.every(item => item.readingLevel === level && getPublicBookMetadata(item.book).levelStatus === "current"));
  const [shelf] = buildBookShelves({
    books: candidates, level: recommendations[0].readingLevel,
    order: recommendations.map(item => item.book.id), slots: candidates.length
  });
  assert.deepEqual(shelf.books.map(row => row.book.id), recommendations.map(item => item.book.id));
  assert.ok(shelf.books.every(row => getPublicBookMetadata(row.book).appReadingLevel === level));
  assert.ok(shelf.books.every(row => row.book !== stale && row.book !== unreviewed));
  assert.equal(buildBookShelves({ books: [stale, unreviewed], level })[0].total, 0);
  assert.deepEqual(bookCollectionsForLevel([stale, unreviewed], level), []);
  assert.deepEqual(
    bookCollectionsForLevel(candidates, level).map(collection => collection.id).sort(),
    [...new Set(recommendations.map(item => bookCollectionId(item.book)))].sort()
  );
});

test("pending or unsupported band values cannot turn unreviewed claims into recommendations", () => {
  const unreviewed = { ...catalogueBook("gr-a-27"), id: "unreviewed-claimed-band", appReadingLevel: "A", level: "A" };
  for (const level of [null, "", "pending", "READ_ALOUD", "I"]) {
    assert.equal(buildBookShelves({ books: [...runtimeBooks, unreviewed], level })[0].total, 0);
  }
});

test("a saved bookmark takes precedence over the furthest page reached", () => {
  const target = book("rain", "A", 12);
  const saved = bookReadingProgress(target, { completedPages: 8, lastPageIndex: 2 });
  assert.equal(saved.page, 3);
  assert.equal(saved.pageIndex, 2);
  assert.equal(saved.percent, 67);
  const visited = bookReadingProgress(target, { completedPages: 8, pageStats: {
    8: { lastOpenedAt: "2026-09-28" }, 3: { lastOpenedAt: "2026-09-30" }
  } });
  assert.equal(visited.page, 3);
  assert.equal(bookReadingProgress(target, { completedPages: 5 }).page, 5);
  assert.equal(bookReadingProgress(target, { lastPageIndex: 100 }).page, 1);
  assert.equal(bookReadingProgress(target, { lastPageIndex: 100, pageStats: { 3: { lastOpenedAt: "2026-09-30" } } }).page, 3);
  assert.equal(bookReadingProgress(target).started, false);
});

test("the continuation is the most recently read unfinished book", () => {
  const books = [book("one", "A"), book("two", "A"), book("three", "A")];
  const records = { one: { completedPages: 2, lastReadAt: "2026-07-01" }, two: { completedPages: 4, lastPageIndex: 1, lastReadAt: "2026-07-20" }, three: { completed: true, lastReadAt: "2026-07-28" } };
  assert.equal(pickContinueBook({ books, records }).book.id, "two");
  assert.equal(pickContinueBook({ books, records }).progress.page, 2);
  assert.equal(pickContinueBook({ books, records: {} }), null);
});

test("one six-book shelf excludes the featured book and pages through every alternative", () => {
  const books = runtimeBooks.filter(book => getPublicBookMetadata(book).appReadingLevel === "B").slice(0, 30);
  assert.equal(books.length, 30);
  const excludedId = books[0].id;
  const seen = new Set();
  for (let page = 0; page < 30; page += BOOK_SHELF_SLOTS) {
    const shelves = buildBookShelves({ books, level: "B", excludeBookId: excludedId, justRightPage: page });
    assert.equal(shelves.length, 1);
    assert.equal(shelves[0].books.length, BOOK_SHELF_SLOTS);
    assert.equal(shelves[0].step, BOOK_SHELF_SLOTS);
    assert.equal(shelves[0].hasMore, true);
    for (const row of shelves[0].books) { assert.notEqual(row.book.id, excludedId); seen.add(row.book.id); }
  }
  assert.equal(seen.size, 29);
  assert.deepEqual(windowBooks([1, 2, 3, 4], 3, 3), [4, 1, 2]);
});

test("discovery preserves the eligible pool, read-together support, and own rereading history", () => {
  const a = catalogueBook("first-facts-level-a-02-farm-animals");
  const b = catalogueBook("gr-a-28");
  const shared = catalogueBook("meadow-pals-science-01-missing-sandwich");
  const books = [a, b, shared];
  assert.deepEqual(buildBookShelves({ books, level: "A" })[0].books.map(row => row.book.id), [a.id]);
  assert.equal(buildBookShelves({ books, mode: "all" })[0].books.length, 3);
  assert.deepEqual(buildBookShelves({ books, mode: "together" })[0].books.map(row => row.book.id), [shared.id]);
  const [again] = buildBookShelves({ books, mode: "read-again", records: { [b.id]: { completed: true } } });
  assert.deepEqual(again.books.map(row => row.book.id), [b.id]);
  assert.equal(again.books[0].progress.completed, true);
  assert.equal(buildBookShelves({ books: [], mode: "all" })[0].total, 0);
});

test("collections cover all approved books independently of app text-level browsing", () => {
  const books = [catalogueBook("bob-and-nan-01"), catalogueBook("meadow-pals-01-muddy-has-a-bath"), catalogueBook("dino-pals-01-chompys-big-lunch")];
  assert.deepEqual(bookCollectionsForLevel(books).map(row => row.label), ["Bob & Nan", "Meadow Pals", "Dino Pals"]);
  assert.deepEqual(bookCollectionsForLevel(books, "A").map(row => row.label), ["Meadow Pals"]);
  assert.deepEqual(bookCollectionsForLevel(books, "B").map(row => row.label), ["Bob & Nan"]);
  assert.deepEqual(bookCollectionsForLevel(books, "C").map(row => row.label), ["Dino Pals"]);
  assert.equal(bookCollectionId(books[0]), "bob-and-nan");
});

test("cover resolution only tries permitted images belonging to that same book", () => {
  const target = book("rain", "A");
  assert.equal(bookCoverSrc(target), "/covers/rain.webp");
  const retired = ({ path, pageNumber }) => path === "/covers/rain.webp" || pageNumber === 1;
  assert.equal(bookCoverSrc(target, retired), "/pages/rain-2.webp");
  assert.equal(bookCoverSources(target, () => true).length, 0);
  assert.equal(bookCoverSrc({ id: "bare" }), "");
  assert.deepEqual(bookCoverSources({ ...target, pages: [{ image: "/bad.webp", active: false }, { image: "/pending.webp", qaStatus: "pending" }] }, ({ pageNumber }) => pageNumber === 0), []);
});

test("every canonical runtime book resolves to its own existing approved cover", () => {
  const books = getRuntimeGuidedReadingBooks();
  assert.ok(books.length >= 227);
  for (const book of books) {
    const src = bookCoverSrc(book);
    assert.equal(src, book.coverImage, book.id);
    assert.ok(existsSync(`public${src.split(/[?#]/)[0]}`), `${book.id}: ${src}`);
  }
});

test("every real story quest lands in a world, and the worlds cover the catalogue", () => {
  const seen = new Set(storyQuests.map(questWorldId));
  assert.deepEqual([...seen].sort(), STORY_WORLDS.map(world => world.id).sort());
  assert.equal(questWorldId({ level: "Early" }), "meadow");
  assert.equal(questWorldId({ level: "B" }), "dino");
  assert.equal(questWorldId({ level: "C" }), "moonwood");
  assert.equal(questWorldId({}), "meadow", "an unlabelled story starts the child in the first world");
});

test("endings and the resumed page are read from real data, never counted up", () => {
  for (const quest of storyQuests) {
    assert.ok(
      questEndings(quest) >= 2,
      `${quest.id} must offer at least two endings for "N endings" to be worth saying`
    );
  }
  assert.equal(questPageNumber("p03_pip_edge"), null);
  assert.equal(questPageNumber("page-07", ["start", "fork", "page-07"]), 3);
  assert.equal(questPageNumber(""), null);
  assert.equal(questPageNumber("start"), null);
});

test("the world a child has reached comes from what they have actually opened", () => {
  const quests = storyQuests;
  assert.equal(reachedStoryWorld({ quests, progress: {} }), "meadow");

  const dinoQuest = quests.find(quest => questWorldId(quest) === "dino");
  assert.equal(
    reachedStoryWorld({ quests, progress: { [dinoQuest.id]: { opened: true } } }),
    "dino"
  );
  // A reading level the caller knows about can only widen it, never narrow it.
  assert.equal(reachedStoryWorld({ quests, progress: {}, readingLevel: "C" }), "moonwood");
  assert.equal(reachedStoryWorld({ quests, progress: {}, readingLevel: "F" }), "moonwood");
  assert.equal(
    reachedStoryWorld({ quests, progress: { [dinoQuest.id]: { opened: true } }, readingLevel: "A" }),
    "dino"
  );
});

test("a quest badge says what to do, and the note under it is true", () => {
  const quest = { id: "q", title: "Q", level: "A", pages: [{ choices: [{ nextPageId: "end" }] }] };

  const carryOn = buildQuestCard({ quest, row: { opened: true, lastPageId: "p03_x" } });
  assert.equal(carryOn.badge, "Continue");
  assert.equal(carryOn.note, "Continue your story");

  const done = buildQuestCard({ quest, row: { opened: true, completed: true } });
  assert.equal(done.badge, "Read again");
  assert.equal(done.note, "You choose what happens");

  const fresh = buildQuestCard({ quest, row: {} });
  assert.equal(fresh.badge, "New");
  assert.equal(fresh.note, "You choose what happens");

  const ahead = buildQuestCard({
    quest: { ...quest, level: "C", series: "Moonwood Tales" },
    row: {},
    reachedIndex: 0
  });
  assert.equal(ahead.badge, "New");
  assert.equal(ahead.note, "You choose what happens");

  // A story already started is never demoted to "Next world" by where it lives.
  const startedAhead = buildQuestCard({
    quest: { ...quest, level: "C" },
    row: { opened: true, lastPageId: "p01" },
    reachedIndex: 0
  });
  assert.equal(startedAhead.badge, "Continue");
});

test("the quest grid never borrows stories from another world", () => {
  for (const world of STORY_WORLDS) {
    const cards = buildQuestGrid({ quests: storyQuests, progress: {}, world: world.id });
    assert.ok(cards.length > 0 && cards.length <= QUEST_GRID_SLOTS);
    assert.ok(
      cards.every(card => card.world === world.id),
      `${world.id} must not show a story from another world`
    );
  }

  const finished = storyQuests.find(quest => questWorldId(quest) === "meadow");
  const cards = buildQuestGrid({
    quests: storyQuests,
    progress: { [finished.id]: { opened: true, completed: true } },
    world: "moonwood",
    reachedWorld: "moonwood"
  });
  assert.equal(cards.some(card => card.id === finished.id), false);
});

test("the story you are in is the one the grid puts first", () => {
  const inProgress = storyQuests.find(quest => questWorldId(quest) === "meadow");
  const cards = buildQuestGrid({
    quests: storyQuests,
    progress: { [inProgress.id]: { opened: true, lastPageId: "p02_a" } },
    world: "meadow"
  });
  assert.equal(cards[0].id, inProgress.id);
  assert.equal(cards[0].badge, "Continue");
});

// The comments in both screens NAME the counters that were removed, which is
// the point of them. Strip them before asking whether a counter is back.
function code(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

test("neither screen brings back a third numeric system", () => {
  for (const source of [code(booksPageSource), code(questsPageSource)]) {
    assert.doesNotMatch(source, /story words seen/);
    assert.doesNotMatch(source, /in progress</);
    assert.doesNotMatch(source, /books read|reading goal/i);
    assert.doesNotMatch(source, /\{\s*\w+\s*\}\s*of\s*\{\s*\w+\s*\}\s*(?:complete|books|stories)/);
  }
  // The one "of" a child may see on these screens is a position in the book
  // they are reading, which is a bookmark and not a currency.
  assert.match(booksPageSource, /Page \{panelProgress\.page\} of \{panelProgress\.totalPages\}/);
});

test("Books and Story Quests are one place: the Books tab stays lit on both", () => {
  assert.equal(selectActiveStudentTab("books"), "books");
  assert.equal(selectActiveStudentTab("stories"), "books");
  assert.match(booksPageSource, /active="books"/);
  assert.match(questsPageSource, /active="stories"/);
  assert.match(questsPageSource, /aria-label="Back to Books"/);
  assert.match(booksPageSource, /onOpenStoryQuests/);
  assert.match(appSource, /onBackToBooks=\{\(\)\s*=>\s*\{[\s\S]*?setAppView\(APP_VIEWS\.GUIDED_READING\)/);
});

test("both screens keep the capabilities the shelf pages they replace had", () => {
  // The level filter the old reading library had, and the level grouping the
  // old Story Quests page had, both survive as on-screen controls.
  assert.match(code(booksPageSource), /aria-label="Book levels"/);
  assert.match(code(booksPageSource), /getBookTextAnalysis/);
  assert.doesNotMatch(code(booksPageSource), /guidedReadingLevelLabel|C Standard/);
  assert.match(booksPageSource, /Find a book/);
  assert.match(booksPageSource, /Stories or facts/);
  assert.match(booksPageSource, /Friends or topic/);
  assert.match(questsPageSource, /aria-label="Story worlds"/);
  // The reader and the player are handed in, never reimplemented.
  assert.match(booksPageSource, /renderReader\(\{ bookId: openBookId[\s\S]*?initialPageIndex: saved.started \? saved.pageIndex : null/);
  assert.match(questsPageSource, /renderQuest\(\{[\s\S]*?questId: playingId/);
  // A recommendation on a child surface has to say why it was made.
  assert.match(booksPageSource, /ChildRecommendationExplanation/);
});

test("a read that failed never renders as a child who has read nothing", () => {
  assert.match(booksPageSource, /data-read-state=\{recordsOk \? "ready" : "unreadable"\}/);
  assert.match(questsPageSource, /data-read-state=\{read\.ok \? "ready" : "unreadable"\}/);
  assert.match(booksPageSource, /We could not open your reading just now\./);
  assert.match(questsPageSource, /We could not open your stories/);
});

test("Story Quests retain their bounded world grid; Books use their separate catalogue", () => {
  // Books are now a native continuous gallery. Story Quests still own their
  // paged world geometry; don't accidentally apply the gallery to that route.
  assert.match(libraryStyles, /\.kg-quests \{[\s\S]*?grid-template-rows: auto minmax\(0, 1fr\);/);
  assert.match(libraryStyles, /\.kg-quest-grid \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(2, minmax\(0, 1fr\)\);/);
  // The button-content trap kids-home.css records: `.app button` centres its
  // content and collapses a 1fr art row to zero unless it is reset.
  assert.match(libraryStyles, /\.kg-quest-card \{[\s\S]*?align-items: stretch;[\s\S]*?justify-content: normal;/);
  // Every rule is scoped to the stage, or App.css out-specifies it.
  const selectors = libraryStyles.match(/^\.[^\s{][^{]*\{/gm) || [];
  assert.deepEqual(
    selectors.filter(selector => !selector.startsWith(".kg-stage ")),
    [],
    "every selector in kids-library.css must carry the .kg-stage prefix"
  );
});

test("a replay in progress remains resumable after a past completion", () => {
  const quest = { id: "q", level: "A" };
  assert.equal(buildQuestCard({ quest, row: { opened: true, completed: true, routeFinished: false, lastPageId: "fork" } }).state, "carry-on");
  assert.equal(buildQuestCard({ quest, row: { opened: true, completed: true, routeFinished: true, lastPageId: "ending" } }).badge, "Read again");
});

test("first recommendations respect reading track and current route, not alphabetic title", () => {
  const quests = [
    { id: "early", title: "A title", level: "Early" },
    { id: "a", title: "Z title", level: "A" }
  ];
  assert.equal(buildQuestGrid({ quests, readingLevel: "A" })[0].id, "a");
  assert.equal(buildQuestGrid({ quests, readingLevel: "Early" })[0].id, "early");
  assert.equal(buildQuestGrid({ quests, readingLevel: "A", progress: { early: { opened: true, lastPageId: "fork" } } })[0].id, "early");
});
