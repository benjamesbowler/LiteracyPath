import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "@babel/parser";

const implementationPath = "src/components/learn/games/games/LetterLeapGame.jsx";
const implementation = readFileSync(implementationPath, "utf8");
const syntaxTree = parse(implementation, { sourceType: "module", plugins: ["jsx"] });
function readFunction(name, prelude = "") {
  const declaration = syntaxTree.program.body.find(node =>
    node.type === "FunctionDeclaration" && node.id?.name === name
  );
  assert.ok(declaration, `Letter Leap exposes ${name} to focused source-level coverage`);
  return Function(
    prelude + implementation.slice(declaration.start, declaration.end) +
      `; return ${name};`
  )();
}

const recordWordEvidence = readFunction("recordWordEvidence");
const buildLetterLeapChoicePlan = readFunction("buildLetterLeapChoicePlan");
const isLetterLeapCurrentChoice = readFunction("isLetterLeapCurrentChoice");
const rebaseLetterLeapWorld = readFunction("rebaseLetterLeapWorld");
const letterLeapDecorativeTime = readFunction("letterLeapDecorativeTime");
const letterLeapRenderScale = readFunction(
  "letterLeapRenderScale",
  "const MAX_RETINA_BACKING_PIXELS = 1_600_000;"
);
const letterLeapInitialChoiceCenter = readFunction("letterLeapInitialChoiceCenter");
const letterLeapChoiceAheadDistance = readFunction("letterLeapChoiceAheadDistance");
const letterLeapChoiceSpacing = readFunction("letterLeapChoiceSpacing");
const letterLeapCameraLookahead = readFunction("letterLeapCameraLookahead");
const reserveLetterLeapChoiceLane = readFunction("reserveLetterLeapChoiceLane");
const letterLeapGroundHeight = readFunction(
  "letterLeapGroundHeight",
  "const GROUND_H = 96;"
);
const findLetterLeapRecoveryCenter = readFunction("findLetterLeapRecoveryCenter");

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

test("Letter Leap preserves unique completed-word evidence across a catch-up replay", () => {
  const completedKeys = new Set();

  const firstPass = recordWordEvidence(completedKeys, 2, 0, 0);
  const replay = recordWordEvidence(completedKeys, 2, 0, 0);
  const nextWord = recordWordEvidence(completedKeys, 2, 0, 1);
  const nextSentenceLeg = recordWordEvidence(completedKeys, 2, 1, 0);

  assert.equal(firstPass.added, true);
  assert.equal(firstPass.count, 1);
  assert.equal(replay.added, false);
  assert.equal(replay.count, 1);
  assert.equal(nextWord.added, true);
  assert.equal(nextWord.count, 2);
  assert.equal(nextSentenceLeg.added, true);
  assert.equal(nextSentenceLeg.count, 3);
});

test("Letter Leap failure keeps evidence without adding an answer-revealing world cue", () => {
  assert.doesNotMatch(implementation, /wordsDoneGlobal\s*=\s*wordsDoneAtStageStart/);
  assert.match(implementation, /every word you spelled is saved/i);
  assert.match(implementation, /const bob = reduceMotion \? 0/);
  assert.match(implementation, /starRubric\(\{ correct: wordsDoneGlobal, total: totalWords, mistakes: wrongHits, deaths: 0 \}\)/);
  assert.match(implementation, /if \(alreadySaved\) addFloat\(b\.x, b\.y - 22, "✓ saved"\)/);
  assert.doesNotMatch(implementation, /const isNext = b\.word === wIx && b\.order === nextIx/);
  assert.doesNotMatch(implementation, /ctx\.fillText\("NEXT"/);
  assert.match(implementation, /s\.textContent = done \? word\[i\] : ""/);
  assert.doesNotMatch(implementation, /s\.textContent = word\[i\]/);
  assert.match(implementation, /getChildWordAsset\(word\.toLowerCase\(\)/);
  assert.match(implementation, /index === wIx \? "_"\.repeat/);
});

test("Letter Leap shuffles every grapheme into equivalent reachable choice geometry", () => {
  const targetSlots = new Set();
  const stageSignatures = new Set();
  const stageLettersSeenAsDecoys = new Set();
  const outsideLettersSeenAsDecoys = new Set();

  for (let seed = 1; seed <= 32; seed += 1) {
    const plan = buildLetterLeapChoicePlan(
      ["CAT", "SHIP"],
      seed % 2 ? "meadow" : "moonwood",
      seed % 10,
      seededRandom(seed)
    );
    const signature = [];

    for (const wordGroups of plan) {
      for (const group of wordGroups) {
        assert.equal(group.choices.length, 3);
        assert.deepEqual(group.choices.map(choice => choice.slot), [0, 1, 2]);
        assert.deepEqual(group.choices.map(choice => choice.offsetX), [-84, 0, 84]);

        const targets = group.choices.filter(choice => choice.word >= 0);
        const decoys = group.choices.filter(choice => choice.word === -1);
        assert.equal(targets.length, 1);
        assert.equal(decoys.length, 2);
        assert.equal(new Set(group.choices.map(choice => choice.ch)).size, 3);
        assert.ok(decoys.every(choice => choice.ch !== targets[0].ch));
        assert.ok(decoys.some(choice => "CATSHIP".includes(choice.ch)));
        for (const decoy of decoys) {
          if ("CATSHIP".includes(decoy.ch)) stageLettersSeenAsDecoys.add(decoy.ch);
          else outsideLettersSeenAsDecoys.add(decoy.ch);
        }

        targetSlots.add(targets[0].slot);
        signature.push(targets[0].slot);
      }
    }
    stageSignatures.add(signature.join(""));
  }

  assert.deepEqual([...targetSlots].sort(), [0, 1, 2]);
  assert.deepEqual([...stageLettersSeenAsDecoys].sort(), [...new Set("CATSHIP")].sort());
  assert.ok(outsideLettersSeenAsDecoys.size >= 8, "decoys need broad alphabet diversity");
  assert.ok(stageSignatures.size > 8, "fresh stages do not repeat one answer-position pattern");
  assert.doesNotMatch(implementation, /decoySlots/);
  assert.match(implementation, /y: bubbleY/);
  assert.match(implementation, /refreshChoiceGroup\(need\.choiceId, p\.x \+ letterLeapChoiceAheadDistance\(W\)\)/);
  assert.match(implementation, /refreshChoiceGroup\(b\.choiceId, p\.x \+ letterLeapChoiceAheadDistance\(W\)\)/);
  assert.match(implementation, /clearChoiceGroup\(b\.choiceId\)/);
  assert.match(implementation, /if \(!isLetterLeapCurrentChoice\(b, wIx, nextIx\)\) continue/);
  assert.match(implementation, /keepCurrentChoiceAhead\(\)/);
  assert.match(implementation, /level\.flag = centerX \+ 260/);
  assert.doesNotMatch(implementation, /need\.x\s*=|need\.y\s*=/);
});

test("Letter Leap exposes only the fresh ordered decision that can respond", () => {
  const current = { decisionWord: 1, decisionOrder: 2 };
  const futureLetter = { decisionWord: 1, decisionOrder: 3 };
  const futureWord = { decisionWord: 2, decisionOrder: 0 };

  assert.equal(isLetterLeapCurrentChoice(current, 1, 2), true);
  assert.equal(isLetterLeapCurrentChoice(futureLetter, 1, 2), false);
  assert.equal(isLetterLeapCurrentChoice(futureWord, 1, 2), false);
  assert.doesNotMatch(implementation, /b\.decisionWord !== wIx \|\| b\.decisionOrder !== nextIx/);
});

test("Letter Leap labels model-supported play when no picture or recording identifies the target", () => {
  assert.match(implementation, /const needsModelSupport = !picturePath && !canHearTarget\(\)/);
  assert.match(implementation, /elLab\.dataset\.supportMode = needsModelSupport \? "model" : "independent-cue"/);
  assert.match(implementation, /`MODEL · SPELL \$\{word\}`/);
  assert.match(implementation, /refreshSoundState: renderWord/);
  assert.doesNotMatch(implementation, /allowBlockedAssessmentImage: true/);
});

test("Letter Leap recovery reuses hidden decision space but scans past hazards", () => {
  const center = findLetterLeapRecoveryCenter({
    bubbles: [
      { choiceId: "current", x: 400, taken: false },
      { choiceId: "later", x: 600, taken: false }
    ],
    pits: [[850, 1030]],
    blocks: [{ x: 1300, w: 160, broken: false }],
    plats: [{ x: 1720, w: 180 }],
    foes: [{ x0: 2160, x1: 2280 }]
  }, 900);

  assert.equal(center, 2660);
  assert.match(implementation, /const overlapsPlatform = level\.plats\.some/);
});

test("Letter Leap keeps a retry visible by reserving the nearby literacy lane", () => {
  const level = {
    pits: [[460, 620], [900, 980]],
    blocks: [{ x: 500, w: 44 }, { x: 1100, w: 44 }],
    plats: [{ x: 450, w: 180 }, { x: 1200, w: 180 }],
    foes: [{ x0: 480, x1: 590 }, { x0: 1400, x1: 1500 }]
  };

  reserveLetterLeapChoiceLane(level, 540);

  assert.deepEqual(level.pits, [[900, 980]]);
  assert.deepEqual(level.blocks, [{ x: 1100, w: 44 }]);
  assert.deepEqual(level.plats, [{ x: 1200, w: 180 }]);
  assert.deepEqual(level.foes, [{ x0: 1400, x1: 1500 }]);
  assert.match(implementation, /scannedCenter - requestedCenterX <= letterLeapChoiceSpacing\(W\)/);
  assert.match(implementation, /reserveLetterLeapChoiceLane\(level, centerX\)/);
});

test("Letter Leap rebases every grounded gameplay object when its viewport height changes", () => {
  const player = { y: 200 };
  const level = {
    plats: [{ y: 170, baseY: 160, prevY: 150 }],
    blocks: [{ y: 180 }],
    pickups: [{ y: 140 }],
    bubbles: [{ y: 210 }],
    foes: [{ y: 220, baseY: 230 }],
    coins: [{ y: 130 }],
    stars: [{ y: 120 }]
  };

  rebaseLetterLeapWorld(level, player, 240);

  assert.equal(player.y, 440);
  assert.deepEqual(level.plats[0], { y: 410, baseY: 400, prevY: 390 });
  assert.equal(level.blocks[0].y, 420);
  assert.equal(level.pickups[0].y, 380);
  assert.equal(level.bubbles[0].y, 450);
  assert.deepEqual(level.foes[0], { y: 460, baseY: 470 });
  assert.equal(level.coins[0].y, 370);
  assert.equal(level.stars[0].y, 360);
  assert.match(implementation, /rebaseLetterLeapWorld\(level, player, \(H - letterLeapGroundHeight\(H\)\) - previousGroundY\)/);
  assert.match(implementation, /const py = groundY\(\) - 96/);
  assert.match(implementation, /bubbleY = py - 40/);
});

test("Letter Leap advances gameplay on a fixed 60 Hz simulation instead of display refresh", () => {
  assert.match(implementation, /const FIXED_STEP = 1 \/ 60/);
  assert.match(implementation, /frameAccumulator = Math\.min\(0\.1, frameAccumulator \+ elapsed\)/);
  assert.match(implementation, /while \(frameAccumulator >= FIXED_STEP\)/);
  assert.match(implementation, /update\(FIXED_STEP\)/);
  assert.doesNotMatch(implementation, /update\(elapsed\)/);
  assert.match(implementation, /frameAccumulator = 0; if \(savedRunning\) running = true/);
});

test("Letter Leap freezes continuous decorative motion for reduced-motion players", () => {
  assert.equal(letterLeapDecorativeTime(true, 987654), 0);
  assert.equal(letterLeapDecorativeTime(false, 2500), 2.5);

  assert.match(implementation, /const t = letterLeapDecorativeTime\(reduceMotion, Date\.now\(\)\)/);
  assert.match(implementation, /drawBgImage\(t\)/);
  assert.doesNotMatch(implementation, /drawDepthScenery\(Date\.now\(\)/);
  assert.match(implementation, /const sy = reduceMotion \? s\.y/);
  assert.match(implementation, /drawHeart\(hp\.x, reduceMotion \? hp\.y/);
  assert.match(implementation, /const wave = reduceMotion \? 0/);
  assert.match(implementation, /const wob = reduceMotion \? 1 : Math\.abs\(Math\.cos/);
  assert.match(implementation, /cn\.y \+ \(reduceMotion \? 0 : Math\.sin/);
  assert.match(implementation, /drawStarToken\(st\.x, reduceMotion \? st\.y/);
  assert.match(implementation, /const blink = !reduceMotion/);
});

test("Letter Leap caps oversized Retina backing stores and caches its cinematic grade", () => {
  assert.equal(letterLeapRenderScale(1467, 880, 2), 1);
  assert.equal(letterLeapRenderScale(390, 771, 2), 2);
  assert.equal(letterLeapRenderScale(390, 771, 3), 2);
  assert.equal(letterLeapRenderScale(800, 500, 1), 1);

  assert.match(implementation, /const MAX_RETINA_BACKING_PIXELS = 1_600_000/);
  assert.match(implementation, /rebuildVisualOverlay = \(\) =>/);
  assert.match(implementation, /drawCinematicOverlay\(\)/);
  assert.doesNotMatch(implementation, /drawPs2Overlay/);
  assert.doesNotMatch(implementation, /for \(let y = 0; y < H; y \+= 4\)/);
  assert.doesNotMatch(implementation, /repeating-linear-gradient/);
});

test("Letter Leap gives a single touch a visible run and forward-leap response", () => {
  assert.match(implementation, /tapMoveT = 0\.18/);
  assert.match(implementation, /pointerJumpHoldT = 0\.3/);
  assert.match(implementation, /autoLeapT = 1\.2/);
  assert.match(implementation, /autoLeapStopX = nextTouchLeapStop\(\)/);
  assert.match(implementation, /const stops = \[/);
  assert.match(implementation, /const reachedLeapStop = autoLeapT > 0/);
  assert.match(implementation, /const assistedAxis = heldAxis \|\|/);
  assert.match(implementation, /touchChoiceArmed = false/);
  assert.match(implementation, /if \(!touchChoiceArmed\) continue/);
  assert.match(implementation, /if \(k === "left" \|\| k === "right"\) \{\n\s+touchChoiceArmed = true/);
  assert.match(implementation, /isInteractiveKeyTarget\(e\.target\) && !padWrap\.contains\(e\.target\)/);
  assert.match(implementation, /movingLeft \? "Leap left" : "Leap right"/);
  assert.match(implementation, /el\.addEventListener\("pointercancel", cancel\)/);
  assert.match(implementation, /el\.addEventListener\("lostpointercapture", up\)/);
});

test("Letter Leap keeps every fresh choice inside narrow phone play space", () => {
  assert.equal(letterLeapInitialChoiceCenter(1467), 320);
  assert.equal(letterLeapInitialChoiceCenter(390), 270);
  assert.equal(letterLeapInitialChoiceCenter(320), 200);
  assert.equal(letterLeapChoiceAheadDistance(1467), 280);
  assert.ok(Math.abs(letterLeapChoiceAheadDistance(568) - 249.92) < 0.001);
  assert.ok(Math.abs(letterLeapChoiceAheadDistance(390) - 171.6) < 0.001);
  assert.equal(letterLeapChoiceAheadDistance(320), 150);
  assert.equal(letterLeapChoiceSpacing(568), 84);
  assert.equal(letterLeapChoiceSpacing(390), 78);
  assert.equal(letterLeapChoiceSpacing(320), 72);
  assert.equal(letterLeapCameraLookahead(568), 90);
  assert.equal(letterLeapCameraLookahead(390), 62.4);
  assert.equal(letterLeapCameraLookahead(320), 51.2);
  assert.match(implementation, /let cx = letterLeapInitialChoiceCenter\(W\)/);
  assert.match(implementation, /Math\.sign\(choice\.offsetX\) \* choiceSpacing/);
  assert.match(implementation, /p\.face \* letterLeapCameraLookahead\(W\)/);
  assert.match(implementation, /if \(target\) refreshChoiceGroup\(target\.choiceId, requestedCenterX\)/);
});

test("Letter Leap keeps a usable play lane in 320px phone landscape", () => {
  assert.equal(letterLeapGroundHeight(164), 41);
  assert.equal(letterLeapGroundHeight(320), 80);
  assert.equal(letterLeapGroundHeight(460), 96);
  assert.match(implementation, /minHeight: 0/);
  assert.match(implementation, /max-height:420px/);
  assert.match(implementation, /data-ll="move-controls"/);
  assert.match(implementation, /data-ll="leap-controls"/);
});

test("Letter Leap marks the controllable avatar instead of presenting it as scenery", () => {
  assert.match(implementation, /meadow: \["char-meadow-b\.webp", "char-meadow-c\.webp", "char-meadow-a\.webp"\]/);
  assert.match(implementation, /ctx\.fillText\("YOU", p\.x, cueY \+ 1\)/);
  assert.match(implementation, /ctx\.ellipse\(p\.x, groundY\(\) - 2, 30, 9/);
  assert.match(implementation, /const h = H < 320 \? 82 : 86/);
});

test("Letter Leap holds the completed word for a readable feedback beat", () => {
  assert.match(implementation, /wordTransitionT = reduceMotion \? 0\.48 : 0\.72/);
  assert.match(implementation, /elLab\.textContent = word \+ " built · get ready"/);
  assert.match(implementation, /function finishWordTransition\(\)/);
  assert.match(implementation, /wordTransitionT > 0 && \(direction !== 0 \|\| isJumpKey\(e\.key\)\)/);
  assert.match(implementation, /word \+ " built · reach the finish"/);
  assert.match(implementation, /releaseInputs\(\);\n\s+touchChoiceArmed = false;\n\s+p\.vx = 0;\n\s+renderWord\(\)/);
});
