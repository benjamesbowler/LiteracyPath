import test from "node:test";
import assert from "node:assert/strict";
import {
  soundBeatLadder,
  soundBeatMercyPolicy,
  soundBeatStars
} from "../../src/utils/soundBeatTracks.js";

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

test("Sound Beat ramps timing and enters sentence mode on hard late levels", () => {
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

test("Sound Beat mercy widens timing, retains the current beat, then guarantees progress", () => {
  assert.deepEqual(soundBeatMercyPolicy(0), {
    windowScale: 1,
    replayFromStart: true,
    advanceWithoutCredit: false
  });
  assert.equal(soundBeatMercyPolicy(2).replayFromStart, false);
  assert.ok(soundBeatMercyPolicy(2).windowScale > 1);
  assert.equal(soundBeatMercyPolicy(4).advanceWithoutCredit, true);
});


test("sound beats exclude multi-phoneme x and resolve every played phoneme", async () => {
  const { getPreferredPhonemeAudioPath } = await import("../../src/data/phonemeAudioBank.js");
  const { existsSync } = await import("node:fs");
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of soundBeatLadder(difficulty)) {
      for (const item of level.items.filter(item => item.unit === "sounds")) {
        assert.ok(!item.word.includes("x"), `${item.word} cannot teach x as one sound`);
        for (const beat of item.beats) {
          const path = getPreferredPhonemeAudioPath(beat);
          assert.ok(path && existsSync(`public${path}`), `${item.word}/${beat} has no shipped cue`);
        }
      }
    }
  }
});


test("full rhythm performances use varied reviewed phrases for several minutes at normal tempo", async () => {
  const { nextPhraseBeat } = await import("../../src/utils/audio/rhythmClock.js");
  for (const difficulty of ["easy", "medium", "hard"]) {
    let now = 0.1, origin = now, bpm;
    for (const level of soundBeatLadder(difficulty)) {
      if (!bpm || now - origin >= level.minPlaySeconds) { origin = now; bpm = level.bpm; }
      for (const item of level.items) {
        now = nextPhraseBeat(now, origin, 60 / bpm, 1.05) + item.beats.length * 60 / bpm;
      }
    }
    assert.ok(now - 0.1 >= 120, `${difficulty}: ${now - 0.1}s at perfect beat centers`);
  }
});

test("every phrase resolves to recorded word cues, including sentence beats", async () => {
  const { hasWordAudio } = await import("../../src/utils/questAudio.js");
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const item of soundBeatLadder(difficulty).flatMap(level => level.items)) {
      for (const word of item.unit === "words" ? item.beats : [item.word]) assert.ok(hasWordAudio(word), word);
    }
  }
});


test("sentence blends use a full recording or ordered cancellable word recordings", async () => {
  const { speakSoundBeatSentence } = await import("../../src/utils/audio/soundBeatSpeech.js");
  const item = {say: "The cat sat.", beats: ["The", "cat", "sat"]};
  const heard = [];
  const dependencies = {hasRecordedSpeech: () => true, speak: async text => heard.push(text), speakWord: async word => heard.push(word)};
  await speakSoundBeatSentence(item, {}, dependencies);
  assert.deepEqual(heard, [item.say]);
  heard.length = 0; dependencies.hasRecordedSpeech = () => false;
  await speakSoundBeatSentence(item, {}, dependencies);
  assert.deepEqual(heard, item.beats);
  heard.length = 0;
  const controller = new AbortController();
  dependencies.speakWord = async word => { heard.push(word); controller.abort(); };
  await speakSoundBeatSentence(item, {signal: controller.signal}, dependencies);
  assert.deepEqual(heard, ["The"]);
});
