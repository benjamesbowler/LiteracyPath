import { normalizeCampaignProgress, beginCampaignMission, recordCampaignEvidence } from "../../src/features/soundSeekers/v3/engine/campaignProgress.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  computeHydratedValue,
  mergeMonotonic,
  mergeStatusForward,
  reconcileQuestSaveWithStored,
  sanitizeCloudProgressPayload
} from "../../src/utils/progressMerge.js";
import { createSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";

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
    resetEpoch: 3,
    resetId: "reset-a",
    resetHistory: ["legacy"],
    resetPendingIds: ["reset-a"],
    resetPending: true,
    trail: { stopsDone: ["s1"] },
    assignment: { targets: ["m"] },
    telemetry: { sessions: [{ id: "private-session" }] }
  });
  assert.deepEqual(safe, {
    resetEpoch: 3,
    resetId: "reset-a",
    resetHistory: ["legacy"],
    resetPendingIds: ["reset-a"],
    resetPending: true,
    trail: { stopsDone: ["s1"] }
  });
  assert.equal(sanitizeCloudProgressPayload("learn_games", { telemetry: true }).telemetry, true);
});

test("phonics_quest v2 child uploads cannot send a teacher assignment", () => {
  const state = createSoundSeekersState({
    assignment: {
      targets: ["sh"],
      assignedAt: "2026-09-01T08:00:00Z",
      by: "teacher"
    }
  });
  const safe = sanitizeCloudProgressPayload("phonics_quest", state);

  assert.equal(Object.hasOwn(safe, "assignment"), false);
  assert.equal(Object.hasOwn(safe, "telemetry"), false);
  assert.equal(safe.v, 2);
  assert.equal(safe.contentVersion, "sound-seekers-v2");
});

test("phonics_quest v2 merges event evidence without accepting a stale v1 journey", () => {
  const local = {
    ...createSoundSeekersState(),
    evidence: [{ id: "local", at: 2 }],
    trail: { ...createSoundSeekersState().trail, journeyStep: 8 }
  };
  const staleV1 = {
    v: 1,
    mastery: { sh: { correct: 99 } },
    checkpoint: { stopId: "s39" },
    assignment: { stopIds: ["s4"] }
  };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, staleV1);
  assert.equal(merged.v, 2);
  assert.deepEqual(merged.evidence, [{ id: "local", at: 2 }]);
  assert.equal(merged.trail.journeyStep, 8);
  assert.deepEqual(merged.assignment, { stopIds: ["s4"] });
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

test("el_quest: current-epoch cycles from both sources are kept and stars take the max", () => {
  const local = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: { "c-1": { stars: 3, bestScore: 60 }, "c-2": { stars: 1 } }
  };
  const cloud = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: { "c-2": { stars: 2 }, "c-3": { stars: 1 } }
  };
  const next = computeHydratedValue("el_quest", "__all__", local, cloud);
  assert.equal(next.cycles["c-1"].stars, 3, "local-only cycle survives");
  assert.equal(next.cycles["c-2"].stars, 2, "overlapping cycle takes the higher star count");
  assert.equal(next.cycles["c-3"].stars, 1, "cloud-only cycle is added");
});

test("el_quest: a stale legacy payload cannot restore cycles after the v2 reset", () => {
  const current = { schemaVersion: 2, progressEpoch: 2, cycles: {} };
  const legacy = { v: 1, cycles: { "c-1": { stars: 3, bestScore: 60 } } };
  assert.deepEqual(computeHydratedValue("el_quest", "__all__", current, legacy), current);
  assert.deepEqual(computeHydratedValue("el_quest", "__all__", legacy, current), current);
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

test("guided_reading: support-use events from different devices are both retained", () => {
  const localEvent = {
    eventId: "local-whole",
    stage: "whole_word_audio",
    word: "night"
  };
  const cloudEvent = {
    eventId: "cloud-sounds",
    stage: "segmented_phonemes",
    word: "night"
  };
  const localStore = {
    "book-3": {
      pages: {
        0: { supportUseEvents: [localEvent] }
      }
    }
  };
  const cloud = {
    pages: {
      0: { supportUseEvents: [cloudEvent] }
    }
  };
  const next = computeHydratedValue("guided_reading", "book-3", localStore, cloud)["book-3"];

  assert.deepEqual(next.pages[0].supportUseEvents, [localEvent, cloudEvent]);
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

test("phonics_quest: a newer local reset rejects stale cloud journey resurrection", () => {
  const localReset = {
    resetEpoch: 2,
    resetAt: "2026-07-21T09:00:00Z",
    resetId: "reset-local",
    resetHistory: ["legacy"],
    resetPending: true,
    hatched: false,
    trail: { stopsDone: [], stars: {}, drops: {}, routeCursor: 1 },
    mastery: {},
    stones: [],
    trickies: [],
    ledger: { purchases: [] },
    checkpoint: null,
    settings: { highContrast: false },
    settingsAt: "2026-07-20T10:00:00Z"
  };
  const staleCloud = {
    resetEpoch: 1,
    resetAt: "2026-07-20T09:00:00Z",
    resetId: "legacy",
    resetHistory: [],
    resetPending: false,
    hatched: true,
    trail: { stopsDone: ["s1"], stars: { s1: 3 }, routeCursor: 2 },
    mastery: { s: { seen: 8, correct: 8, state: "mastered" } },
    stones: ["s"],
    ledger: { purchases: [{ id: "leaf-cap", at: "2026-07-19T10:00:00Z" }] },
    checkpoint: { stopId: "s2", beatIndex: 1 },
    assignment: { targets: ["m"], assignedAt: "2026-07-21T08:00:00Z", by: "teacher" },
    settings: { highContrast: true },
    settingsAt: "2026-07-21T08:00:00Z"
  };

  const merged = computeHydratedValue("phonics_quest", "__all__", localReset, staleCloud);
  assert.equal(merged.resetEpoch, 2);
  assert.equal(merged.hatched, false);
  assert.deepEqual(merged.trail.stopsDone, []);
  assert.deepEqual(merged.mastery, {});
  assert.deepEqual(merged.stones, []);
  assert.deepEqual(merged.ledger.purchases, []);
  assert.equal(merged.checkpoint, null);
  assert.deepEqual(merged.assignment.targets, ["m"], "teacher-owned assignment still hydrates");
  assert.equal(merged.settings.highContrast, true, "settings retain their independent LWW clock");
});

test("phonics_quest: a newer cloud reset clears an older tab without erasing local telemetry", () => {
  const oldTab = {
    resetEpoch: 4,
    resetAt: "2026-07-20T08:00:00Z",
    resetId: "reset-old-tab",
    resetHistory: ["legacy"],
    resetPending: false,
    hatched: true,
    trail: { stopsDone: ["s1", "s2"], stars: { s1: 3 }, routeCursor: 3 },
    mastery: { s: { seen: 9, correct: 8 } },
    stones: ["s"],
    ledger: { purchases: [{ id: "leaf-cap" }] },
    checkpoint: { stopId: "s3" },
    telemetry: { sessions: [{ id: "device-session" }], current: null }
  };
  const newerReset = {
    resetEpoch: 5,
    resetAt: "2026-07-21T08:00:00Z",
    resetId: "reset-cloud",
    resetHistory: ["legacy", "reset-old-tab"],
    resetPending: false,
    hatched: false,
    trail: { stopsDone: [], stars: {}, drops: {}, routeCursor: 1 },
    mastery: {},
    stones: [],
    trickies: [],
    ledger: { purchases: [] },
    checkpoint: null
  };

  const merged = computeHydratedValue("phonics_quest", "__all__", oldTab, newerReset);
  assert.equal(merged.resetEpoch, 5);
  assert.equal(merged.hatched, false);
  assert.deepEqual(merged.trail.stopsDone, []);
  assert.deepEqual(merged.mastery, {});
  assert.deepEqual(merged.ledger.purchases, []);
  assert.equal(merged.checkpoint, null);
  assert.deepEqual(merged.telemetry.sessions, [{ id: "device-session" }]);
});

test("phonics_quest: equal reset generations continue to merge earned progress forward", () => {
  const local = { resetEpoch: 7, resetAt: "2026-07-21T09:00:00Z", resetId: "reset-shared", resetHistory: ["legacy"], trail: { stopsDone: ["s1"], routeCursor: 2 }, stones: ["s"] };
  const cloud = { resetEpoch: 7, resetAt: "2026-07-21T09:00:00Z", resetId: "reset-shared", resetHistory: ["legacy"], trail: { stopsDone: ["s2"], routeCursor: 3 }, stones: ["m"] };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.equal(merged.resetEpoch, 7);
  assert.deepEqual([...merged.trail.stopsDone].sort(), ["s1", "s2"]);
  assert.deepEqual([...merged.stones].sort(), ["m", "s"]);
});

test("phonics_quest: a same-id server acknowledgement clears the pending reset set", () => {
  const local = {
    resetEpoch: 7,
    resetAt: "2026-07-21T09:00:00Z",
    resetId: "reset-shared",
    resetHistory: ["legacy"],
    resetPendingIds: ["reset-shared"],
    resetPending: true,
    trail: { stopsDone: ["s1"], routeCursor: 2 }
  };
  const cloud = {
    ...local,
    resetPendingIds: [],
    resetPending: false,
    trail: { stopsDone: ["s2"], routeCursor: 3 }
  };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.deepEqual(merged.resetPendingIds, []);
  assert.equal(merged.resetPending, false);
  assert.deepEqual([...merged.trail.stopsDone].sort(), ["s1", "s2"]);
});

test("phonics_quest: unknown pending reset wins despite a same counter or backwards clock", () => {
  const progressedAfterFirstReset = {
    resetEpoch: 8,
    resetAt: "2026-07-21T09:00:00Z",
    resetId: "reset-device-a",
    resetHistory: ["legacy"],
    resetPending: false,
    hatched: true,
    trail: { stopsDone: ["s1"], routeCursor: 2 },
    mastery: { s: { seen: 4, correct: 4 } },
    stones: ["s"],
    checkpoint: { stopId: "s2" }
  };
  const laterConcurrentReset = {
    resetEpoch: 8,
    resetAt: "2026-07-21T08:00:00Z",
    resetId: "reset-device-b",
    resetHistory: ["legacy"],
    resetPending: true,
    hatched: false,
    trail: { stopsDone: [], stars: {}, drops: {}, routeCursor: 1 },
    mastery: {},
    stones: [],
    trickies: [],
    ledger: { purchases: [] },
    checkpoint: null
  };
  const merged = computeHydratedValue(
    "phonics_quest", "__all__", progressedAfterFirstReset, laterConcurrentReset
  );
  assert.equal(merged.resetEpoch, 8);
  assert.equal(merged.resetAt, "2026-07-21T08:00:00Z");
  assert.equal(merged.resetId, "reset-device-b");
  assert.deepEqual(merged.resetHistory, ["legacy", "reset-device-a"]);
  assert.equal(merged.hatched, false);
  assert.deepEqual(merged.trail.stopsDone, []);
  assert.deepEqual(merged.mastery, {});
  assert.equal(merged.checkpoint, null);
});

test("phonics_quest: two unknown pending resets retain both operations and converge independently of orientation", () => {
  const olderResetAfterProgress = {
    resetEpoch: 100,
    resetAt: "2026-07-21T09:00:00Z",
    resetId: "reset-a-older",
    resetHistory: ["legacy"],
    resetPending: true,
    hatched: true,
    trail: { stopsDone: ["s1"], routeCursor: 2 },
    mastery: { s: { seen: 4, correct: 4 } },
    stones: ["s"],
    checkpoint: { stopId: "s2" }
  };
  const newerFreshReset = {
    resetEpoch: 200,
    resetAt: "2026-07-21T10:00:00Z",
    resetId: "reset-z-newer",
    resetHistory: ["legacy"],
    resetPending: true,
    hatched: false,
    trail: { stopsDone: [], stars: {}, drops: {}, routeCursor: 1 },
    mastery: {},
    stones: [],
    ledger: { purchases: [] },
    checkpoint: null
  };

  for (const [base, cloud] of [
    [olderResetAfterProgress, newerFreshReset],
    [newerFreshReset, olderResetAfterProgress]
  ]) {
    const merged = computeHydratedValue("phonics_quest", "__all__", base, cloud);
    assert.equal(merged.resetId, "reset-z-newer");
    assert.deepEqual(merged.resetPendingIds, ["reset-a-older", "reset-z-newer"]);
    assert.deepEqual(merged.resetHistory, ["legacy"]);
    assert.equal(merged.hatched, false);
    assert.deepEqual(merged.trail.stopsDone, []);
    assert.deepEqual(merged.mastery, {});
    assert.equal(merged.checkpoint, null);
  }
});

test("phonics_quest: pending reset sets converge across every three-way grouping", () => {
  const resetA = {
    resetEpoch: 9,
    resetAt: "2026-07-21T09:00:00Z",
    resetId: "reset-a",
    resetHistory: ["legacy"],
    resetPendingIds: ["reset-a"],
    resetPending: true,
    hatched: true,
    trail: { stopsDone: ["s1"], routeCursor: 2 },
    mastery: { s: { seen: 4, correct: 4 } },
    stones: ["s"],
    checkpoint: { stopId: "s2" }
  };
  const acknowledgedB = {
    resetEpoch: 10,
    resetAt: "2026-07-21T10:00:00Z",
    resetId: "reset-b",
    resetHistory: ["legacy", "reset-a"],
    resetPendingIds: [],
    resetPending: false,
    hatched: true,
    trail: { stopsDone: ["s1", "s2"], routeCursor: 3 },
    mastery: { s: { seen: 8, correct: 8 } },
    stones: ["s"],
    checkpoint: { stopId: "s3" }
  };
  const resetC = {
    resetEpoch: 7,
    resetAt: "2026-07-21T07:00:00Z",
    resetId: "reset-z-c",
    resetHistory: ["legacy"],
    resetPendingIds: ["reset-z-c"],
    resetPending: true,
    hatched: false,
    trail: { stopsDone: [], stars: {}, drops: {}, routeCursor: 1 },
    mastery: {},
    stones: [],
    ledger: { purchases: [] },
    checkpoint: null
  };
  const merge = (left, right) => computeHydratedValue("phonics_quest", "__all__", left, right);
  const results = [
    merge(merge(resetA, resetC), acknowledgedB),
    merge(merge(acknowledgedB, resetC), resetA),
    merge(merge(resetA, acknowledgedB), resetC)
  ];

  for (const merged of results) {
    assert.equal(merged.resetId, "reset-z-c");
    assert.deepEqual(merged.resetPendingIds, ["reset-z-c"]);
    assert.deepEqual(merged.resetHistory, ["legacy", "reset-a", "reset-b"]);
    assert.equal(merged.hatched, false);
    assert.deepEqual(merged.trail.stopsDone, []);
    assert.deepEqual(merged.mastery, {});
    assert.equal(merged.checkpoint, null);
  }
});

test("phonics_quest: a stale tab cannot overwrite a descendant reset on disk", () => {
  const staleWriter = {
    resetId: "reset-a",
    resetHistory: ["legacy"],
    resetPending: false,
    hatched: true,
    trail: { stopsDone: ["s1"], routeCursor: 2 },
    mastery: { s: { seen: 4, correct: 4 } },
    stones: ["s"],
    checkpoint: { stopId: "s2" }
  };
  const storedReset = {
    resetId: "reset-b",
    resetHistory: ["legacy", "reset-a"],
    resetPending: false,
    hatched: false,
    trail: { stopsDone: [], stars: {}, drops: {}, routeCursor: 1 },
    mastery: {},
    stones: [],
    ledger: { purchases: [] },
    checkpoint: null
  };
  const protectedSave = reconcileQuestSaveWithStored(staleWriter, storedReset);
  assert.equal(protectedSave.resetId, "reset-b");
  assert.deepEqual(protectedSave.trail.stopsDone, []);
  assert.deepEqual(protectedSave.mastery, {});
  assert.equal(protectedSave.checkpoint, null);
});

test("phonics_quest: same-generation disk reconciliation never resurrects a cleared checkpoint", () => {
  const writer = {
    resetId: "reset-a",
    resetHistory: ["legacy"],
    resetPending: false,
    trail: { stopsDone: ["s1"], routeCursor: 2 },
    checkpoint: null
  };
  const stored = {
    ...writer,
    resetHistory: ["legacy", "older-concurrent-reset"],
    checkpoint: { stopId: "s2", beatIndex: 1 }
  };
  const reconciled = reconcileQuestSaveWithStored(writer, stored);
  assert.equal(reconciled.checkpoint, null);
  assert.deepEqual(reconciled.resetHistory, ["legacy", "older-concurrent-reset"]);
});

test("phonics_quest: same-generation disk reconciliation keeps newer settings and teacher assignment", () => {
  const staleWriter = {
    resetId: "reset-a",
    resetHistory: ["legacy"],
    resetPending: false,
    settings: { highContrast: false, reducedMotion: false },
    settingsAt: "2026-07-20T09:00:00Z",
    assignment: null,
    trail: { stopsDone: ["s1"], routeCursor: 2 },
    checkpoint: null
  };
  const stored = {
    ...staleWriter,
    settings: { highContrast: true, reducedMotion: true },
    settingsAt: "2026-07-21T09:00:00Z",
    assignment: {
      targets: ["sh"],
      note: "Friday practice",
      assignedAt: "2026-07-21T08:00:00Z",
      by: "teacher"
    },
    trail: { stopsDone: ["s1", "s2"], routeCursor: 3 },
    checkpoint: { stopId: "s3", beatIndex: 1 }
  };

  const reconciled = reconcileQuestSaveWithStored(staleWriter, stored);
  assert.equal(reconciled.settings.highContrast, true);
  assert.equal(reconciled.settings.reducedMotion, true);
  assert.equal(reconciled.settingsAt, "2026-07-21T09:00:00Z");
  assert.deepEqual(reconciled.assignment, stored.assignment);
  assert.deepEqual(reconciled.trail.stopsDone, ["s1", "s2"]);
  assert.equal(reconciled.checkpoint, null, "the current writer still owns explicit checkpoint clearing");
});

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

  const resetMigration = fs.readFileSync("supabase/migrations/20260721100000_sound_seekers_reset_epoch.sql", "utf8");
  assert.match(resetMigration, /create or replace function public\.lp_quest_reset_id_set/);
  assert.match(resetMigration, /create or replace function public\.lp_quest_pending_reset_ids/);
  assert.match(resetMigration, /payload -> 'resetPendingIds'/);
  assert.match(resetMigration, /payload ->> 'resetPending'[\s\S]*jsonb_build_array\(active_id\)/);
  assert.match(resetMigration, /existing_reset_id <> incoming_reset_id/);
  assert.match(resetMigration, /existing_reset_history \? incoming_reset_id/);
  assert.match(resetMigration, /incoming_reset_history \? existing_reset_id/);
  assert.match(resetMigration, /jsonb_array_length\(existing_pending_reset_ids\) = 0[\s\S]*jsonb_build_array\(existing_reset_id\)/);
  assert.match(resetMigration, /settled_reset_ids := public\.lp_quest_reset_id_set\([\s\S]*combined_reset_history[\s\S]*acknowledged_reset_ids/);
  assert.match(resetMigration, /pending_reset_ids := public\.lp_quest_reset_id_set\([\s\S]*settled_reset_ids/);
  assert.match(resetMigration, /select value into winner_reset_id[\s\S]*jsonb_array_elements_text\(pending_reset_ids\)[\s\S]*order by value collate "C" desc/);
  assert.match(resetMigration, /jsonb_agg\(to_jsonb\(n\.id\) order by n\.id collate "C"\)/);
  assert.match(resetMigration, /winner_reset_id = incoming_reset_id[\s\S]*authoritative := incoming/);
  assert.match(resetMigration, /winner_reset_id = existing_reset_id[\s\S]*authoritative := existing/);
  assert.match(resetMigration, /else[\s\S]*authoritative := null[\s\S]*if authoritative is null/);
  assert.match(resetMigration, /merged_reset_history := public\.lp_quest_reset_id_set\([\s\S]*pending_reset_ids[\s\S]*jsonb_build_array\(winner_reset_id\)/);
  assert.match(resetMigration, /result := existing \|\| incoming/);
  assert.match(resetMigration, /'resetId'[\s\S]*winner_reset_id/);
  assert.match(resetMigration, /'resetHistory'[\s\S]*merged_reset_history/);
  assert.match(resetMigration, /'resetPendingIds', '\[\]'::jsonb/);
  assert.match(resetMigration, /'resetPending', false/);
  assert.match(resetMigration, /'trail'[\s\S]*authoritative -> 'trail'/);
  assert.match(resetMigration, /'checkpoint'[\s\S]*authoritative -> 'checkpoint'/);

  const selftest = fs.readFileSync("supabase/verify/sound_seekers_audit_integrity_selftest.sql", "utf8");
  assert.match(selftest, /old trail survived a newer reset/);
  assert.match(selftest, /stale writer resurrected the old trail/);
  assert.match(selftest, /backwards-clock pending reset was rejected/);
  assert.match(selftest, /same-millisecond unique reset was rejected/);
  assert.match(selftest, /older pending writer reversed a newer pending reset/);
  assert.match(selftest, /A\/B\/C pending reset convergence depended on grouping/);
  assert.match(selftest, /canonical carried pending id was not selected/);
  assert.match(selftest, /acknowledging visible B suppressed hidden pending reset A/);
  assert.match(selftest, /same pending reset acknowledgement discarded post-reset trail progress/);
  assert.match(selftest, /stale update discarded a first-insert pending reset/);
  assert.match(selftest, /teacher assignment was not delivered across reset generations/);
});

test("Sound Seekers content deck migration keeps raw merge separate from valid projections", () => {
  const migration = fs.readFileSync(
    "supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql", "utf8"
  );
  const selftest = fs.readFileSync(
    "supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql", "utf8"
  );
  for (const signature of [
    "lp_quest_normalize_v2_activity_type(domain text, value text)",
    "lp_quest_normalize_v2_deck_visit(category text, entry_id text, value jsonb)",
    "lp_quest_normalize_v2_deck_use(category text, entry_id text, value jsonb)",
    "lp_quest_merge_v2_content_decks(left jsonb, right jsonb)",
    "lp_quest_normalize_v2_attempt_receipt(entry_id text, value jsonb)",
    "lp_quest_union_v2_attempt_receipts(left_receipts jsonb, right_receipts jsonb)",
    "lp_quest_valid_v2_attempt_receipts(evidence jsonb, content_decks jsonb, attempt_receipts jsonb)",
    "lp_quest_valid_v2_content_decks(content_decks jsonb, attempt_receipts jsonb, evidence jsonb)"
  ]) assert.ok(migration.includes(signature), signature);
  assert.match(migration, /'morphology'[\s\S]*'transfer'/);
  assert.match(migration, /attemptReceipts/);
  assert.match(migration, /attempt_receipt_conflict/);
  assert.match(selftest, /SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST/);
  assert.match(selftest, /model_pending/);
  assert.match(selftest, /narrativeChoiceToken/);
});

test('learn_games keeps whole immutable practice sessions and flags conflicting same-id evidence',()=>{
 const event={id:'session-a',contentVersion:'learn-game-practice-v1',completedAt:'2026-09-09T00:00:00Z',steps:[{round:0,response:'no',correct:false}],assistedRetries:[{round:0,attempts:2}],independent:false};
 const record=events=>({v:3,status:'completed',completions:events});
 const local={games:{pop:{plays:1,practiceRecord:record([event])}}};
 const cloud={games:{pop:{plays:2,practiceRecord:record([{...event,steps:[{round:0,response:'yes',correct:true}]},{...event,id:'session-b'}])}}};
 const result=computeHydratedValue('learn_games','__all__',local,cloud).games.pop;
 assert.equal(result.plays,2);
 assert.equal(result.practiceRecord.completions.length,2);
 assert.deepEqual(result.practiceRecord.completions[0],event);
 assert.deepEqual(result.practiceRecord.completionConflictIds,['session-a']);
 assert.deepEqual(computeHydratedValue('learn_games','__all__',{games:{pop:{plays:3}}},local).games.pop.practiceRecord.completions,[event]);
});


function campaignFixture(eventId) {
  const catalog = { stages: [{ id: "stage" }], missions: [{ id: "mission", stageId: "stage" }] };
  const started = beginCampaignMission(normalizeCampaignProgress(null), "mission", { attemptId: "attempt", challenges: [{ id: "one" }], beatState: {} }, catalog, 1);
  return recordCampaignEvidence(started, "mission", { id: eventId, attemptId: "attempt", independent: true, targetIds: ["gpc-a"] }, catalog, 2);
}

test("campaign hydration uses immutable evidence union and requires an explicit learner scope", () => {
  const a = campaignFixture("a"), b = campaignFixture("b");
  const merged = computeHydratedValue("phonics_quest", "sound_seekers_v3", a, b, { scopeKey: "child" });
  assert.equal(merged.evidence.length, 2);
  assert.equal(merged.targets["gpc-a"].independent, 2);
  assert.equal(merged.campaign.checkpoints.mission.attemptId, "attempt");
  assert.throws(() => computeHydratedValue("phonics_quest", "sound_seekers_v3", a, b), /scope/);
  assert.throws(() => computeHydratedValue("phonics_quest", "sound_seekers_v3", a, { v: 99 }, { scopeKey: "child" }), /Unsupported/);
});

test("campaign cloud sanitation removes nested migration recovery snapshots", () => {
  const raw = campaignFixture("a");
  raw.campaign.legacySave = { assignment: { note: "device only" }, telemetry: { sessions: [] } };
  const safe = sanitizeCloudProgressPayload("phonics_quest", raw);
  assert.equal(safe.campaign.legacySave, undefined);
  assert.ok(raw.campaign.legacySave);
  assert.deepEqual(safe.evidence, raw.evidence);
});
