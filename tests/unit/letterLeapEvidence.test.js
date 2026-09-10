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
const collectLetterLeapChoice = readFunction("collectLetterLeapChoice");
const bounceLetterLeapSpring = readFunction("bounceLetterLeapSpring");
const buildLetterLeapTrail = readFunction("buildLetterLeapTrail");
const rebaseLetterLeapWorld = readFunction("rebaseLetterLeapWorld");
const letterLeapDecorativeTime = readFunction("letterLeapDecorativeTime");
const letterLeapRenderScale = readFunction(
  "letterLeapRenderScale",
  "const MAX_RETINA_BACKING_PIXELS = 1_600_000;"
);
const letterLeapInitialChoiceCenter = readFunction("letterLeapInitialChoiceCenter");
const letterLeapCameraLookahead = readFunction("letterLeapCameraLookahead");
const letterLeapGroundHeight = readFunction(
  "letterLeapGroundHeight",
  "const GROUND_H = 96;"
);

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

test("collecting one letter preserves its paired and following world objects", () => {
  const choices = [
    { choiceId: '0:0', x: 300, taken: false },
    { choiceId: '0:0', x: 470, taken: false },
    { choiceId: '0:1', x: 740, taken: false },
  ];
  const neighbours = structuredClone(choices.slice(1));
  collectLetterLeapChoice(choices[0]);
  assert.equal(choices[0].taken, true);
  assert.deepEqual(choices.slice(1), neighbours);
  assert.doesNotMatch(implementation, /clearChoiceGroup/);
});

test("springs launch grounded walkers and falling players once, never rising players", () => {
  for (const entry of [
    { y: 277, vy: 0, onGround: true, previousFeet: 300 },
    { y: 249, vy: 8, onGround: false, previousFeet: 264 },
  ]) {
    const player = { x: 200, h: 46, ...entry };
    const spring = { x: 200, press: 0 };
    assert.equal(bounceLetterLeapSpring(player, spring, 300, entry.previousFeet), true);
    assert.equal(player.vy, -19);
    assert.equal(player.springLaunch, true, 'spring flight is independent of holding the jump button');
    assert.equal(player.y + player.h / 2, 268);
    assert.equal(player.onGround, false);
    assert.equal(bounceLetterLeapSpring(player, spring, 300, 268), false);
  }
  assert.equal(bounceLetterLeapSpring({ x: 200, h: 46, y: 249, vy: -4 }, { x: 200, press: 0 }, 300, 280), false);
  assert.equal(bounceLetterLeapSpring({ x: 300, h: 46, y: 277, vy: 0, onGround: true }, { x: 200, press: 0 }, 300, 300), false);
  assert.match(implementation, /!p\.springLaunch && !keys\.jump/);
});

test("each difficulty's ten courses change room order or terrain spacing", () => {
  for (const world of ['meadow', 'dino', 'moonwood']) {
    const layouts = Array.from({ length: 10 }, (_, stage) => buildLetterLeapTrail(0, 320, stage, 0, world));
    assert.equal(new Set(layouts.map(route => JSON.stringify(route.sections))).size, 10);
  }
});

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
  assert.match(implementation, /CAST\[HEROES\.find/);
  assert.match(implementation, /loadHero\.src = hero\.heroSprite/);
  assert.doesNotMatch(implementation, /char-meadow|char-dino|char-hero/);
  assert.match(implementation, /ctx\.fillText\("YOU", p\.x, cueY \+ 1\)/);
  assert.match(implementation, /ctx\.ellipse\(p\.x, groundY\(\) - 2, 30, 9/);
  assert.match(implementation, /const h = H < 240 \? 56 : 76/);
});


const letterLeapVelocity = readFunction("letterLeapVelocity", "const MOVE = 4.8;");

test("Letter Leap authors separate persistent encounters with taught decoys and no first-position shortcut", () => {
  const targetSlots = new Set();
  for (let seed = 1; seed <= 32; seed += 1) {
    const plan = buildLetterLeapChoicePlan(["CAT", "LETTER"], "meadow", 4, seededRandom(seed));
    for (const [wi, decisions] of plan.entries()) for (const [order, decision] of decisions.entries()) {
      assert.equal(decision.choices.length, 2);
      assert.equal(decision.choices[1].offsetX - decision.choices[0].offsetX, 170);
      assert.equal(decision.choices[0].rise, 0);
      assert.ok(decision.choices[1].rise >= 72 && decision.choices[1].rise <= 96);
      const targets = decision.choices.filter(c => c.word === wi);
      assert.equal(targets.length, 1);
      assert.equal(targets[0].ch, ["CAT", "LETTER"][wi][order]);
      targetSlots.add(targets[0].slot);
      const decoy = decision.choices.find(c => c.word === -1);
      assert.notEqual(decoy.ch, targets[0].ch);
      assert.ok("CATLETTER".includes(decoy.ch));
    }
    assert.notEqual(plan[1][2].choiceId, plan[1][3].choiceId, "repeated T letters are independent pickups");
  }
  assert.deepEqual([...targetSlots].sort(), [0, 1]);
});

test("Letter Leap accelerates smoothly, brakes reliably and retains aerial control", () => {
  let velocity = 0;
  velocity = letterLeapVelocity(velocity, 1, true);
  assert.ok(velocity > 0 && velocity < 4.8);
  for (let n = 0; n < 12; n += 1) velocity = letterLeapVelocity(velocity, 1, true);
  assert.equal(velocity, 4.8);
  for (let n = 0; n < 5; n += 1) velocity = letterLeapVelocity(velocity, 0, true);
  assert.equal(velocity, 0);
  assert.ok(letterLeapVelocity(4.8, -1, false) < 4.8);
  assert.equal(letterLeapInitialChoiceCenter(390), 270);
  assert.equal(letterLeapCameraLookahead(390), 62.4);
});

test("Letter Leap completion feedback never disables input or freezes platform physics", () => {
  assert.doesNotMatch(implementation, /touchChoiceArmed|refreshChoiceGroup|reserveLetterLeapChoiceLane/);
  const start = implementation.indexOf("function wordDone()");
  const end = implementation.indexOf("function finishWordTransition()", start);
  assert.doesNotMatch(implementation.slice(start, end), /releaseInputs|running = false|vx = 0/);
  assert.match(implementation, /wordTransitionT = reduceMotion \? 0\.48 : 0\.72/);
  assert.match(implementation, /b\.cooldown = 1\.4/);
  assert.match(implementation, /const assistedAxis = heldAxis \|\|/);
  assert.match(implementation, /autoLeapStopX = nextTouchLeapStop\(\)/);
  assert.match(implementation, /el\.addEventListener\("pointercancel", cancel\)/);
});

function nestedFunction(name) {
  const visit = node => {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'FunctionDeclaration' && node.id?.name === name) return node;
    for (const value of Object.values(node)) {
      for (const child of Array.isArray(value) ? value : [value]) {
        const result = visit(child);
        if (result) return result;
      }
    }
    return null;
  };
  const declaration = visit(syntaxTree.program);
  assert.ok(declaration);
  return implementation.slice(declaration.start, declaration.end);
}

test('Letter Leap terrain supports every pickup in all thirty curriculum levels and sentence legs', async () => {
  const { difficultyLadder, worldForGameDifficulty } = await import('../../src/utils/curriculumLadder.js');
  const pickFoeType = readFunction('pickFoeType');
  const makeLevel = Function('buildLetterLeapChoicePlan', 'letterLeapInitialChoiceCenter', 'pickFoeType', 'buildLetterLeapTrail', `
    const W = 568, SEG = 440, WORD_GAP = 560;
    const groundY = () => 240;
    const shuffleArr = a => a;
    ${nestedFunction('makeLevel')}
    return makeLevel;
  `)(buildLetterLeapChoicePlan, letterLeapInitialChoiceCenter, pickFoeType, buildLetterLeapTrail);
  let routes = 0;
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const world = worldForGameDifficulty(difficulty);
    for (const [index, stage] of difficultyLadder('letter-leap', difficulty).entries()) {
      for (const words of stage.mode === 'sentence' ? stage.targets : [stage.targets]) {
        const level = makeLevel(words.map(w => w.toUpperCase()), world, index);
        routes += 1;
        expectSafeRoute(level);
      }
    }
  }
  assert.ok(routes >= 30);
  function expectSafeRoute(level) {
    const targets = level.bubbles.filter(b => b.word !== -1);
    assert.ok(targets.length > 0);
    for (const b of level.bubbles) {
      assert.ok(!level.pits.some(([left, right]) => b.x > left && b.x < right), 'letters never sit over an open pit');
      if (b.y < 240 - 46) {
        assert.ok(level.plats.some(p => b.x >= p.x && b.x <= p.x + p.w && p.y === b.y + 40), 'upper letters have a real landing surface');
      } else {
        assert.ok(!level.plats.some(p => b.x >= p.x && b.x <= p.x + p.w && p.y < b.y), 'ground letters are not hidden under optional shelves');
      }
      const partner = level.bubbles.find(other => other !== b && other.choiceId === b.choiceId);
      assert.equal(Math.abs(partner.x - b.x), 170);
      assert.ok(Math.abs(partner.y - b.y) >= 66);
    }
    for (const bonus of [...level.coins, ...level.stars]) {
      assert.ok(!level.bubbles.some(b => Math.abs(bonus.x - b.x) < 45 && Math.abs(bonus.y - b.y) < 45), "bonus art never obscures a letter");
    }
    assert.ok(level.flag > Math.max(...targets.map(b => b.x)));
    assert.ok((level.flag - 70) / (4.8 * 60) >= 120, 'even maximum-speed traversal provides over two minutes of terrain');
    for (const spring of level.springs) assert.ok(!level.pits.some(([a, b]) => spring.x > a - 24 && spring.x < b + 24), 'springs sit on solid ground');
    assert.ok(new Set(level.sections.map(section => section.kind)).size >= 5, 'courses combine distinct physical room types');
  }
});
