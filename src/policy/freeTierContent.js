/**
 * Which content the sample plans can reach.
 *
 * THE ONE RULE THAT MATTERS: A CROSS-SECTION, NOT A PREFIX.
 *
 * The obvious way to give away a fifth of the content is to give away the first
 * fifth — Level A books, the first phonics cycles, the first quest. It is the
 * worst possible choice. A parent opens it, sees Level A books and letter
 * sounds, and concludes the product is for babies. A teacher evaluating it for
 * Year 1 sees nothing that would work in their classroom. The sample has to be
 * a smaller version of the real product, not the shallow end of it.
 *
 * So selection walks each level at a stride and takes an even spread — Level A,
 * B and C books all appear, early and late phonics both appear, and the sample
 * grows correctly on its own as content is added.
 *
 * WHERE YOUR JUDGEMENT GOES. A stride cannot know which book is delightful or
 * which game sells the product in ninety seconds. `ALWAYS_INCLUDE` is for that,
 * and it is the only part of this file anyone should need to edit: add an id and
 * it is in the sample regardless of where the stride lands. I have deliberately
 * left it near-empty rather than inventing curriculum judgements I am not in a
 * position to make.
 *
 * NEVER_INCLUDE is the opposite, for anything that must not be in a sample —
 * assessment content, or a book being held back.
 */

/** The share of each content type a sample plan reaches. */
export const SAMPLE_SHARE = 0.2;

/**
 * Always in the sample, whatever the stride says. THIS IS THE CURATION LIST —
 * put the things here that make somebody want the rest.
 *
 * Keep it well under the share or it stops being a sample. Ids only; an unknown
 * id is ignored rather than throwing, so a removed book cannot break the app.
 */
export const ALWAYS_INCLUDE = Object.freeze({
  books: Object.freeze([]),
  games: Object.freeze([]),
  cycles: Object.freeze([]),
  storyQuests: Object.freeze([])
});

/** Never in a sample, whatever the stride says. */
export const NEVER_INCLUDE = Object.freeze({
  books: Object.freeze([]),
  games: Object.freeze([]),
  cycles: Object.freeze([]),
  storyQuests: Object.freeze([])
});

/**
 * Takes an even spread across a list rather than the front of it.
 *
 * Deterministic: same input, same output, every time and on every device. A
 * sample that varied per visitor would make "why can my friend read that one"
 * a support question, and would make the slice impossible to talk about.
 */
export function strideSample(items = [], share = SAMPLE_SHARE) {
  const list = [...items];
  if (!list.length) return [];
  const target = Math.max(1, Math.round(list.length * share));
  if (target >= list.length) return list;

  const stride = list.length / target;
  const picked = [];
  for (let index = 0; index < target; index += 1) {
    picked.push(list[Math.min(list.length - 1, Math.floor(index * stride))]);
  }
  return [...new Set(picked)];
}

/**
 * Groups by level first, then strides within each group, so every level is
 * represented in proportion. Striding the flat list would work too, but only by
 * luck — one level ordering change and the sample could go all-Level-A.
 */
export function stratifiedSample(items = [], { groupBy, idOf, share = SAMPLE_SHARE } = {}) {
  const groups = new Map();
  for (const item of items) {
    const key = String(groupBy ? groupBy(item) : "all");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const chosen = [];
  // Sorted so the result does not depend on the order groups happened to appear.
  for (const key of [...groups.keys()].sort()) {
    const sorted = [...groups.get(key)].sort((a, b) => String(idOf(a)).localeCompare(String(idOf(b))));
    chosen.push(...strideSample(sorted, share));
  }
  return chosen;
}

function applyOverrides(chosenIds, allIds, kind) {
  const set = new Set(chosenIds);
  const known = new Set(allIds);
  for (const id of ALWAYS_INCLUDE[kind] || []) {
    if (known.has(id)) set.add(id);
  }
  for (const id of NEVER_INCLUDE[kind] || []) set.delete(id);
  return set;
}

/**
 * The sample book ids. Stratified by level so Level A, B and C all appear —
 * a parent must be able to see where their child is going, not only where they
 * would start.
 */
export function sampleBookIds(books = []) {
  const chosen = stratifiedSample(books, {
    groupBy: book => book?.level ?? "",
    idOf: book => book?.id
  }).map(book => book.id);
  return applyOverrides(chosen, books.map(book => book?.id), "books");
}

/**
 * The sample game ids. Arcade games are excluded from the stride and handled
 * separately: they are the visually impressive ones, so leaving their inclusion
 * to chance would sometimes produce a sample containing none of them.
 */
export function sampleGameIds(games = []) {
  const usable = games.filter(game => !game?.hidden);
  const arcade = usable.filter(game => (game.surfaces || []).includes("arcade"));
  const practice = usable.filter(game => !(game.surfaces || []).includes("arcade"));

  const chosen = [
    ...strideSample([...practice].sort((a, b) => String(a.id).localeCompare(String(b.id)))).map(g => g.id),
    // At least one arcade game, always. It is the thing somebody shows a friend.
    ...strideSample([...arcade].sort((a, b) => String(a.id).localeCompare(String(b.id)))).map(g => g.id)
  ];
  return applyOverrides(chosen, usable.map(game => game?.id), "games");
}

export function sampleCycleIds(cycles = []) {
  const playable = cycles.filter(cycle => cycle?.cycleNumber);
  const chosen = strideSample(
    [...playable].sort((a, b) => Number(a.cycleNumber) - Number(b.cycleNumber))
  ).map(cycle => cycle.id);
  return applyOverrides(chosen, playable.map(cycle => cycle?.id), "cycles");
}

export function sampleStoryQuestIds(quests = []) {
  const chosen = strideSample(
    [...quests].sort((a, b) => String(a.id).localeCompare(String(b.id)))
  ).map(quest => quest.id);
  return applyOverrides(chosen, quests.map(quest => quest?.id), "storyQuests");
}

/**
 * The filter every child-facing surface uses.
 *
 * A full-content entitlement returns the list untouched — this must be a no-op
 * for every account that exists today, not a code path they newly travel.
 */
export function filterToEntitlement(items = [], allowedIds, { hasFullContent = true } = {}) {
  if (hasFullContent) return items;
  if (!allowedIds) return [];
  const allowed = allowedIds instanceof Set ? allowedIds : new Set(allowedIds);
  return items.filter(item => allowed.has(item?.id));
}

/**
 * What a child is told when they reach the edge of the sample.
 *
 * Never a lock icon with nothing behind it. A child who cannot read this needs
 * the grown-up beside them to understand instantly why the shelf stops, and the
 * honest answer is better than a padlock: there is more, and it is not free
 * yet. The copy lives here rather than in a component so every surface says the
 * same thing.
 */
export const SAMPLE_LIMIT_COPY = Object.freeze({
  childHeading: "That's the end of the try-out books",
  childBody: "You read everything in the free set. Well done!",
  adultBody:
    "This is a free sample — about a fifth of the books, games and quests. "
    + "A school account opens all of it, keeps every child's progress, and gives teachers the reports.",
  callToAction: "See the full version"
});

/* ------------------------------------------------------------------ *
 * Session scope
 * ------------------------------------------------------------------ */

/**
 * Whether this session sees the sample rather than everything.
 *
 * A MODULE VALUE, NOT A PROP, and that is deliberate. The slice is a property of
 * the SESSION, exactly like the swapped storage and the closed network — it is
 * not a property of any component tree. It is set once, at the same moment as
 * the other two boundaries, and every surface reads it in one line instead of
 * five layers of prop threading. Threading it would also mean a surface that
 * forgot the prop silently showed everything, which is the failure mode this
 * whole design exists to remove.
 *
 * Default is OFF, so nothing changes for any account that exists today.
 */
let sampleScopeActive = false;

export function setSampleContentScope(active) {
  sampleScopeActive = Boolean(active);
}

export function isSampleContentScope() {
  return sampleScopeActive;
}

const RESOLVERS = Object.freeze({
  books: sampleBookIds,
  games: sampleGameIds,
  cycles: sampleCycleIds,
  storyQuests: sampleStoryQuestIds
});

/**
 * The one line every child-facing surface uses.
 *
 * Returns the SAME ARRAY untouched when the session sees everything, so no
 * existing child travels a new code path because a sample plan exists for
 * somebody else. An unknown kind returns the list unchanged rather than
 * throwing — a typo must not empty a shelf.
 */
export function filterSample(kind, items = []) {
  if (!sampleScopeActive) return items;
  const resolve = RESOLVERS[kind];
  if (!resolve) return items;
  const allowed = resolve(items);
  return items.filter(item => allowed.has(item?.id));
}
