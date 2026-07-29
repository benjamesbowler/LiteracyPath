import test from "node:test";
import assert from "node:assert/strict";
import {
  STATIONS,
  buildStationRounds,
  graphemeAudioPath,
  onsetGrapheme,
  starsForAccuracy,
  shuffleItems
} from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { isKnownBadAudioPath, KNOWN_BAD_AUDIO_PATHS } from "../../src/data/knownBadWordAudio.js";

const cycle1 = elSkillsBlockCycles.find(c => c.id === "cycle-1");

test("graphemeAudioPath never returns a blocklisted clip; resolves when unblocked", () => {
  const letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "k", "l", "m", "n", "o", "p", "s", "t", "sh", "ch"];
  for (const g of letters) {
    const path = graphemeAudioPath(g);
    assert.ok(!isKnownBadAudioPath(path), `"${g}" resolved to a blocklisted clip: ${path}`);
    assert.ok(!String(path).startsWith("generated:"));
    // While the whole letter bank is blocked (awaiting the human re-record),
    // "" is the correct answer. The moment the blocklist is emptied after
    // import, every letter must resolve to a real mp3 again.
    if (KNOWN_BAD_AUDIO_PATHS.size === 0) {
      assert.ok(path && path.endsWith(".mp3"), `expected an mp3 for "${g}" once unblocked, got "${path}"`);
    }
  }
});

test("graphemeAudioPath prefers human-approved Leda pattern clips", () => {
  assert.equal(
    graphemeAudioPath("br"),
    "/audio/production/en-US/pattern/br-as-in-brush-992accb225.mp3"
  );
  assert.equal(
    graphemeAudioPath("wh"),
    "/audio/production/en-US/pattern/wh-as-in-whale-bd42fc5b7d.mp3"
  );
  assert.equal(
    graphemeAudioPath("bl"),
    "/audio/production/en-US/pattern/bl-as-in-blue-878a108fa9.mp3"
  );
  assert.equal(
    graphemeAudioPath("gr"),
    "/audio/production/en-US/pattern/gr-as-in-grass-79b0ca790e.mp3"
  );
  assert.equal(
    graphemeAudioPath("st"),
    "/audio/production/en-US/pattern/st-as-in-stop-ff57ce59ae.mp3"
  );
  assert.equal(
    graphemeAudioPath("scr"),
    "/audio/production/en-US/pattern/scr-as-in-scrap-22b62acf29.mp3"
  );
  assert.equal(
    graphemeAudioPath("sw"),
    "/audio/production/en-US/pattern/sw-as-in-swing-7880c0db2e.mp3"
  );
  assert.notEqual(
    graphemeAudioPath("ew"),
    "/audio/production/en-US/pattern/ew-as-in-few-a41a73446f.mp3",
    "the /juː/ few pronunciation must not replace the /uː/ grew pronunciation"
  );
  assert.notEqual(
    graphemeAudioPath("or"),
    "/audio/production/en-US/pattern/or-as-in-word-f1c092d4d8.mp3",
    "the /ɝ/ word pronunciation must not replace the /ɔr/ fork pronunciation"
  );
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

// Sound rounds must cue the first SOUND, not the first letters: "one" is /w/,
// "who"/"whole" are /h/, "use" is /y/. Without these overrides "one" was a
// correct O word and a W distractor, and "whole" a correct wh word.
test("onsetGrapheme applies phonetic onsets before spelling rules", () => {
  assert.equal(onsetGrapheme("one"), "w");
  assert.equal(onsetGrapheme("whole"), "h");
  assert.equal(onsetGrapheme("use"), "y");
  assert.equal(onsetGrapheme("who"), "h");
  assert.equal(onsetGrapheme("wheel"), "wh");
  assert.equal(onsetGrapheme("ship"), "sh");
  assert.equal(onsetGrapheme("cat"), "c");
  assert.equal(onsetGrapheme("octopus"), "o");
});

test("shuffleItems keeps the same elements", () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffleItems(input);
  assert.equal(out.length, input.length);
  assert.deepEqual([...out].sort(), [...input].sort());
});
