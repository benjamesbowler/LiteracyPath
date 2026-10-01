// Child library presentation follows the Reporting Bible and child surface rules.
// The recommender owns teacher suitability; this module owns truthful saved
// continuation, permitted cover sources and one paged shelf. Levels remain
// internal to suitability. Separately reviewed app text levels may label books,
// never the child or an achievement category.
import { guidedReadingBookmark } from "../utils/guidedReading/bookmark.js";

export const BOOK_SHELF_SLOTS = 6;
export const QUEST_GRID_SLOTS = 6;

export const READING_LEVELS = Object.freeze(["A", "B", "C", "D", "E", "F"]);

// ── Books ───────────────────────────────────────────────────────────────────

// Collections name topics and familiar characters. Instructional placement stays
// internal; the library separately offers reviewed app text-level browsing.
export const BOOK_COLLECTIONS = Object.freeze([
  Object.freeze({ id: "bob-and-nan", label: "Bob & Nan" }),
  Object.freeze({ id: "meadow-pals", label: "Meadow Pals" }),
  Object.freeze({ id: "james-and-anna", label: "James & Anna" }),
  Object.freeze({ id: "dino-pals", label: "Dino Pals" }),
  Object.freeze({ id: "aiden-and-betty", label: "Aiden & Betty" }),
  Object.freeze({ id: "willow-street-readers", label: "Willow Street Readers" }),
  Object.freeze({ id: "moonwood-tales", label: "Moonwood Tales" }),
  Object.freeze({ id: "science-and-facts", label: "Science & Facts" }),
  Object.freeze({ id: "other-stories", label: "Other Stories" })
]);

export function bookCollectionId(book = {}) {
  const id = String(book?.id || "").toLowerCase();
  const title = String(book?.title || "").toLowerCase();
  if (id.startsWith("bob-and-nan-") || /\b(?:bob and nan|nan and bob)\b/.test(title)) {
    return "bob-and-nan";
  }
  if (id.startsWith("meadow-pals-")) return "meadow-pals";
  if (
    id.startsWith("james-and-anna-")
    || id.startsWith("ja-b-")
    || /\bjames and anna\b/.test(title)
  ) {
    return "james-and-anna";
  }
  if (id.startsWith("dino-pals-")) return "dino-pals";
  if (id.startsWith("ab-c-") || /\baiden and betty\b/.test(title)) return "aiden-and-betty";
  if (id.startsWith("willow-street-")) return "willow-street-readers";
  if (id.startsWith("moonwood-tales-")) return "moonwood-tales";
  if (
    id.startsWith("first-facts-")
    || id.startsWith("level-c-nonfiction-")
    || /^gr-[a-z]-\d+/.test(id)
  ) {
    return "science-and-facts";
  }
  return "other-stories";
}

export function bookCollectionsForLevel(books = [], level = null) {
  const present = new Set(
    books
      .filter(book => !level || book?.level === level)
      .map(bookCollectionId)
  );
  return BOOK_COLLECTIONS.filter(collection => present.has(collection.id));
}

/**
 * The book's own cover.
 *
 * THE PAIRING IS STRUCTURAL, not a lookup: the art is read off the same book
 * object the title is, so a title can never end up beside another book's cover.
 * Only the same book's available, approved pages can replace a retired or
 * failed cover.
 *
 * `isDeleted` is injected so this stays a pure function: the real predicate
 * reads localStorage for the teacher's retirements.
 */
export function bookCoverSources(book = {}, isDeleted = () => false) {
  const cover = book?.coverImage || book?.cover || book?.coverUrl || "";
  const candidates = [{ path: cover, pageNumber: 0 }, ...(book?.pages || [])
    .filter(page => page?.active !== false && (!page?.qaStatus || page.qaStatus === "approved"))
    .map(page => ({ path: page.image || page.imageUrl || page.pageImage || "", pageNumber: page.pageNumber }))];
  return [...new Set(candidates.filter(({ path, pageNumber }) => path
    && !isDeleted({ bookId: book?.id, path, pageNumber })).map(({ path }) => path))];
}

export function bookCoverSrc(book = {}, isDeleted = () => false) {
  return bookCoverSources(book, isDeleted)[0] || "";
}

/**
 * Where the child is in one book.
 *
 * The saved last page is the bookmark. For older records, the latest actual
 * page visit supplies it; the furthest page is only a legacy fallback.
 */
export function bookReadingProgress(book = {}, record = {}) {
  const totalPages = (book?.pages || []).length || Number(record?.totalPages) || 0;
  const completedPages = Math.min(
    totalPages || Number.MAX_SAFE_INTEGER,
    Math.max(
      Number(record?.completedPages) || 0,
      Object.keys(record?.pages || {}).length
    )
  );
  const completed = Boolean(
    record?.completed
    || record?.completedAt
    || (totalPages > 0 && completedPages >= totalPages)
  );
  const started = Boolean(
    completed
    || completedPages > 0
    || record?.firstReadAt
    || record?.lastReadAt
    || Number.isInteger(record?.lastPageIndex)
    || Object.values(record?.pageStats || {}).some(visit => visit?.lastOpenedAt)
  );
  const pageIndex = guidedReadingBookmark(book, record);
  return {
    started,
    completed,
    pageIndex,
    page: pageIndex + 1,
    totalPages,
    percent: totalPages > 0
      ? Math.max(0, Math.min(100, Math.round((completedPages / totalPages) * 100)))
      : 0,
    lastReadAt: record?.lastReadAt || record?.updatedAt || record?.completedAt || ""
  };
}

function readTime(record = {}) {
  const parsed = Date.parse(
    record?.lastReadAt || record?.updatedAt || record?.completedAt || record?.firstReadAt || ""
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * The book the Continue panel is about: the one most recently read that is not
 * finished. A child who has finished everything they started, or who has never
 * opened a book, gets `null` — the screen then offers a first book to START,
 * which is a different sentence and must not be dressed as "you stopped here".
 */
export function pickContinueBook({ books = [], records = {} } = {}) {
  const open = books
    .map(book => ({ book, progress: bookReadingProgress(book, records[book.id] || {}) }))
    .filter(row => row.progress.started && !row.progress.completed)
    .sort((a, b) => readTime(records[b.book.id] || {}) - readTime(records[a.book.id] || {}));
  return open[0] || null;
}

/**
 * A window of `slots` books, wrapping. The wrap lets one "More books" control
 * walk the whole eligible shelf at the current device's picture-card count
 * without a scrollbar and without a page number (a page counter would be a
 * third numeric system).
 */
export function windowBooks(books = [], page = 0, slots = BOOK_SHELF_SLOTS) {
  if (!books.length || slots <= 0) return [];
  if (books.length <= slots) return books.slice(0, slots);
  const start = ((Math.trunc(page) % books.length) + books.length) % books.length;
  return Array.from({ length: slots }, (unused, index) => books[(start + index) % books.length]);
}

/** One picture shelf. Discovery changes the pool, never suitability metadata. */
export function buildBookShelves({
  books = [], records = {}, level = "A", order = [], justRightPage = 0,
  slots = BOOK_SHELF_SLOTS, mode = "for-you", excludeBookId = ""
} = {}) {
  const rank = new Map(order.map((id, index) => [id, index]));
  const byOrder = (a, b) => (rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER)
    - (rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER)
    || String(a.title || "").localeCompare(String(b.title || ""));
  let pool = books.filter(book => book.id !== excludeBookId);
  if (mode === "read-again") {
    pool = pool.filter(book => bookReadingProgress(book, records[book.id] || {}).completed)
      .sort((a, b) => readTime(records[b.id]) - readTime(records[a.id]));
  } else {
    if (mode === "for-you") pool = pool.filter(book => book.level === level
      && (level !== "C" || book.readingBandProfile !== "extended"));
    if (mode === "together") pool = pool.filter(book => book.readingBandProfile === "extended"
      || book.readingBandProfile === "read-aloud" || book.readingMode === "supported-read-together");
    pool.sort(byOrder);
  }
  const title = { "for-you": "Books for you", "read-again": "Read again", together: "Read together", all: "Find a book" }[mode] || "Find a book";
  return [{
    id: "books", title,
    note: mode === "together" ? "Listen and read with a grown-up" : mode === "read-again" ? "Books you finished" : "Read a book",
    page: justRightPage, step: slots, total: pool.length, hasMore: pool.length > slots,
    books: windowBooks(pool, justRightPage, slots).map(book => ({ book, progress: bookReadingProgress(book, records[book.id] || {}) }))
  }];
}

// ── Story Quests ────────────────────────────────────────────────────────────
//
// Three worlds, in the order a child walks them. The mapping is the quest's own
// declared level, which is the same grouping the Story Quests screen has always
// used (Level A / B / C) — named by its world here because "Meadow" is a place
// a five-year-old can point at and "Level B" is not.
export const STORY_WORLDS = Object.freeze([
  Object.freeze({ id: "meadow", label: "Meadow", levels: Object.freeze(["A", "EARLY"]) }),
  Object.freeze({ id: "dino", label: "Dino", levels: Object.freeze(["B"]) }),
  Object.freeze({ id: "moonwood", label: "Moonwood", levels: Object.freeze(["C"]) })
]);

export function questWorldId(quest = {}) {
  const level = String(quest?.level || "").trim().toUpperCase();
  const world = STORY_WORLDS.find(entry => entry.levels.includes(level));
  return (world || STORY_WORLDS[0]).id;
}

export function worldIndex(worldId = "") {
  const index = STORY_WORLDS.findIndex(world => world.id === worldId);
  return index < 0 ? 0 : index;
}

/**
 * The world the child has reached, from their own story history: the furthest
 * world they have opened or finished a story in. A child who has read no
 * stories has reached the first world, which is true rather than flattering.
 *
 * `readingLevel` widens it when the caller knows one — a child already reading
 * Level C books has plainly reached Moonwood even if they have never opened a
 * quest there.
 */
export function reachedStoryWorld({ quests = [], progress = {}, readingLevel = "" } = {}) {
  let index = 0;
  for (const quest of quests) {
    const row = progress[quest.id];
    if (!row || !(row.opened || row.completed)) continue;
    index = Math.max(index, worldIndex(questWorldId(quest)));
  }
  const level = String(readingLevel || "").trim().toUpperCase();
  if (level) {
    const byLevel = STORY_WORLDS.findIndex(world => world.levels.includes(level));
    // D/E/F are past the last story world, not before the first one.
    if (byLevel >= 0) index = Math.max(index, byLevel);
    else if (READING_LEVELS.indexOf(level) > READING_LEVELS.indexOf("C")) {
      index = STORY_WORLDS.length - 1;
    }
  }
  return STORY_WORLDS[Math.min(index, STORY_WORLDS.length - 1)].id;
}

/**
 * How many ways this story can end. An ending is a page that offers a way OUT
 * of the story rather than another turn of it, which in this data is a choice
 * pointing at "end". Counted from the quest itself, so it cannot drift from
 * what the player will actually do.
 */
export function questEndings(quest = {}) {
  return (quest?.pages || []).filter(
    page => (page?.choices || []).some(choice => String(choice?.nextPageId || "") === "end")
  ).length;
}

/** A route position comes from saved traversal, never digits in a scene ID. */
export function questPageNumber(lastPageId = "", visitedPageIds = []) {
  const route = [...new Set(visitedPageIds.filter(Boolean))];
  const index = route.indexOf(lastPageId);
  return index >= 0 ? index + 1 : null;
}

export function buildQuestCard({ quest = {}, row = {} } = {}) {
  const world = questWorldId(quest);
  const canContinue = Boolean(row.opened && row.lastPageId && row.routeFinished !== true
    && (!row.completed || row.routeFinished === false));
  const state = canContinue ? "carry-on" : row.completed ? "done" : "new";
  const page = questPageNumber(row.lastPageId, row.visitedPageIds || []);
  return {
    id: quest.id,
    title: quest.shortTitle || quest.title || "",
    fullTitle: quest.title || "",
    hook: quest.hook || "",
    level: quest.level,
    art: quest.coverImageUrl || quest.pages?.[0]?.imageUrl || "",
    world, state,
    badge: { "carry-on": "Continue", done: "Read again", new: "New" }[state],
    note: canContinue ? "Continue your story" : quest.hook || "You choose what happens",
    readingNote: String(quest.level).toUpperCase() === "EARLY" ? "Short a sounds" : "",
    endings: questEndings(quest),
    updatedAt: row.updatedAt || "",
    page
  };
}

/**
 * The chosen world's stories only. A full-looking grid is never worth telling
 * a child that a Meadow story belongs in Moonwood or a Moonwood story belongs
 * in Dino Land.
 *
 * Inside a world the order is the spec's: the story you are in, then the ones
 * you have not read, then the ones you have.
 */
export function buildQuestGrid({
  quests = [],
  progress = {},
  world = STORY_WORLDS[0].id,
  readingLevel = "",
  slots = QUEST_GRID_SLOTS
} = {}) {
  const cards = quests.map(quest => buildQuestCard({
    quest,
    row: progress[quest.id] || {}
  }));

  const stateRank = { "carry-on": 0, new: 1, done: 2 };
  const level = String(readingLevel || "A").toUpperCase();
  const order = new Map(quests.map((quest, index) => [quest.id, index]));
  return cards
    .filter(card => card.world === world)
    .slice()
    .sort((a, b) => (
      stateRank[a.state] - stateRank[b.state]
      || (a.state === "carry-on" ? String(b.updatedAt).localeCompare(String(a.updatedAt)) : 0)
      || (String(b.level).toUpperCase() === level) - (String(a.level).toUpperCase() === level)
      || order.get(a.id) - order.get(b.id)
    ))
    .slice(0, slots);
}
