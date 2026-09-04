import assert from "node:assert/strict";
import test from "node:test";

import { buildStationRounds } from "../../src/components/elQuest/elQuestEngine.js";
import { initialSoundWordBank } from "../../src/content/initialSounds/initialSoundWordBank.js";
import { getElSkillsBlockCycle, LETTER_EXAMPLES } from "../../src/data/elSkillsBlockCycles.js";
import { VERIFIED_PICTURE_WORDS } from "../../src/data/generated/questStoryQuestions.generated.js";
import { enrichInitialSoundPairQuestion } from "../../src/data/initialSoundPairAssets.js";
import { questions as initialSoundAssessmentQuestions } from "../../src/data/v3/banks/initial_sounds.v3.generated.js";
import { wordsStartingWithTargetSound } from "../../src/utils/rocketRunRounds.js";

test("the active EL programme uses only familiar O examples", () => {
  assert.deepEqual(LETTER_EXAMPLES.o, ["orange", "ox", "octopus"]);

  for (const pairVariant of [0, 1]) {
    const question = enrichInitialSoundPairQuestion({
      id: `basic-o-pair-${pairVariant}`,
      skill: "Initial Sounds",
      itemType: "initial_sound",
      itemKey: "o",
      pairVariant
    });
    assert.equal(question.questionType, "initial_sound_pair");
    assert.ok(question.correctWords.every(word => ["orange", "ox", "octopus"].includes(word)));
    assert.equal(question.imageCards.every(card => Boolean(card.image && card.audio)), true);
    assert.equal(question.choices.some(word => ["olive", "otter"].includes(word)), false);
  }
});

test("letter example cards do not place a non-U word in the basic U set", () => {
  assert.deepEqual(LETTER_EXAMPLES.u, ["up", "umbrella", "under"]);
  assert.equal(LETTER_EXAMPLES.u.every(word => word.startsWith("u")), true);
});

test("live EL picture hunts and pair cards use familiar, nameable words", () => {
  assert.deepEqual(LETTER_EXAMPLES.qu, ["queen", "quilt"]);
  assert.deepEqual(LETTER_EXAMPLES.y, ["yo-yo", "yawn", "yell", "yum"]);
  assert.deepEqual(LETTER_EXAMPLES.v, ["van", "vest", "vase"]);

  const rejectedHiddenWords = ["olive", "otter", "quiz", "uncle", "vet", "yak", "yarn"];
  for (const rejected of rejectedHiddenWords) {
    assert.equal(VERIFIED_PICTURE_WORDS.includes(rejected), false, `${rejected} should not be a hidden EL picture`);
  }

  for (const cycleId of ["cycle-9", "cycle-11", "cycle-12"]) {
    const pictureWords = buildStationRounds(getElSkillsBlockCycle(cycleId), "hunt")
      .filter(round => round.choiceStyle === "picture")
      .flatMap(round => [round.answer, ...(round.choices || [])]);
    for (const rejected of rejectedHiddenWords) {
      assert.equal(pictureWords.includes(rejected), false, `${cycleId} restored hidden ${rejected}`);
    }
  }

  for (const itemKey of ["q", "u", "v", "y"]) {
    for (const pairVariant of [0, 1]) {
      const question = enrichInitialSoundPairQuestion({
        id: `common-${itemKey}-pair-${pairVariant}`,
        skill: "Initial Sounds",
        itemType: "initial_sound",
        itemKey,
        pairVariant
      });
      assert.equal(question.imageCards.every(card => Boolean(card.image && card.audio)), true);
      for (const rejected of rejectedHiddenWords) {
        assert.equal(question.choices.includes(rejected), false, `${itemKey} pair restored ${rejected}`);
      }
    }
  }
});

test("the published Initial Sounds assessment uses the reviewed basic vocabulary", () => {
  const activeWords = initialSoundAssessmentQuestions.flatMap(question => [
    question.targetWord,
    question.anchorWord,
    ...(question.imageCards || []).map(card => card.word),
    ...(question.choices || []).filter(choice => typeof choice === "string" && choice.length > 1)
  ]).filter(Boolean);

  for (const rejected of ["olive", "otter", "yak", "yarn"]) {
    assert.equal(activeWords.includes(rejected), false, `${rejected} should not be published`);
  }

  const hiddenCardWords = initialSoundAssessmentQuestions
    .flatMap(question => (question.imageCards || []).map(card => card.word));
  for (const ambiguous of ["uncle", "vet", "quiz"]) {
    assert.equal(hiddenCardWords.includes(ambiguous), false, `${ambiguous} should not be a hidden picture label`);
  }

  const orangeListeningItem = initialSoundAssessmentQuestions.find(question =>
    question.itemKey === "o" && question.targetWord === "orange" && question.mediaTier === "image-required");
  assert.ok(orangeListeningItem, "orange should remain a pictured short-O target");
  assert.ok(orangeListeningItem.imagePath, "orange should retain its target picture");
  assert.equal(orangeListeningItem.choices.includes("o"), true);
  assert.equal(orangeListeningItem.choices.includes("r"), false, "orange must not imply an initial or final r sound");

  const basicOWords = new Set(initialSoundAssessmentQuestions
    .filter(question => question.itemKey === "o")
    .flatMap(question => [
      question.targetWord,
      ...(question.imageCards || []).map(card => card.word)
    ])
    .filter(Boolean));
  for (const expected of ["orange", "octopus"]) {
    assert.equal(basicOWords.has(expected), true, `${expected} should remain in the O assessment`);
  }

  assert.equal(initialSoundAssessmentQuestions.some(question => question.itemKey === "q"), false);
});

test("the legacy Initial Sounds fallback cannot restore rejected basic words", () => {
  const levelOneWords = initialSoundWordBank
    .filter(question => question.level === 1)
    .map(question => question.targetWord);
  for (const rejected of ["olive", "otter", "uniform", "yak", "yarn", "quiz"]) {
    assert.equal(levelOneWords.includes(rejected), false, `${rejected} should not return through the fallback bank`);
  }

  assert.deepEqual(
    initialSoundWordBank
      .filter(question => question.level === 1 && question.letter === "o")
      .map(question => question.targetWord),
    ["orange", "ox", "octopus"]
  );
});

test("initial-sound Arcade pools keep obscure words out of the early listening game", () => {
  const oWords = wordsStartingWithTargetSound("o");
  assert.ok(oWords.includes("orange"));
  assert.ok(oWords.includes("ox"));
  for (const rejected of ["object", "olive", "opera", "onset", "optic", "otter"]) {
    assert.equal(oWords.includes(rejected), false, `${rejected} should not be an O target`);
  }

  const rejectedBySound = {
    j: ["jab", "jig", "jail", "jazz", "just"],
    k: ["keg", "kin", "keen", "kelp", "kept"],
    l: ["lad"]
  };
  for (const [sound, rejectedWords] of Object.entries(rejectedBySound)) {
    const pool = wordsStartingWithTargetSound(sound);
    for (const rejected of rejectedWords) {
      assert.equal(pool.includes(rejected), false, `${rejected} should not be a basic ${sound.toUpperCase()} target`);
    }
  }
});
