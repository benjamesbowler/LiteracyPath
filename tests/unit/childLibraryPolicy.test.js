// BOOKS AND STORY QUESTS — the claims the two phase-D screens make about a
// child (2026-07-29 kids-side redesign, spec sections 4 and 5).
//
// Every value on those screens is a claim: which book they stopped in, which
// page they stopped on, how many stars a book won them, which stories are still
// ahead. This suite holds the policy to them, and holds both screens to the
// two-numeric-system cap the spec sets.

import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import { storyQuests } from "../../src/data/storyQuests.js";
import { selectActiveStudentTab } from "../../src/policy/studentRailPolicy.js";
import {
  advanceBookShelfPage,
  BOOK_SHELF_SLOTS,
  QUEST_GRID_SLOTS,
  STORY_WORLDS,
  bookCollectionId,
  bookCollectionsForLevel,
  bookCoverSrc,
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

const booksPageSource = readFileSync("src/components/StudentBooksPage.jsx", "utf8");
const questsPageSource = readFileSync("src/components/StudentStoryQuestsPage.jsx", "utf8");
const libraryStyles = readFileSync("src/styles/kids-library.css", "utf8");
const appSource = readFileSync("src/components/AppSurface.jsx", "utf8");

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

test("Level C separates compact standard books from extended read-together books", () => {
  const bands = splitLevelCBooks([
    book("c-standard", "C", 6, { readingBandProfile: "standard" }),
    book("c-extended", "C", 6, { readingBandProfile: "extended" }),
    book("b-standard", "B", 6, { readingBandProfile: "standard" })
  ]);
  assert.deepEqual(bands.standard.map(item => item.id), ["c-standard"]);
  assert.deepEqual(bands.extended.map(item => item.id), ["c-extended"]);
  assert.match(booksPageSource, /C Standard/);
  assert.match(booksPageSource, /C Extended \/ Read Together/);
});

test("a C band shelf keeps completed books visible inside that editorial band", () => {
  const books = [
    book("c-unread", "C", 6, { readingBandProfile: "standard" }),
    book("c-finished", "C", 6, { readingBandProfile: "standard" })
  ];
  const [shelf] = buildBookShelves({
    books,
    records: { "c-finished": { completed: true } },
    level: "C",
    keepCompletedInFirstShelf: true
  });
  assert.deepEqual(shelf.books.map(row => row.book.id).sort(), ["c-finished", "c-unread"]);
  assert.equal(shelf.books.find(row => row.book.id === "c-finished").progress.completed, true);
});

test("a book's page position is the furthest page opened, out of its real length", () => {
  const target = book("rain-cycle", "A", 12);
  const progress = bookReadingProgress(target, { completedPages: 5, lastReadAt: "2026-07-20" });
  assert.equal(progress.page, 5);
  assert.equal(progress.totalPages, 12);
  assert.equal(progress.percent, 42);
  assert.equal(progress.completed, false);
  assert.equal(progress.started, true);

  const finished = bookReadingProgress(target, { completed: true, completedPages: 12 });
  assert.equal(finished.completed, true);
  assert.equal(finished.percent, 100);

  const untouched = bookReadingProgress(target, {});
  assert.equal(untouched.started, false);
  assert.equal(untouched.percent, 0);
});

test("the Continue panel is about the book most recently left unfinished", () => {
  const books = [book("one", "A"), book("two", "A"), book("three", "A")];
  const records = {
    one: { completedPages: 2, lastReadAt: "2026-07-01T00:00:00.000Z" },
    two: { completedPages: 4, lastReadAt: "2026-07-20T00:00:00.000Z" },
    three: { completed: true, lastReadAt: "2026-07-28T00:00:00.000Z" }
  };
  assert.equal(pickContinueBook({ books, records }).book.id, "two");

  // Nothing started, or everything finished: there is no book to CARRY ON, and
  // the screen must not dress a first book as one the child stopped in.
  assert.equal(pickContinueBook({ books, records: {} }), null);
  assert.equal(
    pickContinueBook({ books, records: { one: { completed: true }, two: { completed: true }, three: { completed: true } } }),
    null
  );
});

test("a shelf holds exactly its cells, and the More books tile takes one of them", () => {
  const many = Array.from({ length: 30 }, (unused, index) => book(`a-${index}`, "A"));
  const [justRight] = buildBookShelves({ books: many, records: {}, level: "A" });

  assert.equal(justRight.hasMore, true);
  assert.equal(justRight.step, BOOK_SHELF_SLOTS - 1);
  assert.equal(
    justRight.books.length + 1,
    BOOK_SHELF_SLOTS,
    "books plus the pager tile must fill the grid exactly — a ninth child grows a third row and pushes the screen past the canvas"
  );

  // The window wraps, so one tile walks the whole shelf without a page number.
  const second = buildBookShelves({ books: many, records: {}, level: "A", justRightPage: justRight.step })[0];
  assert.notEqual(second.books[0].book.id, justRight.books[0].book.id);
  assert.deepEqual(
    windowBooks([1, 2, 3, 4], 3, 3),
    [4, 1, 2],
    "the window wraps rather than running off the end of the shelf"
  );

  const few = [book("x", "A"), book("y", "A")];
  const [smallShelf] = buildBookShelves({ books: few, records: {}, level: "A" });
  assert.equal(smallShelf.hasMore, false);
  assert.equal(smallShelf.books.length, 2);
});

test("the second shelf is what you finished, and never an empty row", () => {
  const books = [book("p", "A"), book("q", "A"), book("r", "A")];

  const withFinished = buildBookShelves({
    books,
    records: { q: { completed: true, lastReadAt: "2026-07-20T00:00:00.000Z" } },
    level: "A"
  })[1];
  assert.equal(withFinished.title, "Read it again");
  assert.deepEqual(withFinished.books.map(row => row.book.id), ["q"]);

  // Nothing finished yet: the row carries more of the child's own level rather
  // than sitting empty, and never repeats what shelf one is already showing.
  const nothingFinished = buildBookShelves({ books, records: {}, level: "A" })[1];
  assert.notEqual(nothingFinished.title, "Read it again");
  assert.equal(nothingFinished.books.length, 0, "three books all fit shelf one, so there is nothing spare");

  const plenty = Array.from({ length: 12 }, (unused, index) => book(`b-${index}`, "A"));
  const shelves = buildBookShelves({ books: plenty, records: {}, level: "A" });
  const shownFirst = new Set(shelves[0].books.map(row => row.book.id));
  assert.ok(shelves[1].books.length > 0);
  assert.ok(shelves[1].books.every(row => !shownFirst.has(row.book.id)));
});

test("the second shelf pager advances for both more-books and read-again shelves", () => {
  const many = Array.from({ length: 20 }, (unused, index) => book(`book-${index}`, "A"));
  for (const records of [
    {},
    Object.fromEntries(many.map(item => [item.id, { completed: true }]))
  ]) {
    const initial = buildBookShelves({ books: many, records, level: "A" })[1];
    const pages = advanceBookShelfPage({}, initial.id, initial.step);
    const advanced = buildBookShelves({
      books: many,
      records,
      level: "A",
      readAgainPage: pages.second
    })[1];

    assert.ok(["more-books", "read-again"].includes(initial.id));
    assert.equal(pages.second, 7);
    assert.notEqual(advanced.books[0].book.id, initial.books[0].book.id);
  }
});

test("shelf one is the child's own level, ordered by the app's recommender", () => {
  const books = [book("a1", "A"), book("b1", "B"), book("a2", "A"), book("a3", "A")];
  const [shelf] = buildBookShelves({
    books,
    records: {},
    level: "A",
    order: ["a3", "a1", "a2"]
  });
  assert.deepEqual(shelf.books.map(row => row.book.id), ["a3", "a1", "a2"]);
  assert.equal(shelf.note, "Level A");
});

test("book collections organise each level without changing its reading difficulty", () => {
  const books = [
    book("bob-and-nan-01", "A"),
    book("meadow-pals-01-muddy-has-a-bath", "A"),
    book("first-facts-level-a-01-colors", "A"),
    book("dino-pals-01-chompys-big-lunch", "B"),
    book("first-facts-a-01-look-at-the-colours", "B"),
    book("moonwood-tales-c-01", "C")
  ];

  assert.equal(bookCollectionId(books[0]), "bob-and-nan");
  assert.equal(bookCollectionId(books[1]), "meadow-pals");
  assert.equal(bookCollectionId(books[2]), "science-and-facts");
  assert.equal(bookCollectionId(books[3]), "dino-pals");
  assert.equal(bookCollectionId(books[5]), "moonwood-tales");
  assert.deepEqual(
    bookCollectionsForLevel(books, "A").map(collection => collection.label),
    ["Bob & Nan", "Meadow Pals", "Science & Facts"]
  );
  assert.deepEqual(
    bookCollectionsForLevel(books, "B").map(collection => collection.label),
    ["Dino Pals", "Science & Facts"]
  );
});

test("a cover is read off the same book object as the title", () => {
  const target = book("rain", "A");
  assert.equal(bookCoverSrc(target), "/covers/rain.webp");
  // A retired cover falls back to page one of THAT book, never to another's.
  assert.equal(
    bookCoverSrc(target, ({ path }) => path === "/covers/rain.webp"),
    "/pages/rain-1.webp"
  );
  assert.equal(bookCoverSrc({ id: "bare" }), "");
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
  assert.equal(questPageNumber("p03_pip_edge"), 3);
  assert.equal(questPageNumber("page-07"), 7);
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
  assert.equal(carryOn.badge, "Carry on");
  assert.equal(carryOn.note, "You are on page 3");

  const done = buildQuestCard({ quest, row: { opened: true, completed: true } });
  assert.equal(done.badge, "Done");
  assert.equal(done.note, "You finished this");

  const fresh = buildQuestCard({ quest, row: {} });
  assert.equal(fresh.badge, "New");
  assert.equal(fresh.note, "1 ending");

  const ahead = buildQuestCard({
    quest: { ...quest, level: "C", series: "Moonwood Tales" },
    row: {},
    reachedIndex: 0
  });
  assert.equal(ahead.badge, "Next world");
  assert.equal(ahead.note, "Moonwood Tales");

  // A story already started is never demoted to "Next world" by where it lives.
  const startedAhead = buildQuestCard({
    quest: { ...quest, level: "C" },
    row: { opened: true },
    reachedIndex: 0
  });
  assert.equal(startedAhead.badge, "Carry on");
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
  assert.equal(cards[0].badge, "Carry on");
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
  assert.match(booksPageSource, /aria-label="Book levels"/);
  assert.match(questsPageSource, /aria-label="Story worlds"/);
  // The reader and the player are handed in, never reimplemented.
  assert.match(booksPageSource, /renderReader\(\{ bookId: openBookId/);
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

test("the two screens fit the canvas: fixed rows, fractional columns", () => {
  // The canvas is 834 design px tall and 1024-1560 wide, so the rows are a
  // budget and every column is a fraction. A fixed pixel column here is how a
  // screen stops surviving the narrow end of the range.
  assert.match(libraryStyles, /\.kg-books \{[\s\S]*?grid-template-rows: auto auto minmax\(0, 1fr\);/);
  assert.match(libraryStyles, /\.kg-quests \{[\s\S]*?grid-template-rows: auto minmax\(0, 1fr\);/);
  assert.match(libraryStyles, /\.kg-shelf-grid \{[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
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
