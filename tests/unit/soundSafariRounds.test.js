import test from "node:test";
import assert from "node:assert/strict";
import { soundSafariLayout } from "../../src/utils/soundSafariLayout.js";
import {
  selectSafariCapture,
  soundSafariAudioCoverage,
  soundSafariLadder,
  soundSafariPresentedStars,
  soundSafariStars
} from "../../src/utils/soundSafariRounds.js";

test("Safari word cue and moving letter plaques remain separate across child viewports", () => {
  for (const [w, h] of [[1024, 706], [390, 782], [568, 258], [844, 328]]) {
    for (let count = 4; count <= 8; count += 1) {
      const layout = soundSafariLayout(w, h, count);
      assert.ok(layout.guide.h >= 56);
      const boxes = layout.positions.map(p => ({
        left: p.x - p.plateWidth / 2 - p.travelX,
        right: p.x + p.plateWidth / 2 + p.travelX,
        top: p.y + p.radius * 0.72 - 3 - p.travelY,
        bottom: p.y + p.radius * 0.8 - 3 + 56 + p.travelY,
      }));
      for (const [i, box] of boxes.entries()) {
        assert.ok(layout.positions[i].plateWidth >= 56);
        assert.ok(box.left >= 0 && box.right <= w);
        assert.ok(box.top >= layout.guide.y + layout.guide.h);
        assert.ok(box.bottom <= h - (h < 360 ? 52 : 106), `plaque remains above feedback at ${w}x${h}/${count}`);
        for (const other of boxes.slice(i + 1)) assert.ok(box.right <= other.left || box.left >= other.right || box.bottom <= other.top || box.top >= other.bottom, 'movement envelopes cannot overlap letter plaques');
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

test("ambiguous overlapping Safari hits cannot turn a correct aim into a false miss", () => {
  const correct = { critter: { label: "sh", r: 42, hitRadius: 80 }, distance: 50, inLabel: false };
  const marginallyCloserWrong = { critter: { label: "ch", r: 42, hitRadius: 80 }, distance: 43, inLabel: false };
  assert.equal(selectSafariCapture([marginallyCloserWrong, correct], "sh"), correct);

  const intentionalWrong = { ...marginallyCloserWrong, distance: 8 };
  assert.equal(selectSafariCapture([intentionalWrong, correct], "sh"), intentionalWrong);
  const exactCorrectLabel = { ...correct, inLabel: true };
  assert.equal(selectSafariCapture([exactCorrectLabel, intentionalWrong], "sh"), exactCorrectLabel);
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

test("all authored Safari units resolve to shipped pronunciation cues", async () => {
  const { existsSync } = await import("node:fs");
  const { getPreferredPhonemeAudioPath } = await import("../../src/data/phonemeAudioBank.js");
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of soundSafariLadder(difficulty)) {
      for (const item of level.words) {
        assert.equal(item.soundKeys.length, item.graphemes.length);
        for (const key of item.soundKeys) {
          const path = getPreferredPhonemeAudioPath(key);
          assert.ok(path, `${item.word}: missing cue for ${key}`);
          assert.ok(existsSync(`public${path}`), `${item.word}: missing shipped ${path}`);
        }
      }
    }
  }
});

test("contextual spellings preserve the word's sounds and doubled consonants", () => {
  const words = Object.fromEntries(["easy", "medium", "hard"].flatMap(difficulty =>
    soundSafariLadder(difficulty).flatMap(level => level.words.map(item => [item.word, item]))
  ));
  for (const [word, expected] of Object.entries({
    thread: ["th", "r", "ea_e", "d"],
    meadow: ["m", "ea_e", "d", "ow"],
    dream: ["d", "r", "ea", "m"],
    owl: ["ow_ou", "l"],
    glow: ["g", "l", "ow"],
    badger: ["b", "a", "j", "er"],
    acorn: ["a_e", "k", "or", "n"],
    butterfly: ["b", "u", "t", "er", "f", "l", "y_ie"],
    shining: ["sh", "i_e", "n", "i", "ng"],
    rabbit: ["r", "a", "b", "i", "t"],
    goldfish: ["g", "o_e", "l", "d", "f", "i", "sh"]
  })) assert.deepEqual(words[word].soundKeys, expected, word);
  assert.deepEqual(words.rabbit.graphemes, ["r", "a", "bb", "i", "t"]);
  assert.deepEqual(words.glimmer.graphemes, ["g", "l", "i", "mm", "er"]);
  assert.equal(words.sock.graphemes.length, 3);
});

test("every Safari catch offers distinct sounds, including spelling aliases", async () => {
  const { safariDistractors, safariSoundKey } = await import("../../src/utils/soundSafariRounds.js");
  const { getPreferredPhonemeAudioPath } = await import("../../src/data/phonemeAudioBank.js");
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of soundSafariLadder(difficulty)) {
      for (const item of level.words) {
        item.graphemes.forEach((label, index) => {
          const choices = safariDistractors(item, index);
          assert.ok(choices.length >= 7, `${item.word}/${label}: insufficient game targets`);
          assert.ok(!choices.includes(label));
          const neededCue = getPreferredPhonemeAudioPath(safariSoundKey(item, index));
          for (const choice of choices) {
            const keys = item.graphemes.flatMap((spelling, offset) => spelling === choice ? [item.soundKeys[offset]] : []);
            if (item.decoys.includes(choice)) keys.push(choice);
            for (const key of keys) assert.notEqual(getPreferredPhonemeAudioPath(key), neededCue, `${item.word}: ${choice} sounds identical to ${label}`);
          }
        });
      }
    }
  }
  const ambiguous = { graphemes: ["a_e", "ai", "c", "ck"], soundKeys: ["a_e", "ai", "k", "k"], decoys: ["ai", "b", "sh"] };
  assert.ok(!safariDistractors(ambiguous, 0).includes("ai"));
  assert.ok(!safariDistractors(ambiguous, 2).includes("ck"));
});
