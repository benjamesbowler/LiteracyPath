import test from "node:test";
import assert from "node:assert/strict";
import {
  soundBeatChoiceSet,
  soundBeatLadder,
  soundBeatMaskedPrompt,
  soundBeatUnitsShareSound,
  soundBeatVisiblePrompt,
  soundBeatStars
} from "../../src/utils/soundBeatTracks.js";
import { AUDIO_QUEST_PATHS } from "../../src/data/generated/audioQuestPaths.generated.js";
import { getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";
import { getPreferredPhonemeAudioPath } from "../../src/data/phonemeAudioBank.js";

test("soundBeatLadder returns 10 levels for every difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    assert.equal(soundBeatLadder(difficulty).length, 10);
  }
});

test("Sound Beat does not repeat words inside a difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const seen = new Set();
    for (const level of soundBeatLadder(difficulty)) {
      for (const item of level.items) {
        const key = item.say;
        assert.ok(!seen.has(key), `${difficulty} repeated ${key}`);
        seen.add(key);
      }
    }
  }
});

test("Sound Beat beat plans are complete and deterministic", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const first = soundBeatLadder(difficulty);
    const second = soundBeatLadder(difficulty);
    assert.deepEqual(first, second);
    for (const level of first) {
      assert.ok(level.items.length >= 1, `${difficulty}/${level.level} has no items`);
      for (const item of level.items) assert.ok(item.beats.length >= 1, `${item.say} has no beats`);
    }
  }
});

test("Sound Beat requires a fresh, ambiguity-safe literacy choice on every beat", () => {
  const answerPositions = new Set();
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of soundBeatLadder(difficulty)) {
      level.items.forEach((item, taskIndex) => {
        item.beats.forEach((beat, beatIndex) => {
          const choiceSet = soundBeatChoiceSet(item, beatIndex, {
            seed: `${level.level}:${taskIndex}`
          });
          assert.equal(choiceSet.choices.length, 4);
          assert.equal(new Set(choiceSet.choices.map(value => String(value).toLowerCase())).size, 4);
          assert.equal(String(choiceSet.choices[choiceSet.answerIndex]).toLowerCase(), String(beat).toLowerCase());
          answerPositions.add(choiceSet.answerIndex);
          if (item.beatUnit === "phoneme") {
            for (let index = 0; index < choiceSet.choices.length; index += 1) {
              if (index === choiceSet.answerIndex) continue;
              assert.equal(soundBeatUnitsShareSound(choiceSet.choices[index], beat), false);
            }
          }
        });
        assert.deepEqual(soundBeatChoiceSet(item, item.beats.length).choices, ["GO"]);
      });
    }
  }
  assert.deepEqual([...answerPositions].sort(), [0, 1, 2, 3]);
});

test("Sound Beat never scores an equivalent taught spelling as wrong", () => {
  for (const group of [["c", "k", "ck"], ["ch", "tch"], ["ee", "ea"], ["w", "wh"]]) {
    for (const left of group) {
      for (const right of group) assert.equal(soundBeatUnitsShareSound(left, right), true);
    }
  }
  for (const [difficulty, levelIndex, word] of [
    ["easy", 3, "cup"],
    ["hard", 3, "tree"],
    ["hard", 3, "green"],
    ["hard", 5, "coat"]
  ]) {
    const item = soundBeatLadder(difficulty)[levelIndex].items.find(candidate => candidate.word === word);
    assert.ok(item, `${difficulty}/${levelIndex} is missing ${word}`);
    item.beats.forEach((beat, beatIndex) => {
      const choiceSet = soundBeatChoiceSet(item, beatIndex, { seed: `${levelIndex}:${soundBeatLadder(difficulty)[levelIndex].items.indexOf(item)}` });
      for (let index = 0; index < choiceSet.choices.length; index += 1) {
        if (index === choiceSet.answerIndex) continue;
        assert.equal(
          soundBeatUnitsShareSound(choiceSet.choices[index], beat),
          false,
          `${word}/${beat} offered equivalent ${choiceSet.choices[index]}`
        );
      }
    });
  }
});

test("Sound Beat never prints an unreached answer unit", () => {
  const phonemeItem = { word: "ship", say: "ship", beats: ["sh", "i", "p"], beatUnit: "phoneme" };
  assert.equal(soundBeatMaskedPrompt(phonemeItem, 0), "•••");
  assert.equal(soundBeatMaskedPrompt(phonemeItem, 1), "sh••");
  assert.equal(soundBeatMaskedPrompt(phonemeItem, 2), "shi•");
  assert.equal(soundBeatMaskedPrompt(phonemeItem, 3), "ship");

  const sentenceItem = { say: "We see stars.", beats: ["We", "see", "stars"], beatUnit: "word" };
  assert.equal(soundBeatMaskedPrompt(sentenceItem, 0), "• • •");
  assert.equal(soundBeatMaskedPrompt(sentenceItem, 1), "We • •");
  assert.equal(soundBeatMaskedPrompt(sentenceItem, 3), "We see stars.");
});

test("Sound Beat masks every unreached unit with the same display shape", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of soundBeatLadder(difficulty)) {
      for (const item of level.items) {
        const prompt = soundBeatMaskedPrompt(item, 0);
        const markers = prompt.replaceAll(" ", "");
        assert.equal(markers, "•".repeat(item.beats.length), `${item.word} leaked unit length`);
      }
    }
  }
});

test("Sound Beat labels sound-off play as supported model matching", () => {
  const item = { word: "ship", say: "ship", beats: ["sh", "i", "p"], beatUnit: "phoneme" };
  assert.equal(soundBeatVisiblePrompt(item, 0, { soundEnabled: true }), "•••");
  assert.equal(soundBeatVisiblePrompt(item, 0, { soundEnabled: false }), "ship");
});

test("every live Sound Beat replay state has an approved recorded cue", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of soundBeatLadder(difficulty)) {
      for (const item of level.items) {
        if (item.beatUnit === "phoneme") {
          for (const beat of item.beats) {
            assert.ok(getPreferredPhonemeAudioPath(beat), `${item.word}/${beat} has no phoneme cue`);
          }
        }
        const replayWords = item.beatUnit === "word" ? item.beats : [item.word];
        for (const word of replayWords) {
          const path = getLedaWordAudioPath(word);
          assert.ok(path && AUDIO_QUEST_PATHS.has(path), `${item.word}/${word} has no word replay`);
        }
      }
    }
  }
});

test("Sound Beat tightens the rhythm-bonus window and enters sentence mode on hard late levels", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const ladder = soundBeatLadder(difficulty);
    for (let index = 1; index < ladder.length; index += 1) {
      assert.ok(ladder[index].hitWindowMs <= ladder[index - 1].hitWindowMs, `${difficulty} window widened`);
      assert.ok(ladder[index].bpm >= ladder[index - 1].bpm, `${difficulty} bpm slowed`);
    }
  }
  for (const level of soundBeatLadder("hard").slice(6)) {
    assert.equal(level.mode, "sentence");
  }
});

test("soundBeatStars follows the shared star rubric", () => {
  assert.equal(soundBeatStars({ correct: 0, total: 8, mistakes: 0 }), 0);
  assert.equal(soundBeatStars({ correct: 8, total: 8, mistakes: 0 }), 3);
  assert.equal(soundBeatStars({ correct: 6, total: 8, mistakes: 4 }), 2);
  assert.equal(soundBeatStars({ correct: 2, total: 8, mistakes: 7 }), 1);
});
