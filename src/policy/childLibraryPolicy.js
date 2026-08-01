// THE LIBRARY POLICY — Books and Story Quests (phase D of the 2026-07-29
// kids-side redesign).
//
// Binding spec: mockups/design-handoff-kids-side/README.md, "### 4. Books" and
// "### 5. Story Quests". The two screens are one idea twice — a thing the child
// already started, then shelves of things they could start — so the machinery
// that turns real saved progress into a Continue panel, a shelf and a badge
// lives HERE, once, instead of being written twice and drifting.
//
// WHY A POLICY MODULE AND NOT PART OF THE SCREENS. Every value on these two
// screens is a claim about a child: which book they stopped in, which page they
// stopped on, how many stars a book earned them, which stories are still ahead
// of them. A claim about a child has to be checkable, and a JSX file is not
// checkable from `node --test`. Nothing here imports a component, a stylesheet
// or `import.meta.env`, so tests/unit/childLibraryPolicy.test.js can run it.
//
// EVERY NUMBER IS REAL, AND THE SOURCE IS NAMED. The mock's "The Rain Cycle,
// page 5 of 12, 1 star" and its "4 endings" are placeholders — the spec says
// so. Here:
//
//   * page/of      -> the guided-reading record's completedPages / the book's
//                     own page count.
//   * book stars   -> the book quiz score, through the SAME 3/2/1/0 rule
//                     BookQuiz.jsx already draws on its results card. There is
//                     no other per-book star store in this app; inventing one
//                     would put a number on screen that nothing can back.
//   * the level    -> recommendBooksForStudent()'s resolveReadingLevel, which
//                     is the app's existing answer to "what level is this
//                     child on" (teacher-set, else the last book they read,
//                     else A).
//   * quest state  -> the story-quest progress store (opened / completed /
//                     lastPageId).
//   * endings      -> the quest's own pages: an ending is a page that offers a
//                     way out of the story.
//
// WHERE NO REAL SOURCE EXISTS, THE BUILDER RETURNS NULL and the screen says
// something true instead of drawing a placeholder.
//
// TWO NUMERIC SYSTEMS, AND ONLY TWO: stars and coins. "Page 5 of 12" is not a
// third one — it is a position inside the thing the child is reading, the way a
// bookmark is. A count of stories completed, a count of words seen, or a
// books-read goal IS a third one, which is why the old Story Quests header
// ("3 complete · 2 in progress · 30 of 119 story words seen") does not survive
// into this screen.

// How many cards a shelf and the quest grid hold. The spec draws four cards per
// shelf and six quest cards; the shelf number is doubled here because the
// spec's own geometry leaves a 4-card shelf two-thirds empty on this canvas —
// see kids-library.css for the measurement.
export const BOOK_SHELF_SLOTS = 8;
export const QUEST_GRID_SLOTS = 6;

export const READING_LEVELS = Object.freeze(["A", "B", "C", "D", "E", "F"]);

// ── Books ───────────────────────────────────────────────────────────────────

// A level answers "how hard is this book?". A collection answers "what kind of
// book or which friends do I want?". Keep those two decisions separate: a
// child can browse Meadow Pals at Level A without losing the Level A filter.
export const BOOK_COLLECTIONS = Object.freeze([
  Object.freeze({ id: "bob-and-nan", label: "Bob & Nan" }),
  Object.freeze({ id: "meadow-pals", label: "Meadow Pals" }),
  Object.freeze({ id: "james-and-anna", label: "James & Anna" }),
  Object.freeze({ id: "dino-pals", label: "Dino Pals" }),
  Object.freeze({ id: "aiden-and-betty", label: "Aiden & Betty" }),
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

export function bookCollectionsForLevel(books = [], level = "A") {
  const present = new Set(
    books
      .filter(book => book?.level === level)
      .map(bookCollectionId)
  );
  return BOOK_COLLECTIONS.filter(collection => present.has(collection.id));
}

/**
 * The book's own cover.
 *
 * THE PAIRING IS STRUCTURAL, not a lookup: the art is read off the same book
 * object the title is, so a title can never end up beside another book's cover.
 * Page one is the fallback for a cover the media manifest has retired, which is
 * the rule the reader's own shelf already used.
 *
 * `isDeleted` is injected so this stays a pure function: the real predicate
 * reads localStorage for the teacher's retirements.
 */
export function bookCoverSrc(book = {}, isDeleted = () => false) {
  const cover = book?.coverImage || book?.cover || book?.coverUrl || "";
  if (cover && !isDeleted({ bookId: book?.id, path: cover, pageNumber: 0 })) return cover;
  const page = (book?.pages || []).find(item => item?.image || item?.imageUrl || item?.pageImage);
  return page?.image || page?.imageUrl || page?.pageImage || "";
}

/**
 * The stars a book has won, 0-3.
 *
 * This is BookQuiz.jsx's own rule, applied to the saved record instead of to
 * live state: all questions right is three, two right is two, anything right is
 * one. A book with no quiz taken has no stars — not "0 out of 3 available",
 * simply none earned yet.
 */
export function bookStars(record = {}) {
  const total = Number(record?.quizTotal) || 0;
  const score = Number(record?.quizScore) || 0;
  if (total <= 0 || score <= 0) return 0;
  if (score >= total) return 3;
  if (score >= 2) return 2;
  return 1;
}

/**
 * Where the child is in one book.
 *
 * `page` is the furthest page they have opened, which is what "you stopped
 * here" means to a five-year-old — not the page index some other screen last
 * rendered.
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
  );
  return {
    started,
    completed,
    page: Math.max(1, Math.min(completedPages || 1, totalPages || 1)),
    totalPages,
    percent: totalPages > 0
      ? Math.max(0, Math.min(100, Math.round((completedPages / totalPages) * 100)))
      : 0,
    stars: bookStars(record),
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
 * A window of `slots` books, wrapping. The Books screen shows eight at a time
 * out of 176; the wrap is what lets one "More books" tile walk the whole shelf
 * without a scrollbar and without a page number (a page counter would be a
 * third numeric system).
 */
export function windowBooks(books = [], page = 0, slots = BOOK_SHELF_SLOTS) {
  if (!books.length || slots <= 0) return [];
  if (books.length <= slots) return books.slice(0, slots);
  const start = ((Math.trunc(page) % books.length) + books.length) % books.length;
  return Array.from({ length: slots }, (unused, index) => books[(start + index) % books.length]);
}

/**
 * Both shelves, already windowed and starred.
 *
 * Shelf one is the child's own level, ordered by the app's existing
 * recommender when one is supplied. Shelf two is what they have finished, most
 * recent first — and when they have finished nothing it becomes MORE OF THEIR
 * LEVEL rather than an empty row, because a shelf with nothing on it is a hole
 * in the screen, not a design.
 */
export function buildBookShelves({
  books = [],
  records = {},
  level = "A",
  order = [],
  justRightPage = 0,
  readAgainPage = 0,
  slots = BOOK_SHELF_SLOTS
} = {}) {
  const rank = new Map(order.map((id, index) => [id, index]));
  const byOrder = (a, b) => (
    (rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER)
    - (rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER)
    || String(a.title || "").localeCompare(String(b.title || ""))
  );

  const atLevel = books.filter(book => book.level === level);
  const unread = atLevel
    .filter(book => !bookReadingProgress(book, records[book.id] || {}).completed)
    .sort(byOrder);
  const justRightPool = unread.length ? unread : atLevel.slice().sort(byOrder);

  const finished = books
    .filter(book => bookReadingProgress(book, records[book.id] || {}).completed)
    .sort((a, b) => readTime(records[b.id] || {}) - readTime(records[a.id] || {}));

  const decorate = book => ({
    book,
    stars: bookStars(records[book.id] || {}),
    progress: bookReadingProgress(book, records[book.id] || {})
  });

  // A shelf holds exactly `slots` cells. When there is more behind it the last
  // cell is the "More books" tile, so the shelf shows one fewer book and steps
  // by that many — nine children in an eight-cell grid would silently grow a
  // third row and push the screen past the canvas.
  const shelf = (id, title, note, tint, pool, page) => {
    const hasMore = pool.length > slots;
    const step = hasMore ? slots - 1 : slots;
    return {
      id,
      title,
      note,
      tint,
      page,
      step,
      total: pool.length,
      hasMore,
      books: windowBooks(pool, page, step).map(decorate)
    };
  };

  const first = shelf(
    "just-right",
    "Just right for you",
    `Level ${level}`,
    "rgba(111, 179, 95, .85)",
    justRightPool,
    justRightPage
  );

  // The spare shelf: level books the first shelf is not already showing.
  const shownIds = new Set(first.books.map(row => row.book.id));
  const spare = justRightPool.filter(book => !shownIds.has(book.id));
  const secondPool = finished.length ? finished : spare;

  return [
    first,
    shelf(
      finished.length ? "read-again" : "more-books",
      finished.length ? "Read it again" : "More to try",
      finished.length ? "Books you finished" : `Level ${level}`,
      finished.length ? "rgba(142, 201, 232, .9)" : "rgba(191, 227, 216, .85)",
      secondPool,
      readAgainPage
    )
  ];
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

/**
 * The page number inside a saved `lastPageId` — "p03_pip_edge" and "page-03"
 * are both page three. Branching stories have no linear index, but every page
 * id in this data carries the page it belongs to, so this is read, never
 * counted. Returns null when the id does not carry one.
 */
export function questPageNumber(lastPageId = "") {
  const match = /^p(?:age[-_])?(\d+)/i.exec(String(lastPageId || "").trim());
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * One quest card: its badge state and the one short line under its title.
 *
 * The four states are the spec's own: an in-progress story says Carry on, a
 * finished one says Done, a story in a world the child has not reached yet
 * says Next world, and everything else is New.
 */
export function buildQuestCard({ quest = {}, row = {}, reachedIndex = 0 } = {}) {
  const world = questWorldId(quest);
  const index = worldIndex(world);
  const opened = Boolean(row?.opened);
  const completed = Boolean(row?.completed);
  const endings = questEndings(quest);
  const page = questPageNumber(row?.lastPageId);

  const state = completed
    ? "done"
    : opened
      ? "carry-on"
      : index > reachedIndex
        ? "next-world"
        : "new";

  const badge = {
    "carry-on": "Carry on",
    done: "Done",
    "next-world": "Next world",
    new: "New"
  }[state];

  const endingsNote = endings > 1 ? `${endings} endings` : endings === 1 ? "1 ending" : "";
  const note = state === "carry-on"
    ? (page ? `You are on page ${page}` : "Carry on reading")
    : state === "done"
      ? "You finished this"
      : state === "next-world"
        ? (quest.series || endingsNote || STORY_WORLDS[index].label)
        : (endingsNote || STORY_WORLDS[index].label);

  return {
    id: quest.id,
    title: quest.title || "",
    art: quest.coverImageUrl || quest.pages?.[0]?.imageUrl || "",
    world,
    state,
    badge,
    note,
    endings,
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
  reachedWorld = STORY_WORLDS[0].id,
  slots = QUEST_GRID_SLOTS
} = {}) {
  const reachedIndex = worldIndex(reachedWorld);
  const cards = quests.map(quest => buildQuestCard({
    quest,
    row: progress[quest.id] || {},
    reachedIndex
  }));

  const stateRank = { "carry-on": 0, new: 1, "next-world": 2, done: 3 };
  return cards
    .filter(card => card.world === world)
    .slice()
    .sort((a, b) => (
      stateRank[a.state] - stateRank[b.state]
      || String(a.title).localeCompare(String(b.title))
    ))
    .slice(0, slots);
}
