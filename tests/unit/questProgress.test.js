import { test } from "node:test";
import assert from "node:assert/strict";
import {
  baseQuestState,
  normalizeQuestState,
  recordQuestAttempt,
  recordStopResult,
  earnedGearReward,
  currentStopIndex,
  isStopUnlocked,
  totalStars,
  earnedSparks,
  spentSparks,
  availableSparks,
  chapterRewardForStop,
  unlockedChapterRewards,
  questRewardBonuses,
  ownedPieces,
  canBuy,
  recordPurchase,
  recordPurchaseAndEquip,
  saveQuestCheckpoint,
  readQuestCheckpoint,
  clearQuestCheckpoint
} from "../../src/utils/questProgress.js";
import { computeHydratedValue, mergeMasteryRecord } from "../../src/utils/progressMerge.js";
import { MASTERY_STATES, emptyRecord } from "../../src/utils/questMastery.js";
import { getPiece } from "../../src/data/creatureParts.js";
import { buildTrailSection } from "../../src/utils/questHub.js";

const masteredRecord = () => ({
  ...emptyRecord(),
  seen: 10, correct: 10, streak: 10, misses: 0,
  window: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  shells: ["stones", "bridge"], sessions: ["2026-07-11", "2026-07-12"],
  state: MASTERY_STATES.MASTERED, box: 4
});

// ── The trail ───────────────────────────────────────────────────────────────

test("a new child starts at stop 1 with nothing unlocked ahead", () => {
  const state = baseQuestState();
  assert.equal(currentStopIndex(state), 1);
  assert.equal(isStopUnlocked(state, "s1"), true);
  assert.equal(isStopUnlocked(state, "s2"), false);
});

test("THE STORY NEVER WAITS: a stop with zero mastery still advances the trail", () => {
  // This is the central design claim of the whole mode. A child who got every
  // single answer wrong still walks on, still gets the stars they earned (0),
  // still sees the next stop. Only the STONES stay dark.
  let state = baseQuestState();
  for (const target of ["a", "m", "t", "s"]) {
    state = recordQuestAttempt(state, { target, correct: false, shell: "stones", at: "2026-07-11T10:00:00Z" });
  }
  state = recordStopResult(state, "s1", 0);

  assert.equal(isStopUnlocked(state, "s2"), true, "the child must never be blocked");
  assert.deepEqual(state.stones, [], "but no stone lights up — the honest signal");
  assert.equal(state.mastery.a.state, MASTERY_STATES.LEARNING);
});

test("a stone lights only when its sound is MASTERED, not when the stop is passed", () => {
  let state = baseQuestState();
  state = { ...state, mastery: { m: masteredRecord() } };
  state = recordStopResult(state, "s1", 3);
  assert.deepEqual(state.stones, ["m"]);
});

test("finishing a stop banks its heart words and keeps the best star score", () => {
  let state = recordStopResult(baseQuestState(), "s3", 2);
  assert.deepEqual(state.trickies, ["I", "the", "is", "a"]);
  assert.equal(state.trail.stars.s3, 2);

  state = recordStopResult(state, "s3", 1);
  assert.equal(state.trail.stars.s3, 2, "a worse replay must not lower the score");

  state = recordStopResult(state, "s3", 3);
  assert.equal(state.trail.stars.s3, 3);
});

test("after stop 40 the route becomes an endless ordered review circuit", () => {
  let state = baseQuestState();
  for (let index = 1; index <= 40; index += 1) state = recordStopResult(state, `s${index}`, 2);
  assert.equal(state.trail.routeCursor, 1);
  state = recordStopResult(state, "s1", 2);
  assert.equal(state.trail.routeCursor, 2);
  state = recordStopResult(state, "s2", 2);
  assert.equal(state.trail.routeCursor, 3);
});

// ── Rewards are DERIVED ─────────────────────────────────────────────────────

test("sparks are DERIVED from stars and are never stored", () => {
  let state = recordStopResult(baseQuestState(), "s1", 3);
  state = recordStopResult(state, "s2", 2);
  assert.equal(totalStars(state), 5);
  assert.equal(earnedSparks(state), 60);
  assert.equal(spentSparks(state), 0);
  assert.equal(availableSparks(state), 60);
  assert.ok(!("sparks" in state), "sparks must not exist as a stored field");
});

test("only SPENDING is stored, and it can never be un-spent", () => {
  let state = recordStopResult(baseQuestState(), "s1", 3);
  state = recordStopResult(state, "s2", 3);
  assert.equal(availableSparks(state), 72);

  const coral = getPiece("eyes-fierce"); // cost 40
  assert.equal(canBuy(state, coral), true);
  state = recordPurchase(state, coral, "2026-07-11T10:00:00Z");
  assert.equal(spentSparks(state), 40);
  assert.equal(availableSparks(state), 32);
  assert.ok(ownedPieces(state).has("eyes-fierce"));

  assert.equal(canBuy(state, coral), false, "you cannot buy what you already own");
  assert.equal(recordPurchase(state, coral).ledger.purchases.length, 1, "and buying it again is a no-op");
});

test("you cannot buy what you cannot afford", () => {
  const state = baseQuestState();
  const crown = getPiece("crest-crown"); // cost 90
  assert.equal(availableSparks(state), 0);
  assert.equal(canBuy(state, crown), false);
  assert.equal(recordPurchase(state, crown).ledger.purchases.length, 0);
});

test("a Trading Post purchase equips immediately without removing earned gear", () => {
  let state = recordStopResult(baseQuestState(), "s3", 3, 8);
  const wings = state.creature.equipped.back;
  const fierceEyes = getPiece("eyes-fierce");
  state = recordPurchaseAndEquip(state, fierceEyes, "2026-07-11T10:00:00Z");

  assert.equal(state.creature.eyes, "eyes-fierce");
  assert.equal(state.creature.equipped.back, wings);
  assert.ok(ownedPieces(state).has("eyes-fierce"));
});

test("gear is GIVEN by walking the trail, not bought", () => {
  const fresh = baseQuestState();
  assert.equal(ownedPieces(fresh).has("leaf-cap"), false);
  const state = recordStopResult(fresh, "s1", 1);
  assert.equal(ownedPieces(state).has("leaf-cap"), true, "the stop-1 drop");
  assert.equal(state.creature.equipped.head, "leaf-cap", "the earned gear lands on the creature");
  assert.deepEqual(earnedGearReward(state, "s1"), { id: "leaf-cap", slot: "head", equipped: true });
});

test("the Seedwake gate reward carries a fully equipped cumulative creature", () => {
  let state = baseQuestState();
  for (let index = 1; index <= 5; index += 1) state = recordStopResult(state, `s${index}`, 3, 4);
  assert.deepEqual(state.creature.equipped, {
    head: "acorn-hat",
    back: "moth-wings",
    neck: "vine-scarf",
    held: "stone-staff"
  });
  assert.deepEqual(earnedGearReward(state, "s5"), { id: "stone-staff", slot: "held", equipped: true });
  assert.ok(chapterRewardForStop("s5"));
});

test("chapter relics unlock only at five-stop destination gates", () => {
  let state = baseQuestState();
  for (let index = 1; index <= 4; index += 1) state = recordStopResult(state, `s${index}`, 2);
  assert.deepEqual(unlockedChapterRewards(state), []);
  assert.equal(chapterRewardForStop("s4"), null);

  state = recordStopResult(state, "s5", 2);
  const seedwakeReward = chapterRewardForStop("s5");
  assert.equal(seedwakeReward?.id, "seedwake-lantern");
  assert.equal(seedwakeReward.destination, "Bramble Gate");
  assert.equal(seedwakeReward.finale.cue, "bramble-gate");
  assert.deepEqual(seedwakeReward.stopIds, ["s1", "s2", "s3", "s4", "s5"]);
  assert.deepEqual(seedwakeReward.cast.map(friend => friend.name), ["Pip", "Moss", "Tumble", "Bramble"]);
  assert.deepEqual(unlockedChapterRewards(state).map(reward => reward.id), ["seedwake-lantern"]);
  assert.equal(questRewardBonuses(state).collectionRadius, 1.06);
});

test("chapter relic abilities accumulate without stored reward state", () => {
  let state = baseQuestState();
  for (let index = 1; index <= 35; index += 1) state = recordStopResult(state, `s${index}`, 1);
  const bonuses = questRewardBonuses(state);
  assert.equal(bonuses.rewardIds.length, 7);
  assert.equal(bonuses.branchCacheCount, 3);
  assert.equal(bonuses.projectionDistance, 56);
  assert.equal(bonuses.repairAura, true);
  assert.equal(bonuses.pathGlow, true);
  assert.equal(bonuses.interactionRadius, 1.1);
  assert.equal(bonuses.routeFocusDistance, 22);
  assert.equal(bonuses.worldLight, false);
  assert.ok(!("chapterRewards" in state), "rewards are derived from completed chapter gates");
});

test("Seedwake satchel thresholds unlock useful route caches before the chapter relic", () => {
  const fresh = baseQuestState();
  const state = {
    ...fresh,
    trail: { ...fresh.trail, drops: { s1: 3, s2: 4, s3: 2 } }
  };
  const bonuses = questRewardBonuses(state);
  assert.equal(bonuses.branchCacheCount, 2);
  const section = buildTrailSection("s4", { seed: 4, rewardCacheCount: bonuses.branchCacheCount });
  assert.equal(section.drops.filter(drop => drop.cache).length, 2);
});

// ── Checkpoints ─────────────────────────────────────────────────────────────

test("the checkpoint round-trips and clears", () => {
  const cp = { stopId: "s1", phase: "shell", shellIndex: 1, queue: ["a", "m"], score: 40 };
  const state = saveQuestCheckpoint(baseQuestState(), cp);
  assert.equal(readQuestCheckpoint(state).shellIndex, 1);
  assert.equal(readQuestCheckpoint(clearQuestCheckpoint(state)), null);
});

test("a journey checkpoint preserves walking and in-encounter progress", () => {
  const cp = {
    stopId: "s7",
    phase: "trail",
    position: { x: 1.2, z: -67.4 },
    guideDone: true,
    meetIndex: 3,
    activeId: "s7-1",
    beatIndex: 1,
    fieldStage: 2,
    solved: ["s7-0"],
    drops: ["s7-drop-0", "s7-drop-3"],
    completionMarks: [{ id: "s7-0-complete", encounterId: "s7-0", shape: "placed-plank" }],
    tally: { correct: 4, total: 5, mistakes: 1 }
  };
  const saved = readQuestCheckpoint(saveQuestCheckpoint(baseQuestState(), cp));
  assert.deepEqual(saved.position, cp.position);
  assert.equal(saved.activeId, "s7-1");
  assert.equal(saved.beatIndex, 1);
  assert.equal(saved.fieldStage, 2);
  assert.deepEqual(saved.solved, ["s7-0"]);
  assert.deepEqual(saved.completionMarks, cp.completionMarks);
  assert.deepEqual(saved.tally, cp.tally);
});

test("finishing a stop clears its checkpoint — there is nothing left to resume", () => {
  let state = saveQuestCheckpoint(baseQuestState(), { stopId: "s1", phase: "shell", shellIndex: 2 });
  state = recordStopResult(state, "s1", 3);
  assert.equal(state.checkpoint, null);
});

// ── The merge. This is where a bug silently eats a child's progress. ─────────

test("MERGE: a cloud row can never LOWER a mastery counter", () => {
  const local = { mastery: { sh: { ...emptyRecord(), seen: 12, correct: 10, window: [1, 1, 0, 1, 1, 1, 1, 1, 1, 1], shells: ["stones", "bridge"], sessions: ["2026-07-11", "2026-07-12"], state: MASTERY_STATES.MASTERED } } };
  const cloud = { mastery: { sh: { ...emptyRecord(), seen: 3, correct: 1, window: [1, 0, 0], shells: ["stones"], sessions: ["2026-07-10"], state: MASTERY_STATES.LEARNING } } };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.equal(merged.mastery.sh.seen, 12);
  assert.equal(merged.mastery.sh.correct, 10);
  assert.equal(merged.mastery.sh.state, MASTERY_STATES.MASTERED, "a stale cloud row must not un-master a sound");
});

test("MERGE: the ordered accuracy window survives — it is NOT unioned into [1,0]", () => {
  // mergeMonotonic would union the window array and collapse [1,1,0,1] to [1,0],
  // silently destroying the accuracy calculation. This is why mastery has its
  // own merge.
  const local = { ...emptyRecord(), seen: 10, window: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1] };
  const cloud = { ...emptyRecord(), seen: 4, window: [0, 0, 1, 1] };
  const merged = mergeMasteryRecord(local, cloud);
  assert.deepEqual(merged.window, [1, 1, 0, 1, 1, 1, 0, 1, 1, 1]);
  assert.equal(merged.window.length, 10);
});

test("MERGE: a DEMOTION survives a stale cloud row that still says mastered", () => {
  // The device that has seen the child answer more times has the more complete
  // history. If it watched them miss a mastered sound twice today, that demotion
  // must stick — otherwise the sound stops being reviewed and the child stays
  // stuck on it forever.
  const local = { ...emptyRecord(), seen: 14, correct: 10, misses: 2, state: MASTERY_STATES.LEARNING };
  const cloud = { ...emptyRecord(), seen: 12, correct: 10, misses: 0, state: MASTERY_STATES.MASTERED };
  const merged = mergeMasteryRecord(local, cloud);
  assert.equal(merged.state, MASTERY_STATES.LEARNING);
  assert.equal(merged.misses, 2);
});

test("MERGE: evidence sets union — a shell proved on either device counts", () => {
  const local = { ...emptyRecord(), seen: 5, shells: ["stones"], sessions: ["2026-07-11"] };
  const cloud = { ...emptyRecord(), seen: 4, shells: ["bridge"], sessions: ["2026-07-12"] };
  const merged = mergeMasteryRecord(local, cloud);
  assert.deepEqual(merged.shells.sort(), ["bridge", "stones"]);
  assert.deepEqual(merged.sessions.sort(), ["2026-07-11", "2026-07-12"]);
});

test("MERGE: stops walked and stones lit are unioned, never lost", () => {
  const local = { trail: { stopsDone: ["s1", "s2"], stars: { s1: 3, s2: 1 } }, stones: ["a", "m"] };
  const cloud = { trail: { stopsDone: ["s1", "s3"], stars: { s1: 1, s3: 2 } }, stones: ["t"] };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.deepEqual(merged.trail.stopsDone.sort(), ["s1", "s2", "s3"]);
  assert.equal(merged.trail.stars.s1, 3, "best score wins");
  assert.deepEqual(merged.stones.sort(), ["a", "m", "t"]);
});

test("MERGE: purchases union by id — spending is never un-spent and never doubled", () => {
  const local = { ledger: { purchases: [{ id: "eyes-fierce", cost: 40 }] } };
  const cloud = { ledger: { purchases: [{ id: "eyes-fierce", cost: 40 }, { id: "crest-crown", cost: 90 }] } };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.equal(merged.ledger.purchases.length, 2);
  assert.equal(spentSparks(merged), 130);
});

test("MERGE: this device keeps its OWN checkpoint — a cloud one would teleport the child", () => {
  const local = { checkpoint: { stopId: "s4", shellIndex: 2 } };
  const cloud = { checkpoint: { stopId: "s1", shellIndex: 0 } };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.deepEqual(merged.checkpoint, { stopId: "s4", shellIndex: 2 });

  const noLocal = computeHydratedValue("phonics_quest", "__all__", {}, cloud);
  assert.equal(noLocal.checkpoint, null, "and an absent local checkpoint stays absent");
});

test("MERGE: this device keeps its own review-route position", () => {
  const local = { trail: { stopsDone: ["s1"], routeCursor: 2 } };
  const cloud = { trail: { stopsDone: ["s1", "s2"], routeCursor: 31 } };
  const merged = computeHydratedValue("phonics_quest", "__all__", local, cloud);
  assert.equal(merged.trail.routeCursor, 2);
  assert.deepEqual(merged.trail.stopsDone.sort(), ["s1", "s2"]);
});

// ── Robustness ──────────────────────────────────────────────────────────────

test("a corrupt or ancient save file never crashes the game", () => {
  assert.equal(normalizeQuestState(null).creature.body, "tuft");
  assert.equal(normalizeQuestState("garbage").hatched, false);
  const weird = normalizeQuestState({ creature: { body: "nope", dye: "nope", eyes: "nope" }, stones: "not-an-array" });
  assert.equal(weird.creature.body, "tuft", "an unknown body falls back rather than crashing");
  assert.deepEqual(weird.stones, []);
});
