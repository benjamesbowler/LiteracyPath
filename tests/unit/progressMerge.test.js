import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  computeHydratedValue,
  mergeMonotonic,
  mergeStatusForward,
  sanitizeCloudProgressPayload
} from "../../src/utils/progressMerge.js";

// ── The core promise: hydrating from the cloud never loses local progress ─────

test("learn_games: cloud row keeps games earned on another device (no clobber)", () => {
  const local = { v: 1, soundEnabled: true, games: { hop: { stars: 3, highScore: 90, plays: 4 } } };
  const cloud = { v: 1, soundEnabled: true, games: { match: { stars: 2, highScore: 50, plays: 1 } } };
  const next = computeHydratedValue("learn_games", "__all__", local, cloud);
  assert.equal(next.games.hop.stars, 3, "local-only game must survive hydrate");
  assert.equal(next.games.match.stars, 2, "cloud-only game is added");
});

test("phonics_quest cloud payloads never include assignment or telemetry", () => {
  const safe = sanitizeCloudProgressPayload("phonics_quest", {
    trail: { stopsDone: ["s1"] },
    assignment: { targets: ["m"] },
    telemetry: { sessions: [{ id: "private-session" }] }
  });
  assert.deepEqual(safe, { trail: { stopsDone: ["s1"] } });
  assert.equal(sanitizeCloudProgressPayload("learn_games", { telemetry: true }).telemetry, true);
});

test("learn_games: a cleared checkpoint is NOT resurrected by a stale cloud row", () => {
  // The child finished the ladder locally (checkpoint cleared); an old cloud
  // row still carries checkpoints. Resume state must stay cleared - but a
  // game this device never played may take the cloud checkpoint.
  const local = { games: {
    "rocket-run": { stars: 3, highScore: 90 }, // finished: no checkpoints key
    "rhyme-pop": { stars: 1, highScore: 10, checkpoints: { easy: { level: 2, totalLevels: 10 } } }
  } };
  const cloud = { games: {
    "rocket-run": { stars: 2, highScore: 50, checkpoints: { easy: { level: 4, totalLevels: 10 } } },
    "word-bridge": { stars: 1, highScore: 20, checkpoints: { easy: { level: 3, totalLevels: 10 } } }
  } };
  const merged = computeHydratedValue("learn_games", "__all__", local, cloud);
  assert.equal(merged.games["rocket-run"].checkpoints, undefined, "finished ladder resumed from stale cloud");
  assert.equal(merged.games["rocket-run"].stars, 3, "stars still monotonic");
  assert.equal(merged.games["rhyme-pop"].checkpoints.easy.level, 2, "local resume state owned by this device");
  assert.equal(merged.games["word-bridge"].checkpoints.easy.level, 3, "never-played game takes cloud checkpoint");
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

// ── phonics_quest (Sound Seekers) — the one area a naive forward-merge corrupts ─
// These fixtures mirror supabase/migrations/20260715090000_phonics_quest_merge.sql
// exactly; if a rule changes here, change it there in the same commit.

test("phonics_quest: the ordered accuracy window is NEVER union-collapsed", () => {
  const local = { mastery: { s: { seen: 6, correct: 5, streak: 2, window: [1, 1, 0, 1], state: "learning", box: 2, shells: ["stones"], sessions: ["d1"], misses: 1, lastAt: "2026-07-14", lastStop: 3 } } };
  const cloud = { mastery: { s: { seen: 4, correct: 4, streak: 4, window: [1, 0], state: "learning", box: 2, shells: ["bridge"], sessions: ["d2"], misses: 0, lastAt: "2026-07-13", lastStop: 2 } } };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.deepEqual(merged.mastery.s.window, [1, 1, 0, 1], "window must come intact from the higher-seen side");
  assert.equal(merged.mastery.s.seen, 6, "counters take the max");
  assert.deepEqual([...merged.mastery.s.shells].sort(), ["bridge", "stones"], "evidence sets union");
});

test("phonics_quest: a demotion witnessed on this device is not undone by a stale mastered row", () => {
  const local = { mastery: { sh: { seen: 12, correct: 9, streak: 0, window: [0, 0, 1, 1], state: "learning", box: 1, shells: ["stones", "cave"], sessions: ["d1", "d2"], misses: 2, lastAt: "2026-07-15", lastStop: 9 } } };
  const cloud = { mastery: { sh: { seen: 10, correct: 9, streak: 4, window: [1, 1, 1, 1], state: "mastered", box: 4, shells: ["stones"], sessions: ["d1"], misses: 0, lastAt: "2026-07-12", lastStop: 8 } } };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.equal(merged.mastery.sh.state, "learning", "demotion sticks: higher-seen side owns state");
  assert.equal(merged.mastery.sh.box, 1, "box follows the same clock");
});

test("phonics_quest: a newer demotion epoch owns resettable mastery evidence", () => {
  const local = { mastery: { sh: {
    seen: 14, independentSeen: 0, correct: 0, streak: 0, window: [],
    state: "learning", box: 1, shells: [], sessions: [], misses: 2,
    evidenceEpoch: 1, lastAt: "2026-07-15", lastStop: 9
  } } };
  const cloud = { mastery: { sh: {
    seen: 15, independentSeen: 12, correct: 12, streak: 4, window: [1, 1, 1, 1],
    state: "mastered", box: 4, shells: ["stones", "bridge"], sessions: ["d1", "d2"], misses: 0,
    evidenceEpoch: 0, lastAt: "2026-07-12", lastStop: 8
  } } };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud).mastery.sh;
  assert.equal(merged.seen, 15, "lifetime exposure remains monotone");
  assert.equal(merged.evidenceEpoch, 1);
  assert.equal(merged.state, "learning");
  assert.equal(merged.correct, 0, "stale pre-demotion corrects cannot resurrect the claim");
  assert.equal(merged.independentSeen, 0);
  assert.deepEqual(merged.window, []);
  assert.deepEqual(merged.shells, []);
  assert.deepEqual(merged.sessions, []);
});

test("phonics_quest: routeCursor is journey state, not an achievement — no max-merge", () => {
  const local = { trail: { stopsDone: ["s1"], stars: { s1: 2 }, routeCursor: 3 } };
  const cloud = { trail: { stopsDone: ["s1", "s2"], stars: { s1: 3 }, routeCursor: 40 } };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.equal(merged.trail.routeCursor, 3, "this device keeps its own journey position");
  assert.equal(merged.trail.stars.s1, 3, "stars still merge forward");
  assert.deepEqual([...merged.trail.stopsDone].sort(), ["s1", "s2"], "stops walked anywhere are kept");
});

test("phonics_quest: a synthetic fresh-device cursor does not erase the cloud review position", () => {
  const local = { trail: { stopsDone: [], routeCursor: 1 } };
  const cloud = { trail: { stopsDone: ["s1", "s40"], routeCursor: 30 } };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.equal(merged.trail.routeCursor, 30);
});

test("phonics_quest: purchases union by id — different timestamps do not duplicate a purchase", () => {
  const local = { ledger: { purchases: [{ id: "leaf-cap", at: "2026-07-10T09:00:00Z" }] } };
  const cloud = { ledger: { purchases: [{ id: "leaf-cap", at: "2026-07-10T09:00:03Z" }, { id: "moth-wings", at: "2026-07-11" }] } };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.equal(merged.ledger.purchases.length, 2, "one leaf-cap, one moth-wings");
  assert.deepEqual(merged.ledger.purchases.map(p => p.id).sort(), ["leaf-cap", "moth-wings"]);
});

test("phonics_quest: checkpoint is resume state — a cloud checkpoint never teleports this device", () => {
  const local = { checkpoint: { stopId: "s3", beatIndex: 1 }, stones: ["a", "m"] };
  const cloud = { checkpoint: { stopId: "s9", beatIndex: 0 }, stones: ["a", "t"] };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.equal(merged.checkpoint.stopId, "s3", "this device keeps its own checkpoint");
  assert.deepEqual([...merged.stones].sort(), ["a", "m", "t"], "stones union");
});

test("phonics_quest: a fresh device resumes only a cloud checkpoint at its merged current stop", () => {
  const current = computeHydratedValue("phonics_quest", "__all__", {}, {
    trail: { stopsDone: ["s1", "s2"], routeCursor: 3 },
    checkpoint: { stopId: "s3", beatIndex: 1 }
  });
  assert.deepEqual(current.checkpoint, { stopId: "s3", beatIndex: 1 });

  const stale = computeHydratedValue("phonics_quest", "__all__", {}, {
    trail: { stopsDone: ["s1", "s2"], routeCursor: 3 },
    checkpoint: { stopId: "s9", beatIndex: 1 }
  });
  assert.equal(stale.checkpoint, null, "a stale mid-stop row cannot teleport the child");
});

test("mergeMonotonic: numbers max, booleans OR, arrays union, missing sides", () => {
  assert.equal(mergeMonotonic(2, 5), 5);
  assert.equal(mergeMonotonic(5, 2), 5);
  assert.equal(mergeMonotonic(true, false), true);
  assert.equal(mergeMonotonic(false, false), false);
  assert.deepEqual(mergeMonotonic([1, 2], [2, 3]), [1, 2, 3]);
  assert.equal(mergeMonotonic(undefined, 4), 4);
  assert.equal(mergeMonotonic(4, undefined), 4);
});

test("server merge mirrors demotion epochs, safe resume, daily missions, and Hollow bounds", () => {
  const migration = fs.readFileSync("supabase/migrations/20260720153000_sound_seekers_audit_integrity.sql", "utf8");
  assert.match(migration, /a_epoch <> b_epoch/);
  assert.match(migration, /'independentSeen'/);
  assert.match(migration, /incoming_has_progress[\s\S]*?jsonb_array_length/);
  assert.match(migration, /existing_checkpoint ->> 'stopId'[\s\S]*?trunc\(cursor_val\)/);
  assert.match(migration, /incoming_creature_at[\s\S]*?existing_creature_at[\s\S]*?'creatureAt'/);
  assert.match(migration, /when p_area = 'daily_mission' then public\.lp_merge_daily_mission/);
  assert.match(migration, /when p_area = 'hollow' then public\.lp_merge_hollow/);
  assert.match(migration, /species_rank <= 8/);
  assert.match(migration, /'purchases'.*128/s);
});
