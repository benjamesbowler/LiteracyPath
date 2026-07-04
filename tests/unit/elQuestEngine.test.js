import test from "node:test";
import assert from "node:assert/strict";
import {
  STATIONS,
  buildStationRounds,
  graphemeAudioPath,
  starsForAccuracy,
  shuffleItems
} from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { isKnownBadAudioPath } from "../../src/data/knownBadWordAudio.js";

const cycle1 = elSkillsBlockCycles.find(c => c.id === "cycle-1");

test("graphemeAudioPath: good letters resolve, blocklisted defective clips never do", () => {
  // Letters with verified-good recordings must resolve to a real mp3.
  for (const g of ["m", "t", "s", "d", "g", "h"]) {
    const path = graphemeAudioPath(g);
    assert.ok(path && path.endsWith(".mp3"), `expected an mp3 path for "${g}", got "${path}"`);
    assert.ok(!path.startsWith("generated:"));
  }
  // Letters whose ONLY sound clips failed the 2026-07-04 ear audit return ""
  // (rounds fall back to real word cues) - and NEVER a blocklisted path.
  for (const g of ["a", "e", "i", "o", "f", "k", "l", "n", "p"]) {
    const path = graphemeAudioPath(g);
    assert.ok(!isKnownBadAudioPath(path), `"${g}" resolved to a blocklisted clip: ${path}`);
  }
});

test("starsForAccuracy applies the 3/2/1/0 thresholds", () => {
  assert.equal(starsForAccuracy(10, 10, 0), 3); // perfect, no wrongs
  assert.equal(starsForAccuracy(10, 10, 1), 2); // all right but had a wrong attempt
  assert.equal(starsForAccuracy(7, 10, 2), 2);  // >= 70%
  assert.equal(starsForAccuracy(4, 10, 3), 1);  // some right
  assert.equal(starsForAccuracy(0, 10, 5), 0);  // none right
  assert.equal(starsForAccuracy(0, 0, 0), 0);   // no questions
});

// Regression guard for the unpassable build-round bug: every Word Build word
// must be a clean 2-5 letter word so the letter boxes always match.
test("Word Build rounds only use clean 2-5 letter words", () => {
  const rounds = buildStationRounds(cycle1, "build");
  assert.ok(Array.isArray(rounds));
  for (const round of rounds) {
    assert.match(round.word, /^[a-z]{2,5}$/, `bad build word: "${round.word}"`);
  }
});

test("every STATION has an id and a title", () => {
  for (const s of STATIONS) {
    assert.ok(s.id && s.title);
  }
});

test("shuffleItems keeps the same elements", () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffleItems(input);
  assert.equal(out.length, input.length);
  assert.deepEqual([...out].sort(), [...input].sort());
});
