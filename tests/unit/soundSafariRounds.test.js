import test from "node:test";
import assert from "node:assert/strict";
import { KNOWN_BAD_AUDIO_PATHS } from "../../src/data/knownBadWordAudio.js";
import { getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";
import {
  soundSafariAudioCoverage,
  soundSafariLadder,
  soundSafariPresentedStars,
  soundSafariStars
} from "../../src/utils/soundSafariRounds.js";

const EXPECTED_WORDS = {
  easy: "cat sun mop big hat log pen cup dog jam red wet run bug pig web hen fox zip van top net mud duck bed ten cap bus pot leg".split(" "),
  medium: "frog plant crisp drum stone flame brush green splash track clock snail train clap brain sleep float smile chair thread crash string spring bright twist storm shark three slide prize".split(" "),
  hard: "sunlight rainbow moon star meadow forest river rabbit silver night dark owl glow badger thunder glimmer squirrel acorn mist fern oak butterfly moss woodland dream mushroom glowing stream shining sunset".split(" ")
};

test("every authored word retains its exact level and position", () => {
  for (const [difficulty, expected] of Object.entries(EXPECTED_WORDS)) {
    assert.deepEqual(soundSafariLadder(difficulty).flatMap(level => level.words.map(item => item.word)), expected);
  }
});

test("rounds expose contextual units rather than spelling-derived sound guesses", () => {
  const all = Object.fromEntries(Object.keys(EXPECTED_WORDS).flatMap(difficulty =>
    soundSafariLadder(difficulty).flatMap(level => level.words.map(item => [item.word, item]))));
  for (const [word, expected] of Object.entries({
    thread: ["th", "r", "ea_e", "d"],
    meadow: ["m", "ea_e", "d", "ow"],
    owl: ["ow_ou", "l"],
    acorn: ["a_e", "c", "or", "n"],
    shining: ["sh", "i_e", "n", "short_i", "ng"],
    badger: ["b", "short_a", "g_j", "er"],
    squirrel: ["s", "qu", "er", "schwa", "l"]
  })) {
    assert.ok(Array.isArray(all[word].units), `${word} needs explicit units`);
    assert.deepEqual(all[word].units.map(unit => unit.soundKey), expected, word);
    assert.deepEqual(all[word].graphemes, all[word].units.map(unit => unit.grapheme));
  }
});

test("quarantined word audio is unavailable without filtering or shifting the bank", () => {
  const audioPath = getLedaWordAudioPath("cat");
  KNOWN_BAD_AUDIO_PATHS.add(audioPath);
  try {
    const words = soundSafariLadder("easy").flatMap(level => level.words);
    assert.deepEqual(words.map(item => item.word), EXPECTED_WORDS.easy);
    assert.equal(words[0].wordAudio.path, "");
    assert.equal(words[0].wordAudio.available, false);
    assert.equal(words[0].wordAudio.status, "unavailable");
    assert.deepEqual(soundSafariAudioCoverage().easy.missing, ["cat"]);
  } finally {
    KNOWN_BAD_AUDIO_PATHS.delete(audioPath);
  }
});

test("a missing approved unit recording stays explicit while the word remains playable for supported integration", () => {
  const forest = soundSafariLadder("hard")[1].words[2];
  assert.equal(forest.word, "forest");
  assert.ok(Array.isArray(forest.units));
  const schwa = forest.units.find(unit => unit.soundKey === "schwa");
  assert.deepEqual(schwa.audio, { path: "", available: false, status: "unavailable" });
  assert.equal(forest.wordAudio.available, true);
});

test("round word coverage selects the same exact recordings as game playback", () => {
  const all = Object.keys(EXPECTED_WORDS).flatMap(difficulty => soundSafariLadder(difficulty).flatMap(level => level.words));
  for (const item of all) {
    assert.equal(item.wordAudio?.path, getLedaWordAudioPath(item.word), item.word);
  }
  assert.equal(all.find(item => item.word === "cup").wordAudio.path, "/audio/production/en-US/isolated_word/cup-9da8aac3a3.mp3");
  assert.equal(all.find(item => item.word === "mist").wordAudio.path, "/audio/production/en-US/isolated_word/mist-8d7b88a5f7.mp3");
});

test("all round distractors carry distinct contextual sounds and available recordings", async () => {
  const { soundSafariSoundsEquivalent } = await import("../../src/data/soundSafariPronunciations.js");
  for (const difficulty of Object.keys(EXPECTED_WORDS)) {
    for (const level of soundSafariLadder(difficulty)) {
      assert.equal(Object.hasOwn(level, "minPlaySeconds"), false);
      for (const item of level.words) {
        assert.ok(item.decoyUnits.length >= 4 && item.decoyUnits.length <= 7);
        assert.deepEqual(item.decoys, item.decoyUnits.map(unit => unit.grapheme));
        for (const [index, decoy] of item.decoyUnits.entries()) {
          assert.equal(decoy.audio.available, true);
          for (const other of [...item.units, ...item.decoyUnits.slice(0, index)]) {
            assert.notEqual(decoy.grapheme, other.grapheme);
            assert.equal(soundSafariSoundsEquivalent(decoy, other), false, `${item.word}: ${decoy.soundKey}/${other.soundKey}`);
          }
        }
      }
    }
  }
});

test("soundSafariLadder returns 10 levels for every difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    assert.equal(soundSafariLadder(difficulty).length, 10);
  }
});

test("Sound Safari uses finite unique words inside each difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const seen = new Set();
    for (const level of soundSafariLadder(difficulty)) {
      assert.equal(level.words.length, 3);
      for (const item of level.words) {
        assert.ok(!seen.has(item.word), `${difficulty} repeated ${item.word}`);
        seen.add(item.word);
      }
    }
    assert.equal(seen.size, 30);
  }
});

test("Sound Safari words are segmented and decoys never duplicate needed sounds", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of soundSafariLadder(difficulty)) {
      for (const item of level.words) {
        assert.ok(item.graphemes.length >= 2, `${item.word} has too few sounds`);
        assert.ok(item.decoys.length >= 4, `${item.word} has too few decoys`);
        for (const decoy of item.decoys) {
          assert.ok(!item.graphemes.includes(decoy), `${item.word} decoy ${decoy} is a needed grapheme`);
        }
      }
    }
  }
});

test("Sound Safari worlds map to the three arcade themes", () => {
  assert.equal(soundSafariLadder("easy")[0].world, "meadow");
  assert.equal(soundSafariLadder("medium")[0].world, "dino");
  assert.equal(soundSafariLadder("hard")[0].world, "moonwood");
});

test("every Sound Safari task has recorded gold-voice word audio", () => {
  const coverage = soundSafariAudioCoverage();
  for (const [difficulty, result] of Object.entries(coverage)) {
    assert.equal(result.total, 30, `${difficulty} bank must keep 30 words`);
    assert.deepEqual(result.missing, [], `${difficulty} has silent words`);
    assert.equal(result.recorded.length, 30);
  }
});

test("soundSafariStars follows the shared star rubric", () => {
  assert.equal(soundSafariStars({ correct: 0, total: 8, mistakes: 0 }), 0);
  assert.equal(soundSafariStars({ correct: 8, total: 8, mistakes: 0 }), 3);
  assert.equal(soundSafariStars({ correct: 6, total: 8, mistakes: 4 }), 2);
  assert.equal(soundSafariStars({ correct: 2, total: 8, mistakes: 7 }), 1);
});

test("a flawless resumed Safari run scores only the units presented this session", () => {
  // A child resuming halfway may see 18 units even though the full ladder has
  // many more. Those unseen earlier units must never enter this run's rubric.
  assert.equal(soundSafariPresentedStars({ correct: 18, presentedUnits: 18, mistakes: 0 }), 3);
  assert.equal(soundSafariPresentedStars({ correct: 0, presentedUnits: 0, mistakes: 0 }), 0);
});
