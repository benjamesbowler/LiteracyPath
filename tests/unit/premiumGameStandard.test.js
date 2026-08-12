import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import {
  hasCompletePremiumSetpieceSet,
  isPrimaryActionKey,
  laneDirectionForKey,
  premiumSetpieceBudget,
  validateGameVerticalSliceBrief,
  verticalDirectionForKey
} from "../../src/components/learn/games/shared/premiumGameStandard.js";
import { ARCADE_PREMIUM_PROFILES } from "../../src/components/learn/games/shared/arcadePremiumProfiles.js";
import { ARCADE_VERTICAL_SLICE_BRIEFS } from "../../src/components/learn/games/shared/arcadeVerticalSliceBriefs.js";
import { GAME_LIST } from "../../src/data/learnGamesData.js";

test("premium 3D setpiece budgets scale up without burdening the low tier", () => {
  const low = premiumSetpieceBudget("low");
  const medium = premiumSetpieceBudget("medium");
  const high = premiumSetpieceBudget("high");

  assert.deepEqual(low, { setpieceKinds: 0, setpieceCopies: 0 });
  assert.ok(medium.setpieceKinds > low.setpieceKinds);
  assert.ok(high.setpieceKinds > medium.setpieceKinds);
  assert.ok(high.setpieceCopies > medium.setpieceCopies);
  assert.equal(premiumSetpieceBudget("unknown"), medium);
});

test("premium scenery replaces the complete fallback only after its whole tier set loads", () => {
  const medium = premiumSetpieceBudget("medium");
  assert.equal(hasCompletePremiumSetpieceSet(medium.setpieceCopies, medium), true);
  assert.equal(hasCompletePremiumSetpieceSet(medium.setpieceCopies - 1, medium), false);
  assert.equal(hasCompletePremiumSetpieceSet(4, premiumSetpieceBudget("low")), false);
});

test("premium lane controls keep arrows and WASD in parity", () => {
  assert.equal(laneDirectionForKey("ArrowLeft"), -1);
  assert.equal(laneDirectionForKey("a"), -1);
  assert.equal(laneDirectionForKey("A"), -1);
  assert.equal(laneDirectionForKey("ArrowRight"), 1);
  assert.equal(laneDirectionForKey("d"), 1);
  assert.equal(laneDirectionForKey("D"), 1);
  assert.equal(laneDirectionForKey("Enter"), 0);
  assert.equal(verticalDirectionForKey("ArrowUp"), -1);
  assert.equal(verticalDirectionForKey("w"), -1);
  assert.equal(verticalDirectionForKey("W"), -1);
  assert.equal(verticalDirectionForKey("ArrowDown"), 1);
  assert.equal(verticalDirectionForKey("s"), 1);
  assert.equal(verticalDirectionForKey("S"), 1);
  assert.equal(verticalDirectionForKey("Tab"), 0);
  for (const key of [" ", "Enter", "ArrowUp", "e", "E"]) assert.equal(isPrimaryActionKey(key), true);
  for (const key of ["Escape", "ArrowLeft", "Tab"]) assert.equal(isPrimaryActionKey(key), false);
});

test("every live arcade game has an individual premium mission and recovery profile", () => {
  const arcadeGames = GAME_LIST.filter(game => (game.surfaces || []).includes("arcade"));
  assert.equal(Object.keys(ARCADE_PREMIUM_PROFILES).length, arcadeGames.length);
  for (const game of arcadeGames) {
    const profile = ARCADE_PREMIUM_PROFILES[game.id];
    assert.ok(profile, `${game.id} has no premium profile`);
    assert.match(profile.version, /^\d+\.\d+$/);
    assert.ok(profile.mission.length >= 20, `${game.id} mission is too vague`);
    assert.ok(profile.objective.length >= 24, `${game.id} objective is too vague`);
    assert.ok(profile.action.length >= 20, `${game.id} action is too vague`);
    assert.ok(profile.controls.length >= 2, `${game.id} needs touch/keyboard control guidance`);
    assert.ok(profile.retry.length >= 30, `${game.id} retry guidance is too vague`);
    assert.ok(profile.completionTitle, `${game.id} needs a completion title`);
    assert.ok(profile.rewardLabel, `${game.id} needs a reward label`);
  }
  assert.equal(new Set(arcadeGames.map(game => ARCADE_PREMIUM_PROFILES[game.id].mission)).size, arcadeGames.length);
});

test("the reference vertical slice is complete, traceable to checks, and honest about hardware validation", () => {
  const brief = ARCADE_VERTICAL_SLICE_BRIEFS["letter-leap"];
  assert.ok(brief);
  assert.deepEqual(validateGameVerticalSliceBrief(brief), []);
  assert.equal(brief.version, ARCADE_PREMIUM_PROFILES[brief.gameId].version);
  for (const file of [...brief.validation.unit, ...brief.validation.browser]) {
    assert.equal(existsSync(file), true, `${file} is named by the brief but does not exist`);
  }
  assert.equal(brief.validation.physicalDevice.status, "unknown");

  const implementation = readFileSync("src/components/learn/games/games/LetterLeapGame.jsx", "utf8");
  assert.match(implementation, /data-ll="hear"/);
  assert.match(implementation, /hasRecordedSpeech\(word/);
  for (const releaseEvent of brief.controls.pointerReleaseEvents) {
    assert.match(implementation, new RegExp(releaseEvent));
  }
  for (const windowSeconds of ["0.12", "0.14"]) {
    assert.match(implementation, new RegExp(windowSeconds.replace(".", "\\.")));
  }
});

test("the vertical-slice gate rejects unsafe controls, evidence and privacy claims", () => {
  const unsafe = structuredClone(ARCADE_VERTICAL_SLICE_BRIEFS["letter-leap"]);
  unsafe.controls.minimumTargetCssPixels = 44;
  unsafe.controls.pointerReleaseEvents = ["pointerup"];
  unsafe.learning.movementCreatesEvidence = true;
  unsafe.privacy.network = [];
  unsafe.privacy.newExternalService = true;
  unsafe.validation.physicalDevice.status = "claimed";

  const issues = validateGameVerticalSliceBrief(unsafe);
  assert.ok(issues.includes("controls.minimumTargetCssPixels must be at least 56"));
  assert.ok(issues.includes("controls.pointerReleaseEvents must include pointercancel"));
  assert.ok(issues.includes("learning.movementCreatesEvidence must be false"));
  assert.ok(issues.includes("privacy.network needs at least one named item"));
  assert.ok(issues.includes("privacy.newExternalService must be false or receive a separate privacy review"));
  assert.ok(issues.includes("validation.physicalDevice.status must be pass, fail or unknown"));
});
