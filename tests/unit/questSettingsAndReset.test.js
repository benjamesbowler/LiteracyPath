// SOUND SEEKERS IS A PIXEL GAME, AND A CHILD CAN START AGAIN.
//
// Two things this pins:
//
// 1. The child is never asked to pick a renderer. The settings panel used to
//    offer six ("Automatic / Pixel adventure / Rich 3D / Balanced 3D /
//    Low-power 3D / Accessible 2D"). Three of those drop a five-year-old into
//    a game that looks nothing like the one they were in, and none of them is
//    a choice a child can make meaningfully. The other renderers survive as
//    automatic device fallbacks; they are not a question.
//
// 2. Starting again is two doors, not one. Remaking a creature must cost the
//    child none of their learning; starting the adventure over must clear it
//    honestly, without stranding a checkpoint or leaving purchases charged
//    against stars that no longer exist.

import test from "node:test";
import assert from "node:assert/strict";

import { QUEST_DISPLAY_MODES, normalizeQuestSettings } from "../../src/utils/questPerformance.js";
import { baseQuestState, availableSparks } from "../../src/utils/questProgress.js";
import { defaultCreature, normalizeCreature } from "../../src/data/creatureParts.js";

test("the child is only ever offered the pixel world", () => {
  const ids = QUEST_DISPLAY_MODES.map(mode => mode.id);
  assert.deepEqual(ids, ["auto", "pixel"]);
  for (const retired of ["rich", "balanced", "low", "2d"]) {
    assert.ok(!ids.includes(retired), `"${retired}" is still offered to the child`);
  }
});

test("a profile parked on a retired 3D mode comes back to the pixel game", () => {
  // A child left on "Rich 3D" by the old panel, or a cloud row written by a
  // previous build, must not be stranded in a renderer they can no longer
  // choose or leave.
  for (const retired of ["rich", "balanced", "low", "2d"]) {
    assert.equal(
      normalizeQuestSettings({ displayMode: retired }).displayMode,
      "auto",
      `"${retired}" was not migrated`
    );
  }
  assert.equal(normalizeQuestSettings({ displayMode: "pixel" }).displayMode, "pixel");
  assert.equal(normalizeQuestSettings({}).displayMode, "auto");
});

test("comfort and sound settings survive normalisation", () => {
  const settings = normalizeQuestSettings({
    displayMode: "low",
    reducedMotion: true,
    highContrast: true,
    quietSoundscape: true,
    soundEnabled: false
  });
  assert.equal(settings.reducedMotion, true);
  assert.equal(settings.highContrast, true);
  assert.equal(settings.quietSoundscape, true);
  assert.equal(settings.soundEnabled, false);
});

test("sound defaults ON, because the sound IS the lesson", () => {
  assert.equal(normalizeQuestSettings({}).soundEnabled, true);
});

// ── Starting again ──────────────────────────────────────────────────────────

test("a fresh save has nothing owed, nothing owned and nowhere resumed", () => {
  const fresh = baseQuestState();
  assert.deepEqual(fresh.trail.stopsDone, []);
  assert.deepEqual(fresh.mastery, {});
  assert.deepEqual(fresh.stones, []);
  assert.deepEqual(fresh.ledger.purchases, [], "purchases must go: sparks are derived from stars");
  assert.equal(fresh.checkpoint, null, "a stale checkpoint would resume a stop that is no longer done");
  assert.equal(availableSparks(fresh), 0);
  assert.equal(fresh.hatched, false, "a reset child should meet the creature maker again");
});

test("remaking a creature costs the child none of their learning", () => {
  // The shape the Den's "Make a new creature" button produces.
  const played = {
    ...baseQuestState(),
    hatched: true,
    creature: { ...defaultCreature(), body: "moth" },
    mastery: { s: { seen: 6, correct: 6, state: "mastered" } },
    stones: ["s"],
    trail: { ...baseQuestState().trail, stopsDone: ["s1", "s2"], stars: { s1: 3, s2: 2 } }
  };
  const remade = { ...played, creature: defaultCreature(), hatched: false };

  assert.deepEqual(remade.mastery, played.mastery, "mastery must survive a new creature");
  assert.deepEqual(remade.stones, played.stones, "stones must survive a new creature");
  assert.deepEqual(remade.trail, played.trail, "trail progress must survive a new creature");
  assert.notDeepEqual(remade.creature, played.creature);
});

test("a reset creature is a valid creature, not an empty one", () => {
  // normalizeCreature repairs anything malformed, so a reset can never leave
  // the child with a beastie the renderer cannot draw.
  const fresh = defaultCreature();
  assert.deepEqual(normalizeCreature(fresh), fresh);
  assert.ok(fresh.body, "a reset creature still needs a body");
});
