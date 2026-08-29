import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "@babel/parser";

const implementationPath = "src/components/learn/games/games/LetterLeapGame.jsx";
const implementation = readFileSync(implementationPath, "utf8");
const syntaxTree = parse(implementation, { sourceType: "module", plugins: ["jsx"] });
function readFunction(name) {
  const declaration = syntaxTree.program.body.find(node =>
    node.type === "FunctionDeclaration" && node.id?.name === name
  );
  assert.ok(declaration, `Letter Leap exposes ${name} to focused source-level coverage`);
  return Function(
    implementation.slice(declaration.start, declaration.end) +
      `; return ${name};`
  )();
}

const recordWordEvidence = readFunction("recordWordEvidence");
const buildLetterLeapChoicePlan = readFunction("buildLetterLeapChoicePlan");
const letterLeapDecorativeTime = readFunction("letterLeapDecorativeTime");
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
  assert.match(implementation, /refreshChoiceGroup\(need\.choiceId, p\.x \+ 320\)/);
  assert.match(implementation, /refreshChoiceGroup\(b\.choiceId, p\.x \+ 320\)/);
  assert.match(implementation, /clearChoiceGroup\(b\.choiceId\)/);
  assert.match(implementation, /level\.flag = centerX \+ 260/);
  assert.doesNotMatch(implementation, /need\.x\s*=|need\.y\s*=/);
});

test("Letter Leap labels model-supported play when no picture or recording identifies the target", () => {
  assert.match(implementation, /const needsModelSupport = !picturePath && !canHearTarget\(\)/);
  assert.match(implementation, /elLab\.dataset\.supportMode = needsModelSupport \? "model" : "independent-cue"/);
  assert.match(implementation, /`MODEL · SPELL \$\{word\}`/);
  assert.match(implementation, /refreshSoundState: renderWord/);
  assert.doesNotMatch(implementation, /allowBlockedAssessmentImage: true/);
});

test("Letter Leap recovery choices scan past later decisions and hazards", () => {
  const center = findLetterLeapRecoveryCenter({
    bubbles: [
      { choiceId: "current", x: 400, taken: false },
      { choiceId: "later", x: 600, taken: false }
    ],
    pits: [[850, 1030]],
    blocks: [{ x: 1300, w: 160, broken: false }],
    foes: [{ x0: 1760, x1: 1880 }]
  }, "current", 500);

  assert.equal(center, 2260);
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
