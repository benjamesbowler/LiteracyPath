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
import { DEFERRED_ATOMIC_SOUND_KEYS } from "../../src/data/phonemeAudioBank.js";
import {
  scoreCycleQuest,
  segmentTaughtGraphemes
} from "../../src/components/elQuest/adventureRoundModel.js";

const cycle1 = elSkillsBlockCycles.find(c => c.id === "cycle-1");

test("taught multi-letter graphemes occupy one segment", () => {
  assert.deepEqual(
    segmentTaughtGraphemes("shell", ["sh", "ll"]),
    ["sh", "e", "ll"]
  );
  assert.deepEqual(
    segmentTaughtGraphemes("shell", ["sh"]),
    ["sh", "e", "l", "l"]
  );
});

test("Cycle Quest scores completed first attempts without rewarding eventual retries", () => {
  assert.equal(scoreCycleQuest([true, true, true], 3), 3);
  assert.equal(scoreCycleQuest([true, true, true, true, true, true, true, false, false, false], 10), 2);
  assert.equal(scoreCycleQuest([true, false, false], 3), 1);
  assert.equal(scoreCycleQuest([true, false], 3), 0);
  assert.equal(scoreCycleQuest([true, false, undefined], 3), 0);
  assert.equal(scoreCycleQuest([], 0), 0);
});

test("graphemeAudioPath never returns a blocklisted clip; resolves when unblocked", () => {
  const letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "k", "l", "m", "n", "o", "p", "s", "t", "sh", "ch"];
  for (const g of letters) {
    const path = graphemeAudioPath(g);
    assert.ok(!isKnownBadAudioPath(path), `"${g}" resolved to a blocklisted clip: ${path}`);
    assert.ok(!String(path).startsWith("generated:"));
    // While the whole letter bank is blocked (awaiting the human re-record),
    // "" is the correct answer. The moment the blocklist is emptied after
    // import, every letter must resolve to a real mp3 again.
    if (KNOWN_BAD_AUDIO_PATHS.size === 0 && !DEFERRED_ATOMIC_SOUND_KEYS.includes(g)) {
      assert.ok(path && path.endsWith(".mp3"), `expected an mp3 for "${g}" once unblocked, got "${path}"`);
    }
    if (DEFERRED_ATOMIC_SOUND_KEYS.includes(g)) assert.equal(path, "");
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

test("Cycle 1 practises taught letters before CVC words are possible", () => {
  const rounds = buildStationRounds(cycle1, "build");
  assert.ok(rounds.length > 0);
  assert.ok(rounds.every(round => round.mechanicId === "letterGrid"));
  assert.ok(rounds.every(round => round.cells.every(cell => /^[aAmM]$/u.test(cell.letter))));
});

test("missing CVC rounds offer the first and last letter without printing the answer", () => {
  const cycle2 = elSkillsBlockCycles.find(cycle => cycle.cycleNumber === 2);
  const rounds = buildStationRounds(cycle2, "build");
  assert.ok(rounds.length > 0);
  assert.deepEqual(new Set(rounds.map(round => round.missingPosition)), new Set(["start", "end"]));
  for (const round of rounds) {
    assert.match(round.word, /^[^aeiou][aeiou][^aeiou]$/u);
    assert.equal(round.choices.includes(round.missingGrapheme), true);
    assert.equal(round.graphemes[round.missingIndex], round.missingGrapheme);
    assert.equal(round.display.includes("_"), true);
    assert.equal(round.display.replaceAll(" ", "").includes(round.word), false);
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
  for (const [word, onset] of Object.entries({
    cell: "s", cells: "s", cent: "s", center: "s", cents: "s", circle: "s", city: "s",
    europe: "y", unit: "y",
    knew: "n", know: "n", known: "n",
    once: "w", phrase: "f", whose: "h",
    write: "r", wrong: "r", wrote: "r"
  })) {
    assert.equal(onsetGrapheme(word), onset, `${word} should begin with /${onset}/`);
  }
});

test("shuffleItems keeps the same elements", () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffleItems(input);
  assert.equal(out.length, input.length);
  assert.deepEqual([...out].sort(), [...input].sort());
});
