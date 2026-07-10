import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeHydratedValue,
  mergeMonotonic,
  mergeStatusForward
} from "../../src/utils/progressMerge.js";

// ── The core promise: hydrating from the cloud never loses local progress ─────

test("learn_games: cloud row keeps games earned on another device (no clobber)", () => {
  const local = { v: 1, soundEnabled: true, games: { hop: { stars: 3, highScore: 90, plays: 4 } } };
  const cloud = { v: 1, soundEnabled: true, games: { match: { stars: 2, highScore: 50, plays: 1 } } };
  const next = computeHydratedValue("learn_games", "__all__", local, cloud);
  assert.equal(next.games.hop.stars, 3, "local-only game must survive hydrate");
  assert.equal(next.games.match.stars, 2, "cloud-only game is added");
});

test("learn_games: a stale cloud row cannot downgrade local stars", () => {
  const local = { games: { hop: { stars: 3, highScore: 90 } } };
  const cloud = { games: { hop: { stars: 1, highScore: 20 } } };
  const next = computeHydratedValue("learn_games", "__all__", local, cloud);
  assert.equal(next.games.hop.stars, 3);
  assert.equal(next.games.hop.highScore, 90);
});

test("el_quest: cycles from both sources are kept and stars take the max", () => {
  const local = { v: 1, cycles: { "c-1": { stars: 3, bestScore: 60 }, "c-2": { stars: 1 } } };
  const cloud = { v: 1, cycles: { "c-2": { stars: 2 }, "c-3": { stars: 1 } } };
  const next = computeHydratedValue("el_quest", "__all__", local, cloud);
  assert.equal(next.cycles["c-1"].stars, 3, "local-only cycle survives");
  assert.equal(next.cycles["c-2"].stars, 2, "overlapping cycle takes the higher star count");
  assert.equal(next.cycles["c-3"].stars, 1, "cloud-only cycle is added");
});

test("story_quests: completed never regresses to false and found words union", () => {
  // local store is a map keyed by questId; cloud row payload is the record.
  const localStore = { "quest-7": { v: 1, completed: true, wordsFound: ["cat", "dog"], visitedPageCount: 5 } };
  const cloud = { v: 1, completed: false, wordsFound: ["cat", "sun"], visitedPageCount: 2 };
  const next = computeHydratedValue("story_quests", "quest-7", localStore, cloud)["quest-7"];
  assert.equal(next.completed, true, "an earned completion is never un-earned");
  assert.deepEqual(next.wordsFound.sort(), ["cat", "dog", "sun"], "all words across devices are kept");
  assert.equal(next.visitedPageCount, 5, "page count takes the max");
});

test("story_quests: a different local quest is not dropped when a cloud row arrives", () => {
  const localStore = { "quest-1": { completed: true }, "quest-7": { completed: false } };
  const cloud = { completed: true };
  const next = computeHydratedValue("story_quests", "quest-7", localStore, cloud);
  assert.equal(next["quest-1"].completed, true, "untouched local quest survives");
  assert.equal(next["quest-7"].completed, true);
});

test("guided_reading: completedPages and readCount take the max", () => {
  const localStore = { "book-3": { completed: true, completedPages: 8, readCount: 2 } };
  const cloud = { completed: false, completedPages: 3, readCount: 1 };
  const next = computeHydratedValue("guided_reading", "book-3", localStore, cloud)["book-3"];
  assert.equal(next.completed, true);
  assert.equal(next.completedPages, 8);
  assert.equal(next.readCount, 2);
});

test("phonics/cvc: a completed letter is never downgraded by a stale cloud status", () => {
  assert.equal(mergeStatusForward("completed", "inprogress"), "completed");
  assert.equal(mergeStatusForward("inprogress", "default"), "inprogress");
  // forward progress from cloud is accepted
  assert.equal(mergeStatusForward("inprogress", "completed"), "completed");
  const next = computeHydratedValue("phonics_letters", "m", { m: "completed" }, { v: 2, status: "inprogress" });
  assert.equal(next.m, "completed");
});

test("daily_mission: a stale cloud row can NOT un-finish today's tasks (arcade stays unlocked)", () => {
  const local = { v: 1, day: "2026-07-09", done: { quest: true, book: true, game: true }, streak: 4, lastCompletedDay: "2026-07-09" };
  const staleCloud = { v: 1, day: "2026-07-08", done: {}, streak: 3, lastCompletedDay: "2026-07-08" };
  const next = computeHydratedValue("daily_mission", "__all__", local, staleCloud);
  assert.equal(next.day, "2026-07-09", "today's local day survives a stale cloud row");
  assert.deepEqual(next.done, { quest: true, book: true, game: true }, "finished tasks survive re-login");
  assert.equal(next.streak, 4);
});

test("daily_mission: same day merges done flags from both devices and keeps the best streak", () => {
  const local = { v: 1, day: "2026-07-09", done: { game: true }, streak: 2, lastCompletedDay: "2026-07-08" };
  const cloud = { v: 1, day: "2026-07-09", done: { quest: true, book: true }, streak: 3, lastCompletedDay: "2026-07-09", shieldWeek: "2026-w28" };
  const next = computeHydratedValue("daily_mission", "__all__", local, cloud);
  assert.deepEqual(next.done, { quest: true, book: true, game: true }, "done flags union across devices");
  assert.equal(next.streak, 3);
  assert.equal(next.lastCompletedDay, "2026-07-09", "richer completion metadata wins");
  assert.equal(next.shieldWeek, "2026-w28");
});

test("daily_mission: a genuinely NEWER cloud day wins outright (legit resets propagate)", () => {
  const oldLocal = { v: 1, day: "2026-07-01", done: { quest: true }, streak: 9 };
  const newerCloud = { v: 1, day: "2026-07-09", done: {}, streak: 1 };
  const next = computeHydratedValue("daily_mission", "__all__", oldLocal, newerCloud);
  assert.equal(next.day, "2026-07-09");
  assert.deepEqual(next.done, {});
  assert.equal(next.streak, 1, "a legitimately reset streak is not inflated back up");
});

// ── mergeMonotonic primitives ────────────────────────────────────────────────

test("mergeMonotonic: numbers max, booleans OR, arrays union, missing sides", () => {
  assert.equal(mergeMonotonic(2, 5), 5);
  assert.equal(mergeMonotonic(5, 2), 5);
  assert.equal(mergeMonotonic(true, false), true);
  assert.equal(mergeMonotonic(false, false), false);
  assert.deepEqual(mergeMonotonic([1, 2], [2, 3]), [1, 2, 3]);
  assert.equal(mergeMonotonic(undefined, 4), 4);
  assert.equal(mergeMonotonic(4, undefined), 4);
});
