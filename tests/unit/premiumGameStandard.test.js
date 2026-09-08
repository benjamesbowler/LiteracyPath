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

test("every substantial vertical slice is complete, traceable to checks, and honest about hardware validation", () => {
  assert.deepEqual(
    Object.keys(ARCADE_VERTICAL_SLICE_BRIEFS).sort(),
    ["letter-leap", "sound-beat", "sound-racer", "word-bridge", "word-climb"]
  );
  for (const [gameId, brief] of Object.entries(ARCADE_VERTICAL_SLICE_BRIEFS)) {
    assert.equal(brief.gameId, gameId);
    assert.deepEqual(validateGameVerticalSliceBrief(brief), [], `${gameId} brief is incomplete`);
    assert.equal(brief.version, ARCADE_PREMIUM_PROFILES[brief.gameId].version);
    for (const file of [...brief.validation.unit, ...brief.validation.browser]) {
      assert.equal(existsSync(file), true, `${file} is named by ${gameId} but does not exist`);
    }
    assert.equal(brief.validation.physicalDevice.status, "unknown");
  }

  const brief = ARCADE_VERTICAL_SLICE_BRIEFS["letter-leap"];
  const implementation = readFileSync("src/components/learn/games/games/LetterLeapGame.jsx", "utf8");
  assert.match(implementation, /data-ll="hear"/);
  assert.match(implementation, /hasRecordedSpeech\(word/);
  for (const releaseEvent of brief.controls.pointerReleaseEvents) {
    assert.match(implementation, new RegExp(releaseEvent));
  }
  for (const windowSeconds of ["0.12", "0.14"]) {
    assert.match(implementation, new RegExp(windowSeconds.replace(".", "\\.")));
  }

  const bridgeImplementation = readFileSync("src/components/learn/games/games/WordBridgeGame.jsx", "utf8");
  assert.match(bridgeImplementation, /function returnCarriedTileToBank\(\)/);
  assert.match(bridgeImplementation, /role="status" aria-live="polite"/);
  assert.match(bridgeImplementation, /if \(isInteractiveKeyTarget\(e\.target\)\) return/);

  const beatImplementation = readFileSync("src/components/learn/games/games/Ps1ArcadeGame.jsx", "utf8");
  assert.match(beatImplementation, /safeChoiceIndex !== choiceSet\.answerIndex/);
  assert.match(beatImplementation, /soundBeatChoiceSet\(item, state\.beatIndex/);
  assert.match(beatImplementation, /soundBeatVisiblePrompt\(item, state\.beatIndex/);
  assert.match(beatImplementation, /SOUND OFF · MATCH THE MODEL/);
  assert.match(beatImplementation, /addEventListener\("pointercancel", onPointerCancel\)/);
  assert.match(beatImplementation, /liveStatus\.setAttribute\("aria-live", "polite"\)/);

  const racerImplementation = readFileSync("src/features/soundRacer/RacerSession.jsx", "utf8");
  const racerRules = readFileSync("src/utils/soundRacerMission.js", "utf8");
  assert.match(racerImplementation, /racerEvidence\(current/);
  assert.match(racerRules, /buildSoundRacerEvidenceResult\(\{/);
  assert.match(racerImplementation, /data-sr="banner" role="status" aria-live="polite"/);
  assert.match(racerImplementation, /isSoundEnabled && <button[^>]+data-sr="hear-target"/);
  assert.match(racerImplementation, /playRacerTarget\(mission\.target/);

  const climbImplementation = readFileSync("src/components/learn/games/games/WordClimbGame.jsx", "utf8");
  assert.match(climbImplementation, /startLevel = 0/);
  assert.match(climbImplementation, /onCheckpoint\?\.\(Math\.min\(step, session\.summit - 1\), session\.summit\)/);
  assert.match(climbImplementation, /onEngineReady\?\.\(\{ pause: pauseEngine, resume: resumeEngine \}\)/);
  assert.match(climbImplementation, /entry\.remaining = Math\.max\(0, entry\.remaining - \(now - entry\.startedAt\)\)/);
  assert.match(climbImplementation, /if \(soundEnabledRef\.current\) void speakWord\(choice\.word\)/);
  assert.match(climbImplementation, /safeSfx\(soundEnabledRef\.current, playCelebrationFanfare\)/);
  assert.match(climbImplementation, /timersRef\.current\.clear\(\);\n {4}cancelSpeech\(\);/);
  assert.doesNotMatch(climbImplementation, /aria-label="Word Climb complete"/);

  const playerImplementation = readFileSync("src/components/learn/games/GamePlayer.jsx", "utf8");
  assert.match(playerImplementation, /const hasPremiumCompletionOverlay = Boolean\(completionResult && premiumProfile && game\.id !== "rocket-run"\)/);
  assert.match(playerImplementation, /const hasBlockingOverlay = startLevel === null \|\| showQuit \|\| showGuide \|\| hasPremiumCompletionOverlay/);
  assert.match(playerImplementation, /const hasEngineOwnedCompletion = Boolean\(completionResult && !hasPremiumCompletionOverlay\)/);
  assert.match(playerImplementation, /querySelectorAll\("\.lg-game-player-main button:not\(\[disabled\]\)"\)/);
  assert.match(playerImplementation, /<main className="lg-game-player-main" inert=\{hasBlockingOverlay \? true : undefined\}>/);
  assert.match(playerImplementation, /const scope = blockingDialogRef\.current \|\| playerRef\.current/);
  assert.match(playerImplementation, /document\.addEventListener\("keydown", onKeyDown, true\)/);
  assert.match(playerImplementation, /if \(showGuide\) setShowGuide\(false\);\n {6}else if \(showQuit\) setShowQuit\(false\);/);
});

test("Rocket Run keeps the exact target cue replayable and reinforces it after every catch", () => {
  const implementation = readFileSync("src/components/learn/games/games/RocketRunGame.jsx", "utf8");

  assert.match(implementation, /const ROCKET_PREMIUM_PIXEL_BUDGET = 1_600_000/);
  assert.match(implementation, /function rocketRenderTierForViewport\(/);
  assert.match(implementation, /backingPixels <= ROCKET_PREMIUM_PIXEL_BUDGET \? requestedTier : "low"/);
  assert.match(implementation, /for \(let i = 0; i < setpieceBudget\.setpieceCopies; i \+= 1\)[\s\S]*await yieldSceneryFrame\(\)/);
  assert.match(implementation, /data-rr="hear-target"/);
  assert.match(implementation, /width:62px;height:56px/);
  assert.match(implementation, /function replayTarget\(\)/);
  assert.match(implementation, /say\(\(\) => speakPhoneme\(target\)\)/);
  assert.match(implementation, /await speakWord\(bubble\.userData\.word\)/);
  assert.match(implementation, /await speakPhoneme\(roundTarget\)/);
  assert.match(implementation, /starts with '" \+ roundTarget \+ "' ✓/);
  assert.match(implementation, /isolateRocketRunCompletion\(hud, overlay, done\)/);
  assert.match(implementation, /isolateRocketRunActionOverlay\(hud, overlay, retry, "Retry Rocket Run round"\)/);
  assert.match(implementation, /isolateRocketRunActionOverlay\(hud, overlay, next, "Rocket Run round complete"\)/);
  assert.match(implementation, /"min-height:56px"/);
  assert.match(implementation, /<button type="button" data-rr="done"/);
  const rocketCompletion = readFileSync("src/components/learn/games/shared/rocketRunCompletion.js", "utf8");
  assert.match(rocketCompletion, /overlay\.setAttribute\("aria-modal", "true"\)/);
  assert.match(rocketCompletion, /child\.inert = child !== overlay/);
  assert.match(rocketCompletion, /overlay\.addEventListener\("keydown", trapFocus\)/);
  assert.match(rocketCompletion, /child\.inert = wasInert/);
  assert.doesNotMatch(implementation, /\belse say\(\(\) => speak\(/);
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
