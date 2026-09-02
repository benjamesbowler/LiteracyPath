import assert from "node:assert/strict";
import test from "node:test";

import { GUIDED_READING_BOOK_INDEX } from "../../src/data/generated/guidedReadingBookIndex.generated.js";
import { guidedReadingBooks } from "../../src/data/guidedReadingBooks.js";
import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { storyQuests } from "../../src/data/storyQuests.js";
import {
  SAMPLE_SHARE,
  filterToEntitlement,
  sampleBookIds,
  sampleCycleIds,
  sampleGameIds,
  sampleStoryQuestIds,
  strideSample
} from "../../src/policy/freeTierContent.js";

/* ------------------------------------------------------------------ *
 * The rule the whole thing exists for
 * ------------------------------------------------------------------ */

test("the book sample spans every level, not just the easiest", () => {
  // The failure this guards against: give away the first fifth, a parent sees
  // only Level A, and concludes the product is for babies. A sample that cannot
  // show a parent where their child is GOING is worse than no sample.
  const ids = sampleBookIds(GUIDED_READING_BOOK_INDEX);
  const levels = new Set(
    GUIDED_READING_BOOK_INDEX.filter(book => ids.has(book.id)).map(book => book.level)
  );
  const allLevels = new Set(GUIDED_READING_BOOK_INDEX.map(book => book.level));

  assert.deepEqual([...levels].sort(), [...allLevels].sort(),
    "every level present in the library must appear in the sample");
  assert.ok(levels.size >= 3, `expected at least three levels, got ${levels.size}`);
});

test("the Level C sample includes a useful Willow Street cross-section", () => {
  const ids = sampleBookIds(guidedReadingBooks);
  const willowIds = guidedReadingBooks
    .filter(book => book.id.startsWith("willow-street-"))
    .map(book => book.id);
  const sampledWillow = willowIds.filter(id => ids.has(id));
  assert.equal(willowIds.length, 20);
  assert.ok(sampledWillow.length >= 2, "the sample should show more than a token Willow Street book");
  assert.ok(sampledWillow.length < willowIds.length, "the free tier must remain a sample of Willow Street");
});

test("each level is sampled in proportion, so no level is a token single book", () => {
  const ids = sampleBookIds(GUIDED_READING_BOOK_INDEX);
  const byLevel = new Map();
  for (const book of GUIDED_READING_BOOK_INDEX) {
    if (!byLevel.has(book.level)) byLevel.set(book.level, { total: 0, sampled: 0 });
    const entry = byLevel.get(book.level);
    entry.total += 1;
    if (ids.has(book.id)) entry.sampled += 1;
  }
  for (const [level, { total, sampled }] of byLevel) {
    const share = sampled / total;
    assert.ok(
      share >= SAMPLE_SHARE * 0.6 && share <= SAMPLE_SHARE * 1.8,
      `level ${level}: ${sampled}/${total} = ${(share * 100).toFixed(0)}%, outside a fair band around ${SAMPLE_SHARE * 100}%`
    );
  }
});

test("the sample is roughly a fifth, not a third and not a token", () => {
  const ids = sampleBookIds(GUIDED_READING_BOOK_INDEX);
  const share = ids.size / GUIDED_READING_BOOK_INDEX.length;
  assert.ok(share > 0.12 && share < 0.30, `book sample is ${(share * 100).toFixed(0)}% of the library`);
  assert.ok(ids.size >= 20, `only ${ids.size} books — too thin to judge the product by`);
});

test("the game sample always contains at least one arcade game", () => {
  // The arcade games are the visually impressive ones — the thing a child shows
  // a friend. Leaving their inclusion to where a stride happens to land would
  // sometimes ship a sample containing none of them.
  const ids = sampleGameIds(GAME_LIST);
  const sampledArcade = GAME_LIST.filter(
    game => ids.has(game.id) && (game.surfaces || []).includes("arcade")
  );
  assert.ok(sampledArcade.length >= 1, "no arcade game in the sample");

  const sampledPractice = GAME_LIST.filter(
    game => ids.has(game.id) && !(game.surfaces || []).includes("arcade")
  );
  assert.ok(sampledPractice.length >= 1, "no practice game in the sample");
});

test("hidden games never reach a sample", () => {
  const ids = sampleGameIds(GAME_LIST);
  for (const game of GAME_LIST.filter(entry => entry.hidden)) {
    assert.ok(!ids.has(game.id), `hidden game ${game.id} leaked into the sample`);
  }
});

test("the phonics sample spans early and late cycles", () => {
  const ids = sampleCycleIds(elSkillsBlockCycles);
  const playable = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
  const numbers = playable.filter(cycle => ids.has(cycle.id)).map(cycle => Number(cycle.cycleNumber));

  assert.ok(numbers.length >= 3, `only ${numbers.length} cycles sampled`);
  const highest = Math.max(...playable.map(cycle => Number(cycle.cycleNumber)));
  assert.ok(
    Math.max(...numbers) > highest / 2,
    "the sample stops in the first half of the phonics sequence — that is a prefix, not a cross-section"
  );
  assert.ok(Math.min(...numbers) <= 3, "the sample should also include somewhere a beginner can start");
});

test("story quests are sampled too", () => {
  const ids = sampleStoryQuestIds(storyQuests);
  assert.ok(ids.size >= 1 && ids.size < storyQuests.length);
  const sampledLevels = new Set(
    storyQuests
      .filter(quest => ids.has(quest.id))
      .map(quest => String(quest.level || "").trim().toUpperCase())
  );
  assert.ok(sampledLevels.has("A"), "the try-out must include a Meadow story");
  assert.ok(sampledLevels.has("B"), "the try-out must include a Dino story");
  assert.ok(sampledLevels.has("C"), "the try-out must include a Moonwood story");
});

/* ------------------------------------------------------------------ *
 * Properties that keep it usable
 * ------------------------------------------------------------------ */

test("the sample is identical every time it is computed", () => {
  // A sample that varied per visitor makes "why can my friend read that one" a
  // support question, and makes the slice impossible to describe to anybody.
  const first = [...sampleBookIds(GUIDED_READING_BOOK_INDEX)].sort();
  const second = [...sampleBookIds(GUIDED_READING_BOOK_INDEX)].sort();
  const third = [...sampleBookIds([...GUIDED_READING_BOOK_INDEX].reverse())].sort();
  assert.deepEqual(first, second);
  assert.deepEqual(first, third, "input order must not change the sample");
});

test("strideSample spreads rather than taking the front", () => {
  const items = Array.from({ length: 100 }, (unused, index) => index);
  const picked = strideSample(items, 0.2);
  assert.equal(picked.length, 20);
  assert.equal(picked[0], 0);
  assert.ok(picked.at(-1) > 90, `last pick was ${picked.at(-1)} — that is a prefix, not a spread`);
  assert.deepEqual(picked, [...picked].sort((a, b) => a - b));
});

test("strideSample copes with tiny and empty inputs", () => {
  assert.deepEqual(strideSample([], 0.2), []);
  assert.deepEqual(strideSample(["only"], 0.2), ["only"]);
  assert.deepEqual(strideSample(["a", "b"], 1), ["a", "b"]);
  assert.equal(strideSample(Array.from({ length: 3 }, (u, i) => i), 0.2).length, 1);
});

/* ------------------------------------------------------------------ *
 * It must be invisible to every account that exists today
 * ------------------------------------------------------------------ */

test("a full-content account sees the library untouched", () => {
  // Not "sees all the ids" — sees the SAME ARRAY, so no existing user travels a
  // new code path because a sample plan was added for somebody else.
  const filtered = filterToEntitlement(GUIDED_READING_BOOK_INDEX, new Set(), { hasFullContent: true });
  assert.equal(filtered, GUIDED_READING_BOOK_INDEX);
});

test("a sample account sees only the sample, and a missing list shows nothing", () => {
  const ids = sampleBookIds(GUIDED_READING_BOOK_INDEX);
  const filtered = filterToEntitlement(GUIDED_READING_BOOK_INDEX, ids, { hasFullContent: false });
  assert.equal(filtered.length, ids.size);
  assert.ok(filtered.every(book => ids.has(book.id)));

  // Entitlement and Guided Reading publication both fail closed. A missing
  // entitlement list must not expose paid content.
  assert.deepEqual(filterToEntitlement(GUIDED_READING_BOOK_INDEX, null, { hasFullContent: false }), []);
});

/* ------------------------------------------------------------------ *
 * The anonymous session
 * ------------------------------------------------------------------ */

test("the nickname is assigned and cannot describe the child", async () => {
  const { makeNickname } = await import("../../src/policy/tryModeSession.js");
  // The most important line of defence in the feature: there is no input, so a
  // child cannot type their real name into one.
  const seen = new Set();
  let sequence = 0;
  const fakeRandom = () => ((sequence += 7) % 100) / 100;
  for (let index = 0; index < 60; index += 1) seen.add(makeNickname(fakeRandom));
  assert.ok(seen.size > 5, "nicknames should vary");

  // Nothing in the vocabulary may comment on the child. A computer assigning a
  // five-year-old "Tiny" or "Slow" has told them something about themselves.
  const banned = /tiny|small|little|slow|big|fat|clever|smart|dim|weak|strong|fast|silly|naughty/i;
  for (const name of seen) {
    assert.ok(!banned.test(name), `nickname "${name}" comments on the child`);
  }
});

test("a try session installs ephemeral storage and can be ended", async () => {
  const { beginTryModeSession, TRY_LEVELS } = await import("../../src/policy/tryModeSession.js");
  const { createMemoryStorage, realStorageKeysWritten, resetEphemeralStorage } =
    await import("../../src/policy/ephemeralSession.js");
  resetEphemeralStorage();

  const realStorage = createMemoryStorage();
  const target = { localStorage: realStorage };
  const session = beginTryModeSession({ level: "C", storageTarget: target });

  assert.ok(session, "a session must start");
  assert.equal(session.level, "C");
  assert.equal(session.entitlement.ephemeral, true);
  assert.equal(session.entitlement.capabilities.persistProgress, false);

  target.localStorage.setItem("lp-daily-mission:try", "{}");
  assert.deepEqual(realStorageKeysWritten(realStorage), [],
    "a try session must leave real storage untouched");

  session.end();
  assert.equal(target.localStorage, realStorage);
  assert.ok(TRY_LEVELS.length >= 3);
});

test("an unknown level falls back rather than starting an undefined session", async () => {
  const { beginTryModeSession } = await import("../../src/policy/tryModeSession.js");
  const { resetEphemeralStorage, createMemoryStorage } =
    await import("../../src/policy/ephemeralSession.js");
  resetEphemeralStorage();
  const target = { localStorage: createMemoryStorage() };
  assert.equal(beginTryModeSession({ level: "Z", storageTarget: target }).level, "A");
});

test("a failed storage swap returns null so the caller can refuse to run", async () => {
  const { beginTryModeSession } = await import("../../src/policy/tryModeSession.js");
  const { createMemoryStorage } = await import("../../src/policy/ephemeralSession.js");
  const target = {};
  Object.defineProperty(target, "localStorage", {
    configurable: false,
    value: createMemoryStorage()
  });
  // Fatal, not a fallback. A try-mode running against real storage would be
  // collecting from a child while the screen told their parent it was not.
  assert.equal(beginTryModeSession({ storageTarget: target }), null);
});

test("the grown-up is warned when leaving, not only when arriving", async () => {
  const { TRY_MODE_NOTICE } = await import("../../src/policy/tryModeSession.js");
  // The moment that stings is finishing a book and finding nothing was kept.
  // Warning somebody only at the front door means they meet that alone.
  assert.ok(TRY_MODE_NOTICE.beforeStart.body.length > 40);
  assert.ok(TRY_MODE_NOTICE.onLeaving.body.length > 40);
  assert.ok(TRY_MODE_NOTICE.onLeaving.callToAction);
  assert.match(TRY_MODE_NOTICE.beforeStart.body, /not (stored|saved)|nothing.*stored/i);
});
