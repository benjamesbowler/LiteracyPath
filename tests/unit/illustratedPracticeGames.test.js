import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  ILLUSTRATED_GAME_IDS,
  ILLUSTRATED_GAME_SCENES
} from "../../src/components/learn/games/shared/illustratedGameScenes.js";
import { CVC_WORDS, SENTENCE_FIX } from "../../src/data/learnGamesData.js";
import { getChildWordAsset } from "../../src/data/childAssets.js";
import { completeRepairDisplay } from "../../src/utils/repairSentence.js";
import { phonemeAudioCandidates } from "../../src/data/phonemeAudioBank.js";
import { buildBlendMissions, buildCvcWorkshopRounds } from "../../src/utils/buildingGrowingRounds.js";

const ROOT = process.cwd();

const EXPECTED_SCENES = {
  build: "cvc-word-builder",
  memory: "sight-word-memory",
  family: "blend-and-build",
  target: "pop-the-word",
  sentence: "word-hopscotch",
  quiz: "reading-race",
  rescue: "word-rescue",
  sort: "sound-sort-factory",
  garden: "letter-garden"
};

test("the legacy scene inventory retains its referenced roster assets", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(ILLUSTRATED_GAME_SCENES).map(([mode, scene]) => [mode, scene.id])),
    EXPECTED_SCENES
  );
  assert.deepEqual([...ILLUSTRATED_GAME_IDS].sort(), Object.values(EXPECTED_SCENES).sort());

  for (const scene of Object.values(ILLUSTRATED_GAME_SCENES)) {
    const assetPath = path.join(ROOT, "public", scene.src.replace(/^\//, ""));
    assert.equal(existsSync(assetPath), true, `${scene.id} scene art exists`);
    assert.ok(statSync(assetPath).size > 20_000, `${scene.id} scene art is a real authored asset`);
    assert.ok(scene.width >= 640 && scene.height >= 640, `${scene.id} exposes useful intrinsic dimensions`);
  }
});

test("live practice modes own distinct playable stages with canonical cast and responsive controls", () => {
  const read = name => readFileSync(path.join(ROOT, "src/components/learn/games/games", name), "utf8");
  const practice = read("ArcadePracticeGame.jsx");
  const recognition = read("RecognitionGameStages.jsx");
  const construction = read("PhonicsPlayConstruction.jsx");
  const adventure = read("AdventureGame.jsx");
  const world = read("AdventureWorldStages.jsx");
  const shared = read("PhonicsPlayShared.jsx");
  const styles = read("phonics-play.css");
  assert.match(practice, /from ['"]\.\/PhonicsPlayConstruction\.jsx['"]/);
  assert.match(practice, /from ['"]\.\/RecognitionGameStages\.jsx['"]/);
  for (const mode of ["build", "memory", "family", "target", "sentence", "quiz"]) {
    assert.match(recognition + construction, new RegExp(`PhonicsPlayScene mode="${mode}"`));
  }
  for (const stage of ["RescueWorldStage", "FactoryWorldStage", "GardenWorldStage"]) {
    assert.match(adventure, new RegExp(`<${stage}\\b`));
  }
  assert.match(world, /advanceCarryWorld/);
  assert.match(world, /advanceConveyor/);
  assert.match(shared, /CAST/);
  assert.match(world, /CAST/);
  assert.doesNotMatch(recognition + construction + shared, /pals\/poses|char-meadow-b|IllustratedGameScene/);
  assert.doesNotMatch(practice, /lg-ps2-practice/);
  assert.match(styles, /min-height:\s*56px/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("Sentence Fix-It preserves reviewed alternatives instead of treating them as wrong", () => {
  const wizardRepair = SENTENCE_FIX.hard.find(repair => repair.display === "The wizard kept ___ wand by the door.");
  assert.deepEqual(wizardRepair.acceptedAnswers, ["his", "her"]);
  assert.ok(wizardRepair.options.includes("his"));
  assert.ok(wizardRepair.options.includes("her"));
  assert.equal(completeRepairDisplay(wizardRepair.display, "his"), "The wizard kept his wand by the door.");
  assert.equal(completeRepairDisplay(wizardRepair.display, "her"), "The wizard kept her wand by the door.");
});

test("every Sentence Fix-It ending supplies the intended tone or sentence type", () => {
  const endingRepairs = Object.values(SENTENCE_FIX).flat().filter(repair => repair.kind === "end");
  assert.ok(endingRepairs.length > 0);
  const intentForMark = { ".": /calm telling sentence/i, "?": /question/i, "!": /strong feeling.*exclamation/i };
  for (const repair of endingRepairs) {
    assert.match(repair.prompt, intentForMark[repair.answer], repair.display);
    assert.equal(completeRepairDisplay(repair.display, repair.answer), repair.say, repair.display);
    assert.deepEqual(repair.options, [".", "?", "!"]);
  }
  for (const display of ["Watch out___", "Look out for the wave___", "The rocket is about to blast off___"]) {
    const repair = endingRepairs.find(item => item.display === display);
    assert.match(repair.prompt, /strong feeling/i, `${display} must not silently reject a calm full stop`);
  }
});

test("G08 authored object pools cover complete games in each curriculum band", () => {
  for (const [difficulty, minimumLength] of [["easy", 3], ["medium", 4], ["hard", 5]]) {
    const rounds = buildCvcWorkshopRounds(difficulty, 100);
    assert.ok(rounds.length >= ({easy:6, medium:8, hard:10})[difficulty], `${difficulty}: object-action pool must support a full game`);
    assert.ok(rounds.length <= CVC_WORDS[difficulty].length);
    for (const round of rounds) {
      assert.ok(round.word.length >= minimumLength, `${difficulty}: ${round.word} is below its tier`);
      assert.equal(round.units.map(unit => unit.grapheme).join(""), round.word);
      assert.equal(new Set(round.units.map(unit => unit.id)).size, round.units.length);
      assert.equal(round.units.length, new Set(round.units.map(unit => unit.index)).size);
      assert.ok(round.units.every(unit => unit.phoneme), `${difficulty}: ${round.word} needs a spoken phoneme per tile`);
      assert.ok(round.destination, `${difficulty}: ${round.word} needs an affected destination`);
      assert.ok(round.units.every(unit => phonemeAudioCandidates(unit.phoneme).length > 0), `${difficulty}: ${round.word} has an unvoiced tile`);
    }
  }
});

test("G08 workshop uses contextual phoneme keys without changing the spelling tiles", () => {
  const bread = buildCvcWorkshopRounds("hard", 100).find(round => round.word === "bread");
  const tree = buildCvcWorkshopRounds("medium", 100).find(round => round.word === "tree");
  assert.equal(bread.units.map(unit => unit.grapheme).join(""), "bread");
  assert.equal(bread.units.find(unit => unit.grapheme === "ea").phoneme, "ea_e");
  assert.equal(tree.units.find(unit => unit.grapheme === "ee").phoneme, "ee");
  assert.notEqual(bread.units.find(unit => unit.grapheme === "ea").phoneme, "ea");
});

test("G08 object cards keep reviewed bat and bed meanings aligned across fallback media", () => {
  const bat = getChildWordAsset("bat");
  const bed = getChildWordAsset("bed");
  assert.equal(bat.alt, "A bat");
  assert.equal(bat.image, "/images/child-mode/cvc/bat.webp");
  assert.equal(bat.fallbackImage, bat.image);
  assert.equal(bed.alt, "A bed");
  assert.equal(bed.image, "/images/child-mode/cvc/bed.webp");
  assert.equal(bed.fallbackImage, bed.image);
});

test("G08 Blend missions are short, named and reviewed onset/rime constructions", () => {
  for (const tier of ["easy", "medium", "hard"]) {
    const missions = buildBlendMissions(tier);
    assert.ok(missions.length >= 4 && missions.length <= 6);
    assert.equal(new Set(missions.map(mission => mission.word)).size, missions.length);
    for (const mission of missions) {
      assert.ok(mission.familyId.startsWith("-"));
      assert.equal(`${mission.onset}${mission.rime}`, mission.word);
      assert.ok(mission.familyWords.includes(mission.word));
      assert.equal(mission.units.map(unit => unit.grapheme).join(""), mission.word);
    }
  }
});
